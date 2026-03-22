---
inclusion: auto
---

# Code Quality Standards for envcheck-cli

You are writing code for an open-source project that must be readable, maintainable, and understandable by developers of all skill levels. This project is designed to be a learning resource and a professional portfolio piece.

## Core Principles

### 1. Clarity Over Cleverness
- Write code that is immediately understandable
- Avoid clever one-liners that require mental gymnastics
- If you need to think twice about what code does, it needs a comment
- Prefer explicit over implicit

**Bad:**
```javascript
const v = d.filter(x => x.t === 'e').map(x => x.n);
```

**Good:**
```javascript
// Extract names of all environment variables from the data
const envVarNames = data
  .filter(item => item.type === 'environment')
  .map(item => item.name);
```

### 2. Self-Documenting Code
- Use descriptive variable and function names
- Names should reveal intent without needing comments
- Avoid abbreviations unless universally understood (e.g., `url`, `id`)

**Bad:**
```javascript
function proc(f) {
  const c = fs.readFileSync(f, 'utf8');
  return c.split('\n').filter(l => l.includes('env'));
}
```

**Good:**
```javascript
function extractEnvVarsFromFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');
  const envVarLines = lines.filter(line => line.includes('env'));
  return envVarLines;
}
```

### 3. Comment Philosophy

**When to Comment:**
- WHY something is done (not WHAT is being done)
- Complex algorithms or business logic
- Non-obvious workarounds or edge cases
- Regex patterns (always explain what they match)
- Performance optimizations that sacrifice readability

**When NOT to Comment:**
- Obvious code that speaks for itself
- Redundant descriptions of what code does
- Outdated comments (remove or update them)

**Bad:**
```javascript
// Increment counter by 1
counter++;
```

**Good:**
```javascript
// Track how many files we've scanned for progress reporting
filesScannedCount++;
```

### 4. Function Design

**Keep Functions Small:**
- One function = one responsibility
- If a function does multiple things, split it
- Aim for functions under 30 lines
- If you can't name it clearly, it's doing too much

**Good Function Structure:**
```javascript
/**
 * Scans a JavaScript file for environment variable references.
 * 
 * Detects patterns like:
 * - process.env.VAR_NAME
 * - process.env['VAR_NAME']
 * - const { VAR } = process.env
 * 
 * @param {string} fileContent - The content of the JavaScript file
 * @returns {string[]} Array of environment variable names found
 */
export function scanJavaScriptFile(fileContent) {
  const envVars = new Set();
  
  // Pattern 1: process.env.VAR_NAME
  const dotNotationMatches = fileContent.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g);
  for (const match of dotNotationMatches) {
    envVars.add(match[1]);
  }
  
  // Pattern 2: process.env['VAR_NAME']
  const bracketNotationMatches = fileContent.matchAll(/process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g);
  for (const match of bracketNotationMatches) {
    envVars.add(match[1]);
  }
  
  return Array.from(envVars);
}
```

### 5. Error Handling

**Always Handle Errors Gracefully:**
- Provide helpful error messages
- Include context about what went wrong
- Suggest how to fix the issue
- Never fail silently

**Bad:**
```javascript
const data = JSON.parse(content);
```

**Good:**
```javascript
let data;
try {
  data = JSON.parse(content);
} catch (error) {
  throw new Error(
    `Failed to parse .env.example file. ` +
    `Please ensure it contains valid syntax. ` +
    `Error: ${error.message}`
  );
}
```

### 6. Code Organization

**File Structure:**
```javascript
// 1. Imports (grouped logically)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// 2. Constants
const SUPPORTED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];
const ENV_VAR_PATTERN = /process\.env\.([A-Z_][A-Z0-9_]*)/g;

// 3. Helper functions (private)
function isValidEnvVarName(name) {
  return /^[A-Z_][A-Z0-9_]*$/.test(name);
}

// 4. Main exported functions
export function scanFile(filePath) {
  // Implementation
}

// 5. Additional exports
export { SUPPORTED_EXTENSIONS };
```

### 7. Testing Standards

**Every Function Needs Tests:**
- Test happy path
- Test edge cases
- Test error conditions
- Use descriptive test names

**Good Test Structure:**
```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { scanJavaScriptFile } from '../src/scanners/javascript.js';

test('scanJavaScriptFile - detects process.env.VAR_NAME pattern', () => {
  const code = 'const apiKey = process.env.API_KEY;';
  const result = scanJavaScriptFile(code);
  
  assert.deepStrictEqual(result, ['API_KEY']);
});

test('scanJavaScriptFile - handles empty file', () => {
  const code = '';
  const result = scanJavaScriptFile(code);
  
  assert.deepStrictEqual(result, []);
});

test('scanJavaScriptFile - ignores comments', () => {
  const code = '// process.env.COMMENTED_VAR';
  const result = scanJavaScriptFile(code);
  
  assert.deepStrictEqual(result, []);
});
```

### 8. Performance Considerations

**Optimize for Readability First:**
- Only optimize performance when there's a proven bottleneck
- Document why performance optimization was needed
- Keep optimized code readable with comments

**Example:**
```javascript
// Using Set for O(1) lookup instead of Array.includes() O(n)
// This matters when scanning large codebases with thousands of env vars
const envVarSet = new Set(envVars);
const missing = codeVars.filter(v => !envVarSet.has(v));
```

### 9. Consistency

**Follow Existing Patterns:**
- Look at existing code before adding new code
- Match the style and structure of similar files
- If you see a pattern repeated 3+ times, extract it

**Example - Language Scanner Pattern:**
All language scanners follow the same structure:
```javascript
/**
 * Scans [LANGUAGE] files for environment variable references.
 * @param {string} content - File content to scan
 * @returns {string[]} Array of environment variable names
 */
export function scan(content) {
  const envVars = new Set();
  
  // Pattern 1: [description]
  // [regex explanation]
  const pattern1 = /regex/g;
  for (const match of content.matchAll(pattern1)) {
    envVars.add(match[1]);
  }
  
  return Array.from(envVars);
}
```

### 10. Documentation

**Every Module Needs:**
- File-level comment explaining its purpose
- JSDoc comments for exported functions
- Inline comments for complex logic
- Examples in comments when helpful

**Example:**
```javascript
/**
 * Parser for .env.example files.
 * 
 * Extracts environment variable names and their inline documentation.
 * Supports standard .env syntax with comments.
 * 
 * Example .env.example format:
 * ```
 * # Database connection string
 * DATABASE_URL=
 * 
 * # API key for external service
 * API_KEY=
 * ```
 */

/**
 * Parses a .env.example file and extracts variable information.
 * 
 * @param {string} content - Content of the .env.example file
 * @returns {Object} Parsed environment variables with metadata
 * @returns {string[]} returns.variables - Array of variable names
 * @returns {Object} returns.documentation - Map of variable names to comments
 */
export function parseEnvFile(content) {
  // Implementation
}
```

## Code Review Checklist

Before submitting code, verify:

- [ ] Variable and function names are descriptive
- [ ] Complex logic has explanatory comments
- [ ] All regex patterns are documented
- [ ] Error messages are helpful and actionable
- [ ] Functions are small and focused
- [ ] Tests cover happy path and edge cases
- [ ] No magic numbers (use named constants)
- [ ] No abbreviations in names (except standard ones)
- [ ] Consistent with existing code style
- [ ] No console.log() left in code (use proper logging)

## Anti-Patterns to Avoid

### ❌ Magic Numbers
```javascript
if (results.length > 5) { // What does 5 mean?
```

### ✅ Named Constants
```javascript
const MAX_RESULTS_TO_DISPLAY = 5;
if (results.length > MAX_RESULTS_TO_DISPLAY) {
```

### ❌ Nested Ternaries
```javascript
const status = isValid ? isComplete ? 'done' : 'pending' : 'error';
```

### ✅ Clear If-Else
```javascript
let status;
if (!isValid) {
  status = 'error';
} else if (isComplete) {
  status = 'done';
} else {
  status = 'pending';
}
```

### ❌ Callback Hell
```javascript
readFile(path, (err, data) => {
  if (err) throw err;
  parseData(data, (err, parsed) => {
    if (err) throw err;
    processData(parsed, (err, result) => {
      // ...
    });
  });
});
```

### ✅ Async/Await
```javascript
try {
  const data = await readFile(path);
  const parsed = await parseData(data);
  const result = await processData(parsed);
} catch (error) {
  handleError(error);
}
```

## Remember

This code will be read by:
- Junior developers learning from your code
- Contributors adding new features
- Maintainers debugging issues
- Scholarship reviewers evaluating your work
- Future you, 6 months from now

Write code you'd be proud to explain to any of them.

## Resources

- [Clean Code by Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [JavaScript: The Good Parts by Douglas Crockford](https://www.amazon.com/JavaScript-Good-Parts-Douglas-Crockford/dp/0596517742)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
