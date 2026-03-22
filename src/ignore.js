/**
 * Ignore Pattern Handler Module
 * 
 * Handles loading and matching of ignore patterns from .gitignore, .envcheckignore,
 * and default patterns. Supports glob pattern syntax and negation patterns.
 * 
 * Requirements: 1.7.1-1.7.6
 */

import fs from 'fs';

/**
 * Load ignore patterns from .gitignore and .envcheckignore files
 * 
 * @param {string} basePath - Base directory path to search for ignore files
 * @returns {string[]} Array of ignore patterns
 * 
 * Preconditions:
 * - basePath is a valid directory path
 * 
 * Postconditions:
 * - Returns array of patterns from .gitignore, .envcheckignore, and defaults
 * - Returns at least default patterns if no ignore files exist
 * 
 * Requirements: 1.7.1, 1.7.2, 1.7.3
 */
export function loadIgnorePatterns(basePath) {
  const patterns = [];
  
  // Add default patterns first
  patterns.push(...getDefaultIgnores());
  
  // Load .gitignore patterns if exists
  const gitignorePath = `${basePath}/.gitignore`;
  const gitignorePatterns = parseGitignore(gitignorePath);
  patterns.push(...gitignorePatterns);
  
  // Load .envcheckignore patterns if exists
  const envcheckignorePath = `${basePath}/.envcheckignore`;
  const envcheckignorePatterns = parseEnvcheckignore(envcheckignorePath);
  patterns.push(...envcheckignorePatterns);
  
  return patterns;
}

/**
 * Check if a file path should be ignored based on patterns
 * 
 * @param {string} filePath - File path to check (relative or absolute)
 * @param {string[]} patterns - Array of glob patterns
 * @returns {boolean} True if file should be ignored, false otherwise
 * 
 * Preconditions:
 * - filePath is a non-empty string
 * - patterns is a valid array (may be empty)
 * 
 * Postconditions:
 * - Returns true if filePath matches any pattern
 * - Returns false if no patterns match
 * - Handles negation patterns correctly
 * 
 * Requirements: 1.7.5, 1.7.6
 */
export function shouldIgnore(filePath, patterns) {
  if (!patterns || patterns.length === 0) {
    return false;
  }
  
  let ignored = false;
  
  // Process patterns in order - later patterns can override earlier ones
  for (const pattern of patterns) {
    if (isNegationPattern(pattern)) {
      // Negation pattern - if it matches, un-ignore the file
      const actualPattern = removeNegationPrefix(pattern);
      if (matchGlob(filePath, actualPattern)) {
        ignored = false;
      }
    } else {
      // Regular pattern - if it matches, ignore the file
      if (matchGlob(filePath, pattern)) {
        ignored = true;
      }
    }
  }
  
  return ignored;
}

/**
 * Parse a .gitignore file and extract patterns
 * 
 * @param {string} filePath - Path to .gitignore file
 * @returns {string[]} Array of ignore patterns
 * 
 * Preconditions:
 * - filePath points to a readable file
 * 
 * Postconditions:
 * - Returns array of non-empty, non-comment lines
 * - Trims whitespace from patterns
 * - Returns empty array if file doesn't exist or is unreadable
 * 
 * Requirements: 1.7.1
 */
export function parseGitignore(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && !line.startsWith('#'));
  } catch (error) {
    // Return empty array if file doesn't exist or is unreadable
    return [];
  }
}

/**
 * Parse a .envcheckignore file and extract patterns
 * 
 * @param {string} filePath - Path to .envcheckignore file
 * @returns {string[]} Array of ignore patterns
 * 
 * Preconditions:
 * - filePath points to a readable file
 * 
 * Postconditions:
 * - Returns array of non-empty, non-comment lines
 * - Trims whitespace from patterns
 * - Returns empty array if file doesn't exist or is unreadable
 * 
 * Requirements: 1.7.2
 */
export function parseEnvcheckignore(filePath) {
  // Same implementation as parseGitignore - both use same format
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && !line.startsWith('#'));
  } catch (error) {
    // Return empty array if file doesn't exist or is unreadable
    return [];
  }
}

/**
 * Get default ignore patterns
 * 
 * @returns {string[]} Array of default ignore patterns
 * 
 * Postconditions:
 * - Returns array containing at least: node_modules, .git, dist, build
 * 
 * Requirements: 1.7.3
 */
export function getDefaultIgnores() {
  return [
    'node_modules/**',
    'node_modules',
    '.git/**',
    '.git',
    'dist/**',
    'dist',
    'build/**',
    'build',
    'coverage/**',
    '.nyc_output/**',
    '**/*.min.js',
    '**/*.bundle.js',
    '**/vendor/**',
    '**/tmp/**',
    '**/temp/**'
  ];
}

/**
 * Match a file path against a glob pattern
 * 
 * @param {string} filePath - File path to match
 * @param {string} pattern - Glob pattern (supports *, **, ?, [])
 * @returns {boolean} True if path matches pattern
 * 
 * Preconditions:
 * - filePath is a non-empty string
 * - pattern is a valid glob pattern
 * 
 * Postconditions:
 * - Returns true if filePath matches the glob pattern
 * - Supports * (any characters except /), ** (any characters including /), ? (single char), [] (char class)
 * 
 * Requirements: 1.7.5
 */
export function matchGlob(filePath, pattern) {
  // Normalize paths to use forward slashes
  const normalizedPath = filePath.replace(/\\/g, '/');
  let normalizedPattern = pattern.replace(/\\/g, '/');
  
  // If pattern ends with /**, also match the directory itself
  // e.g., node_modules/** should match both "node_modules" and "node_modules/anything"
  if (normalizedPattern.endsWith('/**')) {
    const dirPattern = normalizedPattern.slice(0, -3); // Remove /**
    if (matchGlobInternal(normalizedPath, dirPattern)) {
      return true;
    }
  }
  
  return matchGlobInternal(normalizedPath, normalizedPattern);
}

/**
 * Validate a glob pattern for correctness
 * 
 * @param {string} pattern - Glob pattern to validate
 * @returns {boolean} True if valid
 * @throws {Error} If pattern is invalid
 */
export function validateGlobPattern(pattern) {
  if (typeof pattern !== 'string' || pattern.trim() === '') {
    throw new Error('Glob pattern cannot be empty');
  }

  let escaped = false;
  let bracketDepth = 0;

  for (const char of pattern) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '[') {
      bracketDepth += 1;
      continue;
    }

    if (char === ']') {
      if (bracketDepth === 0) {
        throw new Error(`Invalid glob pattern: "${pattern}"`);
      }
      bracketDepth -= 1;
    }
  }

  if (escaped || bracketDepth !== 0) {
    throw new Error(`Invalid glob pattern: "${pattern}"`);
  }

  return true;
}

/**
 * Internal glob matching implementation
 * @private
 */
function matchGlobInternal(filePath, pattern) {
  // Convert glob pattern to regex
  let regexPattern = pattern
    // Escape special regex characters except glob wildcards
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // Replace ** with a placeholder to handle it separately
    .replace(/\*\*/g, '___DOUBLESTAR___')
    // Replace * with regex for any characters except /
    .replace(/\*/g, '[^/]*')
    // Replace ? with regex for single character
    .replace(/\?/g, '[^/]')
    // Replace ** placeholder with regex for any characters including /
    // Use (.*\/)? to make the directory part optional for patterns like **/*.js
    .replace(/___DOUBLESTAR___\//g, '(.*/)?')
    .replace(/___DOUBLESTAR___/g, '.*');
  
  // Add anchors to match entire path
  regexPattern = `^${regexPattern}$`;
  
  const regex = new RegExp(regexPattern);
  return regex.test(filePath);
}

/**
 * Check if a pattern is a negation pattern
 * 
 * @param {string} pattern - Pattern to check
 * @returns {boolean} True if pattern starts with !
 * 
 * Requirements: 1.7.6
 */
export function isNegationPattern(pattern) {
  return pattern.startsWith('!');
}

/**
 * Remove negation prefix from pattern
 * 
 * @param {string} pattern - Negation pattern (e.g., "!*.test.js")
 * @returns {string} Pattern without negation prefix (e.g., "*.test.js")
 * 
 * Preconditions:
 * - pattern starts with !
 * 
 * Requirements: 1.7.6
 */
export function removeNegationPrefix(pattern) {
  return pattern.startsWith('!') ? pattern.slice(1) : pattern;
}
