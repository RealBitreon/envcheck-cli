# Architecture

## Overview

envcheck-cli is designed as a modular, zero-dependency CLI tool that scans codebases for environment variable usage and validates them against `.env.example` files.

## Core Principles

1. **Zero Dependencies** - Uses only Node.js built-in modules
2. **Language Agnostic** - Pluggable scanner architecture for multi-language support
3. **Fast & Efficient** - Minimal file I/O, efficient parsing
4. **CI/CD Ready** - Designed for automation and integration

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Entry                            │
│                     (bin/envcheck.js)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Main Scanner                            │
│                    (src/scanner.js)                          │
│  • Orchestrates scanning process                            │
│  • Manages file discovery                                   │
│  • Coordinates language scanners                            │
└──────────────┬───────────────────────────┬──────────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────┐   ┌─────────────────────────────┐
│   Ignore Handler         │   │   Language Scanners         │
│   (src/ignore.js)        │   │   (src/scanners/*.js)       │
│  • Parses .gitignore     │   │  • JavaScript/TypeScript    │
│  • Filters files         │   │  • Python                   │
└──────────────────────────┘   │  • Go                       │
                               │  • Ruby                     │
                               │  • Rust                     │
                               │  • Shell                    │
                               └──────────────┬──────────────┘
                                              │
                                              ▼
                               ┌──────────────────────────────┐
                               │   .env Parser                │
                               │   (src/parser.js)            │
                               │  • Parses .env.example       │
                               │  • Extracts variables        │
                               │  • Validates comments        │
                               └──────────────────────────────┘
```

## Component Details

### CLI Entry (`bin/envcheck.js`)
- Parses command-line arguments
- Handles output formatting (text, JSON, GitHub Actions)
- Manages exit codes for CI/CD integration

### Main Scanner (`src/scanner.js`)
- Discovers files based on language extensions
- Respects .gitignore patterns
- Delegates to language-specific scanners
- Aggregates results

### Language Scanners (`src/scanners/*.js`)
Each scanner implements a simple interface:
```javascript
export function scan(content) {
  // Returns array of env var names found in content
  return ['VAR1', 'VAR2'];
}
```

Scanners use regex patterns to detect:
- `process.env.VAR_NAME` (JavaScript/TypeScript)
- `os.environ['VAR_NAME']` (Python)
- `ENV['VAR_NAME']` (Ruby)
- `os::env::var("VAR_NAME")` (Rust)
- `os.Getenv("VAR_NAME")` (Go)
- `$VAR_NAME` (Shell)

### .env Parser (`src/parser.js`)
- Parses `.env.example` files
- Extracts variable names and inline comments
- Validates documentation requirements

### Ignore Handler (`src/ignore.js`)
- Parses `.gitignore` syntax
- Filters files during scanning
- Improves performance by skipping irrelevant files

## Data Flow

1. CLI receives command and options
2. Scanner discovers relevant files (respecting .gitignore)
3. Each file is passed to appropriate language scanner
4. Scanners extract env var references
5. Parser reads `.env.example`
6. Results are compared and categorized:
   - MISSING: In code, not in .env.example
   - UNUSED: In .env.example, not in code
   - UNDOCUMENTED: In both, but no comment
7. Output is formatted and displayed
8. Exit code is set based on findings

## Extension Points

### Adding a New Language

1. Create `src/scanners/yourlang.js`
2. Export a `scan(content)` function
3. Add tests in `test/scanners/yourlang.test.js`
4. Update language detection in `src/scanner.js`

### Adding Output Formats

Extend the formatter in `bin/envcheck.js` to support new output formats (XML, SARIF, etc.)

### Custom Validation Rules

Extend the comparison logic in `src/scanner.js` to add custom validation rules beyond MISSING/UNUSED/UNDOCUMENTED.

## Performance Considerations

- Files are read once and cached
- Regex patterns are compiled once
- Scanning is synchronous but fast (no I/O blocking)
- Large files are handled efficiently with streaming where possible
- Parallel file scanning with configurable concurrency (default: 8 workers)
- Memory-efficient line-by-line processing for large files
- Target: <2s for 10,000 files, <500MB memory usage

## Security

- No code execution - only static analysis
- No network calls
- No file writes (read-only operations)
- No external dependencies to audit
- Path traversal prevention through validation
- Non-backtracking regex patterns to prevent ReDoS attacks

## Architecture Decisions

### ADR-001: Zero Dependencies

**Context**: Modern Node.js projects often have hundreds of dependencies, creating security and maintenance burdens.

**Decision**: Use only Node.js built-in modules (fs, path, util, readline, etc.).

**Consequences**:
- ✅ No supply chain attacks from compromised packages
- ✅ Faster installation and smaller package size
- ✅ No dependency version conflicts
- ✅ Easier to audit and maintain
- ❌ More code to write for common utilities
- ❌ Cannot leverage popular libraries like chalk, glob, etc.

**Status**: Accepted and enforced

### ADR-002: Regex-Based Pattern Matching

**Context**: We need to detect environment variable usage across multiple languages.

**Decision**: Use language-specific regex patterns instead of AST parsing.

**Consequences**:
- ✅ Fast and lightweight (no parser dependencies)
- ✅ Works across all languages without language-specific parsers
- ✅ Simple to add new language support
- ✅ No need to understand language syntax trees
- ❌ May produce false positives in edge cases
- ❌ Cannot detect complex usage patterns (e.g., dynamic variable names)
- ❌ Limited to string literal patterns

**Status**: Accepted

**Alternatives Considered**:
- AST parsing: Too heavy, requires language-specific parsers
- Static analysis tools: Would require external dependencies

### ADR-003: ES Modules Over CommonJS

**Context**: Node.js supports both CommonJS (require) and ES modules (import/export).

**Decision**: Use ES modules exclusively.

**Consequences**:
- ✅ Modern JavaScript standard
- ✅ Better tree-shaking and optimization
- ✅ Top-level await support
- ✅ Clearer import/export syntax
- ❌ Requires Node.js 18+ (drops support for older versions)
- ❌ Cannot use some older CommonJS-only packages

**Status**: Accepted

**Minimum Version**: Node.js 18.0.0

### ADR-004: Streaming File Reads

**Context**: Large files can consume significant memory if read entirely into memory.

**Decision**: Use streaming line-by-line reads for file scanning.

**Consequences**:
- ✅ Constant memory usage regardless of file size
- ✅ Can handle files larger than available RAM
- ✅ Better performance for large codebases
- ❌ Slightly more complex code
- ❌ Cannot use simple string operations on entire file

**Status**: Accepted

**Implementation**: Uses `readline.createInterface()` with `fs.createReadStream()`

### ADR-005: Parallel File Scanning

**Context**: Scanning thousands of files sequentially is slow.

**Decision**: Implement concurrent file scanning with configurable worker pool.

**Consequences**:
- ✅ Significant performance improvement (3-5x faster)
- ✅ Configurable concurrency via environment variable
- ✅ Efficient CPU utilization
- ❌ More complex error handling
- ❌ Potential race conditions (mitigated with proper design)

**Status**: Accepted

**Configuration**: `ENVCHECK_SCAN_CONCURRENCY` environment variable (default: 8)

### ADR-006: Exit Code Convention

**Context**: CI/CD systems rely on exit codes to determine success/failure.

**Decision**: Use standard Unix exit code convention:
- 0: Success (no issues or issues don't match --fail-on)
- 1: Validation failed (issues match --fail-on condition)
- 2: Error (invalid arguments, file not found, etc.)

**Consequences**:
- ✅ Standard Unix convention
- ✅ Clear distinction between validation failure and errors
- ✅ Easy CI/CD integration
- ✅ Predictable behavior

**Status**: Accepted

### ADR-007: Three-Category Issue Classification

**Context**: Environment variable issues can be categorized in different ways.

**Decision**: Use three categories: MISSING, UNUSED, UNDOCUMENTED.

**Consequences**:
- ✅ Clear and intuitive categories
- ✅ Each category has distinct severity and action
- ✅ Covers all common scenarios
- ❌ Doesn't cover all edge cases (e.g., typos, deprecated vars)

**Status**: Accepted

**Rationale**:
- MISSING: Critical - breaks application
- UNUSED: Warning - clutters configuration
- UNDOCUMENTED: Info - reduces maintainability

### ADR-008: Multiple Output Formats

**Context**: Different use cases require different output formats.

**Decision**: Support text (human), JSON (machine), and GitHub Actions (CI/CD) formats.

**Consequences**:
- ✅ Flexible for different use cases
- ✅ Easy CI/CD integration
- ✅ Machine-readable output for tooling
- ❌ More code to maintain
- ❌ Need to keep formats in sync

**Status**: Accepted

**Formats**:
- `text`: Human-readable with colors and emojis
- `json`: Machine-readable structured data
- `github`: GitHub Actions workflow commands

### ADR-009: Ignore Pattern Compatibility

**Context**: Users already have .gitignore files with ignore patterns.

**Decision**: Support .gitignore syntax and reuse existing .gitignore files.

**Consequences**:
- ✅ No need to duplicate ignore patterns
- ✅ Familiar syntax for users
- ✅ Respects existing project conventions
- ❌ Need to implement glob pattern matching
- ❌ Some .gitignore features may not be supported

**Status**: Accepted

**Additional**: Also support .envcheckignore for tool-specific patterns

### ADR-010: Modular Scanner Architecture

**Context**: Need to support multiple programming languages.

**Decision**: Use pluggable scanner architecture where each language has its own scanner module.

**Consequences**:
- ✅ Easy to add new language support
- ✅ Clear separation of concerns
- ✅ Each scanner can be tested independently
- ✅ Scanners can be contributed by community
- ❌ Need to maintain consistent scanner interface

**Status**: Accepted

**Interface**: Each scanner exports `scan()`, `scanLine()`, `getPatterns()`, `getSupportedExtensions()`
