/**
 * Ruby Scanner
 * Detects environment variable references in Ruby files
 * Supports: ENV['VAR'], ENV.fetch('VAR')
 */

/**
 * Regex patterns for detecting environment variable references
 * Pattern 1: ENV['VAR_NAME'] or ENV["VAR_NAME"] (bracket notation)
 * Pattern 2: ENV.fetch('VAR_NAME') or ENV.fetch("VAR_NAME") (fetch method)
 */
const PATTERNS = [
  // Bracket notation: ENV['VAR_NAME'] or ENV["VAR_NAME"]
  /ENV\[['"]([A-Z_][A-Z0-9_]*)['"]]/g,
  
  // Fetch method: ENV.fetch('VAR_NAME') or ENV.fetch("VAR_NAME")
  // Matches with or without default values: ENV.fetch('VAR', 'default')
  /ENV\.fetch\(['"]([A-Z_][A-Z0-9_]*)['"](?:,.*?)?\)/g,
];

/**
 * Supported file extensions for Ruby
 */
const SUPPORTED_EXTENSIONS = ['.rb'];

/**
 * Scan file content for environment variable references
 * @param {string} content - File content to scan
 * @param {string} filePath - Path to the file being scanned
 * @returns {Array<{varName: string, filePath: string, lineNumber: number, pattern: string}>}
 */
export function scan(content, filePath) {
  const references = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    references.push(...scanLine(lines[i], filePath, i + 1));
  }

  return references;
}

export function scanLine(line, filePath, lineNumber) {
  const references = [];

  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(line)) !== null) {
      const varName = match[1];

      if (varName && isValidEnvVarName(varName)) {
        references.push({
          varName,
          filePath,
          lineNumber,
          pattern: match[0],
        });
      }
    }
  }

  return references;
}

/**
 * Validate environment variable name
 * Must start with letter or underscore, contain only uppercase letters, digits, and underscores
 * @param {string} varName - Variable name to validate
 * @returns {boolean}
 */
function isValidEnvVarName(varName) {
  return /^[A-Z_][A-Z0-9_]*$/.test(varName);
}

/**
 * Get supported file extensions
 * @returns {string[]}
 */
export function getSupportedExtensions() {
  return SUPPORTED_EXTENSIONS;
}

/**
 * Get regex patterns used for scanning
 * @returns {RegExp[]}
 */
export function getPatterns() {
  return PATTERNS;
}
