/**
 * GitHub Actions Formatter Module
 * 
 * Formats analysis results as GitHub Actions workflow commands for CI/CD integration.
 * Produces ::error and ::warning annotations that appear in GitHub's UI.
 * 
 * @see https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
 */

/**
 * Formats analysis results as GitHub Actions annotations
 * 
 * @param {Object} result - Analysis result from analyzer
 * @param {Array} result.missing - Missing variable issues
 * @param {Array} result.unused - Unused variable issues
 * @param {Array} result.undocumented - Undocumented variable issues
 * @param {Object} result.summary - Summary statistics
 * @returns {string} GitHub Actions formatted output
 */
export function formatGitHub(result) {
  const annotations = [];
  
  // Format missing variables as errors
  for (const issue of result.missing) {
    annotations.push(...formatMissingAnnotations(issue));
  }
  
  // Format unused variables as warnings
  for (const issue of result.unused) {
    annotations.push(formatUnusedAnnotation(issue));
  }
  
  // Format undocumented variables as warnings
  for (const issue of result.undocumented) {
    annotations.push(formatUndocumentedAnnotation(issue));
  }
  
  // Add summary notice
  annotations.push(formatSummaryNotice(result.summary));
  
  return annotations.join('\n');
}

/**
 * Formats missing variable issue as GitHub error annotations
 * Creates one error annotation per file reference
 * 
 * @param {Object} issue - Missing variable issue
 * @param {string} issue.varName - Variable name
 * @param {Array} issue.references - File references where variable is used
 * @returns {Array<string>} Array of error annotations
 */
export function formatMissingAnnotations(issue) {
  return issue.references.map(ref => {
    const message = `Missing environment variable: ${issue.varName} is used but not defined in .env.example`;
    return formatErrorAnnotation(ref.filePath, ref.lineNumber, message);
  });
}

/**
 * Formats unused variable issue as GitHub warning annotation
 * 
 * @param {Object} issue - Unused variable issue
 * @param {string} issue.varName - Variable name
 * @param {Object} issue.definition - Definition location
 * @returns {string} Warning annotation
 */
export function formatUnusedAnnotation(issue) {
  const message = `Unused environment variable: ${issue.varName} is defined in .env.example but never used`;
  return formatWarningAnnotation('.env.example', issue.definition.lineNumber, message);
}

/**
 * Formats undocumented variable issue as GitHub warning annotation
 * 
 * @param {Object} issue - Undocumented variable issue
 * @param {string} issue.varName - Variable name
 * @param {Object} issue.definition - Definition location
 * @returns {string} Warning annotation
 */
export function formatUndocumentedAnnotation(issue) {
  const message = `Undocumented environment variable: ${issue.varName} is missing a comment in .env.example`;
  return formatWarningAnnotation('.env.example', issue.definition.lineNumber, message);
}

/**
 * Formats summary as GitHub notice annotation
 * 
 * @param {Object} summary - Summary statistics
 * @returns {string} Notice annotation
 */
export function formatSummaryNotice(summary) {
  const parts = [];
  
  if (summary.totalMissing > 0) {
    parts.push(`${summary.totalMissing} missing`);
  }
  
  if (summary.totalUnused > 0) {
    parts.push(`${summary.totalUnused} unused`);
  }
  
  if (summary.totalUndocumented > 0) {
    parts.push(`${summary.totalUndocumented} undocumented`);
  }
  
  if (parts.length === 0) {
    return '::notice::Environment check passed - no issues found';
  }
  
  return `::notice::Environment check completed - ${parts.join(', ')}`;
}

/**
 * Formats a GitHub Actions error annotation
 * 
 * @param {string} file - File path
 * @param {number} line - Line number
 * @param {string} message - Error message
 * @returns {string} Formatted error annotation
 */
export function formatErrorAnnotation(file, line, message) {
  return `::error file=${escapeProperty(file)},line=${line}::${escapeMessage(message)}`;
}

/**
 * Formats a GitHub Actions warning annotation
 * 
 * @param {string} file - File path
 * @param {number} line - Line number
 * @param {string} message - Warning message
 * @returns {string} Formatted warning annotation
 */
export function formatWarningAnnotation(file, line, message) {
  return `::warning file=${escapeProperty(file)},line=${line}::${escapeMessage(message)}`;
}

/**
 * Escapes special characters in annotation properties (file, line, col)
 * 
 * @param {string} value - Property value to escape
 * @returns {string} Escaped value
 */
export function escapeProperty(value) {
  return value
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/:/g, '%3A')
    .replace(/,/g, '%2C');
}

/**
 * Escapes special characters in annotation messages
 * 
 * @param {string} message - Message to escape
 * @returns {string} Escaped message
 */
export function escapeMessage(message) {
  return message
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
}
