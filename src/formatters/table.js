/**
 * Table formatter for better visual output
 */

/**
 * Format data as a table
 */
export function formatTable(headers, rows, options = {}) {
  const { maxWidth = 100, padding = 2 } = options;
  
  if (rows.length === 0) {
    return '';
  }

  // Calculate column widths
  const columnWidths = headers.map((header, i) => {
    const headerWidth = header.length;
    const maxRowWidth = Math.max(
      ...rows.map(row => String(row[i] || '').length)
    );
    return Math.min(Math.max(headerWidth, maxRowWidth) + padding, maxWidth);
  });

  // Create separator
  const separator = '─'.repeat(columnWidths.reduce((a, b) => a + b, 0) + columnWidths.length + 1);

  // Format header
  const headerRow = '│ ' + headers.map((header, i) => 
    header.padEnd(columnWidths[i])
  ).join('│ ') + '│';

  // Format rows
  const dataRows = rows.map(row => 
    '│ ' + row.map((cell, i) => 
      String(cell || '').padEnd(columnWidths[i])
    ).join('│ ') + '│'
  );

  return [
    '┌' + separator + '┐',
    headerRow,
    '├' + separator + '┤',
    ...dataRows,
    '└' + separator + '┘',
  ].join('\n');
}

/**
 * Format summary statistics
 */
export function formatSummary(result) {
  const total = result.missing.length + result.unused.length + result.undocumented.length;
  
  const stats = [
    ['Category', 'Count', 'Status'],
    ['Missing', result.missing.length, result.missing.length > 0 ? '❌' : '✅'],
    ['Unused', result.unused.length, result.unused.length > 0 ? '⚠️' : '✅'],
    ['Undocumented', result.undocumented.length, result.undocumented.length > 0 ? 'ℹ️' : '✅'],
    ['Total Issues', total, total > 0 ? '⚠️' : '✅'],
  ];

  return formatTable(stats[0], stats.slice(1));
}

/**
 * Format issues as a tree structure
 */
export function formatTree(issues, title) {
  if (issues.length === 0) {
    return '';
  }

  const lines = [`\n${title}:`];
  
  issues.forEach((issue, index) => {
    const isLast = index === issues.length - 1;
    const prefix = isLast ? '└─' : '├─';
    const childPrefix = isLast ? '  ' : '│ ';
    
    lines.push(`${prefix} ${issue.varName}`);
    
    if (issue.locations) {
      issue.locations.forEach((loc, locIndex) => {
        const isLastLoc = locIndex === issue.locations.length - 1;
        const locPrefix = isLastLoc ? '└─' : '├─';
        lines.push(`${childPrefix}${locPrefix} ${loc.filePath}:${loc.lineNumber}`);
      });
    }
  });

  return lines.join('\n');
}
