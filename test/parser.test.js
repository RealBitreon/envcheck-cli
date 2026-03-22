import { describe, it } from 'node:test';
import assert from 'node:assert';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { parseEnvFile, parseEnvLine, extractComment, isValidEnvLine } from '../src/parser.js';

describe('parser', () => {
  describe('extractComment', () => {
    it('should extract comment from value with inline comment', () => {
      const result = extractComment('some_value # This is a comment');
      assert.strictEqual(result, 'This is a comment');
    });

    it('should return null when no comment present', () => {
      const result = extractComment('some_value');
      assert.strictEqual(result, null);
    });

    it('should handle empty comment', () => {
      const result = extractComment('some_value #');
      assert.strictEqual(result, null);
    });

    it('should trim whitespace from comment', () => {
      const result = extractComment('value #   comment with spaces   ');
      assert.strictEqual(result, 'comment with spaces');
    });

    it('should handle multiple # characters', () => {
      const result = extractComment('value # comment with # inside');
      assert.strictEqual(result, 'comment with # inside');
    });
  });

  describe('isValidEnvLine', () => {
    it('should return true for valid env line', () => {
      assert.strictEqual(isValidEnvLine('VAR_NAME=value'), true);
    });

    it('should return true for valid env line with comment', () => {
      assert.strictEqual(isValidEnvLine('VAR_NAME=value # comment'), true);
    });

    it('should return false for empty line', () => {
      assert.strictEqual(isValidEnvLine(''), false);
    });

    it('should return false for whitespace-only line', () => {
      assert.strictEqual(isValidEnvLine('   '), false);
    });

    it('should return false for comment-only line', () => {
      assert.strictEqual(isValidEnvLine('# This is a comment'), false);
    });

    it('should return false for line without equals sign', () => {
      assert.strictEqual(isValidEnvLine('INVALID_LINE'), false);
    });

    it('should return false for line starting with lowercase', () => {
      assert.strictEqual(isValidEnvLine('invalid=value'), false);
    });

    it('should return false for line starting with number', () => {
      assert.strictEqual(isValidEnvLine('123VAR=value'), false);
    });

    it('should return true for variable starting with underscore', () => {
      assert.strictEqual(isValidEnvLine('_VAR_NAME=value'), true);
    });
  });

  describe('parseEnvLine', () => {
    it('should parse simple variable definition', () => {
      const result = parseEnvLine('DATABASE_URL=postgres://localhost', 1);
      assert.deepStrictEqual(result, {
        varName: 'DATABASE_URL',
        hasComment: false,
        comment: null,
        lineNumber: 1
      });
    });

    it('should parse variable with inline comment', () => {
      const result = parseEnvLine('API_KEY=secret123 # Production API key', 5);
      assert.deepStrictEqual(result, {
        varName: 'API_KEY',
        hasComment: true,
        comment: 'Production API key',
        lineNumber: 5
      });
    });

    it('should parse variable with empty value', () => {
      const result = parseEnvLine('EMPTY_VAR=', 10);
      assert.deepStrictEqual(result, {
        varName: 'EMPTY_VAR',
        hasComment: false,
        comment: null,
        lineNumber: 10
      });
    });

    it('should parse variable with empty value and comment', () => {
      const result = parseEnvLine('OPTIONAL_VAR= # Leave empty for default', 3);
      assert.deepStrictEqual(result, {
        varName: 'OPTIONAL_VAR',
        hasComment: true,
        comment: 'Leave empty for default',
        lineNumber: 3
      });
    });

    it('should return null for malformed line without equals', () => {
      const result = parseEnvLine('INVALID_LINE', 1);
      assert.strictEqual(result, null);
    });

    it('should return null for line starting with lowercase', () => {
      const result = parseEnvLine('invalid=value', 1);
      assert.strictEqual(result, null);
    });

    it('should parse variable starting with underscore', () => {
      const result = parseEnvLine('_PRIVATE_VAR=value', 1);
      assert.deepStrictEqual(result, {
        varName: '_PRIVATE_VAR',
        hasComment: false,
        comment: null,
        lineNumber: 1
      });
    });

    it('should parse variable with numbers', () => {
      const result = parseEnvLine('VAR_123_NAME=value', 1);
      assert.deepStrictEqual(result, {
        varName: 'VAR_123_NAME',
        hasComment: false,
        comment: null,
        lineNumber: 1
      });
    });

    it('should handle value with equals sign', () => {
      const result = parseEnvLine('CONNECTION_STRING=key=value&other=data', 1);
      assert.deepStrictEqual(result, {
        varName: 'CONNECTION_STRING',
        hasComment: false,
        comment: null,
        lineNumber: 1
      });
    });

    it('should handle quoted values', () => {
      const result = parseEnvLine('QUOTED_VAR="value with spaces"', 1);
      assert.deepStrictEqual(result, {
        varName: 'QUOTED_VAR',
        hasComment: false,
        comment: null,
        lineNumber: 1
      });
    });
  });

  describe('parseEnvFile', () => {
    const testFilePath = join(process.cwd(), 'test-env-file.tmp');

    async function createTestFile(content) {
      await writeFile(testFilePath, content, 'utf-8');
    }

    async function cleanupTestFile() {
      try {
        await unlink(testFilePath);
      } catch (err) {
        // Ignore if file doesn't exist
      }
    }

    it('should parse file with multiple variables', async () => {
      const content = `DATABASE_URL=postgres://localhost
API_KEY=secret123 # Production key
PORT=3000`;

      await createTestFile(content);

      const result = await parseEnvFile(testFilePath);

      assert.strictEqual(result.length, 3);
      assert.deepStrictEqual(result[0], {
        varName: 'DATABASE_URL',
        hasComment: false,
        comment: null,
        lineNumber: 1
      });
      assert.deepStrictEqual(result[1], {
        varName: 'API_KEY',
        hasComment: true,
        comment: 'Production key',
        lineNumber: 2
      });
      assert.deepStrictEqual(result[2], {
        varName: 'PORT',
        hasComment: false,
        comment: null,
        lineNumber: 3
      });

      await cleanupTestFile();
    });

    it('should skip empty lines', async () => {
      const content = `DATABASE_URL=value

API_KEY=secret

`;

      await createTestFile(content);

      const result = await parseEnvFile(testFilePath);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');

      await cleanupTestFile();
    });

    it('should skip comment-only lines', async () => {
      const content = `# Database configuration
DATABASE_URL=postgres://localhost
# API settings
API_KEY=secret123`;

      await createTestFile(content);

      const result = await parseEnvFile(testFilePath);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');

      await cleanupTestFile();
    });

    it('should handle malformed lines gracefully', async () => {
      const content = `DATABASE_URL=value
invalid line without equals
API_KEY=secret
lowercase=value
VALID_VAR=data`;

      await createTestFile(content);

      const result = await parseEnvFile(testFilePath);

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
      assert.strictEqual(result[2].varName, 'VALID_VAR');

      await cleanupTestFile();
    });

    it('should preserve correct line numbers', async () => {
      const content = `# Comment line 1

DATABASE_URL=value
# Comment line 4
API_KEY=secret`;

      await createTestFile(content);

      const result = await parseEnvFile(testFilePath);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].lineNumber, 3);
      assert.strictEqual(result[1].lineNumber, 5);

      await cleanupTestFile();
    });

    it('should handle empty file', async () => {
      await createTestFile('');

      const result = await parseEnvFile(testFilePath);

      assert.strictEqual(result.length, 0);

      await cleanupTestFile();
    });

    it('should handle file with only comments', async () => {
      const content = `# Comment 1
# Comment 2
# Comment 3`;

      await createTestFile(content);

      const result = await parseEnvFile(testFilePath);

      assert.strictEqual(result.length, 0);

      await cleanupTestFile();
    });

    it('should handle complex real-world example', async () => {
      const content = `# Application Configuration
NODE_ENV=development # Environment: development, staging, production

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/db # PostgreSQL connection string
DB_POOL_SIZE=10

# Redis Cache
REDIS_HOST=localhost # Redis server hostname
REDIS_PORT=6379
REDIS_PASSWORD= # Leave empty for no auth

# API Keys
API_KEY=abc123def456 # External API key
SECRET_KEY=supersecret

# Feature Flags
ENABLE_FEATURE_X=true # Toggle feature X
`;

      await createTestFile(content);

      const result = await parseEnvFile(testFilePath);

      assert.strictEqual(result.length, 9);

      // Check documented variables
      const documented = result.filter(def => def.hasComment);
      assert.strictEqual(documented.length, 6);

      // Check undocumented variables
      const undocumented = result.filter(def => !def.hasComment);
      assert.strictEqual(undocumented.length, 3);

      await cleanupTestFile();
    });

    it('should handle Windows line endings', async () => {
      const content = `DATABASE_URL=value\r\nAPI_KEY=secret\r\n`;

      await createTestFile(content);

      const result = await parseEnvFile(testFilePath);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');

      await cleanupTestFile();
    });

    it('should throw error when file does not exist', async () => {
      await assert.rejects(
        async () => await parseEnvFile('nonexistent-file.env'),
        {
          message: /Environment file not found/
        }
      );
    });

    it('should throw error when path is a directory', async () => {
      const dirPath = join(process.cwd(), 'test-dir.tmp');
      await writeFile(dirPath, '', 'utf-8').catch(() => {});
      
      // Create a directory instead
      const fs = await import('fs/promises');
      try {
        await fs.mkdir(dirPath, { recursive: true });
        
        await assert.rejects(
          async () => await parseEnvFile(dirPath),
          {
            message: /Path is a directory, not a file|EISDIR|EPERM/
          }
        );
        
        await fs.rmdir(dirPath);
      } catch (err) {
        // Cleanup on error
        try {
          await fs.rmdir(dirPath);
        } catch {}
      }
    });
  });
});
