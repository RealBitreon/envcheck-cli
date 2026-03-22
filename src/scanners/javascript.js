/**
 * JavaScript/TypeScript Scanner
 * Detects environment variable references in JS/TS files
 * Supports: process.env.VAR, process.env['VAR'], import.meta.env.VAR
 */

/**
 * Regex patterns for detecting environment variable references
 * Pattern 1: process.env.VAR_NAME (dot notation)
 * Pattern 2: process.env['VAR_NAME'] or process.env["VAR_NAME"] (bracket notation)
 * Pattern 3: import.meta.env.VAR_NAME (Vite/modern bundlers)
 */
const PATTERNS = [
  // Dot notation: process.env.VAR_NAME
  /process\.env\.([A-Z_][A-Z0-9_]*)/g,
  
  // Bracket notation: process.env['VAR_NAME'] or process.env["VAR_NAME"]
  /process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]]/g,
  
  // Vite/modern bundlers: import.meta.env.VAR_NAME
  /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g,
];

/**
 * Supported file extensions for JavaScript/TypeScript
 */
const SUPPORTED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];

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
