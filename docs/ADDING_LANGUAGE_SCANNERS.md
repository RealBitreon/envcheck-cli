# Adding New Language Scanners

This guide explains how to add support for a new programming language to envcheck-cli.

## Overview

envcheck uses a modular scanner architecture where each language has its own scanner module. Adding a new language involves:

1. Creating a scanner module
2. Defining regex patterns for environment variable detection
3. Writing tests
4. Registering the scanner

## Scanner Interface

Each scanner must export the following functions:

```javascript
/**
 * Scan file content for environment variable references
 * @param {string} content - File content to scan
 * @param {string} filePath - Path to the file being scanned
 * @returns {Array<{varName: string, filePath: string, lineNumber: number, pattern: string}>}
 */
export function scan(content, filePath) { }

/**
 * Scan a single line for environment variable references
 * @param {string} line - Line content to scan
 * @param {string} filePath - Path to the file being scanned
 * @param {number} lineNumber - Line number (1-indexed)
 * @returns {Array<{varName: string, filePath: string, lineNumber: number, pattern: string}>}
 */
export function scanLine(line, filePath, lineNumber) { }

/**
 * Get supported file extensions
 * @returns {string[]}
 */
export function getSupportedExtensions() { }

/**
 * Get regex patterns used for scanning
 * @returns {RegExp[]}
 */
export function getPatterns() { }
```

## Step-by-Step Guide

### Step 1: Create Scanner Module

Create a new file in `src/scanners/` named after your language (e.g., `src/scanners/kotlin.js`):

```javascript
/**
 * Kotlin Scanner
 * Detects environment variable references in Kotlin files
 * Supports: System.getenv("VAR")
 */

/**
 * Regex patterns for detecting environment variable references
 */
const PATTERNS = [
  // System.getenv("VAR_NAME")
  /System\.getenv\("([A-Z_][A-Z0-9_]*)"\)/g,
];

/**
 * Supported file extensions
 */
const SUPPORTED_EXTENSIONS = ['.kt', '.kts'];

/**
 * Scan file content for environment variable references
 */
export function scan(content, filePath) {
  const references = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    references.push(...scanLine(lines[i], filePath, i + 1));
  }

  return references;
}

/**
 * Scan a single line for environment variable references
 */
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
 */
function isValidEnvVarName(varName) {
  return /^[A-Z_][A-Z0-9_]*$/.test(varName);
}

/**
 * Get supported file extensions
 */
export function getSupportedExtensions() {
  return SUPPORTED_EXTENSIONS;
}

/**
 * Get regex patterns used for scanning
 */
export function getPatterns() {
  return PATTERNS;
}
```

### Step 2: Define Regex Patterns

Research how your language accesses environment variables and create regex patterns:

**Common Patterns:**

- **Dot notation**: `process.env.VAR_NAME` → `/process\.env\.([A-Z_][A-Z0-9_]*)/g`
- **Bracket notation**: `ENV['VAR_NAME']` → `/ENV\[['"]([A-Z_][A-Z0-9_]*)['"]]/g`
- **Function calls**: `getenv("VAR_NAME")` → `/getenv\("([A-Z_][A-Z0-9_]*)"\)/g`

**Pattern Guidelines:**

1. Use capturing groups `()` to extract the variable name
2. Match uppercase variable names: `[A-Z_][A-Z0-9_]*`
3. Use global flag `/g` for multiple matches per line
4. Escape special regex characters: `.` → `\.`, `[` → `\[`
5. Support both single and double quotes where applicable

**Example Patterns:**

```javascript
// Python
/os\.environ\[['"]([A-Z_][A-Z0-9_]*)['"]]/g
/os\.getenv\(['"]([A-Z_][A-Z0-9_]*)['"]]/g

// Ruby
/ENV\[['"]([A-Z_][A-Z0-9_]*)['"]]/g
/ENV\.fetch\(['"]([A-Z_][A-Z0-9_]*)['"]]/g

// Go
/os\.Getenv\("([A-Z_][A-Z0-9_]*)"\)/g

// Rust
/env::var\("([A-Z_][A-Z0-9_]*)"\)/g
/std::env::var\("([A-Z_][A-Z0-9_]*)"\)/g
```

### Step 3: Write Tests

Create a test file in `test/scanners/` (e.g., `test/scanners/kotlin.test.js`):

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scan, scanLine, getSupportedExtensions, getPatterns } from '../../src/scanners/kotlin.js';

describe('Kotlin Scanner', () => {
  describe('scanLine()', () => {
    it('should detect System.getenv() calls', () => {
      const line = 'val dbUrl = System.getenv("DATABASE_URL")';
      const result = scanLine(line, 'test.kt', 1);
      
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[0].lineNumber, 1);
      assert.strictEqual(result[0].pattern, 'System.getenv("DATABASE_URL")');
    });

    it('should handle multiple variables on one line', () => {
      const line = 'val config = Config(System.getenv("API_KEY"), System.getenv("API_SECRET"))';
      const result = scanLine(line, 'test.kt', 1);
      
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'API_KEY');
      assert.strictEqual(result[1].varName, 'API_SECRET');
    });

    it('should ignore lowercase variables', () => {
      const line = 'val path = System.getenv("path")';
      const result = scanLine(line, 'test.kt', 1);
      
      assert.strictEqual(result.length, 0);
    });

    it('should ignore comments', () => {
      const line = '// System.getenv("DATABASE_URL")';
      const result = scanLine(line, 'test.kt', 1);
      
      assert.strictEqual(result.length, 0);
    });
  });

  describe('scan()', () => {
    it('should scan multi-line content', () => {
      const content = `
        val dbUrl = System.getenv("DATABASE_URL")
        val apiKey = System.getenv("API_KEY")
      `;
      const result = scan(content, 'test.kt');
      
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
    });
  });

  describe('getSupportedExtensions()', () => {
    it('should return Kotlin file extensions', () => {
      const extensions = getSupportedExtensions();
      assert.ok(extensions.includes('.kt'));
      assert.ok(extensions.includes('.kts'));
    });
  });

  describe('getPatterns()', () => {
    it('should return regex patterns', () => {
      const patterns = getPatterns();
      assert.ok(Array.isArray(patterns));
      assert.ok(patterns.length > 0);
      assert.ok(patterns[0] instanceof RegExp);
    });
  });
});
```

**Test Coverage Checklist:**

- ✅ Basic pattern detection
- ✅ Multiple variables on one line
- ✅ Multi-line content
- ✅ Edge cases (comments, strings, lowercase)
- ✅ File extensions
- ✅ Pattern export

### Step 4: Register Scanner

Update `src/cli.js` to register your scanner in the `scanFilesForEnvVars()` function:

```javascript
// Add import at the top
const ktScanner = await import('./scanners/kotlin.js');

// Add to scannersByExtension map
const scannersByExtension = new Map([
  // ... existing scanners
  ['.kt', ktScanner],
  ['.kts', ktScanner],
]);
```

### Step 5: Update Scanner Module

Update `src/scanner.js` to include your file extensions in `getSupportedExtensions()`:

```javascript
export function getSupportedExtensions() {
  return [
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',  // JavaScript/TypeScript
    '.py',                                          // Python
    '.go',                                          // Go
    '.rb',                                          // Ruby
    '.rs',                                          // Rust
    '.sh', '.bash', '.zsh',                         // Shell/Bash
    '.kt', '.kts',                                  // Kotlin (NEW)
  ];
}
```

### Step 6: Test Your Scanner

Run the tests:

```bash
npm test test/scanners/kotlin.test.js
```

Test with a real file:

```bash
# Create a test Kotlin file
echo 'val dbUrl = System.getenv("DATABASE_URL")' > test.kt

# Run envcheck
node bin/envcheck.js . --env-file .env.example
```

### Step 7: Update Documentation

Add your language to the README.md:

```markdown
## Supported Languages

- JavaScript/TypeScript (Node.js, Vite, etc.)
- Python
- Go
- Ruby
- Rust
- Shell/Bash
- Kotlin ✨ NEW
```

## Advanced Patterns

### Handling Multiple Quote Styles

```javascript
// Support both single and double quotes
/getenv\(['"]([A-Z_][A-Z0-9_]*)['"]]/g
```

### Handling Optional Parameters

```javascript
// Match with or without default values
// os.getenv('VAR') or os.getenv('VAR', 'default')
/os\.getenv\(['"]([A-Z_][A-Z0-9_]*)['"](?:,.*?)?\)/g
```

### Avoiding False Positives

```javascript
// Use negative lookbehind to avoid matching within larger patterns
// Matches env::var but not std::env::var
/(?<!std::)env::var\("([A-Z_][A-Z0-9_]*)"\)/g
```

### Handling Namespace Variations

```javascript
// Match both short and full namespace forms
/env::var\("([A-Z_][A-Z0-9_]*)"\)/g,
/std::env::var\("([A-Z_][A-Z0-9_]*)"\)/g,
```

## Common Pitfalls

### 1. Forgetting the Global Flag

❌ **Wrong**: `/pattern/` - Only matches first occurrence
✅ **Correct**: `/pattern/g` - Matches all occurrences

### 2. Not Escaping Special Characters

❌ **Wrong**: `/process.env.VAR/` - `.` matches any character
✅ **Correct**: `/process\.env\.VAR/` - Escaped dots

### 3. Capturing Too Much

❌ **Wrong**: `/getenv\("(.*)"\)/` - Captures everything including quotes
✅ **Correct**: `/getenv\("([A-Z_][A-Z0-9_]*)"\)/` - Captures only variable name

### 4. Not Validating Variable Names

Always validate that captured names match the pattern `^[A-Z_][A-Z0-9_]*$`:

```javascript
if (varName && isValidEnvVarName(varName)) {
  references.push({ varName, filePath, lineNumber, pattern: match[0] });
}
```

### 5. Forgetting Line Numbers

Line numbers should be 1-indexed (first line is 1, not 0):

```javascript
for (let i = 0; i < lines.length; i++) {
  references.push(...scanLine(lines[i], filePath, i + 1)); // i + 1
}
```

## Testing Tips

### Test with Real Code

Create realistic test cases from actual code:

```javascript
it('should detect env vars in real Kotlin code', () => {
  const code = `
    class DatabaseConfig {
      private val url = System.getenv("DATABASE_URL")
        ?: throw IllegalStateException("DATABASE_URL not set")
      
      private val username = System.getenv("DB_USERNAME")
      private val password = System.getenv("DB_PASSWORD")
    }
  `;
  const result = scan(code, 'DatabaseConfig.kt');
  assert.strictEqual(result.length, 3);
});
```

### Test Edge Cases

```javascript
it('should handle edge cases', () => {
  // Comments
  assert.strictEqual(scanLine('// System.getenv("VAR")', 'test.kt', 1).length, 0);
  
  // Strings
  assert.strictEqual(scanLine('val str = "System.getenv(\\"VAR\\")"', 'test.kt', 1).length, 0);
  
  // Lowercase
  assert.strictEqual(scanLine('System.getenv("lowercase")', 'test.kt', 1).length, 0);
  
  // Empty
  assert.strictEqual(scanLine('', 'test.kt', 1).length, 0);
});
```

### Use Test Fixtures

Create sample files in `test/fixtures/`:

```
test/fixtures/kotlin/
  ├── basic.kt
  ├── complex.kt
  └── edge-cases.kt
```

## Language-Specific Considerations

### Compiled Languages (Go, Rust, Kotlin)

- Usually have explicit function calls: `os.Getenv()`, `env::var()`
- Type-safe, so patterns are more predictable
- Less likely to have dynamic variable names

### Scripting Languages (Python, Ruby, Shell)

- May have multiple ways to access env vars
- More flexible syntax (single/double quotes, bracket/dot notation)
- Higher chance of false positives

### Shell Scripts

- Very common to use variables: `$VAR`, `${VAR}`
- Need to filter out special variables: `$1`, `$?`, `$@`
- More prone to false positives

## Contributing Your Scanner

Once your scanner is complete:

1. Run all tests: `npm test`
2. Update documentation (README, this guide)
3. Create a pull request with:
   - Scanner implementation
   - Tests with good coverage
   - Documentation updates
   - Example usage

## Examples from Existing Scanners

### Simple Scanner (Go)

```javascript
const PATTERNS = [
  /os\.Getenv\("([A-Z_][A-Z0-9_]*)"\)/g,
  /os\.LookupEnv\("([A-Z_][A-Z0-9_]*)"\)/g,
];
```

### Complex Scanner (Python)

```javascript
const PATTERNS = [
  /os\.environ\[['"]([A-Z_][A-Z0-9_]*)['"]]/g,
  /os\.environ\.get\(['"]([A-Z_][A-Z0-9_]*)['"](?:,.*?)?\)/g,
  /os\.getenv\(['"]([A-Z_][A-Z0-9_]*)['"](?:,.*?)?\)/g,
];
```

### Advanced Scanner (Rust)

```javascript
const PATTERNS = [
  /std::env::var\("([A-Z_][A-Z0-9_]*)"\)/g,
  /std::env::var_os\("([A-Z_][A-Z0-9_]*)"\)/g,
  /(?<!std::)env::var\("([A-Z_][A-Z0-9_]*)"\)/g,
  /(?<!std::)env::var_os\("([A-Z_][A-Z0-9_]*)"\)/g,
];
```

## Resources

- [MDN: Regular Expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
- [Regex101](https://regex101.com/) - Test your patterns
- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [envcheck GitHub](https://github.com/yourusername/envcheck-cli)

## Need Help?

- Open an issue on GitHub
- Check existing scanners for examples
- Ask in discussions

Happy scanning! 🔍
