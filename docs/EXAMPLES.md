# Usage Examples

## Basic Usage

### Scan Current Directory
```bash
envcheck
```

### Scan Specific Directory
```bash
envcheck /path/to/project
```

## Output Formats

### Human-Readable (Default)
```bash
envcheck
```
Output:
```
Environment Variable Check Results
==================================

MISSING (in code, not in .env.example):
  - DATABASE_URL (found in: src/db.js:12)
  - API_SECRET (found in: src/api.js:45)

UNUSED (in .env.example, not in code):
  - LEGACY_FEATURE_FLAG

UNDOCUMENTED (used but no comment):
  - REDIS_HOST

Summary: 4 issues found
```

### JSON Format
```bash
envcheck --format json
```
Output:
```json
{
  "missing": [
    {
      "name": "DATABASE_URL",
      "locations": ["src/db.js:12"]
    }
  ],
  "unused": ["LEGACY_FEATURE_FLAG"],
  "undocumented": ["REDIS_HOST"],
  "summary": {
    "total": 4,
    "missing": 2,
    "unused": 1,
    "undocumented": 1
  }
}
```

### GitHub Actions Format
```bash
envcheck --format github
```
Output:
```
::error file=src/db.js,line=12::Missing env var: DATABASE_URL
::warning file=.env.example::Unused env var: LEGACY_FEATURE_FLAG
```

## CI/CD Integration

### Fail on Missing Variables
```bash
envcheck --fail-on missing
```
Exit code: 1 if any missing variables found

### Fail on Any Issues
```bash
envcheck --fail-on missing,unused,undocumented
```

### GitHub Actions Workflow
```yaml
name: Env Check

on: [push, pull_request]

jobs:
  envcheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx envcheck-cli --format github --fail-on missing
```

### GitLab CI
```yaml
envcheck:
  image: node:20
  script:
    - npx envcheck-cli --fail-on missing,unused
  only:
    - merge_requests
    - main
```

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

npx envcheck-cli --fail-on missing
if [ $? -ne 0 ]; then
  echo "❌ Environment variable check failed"
  exit 1
fi
```

## Language-Specific Examples

### JavaScript/TypeScript
```javascript
// Detected patterns:
process.env.API_KEY
process.env['DATABASE_URL']
const { NODE_ENV } = process.env
```

### Python
```python
# Detected patterns:
os.environ['API_KEY']
os.environ.get('DATABASE_URL')
os.getenv('NODE_ENV')
```

### Go
```go
// Detected patterns:
os.Getenv("API_KEY")
os.LookupEnv("DATABASE_URL")
```

### Ruby
```ruby
# Detected patterns:
ENV['API_KEY']
ENV.fetch('DATABASE_URL')
```

### Rust
```rust
// Detected patterns:
env::var("API_KEY")
env::var_os("DATABASE_URL")
```

### Shell
```bash
# Detected patterns:
$API_KEY
${DATABASE_URL}
echo "$NODE_ENV"
```

## Advanced Usage

### Custom .env.example Location
```bash
envcheck --env-file config/.env.example
```

### Exclude Specific Directories
```bash
envcheck --ignore "vendor/**,dist/**"
```

### Verbose Output
```bash
envcheck --verbose
```

## Real-World Scenarios

### Onboarding New Developers
```bash
# Check if all required env vars are documented
envcheck --fail-on missing,undocumented
```

### Cleaning Up Legacy Code
```bash
# Find unused env vars to remove
envcheck --format json | jq '.unused[]'
```

### Pre-deployment Check
```bash
# Ensure no undocumented vars in production
envcheck --fail-on undocumented || exit 1
```

### Monorepo Support
```bash
# Check multiple packages
for dir in packages/*; do
  echo "Checking $dir"
  envcheck "$dir"
done
```
