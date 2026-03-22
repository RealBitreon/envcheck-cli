# npm Scripts Examples for envcheck

This document provides various npm script configurations for integrating envcheck into your development workflow.

## Basic Configuration

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "env:check": "envcheck .",
    "env:check:ci": "envcheck . --format json --fail-on missing"
  }
}
```

Usage:
```bash
npm run env:check
npm run env:check:ci
```

---

## Pre-commit Hook Integration

Automatically validate environment variables before committing:

```json
{
  "scripts": {
    "env:check": "envcheck . --fail-on missing",
    "precommit": "npm run env:check"
  }
}
```

With Husky:
```json
{
  "scripts": {
    "env:check": "envcheck . --fail-on missing"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run env:check"
    }
  }
}
```

---

## Pre-test Validation

Run envcheck before tests to catch environment issues early:

```json
{
  "scripts": {
    "test": "vitest",
    "pretest": "envcheck . --fail-on missing --quiet"
  }
}
```

Now `npm test` automatically validates environment variables first.

---

## Multi-environment Configuration

Validate different environment files:

```json
{
  "scripts": {
    "env:check": "envcheck .",
    "env:check:dev": "envcheck . --env-file .env.development.example",
    "env:check:staging": "envcheck . --env-file .env.staging.example",
    "env:check:prod": "envcheck . --env-file .env.production.example --fail-on all",
    "env:check:all": "npm run env:check:dev && npm run env:check:staging && npm run env:check:prod"
  }
}
```

---

## Output Format Options

Generate reports in different formats:

```json
{
  "scripts": {
    "env:check": "envcheck . --format text",
    "env:check:json": "envcheck . --format json > envcheck-report.json",
    "env:check:github": "envcheck . --format github",
    "env:check:ci": "envcheck . --format json --fail-on all"
  }
}
```

---

## Custom Ignore Patterns

Exclude specific files or directories:

```json
{
  "scripts": {
    "env:check": "envcheck . --ignore '**/*.test.js' --ignore '**/__tests__/**' --ignore '**/dist/**'"
  }
}
```

---

## Fail-on Strategies

Different failure conditions for different scenarios:

```json
{
  "scripts": {
    "env:check:strict": "envcheck . --fail-on all",
    "env:check:missing": "envcheck . --fail-on missing",
    "env:check:unused": "envcheck . --fail-on unused",
    "env:check:undocumented": "envcheck . --fail-on undocumented",
    "env:check:warn": "envcheck . --fail-on none"
  }
}
```

---

## Watch Mode Integration

Run envcheck when files change (requires nodemon or similar):

```json
{
  "scripts": {
    "dev": "nodemon --exec 'npm run env:check && node src/index.js' --watch src --watch .env.example",
    "env:check": "envcheck . --quiet"
  }
}
```

---

## Monorepo Configuration

Validate environment variables across multiple packages:

```json
{
  "scripts": {
    "env:check": "npm run env:check:api && npm run env:check:web && npm run env:check:worker",
    "env:check:api": "envcheck ./packages/api --env-file ./packages/api/.env.example",
    "env:check:web": "envcheck ./packages/web --env-file ./packages/web/.env.example",
    "env:check:worker": "envcheck ./packages/worker --env-file ./packages/worker/.env.example"
  }
}
```

With workspaces:
```json
{
  "scripts": {
    "env:check": "npm run env:check --workspaces"
  },
  "workspaces": [
    "packages/*"
  ]
}
```

---

## Verbose and Quiet Modes

Control output verbosity:

```json
{
  "scripts": {
    "env:check": "envcheck .",
    "env:check:quiet": "envcheck . --quiet",
    "env:check:no-color": "envcheck . --no-color",
    "env:check:ci": "envcheck . --no-color --fail-on missing"
  }
}
```

---

## Combined with Other Tools

Integrate with linting and formatting:

```json
{
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write .",
    "env:check": "envcheck . --fail-on missing",
    "validate": "npm run lint && npm run format && npm run env:check",
    "precommit": "npm run validate"
  }
}
```

---

## Build Pipeline Integration

Validate before building:

```json
{
  "scripts": {
    "build": "vite build",
    "prebuild": "npm run env:check",
    "env:check": "envcheck . --fail-on all --quiet"
  }
}
```

---

## Docker Integration

Validate environment variables in Docker builds:

```json
{
  "scripts": {
    "docker:build": "npm run env:check && docker build -t myapp .",
    "docker:validate": "docker run --rm myapp npm run env:check",
    "env:check": "envcheck . --fail-on missing"
  }
}
```

---

## Complete Example

A comprehensive setup with all common scenarios:

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "vitest",
    "build": "vite build",
    
    "env:check": "envcheck .",
    "env:check:dev": "envcheck . --env-file .env.development.example",
    "env:check:prod": "envcheck . --env-file .env.production.example --fail-on all",
    "env:check:ci": "envcheck . --format json --fail-on missing",
    "env:check:report": "envcheck . --format json > reports/envcheck.json",
    
    "pretest": "npm run env:check -- --quiet",
    "prebuild": "npm run env:check:prod -- --quiet",
    "prestart": "npm run env:check -- --quiet",
    
    "validate": "npm run lint && npm run env:check",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "envcheck": "^1.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "vitest": "^1.0.0",
    "nodemon": "^3.0.0"
  }
}
```

---

## Tips and Best Practices

1. **Use `--quiet` in pre-hooks** to avoid cluttering output
2. **Use `--fail-on missing` in CI** to catch critical issues
3. **Use `--fail-on all` for production** to enforce strict validation
4. **Generate JSON reports** for tracking over time
5. **Run before tests** to catch environment issues early
6. **Use different env files** for different environments
7. **Combine with linting** for comprehensive validation
8. **Add to pre-commit hooks** to prevent bad commits

---

## Troubleshooting

### Script fails silently
Add `set -e` to ensure errors propagate:
```json
{
  "scripts": {
    "env:check": "set -e && envcheck ."
  }
}
```

### Need to see full output in CI
Remove `--quiet` flag:
```json
{
  "scripts": {
    "env:check:ci": "envcheck . --format text --fail-on missing"
  }
}
```

### Want to continue on errors
Use `|| true`:
```json
{
  "scripts": {
    "env:check:warn": "envcheck . --fail-on all || true"
  }
}
```
