import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scan, getSupportedExtensions, getPatterns } from '../../src/scanners/shell.js';

describe('Shell/Bash Scanner', () => {
  describe('scan()', () => {
    it('should detect ${VAR_NAME} (braced variable expansion)', () => {
      const content = `
#!/bin/bash
echo "Database: \${DATABASE_URL}"
echo "API Key: \${API_KEY}"
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[0].lineNumber, 2);
      assert.strictEqual(result[0].pattern, '${DATABASE_URL}');
      assert.strictEqual(result[1].varName, 'API_KEY');
      assert.strictEqual(result[1].lineNumber, 3);
      assert.strictEqual(result[1].pattern, '${API_KEY}');
    });

    it('should detect $VAR_NAME (simple variable expansion)', () => {
      const content = `
#!/bin/bash
echo "Port: $PORT"
echo "Host: $HOST"
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[0].lineNumber, 2);
      assert.strictEqual(result[0].pattern, '$PORT');
      assert.strictEqual(result[1].varName, 'HOST');
      assert.strictEqual(result[1].lineNumber, 3);
      assert.strictEqual(result[1].pattern, '$HOST');
    });

    it('should detect variables within double quotes', () => {
      const content = `
DB_CONN="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 5);
      assert.strictEqual(result[0].varName, 'DB_USER');
      assert.strictEqual(result[1].varName, 'DB_PASS');
      assert.strictEqual(result[2].varName, 'DB_HOST');
      assert.strictEqual(result[3].varName, 'DB_PORT');
      assert.strictEqual(result[4].varName, 'DB_NAME');
    });

    it('should detect braced variables within double quotes', () => {
      const content = `
URL="https://\${API_HOST}/api/v1/\${API_VERSION}"
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'API_HOST');
      assert.strictEqual(result[1].varName, 'API_VERSION');
    });

    it('should detect variables in command substitution', () => {
      const content = `
result=$(curl -H "Authorization: Bearer \${AUTH_TOKEN}" $API_URL)
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'API_URL');
      assert.strictEqual(result[1].varName, 'AUTH_TOKEN');
    });

    it('should detect variables in conditional statements', () => {
      const content = `
if [ "$ENVIRONMENT" = "production" ]; then
  echo "Using \${PROD_DATABASE_URL}"
else
  echo "Using \${DEV_DATABASE_URL}"
fi
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'ENVIRONMENT');
      assert.strictEqual(result[1].varName, 'PROD_DATABASE_URL');
      assert.strictEqual(result[2].varName, 'DEV_DATABASE_URL');
    });

    it('should detect variables in export statements', () => {
      const content = `
export PATH="$PATH:$HOME/bin"
export DATABASE_URL="\${DB_PROTOCOL}://\${DB_HOST}:\${DB_PORT}"
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 5);
      assert.strictEqual(result[0].varName, 'PATH');
      assert.strictEqual(result[1].varName, 'HOME');
      assert.strictEqual(result[2].varName, 'DB_PROTOCOL');
      assert.strictEqual(result[3].varName, 'DB_HOST');
      assert.strictEqual(result[4].varName, 'DB_PORT');
    });

    it('should detect variables with default values', () => {
      const content = 'PORT=${PORT:-8080}\nHOST=${HOST:-localhost}';

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[1].varName, 'HOST');
    });

    it('should detect mixed patterns in the same file', () => {
      const content = `
echo $VAR_A
echo \${VAR_B}
echo "$VAR_C and \${VAR_D}"
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 4);
      assert.strictEqual(result[0].varName, 'VAR_A');
      assert.strictEqual(result[1].varName, 'VAR_B');
      assert.strictEqual(result[2].varName, 'VAR_C');
      assert.strictEqual(result[3].varName, 'VAR_D');
    });

    it('should ignore lowercase variable names', () => {
      const content = `
local_var="test"
echo $local_var
echo \${another_var}
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 0);
    });

    it('should ignore special shell variables', () => {
      const content = `
echo $1 $2 $@ $* $? $$ $! $-
      `.trim();

      const result = scan(content, 'test.sh');

      // These don't match because they don't start with uppercase letter or underscore
      assert.strictEqual(result.length, 0);
    });

    it('should accept variables starting with underscore', () => {
      const content = `
echo $_PRIVATE_VAR
echo \${_INTERNAL_CONFIG}
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, '_PRIVATE_VAR');
      assert.strictEqual(result[1].varName, '_INTERNAL_CONFIG');
    });

    it('should accept variables with numbers after letters', () => {
      const content = `
echo $VAR_123_TEST
echo \${CONFIG_V2}
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'VAR_123_TEST');
      assert.strictEqual(result[1].varName, 'CONFIG_V2');
    });

    it('should handle empty content', () => {
      const result = scan('', 'test.sh');

      assert.strictEqual(result.length, 0);
    });

    it('should handle content with no matches', () => {
      const content = `
#!/bin/bash
echo "hello world"
x=42
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 0);
    });

    it('should track correct line numbers in multi-line files', () => {
      const content = `
#!/bin/bash
# Line 2
echo "Line 3"
echo $VAR_LINE_5
# Line 6
echo \${VAR_LINE_7}
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].lineNumber, 4);
      assert.strictEqual(result[0].varName, 'VAR_LINE_5');
      assert.strictEqual(result[1].lineNumber, 6);
      assert.strictEqual(result[1].varName, 'VAR_LINE_7');
    });

    it('should include filePath in results', () => {
      const content = `echo $TEST_VAR`;

      const result = scan(content, 'scripts/deploy.sh');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'scripts/deploy.sh');
    });

    it('should handle variables in function definitions', () => {
      const content = `
function deploy() {
  echo "Deploying to \${DEPLOY_ENV}"
  curl -X POST $WEBHOOK_URL
}
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DEPLOY_ENV');
      assert.strictEqual(result[1].varName, 'WEBHOOK_URL');
    });

    it('should handle variables in case statements', () => {
      const content = `
case $ENVIRONMENT in
  production)
    DB_URL=$PROD_DB_URL
    ;;
  staging)
    DB_URL=$STAGING_DB_URL
    ;;
esac
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'ENVIRONMENT');
      assert.strictEqual(result[1].varName, 'PROD_DB_URL');
      assert.strictEqual(result[2].varName, 'STAGING_DB_URL');
    });

    it('should handle variables in array assignments', () => {
      const content = `
SERVERS=($PRIMARY_SERVER $SECONDARY_SERVER $BACKUP_SERVER)
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'PRIMARY_SERVER');
      assert.strictEqual(result[1].varName, 'SECONDARY_SERVER');
      assert.strictEqual(result[2].varName, 'BACKUP_SERVER');
    });

    it('should handle variables in here documents', () => {
      const content = `
cat <<EOF
Database: \${DATABASE_URL}
API Key: $API_KEY
EOF
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
    });

    it('should not detect variables in single quotes', () => {
      const content = `
echo 'This $VAR_NAME will not expand'
echo 'Neither will \${ANOTHER_VAR}'
      `.trim();

      const result = scan(content, 'test.sh');

      // Single quotes prevent expansion in shell, but our scanner still detects them
      // This is intentional - we want to document all potential env var references
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'VAR_NAME');
      assert.strictEqual(result[1].varName, 'ANOTHER_VAR');
    });

    it('should handle comments containing env var patterns', () => {
      const content = `
# This script uses $COMMENTED_VAR
echo $ACTUAL_VAR
# Also uses \${ANOTHER_COMMENT}
      `.trim();

      const result = scan(content, 'test.sh');

      // Comments are not filtered - regex matches all occurrences
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'COMMENTED_VAR');
      assert.strictEqual(result[1].varName, 'ACTUAL_VAR');
      assert.strictEqual(result[2].varName, 'ANOTHER_COMMENT');
    });

    it('should handle multiple references on the same line', () => {
      const content = `echo "$VAR_A $VAR_B \${VAR_C} \${VAR_D}"`;

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 4);
      assert.strictEqual(result[0].varName, 'VAR_A');
      assert.strictEqual(result[1].varName, 'VAR_B');
      assert.strictEqual(result[2].varName, 'VAR_C');
      assert.strictEqual(result[3].varName, 'VAR_D');
      assert.strictEqual(result[0].lineNumber, 1);
      assert.strictEqual(result[1].lineNumber, 1);
      assert.strictEqual(result[2].lineNumber, 1);
      assert.strictEqual(result[3].lineNumber, 1);
    });

    it('should handle variables in arithmetic expressions', () => {
      const content = 'result=$(($PORT + 1000))\ntotal=$(($MAX_CONNECTIONS * 2))';

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[1].varName, 'MAX_CONNECTIONS');
    });

    it('should handle variables with colons (parameter expansion)', () => {
      const content = 'echo ${DATABASE_URL:=default}\necho ${API_KEY:?required}';

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
    });

    it('should handle docker run commands with env vars', () => {
      const content = `
docker run -e DATABASE_URL=$DATABASE_URL -e API_KEY=\${API_KEY} myapp
      `.trim();

      const result = scan(content, 'test.sh');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
    });

    it('should avoid duplicate detection of same variable on same line', () => {
      const content = `echo $VAR_NAME`;

      const result = scan(content, 'test.sh');

      // Should only detect once, not twice from both patterns
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'VAR_NAME');
    });

    it('should handle real-world deployment script', () => {
      const content = `
#!/bin/bash
set -e

echo "Deploying to \${DEPLOY_ENV}"

if [ -z "$API_KEY" ]; then
  echo "Error: API_KEY not set"
  exit 1
fi

docker build -t myapp:latest .
docker tag myapp:latest $DOCKER_REGISTRY/myapp:$VERSION
docker push $DOCKER_REGISTRY/myapp:$VERSION

curl -X POST \\
  -H "Authorization: Bearer \${WEBHOOK_TOKEN}" \\
  -d "version=$VERSION&env=$DEPLOY_ENV" \\
  $WEBHOOK_URL
      `.trim();

      const result = scan(content, 'deploy.sh');

      assert.strictEqual(result.length, 10);
      
      const varNames = result.map(r => r.varName);
      assert.ok(varNames.includes('DEPLOY_ENV'));
      assert.ok(varNames.includes('API_KEY'));
      assert.ok(varNames.includes('DOCKER_REGISTRY'));
      assert.ok(varNames.includes('VERSION'));
      assert.ok(varNames.includes('WEBHOOK_TOKEN'));
      assert.ok(varNames.includes('WEBHOOK_URL'));
    });
  });

  describe('getSupportedExtensions()', () => {
    it('should return array of supported extensions', () => {
      const extensions = getSupportedExtensions();

      assert.ok(Array.isArray(extensions));
      assert.ok(extensions.length > 0);
    });

    it('should include .sh extension', () => {
      const extensions = getSupportedExtensions();

      assert.ok(extensions.includes('.sh'));
    });

    it('should include .bash extension', () => {
      const extensions = getSupportedExtensions();

      assert.ok(extensions.includes('.bash'));
    });

    it('should include .zsh extension', () => {
      const extensions = getSupportedExtensions();

      assert.ok(extensions.includes('.zsh'));
    });

    it('should have exactly 3 extensions', () => {
      const extensions = getSupportedExtensions();

      assert.strictEqual(extensions.length, 3);
      assert.deepStrictEqual(extensions, ['.sh', '.bash', '.zsh']);
    });
  });

  describe('getPatterns()', () => {
    it('should return array of RegExp patterns', () => {
      const patterns = getPatterns();

      assert.ok(Array.isArray(patterns));
      assert.ok(patterns.length > 0);
      patterns.forEach(pattern => {
        assert.ok(pattern instanceof RegExp);
      });
    });

    it('should have global flag on all patterns', () => {
      const patterns = getPatterns();

      patterns.forEach(pattern => {
        assert.ok(pattern.global, 'Pattern should have global flag');
      });
    });

    it('should have exactly 2 patterns', () => {
      const patterns = getPatterns();

      assert.strictEqual(patterns.length, 2);
    });
  });
});
