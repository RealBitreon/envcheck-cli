/**
 * Unit tests for ignore pattern functions
 * Tests parseGitignore(), parseEnvcheckignore(), matchGlob(), shouldIgnore(), and loadIgnorePatterns()
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { 
  parseGitignore, 
  parseEnvcheckignore,
  getDefaultIgnores,
  matchGlob,
  shouldIgnore,
  isNegationPattern,
  removeNegationPrefix,
  loadIgnorePatterns
} from '../src/ignore.js';

describe('parseGitignore()', () => {
  it('should parse valid .gitignore file with patterns', () => {
    const testFile = path.join('test', 'fixtures', 'test.gitignore');
    const content = `node_modules
*.log
dist
# This is a comment
build

.env`;
    
    // Create test fixture
    fs.mkdirSync(path.join('test', 'fixtures'), { recursive: true });
    fs.writeFileSync(testFile, content);
    
    const result = parseGitignore(testFile);
    
    assert.deepStrictEqual(result, [
      'node_modules',
      '*.log',
      'dist',
      'build',
      '.env'
    ]);
    
    // Cleanup
    fs.unlinkSync(testFile);
  });

  it('should skip empty lines', () => {
    const testFile = path.join('test', 'fixtures', 'empty-lines.gitignore');
    const content = `node_modules

*.log


dist`;
    
    fs.mkdirSync(path.join('test', 'fixtures'), { recursive: true });
    fs.writeFileSync(testFile, content);
    
    const result = parseGitignore(testFile);
    
    assert.deepStrictEqual(result, [
      'node_modules',
      '*.log',
      'dist'
    ]);
    
    fs.unlinkSync(testFile);
  });

  it('should skip comment lines starting with #', () => {
    const testFile = path.join('test', 'fixtures', 'comments.gitignore');
    const content = `# Dependencies
node_modules
# Build output
dist
# Logs
*.log`;
    
    fs.mkdirSync(path.join('test', 'fixtures'), { recursive: true });
    fs.writeFileSync(testFile, content);
    
    const result = parseGitignore(testFile);
    
    assert.deepStrictEqual(result, [
      'node_modules',
      'dist',
      '*.log'
    ]);
    
    fs.unlinkSync(testFile);
  });

  it('should trim whitespace from patterns', () => {
    const testFile = path.join('test', 'fixtures', 'whitespace.gitignore');
    const content = `  node_modules  
*.log   
   dist
build`;
    
    fs.mkdirSync(path.join('test', 'fixtures'), { recursive: true });
    fs.writeFileSync(testFile, content);
    
    const result = parseGitignore(testFile);
    
    assert.deepStrictEqual(result, [
      'node_modules',
      '*.log',
      'dist',
      'build'
    ]);
    
    fs.unlinkSync(testFile);
  });

  it('should return empty array if file does not exist', () => {
    const result = parseGitignore('nonexistent.gitignore');
    assert.deepStrictEqual(result, []);
  });

  it('should return empty array for unreadable file', () => {
    const testFile = path.join('test', 'fixtures', 'unreadable.gitignore');
    
    fs.mkdirSync(path.join('test', 'fixtures'), { recursive: true });
    fs.writeFileSync(testFile, 'content');
    
    // Make file unreadable (Unix-like systems only)
    try {
      fs.chmodSync(testFile, 0o000);
      const result = parseGitignore(testFile);
      assert.deepStrictEqual(result, []);
      
      // Restore permissions for cleanup
      fs.chmodSync(testFile, 0o644);
    } catch (error) {
      // Skip test on Windows where chmod doesn't work the same way
    }
    
    fs.unlinkSync(testFile);
  });

  it('should handle empty file', () => {
    const testFile = path.join('test', 'fixtures', 'empty.gitignore');
    
    fs.mkdirSync(path.join('test', 'fixtures'), { recursive: true });
    fs.writeFileSync(testFile, '');
    
    const result = parseGitignore(testFile);
    
    assert.deepStrictEqual(result, []);
    
    fs.unlinkSync(testFile);
  });

  it('should handle file with only comments and empty lines', () => {
    const testFile = path.join('test', 'fixtures', 'only-comments.gitignore');
    const content = `# Comment 1

# Comment 2

# Comment 3`;
    
    fs.mkdirSync(path.join('test', 'fixtures'), { recursive: true });
    fs.writeFileSync(testFile, content);
    
    const result = parseGitignore(testFile);
    
    assert.deepStrictEqual(result, []);
    
    fs.unlinkSync(testFile);
  });

  it('should handle negation patterns', () => {
    const testFile = path.join('test', 'fixtures', 'negation.gitignore');
    const content = `*.log
!important.log`;
    
    fs.mkdirSync(path.join('test', 'fixtures'), { recursive: true });
    fs.writeFileSync(testFile, content);
    
    const result = parseGitignore(testFile);
    
    assert.deepStrictEqual(result, [
      '*.log',
      '!important.log'
    ]);
    
    fs.unlinkSync(testFile);
  });

  it('should handle glob patterns', () => {
    const testFile = path.join('test', 'fixtures', 'glob.gitignore');
    const content = `*.log
**/*.tmp
?.txt
[abc].js`;
    
    fs.mkdirSync(path.join('test', 'fixtures'), { recursive: true });
    fs.writeFileSync(testFile, content);
    
    const result = parseGitignore(testFile);
    
    assert.deepStrictEqual(result, [
      '*.log',
      '**/*.tmp',
      '?.txt',
      '[abc].js'
    ]);
    
    fs.unlinkSync(testFile);
  });
});

describe('parseEnvcheckignore()', () => {
  it('should parse valid .envcheckignore file with patterns', () => {
    const testFile = path.join('test', 'fixtures', 'test.envcheckignore');
    const content = `node_modules
*.log
dist
# This is a comment
build

.env`;
    
    fs.mkdirSync(path.join('test', 'fixtures'), { recursive: true });
    fs.writeFileSync(testFile, content);
    
    const result = parseEnvcheckignore(testFile);
    
    assert.deepStrictEqual(result, [
      'node_modules',
      '*.log',
      'dist',
      'build',
      '.env'
    ]);
    
    fs.unlinkSync(testFile);
  });

  it('should return empty array if file does not exist', () => {
    const result = parseEnvcheckignore('nonexistent.envcheckignore');
    assert.deepStrictEqual(result, []);
  });
});

describe('getDefaultIgnores()', () => {
  it('should return default ignore patterns', () => {
    const result = getDefaultIgnores();
    
    assert.ok(Array.isArray(result));
    assert.ok(result.includes('node_modules'));
    assert.ok(result.includes('.git'));
    assert.ok(result.includes('dist'));
    assert.ok(result.includes('build'));
  });
});

describe('matchGlob()', () => {
  it('should match exact file names', () => {
    assert.strictEqual(matchGlob('test.js', 'test.js'), true);
    assert.strictEqual(matchGlob('test.js', 'other.js'), false);
  });

  it('should match * wildcard (any characters except /)', () => {
    assert.strictEqual(matchGlob('test.js', '*.js'), true);
    assert.strictEqual(matchGlob('test.ts', '*.js'), false);
    assert.strictEqual(matchGlob('src/test.js', '*.js'), false); // * doesn't match /
  });

  it('should match ** wildcard (any characters including /)', () => {
    assert.strictEqual(matchGlob('src/test.js', '**/*.js'), true);
    assert.strictEqual(matchGlob('src/utils/test.js', '**/*.js'), true);
    assert.strictEqual(matchGlob('test.js', '**/*.js'), true);
  });

  it('should match ? wildcard (single character)', () => {
    assert.strictEqual(matchGlob('test1.js', 'test?.js'), true);
    assert.strictEqual(matchGlob('test12.js', 'test?.js'), false);
    assert.strictEqual(matchGlob('test.js', 'test?.js'), false);
  });

  it('should match directory names', () => {
    assert.strictEqual(matchGlob('node_modules', 'node_modules'), true);
    assert.strictEqual(matchGlob('node_modules/pkg', 'node_modules/**'), true);
    assert.strictEqual(matchGlob('src/node_modules', '**/node_modules'), true);
  });

  it('should handle paths with backslashes (Windows)', () => {
    assert.strictEqual(matchGlob('src\\test.js', '**/*.js'), true);
    assert.strictEqual(matchGlob('src\\utils\\test.js', 'src/**/*.js'), true);
  });

  it('should match patterns with directories', () => {
    assert.strictEqual(matchGlob('dist/bundle.js', 'dist/**'), true);
    assert.strictEqual(matchGlob('build/output.js', 'build/*'), true);
    assert.strictEqual(matchGlob('build/nested/output.js', 'build/*'), false);
    assert.strictEqual(matchGlob('build/nested/output.js', 'build/**'), true);
  });
});

describe('isNegationPattern()', () => {
  it('should identify negation patterns', () => {
    assert.strictEqual(isNegationPattern('!*.test.js'), true);
    assert.strictEqual(isNegationPattern('!important.log'), true);
  });

  it('should return false for regular patterns', () => {
    assert.strictEqual(isNegationPattern('*.js'), false);
    assert.strictEqual(isNegationPattern('node_modules'), false);
  });
});

describe('removeNegationPrefix()', () => {
  it('should remove ! prefix from negation patterns', () => {
    assert.strictEqual(removeNegationPrefix('!*.test.js'), '*.test.js');
    assert.strictEqual(removeNegationPrefix('!important.log'), 'important.log');
  });

  it('should return pattern unchanged if no ! prefix', () => {
    assert.strictEqual(removeNegationPrefix('*.js'), '*.js');
    assert.strictEqual(removeNegationPrefix('node_modules'), 'node_modules');
  });
});

describe('shouldIgnore()', () => {
  it('should return false for empty patterns array', () => {
    assert.strictEqual(shouldIgnore('test.js', []), false);
  });

  it('should ignore files matching patterns', () => {
    const patterns = ['*.log', 'node_modules', 'dist/**'];
    
    assert.strictEqual(shouldIgnore('error.log', patterns), true);
    assert.strictEqual(shouldIgnore('node_modules', patterns), true);
    assert.strictEqual(shouldIgnore('dist/bundle.js', patterns), true);
    assert.strictEqual(shouldIgnore('src/test.js', patterns), false);
  });

  it('should handle negation patterns', () => {
    const patterns = ['*.log', '!important.log'];
    
    assert.strictEqual(shouldIgnore('error.log', patterns), true);
    assert.strictEqual(shouldIgnore('important.log', patterns), false); // negated
  });

  it('should process patterns in order', () => {
    const patterns = ['*.js', '!*.test.js', '*.spec.js'];
    
    assert.strictEqual(shouldIgnore('app.js', patterns), true);
    assert.strictEqual(shouldIgnore('app.test.js', patterns), false); // negated
    assert.strictEqual(shouldIgnore('app.spec.js', patterns), true); // re-ignored
  });

  it('should handle complex negation scenarios', () => {
    const patterns = ['node_modules/**', '!node_modules/important/**'];
    
    assert.strictEqual(shouldIgnore('node_modules/pkg/index.js', patterns), true);
    assert.strictEqual(shouldIgnore('node_modules/important/file.js', patterns), false);
  });
});

describe('loadIgnorePatterns()', () => {
  const testDir = path.join('test', 'fixtures', 'ignore-test');

  it('should load patterns from .gitignore and .envcheckignore', () => {
    fs.mkdirSync(testDir, { recursive: true });
    
    fs.writeFileSync(path.join(testDir, '.gitignore'), 'node_modules\n*.log');
    fs.writeFileSync(path.join(testDir, '.envcheckignore'), 'dist\nbuild');
    
    const result = loadIgnorePatterns(testDir);
    
    // Should include default patterns + .gitignore + .envcheckignore
    assert.ok(result.includes('node_modules')); // from both default and .gitignore
    assert.ok(result.includes('.git')); // from default
    assert.ok(result.includes('*.log')); // from .gitignore
    assert.ok(result.includes('dist')); // from both default and .envcheckignore
    assert.ok(result.includes('build')); // from both default and .envcheckignore
    
    // Cleanup
    fs.unlinkSync(path.join(testDir, '.gitignore'));
    fs.unlinkSync(path.join(testDir, '.envcheckignore'));
    fs.rmdirSync(testDir);
  });

  it('should return default patterns when no ignore files exist', () => {
    const nonExistentDir = path.join('test', 'fixtures', 'nonexistent');
    const result = loadIgnorePatterns(nonExistentDir);
    
    // Should at least include default patterns
    assert.ok(result.includes('node_modules'));
    assert.ok(result.includes('.git'));
    assert.ok(result.includes('dist'));
    assert.ok(result.includes('build'));
  });

  it('should work with only .gitignore present', () => {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, '.gitignore'), '*.tmp');
    
    const result = loadIgnorePatterns(testDir);
    
    assert.ok(result.includes('*.tmp'));
    assert.ok(result.includes('node_modules')); // default
    
    // Cleanup
    fs.unlinkSync(path.join(testDir, '.gitignore'));
    fs.rmdirSync(testDir);
  });

  it('should work with only .envcheckignore present', () => {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, '.envcheckignore'), '*.cache');
    
    const result = loadIgnorePatterns(testDir);
    
    assert.ok(result.includes('*.cache'));
    assert.ok(result.includes('node_modules')); // default
    
    // Cleanup
    fs.unlinkSync(path.join(testDir, '.envcheckignore'));
    fs.rmdirSync(testDir);
  });
});
