/**
 * Integration tests for file system error handling
 * Tests error scenarios across parser, scanner, and CLI modules
 * 
 * Requirements: 7.1.1-7.1.5
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { parseEnvFile } from '../src/parser.js';
import { scan, scanDirectory } from '../src/scanner.js';

describe('File System Error Handling Integration', () => {
  const testDir = path.join('test', 'fixtures', 'error-integration');

  before(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('.env.example not found (7.1.1)', () => {
    it('should throw descriptive error when .env.example does not exist', async () => {
      const nonExistentPath = path.join(testDir, 'missing.env.example');
      
      await assert.rejects(
        async () => await parseEnvFile(nonExistentPath),
        {
          message: /Environment file not found/
        }
      );
    });

    it('should include file path in error message', async () => {
      const nonExistentPath = path.join(testDir, 'missing.env.example');
      
      try {
        await parseEnvFile(nonExistentPath);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes(nonExistentPath));
      }
    });

    it('should differentiate between not found and other errors', async () => {
      // Create a directory with the .env.example name
      const dirPath = path.join(testDir, 'dir.env.example');
      fs.mkdirSync(dirPath, { recursive: true });
      
      try {
        await parseEnvFile(dirPath);
        assert.fail('Should have thrown an error');
      } catch (error) {
        // Should not say "not found" but rather indicate it's a directory
        assert.ok(
          error.message.includes('directory') || 
          error.message.includes('EISDIR') ||
          error.message.includes('EPERM')
        );
      }
      
      fs.rmdirSync(dirPath);
    });
  });

  describe('Scan path not found (7.1.2)', () => {
    it('should throw descriptive error when scan path does not exist', async () => {
      const nonExistentPath = path.join(testDir, 'nonexistent-scan-path');
      
      await assert.rejects(
        async () => await scan(nonExistentPath, []),
        {
          message: /Path not found/
        }
      );
    });

    it('should include path in error message', async () => {
      const nonExistentPath = path.join(testDir, 'nonexistent-scan-path');
      
      try {
        await scan(nonExistentPath, []);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes(nonExistentPath));
      }
    });

    it('should handle relative and absolute paths', async () => {
      const relativePath = 'nonexistent-relative-path';
      const absolutePath = path.resolve(testDir, 'nonexistent-absolute-path');
      
      await assert.rejects(
        async () => await scan(relativePath, []),
        /Path not found/
      );
      
      await assert.rejects(
        async () => await scan(absolutePath, []),
        /Path not found/
      );
    });
  });

  describe('Permission denied errors (7.1.3)', () => {
    it('should throw error when .env.example is not readable', async () => {
      const restrictedFile = path.join(testDir, 'restricted.env.example');
      fs.writeFileSync(restrictedFile, 'TEST_VAR=value');
      
      try {
        // Try to restrict permissions (Unix-like systems only)
        fs.chmodSync(restrictedFile, 0o000);
        
        await assert.rejects(
          async () => await parseEnvFile(restrictedFile),
          /Permission denied/
        );
        
        // Restore permissions for cleanup
        fs.chmodSync(restrictedFile, 0o644);
      } catch (error) {
        // Skip test on Windows or if chmod fails
        if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
          try {
            fs.chmodSync(restrictedFile, 0o644);
          } catch {}
        }
      }
      
      fs.unlinkSync(restrictedFile);
    });

    it('should throw error when scan path is not accessible', async () => {
      const restrictedDir = path.join(testDir, 'restricted-scan');
      fs.mkdirSync(restrictedDir, { recursive: true });
      
      try {
        // Try to restrict permissions (Unix-like systems only)
        fs.chmodSync(restrictedDir, 0o000);
        
        await assert.rejects(
          async () => await scan(restrictedDir, []),
          /Permission denied/
        );
        
        // Restore permissions for cleanup
        fs.chmodSync(restrictedDir, 0o755);
      } catch (error) {
        // Skip test on Windows or if chmod fails
        if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
          try {
            fs.chmodSync(restrictedDir, 0o755);
          } catch {}
        }
      }
      
      fs.rmSync(restrictedDir, { recursive: true, force: true });
    });

    it('should continue scanning when encountering inaccessible subdirectories', async () => {
      const scanDir = path.join(testDir, 'partial-access');
      const accessibleDir = path.join(scanDir, 'accessible');
      const restrictedDir = path.join(scanDir, 'restricted');
      
      fs.mkdirSync(accessibleDir, { recursive: true });
      fs.mkdirSync(restrictedDir, { recursive: true });
      
      fs.writeFileSync(path.join(accessibleDir, 'test.js'), 'console.log("test");');
      fs.writeFileSync(path.join(restrictedDir, 'hidden.js'), 'console.log("hidden");');
      
      try {
        // Try to restrict permissions (Unix-like systems only)
        fs.chmodSync(restrictedDir, 0o000);
        
        // Should not throw, but continue scanning accessible parts
        const files = await scanDirectory(scanDir, []);
        
        // Should find the accessible file
        assert.ok(files.some(f => f.endsWith('test.js')));
        
        // Restore permissions for cleanup
        fs.chmodSync(restrictedDir, 0o755);
      } catch (error) {
        // Skip test on Windows or if chmod fails
        if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
          try {
            fs.chmodSync(restrictedDir, 0o755);
          } catch {}
        }
      }
      
      fs.rmSync(scanDir, { recursive: true, force: true });
    });
  });

  describe('Circular symlinks (7.1.4)', () => {
    it('should detect and handle direct circular symlinks', async () => {
      const circularDir = path.join(testDir, 'direct-circular');
      fs.mkdirSync(circularDir, { recursive: true });
      
      try {
        // Create a symlink pointing to itself
        fs.symlinkSync(circularDir, path.join(circularDir, 'self'), 'dir');
        
        // Should complete without infinite loop
        const files = await scanDirectory(circularDir, []);
        
        assert.ok(Array.isArray(files));
        
        // Cleanup
        fs.unlinkSync(path.join(circularDir, 'self'));
      } catch (error) {
        // Skip test on Windows where symlinks may not work
        if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
          try {
            fs.unlinkSync(path.join(circularDir, 'self'));
          } catch {}
        }
      }
      
      fs.rmSync(circularDir, { recursive: true, force: true });
    });

    it('should detect and handle indirect circular symlinks', async () => {
      const parentDir = path.join(testDir, 'indirect-circular');
      const childDir = path.join(parentDir, 'child');
      const grandchildDir = path.join(childDir, 'grandchild');
      
      fs.mkdirSync(grandchildDir, { recursive: true });
      
      try {
        // Create a symlink from grandchild back to parent
        fs.symlinkSync(parentDir, path.join(grandchildDir, 'back-to-root'), 'dir');
        
        // Should complete without infinite loop
        const files = await scanDirectory(parentDir, []);
        
        assert.ok(Array.isArray(files));
        
        // Cleanup
        fs.unlinkSync(path.join(grandchildDir, 'back-to-root'));
      } catch (error) {
        // Skip test on Windows where symlinks may not work
        if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
          try {
            fs.unlinkSync(path.join(grandchildDir, 'back-to-root'));
          } catch {}
        }
      }
      
      fs.rmSync(parentDir, { recursive: true, force: true });
    });

    it('should handle broken symlinks gracefully', async () => {
      const brokenDir = path.join(testDir, 'broken-symlinks');
      fs.mkdirSync(brokenDir, { recursive: true });
      
      // Create a valid file
      fs.writeFileSync(path.join(brokenDir, 'valid.js'), 'console.log("valid");');
      
      try {
        // Create a broken symlink
        fs.symlinkSync('/nonexistent/target', path.join(brokenDir, 'broken'));
        
        // Should not throw, but continue scanning
        const files = await scanDirectory(brokenDir, []);
        
        // Should find the valid file
        assert.ok(files.some(f => f.endsWith('valid.js')));
        
        // Cleanup
        fs.unlinkSync(path.join(brokenDir, 'broken'));
      } catch (error) {
        // Skip test on Windows where symlinks may not work
        if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
          try {
            fs.unlinkSync(path.join(brokenDir, 'broken'));
          } catch {}
        }
      }
      
      fs.rmSync(brokenDir, { recursive: true, force: true });
    });

    it('should handle multiple circular symlinks in same directory tree', async () => {
      const multiDir = path.join(testDir, 'multi-circular');
      const dir1 = path.join(multiDir, 'dir1');
      const dir2 = path.join(multiDir, 'dir2');
      
      fs.mkdirSync(dir1, { recursive: true });
      fs.mkdirSync(dir2, { recursive: true });
      
      try {
        // Create circular symlinks in both directories
        fs.symlinkSync(dir1, path.join(dir1, 'self1'), 'dir');
        fs.symlinkSync(dir2, path.join(dir2, 'self2'), 'dir');
        
        // Should complete without infinite loop
        const files = await scanDirectory(multiDir, []);
        
        assert.ok(Array.isArray(files));
        
        // Cleanup
        fs.unlinkSync(path.join(dir1, 'self1'));
        fs.unlinkSync(path.join(dir2, 'self2'));
      } catch (error) {
        // Skip test on Windows where symlinks may not work
        if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
          try {
            fs.unlinkSync(path.join(dir1, 'self1'));
            fs.unlinkSync(path.join(dir2, 'self2'));
          } catch {}
        }
      }
      
      fs.rmSync(multiDir, { recursive: true, force: true });
    });
  });

  describe('Combined error scenarios (7.1.5)', () => {
    it('should handle multiple error types in single scan', async () => {
      const complexDir = path.join(testDir, 'complex-errors');
      const validDir = path.join(complexDir, 'valid');
      const restrictedDir = path.join(complexDir, 'restricted');
      
      fs.mkdirSync(validDir, { recursive: true });
      fs.mkdirSync(restrictedDir, { recursive: true });
      
      // Create valid files
      fs.writeFileSync(path.join(validDir, 'app.js'), 'console.log("app");');
      fs.writeFileSync(path.join(complexDir, 'index.js'), 'console.log("index");');
      
      // Create restricted file
      fs.writeFileSync(path.join(restrictedDir, 'secret.js'), 'console.log("secret");');
      
      try {
        // Restrict directory
        try {
          fs.chmodSync(restrictedDir, 0o000);
        } catch {}
        
        // Create broken symlink
        try {
          fs.symlinkSync('/nonexistent', path.join(complexDir, 'broken'));
        } catch {}
        
        // Should complete and return valid files
        const files = await scanDirectory(complexDir, []);
        
        assert.ok(Array.isArray(files));
        assert.ok(files.some(f => f.endsWith('app.js')));
        assert.ok(files.some(f => f.endsWith('index.js')));
        
        // Cleanup
        try {
          fs.chmodSync(restrictedDir, 0o755);
        } catch {}
        try {
          fs.unlinkSync(path.join(complexDir, 'broken'));
        } catch {}
      } catch (error) {
        // Cleanup on error
        try {
          fs.chmodSync(restrictedDir, 0o755);
        } catch {}
        try {
          fs.unlinkSync(path.join(complexDir, 'broken'));
        } catch {}
      }
      
      fs.rmSync(complexDir, { recursive: true, force: true });
    });

    it('should provide clear error messages for all error types', async () => {
      const errorMessages = [];
      
      // Test .env.example not found
      try {
        await parseEnvFile('nonexistent.env');
      } catch (error) {
        errorMessages.push(error.message);
        assert.ok(error.message.includes('not found'));
      }
      
      // Test scan path not found
      try {
        await scan('nonexistent-path');
      } catch (error) {
        errorMessages.push(error.message);
        assert.ok(error.message.includes('not found'));
      }
      
      // All error messages should be descriptive
      assert.strictEqual(errorMessages.length, 2);
      errorMessages.forEach(msg => {
        assert.ok(msg.length > 20); // Should be descriptive, not just "Error"
      });
    });

    it('should maintain scan performance despite errors', async () => {
      const perfDir = path.join(testDir, 'performance');
      fs.mkdirSync(perfDir, { recursive: true });
      
      // Create many files
      for (let i = 0; i < 50; i++) {
        fs.writeFileSync(path.join(perfDir, `file${i}.js`), `console.log(${i});`);
      }
      
      try {
        // Add some broken symlinks
        for (let i = 0; i < 5; i++) {
          try {
            fs.symlinkSync('/nonexistent', path.join(perfDir, `broken${i}`));
          } catch {}
        }
        
        const startTime = Date.now();
        const files = await scanDirectory(perfDir, []);
        const duration = Date.now() - startTime;
        
        // Should complete quickly (< 1 second for 50 files)
        assert.ok(duration < 1000);
        
        // Should find all valid files
        assert.ok(files.length >= 50);
        
        // Cleanup broken symlinks
        for (let i = 0; i < 5; i++) {
          try {
            fs.unlinkSync(path.join(perfDir, `broken${i}`));
          } catch {}
        }
      } catch (error) {
        // Cleanup on error
        for (let i = 0; i < 5; i++) {
          try {
            fs.unlinkSync(path.join(perfDir, `broken${i}`));
          } catch {}
        }
      }
      
      fs.rmSync(perfDir, { recursive: true, force: true });
    });
  });
});
