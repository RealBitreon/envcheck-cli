/**
 * Text Formatter Module
 * 
 * Formats analysis results as human-readable text output with:
 * - Colored categories (red, yellow, green)
 * - Emoji icons for visual clarity
 * - File reference listings with line numbers
 * - Summary statistics
 * - Support for --no-color flag
 */

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  GREEN: '\x1b[32m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m'
};

/**
 * Emoji icons for issue categories
 */
const ICONS = {
  MISSING: '🔴',
  UNUSED: '🟡',
  UNDOCUMENTED: '🟢'
};

/**
 * Formats analysis results as colored text output
 * 
 * @param {{missing: Array, unused: Array, undocumented: Array, summary: Object}} result - Analysis result
 * @param {{noColor: boolean, quiet: boolean}} options - Formatting options
 * @returns {string} Formatted text output
 */
export function formatText(result, options = {}) {
  const { noColor = false, quiet = false } = options;
  
  // If quiet mode and no issues, return empty string
  if (quiet && hasNoIssues(result)) {
    return '';
  }
  
  const sections = [];
  
  // Format MISSING section
  if (result.missing.length > 0) {
    sections.push(formatMissingSection(result.missing, noColor));
  }
  
  // Format UNUSED section
  if (result.unused.length > 0) {
    sections.push(formatUnusedSection(result.unused, noColor));
  }
  
  // Format UNDOCUMENTED section
  if (result.undocumented.length > 0) {
    sections.push(formatUndocumentedSection(result.undocumented, noColor));
  }
  
  // Add summary line
  sections.push(formatSummary(result.summary, noColor));
  
  return sections.join('\n\n');
}

/**
 * Checks if analysis result has no issues
 * 
 * @param {{missing: Array, unused: Array, undocumented: Array}} result
 * @returns {boolean} True if no issues found
 */
export function hasNoIssues(result) {
  return result.missing.length === 0 && 
         result.unused.length === 0 && 
         result.undocumented.length === 0;
}

/**
 * Formats MISSING variables section
 * 
 * @param {Array<{varName: string, references: Array}>} missing - Missing variable issues
 * @param {boolean} noColor - Disable colored output
 * @returns {string} Formatted section
 */
export function formatMissingSection(missing, noColor) {
  const icon = ICONS.MISSING;
  const title = colorize('MISSING', COLORS.RED, noColor);
  const count = missing.length;
  
  let output = `${icon} ${title} (${count})\n`;
  output += 'Variables used in code but not in .env.example:\n';
  
  for (const issue of missing) {
    output += `  - ${colorize(issue.varName, COLORS.BOLD, noColor)}\n`;
    
    // List all file references
    for (const ref of issue.references) {
      output += `    ${colorize('→', COLORS.DIM, noColor)} ${ref.filePath}:${ref.lineNumber}\n`;
    }
  }
  
  return output.trimEnd();
}

/**
 * Formats UNUSED variables section
 * 
 * @param {Array<{varName: string, definition: Object}>} unused - Unused variable issues
 * @param {boolean} noColor - Disable colored output
 * @returns {string} Formatted section
 */
export function formatUnusedSection(unused, noColor) {
  const icon = ICONS.UNUSED;
  const title = colorize('UNUSED', COLORS.YELLOW, noColor);
  const count = unused.length;
  
  let output = `${icon} ${title} (${count})\n`;
  output += 'Variables in .env.example but never used:\n';
  
  for (const issue of unused) {
    output += `  - ${colorize(issue.varName, COLORS.BOLD, noColor)}`;
    output += ` ${colorize(`(.env.example:${issue.definition.lineNumber})`, COLORS.DIM, noColor)}\n`;
  }
  
  return output.trimEnd();
}

/**
 * Formats UNDOCUMENTED variables section
 * 
 * @param {Array<{varName: string, references: Array, definition: Object}>} undocumented - Undocumented variable issues
 * @param {boolean} noColor - Disable colored output
 * @returns {string} Formatted section
 */
export function formatUndocumentedSection(undocumented, noColor) {
  const icon = ICONS.UNDOCUMENTED;
  const title = colorize('UNDOCUMENTED', COLORS.GREEN, noColor);
  const count = undocumented.length;
  
  let output = `${icon} ${title} (${count})\n`;
  output += 'Variables used and defined but missing comments:\n';
  
  for (const issue of undocumented) {
    output += `  - ${colorize(issue.varName, COLORS.BOLD, noColor)}`;
    output += ` ${colorize(`(.env.example:${issue.definition.lineNumber})`, COLORS.DIM, noColor)}\n`;
  }
  
  return output.trimEnd();
}

/**
 * Formats summary statistics line
 * 
 * @param {{totalMissing: number, totalUnused: number, totalUndocumented: number}} summary - Summary statistics
 * @param {boolean} noColor - Disable colored output
 * @returns {string} Formatted summary
 */
export function formatSummary(summary, noColor) {
  const parts = [];
  
  if (summary.totalMissing > 0) {
    parts.push(colorize(`${summary.totalMissing} missing`, COLORS.RED, noColor));
  }
  
  if (summary.totalUnused > 0) {
    parts.push(colorize(`${summary.totalUnused} unused`, COLORS.YELLOW, noColor));
  }
  
  if (summary.totalUndocumented > 0) {
    parts.push(colorize(`${summary.totalUndocumented} undocumented`, COLORS.GREEN, noColor));
  }
  
  if (parts.length === 0) {
    return colorize('✓ No issues found', COLORS.GREEN, noColor);
  }
  
  return `Summary: ${parts.join(', ')}`;
}

/**
 * Applies ANSI color codes to text
 * 
 * @param {string} text - Text to colorize
 * @param {string} color - ANSI color code
 * @param {boolean} noColor - Disable colored output
 * @returns {string} Colorized text or plain text if noColor is true
 */
export function colorize(text, color, noColor) {
  if (noColor) {
    return text;
  }
  return `${color}${text}${COLORS.RESET}`;
}
