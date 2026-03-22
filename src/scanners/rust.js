/**
 * Rust Scanner
 * Detects environment variable references in Rust files
 * Supports: env::var("VAR"), std::env::var("VAR"), env::var_os("VAR"), std::env::var_os("VAR")
 */

/**
 * Regex patterns for detecting environment variable references
 * Pattern 1: std::env::var("VAR_NAME") - full path form (returns Result<String>)
 * Pattern 2: std::env::var_os("VAR_NAME") - full path form returning OsString (returns Option<OsString>)
 * Pattern 3: env::var("VAR_NAME") - short form for getting env vars (returns Result<String>)
 * Pattern 4: env::var_os("VAR_NAME") - short form returning OsString (returns Option<OsString>)
 * 
 * Note: Order matters! We check std::env:: patterns first to avoid double-matching
 * (since "env::var" would match within "std::env::var")
 */
const PATTERNS = [
  // std::env::var("VAR_NAME") - full path form, returns Result<String, VarError>
  // Use negative lookbehind to ensure we don't match if preceded by non-whitespace (avoids matching "std::env::var")
  /std::env::var\("([A-Z_][A-Z0-9_]*)"\)/g,
  
  // std::env::var_os("VAR_NAME") - full path form, returns Option<OsString>
  /std::env::var_os\("([A-Z_][A-Z0-9_]*)"\)/g,
  
  // env::var("VAR_NAME") - short form, returns Result<String, VarError>
  // Use negative lookbehind to ensure not preceded by "std::" to avoid double-matching
  /(?<!std::)env::var\("([A-Z_][A-Z0-9_]*)"\)/g,
  
  // env::var_os("VAR_NAME") - short form, returns Option<OsString>
  // Use negative lookbehind to ensure not preceded by "std::" to avoid double-matching
  /(?<!std::)env::var_os\("([A-Z_][A-Z0-9_]*)"\)/g,
];

/**
 * Supported file extensions for Rust
 */
const SUPPORTED_EXTENSIONS = ['.rs'];

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
