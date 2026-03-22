# envcheck Example Project

This is a minimal example project demonstrating how to use envcheck to validate environment variables in your application.

## Project Structure

```
basic-project/
├── .env.example          # Environment variable template with comments
├── src/
│   └── config.js         # Configuration file using environment variables
├── package.json          # npm scripts for envcheck
└── README.md            # This file
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Run envcheck to validate your environment variables:
   ```bash
   npm run env:check
   ```

## Usage Examples

### Basic Check
```bash
# Check current directory
envcheck .
```

### CI/CD Integration
```bash
# Fail build if missing variables detected
npm run env:check:ci
```

### Pre-test Hook
The `pretest` script automatically runs envcheck before tests:
```bash
npm test  # Runs env:check first
```

## Expected Output

When all environment variables are properly documented and used:
```
✓ No issues found
Summary: 0 missing, 0 unused, 0 undocumented
```

If there are issues:
```
🔴 MISSING (1)
Variables used in code but not in .env.example:
  - NEW_FEATURE_FLAG
    → src/config.js:42

🟡 UNUSED (1)
Variables in .env.example but never used:
  - LEGACY_API_KEY

Summary: 1 missing, 1 unused, 0 undocumented
```

## Integration with Your Project

Add envcheck to your existing project:

1. Install envcheck:
   ```bash
   npm install --save-dev envcheck
   ```

2. Add npm scripts to `package.json`:
   ```json
   {
     "scripts": {
       "env:check": "envcheck .",
       "pretest": "npm run env:check"
     }
   }
   ```

3. Run the check:
   ```bash
   npm run env:check
   ```
