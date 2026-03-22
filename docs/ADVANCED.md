# Advanced Features

## Watch Mode

Automatically rerun validation when files change:

```bash
envcheck . --watch
```

Features:
- Debounced file watching (300ms delay)
- Ignores common non-source files
- Shows timestamp for each run
- Graceful shutdown with Ctrl+C

## Auto-Fix

Automatically add missing variables to .env.example:

```bash
envcheck . --fix
```

The auto-fix feature:
- Adds missing variables with smart default values
- Preserves existing comments and formatting
- Infers example values based on variable names
- Creates backup before modifying

## Intelligent Suggestions

Get actionable suggestions for fixing issues:

```bash
envcheck . --suggestions
```

Suggestions include:
- Typo detection (Did you mean X instead of Y?)
- Smart example values based on variable names
- Removal recommendations for unused variables
- Documentation templates for undocumented variables

## REPL Mode

Interactive shell for exploring and fixing issues:

```bash
envcheck
# or
envcheck --repl
```

### REPL Commands

```
:help              Show all commands
:config            Show current configuration
:set path ./src    Change scan path
:watch             Start watch mode
:fix               Auto-fix issues
:suggest           Show suggestions
:save              Save config to file
:history           Show command history
:exit              Exit REPL
```

### REPL Features

- Tab completion for commands and paths
- Command history (up/down arrows)
- Persistent session configuration
- Result caching

## Caching

envcheck caches scan results for improved performance:

```javascript
// Automatic caching (1 hour TTL)
const cache = new Cache('envcheck');

// Check cache
if (cache.has(key)) {
  return cache.get(key);
}

// Clear cache
cache.clear();
```

## Plugin System

Extend envcheck with custom plugins:

```javascript
// my-plugin.js
export default {
  name: 'my-plugin',
  version: '1.0.0',
  
  init(manager) {
    manager.hook('beforeScan', async (data) => {
      console.log('Custom pre-scan logic');
    });
  },
  
  scanner: {
    extensions: ['.custom'],
    scanLine(line, filePath, lineNumber) {
      // Custom scanning logic
      return [];
    },
  },
};
```

Load plugins:

```javascript
import { PluginManager } from 'envcheck/plugins';

const manager = new PluginManager();
await manager.loadFromDirectory('./plugins');
```

## Custom Formatters

Create custom output formatters:

```javascript
// custom-formatter.js
export function formatCustom(result, options) {
  return {
    summary: {
      missing: result.missing.length,
      unused: result.unused.length,
      undocumented: result.undocumented.length,
    },
    details: result,
  };
}
```

## Performance Optimization

### Concurrency Control

Control scan concurrency with environment variable:

```bash
ENVCHECK_SCAN_CONCURRENCY=16 envcheck .
```

Default: 8 workers
Range: 1-32 workers

### Ignore Patterns

Optimize scans by ignoring unnecessary files:

```json
{
  "ignore": [
    "node_modules/**",
    "dist/**",
    "build/**",
    ".git/**",
    "**/*.min.js",
    "**/*.bundle.js"
  ]
}
```

### Cache Configuration

Adjust cache TTL:

```javascript
const cache = new Cache('envcheck');
const maxAge = 30 * 60 * 1000; // 30 minutes

const result = cache.get(key, maxAge);
```

## Integration Examples

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/sh
envcheck . --fail-on missing --quiet
```

### npm Scripts

```json
{
  "scripts": {
    "env:check": "envcheck .",
    "env:watch": "envcheck . --watch",
    "env:fix": "envcheck . --fix",
    "pretest": "envcheck . --fail-on all"
  }
}
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g envcheck
RUN envcheck . --fail-on all
```

### VS Code Task

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Check Environment Variables",
      "type": "shell",
      "command": "envcheck . --watch",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    }
  ]
}
```

## Troubleshooting

### Large Codebases

For very large codebases:

```bash
# Increase concurrency
ENVCHECK_SCAN_CONCURRENCY=32 envcheck .

# Use specific paths
envcheck ./src --ignore "**/vendor/**"

# Disable progress for speed
envcheck . --no-progress
```

### Memory Issues

```bash
# Reduce concurrency
ENVCHECK_SCAN_CONCURRENCY=4 envcheck .

# Scan in chunks
envcheck ./src/module1
envcheck ./src/module2
```

### False Positives

```json
{
  "ignore": [
    "**/*.test.js",
    "**/*.spec.ts",
    "**/mocks/**",
    "**/fixtures/**"
  ]
}
```
