/**
 * Intelligent suggestions and fixes for common issues
 */

/**
 * Analyze issues and provide actionable suggestions
 */
export function generateSuggestions(result) {
  const suggestions = [];

  // Missing variables suggestions
  if (result.missing.length > 0) {
    suggestions.push({
      type: 'missing',
      severity: 'error',
      message: `Found ${result.missing.length} missing environment variable(s)`,
      action: 'Add these variables to your .env.example file:',
      items: result.missing.map(m => ({
        variable: m.varName,
        locations: m.locations.map(l => `${l.filePath}:${l.lineNumber}`),
        suggestion: `${m.varName}=`,
      })),
    });
  }

  // Unused variables suggestions
  if (result.unused.length > 0) {
    suggestions.push({
      type: 'unused',
      severity: 'warning',
      message: `Found ${result.unused.length} unused environment variable(s)`,
      action: 'Consider removing these from .env.example or use them in your code:',
      items: result.unused.map(u => ({
        variable: u.varName,
        suggestion: `Remove ${u.varName} from .env.example or add usage in code`,
      })),
    });
  }

  // Undocumented variables suggestions
  if (result.undocumented.length > 0) {
    suggestions.push({
      type: 'undocumented',
      severity: 'info',
      message: `Found ${result.undocumented.length} undocumented environment variable(s)`,
      action: 'Add comments to document these variables:',
      items: result.undocumented.map(u => ({
        variable: u.varName,
        suggestion: `# Description of ${u.varName}\n${u.varName}=`,
      })),
    });
  }

  return suggestions;
}

/**
 * Generate auto-fix content for .env.example
 */
export function generateEnvExampleFix(result, existingContent = '') {
  const lines = existingContent.split('\n');
  const additions = [];

  // Add missing variables
  for (const missing of result.missing) {
    const example = inferExampleValue(missing.varName);
    additions.push(`# ${missing.varName} - Add description here`);
    additions.push(`${missing.varName}=${example}`);
    additions.push('');
  }

  return [...lines, '', '# Auto-generated additions', ...additions].join('\n');
}

/**
 * Infer example value based on variable name
 */
function inferExampleValue(varName) {
  const patterns = {
    PORT: '3000',
    HOST: 'localhost',
    URL: 'https://example.com',
    API_KEY: 'your_api_key_here',
    SECRET: 'your_secret_here',
    TOKEN: 'your_token_here',
    PASSWORD: 'your_password_here',
    DATABASE: 'postgres://localhost:5432/dbname',
    REDIS: 'redis://localhost:6379',
    EMAIL: 'user@example.com',
    DEBUG: 'false',
    NODE_ENV: 'development',
  };

  for (const [pattern, value] of Object.entries(patterns)) {
    if (varName.toUpperCase().includes(pattern)) {
      return value;
    }
  }

  return 'your_value_here';
}

/**
 * Suggest similar variable names (typo detection)
 */
export function findSimilarVariables(varName, definedVars) {
  const similar = [];

  for (const defined of definedVars) {
    const distance = levenshteinDistance(varName.toLowerCase(), defined.toLowerCase());
    const maxLength = Math.max(varName.length, defined.length);
    const similarity = 1 - distance / maxLength;

    if (similarity > 0.7 && similarity < 1) {
      similar.push({
        name: defined,
        similarity: Math.round(similarity * 100),
      });
    }
  }

  return similar.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
