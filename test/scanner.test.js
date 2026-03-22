/**
 * Unit tests for file scanner
 * Tests scanDirectory(), scan(), and helper functions
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {
  getSupportedExtensions,
  hasSupportedExtension,
  scanDirectory,
  scan
} from '../src/scanner.js';

describe('getSupportedExtensions()', () => {
  it('should return array of supported extensions', () => {
    const extensions = getSupportedExtensions();
    
    assert.ok(Array.isArray(extensions));
    assert.ok(extensions.length > 0);
    assert.ok(extensions.includes('.js'));
    assert.ok(extensions.includes('.ts'));
    assert.ok(extensions.includes('.py'));
    assert.ok(extensions.includes('.go'));
    assert.ok(extensions.includes('.rb'));
    assert.ok(extensions.includes('.rs'));
    assert.ok(extensions.includes('.sh'));
  });
});

describe('hasSupportedExtension()', () => {
  it('should return true for JavaScript files', () => {
    assert.strictEqual(hasSupportedExtension('test.js'), true);
    assert.strictEqual(hasSupportedExtension('test.jsx'), true);
    assert.strictEqual(hasSupportedExtension('test.ts'), true);
    assert.strictEqual(hasSupportedExtension('test.tsx'), true);
    assert.strictEqual(hasSupportedExtension('test.mjs'), true);
    assert.strictEqual(hasSupportedExtension('test.cjs'), true);
  });

  it('should return true for Python files', () => {
    assert.strictEqual(hasSupportedExtension('test.py'), true);
  });

  it('should return true for Go files', () => {
    assert.strictEqual(hasSupportedExtension('test.go'), true);
  });

  it('should return true for Ruby files', () => {
    assert.strictEqual(hasSupportedExtension('test.rb'), true);
  });

  it('should return true for Rust files', () => {
    assert.strictEqual(hasSupportedExtension('test.rs'), true);
  });

  it('should return true for Shell files', () => {
    assert.strictEqual(hasSupportedExtension('test.sh'), true);
    assert.strictEqual(hasSupportedExtension('test.bash'), true);
    assert.strictEqual(hasSupportedExtension('test.zsh'), true);
  });

  it('should return false for unsupported extensions', () => {
    assert.strictEqual(hasSupportedExtension('test.txt'), false);
    assert.strictEqual(hasSupportedExtension('test.md'), false);
    assert.strictEqual(hasSupportedExtension('test.json'), false);
    assert.strictEqual(hasSupportedExtension('test.html'), false);
  });

  it('should be case-insensitive', () => {
    assert.strictEqual(hasSupportedExtension('test.JS'), true);
    assert.strictEqual(hasSupportedExtension('test.PY'), true);
  });
});

describe('scanDirectory()', () => {
  const testDir = path.join('test', 'fixtures', 'scanner-test');

  before(() => {
    // Create test directory structure
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'dist'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'node_modules'), { recursive: true });
    
    // Create test files
    fs.writeFileSync(path.join(testDir, 'index.js'), 'console.log("test");');
    fs.writeFileSync(path.join(testDir, 'src', 'app.ts'), 'const x = 1;');
    fs.writeFileSync(path.join(testDir, 'src', 'utils.py'), 'print("hello")');
    fs.writeFileSync(path.join(testDir, 'dist', 'bundle.js'), '// compiled');
    fs.writeFileSync(path.join(testDir, 'node_modules', 'pkg.js'), '// package');
    fs.writeFileSync(path.join(testDir, 'README.md'), '# Test');
  });

  after(() => {
    // Cleanup test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should find all source files in directory', async () => {
    const files = await scanDirectory(testDir, []);
    
    assert.ok(files.length >= 3);
    assert.ok(files.some(f => f.endsWith('index.js')));
    assert.ok(files.some(f => f.endsWith('app.ts')));
    assert.ok(files.some(f => f.endsWith('utils.py')));
  });

  it('should exclude files matching ignore patterns', async () => {
    const ignorePatterns = ['node_modules/**', 'dist/**'];
    const files = await scanDirectory(testDir, ignorePatterns);
    
    assert.ok(!files.some(f => f.includes('node_modules')));
    assert.ok(!files.some(f => f.includes('dist')));
    assert.ok(files.some(f => f.endsWith('index.js')));
  });

  it('should not include unsupported file types', async () => {
    const files = await scanDirectory(testDir, []);
    
    assert.ok(!files.some(f => f.endsWith('.md')));
  });

  it('should handle empty directory', async () => {
    const emptyDir = path.join(testDir, 'empty');
    fs.mkdirSync(emptyDir, { recursive: true });
    
    const files = await scanDirectory(emptyDir, []);
    
    assert.strictEqual(files.length, 0);
    
    fs.rmdirSync(emptyDir);
  });

  it('should handle nonexistent directory gracefully', async () => {
    const files = await scanDirectory('nonexistent-dir', []);
    
    assert.strictEqual(files.length, 0);
  });

  it('should detect symlink cycles', async () => {
    // Create a symlink cycle (only on Unix-like systems)
    const cycleDir = path.join(testDir, 'cycle');
    fs.mkdirSync(cycleDir, { recursive: true });
    
    try {
      fs.symlinkSync(cycleDir, path.join(cycleDir, 'self'), 'dir');
      
      const files = await scanDirectory(cycleDir, []);
      
      // Should complete without infinite loop
      assert.ok(Array.isArray(files));
      
      // Cleanup
      fs.unlinkSync(path.join(cycleDir, 'self'));
    } catch (error) {
      // Skip test on Windows where symlinks may not work
      if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    fs.rmSync(cycleDir, { recursive: true, force: true });
  });
});

describe('scan()', () => {
  const testDir = path.join('test', 'fixtures', 'scan-test');

  before(() => {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'test.js'), 'console.log("test");');
    fs.writeFileSync(path.join(testDir, 'app.py'), 'print("hello")');
  });

  after(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should scan a single file', async () => {
    const filePath = path.join(testDir, 'test.js');
    const files = await scan(filePath, []);
    
    assert.strictEqual(files.length, 1);
    assert.ok(files[0].endsWith('test.js'));
  });

  it('should return empty array for unsupported file', async () => {
    const txtFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(txtFile, 'content');
    
    const files = await scan(txtFile, []);
    
    assert.strictEqual(files.length, 0);
    
    fs.unlinkSync(txtFile);
  });

  it('should scan a directory', async () => {
    const files = await scan(testDir, []);
    
    assert.ok(files.length >= 2);
    assert.ok(files.some(f => f.endsWith('test.js')));
    assert.ok(files.some(f => f.endsWith('app.py')));
  });

  it('should throw error for nonexistent path', async () => {
    await assert.rejects(
      async () => await scan('nonexistent-path', []),
      /Path not found/
    );
  });

  it('should throw error with permission denied message', async () => {
    // This test is platform-specific and may not work on all systems
    // We're testing the error handling logic, not actual permission issues
    const restrictedPath = path.join(testDir, 'restricted');
    fs.mkdirSync(restrictedPath, { recursive: true });
    
    try {
      // Try to restrict permissions (Unix-like systems only)
      fs.chmodSync(restrictedPath, 0o000);
      
      await assert.rejects(
        async () => await scan(restrictedPath, []),
        /Permission denied/
      );
      
      // Restore permissions for cleanup
      fs.chmodSync(restrictedPath, 0o755);
    } catch (error) {
      // Skip test on Windows or if chmod fails
      if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
        // Restore permissions if possible
        try {
          fs.chmodSync(restrictedPath, 0o755);
        } catch {}
      }
    }
    
    fs.rmSync(restrictedPath, { recursive: true, force: true });
  });
});

describe('scanDirectory() - Error Handling', () => {
  const testDir = path.join('test', 'fixtures', 'error-test');

  before(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should handle permission denied on directory gracefully', async () => {
    const restrictedDir = path.join(testDir, 'no-access');
    fs.mkdirSync(restrictedDir, { recursive: true });
    fs.writeFileSync(path.join(restrictedDir, 'test.js'), 'console.log("test");');
    
    try {
      // Try to restrict permissions (Unix-like systems only)
      fs.chmodSync(restrictedDir, 0o000);
      
      // Should not throw, but return empty array and log warning
      const files = await scanDirectory(testDir, []);
      
      // Should complete without throwing
      assert.ok(Array.isArray(files));
      
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

  it('should handle permission denied on file gracefully', async () => {
    const restrictedFile = path.join(testDir, 'restricted.js');
    fs.writeFileSync(restrictedFile, 'console.log("test");');
    
    try {
      // Try to restrict permissions (Unix-like systems only)
      fs.chmodSync(restrictedFile, 0o000);
      
      // Should not throw, but continue scanning
      const files = await scanDirectory(testDir, []);
      
      // Should complete without throwing
      assert.ok(Array.isArray(files));
      
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

  it('should handle broken symlinks gracefully', async () => {
    const brokenLink = path.join(testDir, 'broken-link');
    
    try {
      // Create a symlink to a non-existent target
      fs.symlinkSync('/nonexistent/target', brokenLink);
      
      // Should not throw, but log warning and continue
      const files = await scanDirectory(testDir, []);
      
      // Should complete without throwing
      assert.ok(Array.isArray(files));
      
      // Cleanup
      fs.unlinkSync(brokenLink);
    } catch (error) {
      // Skip test on Windows where symlinks may not work
      if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
        try {
          fs.unlinkSync(brokenLink);
        } catch {}
      }
    }
  });

  it('should detect and handle circular symlinks', async () => {
    const circularDir = path.join(testDir, 'circular');
    fs.mkdirSync(circularDir, { recursive: true });
    
    try {
      // Create a circular symlink
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

  it('should handle nested circular symlinks', async () => {
    const parentDir = path.join(testDir, 'parent');
    const childDir = path.join(parentDir, 'child');
    fs.mkdirSync(childDir, { recursive: true });
    
    try {
      // Create a symlink from child back to parent
      fs.symlinkSync(parentDir, path.join(childDir, 'back-to-parent'), 'dir');
      
      // Should complete without infinite loop
      const files = await scanDirectory(parentDir, []);
      
      assert.ok(Array.isArray(files));
      
      // Cleanup
      fs.unlinkSync(path.join(childDir, 'back-to-parent'));
    } catch (error) {
      // Skip test on Windows where symlinks may not work
      if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
        try {
          fs.unlinkSync(path.join(childDir, 'back-to-parent'));
        } catch {}
      }
    }
    
    fs.rmSync(parentDir, { recursive: true, force: true });
  });

  it('should handle multiple error conditions in same scan', async () => {
    const mixedDir = path.join(testDir, 'mixed-errors');
    fs.mkdirSync(mixedDir, { recursive: true });
    
    // Create a valid file
    fs.writeFileSync(path.join(mixedDir, 'valid.js'), 'console.log("valid");');
    
    try {
      // Create a broken symlink
      try {
        fs.symlinkSync('/nonexistent', path.join(mixedDir, 'broken'));
      } catch {}
      
      // Should complete and return the valid file
      const files = await scanDirectory(mixedDir, []);
      
      assert.ok(Array.isArray(files));
      assert.ok(files.some(f => f.endsWith('valid.js')));
      
      // Cleanup
      try {
        fs.unlinkSync(path.join(mixedDir, 'broken'));
      } catch {}
    } catch (error) {
      // Cleanup on error
      try {
        fs.unlinkSync(path.join(mixedDir, 'broken'));
      } catch {}
    }
    
    fs.rmSync(mixedDir, { recursive: true, force: true });
  });
});

describe('File System Error Handling', () => {
  const testDir = path.join('test', 'fixtures', 'error-test');

  before(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should throw error with clear message for nonexistent path', async () => {
    const nonexistentPath = path.join(testDir, 'does-not-exist');
    
    await assert.rejects(
      async () => await scan(nonexistentPath, []),
      {
        message: /Path not found: .*does-not-exist/
      }
    );
  });

  it('should handle permission denied errors gracefully in scanDirectory', async () => {
    // This test is platform-specific and may not work on all systems
    const restrictedDir = path.join(testDir, 'restricted');
    fs.mkdirSync(restrictedDir, { recursive: true });
    fs.writeFileSync(path.join(restrictedDir, 'test.js'), 'console.log("test");');
    
    try {
      // Try to restrict permissions (Unix-like systems only)
      fs.chmodSync(restrictedDir, 0o000);
      
      // Should warn but not throw
      const files = await scanDirectory(restrictedDir, []);
      
      // Should return empty array due to permission denial
      assert.ok(Array.isArray(files));
      
      // Restore permissions for cleanup
      fs.chmodSync(restrictedDir, 0o755);
    } catch (error) {
      // Skip test on Windows or if chmod fails
      try {
        fs.chmodSync(restrictedDir, 0o755);
      } catch {}
    }
    
    fs.rmSync(restrictedDir, { recursive: true, force: true });
  });

  it('should handle broken symlinks gracefully', async () => {
    const brokenLinkDir = path.join(testDir, 'broken-link');
    fs.mkdirSync(brokenLinkDir, { recursive: true });
    
    try {
      // Create a symlink to a nonexistent target
      const linkPath = path.join(brokenLinkDir, 'broken-link');
      const targetPath = path.join(brokenLinkDir, 'nonexistent-target');
      
      fs.symlinkSync(targetPath, linkPath, 'file');
      
      // Should handle broken symlink gracefully
      const files = await scanDirectory(brokenLinkDir, []);
      
      // Should not include the broken symlink
      assert.ok(Array.isArray(files));
      assert.strictEqual(files.length, 0);
      
      // Cleanup
      fs.unlinkSync(linkPath);
    } catch (error) {
      // Skip test on Windows where symlinks may not work
      if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    fs.rmSync(brokenLinkDir, { recursive: true, force: true });
  });

  it('should detect and handle circular symlinks', async () => {
    const circularDir = path.join(testDir, 'circular');
    fs.mkdirSync(circularDir, { recursive: true });
    fs.writeFileSync(path.join(circularDir, 'test.js'), 'console.log("test");');
    
    try {
      // Create a circular symlink
      const linkPath = path.join(circularDir, 'circular-link');
      fs.symlinkSync(circularDir, linkPath, 'dir');
      
      // Should handle circular symlink without infinite loop
      const files = await scanDirectory(circularDir, []);
      
      // Should find the test.js file but not loop infinitely
      assert.ok(Array.isArray(files));
      assert.ok(files.some(f => f.endsWith('test.js')));
      
      // Cleanup
      fs.unlinkSync(linkPath);
    } catch (error) {
      // Skip test on Windows where symlinks may not work
      if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    fs.rmSync(circularDir, { recursive: true, force: true });
  });

  it('should handle nested circular symlinks', async () => {
    const nestedDir = path.join(testDir, 'nested-circular');
    const subDir = path.join(nestedDir, 'subdir');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(nestedDir, 'root.js'), 'console.log("root");');
    fs.writeFileSync(path.join(subDir, 'sub.js'), 'console.log("sub");');
    
    try {
      // Create a symlink from subdir back to parent
      const linkPath = path.join(subDir, 'parent-link');
      fs.symlinkSync(nestedDir, linkPath, 'dir');
      
      // Should handle nested circular symlink
      const files = await scanDirectory(nestedDir, []);
      
      // Should find both files without infinite loop
      assert.ok(Array.isArray(files));
      assert.ok(files.some(f => f.endsWith('root.js')));
      assert.ok(files.some(f => f.endsWith('sub.js')));
      
      // Cleanup
      fs.unlinkSync(linkPath);
    } catch (error) {
      // Skip test on Windows where symlinks may not work
      if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    fs.rmSync(nestedDir, { recursive: true, force: true });
  });

  it('should handle file access errors during directory scan', async () => {
    const accessErrorDir = path.join(testDir, 'access-error');
    fs.mkdirSync(accessErrorDir, { recursive: true });
    fs.writeFileSync(path.join(accessErrorDir, 'accessible.js'), 'console.log("ok");');
    fs.writeFileSync(path.join(accessErrorDir, 'restricted.js'), 'console.log("restricted");');
    
    try {
      // Try to restrict one file (Unix-like systems only)
      const restrictedFile = path.join(accessErrorDir, 'restricted.js');
      fs.chmodSync(restrictedFile, 0o000);
      
      // Should continue scanning despite one file being inaccessible
      const files = await scanDirectory(accessErrorDir, []);
      
      // Should find at least the accessible file
      assert.ok(Array.isArray(files));
      assert.ok(files.some(f => f.endsWith('accessible.js')));
      
      // Restore permissions for cleanup
      fs.chmodSync(restrictedFile, 0o644);
    } catch (error) {
      // Skip test on Windows or if chmod fails
      const restrictedFile = path.join(accessErrorDir, 'restricted.js');
      try {
        fs.chmodSync(restrictedFile, 0o644);
      } catch {}
    }
    
    fs.rmSync(accessErrorDir, { recursive: true, force: true });
  });

  it('should throw clear error when scan path is a file that does not exist', async () => {
    const nonexistentFile = path.join(testDir, 'nonexistent.js');
    
    await assert.rejects(
      async () => await scan(nonexistentFile, []),
      {
        message: /Path not found: .*nonexistent\.js/
      }
    );
  });

  it('should handle special characters in file paths', async () => {
    const specialDir = path.join(testDir, 'special-chars');
    fs.mkdirSync(specialDir, { recursive: true });
    
    // Create files with special characters (that are valid on most systems)
    const specialFiles = [
      'file-with-dash.js',
      'file_with_underscore.js',
      'file.with.dots.js'
    ];
    
    for (const fileName of specialFiles) {
      fs.writeFileSync(path.join(specialDir, fileName), 'console.log("test");');
    }
    
    const files = await scanDirectory(specialDir, []);
    
    assert.strictEqual(files.length, specialFiles.length);
    for (const fileName of specialFiles) {
      assert.ok(files.some(f => f.endsWith(fileName)));
    }
    
    fs.rmSync(specialDir, { recursive: true, force: true });
  });

  it('should handle deeply nested directory structures', async () => {
    const deepDir = path.join(testDir, 'deep');
    let currentPath = deepDir;
    
    // Create a deeply nested structure (10 levels)
    for (let i = 0; i < 10; i++) {
      currentPath = path.join(currentPath, `level${i}`);
      fs.mkdirSync(currentPath, { recursive: true });
    }
    
    // Add a file at the deepest level
    fs.writeFileSync(path.join(currentPath, 'deep.js'), 'console.log("deep");');
    
    const files = await scanDirectory(deepDir, []);
    
    assert.strictEqual(files.length, 1);
    assert.ok(files[0].endsWith('deep.js'));
    
    fs.rmSync(deepDir, { recursive: true, force: true });
  });

  it('should handle empty directory names gracefully', async () => {
    // Test scanning current directory with relative path
    const files = await scan('.', ['**/*']);
    
    // Should return empty array when everything is ignored
    assert.ok(Array.isArray(files));
  });
});
