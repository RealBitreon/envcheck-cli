/**
 * Unit tests for utility functions
 * Tests normalizePath(), toRelativePath(), and isValidEnvVarName()
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizePath, toRelativePath, isValidEnvVarName } from '../src/utils.js';

describe('normalizePath()', () => {
  it('should normalize Windows paths to forward slashes', () => {
    assert.strictEqual(normalizePath('C:\\Users\\Admin\\project'), 'C:/Users/Admin/project');
    assert.strictEqual(normalizePath('src\\components\\Button.js'), 'src/components/Button.js');
  });

  it('should handle Unix paths correctly', () => {
    assert.strictEqual(normalizePath('/home/user/project'), '/home/user/project');
    assert.strictEqual(normalizePath('src/components/Button.js'), 'src/components/Button.js');
  });

  it('should remove redundant separators', () => {
    assert.strictEqual(normalizePath('src//components///Button.js'), 'src/components/Button.js');
    assert.strictEqual(normalizePath('src\\\\components\\\\\\Button.js'), 'src/components/Button.js');
  });

  it('should handle empty string', () => {
    assert.strictEqual(normalizePath(''), '');
  });

  it('should handle null and undefined', () => {
    assert.strictEqual(normalizePath(null), '');
    assert.strictEqual(normalizePath(undefined), '');
  });

  it('should handle relative paths with dots', () => {
    assert.strictEqual(normalizePath('./src/utils.js'), 'src/utils.js');
    assert.strictEqual(normalizePath('../src/utils.js'), '../src/utils.js');
  });

  it('should handle mixed separators', () => {
    assert.strictEqual(normalizePath('src\\components/Button.js'), 'src/components/Button.js');
    assert.strictEqual(normalizePath('C:\\project/src\\utils.js'), 'C:/project/src/utils.js');
  });

  it('should handle single file name', () => {
    assert.strictEqual(normalizePath('file.js'), 'file.js');
  });

  it('should handle root paths', () => {
    assert.strictEqual(normalizePath('/'), '/');
    assert.strictEqual(normalizePath('C:\\'), 'C:/');
  });
});

describe('toRelativePath()', () => {
  it('should convert absolute path to relative path', () => {
    const result = toRelativePath('/home/user/project/src/utils.js', '/home/user/project');
    assert.strictEqual(result, 'src/utils.js');
  });

  it('should handle same paths', () => {
    assert.strictEqual(toRelativePath('/home/user/project', '/home/user/project'), '.');
    assert.strictEqual(toRelativePath('C:\\project', 'C:\\project'), '.');
  });

  it('should handle parent directory navigation', () => {
    const result = toRelativePath('/home/user/other', '/home/user/project');
    assert.strictEqual(result, '../other');
  });

  it('should handle empty absolutePath', () => {
    assert.strictEqual(toRelativePath('', '/home/user/project'), '');
  });

  it('should handle empty basePath', () => {
    assert.strictEqual(toRelativePath('/home/user/project/src', ''), '/home/user/project/src');
  });

  it('should handle both empty', () => {
    assert.strictEqual(toRelativePath('', ''), '');
  });

  it('should handle null and undefined', () => {
    assert.strictEqual(toRelativePath(null, '/base'), '');
    assert.strictEqual(toRelativePath('/path', null), '/path');
    assert.strictEqual(toRelativePath(null, null), '');
  });

  it('should normalize backslashes to forward slashes', () => {
    const result = toRelativePath('C:\\project\\src\\utils.js', 'C:\\project');
    assert.strictEqual(result, 'src/utils.js');
  });

  it('should handle relative paths', () => {
    const result = toRelativePath('./src/utils.js', './src');
    assert.strictEqual(result, 'utils.js');
  });

  it('should handle deeply nested paths', () => {
    const result = toRelativePath('/a/b/c/d/e/f.js', '/a/b');
    assert.strictEqual(result, 'c/d/e/f.js');
  });

  it('should handle sibling directories', () => {
    const result = toRelativePath('/home/user/project2/file.js', '/home/user/project1');
    assert.strictEqual(result, '../project2/file.js');
  });
});

describe('isValidEnvVarName()', () => {
  it('should accept valid uppercase variable names', () => {
    assert.strictEqual(isValidEnvVarName('DATABASE_URL'), true);
    assert.strictEqual(isValidEnvVarName('API_KEY'), true);
    assert.strictEqual(isValidEnvVarName('NODE_ENV'), true);
  });

  it('should accept names starting with underscore', () => {
    assert.strictEqual(isValidEnvVarName('_PRIVATE_KEY'), true);
    assert.strictEqual(isValidEnvVarName('__INTERNAL__'), true);
  });

  it('should accept names with numbers', () => {
    assert.strictEqual(isValidEnvVarName('API_V2_KEY'), true);
    assert.strictEqual(isValidEnvVarName('PORT_3000'), true);
    assert.strictEqual(isValidEnvVarName('VAR123'), true);
  });

  it('should accept single character names', () => {
    assert.strictEqual(isValidEnvVarName('A'), true);
    assert.strictEqual(isValidEnvVarName('_'), true);
  });

  it('should reject names starting with numbers', () => {
    assert.strictEqual(isValidEnvVarName('123VAR'), false);
    assert.strictEqual(isValidEnvVarName('9API_KEY'), false);
  });

  it('should reject lowercase letters', () => {
    assert.strictEqual(isValidEnvVarName('database_url'), false);
    assert.strictEqual(isValidEnvVarName('Api_Key'), false);
    assert.strictEqual(isValidEnvVarName('NODE_env'), false);
  });

  it('should reject special characters', () => {
    assert.strictEqual(isValidEnvVarName('API-KEY'), false);
    assert.strictEqual(isValidEnvVarName('API.KEY'), false);
    assert.strictEqual(isValidEnvVarName('API$KEY'), false);
    assert.strictEqual(isValidEnvVarName('API@KEY'), false);
    assert.strictEqual(isValidEnvVarName('API KEY'), false);
  });

  it('should reject empty string', () => {
    assert.strictEqual(isValidEnvVarName(''), false);
  });

  it('should reject null and undefined', () => {
    assert.strictEqual(isValidEnvVarName(null), false);
    assert.strictEqual(isValidEnvVarName(undefined), false);
  });

  it('should reject non-string types', () => {
    assert.strictEqual(isValidEnvVarName(123), false);
    assert.strictEqual(isValidEnvVarName({}), false);
    assert.strictEqual(isValidEnvVarName([]), false);
    assert.strictEqual(isValidEnvVarName(true), false);
  });

  it('should accept long variable names', () => {
    assert.strictEqual(isValidEnvVarName('VERY_LONG_ENVIRONMENT_VARIABLE_NAME_WITH_MANY_UNDERSCORES'), true);
  });

  it('should accept names with consecutive underscores', () => {
    assert.strictEqual(isValidEnvVarName('API__KEY'), true);
    assert.strictEqual(isValidEnvVarName('___VAR___'), true);
  });
});
