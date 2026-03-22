# Configuration Guide

envcheck supports multiple configuration methods to fit your workflow.

## Configuration Files

envcheck automatically loads configuration from these files (in order of precedence):

1. `.envcheckrc`
2. `.envcheckrc.json`
3. `envcheck.config.json`
4. `.envcheckrc.js`
5. `envcheck.config.js`

### JSON Configuration

```json
{
  "path": ".",
  "envFile": ".env.example",
  "format": "text",
  "failOn": "none",
  "ignore": [
    "node_modules/**",
    "dist/**",
    "**/*.test.js"
  ],
  "noColor": false,
  "quiet": false,
  "watch": false,
  "suggestions": true,
  "progress": true
}
```

### JavaScript Configuration

```javascript
// envcheck.config.js
export default {
  path: '.',
  envFile: '.env.example',
  format: 'text',
  failOn: 'missing',
  ignore: [
    'node_modules/**',
    'dist/**',
  ],
  // Dynamic configuration
  suggestions: process.env.CI !== 'true',
  progress: process.stdout.isTTY,
};
```

## Configuration Options

### Core Options

- `path` (string): Directory or file to scan (default: `"."`)
- `envFile` (string): Path to .env.example file (default: `".env.example"`)
- `format` (string): Output format - `text`, `json`, `github` (default: `"text"`)
- `failOn` (string): Exit with code 1 if condition met - `missing`, `unused`, `undocumented`, `all`, `none` (default: `"none"`)

### Filtering Options

- `ignore` (array): Glob patterns to ignore
  ```json
  {
    "ignore": [
      "node_modules/**",
      "dist/**",
      "**/*.test.js",
      "**/*.spec.ts"
    ]
  }
  ```

### Display Options

- `noColor` (boolean): Disable colored output (default: `false`)
- `quiet` (boolean): Suppress output when no issues found (default: `false`)
- `suggestions` (boolean): Show intelligent suggestions (default: `true`)
- `progress` (boolean): Show progress indicators (default: `true`)

### Advanced Options

- `watch` (boolean): Watch mode - rerun on file changes (default: `false`)
- `fix` (boolean): Auto-fix issues by updating .env.example (default: `false`)
- `config` (string): Load configuration from specific file

## CLI Override

CLI arguments always override configuration file settings:

```bash
# Config file sets format: "text"
# This command uses format: "json"
envcheck . --format json
```

## Environment-Specific Configs

Create different configs for different environments:

```bash
# Development
envcheck --config .envcheckrc.dev.json

# Production
envcheck --config .envcheckrc.prod.json

# CI/CD
envcheck --config .envcheckrc.ci.json
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Check environment variables
  run: envcheck . --format github --fail-on all
```

### GitLab CI

```yaml
envcheck:
  script:
    - envcheck . --format text --fail-on missing
```

### Jenkins

```groovy
stage('Env Check') {
  steps {
    sh 'envcheck . --format json --fail-on all'
  }
}
```

## Best Practices

1. **Commit your config**: Add `.envcheckrc.json` to version control
2. **Use ignore patterns**: Exclude test files and build artifacts
3. **Set failOn in CI**: Use `--fail-on all` in CI/CD pipelines
4. **Enable suggestions**: Keep `suggestions: true` for helpful hints
5. **Use watch mode**: Enable `--watch` during development

## Example Configurations

### Strict Mode (CI/CD)

```json
{
  "format": "github",
  "failOn": "all",
  "quiet": false,
  "suggestions": false,
  "progress": false
}
```

### Development Mode

```json
{
  "format": "text",
  "failOn": "none",
  "watch": true,
  "suggestions": true,
  "progress": true
}
```

### Monorepo Setup

```json
{
  "path": ".",
  "ignore": [
    "node_modules/**",
    "packages/*/dist/**",
    "packages/*/build/**"
  ],
  "envFile": ".env.example"
}
```
