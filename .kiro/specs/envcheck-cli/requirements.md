# Requirements Document: envcheck-cli

*Derived from: design.md*

## 1. Functional Requirements

### 1.1 Environment Variable Detection

The system SHALL detect environment variable references in source code files using language-specific pattern matching.

**Acceptance Criteria:**
- 1.1.1 System detects `process.env.VAR_NAME` patterns in JavaScript/TypeScript files
- 1.1.2 System detects `os.environ['VAR_NAME']` and `os.getenv('VAR_NAME')` patterns in Python files
- 1.1.3 System detects `os.Getenv("VAR_NAME")` patterns in Go files
- 1.1.4 System detects `ENV['VAR_NAME']` patterns in Ruby files
- 1.1.5 System detects `env::var("VAR_NAME")` patterns in Rust files
- 1.1.6 System detects `$VAR_NAME` and `${VAR_NAME}` patterns in Shell/Bash files
- 1.1.7 System records file path and line number for each detected reference
- 1.1.8 System extracts variable names matching pattern `^[A-Z_][A-Z0-9_]*$`

### 1.2 .env.example File Parsing

The system SHALL parse .env.example files to extract variable definitions and inline comments.

**Acceptance Criteria:**
- 1.2.1 System parses lines matching pattern `VAR_NAME=value`
- 1.2.2 System extracts inline comments following `#` character
- 1.2.3 System identifies variables with and without comments
- 1.2.4 System skips empty lines and comment-only lines
- 1.2.5 System handles malformed lines gracefully without failing

### 1.3 Issue Categorization

The system SHALL categorize environment variable issues into three types: MISSING, UNUSED, and UNDOCUMENTED.

**Acceptance Criteria:**
- 1.3.1 System identifies MISSING variables (used in code, absent from .env.example)
- 1.3.2 System identifies UNUSED variables (defined in .env.example, never referenced)
- 1.3.3 System identifies UNDOCUMENTED variables (used and defined but no inline comment)
- 1.3.4 System ensures no variable appears in multiple categories
- 1.3.5 System generates summary statistics for each category

### 1.4 File System Traversal

The system SHALL recursively scan directories to find all relevant source files.

**Acceptance Criteria:**
- 1.4.1 System recursively traverses directory tree from specified path
- 1.4.2 System identifies files by extension (.js, .ts, .py, .go, .rb, .rs, .sh, etc.)
- 1.4.3 System applies ignore patterns to exclude files and directories
- 1.4.4 System handles symbolic links without infinite loops
- 1.4.5 System continues scanning when encountering permission-denied errors


### 1.5 Command-Line Interface

The system SHALL provide a command-line interface with configurable options.

**Acceptance Criteria:**
- 1.5.1 System accepts path argument for directory or file to scan
- 1.5.2 System accepts `--env-file` flag to specify custom .env file path
- 1.5.3 System accepts `--format` flag with values: text, json, github
- 1.5.4 System accepts `--fail-on` flag with values: missing, unused, undocumented, all, none
- 1.5.5 System accepts `--ignore` flag (repeatable) for glob patterns
- 1.5.6 System accepts `--no-color` flag to disable colored output
- 1.5.7 System accepts `--quiet` flag to suppress non-error output
- 1.5.8 System accepts `--version` flag to display version number
- 1.5.9 System accepts `--help` flag to display usage information
- 1.5.10 System validates all arguments and displays errors for invalid input

### 1.6 Output Formatting

The system SHALL format analysis results in multiple output formats.

**Acceptance Criteria:**
- 1.6.1 System generates human-readable text output with colored categories
- 1.6.2 System generates valid JSON output for machine parsing
- 1.6.3 System generates GitHub Actions annotations (::error, ::warning)
- 1.6.4 System respects `--no-color` flag by omitting ANSI escape codes
- 1.6.5 System respects `--quiet` flag by suppressing output when no issues found
- 1.6.6 System includes summary statistics in all output formats

### 1.7 Ignore Pattern Handling

The system SHALL support flexible ignore patterns for excluding files from scanning.

**Acceptance Criteria:**
- 1.7.1 System loads patterns from .gitignore file if present
- 1.7.2 System loads patterns from .envcheckignore file if present
- 1.7.3 System applies default ignore patterns (node_modules, .git, dist, build)
- 1.7.4 System accepts additional patterns via `--ignore` flag
- 1.7.5 System supports glob pattern syntax (*, **, ?, [])
- 1.7.6 System supports negation patterns (!pattern)

### 1.8 Exit Code Behavior

The system SHALL exit with appropriate codes based on findings and configuration.

**Acceptance Criteria:**
- 1.8.1 System exits with code 0 when no issues match `--fail-on` criteria
- 1.8.2 System exits with code 1 when issues match `--fail-on` criteria
- 1.8.3 System exits with code 2 on errors (invalid args, file not found)
- 1.8.4 System exits with code 0 when `--fail-on none` regardless of issues
- 1.8.5 System exits with code 1 when `--fail-on all` and any issues exist

## 2. Non-Functional Requirements

### 2.1 Performance

**Acceptance Criteria:**
- 2.1.1 System scans 10,000 files in under 2 seconds on modern hardware
- 2.1.2 System memory usage does not exceed 500MB for typical projects
- 2.1.3 System startup time is under 100ms
- 2.1.4 System supports codebases up to 100,000 files

### 2.2 Reliability

**Acceptance Criteria:**
- 2.2.1 System handles file read errors gracefully without crashing
- 2.2.2 System handles malformed .env.example files without failing
- 2.2.3 System detects and handles circular symlinks
- 2.2.4 System produces consistent results across multiple runs (idempotent)
- 2.2.5 System never crashes with unhandled exceptions


### 2.3 Portability

**Acceptance Criteria:**
- 2.3.1 System runs on Linux, macOS, and Windows
- 2.3.2 System requires Node.js 18.0.0 or higher
- 2.3.3 System uses only Node.js built-in modules (zero runtime dependencies)
- 2.3.4 System handles platform-specific path separators correctly
- 2.3.5 System handles both Unix (\n) and Windows (\r\n) line endings

### 2.4 Security

**Acceptance Criteria:**
- 2.4.1 System prevents path traversal attacks by validating file paths
- 2.4.2 System uses non-backtracking regex patterns to prevent ReDoS
- 2.4.3 System respects file system permissions (no privilege escalation)
- 2.4.4 System never executes or evaluates scanned code
- 2.4.5 System does not leak sensitive information in error messages

### 2.5 Usability

**Acceptance Criteria:**
- 2.5.1 System provides clear, actionable error messages
- 2.5.2 System displays helpful usage information with `--help` flag
- 2.5.3 System uses intuitive color coding (red, yellow, green) for issue types
- 2.5.4 System includes emojis in text output for visual clarity
- 2.5.5 System suggests solutions in error messages when applicable

### 2.6 Maintainability

**Acceptance Criteria:**
- 2.6.1 System code is modular with clear separation of concerns
- 2.6.2 System includes comprehensive unit tests for all modules
- 2.6.3 System includes integration tests with sample projects
- 2.6.4 System uses consistent code style and naming conventions
- 2.6.5 System includes inline documentation for complex logic

### 2.7 Extensibility

**Acceptance Criteria:**
- 2.7.1 System architecture allows adding new language scanners easily
- 2.7.2 System architecture allows adding new output formatters easily
- 2.7.3 System uses plugin-like pattern for language scanners
- 2.7.4 System configuration is centralized and easy to modify

## 3. Language-Specific Requirements

### 3.1 JavaScript/TypeScript Support

**Acceptance Criteria:**
- 3.1.1 System detects `process.env.VAR_NAME` (dot notation)
- 3.1.2 System detects `process.env['VAR_NAME']` (bracket notation with single quotes)
- 3.1.3 System detects `process.env["VAR_NAME"]` (bracket notation with double quotes)
- 3.1.4 System detects `import.meta.env.VAR_NAME` (Vite/modern bundlers)
- 3.1.5 System scans files with extensions: .js, .jsx, .ts, .tsx, .mjs, .cjs

### 3.2 Python Support

**Acceptance Criteria:**
- 3.2.1 System detects `os.environ['VAR_NAME']` (bracket notation)
- 3.2.2 System detects `os.environ.get('VAR_NAME')` (get method)
- 3.2.3 System detects `os.getenv('VAR_NAME')` (getenv function)
- 3.2.4 System handles both single and double quotes
- 3.2.5 System scans files with extension: .py

### 3.3 Go Support

**Acceptance Criteria:**
- 3.3.1 System detects `os.Getenv("VAR_NAME")` (standard library)
- 3.3.2 System detects `os.LookupEnv("VAR_NAME")` (with existence check)
- 3.3.3 System scans files with extension: .go

### 3.4 Ruby Support

**Acceptance Criteria:**
- 3.4.1 System detects `ENV['VAR_NAME']` (bracket notation)
- 3.4.2 System detects `ENV.fetch('VAR_NAME')` (fetch method)
- 3.4.3 System handles both single and double quotes
- 3.4.4 System scans files with extension: .rb

### 3.5 Rust Support

**Acceptance Criteria:**
- 3.5.1 System detects `env::var("VAR_NAME")` (short form)
- 3.5.2 System detects `std::env::var("VAR_NAME")` (full path)
- 3.5.3 System detects `env::var_os("VAR_NAME")` (OsString variant)
- 3.5.4 System detects `std::env::var_os("VAR_NAME")` (full path OsString)
- 3.5.5 System scans files with extension: .rs

### 3.6 Shell/Bash Support

**Acceptance Criteria:**
- 3.6.1 System detects `$VAR_NAME` (simple variable expansion)
- 3.6.2 System detects `${VAR_NAME}` (braced variable expansion)
- 3.6.3 System detects variables within double quotes
- 3.6.4 System scans files with extensions: .sh, .bash, .zsh
- 3.6.5 System handles potential false positives in shell scripts


## 4. Output Format Requirements

### 4.1 Text Format

**Acceptance Criteria:**
- 4.1.1 System displays MISSING issues with 🔴 emoji and red color
- 4.1.2 System displays UNUSED issues with 🟡 emoji and yellow color
- 4.1.3 System displays UNDOCUMENTED issues with 🟢 emoji and green color
- 4.1.4 System lists all file references for each MISSING variable
- 4.1.5 System shows line numbers for all references
- 4.1.6 System displays summary line with counts for all categories
- 4.1.7 System omits ANSI codes when `--no-color` flag is set

### 4.2 JSON Format

**Acceptance Criteria:**
- 4.2.1 System outputs valid, parseable JSON
- 4.2.2 System includes `missing` array with variable names and references
- 4.2.3 System includes `unused` array with variable names and definitions
- 4.2.4 System includes `undocumented` array with variable names and references
- 4.2.5 System includes `summary` object with all counts
- 4.2.6 System uses consistent property names and structure

### 4.3 GitHub Actions Format

**Acceptance Criteria:**
- 4.3.1 System outputs `::error` annotations for MISSING variables
- 4.3.2 System outputs `::warning` annotations for UNUSED variables
- 4.3.3 System outputs `::warning` annotations for UNDOCUMENTED variables
- 4.3.4 System includes `file` and `line` parameters in annotations
- 4.3.5 System includes descriptive message for each annotation
- 4.3.6 System follows GitHub Actions annotation syntax exactly

## 5. Error Handling Requirements

### 5.1 File System Errors

**Acceptance Criteria:**
- 5.1.1 System displays clear error when .env.example file not found
- 5.1.2 System displays clear error when scan path does not exist
- 5.1.3 System logs warning and continues when file read permission denied
- 5.1.4 System logs warning and continues when encountering circular symlinks
- 5.1.5 System exits with code 2 for fatal file system errors

### 5.2 Argument Validation Errors

**Acceptance Criteria:**
- 5.2.1 System displays error for unrecognized command-line flags
- 5.2.2 System displays error for invalid `--format` values
- 5.2.3 System displays error for invalid `--fail-on` values
- 5.2.4 System displays error for invalid glob patterns in `--ignore`
- 5.2.5 System displays usage help after argument errors
- 5.2.6 System exits with code 2 for argument validation errors

### 5.3 Parsing Errors

**Acceptance Criteria:**
- 5.3.1 System logs warning for malformed lines in .env.example
- 5.3.2 System continues parsing after encountering invalid lines
- 5.3.3 System does not fail entire operation due to single file parse error
- 5.3.4 System includes line numbers in parsing warnings

### 5.4 Runtime Errors

**Acceptance Criteria:**
- 5.4.1 System catches and handles out-of-memory errors gracefully
- 5.4.2 System catches and handles regex matching errors
- 5.4.3 System never crashes with unhandled promise rejections
- 5.4.4 System never crashes with unhandled exceptions
- 5.4.5 System displays helpful error messages for all runtime errors

## 6. Testing Requirements

### 6.1 Unit Testing

**Acceptance Criteria:**
- 6.1.1 All scanner modules have unit tests with sample code snippets
- 6.1.2 Parser module has tests for valid and invalid .env formats
- 6.1.3 Analyzer module has tests for all categorization scenarios
- 6.1.4 Formatter modules have tests for all output formats
- 6.1.5 Ignore handler has tests for glob pattern matching
- 6.1.6 CLI module has tests for argument parsing
- 6.1.7 Test coverage exceeds 80% for all modules

### 6.2 Integration Testing

**Acceptance Criteria:**
- 6.2.1 Integration tests use realistic sample projects
- 6.2.2 Integration tests verify end-to-end workflow
- 6.2.3 Integration tests verify all output formats
- 6.2.4 Integration tests verify exit code behavior
- 6.2.5 Integration tests verify performance targets

### 6.3 Property-Based Testing

**Acceptance Criteria:**
- 6.3.1 Property tests verify mutual exclusivity of issue categories
- 6.3.2 Property tests verify summary count accuracy
- 6.3.3 Property tests verify idempotency of analysis
- 6.3.4 Property tests verify variable name validity
- 6.3.5 Property tests use randomly generated inputs

## 7. Documentation Requirements

### 7.1 User Documentation

**Acceptance Criteria:**
- 7.1.1 README includes installation instructions
- 7.1.2 README includes usage examples for common scenarios
- 7.1.3 README documents all command-line flags
- 7.1.4 README includes CI/CD integration examples
- 7.1.5 README lists supported languages and patterns

### 7.2 Developer Documentation

**Acceptance Criteria:**
- 7.2.1 Code includes JSDoc comments for public functions
- 7.2.2 Architecture decisions are documented
- 7.2.3 Adding new language scanners is documented
- 7.2.4 Contributing guidelines are provided
- 7.2.5 Testing approach is documented

## 8. Constraints

### 8.1 Technical Constraints

- 8.1.1 System MUST use only Node.js built-in modules (zero runtime dependencies)
- 8.1.2 System MUST support Node.js 18.0.0 or higher
- 8.1.3 System MUST use ES modules (not CommonJS)
- 8.1.4 System MUST be executable via `npx` or global install

### 8.2 Design Constraints

- 8.2.1 System MUST use regex-based pattern matching (not AST parsing)
- 8.2.2 System MUST NOT execute or import scanned code
- 8.2.3 System MUST be stateless (no persistent storage)
- 8.2.4 System MUST be deterministic (same input → same output)

### 8.3 Operational Constraints

- 8.3.1 System MUST complete scan in reasonable time (<2s for 10k files)
- 8.3.2 System MUST handle large codebases without excessive memory
- 8.3.3 System MUST work in CI/CD environments (non-interactive)
- 8.3.4 System MUST respect standard Unix conventions (exit codes, stdout/stderr)
