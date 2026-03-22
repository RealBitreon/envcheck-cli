import { readFile } from 'fs/promises';

/**
 * Parses a .env.example file and extracts environment variable definitions.
 * 
 * @param {string} filePath - Path to the .env.example file
 * @returns {Promise<Array<{varName: string, hasComment: boolean, comment: string|null, lineNumber: number}>>}
 * @throws {Error} If file cannot be read (not found, permission denied, etc.)
 */
export async function parseEnvFile(filePath) {
  let content;
  
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Environment file not found: ${filePath}`);
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      throw new Error(`Permission denied reading file: ${filePath}`);
    } else if (error.code === 'EISDIR') {
      throw new Error(`Path is a directory, not a file: ${filePath}`);
    } else {
      throw new Error(`Error reading file ${filePath}: ${error.message}`);
    }
  }
  
  // Handle both Unix (\n) and Windows (\r\n) line endings
  const lines = content.split(/\r?\n/);
  const definitions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Skip empty lines and comment-only lines
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    // Parse variable definition line
    const definition = parseEnvLine(line, lineNumber);
    if (definition) {
      definitions.push(definition);
    }
  }

  return definitions;
}

/**
 * Parses a single line from a .env file.
 * 
 * @param {string} line - The line to parse
 * @param {number} lineNumber - The line number (1-indexed)
 * @returns {{varName: string, hasComment: boolean, comment: string|null, lineNumber: number}|null}
 */
export function parseEnvLine(line, lineNumber) {
  // Match pattern: VAR_NAME=value # optional comment
  // Variable names must start with letter or underscore, followed by letters, digits, or underscores
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);

  if (!match) {
    // Malformed line - skip gracefully
    return null;
  }

  const varName = match[1];
  const remainder = match[2];

  // Extract inline comment if present
  const comment = extractComment(remainder);

  return {
    varName,
    hasComment: comment !== null,
    comment,
    lineNumber
  };
}

/**
 * Extracts an inline comment from the value portion of an env line.
 * 
 * @param {string} value - The value portion after the = sign
 * @returns {string|null} - The comment text (without # prefix) or null if no comment
 */
export function extractComment(value) {
  // Find the first # that indicates a comment
  // Note: This is a simple implementation that doesn't handle # inside quoted strings
  const commentIndex = value.indexOf('#');

  if (commentIndex === -1) {
    return null;
  }

  // Extract and trim the comment text
  const commentText = value.substring(commentIndex + 1).trim();

  return commentText || null;
}

/**
 * Validates if a line is a valid env variable definition.
 * 
 * @param {string} line - The line to validate
 * @returns {boolean}
 */
export function isValidEnvLine(line) {
  const trimmed = line.trim();

  // Empty lines and comments are not valid env lines
  if (trimmed === '' || trimmed.startsWith('#')) {
    return false;
  }

  // Check if it matches the VAR_NAME=value pattern
  return /^[A-Z_][A-Z0-9_]*=/.test(trimmed);
}
