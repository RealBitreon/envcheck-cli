# Code Quality & Maintainability Guide

## Overview

This guide ensures envcheck-cli remains secure, maintainable, and easy to understand for human developers. It covers code standards, patterns, testing practices, and documentation requirements.

## Code Standards

### File Organization

```
src/
├── cli.js              # CLI entry point and argument parsing
├── parser.js           # .env file parsing
├── scanner.js          # File system scanning
├── analyzer.js         # Issue detection and analysis
├── security.js         # Security utilities
├── utils.js            # General utilities
├── config.js           # Configuration management
├── ignore.js           # Ignore pattern handling
├── formatters/         # Output formatters
│   ├── text.js
│   ├── json.js
│   └── github.js
└── scanners/           # Language-specific scanners
    ├── javascript.js
    ├── python.js
    ├── go.js
    ├── ruby.js
    ├── rust.js
    └── shell.js
```

### Naming Conventions

1. **Files**: lowercase with hyphens
   - ✅ `security-utils.js`
   - ❌ `SecurityUtils.js`

2. **Functions**: camelCase, descriptive verbs
   - ✅ `sanitizePath()`, `validateEnvVarName()`
   - ❌ `sp()`, `validate()`

3. **Constants**: UPPER_SNAKE_CASE
   - ✅ `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`
   - ❌ `maxFileSize`, `defaultTimeout`

4. **Classes**: PascalCase
   - ✅ `RateLimiter`, `Spinner`
   - ❌ `rateLimiter`, `spinner`

### Code Style

1. **Use ES Modules**
   ```javascript
   // ✅ Good
   import { readFile } from 'fs/promises';
   export function parseEnvFile() {}
   
   // ❌ Bad
   const fs = require('fs');
   module.exports = { parseEnvFile };
   ```

2. **Async/Await over Callbacks**
   ```javascript
   // ✅ Good
   async function readConfig() {
     const content = await readFile('config.json', 'utf-8');
     return JSON.parse(content);
   }
   
   // ❌ Bad
   function readConfig(callback) {
     readFile('config.json', 'utf-8', (err, content) => {
       if (err) return callback(err);
       callback(null, JSON.parse(content));
     });
   }
   ```

3. **Early Returns**
   ```javascript
   // ✅ Good
   function validateInput(input) {
     if (!input) return false;
     if (input.length > 100) return false;
     return true;
   }
   
   // ❌ Bad
   function validateInput(input) {
     if (input) {
       if (input.length <= 100) {
         return true;
       }
     }
     return false;
   }
   ```

4. **Descriptive Variable Names**
   ```javascript
   // ✅ Good
   const environmentVariables = parseEnvFile('.env.example');
   const missingVariables = findMissing(references, definitions);
   
   // ❌ Bad
   const vars = parseEnvFile('.env.example');
   const missing = findMissing(refs, defs);
   ```

5. **Single Responsibility**
   ```javascript
   // ✅ Good
   function parseEnvFile(filePath) {
     const content = readFileSync(filePath, 'utf-8');
     return parseContent(content);
   }
   
   function parseContent(content) {
     const lines = content.split('\n');
     return lines.map(parseLine).filter(Boolean);
   }
   
   // ❌ Bad
   function parseEnvFile(filePath) {
     const content = readFileSync(filePath, 'utf-8');
     const lines = content.split('\n');
     const definitions = [];
     for (const line of lines) {
       if (line.trim() && !line.startsWith('#')) {
         const match = line.match(/^([A-Z_]+)=/);
         if (match) {
           definitions.push({ varName: match[1] });
         }
       }
     }
     return definitions;
   }
   ```

## Documentation Standards

### Function Documentation

Every exported function must have JSDoc comments:

```javascript
/**
 * Sanitize a file path to prevent directory traversal attacks
 * 
 * @param {string} filePath - Path to sanitize
 * @param {string} basePath - Base directory path (optional)
 * @returns {string} Sanitized path
 * @throws {Error} If path is invalid or attempts traversal
 * 
 * @example
 * const safePath = sanitizePath('../../etc/passwd');
 * // Throws: Error: Path traversal detected
 * 
 * @example
 * const safePath = sanitizePath('./src/index.js');
 * // Returns: '/absolute/path/to/project/src/index.js'
 */
export function sanitizePath(filePath, basePath = process.cwd()) {
  // Implementation
}
```

### Module Documentation

Every module should have a header comment:

```javascript
/**
 * Security Utilities Module
 * 
 * Provides security functions for:
 * - Path sanitization and validation
 * - Input validation and sanitization
 * - Pattern validation
 * - Resource limits
 * - Safe file operations
 * 
 * @module security
 */
```

### Inline Comments

Use inline comments for complex logic:

```javascript
// Check for ReDoS patterns (basic check)
const redosPatterns = [
  /(\(.*\+\))+/,  // (a+)+ - catastrophic backtracking
  /(\(.*\*\))+/,  // (a*)* - catastrophic backtracking
  /(\(.*\|\))+/   // (a|b)+ - catastrophic backtracking
];
```

## Testing Standards

### Test Organization

```
test/
├── security.test.js           # Security tests
├── security-utils.test.js     # Security utility tests
├── cli.test.js                # CLI tests
├── parser.test.js             # Parser tests
├── scanner.test.js            # Scanner tests
├── analyzer.test.js           # Analyzer tests
├── integration.test.js        # Integration tests
└── fixtures/                  # Test fixtures
    ├── samples/
    ├── edge-cases/
    └── multi-lang/
```

### Test Structure

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

describe('Module Name', () => {
  before(() => {
    // Setup
  });

  after(() => {
    // Cleanup
  });

  describe('Function Name', () => {
    it('should handle normal case', () => {
      const result = functionName('input');
      assert.strictEqual(result, 'expected');
    });

    it('should handle edge case', () => {
      const result = functionName('');
      assert.strictEqual(result, null);
    });

    it('should throw on invalid input', () => {
      assert.throws(
        () => functionName(null),
        /Invalid input/
      );
    });
  });
});
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% overall
- **Critical Modules**: 95% coverage
  - security.js
  - parser.js
  - scanner.js
  - cli.js

### Test Categories

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test module interactions
3. **Security Tests**: Test security features
4. **Property-Based Tests**: Test with random inputs
5. **Edge Case Tests**: Test boundary conditions

## Error Handling

### Error Types

```javascript
// Custom error classes
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SecurityError';
  }
}
```

### Error Handling Pattern

```javascript
async function operation() {
  try {
    // Operation
    const result = await riskyOperation();
    return result;
  } catch (error) {
    // Log error (if needed)
    console.error(`Operation failed: ${error.message}`);
    
    // Sanitize and rethrow
    throw new Error(sanitizeErrorMessage(error));
  }
}
```

### User-Facing Errors

```javascript
// ✅ Good - Clear, actionable
throw new Error('Environment file not found: .env.example');
throw new Error('Invalid format: "xml". Must be one of: text, json, github');

// ❌ Bad - Vague, unhelpful
throw new Error('File error');
throw new Error('Invalid input');
```

## Security Checklist

### Before Committing

- [ ] All inputs validated
- [ ] Paths sanitized
- [ ] Patterns validated
- [ ] Error messages sanitized
- [ ] No secrets in code
- [ ] No console.log() in production code
- [ ] Tests passing
- [ ] Documentation updated

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Functions have JSDoc comments
- [ ] Tests cover new functionality
- [ ] No security vulnerabilities
- [ ] Error handling is appropriate
- [ ] Performance is acceptable
- [ ] Code is readable and maintainable

## Performance Guidelines

### File Operations

```javascript
// ✅ Good - Stream large files
async function scanLargeFile(filePath) {
  const stream = createReadStream(filePath);
  const lineReader = createInterface({ input: stream });
  
  for await (const line of lineReader) {
    processLine(line);
  }
}

// ❌ Bad - Load entire file into memory
async function scanLargeFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach(processLine);
}
```

### Concurrency

```javascript
// ✅ Good - Controlled concurrency
async function scanFiles(filePaths) {
  const concurrency = 8;
  const results = [];
  
  for (let i = 0; i < filePaths.length; i += concurrency) {
    const batch = filePaths.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(scanFile)
    );
    results.push(...batchResults);
  }
  
  return results;
}

// ❌ Bad - Unlimited concurrency
async function scanFiles(filePaths) {
  return Promise.all(filePaths.map(scanFile));
}
```

### Caching

```javascript
// ✅ Good - Cache expensive operations
const cache = new Map();

function expensiveOperation(input) {
  if (cache.has(input)) {
    return cache.get(input);
  }
  
  const result = doExpensiveWork(input);
  cache.set(input, result);
  return result;
}
```

## Maintenance Tasks

### Regular Tasks

1. **Weekly**
   - Review open issues
   - Check for security advisories
   - Run full test suite

2. **Monthly**
   - Update dependencies (if any)
   - Review and update documentation
   - Check code coverage

3. **Quarterly**
   - Security audit
   - Performance profiling
   - Refactoring opportunities

### Version Updates

```bash
# Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Update CHANGELOG.md
# Update RELEASE_NOTES.md
# Create GitHub release
```

## Common Patterns

### Validation Pattern

```javascript
function validateInput(input) {
  // 1. Type check
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }
  
  // 2. Null/empty check
  if (!input || input.trim() === '') {
    throw new ValidationError('Input cannot be empty');
  }
  
  // 3. Format validation
  if (!VALID_PATTERN.test(input)) {
    throw new ValidationError('Input format is invalid');
  }
  
  // 4. Security check
  if (containsDangerousChars(input)) {
    throw new SecurityError('Input contains dangerous characters');
  }
  
  return input;
}
```

### Async Operation Pattern

```javascript
async function performOperation() {
  let resource = null;
  
  try {
    // 1. Acquire resource
    resource = await acquireResource();
    
    // 2. Perform operation
    const result = await doWork(resource);
    
    // 3. Return result
    return result;
  } catch (error) {
    // 4. Handle error
    console.error(`Operation failed: ${error.message}`);
    throw error;
  } finally {
    // 5. Cleanup
    if (resource) {
      await releaseResource(resource);
    }
  }
}
```

### Factory Pattern

```javascript
function createScanner(fileExtension) {
  const scanners = {
    '.js': javascriptScanner,
    '.py': pythonScanner,
    '.go': goScanner,
    '.rb': rubyScanner,
    '.rs': rustScanner,
    '.sh': shellScanner
  };
  
  const scanner = scanners[fileExtension];
  
  if (!scanner) {
    throw new Error(`No scanner for extension: ${fileExtension}`);
  }
  
  return scanner;
}
```

## Debugging

### Debug Mode

```javascript
const DEBUG = process.env.DEBUG === 'true';

function debugLog(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Usage
debugLog('Scanning file:', filePath);
```

### Verbose Output

```javascript
if (options.verbose) {
  console.log(`Found ${files.length} files to scan`);
  console.log(`Using ${concurrency} concurrent workers`);
}
```

## Accessibility

### CLI Output

```javascript
// ✅ Good - Clear, structured output
console.log('✅ Analysis complete');
console.log('');
console.log('Missing variables: 3');
console.log('  - API_KEY');
console.log('  - DATABASE_URL');
console.log('  - SECRET_TOKEN');

// ❌ Bad - Unclear output
console.log('done');
console.log('missing: API_KEY,DATABASE_URL,SECRET_TOKEN');
```

### Color Support

```javascript
// Respect --no-color flag
function colorize(text, color) {
  if (options.noColor) {
    return text;
  }
  return `\x1b[${color}m${text}\x1b[0m`;
}
```

## Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

## Questions?

For questions about code quality or maintainability:
- Open a GitHub issue
- Check existing documentation
- Review similar code in the codebase
