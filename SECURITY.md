# Security Policy

## Supported Versions

We support the latest version of envcheck-cli. Since this is a CLI tool with zero dependencies, security updates are straightforward.

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

Found a security issue? Please don't open a public issue. Instead:

1. Email the maintainers directly (check package.json for contact info)
2. Or open a private security advisory on GitHub
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

We'll respond within 48 hours and work with you to address the issue.

## Security Features

envcheck-cli is designed with security as a top priority:

### Core Security Features

- **Zero dependencies** - No supply chain attacks through dependencies
- **Read-only by default** - Only reads files, never writes (except with explicit `--fix` flag)
- **No network calls** - Runs entirely offline
- **No data collection** - Your code stays on your machine
- **Input validation** - All user inputs are validated and sanitized
- **Path sanitization** - Prevents directory traversal attacks
- **Resource limits** - Protects against DoS attacks
- **Error sanitization** - Prevents information leakage

### Security Hardening

- Path traversal prevention
- Command injection prevention
- ReDoS (Regular Expression DoS) protection
- Symlink attack prevention
- Prototype pollution prevention
- File size limits (10MB max)
- Directory depth limits (100 levels max)
- Rate limiting on file operations

## Security Testing

We maintain comprehensive security tests covering:

- Path traversal attacks (15 test cases)
- Command injection (12 test cases)
- Input validation (25 test cases)
- Malicious pattern injection (10 test cases)
- Resource exhaustion (15 test cases)
- Configuration security (8 test cases)
- File system access control (10 test cases)
- Error message security (5 test cases)
- Race conditions (3 test cases)

Run security tests:
```bash
npm test
node --test test/security.test.js
node --test test/security-utils.test.js
```

## Best Practices

### For Users

When using envcheck-cli:

- Don't commit your actual `.env` files (only `.env.example`)
- Use it in CI/CD to catch undocumented env vars before deployment
- Keep your Node.js version up to date (>= 18.0.0)
- Review the source code - it's small and readable
- Use `--quiet` flag in production to reduce output
- Limit scope with specific paths: `envcheck ./src`
- Use `.envcheckignore` to exclude sensitive directories

### For CI/CD

```yaml
# GitHub Actions example
- name: Check environment variables
  run: npx envcheck-cli . --fail-on missing --quiet
```

### For Developers

- Always validate user inputs
- Sanitize paths before file operations
- Use security utilities from `src/security.js`
- Follow the security checklist in `docs/CODE_QUALITY.md`
- Review `docs/SECURITY_GUIDE.md` for detailed guidance

## Known Limitations

- Cannot detect environment variables loaded from external sources (APIs, vaults, etc.)
- Cannot validate actual environment variable values
- Cannot detect runtime-only environment variables
- Requires Node.js >= 18.0.0

## Security Documentation

For comprehensive security information, see:

- [Security Guide](docs/SECURITY_GUIDE.md) - Detailed security documentation
- [Code Quality Guide](docs/CODE_QUALITY.md) - Code standards and best practices
- [Architecture](docs/ARCHITECTURE.md) - System design and security considerations

## Vulnerability Disclosure Policy

### Severity Levels

- **Critical**: Remote code execution, data breach (24-48 hour response)
- **High**: Local code execution, privilege escalation (1 week response)
- **Medium**: DoS, information disclosure (2 weeks response)
- **Low**: Minor information leakage (1 month response)

### Disclosure Timeline

1. **Report received**: Acknowledge within 48 hours
2. **Triage**: Assess severity within 1 week
3. **Fix development**: Depends on severity
4. **Testing**: Verify fix with reporter
5. **Release**: Publish patched version
6. **Disclosure**: Public disclosure after fix is available

## Security Updates

Stay informed about security updates:

- Watch this repository for security advisories
- Subscribe to release notifications
- Check CHANGELOG.md for security fixes
- Review RELEASE_NOTES.md for security-related changes

## Questions?

For security-related questions that aren't vulnerabilities:
- Open a GitHub issue with the `security` label
- Check existing documentation
- Review the security guide

For urgent security matters, contact maintainers directly.
