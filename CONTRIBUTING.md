# Contributing to envcheck-cli

First off, thanks for considering contributing! This project was born from a sofa-based epiphany fueled by lukewarm coffee, and it can only get better with your help.

## The Vibe

This is a zero-dependency project, and we'd like to keep it that way. If your PR adds a dependency, it better be solving world hunger or at least preventing a production incident. Otherwise, let's stick to Node.js built-ins.

## How to Contribute

### Reporting Bugs

Found a bug? That's actually helpful, not annoying. Open an issue with:

- What you expected to happen
- What actually happened
- Steps to reproduce (bonus points for a minimal example)
- Your Node.js version (`node --version`)

### Suggesting Features

Got an idea? Cool. Open an issue and tell us:

- What problem you're trying to solve
- How you envision it working
- Why it would be useful to others (not just your specific use case)

### Adding Language Support

Want to add support for a new language? Awesome! Here's what you need:

1. Create a scanner in `src/scanners/yourlanguage.js`
2. Implement the scanner interface (see below)
3. Add comprehensive tests in `test/scanners/yourlanguage.test.js`
4. Register your scanner in `src/cli.js`
5. Update `src/scanner.js` to include your file extensions
6. Add your language to the README

**Scanner Interface:**

```javascript
export function scan(content, filePath) { }
export function scanLine(line, filePath, lineNumber) { }
export function getSupportedExtensions() { }
export function getPatterns() { }
```

**Detailed Guide**: See [docs/ADDING_LANGUAGE_SCANNERS.md](docs/ADDING_LANGUAGE_SCANNERS.md) for a complete step-by-step guide with examples.

**Quick Examples:**
- Simple: `src/scanners/go.js`
- Complex: `src/scanners/python.js`
- Advanced: `src/scanners/rust.js`

### Pull Request Process

1. Fork the repo
2. Create a branch (`git checkout -b feature/amazing-thing`)
3. Make your changes
4. Run the tests (`npm test`) - they should all pass
5. Commit with a clear message explaining what and why
6. Push and open a PR

### Code Style

- Use modern JavaScript (ES modules, async/await, etc.)
- Keep functions small and focused
- Add comments for non-obvious logic
- Write tests for new features
- No dependencies (yes, we're serious about this)

### Testing

We use Node.js's built-in test runner. Run tests with:

```bash
npm test
```

All tests must pass before your PR can be merged. If you're adding a feature, add tests. If you're fixing a bug, add a test that would have caught it.

**Testing Philosophy:**

1. **Unit Tests**: Test individual functions and modules in isolation
2. **Integration Tests**: Test the complete workflow end-to-end
3. **Property-Based Tests**: Test invariants and properties across many inputs
4. **Edge Case Tests**: Test boundary conditions and error handling

**Test Structure:**

```
test/
├── scanners/          # Language scanner tests
├── formatters/        # Output formatter tests
├── fixtures/          # Test data and sample files
├── *.test.js          # Module-specific tests
└── integration.test.js # End-to-end tests
```

**Writing Good Tests:**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Module Name', () => {
  describe('functionName()', () => {
    it('should handle the happy path', () => {
      const result = functionName('input');
      assert.strictEqual(result, 'expected');
    });

    it('should handle edge cases', () => {
      assert.strictEqual(functionName(''), '');
      assert.strictEqual(functionName(null), null);
    });

    it('should throw on invalid input', () => {
      assert.throws(() => functionName(undefined), /error message/);
    });
  });
});
```

**Test Coverage:**

We aim for >80% test coverage. Check coverage with:

```bash
npm run test:coverage
```

**Testing Guidelines:**

- Test behavior, not implementation
- Use descriptive test names that explain what is being tested
- One assertion per test when possible
- Test edge cases and error conditions
- Use fixtures for complex test data
- Mock external dependencies (file system, network)
- Keep tests fast and independent

## Project Structure

```
envcheck-cli/
├── bin/
│   └── envcheck.js          # CLI entry point
├── src/
│   ├── scanner.js           # Main scanning logic
│   ├── ignore.js            # .gitignore parsing
│   ├── utils.js             # Utility functions
│   └── scanners/            # Language-specific scanners
│       ├── javascript.js
│       ├── python.js
│       ├── go.js
│       ├── ruby.js
│       ├── rust.js
│       └── shell.js
└── test/                    # Tests mirror src/ structure
```

## What We're Looking For

- Bug fixes (always welcome)
- Performance improvements (make it faster!)
- Better error messages (help users help themselves)
- New language support (the more the merrier)
- Documentation improvements (clarity is king)
- Test coverage improvements (catch those edge cases)

## What We're Not Looking For

- Dependencies (we're zero-dependency and proud)
- Breaking changes without discussion
- Features that only work for one specific use case
- Overly complex solutions to simple problems

## Questions?

Open an issue with your question. There are no stupid questions, only undocumented answers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thanks for making envcheck-cli better! May your environment variables always be documented and your coffee always be hot. ☕
