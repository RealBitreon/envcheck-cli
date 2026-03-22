/**
 * Go Scanner
 * Detects environment variable references in Go files
 * Supports: os.Getenv("VAR"), os.LookupEnv("VAR")
 */

/**
 * Regex patterns for detecting environment variable references
 * Pattern 1: os.Getenv("VAR_NAME") - standard library function for getting env vars
 * Pattern 2: os.LookupEnv("VAR_NAME") - returns value and boolean indicating if var exists
 */
const PATTERNS = [
  // os.Getenv("VAR_NAME") - standard way to get environment variables
  /os\.Getenv\("([A-Z_][A-Z0-9_]*)"\)/g,
  
  // os.LookupEnv("VAR_NAME") - returns (value, exists) tuple
  /os\.LookupEnv\("([A-Z_][A-Z0-9_]*)"\)/g,
];

/**
 * Supported file extensions for Go
 */
const SUPPORTED_EXTENSIONS = ['.go'];

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
