# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Plugin system for custom scanners and formatters
- Additional language support (Java, PHP, C#)
- Cloud configuration integration (AWS Secrets Manager, Azure Key Vault)

## [1.0.0] - 2026-03-22

### Added
- Initial release with comprehensive feature set
- Multi-language support:
  - JavaScript/TypeScript (.js, .jsx, .ts, .tsx, .mjs, .cjs)
  - Python (.py)
  - Go (.go)
  - Ruby (.rb)
  - Rust (.rs)
  - Shell/Bash (.sh, .bash, .zsh)
- Multiple output formats:
  - Human-readable text with color support (default)
  - JSON for scripting and automation
  - GitHub Actions annotations for CI/CD
  - Table format for structured display
- Interactive REPL mode:
  - Persistent configuration across commands
  - Command history with navigation
  - Tab completion for commands and options
  - Built-in help system
  - Configuration management (`:set`, `:config`, `:save`)
- Watch mode for development:
  - Auto-rerun validation on file changes
  - Debounced file watching
  - Real-time feedback during coding
- Auto-fix functionality:
  - Automatically add missing variables to .env.example
  - Smart default value generation based on variable names
  - Preserves existing file structure and comments
- Intelligent suggestions:
  - Typo detection with similarity scoring
  - Context-aware example values
  - Actionable hints for common issues
- Configuration file support:
  - JSON configuration files (.envcheckrc.json)
  - Workspace and user-level configs
  - CLI options override file configs
- Advanced features:
  - Configurable concurrency for large codebases
  - Progress indicators with spinners
  - Caching system for improved performance
  - Custom ignore patterns (repeatable --ignore flag)
  - Quiet mode for CI/CD pipelines
  - Color and progress toggle options
- CI/CD integration:
  - Configurable failure conditions (--fail-on)
  - Exit codes for automation
  - GitHub Actions annotations
  - Multiple output formats for different platforms
- Zero runtime dependencies (Node.js built-ins only)
- .gitignore and .envcheckignore support
- Detects three types of issues:
  - MISSING: Variables used in code but not in .env.example
  - UNUSED: Variables in .env.example but not referenced in code
  - UNDOCUMENTED: Variables used and defined but lacking comments

### Documentation
- Comprehensive README with origin story and real-world scenarios
- Complete CLI reference guide
- Configuration guide with examples
- REPL mode documentation
- Advanced features guide (caching, plugins, performance)
- Architecture documentation
- Testing guide with property-based testing
- Integration guides for CI/CD platforms
- Examples for common use cases
- FAQ with troubleshooting
- Contributing guidelines
- Code of Conduct (Contributor Covenant 3.0)
- Security policy
- Comparison with similar tools

### Infrastructure
- GitHub Actions CI workflow (Node 18/20/22, Ubuntu/Windows/macOS)
- CodeQL security scanning for vulnerability detection
- Automated npm publishing on release
- Automated GitHub release creation
- Bundle size tracking
- Stale issue management
- Auto-labeling for PRs and issues
- Issue templates (bug reports, feature requests, language support)
- Pull request templates (standard and performance improvements)
- Dependabot configuration for dependency updates
- Greeting workflow for new contributors

### Testing
- Comprehensive test suite with 100+ tests
- Property-based testing with fast-check
- Integration tests for real-world scenarios
- Edge case testing (Unicode, CRLF, large files)
- Multi-language fixture testing
- Formatter output validation
- Error handling coverage
- Performance benchmarks

### Performance
- Concurrent file scanning (configurable via ENVCHECK_SCAN_CONCURRENCY)
- Efficient glob pattern matching
- Stream-based file reading for memory efficiency
- Optimized for large codebases (1000+ files)

[Unreleased]: https://github.com/RealBitreon/envcheck-cli/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/RealBitreon/envcheck-cli/releases/tag/v1.0.0
