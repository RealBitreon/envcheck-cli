/**
 * Python Scanner
 * Detects environment variable references in Python files
 * Supports: os.environ['VAR'], os.environ.get('VAR'), os.getenv('VAR')
 */

/**
 * Regex patterns for detecting environment variable references
 * Pattern 1: os.environ['VAR_NAME'] or os.environ["VAR_NAME"] (bracket notation)
 * Pattern 2: os.environ.get('VAR_NAME') or os.environ.get("VAR_NAME") (get method)
 * Pattern 3: os.getenv('VAR_NAME') or os.getenv("VAR_NAME") (getenv function)
 */
const PATTERNS = [
  // Bracket notation: os.environ['VAR_NAME'] or os.environ["VAR_NAME"]
  /os\.environ\[['"]([A-Z_][A-Z0-9_]*)['"]]/g,
  
  // Get method: os.environ.get('VAR_NAME') or os.environ.get("VAR_NAME")
  // Matches with or without default values: os.environ.get('VAR', 'default')
  // The pattern captures up to and including the closing paren if no comma follows
  /os\.environ\.get\(['"]([A-Z_][A-Z0-9_]*)['"](?:,.*?)?\)/g,
  
  // Getenv function: os.getenv('VAR_NAME') or os.getenv("VAR_NAME")
  // Matches with or without default values: os.getenv('VAR', 'default')
  // The pattern captures up to and including the closing paren if no comma follows
  /os\.getenv\(['"]([A-Z_][A-Z0-9_]*)['"](?:,.*?)?\)/g,
];

/**
 * Supported file extensions for Python
 */
const SUPPORTED_EXTENSIONS = ['.py'];

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
