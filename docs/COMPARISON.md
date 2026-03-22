# Comparison with Other Tools

## envcheck-cli vs Alternatives

### vs dotenv-linter

| Feature | envcheck-cli | dotenv-linter |
|---------|-------------|---------------|
| Validates .env syntax | ❌ | ✅ |
| Checks code references | ✅ | ❌ |
| Multi-language support | ✅ (6 languages) | ❌ (Rust only) |
| Zero dependencies | ✅ | ✅ |
| CI/CD integration | ✅ | ✅ |
| Auto-fix issues | ❌ (planned) | ✅ |

**Use dotenv-linter when:** You need to validate .env file syntax and formatting.

**Use envcheck-cli when:** You need to ensure code references match documentation.

**Use both when:** You want comprehensive env var validation.

### vs ESLint plugins (eslint-plugin-node)

| Feature | envcheck-cli | ESLint plugins |
|---------|-------------|----------------|
| Multi-language | ✅ | ❌ (JS/TS only) |
| Zero config | ✅ | ❌ (requires setup) |
| Dependencies | 0 | Many |
| Checks .env.example | ✅ | ❌ |
| Real-time feedback | ❌ | ✅ (in IDE) |

**Use ESLint when:** You want real-time feedback in your IDE for JavaScript/TypeScript.

**Use envcheck-cli when:** You need multi-language support and CI/CD integration.

### vs env-cmd

| Feature | envcheck-cli | env-cmd |
|---------|-------------|----------|
| Loads env vars | ❌ | ✅ |
| Validates documentation | ✅ | ❌ |
| CI/CD checks | ✅ | ❌ |
| Runtime tool | ❌ | ✅ |

**Different use cases:** env-cmd loads environment variables for command execution. envcheck-cli validates that your env vars are properly documented. They solve different problems.

### vs Manual Code Review

| Feature | envcheck-cli | Manual Review |
|---------|-------------|---------------|
| Speed | ⚡ Instant | 🐌 Slow |
| Accuracy | 🎯 Consistent | 🤷 Variable |
| Cost | 💰 Free | 💸 Expensive |
| Catches everything | ✅ | ❌ (human error) |
| Understands context | ❌ | ✅ |

**Use envcheck-cli for:** Automated, consistent checks in CI/CD.

**Use manual review for:** Understanding business logic and context.

## Why Choose envcheck-cli?

### Unique Advantages

1. **Zero Dependencies**
   - No supply chain attacks
   - No dependency hell
   - Tiny package size
   - Fast installation

2. **Multi-Language Support**
   - One tool for all your projects
   - Consistent behavior across languages
   - Easy to add new languages

3. **CI/CD First**
   - Designed for automation
   - Multiple output formats
   - Configurable failure conditions
   - Fast execution

4. **Simple & Focused**
   - Does one thing well
   - No configuration needed
   - Works out of the box
   - Easy to understand

### When NOT to Use envcheck-cli

- You need real-time IDE feedback → Use ESLint plugins
- You need to validate .env syntax → Use dotenv-linter
- You need to load env vars → Use dotenv or env-cmd
- You use dynamic env var names → Manual review needed

## Migration Guide

### From Manual Checks

1. Install envcheck-cli: `npm install -g envcheck-cli`
2. Run once: `envcheck`
3. Fix reported issues
4. Add to CI/CD pipeline
5. Add pre-commit hook

### From ESLint Plugins

Keep your ESLint setup for real-time feedback, add envcheck-cli for:
- Multi-language projects
- CI/CD validation
- .env.example checks

### From dotenv-linter

Keep dotenv-linter for .env syntax validation, add envcheck-cli for:
- Code reference validation
- Multi-language support
- Unused variable detection

## Feature Comparison Matrix

| Feature | envcheck-cli | dotenv-linter | ESLint | env-cmd | Manual |
|---------|-------------|---------------|--------|---------|--------|
| JavaScript/TypeScript | ✅ | ❌ | ✅ | ✅ | ✅ |
| Python | ✅ | ❌ | ❌ | ❌ | ✅ |
| Go | ✅ | ❌ | ❌ | ❌ | ✅ |
| Ruby | ✅ | ❌ | ❌ | ❌ | ✅ |
| Rust | ✅ | ❌ | ❌ | ❌ | ✅ |
| Shell | ✅ | ❌ | ❌ | ❌ | ✅ |
| Zero dependencies | ✅ | ✅ | ❌ | ❌ | ✅ |
| CI/CD ready | ✅ | ✅ | ✅ | ❌ | ❌ |
| Checks code refs | ✅ | ❌ | ⚠️ | ❌ | ✅ |
| Checks .env syntax | ❌ | ✅ | ❌ | ❌ | ✅ |
| Real-time feedback | ❌ | ❌ | ✅ | ❌ | ✅ |
| Auto-fix | ❌ | ✅ | ✅ | ❌ | ❌ |
| Setup required | ❌ | ❌ | ✅ | ❌ | ❌ |

## Complementary Tools

envcheck-cli works great with:

- **dotenv** - Load env vars at runtime
- **dotenv-linter** - Validate .env file syntax
- **ESLint** - Real-time code quality checks
- **husky** - Git hooks for automation
- **GitHub Actions** - CI/CD automation

## Conclusion

envcheck-cli fills a specific gap: validating that environment variables used in code are properly documented in `.env.example` across multiple languages. It's not trying to replace other tools, but complement them in a zero-dependency, CI/CD-friendly package.

Choose the right tool for your needs, or use multiple tools together for comprehensive coverage.
