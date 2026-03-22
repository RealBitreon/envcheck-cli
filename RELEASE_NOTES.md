# envcheck-cli v1.0.0 Release Notes

## 🎉 Initial Release

We're excited to announce the first stable release of envcheck-cli - a zero-dependency CLI tool for validating environment variables across codebases.

## What is envcheck?

envcheck scans your codebase and compares environment variable usage against your `.env.example` file. It catches three types of problems:

- **MISSING** - Variables used in code but not documented in .env.example
- **UNUSED** - Variables documented but not referenced anywhere
- **UNDOCUMENTED** - Variables that exist but lack explanatory comments

## Key Features

### 🚀 Zero Dependencies
Built entirely with Node.js built-ins. No bloated node_modules, just fast and reliable tooling.

### 🌍 Multi-Language Support
- JavaScript/TypeScript (.js, .jsx, .ts, .tsx, .mjs, .cjs)
- Python (.py)
- Go (.go)
- Ruby (.rb)
- Rust (.rs)
- Shell/Bash (.sh, .bash, .zsh)

### 🎨 Multiple Output Formats
- Human-readable text with color support
- JSON for scripting and automation
- GitHub Actions annotations for CI/CD
- Table format for structured display

### 💬 Interactive REPL Mode
Start an interactive session with persistent configuration, command history, and tab completion:
```bash
envcheck --repl
```

### 👀 Watch Mode
Auto-rerun validation when files change during development:
```bash
envcheck --watch
```

### 🔧 Auto-Fix
Automatically add missing variables to .env.example with smart defaults:
```bash
envcheck --fix
```

### 🧠 Intelligent Suggestions
- Typo detection with similarity scoring
- Context-aware example values
- Actionable hints for common issues

### ⚙️ Configuration Files
Save your settings in `.envcheckrc.json` for consistent team workflows:
```json
{
  "path": ".",
  "envFile": ".env.example",
  "failOn": "missing",
  "ignore": ["node_modules/**", "**/*.test.js"]
}
```

### 🔄 CI/CD Ready
Configurable failure conditions and exit codes for automation:
```bash
envcheck --format github --fail-on all
```

## Installation

```bash
npm install -g envcheck-cli
```

Or run directly without installing:
```bash
npx envcheck-cli
```

## Quick Start

```bash
# Basic scan
envcheck

# Watch mode for development
envcheck --watch

# Auto-fix missing variables
envcheck --fix

# CI/CD integration
envcheck --format github --fail-on missing
```

## Requirements

- Node.js 18.0.0 or higher

## Documentation

- [README](README.md) - Complete guide with origin story
- [CLI Reference](docs/CLI_REFERENCE.md) - All command-line options
- [Configuration Guide](docs/CONFIGURATION.md) - Config file setup
- [REPL Guide](docs/REPL.md) - Interactive mode deep dive
- [Examples](docs/EXAMPLES.md) - Real-world use cases
- [Integrations](docs/INTEGRATIONS.md) - CI/CD platform guides
- [Advanced Features](docs/ADVANCED.md) - Plugins, caching, performance
- [Architecture](docs/ARCHITECTURE.md) - How it works under the hood

## What's Next?

Check out our [ROADMAP](ROADMAP.md) for planned features including:
- Plugin system for custom scanners
- Additional language support
- Cloud configuration integration

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [GitHub Repository](https://github.com/RealBitreon/envcheck-cli)
- [npm Package](https://www.npmjs.com/package/envcheck-cli)
- [Issue Tracker](https://github.com/RealBitreon/envcheck-cli/issues)

---

Built with ☕, mild frustration, and the belief that developer tools should be both simple and powerful.
