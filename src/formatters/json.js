/**
 * JSON Formatter Module
 * 
 * Formats analysis results as valid JSON for machine parsing and CI/CD integration.
 * Produces structured output with all issue categories and summary statistics.
 */

/**
 * Formats analysis results as JSON
 * 
 * @param {Object} result - Analysis result from analyzer
 * @param {Array} result.missing - Missing variable issues
 * @param {Array} result.unused - Unused variable issues
 * @param {Array} result.undocumented - Undocumented variable issues
 * @param {Object} result.summary - Summary statistics
 * @returns {string} JSON-formatted string
 */
export function formatJSON(result) {
  const output = {
    missing: formatMissingIssues(result.missing),
    unused: formatUnusedIssues(result.unused),
    undocumented: formatUndocumentedIssues(result.undocumented),
    summary: formatSummary(result.summary)
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Formats missing variable issues for JSON output
 * 
 * @param {Array} missing - Array of missing variable issues
 * @returns {Array} Formatted missing issues
 */
export function formatMissingIssues(missing) {
  return missing.map(issue => ({
    varName: issue.varName,
    references: issue.references.map(ref => ({
      filePath: ref.filePath,
      lineNumber: ref.lineNumber,
      pattern: ref.pattern
    }))
  }));
}

/**
 * Formats unused variable issues for JSON output
 * 
 * @param {Array} unused - Array of unused variable issues
 * @returns {Array} Formatted unused issues
 */
export function formatUnusedIssues(unused) {
  return unused.map(issue => ({
    varName: issue.varName,
    definition: {
      lineNumber: issue.definition.lineNumber,
      hasComment: issue.definition.hasComment,
      comment: issue.definition.comment
    }
  }));
}

/**
 * Formats undocumented variable issues for JSON output
 * 
 * @param {Array} undocumented - Array of undocumented variable issues
 * @returns {Array} Formatted undocumented issues
 */
export function formatUndocumentedIssues(undocumented) {
  return undocumented.map(issue => ({
    varName: issue.varName,
    references: issue.references.map(ref => ({
      filePath: ref.filePath,
      lineNumber: ref.lineNumber,
      pattern: ref.pattern
    })),
    definition: {
      lineNumber: issue.definition.lineNumber,
      hasComment: issue.definition.hasComment,
      comment: issue.definition.comment
    }
  }));
}

/**
 * Formats summary statistics for JSON output
 * 
 * @param {Object} summary - Summary statistics object
 * @returns {Object} Formatted summary
 */
export function formatSummary(summary) {
  return {
    totalMissing: summary.totalMissing,
    totalUnused: summary.totalUnused,
    totalUndocumented: summary.totalUndocumented,
    totalReferences: summary.totalReferences,
    totalDefinitions: summary.totalDefinitions
  };
}

/**
 * Validates that a string is valid JSON
 * 
 * @param {string} jsonString - String to validate
 * @returns {boolean} True if valid JSON, false otherwise
 */
export function isValidJSON(jsonString) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
}
