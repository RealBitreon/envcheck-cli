# Security Guide

## Overview

This document provides comprehensive security information for envcheck-cli, including security features, best practices, threat model, and security testing procedures.

## Security Features

### 1. Zero Dependencies
- No third-party dependencies means no supply chain attacks
- All code is auditable and contained within this repository
- Reduces attack surface significantly

### 2. Read-Only Operations
- envcheck-cli primarily performs read-only operations
- Only writes when using `--fix` flag (explicitly opt-in)
- No code execution or dynamic imports from user files

### 3. Offline Operation
- No network calls or external API requests
- All processing happens locally
- Your code never leaves your machine

### 4. Input Validation
- All user inputs are validated and sanitized
- Path traversal prevention
- Command injection prevention
- Pattern validation to prevent ReDoS attacks

### 5. Resource Limits
- Maximum file size: 10MB
- Maximum files to scan: 100,000
- Maximum directory depth: 100 levels
- Maximum pattern length: 1,000 characters
- Maximum path length: 4,096 characters

### 6. Error Handling
- Graceful error handling without exposing sensitive information
- Error messages sanitized to prevent information leakage
- No stack traces exposed to end users

## Threat Model

### In Scope

1. **Path Traversal Attacks**
   - Malicious paths attempting to access files outside project
   - Symlink attacks to sensitive system files
   - Null byte injection in paths

2. **Command Injection**
   - Shell metacharacters in arguments
   - Command chaining attempts
   - Code execution through configuration files

3. **Denial of Service (DoS)**
   - Resource exhaustion through large files
   - ReDoS (Regular Expression DoS) attacks
   - Infinite loops through circular symlinks

4. **Information Disclosure**
   - Sensitive data in error messages
   - Path disclosure in logs
   - Secret leakage through verbose output

5. **Configuration Injection**
   - Prototype pollution in JSON configs
   - Malicious code in JS config files
   - Invalid configuration values

### Out of Scope

1. **Physical Access**
   - Attacks requiring physical access to the machine

2. **Social Engineering**
   - Phishing or social engineering attacks

3. **Operating System Vulnerabilities**
   - OS-level security issues

4. **Node.js Runtime Vulnerabilities**
   - Security issues in Node.js itself (keep Node.js updated)

## Security Best Practices

### For Users

1. **Keep Node.js Updated**
   ```bash
   node --version  # Should be >= 18.0.0
   ```

2. **Use in CI/CD**
   ```yaml
   # GitHub Actions example
   - name: Check environment variables
     run: npx envcheck-cli . --fail-on missing
   ```

3. **Never Commit Actual .env Files**
   ```gitignore
   # .gitignore
   .env
   .env.local
   .env.*.local
   ```

4. **Review Configuration Files**
   ```bash
   # Review before using
   cat .envcheckrc.json
   ```

5. **Use Ignore Patterns**
   ```json
   {
     "ignore": [
       "node_modules/**",
       "dist/**",
       "**/*.test.js",
       "**/*.spec.js"
     ]
   }
   ```

6. **Limit Scope**
   ```bash
   # Scan specific directories only
   envcheck ./src --env-file .env.example
   ```

7. **Use --quiet in Production**
   ```bash
   # Reduce output in production
   envcheck . --quiet --fail-on missing
   ```

### For Developers

1. **Input Validation**
   ```javascript
   import { sanitizePath, sanitizePattern } from './src/security.js';
   
   // Always sanitize user inputs
   const safePath = sanitizePath(userInput);
   const safePattern = sanitizePattern(userPattern);
   ```

2. **Error Handling**
   ```javascript
   import { sanitizeErrorMessage } from './src/security.js';
   
   try {
     // Operation
   } catch (error) {
     console.error(sanitizeErrorMessage(error));
   }
   ```

3. **Resource Limits**
   ```javascript
   import { isFileSizeValid, isDepthValid } from './src/security.js';
   
   if (!isFileSizeValid(fileSize)) {
     throw new Error('File too large');
   }
   ```

4. **Rate Limiting**
   ```javascript
   import { RateLimiter } from './src/security.js';
   
   const limiter = new RateLimiter(1000, 1000);
   if (!limiter.allowOperation()) {
     throw new Error('Rate limit exceeded');
   }
   ```

5. **Timeouts**
   ```javascript
   import { withTimeout } from './src/security.js';
   
   const result = await withTimeout(operation(), 30000);
   ```

## Security Testing

### Running Security Tests

```bash
# Run all tests including security tests
npm test

# Run only security tests
node --test test/security.test.js
node --test test/security-utils.test.js

# Run with coverage
npm run test:coverage
```

### Test Coverage

Security tests cover:
- Path traversal prevention (15 test cases)
- Command injection prevention (12 test cases)
- Input validation (25 test cases)
- Malicious pattern injection (10 test cases)
- Resource exhaustion (DoS) (15 test cases)
- Configuration security (8 test cases)
- File system access control (10 test cases)
- Error message security (5 test cases)
- Race conditions (3 test cases)

### Manual Security Testing

1. **Path Traversal**
   ```bash
   # Should fail safely
   envcheck ../../../etc/passwd
   envcheck . --env-file ../../../etc/shadow
   ```

2. **Command Injection**
   ```bash
   # Should not execute commands
   envcheck .; rm -rf /
   envcheck . --ignore "*.js; whoami"
   ```

3. **Large Files**
   ```bash
   # Create large test file
   dd if=/dev/zero of=large.env bs=1M count=20
   envcheck . --env-file large.env
   ```

4. **Deep Directories**
   ```bash
   # Create deep directory structure
   mkdir -p a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p
   envcheck a
   ```

5. **Symlink Attacks**
   ```bash
   # Create malicious symlink
   ln -s /etc/passwd malicious.env
   envcheck . --env-file malicious.env
   ```

## Vulnerability Reporting

### How to Report

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the maintainers directly (see package.json)
3. Or use GitHub's private security advisory feature
4. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Triage**: Within 1 week
- **Fix Development**: Depends on severity
- **Disclosure**: After fix is released

### Severity Levels

- **Critical**: Remote code execution, data breach
- **High**: Local code execution, privilege escalation
- **Medium**: DoS, information disclosure
- **Low**: Minor information leakage

## Security Checklist

### Before Release

- [ ] All security tests passing
- [ ] No known vulnerabilities
- [ ] Input validation on all user inputs
- [ ] Error messages sanitized
- [ ] Resource limits enforced
- [ ] Documentation updated
- [ ] Security guide reviewed

### Regular Maintenance

- [ ] Review dependencies (if any added)
- [ ] Update Node.js version requirements
- [ ] Review and update security tests
- [ ] Check for new attack vectors
- [ ] Update threat model
- [ ] Review security documentation

## Common Attack Scenarios

### Scenario 1: Path Traversal

**Attack:**
```bash
envcheck . --env-file ../../../etc/passwd
```

**Defense:**
- Path sanitization in `sanitizePath()`
- Validation that paths stay within project
- Rejection of paths with `..` components

### Scenario 2: Command Injection

**Attack:**
```bash
envcheck . --ignore "*.js; rm -rf /"
```

**Defense:**
- Input sanitization in `sanitizeArgument()`
- Shell metacharacter detection
- No shell execution of user inputs

### Scenario 3: ReDoS Attack

**Attack:**
```bash
envcheck . --ignore "(a+)+"
```

**Defense:**
- Pattern validation in `sanitizePattern()`
- ReDoS pattern detection
- Timeout on pattern matching

### Scenario 4: Resource Exhaustion

**Attack:**
```bash
# Create 1 million files
for i in {1..1000000}; do touch file$i.js; done
envcheck .
```

**Defense:**
- Maximum file count limit
- Rate limiting on file operations
- Timeout on long-running operations

### Scenario 5: Symlink Attack

**Attack:**
```bash
ln -s /etc/shadow .env.example
envcheck .
```

**Defense:**
- Symlink cycle detection
- Path validation after resolution
- Safe path checking

## Security Hardening

### File System

1. **Restrict Permissions**
   ```bash
   # Make envcheck executable only
   chmod 755 bin/envcheck.js
   
   # Protect config files
   chmod 644 .envcheckrc.json
   ```

2. **Use .envcheckignore**
   ```
   # .envcheckignore
   **/*.secret.*
   **/secrets/**
   **/.env
   ```

### Configuration

1. **Minimal Configuration**
   ```json
   {
     "path": "./src",
     "envFile": ".env.example",
     "format": "json",
     "failOn": "missing",
     "ignore": ["node_modules/**"]
   }
   ```

2. **Avoid JS Configs**
   - Prefer JSON over JavaScript configs
   - JS configs can execute arbitrary code
   - Use JSON for production environments

### CI/CD

1. **Read-Only Mode**
   ```yaml
   - name: Check env vars
     run: envcheck . --fail-on all
     # Never use --fix in CI
   ```

2. **Fail Fast**
   ```yaml
   - name: Check env vars
     run: envcheck . --fail-on missing --quiet
     continue-on-error: false
   ```

3. **Isolated Environment**
   ```yaml
   - name: Check env vars
     run: |
       cd ${{ github.workspace }}
       envcheck . --fail-on all
   ```

## Security Updates

### Staying Informed

1. Watch the GitHub repository for security advisories
2. Subscribe to release notifications
3. Check CHANGELOG.md for security fixes
4. Review SECURITY.md regularly

### Updating

```bash
# Check current version
envcheck --version

# Update to latest
npm update envcheck-cli

# Or reinstall
npm install envcheck-cli@latest
```

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Contact

For security-related questions or concerns:
- Email: [See package.json]
- GitHub Security Advisories: [Repository URL]
- General Issues: [GitHub Issues]

## License

This security guide is part of envcheck-cli and is licensed under the MIT License.
