# CLI Reference

Complete reference for all envcheck command-line options and flags.

## Synopsis

```bash
envcheck [path] [options]
```

## Arguments

### path

Directory or file to scan for environment variable usage.

- Type: `string`
- Default: `"."` (current directory)
- Examples:
  ```bash
  envcheck                    # Scan current directory
  envcheck ./src              # Scan src directory
  envcheck src/config.js      # Scan specific file
  ```

## Options

### --env-file \<path\>

Path to the .env.example file to validate against.

- Type: `string`
- Default: `".env.example"`
- Examples:
  ```bash
  envcheck --env-file .env.production.example
  envcheck --env-file config/.env.template
  ```

### --format, -f \<format\>

Output format for results.

- Type: `string`
- Values: `text`, `json`, `github`
- Default: `"text"`
- Examples:
  ```bash
  envcheck --format text      # Human-readable output
  envcheck --format json      # JSON output for scripts
  envcheck --format github    # GitHub Actions annotations
  envcheck -f json            # Short form
  ```

**Format Details:**

- `text`: Human-readable colored output with tables and summaries
- `json`: Structured JSON for programmatic consumption
- `github`: GitHub Actions workflow commands (::error, ::warning)

### --fail-on \<condition\>

Exit with code 1 if the specified condition is met. Useful for CI/CD pipelines.

- Type: `string`
- Values: `missing`, `unused`, `undocumented`, `all`, `none`
- Default: `"none"`
- Examples:
  ```bash
  envcheck --fail-on missing              # Fail if vars missing from .env.example
  envcheck --fail-on unused               # Fail if unused vars in .env.example
  envcheck --fail-on undocumented         # Fail if vars lack comments
  envcheck --fail-on all                  # Fail on any issue
  envcheck --fail-on none                 # Never fail (default)
  ```

**Condition Details:**

- `missing`: Variables used in code but not in .env.example
- `unused`: Variables in .env.example but not used in code
- `undocumented`: Variables without descriptive comments
- `all`: Any of the above conditions
- `none`: Never exit with error code (always 0)

### --ignore, -i \<pattern\>

Glob pattern to exclude from scanning. Can be specified multiple times.

- Type: `string` (repeatable)
- Default: `[]`
- Examples:
  ```bash
  envcheck --ignore "node_modules/**"
  envcheck --ignore "**/*.test.js" --ignore "dist/**"
  envcheck -i "vendor/**" -i "build/**"
  ```

**Common Patterns:**

```bash
--ignore "node_modules/**"      # Exclude dependencies
--ignore "**/*.test.js"         # Exclude test files
--ignore "**/*.spec.ts"         # Exclude TypeScript tests
--ignore "dist/**"              # Exclude build output
--ignore "coverage/**"          # Exclude coverage reports
--ignore ".next/**"             # Exclude Next.js build
```

### --config, -c \<path\>

Load configuration from a specific file.

- Type: `string`
- Default: Auto-detect (`.envcheckrc`, `.envcheckrc.json`, etc.)
- Examples:
  ```bash
  envcheck --config .envcheckrc.json
  envcheck --config config/envcheck.prod.json
  envcheck -c .envcheckrc.dev.json
  ```

### --watch, -w

Watch mode: automatically rerun validation when files change.

- Type: `boolean`
- Default: `false`
- Examples:
  ```bash
  envcheck --watch
  envcheck -w
  envcheck ./src --watch --format json
  ```

**Watch Mode Behavior:**

- Monitors all files in the scan path
- Reruns validation on any file change
- Respects `--ignore` patterns
- Press Ctrl+C to exit

### --fix

Automatically add missing variables to .env.example with smart defaults.

- Type: `boolean`
- Default: `false`
- Examples:
  ```bash
  envcheck --fix
  envcheck . --fix --quiet
  ```

**Auto-fix Behavior:**

- Adds missing variables to .env.example
- Generates smart default values based on variable names
- Preserves existing comments and formatting
- Creates backup before modifying

**Smart Defaults:**

- `API_KEY` → `your_api_key_here`
- `DATABASE_URL` → `postgres://localhost:5432/dbname`
- `PORT` → `3000`
- `NODE_ENV` → `development`
- `REDIS_URL` → `redis://localhost:6379`

### --no-color

Disable colored output. Useful for logs and non-TTY environments.

- Type: `boolean`
- Default: `false`
- Examples:
  ```bash
  envcheck --no-color
  envcheck . --no-color > output.txt
  ```

### --no-suggestions

Disable intelligent suggestions (typo detection, example values).

- Type: `boolean`
- Default: `false`
- Examples:
  ```bash
  envcheck --no-suggestions
  envcheck . --no-suggestions --format json
  ```

### --no-progress

Disable progress indicators and spinners.

- Type: `boolean`
- Default: `false`
- Examples:
  ```bash
  envcheck --no-progress
  envcheck . --no-progress --quiet
  ```

### --quiet, -q

Suppress output when no issues are found. Only show output if problems exist.

- Type: `boolean`
- Default: `false`
- Examples:
  ```bash
  envcheck --quiet
  envcheck -q
  envcheck . --quiet --fail-on missing
  ```

### --repl, -r

Start interactive REPL mode for exploring and fixing issues.

- Type: `boolean`
- Default: `false`
- Examples:
  ```bash
  envcheck --repl
  envcheck -r
  ```

See [REPL Guide](REPL.md) for detailed REPL documentation.

### --version, -v

Display version number and exit.

- Type: `boolean`
- Examples:
  ```bash
  envcheck --version
  envcheck -v
  ```

### --help, -h

Display help message and exit.

- Type: `boolean`
- Examples:
  ```bash
  envcheck --help
  envcheck -h
  ```

## Exit Codes

envcheck uses standard exit codes:

- `0`: Success (no issues found, or issues don't match `--fail-on` condition)
- `1`: Validation failed (issues found matching `--fail-on` condition)
- `2`: Error (invalid arguments, file not found, configuration error)

## Usage Patterns

### Development

```bash
# Quick check during development
envcheck

# Watch mode for continuous feedback
envcheck --watch

# Auto-fix missing variables
envcheck --fix
```

### CI/CD

```bash
# Fail build if variables are missing
envcheck --fail-on missing --format github

# Strict mode: fail on any issue
envcheck --fail-on all --no-color --no-progress

# JSON output for further processing
envcheck --format json --fail-on missing > results.json
```

### Team Workflows

```bash
# Use shared configuration
envcheck --config .envcheckrc.json

# Exclude test files and build artifacts
envcheck --ignore "**/*.test.js" --ignore "dist/**"

# Quiet mode for pre-commit hooks
envcheck --quiet --fail-on missing
```

## Combining Options

Options can be combined for powerful workflows:

```bash
# Watch mode with JSON output
envcheck --watch --format json

# Strict CI check with GitHub annotations
envcheck --fail-on all --format github --no-color

# Auto-fix with quiet output
envcheck --fix --quiet

# Custom config with specific env file
envcheck --config .envcheckrc.prod.json --env-file .env.production.example

# Scan specific directory, ignore tests, fail on missing
envcheck ./src --ignore "**/*.test.js" --fail-on missing
```

## Environment Variables

envcheck respects these environment variables:

- `NO_COLOR`: Disable colored output (same as `--no-color`)
- `CI`: Automatically disables progress indicators in CI environments

## Configuration File vs CLI

CLI arguments always override configuration file settings:

```json
// .envcheckrc.json
{
  "format": "text",
  "failOn": "none"
}
```

```bash
# This uses format: json and failOn: missing (CLI overrides config)
envcheck --format json --fail-on missing
```

## Examples by Use Case

### Onboarding New Developers

```bash
# Check what env vars are needed
envcheck --format text

# Auto-generate .env from .env.example
cp .env.example .env
```

### Pre-commit Hook

```bash
# Fail if missing variables
envcheck --quiet --fail-on missing
```

### CI/CD Pipeline

```bash
# GitHub Actions
envcheck --format github --fail-on all

# GitLab CI
envcheck --format text --fail-on missing --no-color

# Jenkins
envcheck --format json --fail-on missing > results.json
```

### Refactoring

```bash
# Find unused variables to clean up
envcheck --format json | jq '.unused[]'

# Watch for issues while refactoring
envcheck --watch
```

### Monorepo

```bash
# Check each package
for dir in packages/*; do
  echo "Checking $dir"
  envcheck "$dir" --env-file "$dir/.env.example"
done
```

## See Also

- [Configuration Guide](CONFIGURATION.md) - Detailed configuration options
- [REPL Guide](REPL.md) - Interactive mode documentation
- [Examples](EXAMPLES.md) - Real-world usage examples
- [Integrations](INTEGRATIONS.md) - CI/CD and tool integrations
