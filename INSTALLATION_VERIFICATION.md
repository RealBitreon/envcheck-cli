# envcheck-cli Installation Verification Guide

## Quick Start

envcheck-cli v1.0.0 is now live on npm! Here's how to install and verify it works.

## Installation

### Option 1: Global Installation (Recommended)
```bash
npm install -g envcheck-cli
```

### Option 2: Use with npx (No Installation)
```bash
npx envcheck-cli
```

### Option 3: Local Project Installation
```bash
npm install --save-dev envcheck-cli
```

## Verification Steps

### 1. Check Version
```bash
envcheck --version
```
Expected output: `envcheck v1.0.0`

### 2. View Help
```bash
envcheck --help
```
Should display comprehensive help message with all options.

### 3. Basic Scan
```bash
# Create a test directory
mkdir test-envcheck
cd test-envcheck

# Create a sample .env.example
echo "# Database configuration" > .env.example
echo "DATABASE_URL=" >> .env.example
echo "" >> .env.example
echo "# API Keys" >> .env.example
echo "API_KEY=" >> .env.example

# Create a sample JavaScript file
echo "const dbUrl = process.env.DATABASE_URL;" > app.js
echo "const apiKey = process.env.API_KEY;" >> app.js
echo "const secret = process.env.SECRET_KEY;" >> app.js

# Run envcheck
envcheck .
```

Expected output should show:
- ✅ No issues with DATABASE_URL and API_KEY (documented and used)
- ❌ MISSING: SECRET_KEY (used but not documented)

### 4. Test JSON Output
```bash
envcheck . --format json
```
Should output valid JSON with results.

### 5. Test Interactive REPL
```bash
envcheck --repl
```
Should start interactive mode with:
- Welcome banner
- Command prompt
- Type `:help` to see available commands
- Type `:exit` to quit

### 6. Test Watch Mode
```bash
envcheck . --watch
```
Should start watching files and rerun on changes.
Press Ctrl+C to stop.

### 7. Test Auto-Fix
```bash
envcheck . --fix
```
Should automatically add missing variables to .env.example.

## Common Issues & Solutions

### Issue: "envcheck: command not found"

**Solution 1:** Ensure npm global bin is in PATH
```bash
npm config get prefix
# Add the bin directory to your PATH
```

**Solution 2:** Use npx instead
```bash
npx envcheck-cli
```

**Solution 3:** Reinstall globally
```bash
npm uninstall -g envcheck-cli
npm install -g envcheck-cli
```

### Issue: "Cannot find module"

**Solution:** Clear npm cache and reinstall
```bash
npm cache clean --force
npm install -g envcheck-cli
```

### Issue: Permission errors on Linux/macOS

**Solution:** Use sudo or fix npm permissions
```bash
sudo npm install -g envcheck-cli
# Or fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally
```

### Issue: Windows PowerShell execution policy

**Solution:** Allow script execution
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Feature Testing Checklist

- [ ] Basic scan works (`envcheck .`)
- [ ] Help displays (`envcheck --help`)
- [ ] Version shows (`envcheck --version`)
- [ ] JSON output works (`envcheck . --format json`)
- [ ] GitHub format works (`envcheck . --format github`)
- [ ] REPL mode starts (`envcheck --repl`)
- [ ] Watch mode works (`envcheck . --watch`)
- [ ] Auto-fix works (`envcheck . --fix`)
- [ ] Ignore patterns work (`envcheck . --ignore "node_modules/**"`)
- [ ] Fail conditions work (`envcheck . --fail-on missing`)
- [ ] Config file loads (create `.envcheckrc.json`)
- [ ] Quiet mode works (`envcheck . --quiet`)
- [ ] No-color works (`envcheck . --no-color`)

## Performance Test

Test with a larger codebase:

```bash
# Clone a sample project or use your own
git clone https://github.com/yourusername/your-project
cd your-project

# Run envcheck
time envcheck .
```

Should complete in seconds even for projects with 1000+ files.

## Integration Test

Test in a CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Test envcheck
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npx envcheck-cli . --format github --fail-on missing
```

## Uninstallation

If you need to uninstall:

```bash
# Global uninstall
npm uninstall -g envcheck-cli

# Verify it's removed
envcheck --version
# Should show: command not found
```

## Getting Help

If you encounter issues:

1. Check the [FAQ](docs/FAQ.md)
2. Search [existing issues](https://github.com/bitreon/envcheck-cli/issues)
3. Create a [new issue](https://github.com/bitreon/envcheck-cli/issues/new)
4. Read the [documentation](https://github.com/bitreon/envcheck-cli#readme)

## Success!

If all verification steps pass, envcheck-cli is successfully installed and working! 🎉

You can now use it in your projects to keep environment variables in sync.

---

**Package:** envcheck-cli  
**Version:** 1.0.0  
**npm:** https://www.npmjs.com/package/envcheck-cli  
**GitHub:** https://github.com/bitreon/envcheck-cli
