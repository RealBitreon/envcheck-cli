/**
 * Shell/Bash Scanner
 * Detects environment variable references in shell script files
 * Supports: $VAR_NAME, ${VAR_NAME}
 * 
 * Note: Shell scripts may produce more false positives than other languages
 * due to the prevalence of variable usage in shell scripting.
 */

/**
 * Regex patterns for detecting environment variable references
 * 
 * Pattern 1: $VAR_NAME (simple variable expansion)
 * - Matches: $DATABASE_URL, $API_KEY
 * - Must be followed by a non-word character or end of string to avoid partial matches
 * - More prone to false positives (e.g., $1, $?, special vars)
 * - We filter these out by requiring uppercase start
 * - This pattern is checked FIRST to maintain consistent ordering in results
 * 
 * Pattern 2: ${VAR_NAME} (braced variable expansion)
 * - Matches: ${DATABASE_URL}, ${API_KEY}
 * - Also matches parameter expansion: ${VAR:-default}, ${VAR:=default}, ${VAR:?error}
 * - This is the preferred form and less ambiguous
 * - Captures the variable name inside the braces
 * 
 * Both patterns work within double quotes, which is common in shell scripts.
 * Single quotes prevent variable expansion in shell, but we still detect them
 * as they might indicate configuration that needs documentation.
 */
const PATTERNS = [
  // Simple expansion: $VAR_NAME
  // Uses word boundary or lookahead to ensure we capture the full variable name
  // This pattern is checked FIRST to maintain consistent ordering in results
  /\$([A-Z_][A-Z0-9_]*)(?=\W|$)/g,
  
  // Braced expansion: ${VAR_NAME} with optional parameter expansion operators
  // Matches: ${VAR}, ${VAR:-default}, ${VAR:=default}, ${VAR:?error}, ${VAR:+value}
  // Captures the variable name between the braces, before any colon or closing brace
  /\$\{([A-Z_][A-Z0-9_]*)(?:[:\}])/g,
];

/**
 * Supported file extensions for Shell/Bash scripts
 */
const SUPPORTED_EXTENSIONS = ['.sh', '.bash', '.zsh'];

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
  const seenPerLine = new Set();

  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(line)) !== null) {
      const varName = match[1];
      const matchedPattern = match[0];

      if (seenPerLine.has(varName)) {
        continue;
      }

      if (varName && isValidEnvVarName(varName)) {
        references.push({
          varName,
          filePath,
          lineNumber,
          pattern: matchedPattern,
        });

        seenPerLine.add(varName);
      }
    }
  }

  return references;
}

/**
 * Validate environment variable name
 * Must start with letter or underscore, contain only uppercase letters, digits, and underscores
 * 
 * This helps filter out shell special variables like:
 * - Positional parameters: $1, $2, $@, $*
 * - Special variables: $?, $!, $-
 * - Lowercase local variables: $var, $my_var
 * 
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
