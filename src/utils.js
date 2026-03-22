/**
 * Shared utility functions for envcheck-cli
 * @module utils
 */

import path from 'path';

/**
 * Normalize a file path to use forward slashes and remove redundant separators
 * @param {string} filePath - The file path to normalize
 * @returns {string} The normalized file path
 */
export function normalizePath(filePath) {
  if (!filePath || filePath === '') {
    return '';
  }
  
  // Use path.normalize to handle platform-specific separators and redundant separators
  // Then convert all backslashes to forward slashes for consistency
  return path.normalize(filePath).replace(/\\/g, '/');
}

/**
 * Convert an absolute path to a relative path from the base directory
 * @param {string} absolutePath - The absolute path to convert
 * @param {string} basePath - The base directory path
 * @returns {string} The relative path
 */
export function toRelativePath(absolutePath, basePath) {
  if (!absolutePath || !basePath) {
    return absolutePath || '';
  }
  
  // If paths are the same, return '.'
  if (path.resolve(absolutePath) === path.resolve(basePath)) {
    return '.';
  }
  
  // Use path.relative to compute relative path, then normalize to forward slashes
  const relativePath = path.relative(basePath, absolutePath);
  return relativePath.replace(/\\/g, '/');
}

/**
 * Validate if a string is a valid environment variable name
 * Must match pattern: ^[A-Z_][A-Z0-9_]*$
 * @param {string} varName - The variable name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidEnvVarName(varName) {
  if (!varName || typeof varName !== 'string') {
    return false;
  }
  
  const pattern = /^[A-Z_][A-Z0-9_]*$/;
  return pattern.test(varName);
}
