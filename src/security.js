/**
 * Security Utilities Module
 * 
 * Provides security functions for:
 * - Path sanitization and validation
 * - Input validation and sanitization
 * - Pattern validation
 * - Resource limits
 * - Safe file operations
 */

import path from 'path';
import { isValidEnvVarName } from './utils.js';

/**
 * Maximum file size to process (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum number of files to scan
 */
export const MAX_FILES_TO_SCAN = 100000;

/**
 * Maximum directory depth
 */
export const MAX_DIRECTORY_DEPTH = 100;

/**
 * Maximum pattern length
 */
export const MAX_PATTERN_LENGTH = 1000;

/**
 * Maximum path length
 */
export const MAX_PATH_LENGTH = 4096;

/**
 * Sanitize a file path to prevent directory traversal attacks
 * 
 * @param {string} filePath - Path to sanitize
 * @param {string} basePath - Base directory path (optional)
 * @returns {string} Sanitized path
 * @throws {Error} If path is invalid or attempts traversal
 */
export function sanitizePath(filePath, basePath = process.cwd()) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }

  // Check for null bytes
  if (filePath.includes('\x00')) {
    throw new Error('Path contains null bytes');
  }

  // Check path length
  if (filePath.length > MAX_PATH_LENGTH) {
    throw new Error(`Path too long (max ${MAX_PATH_LENGTH} characters)`);
  }

  // Resolve to absolute path
  const resolvedPath = path.resolve(basePath, filePath);
  const resolvedBase = path.resolve(basePath);

  // Ensure path is within base directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Path traversal detected');
  }

  return resolvedPath;
}

/**
 * Validate and sanitize a glob pattern
 * 
 * @param {string} pattern - Glob pattern to validate
 * @returns {string} Sanitized pattern
 * @throws {Error} If pattern is invalid or malicious
 */
export function sanitizePattern(pattern) {
  if (!pattern || typeof pattern !== 'string') {
    throw new Error('Invalid pattern');
  }

  // Check pattern length
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new Error(`Pattern too long (max ${MAX_PATTERN_LENGTH} characters)`);
  }

  // Check for null bytes
  if (pattern.includes('\x00')) {
    throw new Error('Pattern contains null bytes');
  }

  // Check for shell metacharacters that could cause command injection
  const dangerousChars = /[;&|`$()]/;
  if (dangerousChars.test(pattern)) {
    throw new Error('Pattern contains dangerous characters');
  }

  // Check for ReDoS patterns (basic check)
  const redosPatterns = [
    /(\(.*\+\))+/,  // (a+)+
    /(\(.*\*\))+/,  // (a*)*
    /(\(.*\|\))+/   // (a|b)+
  ];

  for (const redosPattern of redosPatterns) {
    if (redosPattern.test(pattern)) {
      throw new Error('Pattern may cause ReDoS');
    }
  }

  return pattern;
}

/**
 * Sanitize command-line argument
 * 
 * @param {string} arg - Argument to sanitize
 * @returns {string} Sanitized argument
 * @throws {Error} If argument is invalid or malicious
 */
export function sanitizeArgument(arg) {
  if (typeof arg !== 'string') {
    throw new Error('Invalid argument type');
  }

  // Check for null bytes
  if (arg.includes('\x00')) {
    throw new Error('Argument contains null bytes');
  }

  // Check for shell metacharacters
  const shellMetachars = /[;&|`$()<>]/;
  if (shellMetachars.test(arg)) {
    throw new Error('Argument contains shell metacharacters');
  }

  // Check for newlines (command injection)
  if (arg.includes('\n') || arg.includes('\r')) {
    throw new Error('Argument contains newline characters');
  }

  return arg;
}

/**
 * Validate environment variable name
 * 
 * @param {string} varName - Variable name to validate
 * @returns {boolean} True if valid
 */
export function validateEnvVarName(varName) {
  if (!varName || typeof varName !== 'string') {
    return false;
  }

  // Check length
  if (varName.length > 255) {
    return false;
  }

  // Use existing validation
  return isValidEnvVarName(varName);
}

/**
 * Sanitize error message to prevent information leakage
 * 
 * @param {Error} error - Error object
 * @param {boolean} verbose - Include more details
 * @returns {string} Sanitized error message
 */
export function sanitizeErrorMessage(error, verbose = false) {
  if (!error) {
    return 'Unknown error';
  }

  let message = error.message || 'Unknown error';

  if (!verbose) {
    // Remove absolute paths
    message = message.replace(/\/[^\s]+/g, '[path]');
    message = message.replace(/[A-Z]:\\[^\s]+/g, '[path]');

    // Remove potential secrets (anything that looks like a key/token)
    message = message.replace(/[a-zA-Z0-9_-]{32,}/g, '[redacted]');

    // Limit message length
    if (message.length > 200) {
      message = message.substring(0, 200) + '...';
    }
  }

  return message;
}

/**
 * Check if file size is within limits
 * 
 * @param {number} size - File size in bytes
 * @returns {boolean} True if within limits
 */
export function isFileSizeValid(size) {
  return typeof size === 'number' && size >= 0 && size <= MAX_FILE_SIZE;
}

/**
 * Check if directory depth is within limits
 * 
 * @param {string} filePath - File path to check
 * @param {string} basePath - Base directory path
 * @returns {boolean} True if within limits
 */
export function isDepthValid(filePath, basePath = process.cwd()) {
  const relativePath = path.relative(basePath, filePath);
  const depth = relativePath.split(path.sep).length;
  return depth <= MAX_DIRECTORY_DEPTH;
}

/**
 * Rate limiter for file operations
 */
export class RateLimiter {
  constructor(maxOperations = 1000, windowMs = 1000) {
    this.maxOperations = maxOperations;
    this.windowMs = windowMs;
    this.operations = [];
  }

  /**
   * Check if operation is allowed
   * @returns {boolean} True if allowed
   */
  allowOperation() {
    const now = Date.now();
    
    // Remove old operations outside window
    this.operations = this.operations.filter(
      time => now - time < this.windowMs
    );

    // Check if under limit
    if (this.operations.length >= this.maxOperations) {
      return false;
    }

    // Record operation
    this.operations.push(now);
    return true;
  }

  /**
   * Reset rate limiter
   */
  reset() {
    this.operations = [];
  }
}

/**
 * Timeout wrapper for async operations
 * 
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} Promise that rejects on timeout
 */
export function withTimeout(promise, timeoutMs = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
}

/**
 * Validate configuration object
 * 
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validated configuration
 * @throws {Error} If configuration is invalid
 */
export function validateConfiguration(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid configuration');
  }

  // Check for prototype pollution - but allow 'path' property
  const dangerousProps = ['__proto__', 'constructor', 'prototype'];
  for (const prop of dangerousProps) {
    if (prop in config) {
      throw new Error('Configuration contains dangerous properties');
    }
  }

  // Validate each property
  const validated = {};

  if (config.path !== undefined) {
    if (typeof config.path !== 'string') {
      throw new Error('Invalid path in configuration');
    }
    validated.path = config.path;
  }

  if (config.envFile !== undefined) {
    if (typeof config.envFile !== 'string') {
      throw new Error('Invalid envFile in configuration');
    }
    validated.envFile = config.envFile;
  }

  if (config.format !== undefined) {
    if (!['text', 'json', 'github'].includes(config.format)) {
      throw new Error('Invalid format in configuration');
    }
    validated.format = config.format;
  }

  if (config.failOn !== undefined) {
    if (!['missing', 'unused', 'undocumented', 'all', 'none'].includes(config.failOn)) {
      throw new Error('Invalid failOn in configuration');
    }
    validated.failOn = config.failOn;
  }

  if (config.ignore !== undefined) {
    if (!Array.isArray(config.ignore)) {
      throw new Error('Invalid ignore in configuration');
    }
    validated.ignore = config.ignore.filter(p => typeof p === 'string');
  }

  if (config.noColor !== undefined) {
    validated.noColor = Boolean(config.noColor);
  }

  if (config.quiet !== undefined) {
    validated.quiet = Boolean(config.quiet);
  }

  if (config.watch !== undefined) {
    validated.watch = Boolean(config.watch);
  }

  if (config.suggestions !== undefined) {
    validated.suggestions = Boolean(config.suggestions);
  }

  if (config.progress !== undefined) {
    validated.progress = Boolean(config.progress);
  }

  if (config.fix !== undefined) {
    validated.fix = Boolean(config.fix);
  }

  return validated;
}

/**
 * Escape special characters for safe display
 * 
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeForDisplay(str) {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Check if path is safe to access
 * 
 * @param {string} filePath - Path to check
 * @returns {boolean} True if safe
 */
export function isSafePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /\.\./,           // Parent directory
    /^\/etc\//,       // System files
    /^\/root\//,      // Root home
    /^\/sys\//,       // System files
    /^\/proc\//,      // Process files
    /^C:\\Windows/i,  // Windows system
    /^C:\\Program/i,  // Program files
    /\.ssh/,          // SSH keys
    /\.aws/,          // AWS credentials
    /\.env$/          // Actual env files (not .env.example)
  ];

  return !dangerousPatterns.some(pattern => pattern.test(filePath));
}
