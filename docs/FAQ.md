# Frequently Asked Questions

## General

### Why another env var tool?

Most tools either require dependencies, are language-specific, or don't integrate well with CI/CD. envcheck-cli is zero-dependency, multi-language, and designed for automation from day one.

### Does this replace dotenv?

No. dotenv loads env vars at runtime. envcheck-cli validates that your env vars are properly documented. Use both together.

### Is this production-ready?

Yes. It's a read-only static analysis tool with no dependencies. It can't break your code or leak secrets.

## Installation & Setup

### Do I need to install it globally?

No. You can use `npx envcheck-cli` to run it without installing.

### What Node.js version do I need?

Node.js 18.0.0 or higher. We use modern JavaScript features and built-in test runner.

### Can I use this with Deno or Bun?

Not currently. It's designed for Node.js, but PRs for Deno/Bun support are welcome.

## Usage

### What if I don't have a .env.example file?

envcheck will warn you and suggest creating one. It's best practice to have one for documentation.

### Can I use .env.template instead of .env.example?

Currently no, but this is a planned feature. Track the issue on GitHub.

### Does it scan .env files?

No. .env files often contain secrets and shouldn't be committed. envcheck only reads .env.example.

### What about .env.local, .env.production, etc?

These are typically gitignored and contain actual secrets. envcheck focuses on .env.example for documentation.

## Language Support

### My language isn't supported. Can I add it?

Yes! Check CONTRIBUTING.md for guidelines on adding language scanners. It's usually ~50 lines of code.

### Does it support TypeScript?

Yes. TypeScript files (.ts, .tsx) are scanned the same way as JavaScript.

### What about framework-specific patterns?

We detect standard patterns. Framework-specific wrappers (like Next.js's `process.env.NEXT_PUBLIC_*`) are detected as long as they use standard env var access.

### Does it understand dynamic env var names?

No. Only static references are detected:
```javascript
// ✅ Detected
process.env.API_KEY

// ❌ Not detected
const key = 'API_KEY';
process.env[key]
```

## CI/CD

### How do I fail CI if issues are found?

Use `--fail-on missing,unused,undocumented` to set exit code 1 on issues.

### Can I ignore specific warnings?

Not yet, but this is planned. For now, use `--fail-on` to control what causes failures.

### Does it work with monorepos?

Yes. Run it in each package directory or use a script to check all packages.

### How fast is it?

Very fast. Scanning a typical project takes <1 second. No network calls, no heavy parsing.

## Troubleshooting

### It's not detecting my env vars

Check that:
1. Your file extension is supported
2. You're using standard env var access patterns
3. The file isn't in .gitignore (we respect gitignore by default)

### It's showing false positives

Open an issue with:
- The code snippet causing the false positive
- Expected vs actual behavior
- Your language/framework

### Can I see what files are being scanned?

Use `--verbose` flag to see detailed scanning information.

### It says "no .env.example found"

Create a .env.example file in your project root with documented env vars:
```bash
# Database connection string
DATABASE_URL=

# API key for external service
API_KEY=
```

## Best Practices

### Should I commit .env.example?

Yes! That's the whole point. It documents required env vars without exposing secrets.

### How should I document env vars?

Add inline comments in .env.example:
```bash
# Description of what this does
VAR_NAME=default_value_or_empty
```

### When should I run envcheck?

- Pre-commit hooks (catch issues early)
- CI/CD pipelines (enforce standards)
- Before deployments (ensure documentation)
- During code review (automated checks)

### What about optional env vars?

Document them in .env.example with a comment indicating they're optional:
```bash
# Optional: Enable debug mode
DEBUG=
```

## Contributing

### How can I contribute?

See CONTRIBUTING.md for guidelines. We welcome:
- Bug fixes
- New language support
- Performance improvements
- Documentation updates

### I found a bug. What should I do?

Open an issue with:
- What happened vs what you expected
- Steps to reproduce
- Your Node.js version and OS

### Can I add a dependency?

Probably not. We're committed to zero dependencies. Propose alternatives using Node.js built-ins.

## Security

### Does it expose my secrets?

No. It only reads .env.example (which shouldn't contain secrets) and scans code for references.

### Can I use it on private repos?

Yes. It runs locally and makes no network calls.

### Is it safe to run in CI?

Yes. It's read-only and doesn't execute code or write files.

## Comparison

### How is this different from dotenv-linter?

dotenv-linter focuses on .env file syntax. envcheck validates that code references match documentation.

### What about env-cmd?

env-cmd loads env vars for command execution. envcheck validates documentation. Different use cases.

### Why not use ESLint plugins?

ESLint plugins are language-specific and require configuration. envcheck works across languages with zero config.
