# Integrations

## CI/CD Platforms

### GitHub Actions

```yaml
name: Environment Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  envcheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Check environment variables
        run: npx envcheck-cli --format github --fail-on missing
```

### GitLab CI

```yaml
envcheck:
  stage: test
  image: node:20-alpine
  script:
    - npx envcheck-cli --fail-on missing,unused
  only:
    - merge_requests
    - main
```

### CircleCI

```yaml
version: 2.1

jobs:
  envcheck:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Check environment variables
          command: npx envcheck-cli --fail-on missing

workflows:
  version: 2
  test:
    jobs:
      - envcheck
```

### Travis CI

```yaml
language: node_js
node_js:
  - 20

script:
  - npx envcheck-cli --fail-on missing,unused
```

### Jenkins

```groovy
pipeline {
    agent any
    
    stages {
        stage('Environment Check') {
            steps {
                sh 'npx envcheck-cli --format json --fail-on missing'
            }
        }
    }
}
```

### Azure Pipelines

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '20.x'
  
- script: npx envcheck-cli --fail-on missing
  displayName: 'Check environment variables'
```

## Git Hooks

### Pre-commit Hook

Using [husky](https://github.com/typicode/husky):

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npx envcheck-cli --fail-on missing"
    }
  }
}
```

Manual `.git/hooks/pre-commit`:

```bash
#!/bin/sh

echo "Checking environment variables..."
npx envcheck-cli --fail-on missing

if [ $? -ne 0 ]; then
  echo "❌ Environment variable check failed"
  echo "Please update .env.example or fix the issues"
  exit 1
fi

echo "✅ Environment variables OK"
```

### Pre-push Hook

```bash
#!/bin/sh

npx envcheck-cli --fail-on missing,undocumented
```

## IDE Integration

### VS Code Task

`.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Check Environment Variables",
      "type": "shell",
      "command": "npx envcheck-cli",
      "problemMatcher": [],
      "group": {
        "kind": "test",
        "isDefault": false
      }
    }
  ]
}
```

### VS Code Extension (Future)

Coming soon: A dedicated VS Code extension for real-time env var validation.

## Docker

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Run envcheck as part of build
RUN npx envcheck-cli --fail-on missing

CMD ["node", "src/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    environment:
      - NODE_ENV=production
    command: sh -c "npx envcheck-cli && npm start"
```

## Package Managers

### npm Scripts

```json
{
  "scripts": {
    "pretest": "envcheck",
    "prebuild": "envcheck --fail-on missing",
    "predeploy": "envcheck --fail-on missing,undocumented",
    "env:check": "envcheck",
    "env:check:strict": "envcheck --fail-on missing,unused,undocumented"
  }
}
```

### Yarn

```json
{
  "scripts": {
    "preinstall": "npx envcheck-cli"
  }
}
```

## Monorepo Tools

### Lerna

```json
{
  "scripts": {
    "env:check": "lerna exec -- npx envcheck-cli"
  }
}
```

### Nx

```json
{
  "targets": {
    "envcheck": {
      "executor": "@nrwl/workspace:run-commands",
      "options": {
        "command": "npx envcheck-cli --fail-on missing"
      }
    }
  }
}
```

### Turborepo

```json
{
  "pipeline": {
    "envcheck": {
      "cache": false,
      "outputs": []
    }
  }
}
```

## Deployment Platforms

### Vercel

`vercel.json`:

```json
{
  "buildCommand": "npx envcheck-cli --fail-on missing && npm run build"
}
```

### Netlify

`netlify.toml`:

```toml
[build]
  command = "npx envcheck-cli --fail-on missing && npm run build"
```

### Heroku

`Procfile`:

```
release: npx envcheck-cli --fail-on missing
web: npm start
```

### Railway

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npx envcheck-cli && npm run build"
  }
}
```

## Monitoring & Alerts

### Slack Notification

```bash
#!/bin/bash

OUTPUT=$(npx envcheck-cli --format json)
ISSUES=$(echo $OUTPUT | jq '.summary.total')

if [ "$ISSUES" -gt 0 ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"⚠️ Environment variable issues found: $ISSUES\"}" \
    $SLACK_WEBHOOK_URL
fi
```

### Discord Webhook

```bash
#!/bin/bash

OUTPUT=$(npx envcheck-cli --format json)
ISSUES=$(echo $OUTPUT | jq '.summary.total')

if [ "$ISSUES" -gt 0 ]; then
  curl -X POST -H 'Content-Type: application/json' \
    -d "{\"content\":\"⚠️ $ISSUES environment variable issues detected\"}" \
    $DISCORD_WEBHOOK_URL
fi
```

## Custom Integrations

### API Endpoint

```javascript
import { exec } from 'child_process';
import express from 'express';

const app = express();

app.get('/api/envcheck', (req, res) => {
  exec('npx envcheck-cli --format json', (error, stdout) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(JSON.parse(stdout));
  });
});

app.listen(3000);
```

### Programmatic Usage

```javascript
import { scanDirectory } from 'envcheck-cli/src/scanner.js';

const results = await scanDirectory('./my-project');
console.log(results);
```
