# Test Fixtures

This directory contains test fixtures for the envcheck-cli project. These fixtures are used to test various scenarios and edge cases.

## Directory Structure

### `multi-lang/`
Multi-language project with environment variable usage across different programming languages.

**Files:**
- `main.py` - Python application with os.environ and os.getenv patterns
- `config.rb` - Ruby configuration with ENV patterns
- `config.ts` - TypeScript with process.env and import.meta.env patterns
- `main.rs` - Rust with env::var and std::env::var patterns
- `main.go` - Go with os.Getenv and os.LookupEnv patterns
- `app.js` - JavaScript/Node.js with process.env patterns
- `deploy.sh` - Shell script with $VAR and ${VAR} patterns
- `.env.example` - Sample environment file with documented and undocumented variables

**Purpose:** Test language scanner detection across all supported languages in a single project.

**Expected Results:**
- MISSING: Variables used in code but not in .env.example (SENDGRID_API_KEY, SLACK_WEBHOOK_URL, etc.)
- UNUSED: Variables in .env.example but not used in code (SMTP_* variables)
- UNDOCUMENTED: Variables without comments in .env.example

### `edge-cases/`
Edge cases and unusual patterns that might break parsers.

**Files:**
- `unicode-and-special.js` - Unicode characters, emoji, special chars, long lines
- `special-patterns.js` - Destructuring, template literals, optional chaining
- `special-patterns.py` - F-strings, comprehensions, lambda functions
- `large-file.js` - Large configuration file with 100+ env var references
- `malformed.env.example` - Invalid entries, special characters, edge cases
- `no-comments.env.example` - All variables without comments
- `comments-only.env.example` - File with only comments, no variables
- `empty.env.example` - Empty file
- `ignored.test.js` - File that should be ignored by .envcheckignore
- `windows-crlf.js` - File with Windows CRLF line endings
- `deeply-nested/level1/level2/level3/deep.js` - Deeply nested directory structure
- `.envcheckignore` - Ignore patterns for testing

**Purpose:** Test parser robustness and edge case handling.

### `samples/`
Sample .env.example files with different documentation levels.

**Files:**
- `basic.env.example` - Minimal file with few variables
- `documented.env.example` - All variables have comments
- `undocumented.env.example` - No variables have comments
- `mixed.env.example` - Mix of documented and undocumented

**Purpose:** Test different documentation scenarios.

### `large-codebase/`
Simulated large codebase with multiple modules and services.

**Structure:**
```
large-codebase/
├── .env.example
└── src/
    ├── app.js
    ├── config/
    │   ├── database.js
    │   ├── redis.js
    │   └── aws.js
    ├── services/
    │   ├── auth.js
    │   ├── email.js
    │   └── payment.js
    └── middleware/
        ├── logger.js
        └── cors.js
```

**Purpose:** Test performance and accuracy on realistic project structure.

## Usage in Tests

### Integration Tests
```javascript
import { scan } from '../src/scanner.js';
import { parseEnvFile } from '../src/parser.js';
import { analyzeIssues } from '../src/analyzer.js';

// Test multi-language project
const files = await scan('test/fixtures/multi-lang', []);
const definitions = await parseEnvFile('test/fixtures/multi-lang/.env.example');
const issues = analyzeIssues(references, definitions);
```

### Edge Case Tests
```javascript
// Test malformed .env file
const defs = await parseEnvFile('test/fixtures/edge-cases/malformed.env.example');
// Should skip invalid entries gracefully

// Test empty file
const empty = await parseEnvFile('test/fixtures/edge-cases/empty.env.example');
// Should return empty array

// Test ignore patterns
const files = await scan('test/fixtures/edge-cases', ['*.test.js']);
// Should exclude ignored.test.js
```

### Performance Tests
```javascript
// Test large codebase
const start = Date.now();
const files = await scan('test/fixtures/large-codebase', []);
const duration = Date.now() - start;
// Should complete in < 2 seconds
```

## Adding New Fixtures

When adding new test fixtures:

1. Place them in the appropriate subdirectory
2. Update this README with description
3. Add corresponding test cases
4. Ensure fixtures are cross-platform compatible
5. Document expected behavior

## Notes

- All fixtures use relative paths for portability
- Line endings should be LF (Unix) except for windows-crlf.js
- Fixtures should be minimal but representative
- Avoid real secrets or credentials
