# Testing Guide

This document describes the testing approach and practices for envcheck-cli.

## Testing Philosophy

envcheck-cli uses a comprehensive testing strategy with three types of tests:

1. **Unit Tests**: Test individual functions and modules in isolation
2. **Integration Tests**: Test the complete workflow end-to-end
3. **Property-Based Tests**: Test invariants and properties across many inputs

## Test Structure

```
test/
├── scanners/              # Language scanner unit tests
│   ├── javascript.test.js
│   ├── python.test.js
│   ├── go.test.js
│   ├── ruby.test.js
│   ├── rust.test.js
│   └── shell.test.js
├── formatters/            # Output formatter unit tests
│   ├── text.test.js
│   ├── json.test.js
│   └── github.test.js
├── fixtures/              # Test data and sample files
│   ├── samples/           # Basic .env.example files
│   ├── multi-lang/        # Multi-language test project
│   ├── edge-cases/        # Edge case test files
│   └── large-codebase/    # Performance test data
├── analyzer.test.js       # Issue analyzer unit tests
├── parser.test.js         # .env parser unit tests
├── scanner.test.js        # File scanner unit tests
├── ignore.test.js         # Ignore pattern unit tests
├── utils.test.js          # Utility function unit tests
├── cli.test.js            # CLI argument parsing tests
├── integration.test.js    # End-to-end integration tests
├── analyzer.property.test.js  # Property-based tests
└── error-handling.test.js # Error handling tests
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test test/scanners/javascript.test.js
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Unit Testing

Unit tests verify that individual functions work correctly in isolation.

### Example: Testing a Scanner

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scan, scanLine } from '../../src/scanners/javascript.js';

describe('JavaScript Scanner', () => {
  describe('scanLine()', () => {
    it('should detect process.env.VAR_NAME', () => {
      const line = 'const dbUrl = process.env.DATABASE_URL;';
      const result = scanLine(line, 'test.js', 1);
      
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[0].lineNumber, 1);
      assert.strictEqual(result[0].filePath, 'test.js');
    });

    it('should detect multiple variables on one line', () => {
      const line = 'const config = { key: process.env.API_KEY, secret: process.env.API_SECRET };';
      const result = scanLine(line, 'test.js', 1);
      
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'API_KEY');
      assert.strictEqual(result[1].varName, 'API_SECRET');
    });

    it('should ignore lowercase variables', () => {
      const line = 'const path = process.env.path;';
      const result = scanLine(line, 'test.js', 1);
      
      assert.strictEqual(result.length, 0);
    });
  });
});
```

### Testing Best Practices

**1. Test One Thing Per Test**

❌ **Bad**: Testing multiple behaviors in one test
```javascript
it('should work correctly', () => {
  assert.strictEqual(parse('VAR=value'), { varName: 'VAR' });
  assert.strictEqual(parse('VAR='), { varName: 'VAR' });
  assert.strictEqual(parse(''), null);
});
```

✅ **Good**: Separate tests for each behavior
```javascript
it('should parse variable with value', () => {
  assert.strictEqual(parse('VAR=value'), { varName: 'VAR' });
});

it('should parse variable without value', () => {
  assert.strictEqual(parse('VAR='), { varName: 'VAR' });
});

it('should return null for empty line', () => {
  assert.strictEqual(parse(''), null);
});
```

**2. Use Descriptive Test Names**

Test names should clearly describe what is being tested:

```javascript
// Good test names
it('should detect process.env.VAR_NAME in JavaScript files')
it('should ignore variables in comments')
it('should handle Windows CRLF line endings')
it('should throw error when file not found')
```

**3. Test Edge Cases**

Always test boundary conditions and edge cases:

```javascript
describe('parseEnvLine()', () => {
  it('should handle empty lines', () => { });
  it('should handle lines with only whitespace', () => { });
  it('should handle lines with only comments', () => { });
  it('should handle variables with no value', () => { });
  it('should handle variables with empty value', () => { });
  it('should handle very long lines', () => { });
  it('should handle special characters in values', () => { });
  it('should handle Unicode characters', () => { });
});
```

**4. Test Error Conditions**

Test that errors are thrown correctly:

```javascript
it('should throw error when file not found', () => {
  assert.rejects(
    async () => await parseEnvFile('/nonexistent/file'),
    /Environment file not found/
  );
});

it('should throw error on invalid format', () => {
  assert.throws(
    () => validateFormat('invalid'),
    /Invalid format/
  );
});
```

## Integration Testing

Integration tests verify that the entire system works correctly end-to-end.

### Example: End-to-End Test

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { run } from '../src/cli.js';
import { writeFileSync, unlinkSync } from 'fs';

describe('Integration Tests', () => {
  it('should detect missing variables', async () => {
    // Setup: Create test files
    writeFileSync('test-app.js', 'const db = process.env.DATABASE_URL;');
    writeFileSync('.env.example', 'API_KEY=\n');

    // Execute
    const exitCode = await run(['.', '--format', 'json', '--fail-on', 'missing']);

    // Assert
    assert.strictEqual(exitCode, 1); // Should fail due to missing DATABASE_URL

    // Cleanup
    unlinkSync('test-app.js');
    unlinkSync('.env.example');
  });

  it('should pass when all variables are defined', async () => {
    // Setup
    writeFileSync('test-app.js', 'const key = process.env.API_KEY;');
    writeFileSync('.env.example', 'API_KEY= # API key\n');

    // Execute
    const exitCode = await run(['.', '--fail-on', 'all']);

    // Assert
    assert.strictEqual(exitCode, 0); // Should pass

    // Cleanup
    unlinkSync('test-app.js');
    unlinkSync('.env.example');
  });
});
```

### Integration Test Patterns

**1. Use Test Fixtures**

Create reusable test data in `test/fixtures/`:

```javascript
it('should scan multi-language project', async () => {
  const exitCode = await run(['test/fixtures/multi-lang', '--format', 'json']);
  assert.strictEqual(exitCode, 0);
});
```

**2. Test Different Output Formats**

```javascript
describe('Output Formats', () => {
  it('should output text format', async () => { });
  it('should output JSON format', async () => { });
  it('should output GitHub Actions format', async () => { });
});
```

**3. Test CLI Flags**

```javascript
describe('CLI Flags', () => {
  it('should respect --fail-on missing', async () => { });
  it('should respect --fail-on unused', async () => { });
  it('should respect --fail-on all', async () => { });
  it('should respect --no-color', async () => { });
  it('should respect --quiet', async () => { });
});
```

## Property-Based Testing

Property-based tests verify that certain properties hold true across many randomly generated inputs.

### Example: Property Test

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeIssues } from '../src/analyzer.js';

describe('Analyzer Properties', () => {
  it('should maintain mutual exclusivity of categories', () => {
    // Generate random test data
    for (let i = 0; i < 100; i++) {
      const references = generateRandomReferences();
      const definitions = generateRandomDefinitions();
      
      const result = analyzeIssues(references, definitions);
      
      // Property: No variable should appear in multiple categories
      const allVars = [
        ...result.missing.map(m => m.varName),
        ...result.unused.map(u => u.varName),
        ...result.undocumented.map(u => u.varName),
      ];
      
      const uniqueVars = new Set(allVars);
      assert.strictEqual(allVars.length, uniqueVars.size, 'Variables should not appear in multiple categories');
    }
  });

  it('should maintain accurate summary counts', () => {
    for (let i = 0; i < 100; i++) {
      const references = generateRandomReferences();
      const definitions = generateRandomDefinitions();
      
      const result = analyzeIssues(references, definitions);
      
      // Property: Summary counts should match array lengths
      assert.strictEqual(result.summary.totalMissing, result.missing.length);
      assert.strictEqual(result.summary.totalUnused, result.unused.length);
      assert.strictEqual(result.summary.totalUndocumented, result.undocumented.length);
    }
  });
});
```

### Properties to Test

**Invariants:**
- No variable appears in multiple categories
- Summary counts match array lengths
- All referenced variables are accounted for
- Variable names match the pattern `^[A-Z_][A-Z0-9_]*$`

**Idempotency:**
- Running analysis twice produces same results
- Order of inputs doesn't affect output

**Reversibility:**
- If a variable is missing, adding it to .env.example removes it from missing

## Test Fixtures

Test fixtures provide realistic test data for integration tests.

### Fixture Structure

```
test/fixtures/
├── samples/
│   ├── basic.env.example          # Simple .env file
│   ├── documented.env.example     # All variables documented
│   ├── undocumented.env.example   # No comments
│   └── mixed.env.example          # Mix of documented/undocumented
├── multi-lang/
│   ├── .env.example
│   ├── app.js                     # JavaScript
│   ├── main.py                    # Python
│   ├── main.go                    # Go
│   ├── config.rb                  # Ruby
│   ├── main.rs                    # Rust
│   └── deploy.sh                  # Shell
├── edge-cases/
│   ├── empty.env.example          # Empty file
│   ├── comments-only.env.example  # Only comments
│   ├── malformed.env.example      # Invalid syntax
│   ├── unicode-and-special.js     # Unicode characters
│   ├── windows-crlf.js            # Windows line endings
│   └── large-file.js              # Large file (performance)
└── large-codebase/
    ├── .env.example
    └── src/                       # Many files for performance testing
```

### Creating Fixtures

```javascript
// test/fixtures/samples/basic.env.example
DATABASE_URL=postgres://localhost:5432/db # Database connection
API_KEY= # API key for external service
LOG_LEVEL=info
```

```javascript
// test/fixtures/multi-lang/app.js
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;
```

## Performance Testing

Test that performance targets are met:

```javascript
describe('Performance', () => {
  it('should scan 10,000 files in under 2 seconds', async () => {
    const startTime = Date.now();
    await run(['test/fixtures/large-codebase']);
    const duration = Date.now() - startTime;
    
    assert.ok(duration < 2000, `Scan took ${duration}ms, expected <2000ms`);
  });

  it('should use less than 500MB memory', async () => {
    const before = process.memoryUsage().heapUsed;
    await run(['test/fixtures/large-codebase']);
    const after = process.memoryUsage().heapUsed;
    const used = (after - before) / 1024 / 1024;
    
    assert.ok(used < 500, `Used ${used}MB, expected <500MB`);
  });
});
```

## Error Handling Tests

Test that errors are handled gracefully:

```javascript
describe('Error Handling', () => {
  it('should handle file not found', async () => {
    const exitCode = await run(['/nonexistent/path']);
    assert.strictEqual(exitCode, 2);
  });

  it('should handle permission denied', async () => {
    // Create file with no read permissions
    writeFileSync('no-read.js', 'test');
    chmodSync('no-read.js', 0o000);
    
    const exitCode = await run(['.']);
    assert.strictEqual(exitCode, 0); // Should continue despite error
    
    // Cleanup
    chmodSync('no-read.js', 0o644);
    unlinkSync('no-read.js');
  });

  it('should handle malformed .env.example', async () => {
    writeFileSync('.env.example', 'INVALID LINE WITHOUT EQUALS');
    const exitCode = await run(['.']);
    assert.strictEqual(exitCode, 0); // Should skip invalid lines
    unlinkSync('.env.example');
  });
});
```

## Mocking and Stubbing

For tests that interact with external systems, use mocks:

```javascript
import { mock } from 'node:test';

describe('File System Mocking', () => {
  it('should handle file read errors', async () => {
    // Mock fs.readFile to throw an error
    const originalReadFile = fs.readFile;
    fs.readFile = mock.fn(() => {
      throw new Error('EACCES: permission denied');
    });

    // Test error handling
    await assert.rejects(
      async () => await parseEnvFile('test.env'),
      /permission denied/
    );

    // Restore original function
    fs.readFile = originalReadFile;
  });
});
```

## Continuous Integration

Tests run automatically on every commit via GitHub Actions:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Test Coverage Goals

- **Overall**: >80% coverage
- **Critical paths**: 100% coverage (parsers, analyzers)
- **Edge cases**: All known edge cases covered
- **Error handling**: All error paths tested

## Debugging Tests

### Run Single Test

```bash
npm test -- --grep "should detect process.env"
```

### Add Debug Output

```javascript
it('should work', () => {
  const result = myFunction('input');
  console.log('Debug:', result); // Add debug output
  assert.strictEqual(result, 'expected');
});
```

### Use Node.js Debugger

```bash
node --inspect-brk node_modules/.bin/node test/my.test.js
```

## Writing Testable Code

**1. Keep Functions Pure**

Pure functions are easier to test:

```javascript
// Good: Pure function
function analyzeIssues(references, definitions) {
  // No side effects, deterministic
  return { missing, unused, undocumented };
}

// Bad: Impure function
function analyzeIssues() {
  // Reads from global state, has side effects
  const references = globalState.references;
  console.log('Analyzing...');
  return result;
}
```

**2. Inject Dependencies**

Make dependencies explicit:

```javascript
// Good: Dependencies injected
function scanFiles(filePaths, scanner) {
  return filePaths.map(file => scanner.scan(file));
}

// Bad: Hard-coded dependency
function scanFiles(filePaths) {
  return filePaths.map(file => defaultScanner.scan(file));
}
```

**3. Return Values Instead of Side Effects**

```javascript
// Good: Returns value
function formatOutput(result) {
  return JSON.stringify(result);
}

// Bad: Side effect
function formatOutput(result) {
  console.log(JSON.stringify(result));
}
```

## Resources

- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [Node.js Assert](https://nodejs.org/api/assert.html)
- [Property-Based Testing](https://en.wikipedia.org/wiki/Property_testing)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)

## Questions?

If you have questions about testing, open an issue or check existing tests for examples.
