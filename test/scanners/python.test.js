import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scan, getSupportedExtensions, getPatterns } from '../../src/scanners/python.js';

describe('Python Scanner', () => {
  describe('scan()', () => {
    it('should detect os.environ["VAR_NAME"] (bracket notation with double quotes)', () => {
      const content = `
import os
db_url = os.environ["DATABASE_URL"]
api_key = os.environ["API_KEY"]
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[0].lineNumber, 2);
      assert.strictEqual(result[0].pattern, 'os.environ["DATABASE_URL"]');
      assert.strictEqual(result[1].varName, 'API_KEY');
      assert.strictEqual(result[1].lineNumber, 3);
    });

    it("should detect os.environ['VAR_NAME'] (bracket notation with single quotes)", () => {
      const content = `port = os.environ['PORT']`;

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[0].pattern, "os.environ['PORT']");
    });

    it('should detect os.environ.get("VAR_NAME") (get method with double quotes)', () => {
      const content = `
host = os.environ.get("HOST")
debug = os.environ.get("DEBUG")
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'HOST');
      assert.strictEqual(result[0].pattern, 'os.environ.get("HOST")');
      assert.strictEqual(result[1].varName, 'DEBUG');
    });

    it("should detect os.environ.get('VAR_NAME') (get method with single quotes)", () => {
      const content = `secret = os.environ.get('SECRET_KEY')`;

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'SECRET_KEY');
      assert.strictEqual(result[0].pattern, "os.environ.get('SECRET_KEY')");
    });

    it('should detect os.getenv("VAR_NAME") (getenv function with double quotes)', () => {
      const content = `
import os
token = os.getenv("AUTH_TOKEN")
region = os.getenv("AWS_REGION")
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'AUTH_TOKEN');
      assert.strictEqual(result[0].pattern, 'os.getenv("AUTH_TOKEN")');
      assert.strictEqual(result[1].varName, 'AWS_REGION');
    });

    it("should detect os.getenv('VAR_NAME') (getenv function with single quotes)", () => {
      const content = `cache_url = os.getenv('REDIS_URL')`;

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'REDIS_URL');
      assert.strictEqual(result[0].pattern, "os.getenv('REDIS_URL')");
    });

    it('should detect multiple references on the same line', () => {
      const content = `config = {"db": os.environ["DB_HOST"], "port": os.environ["DB_PORT"]}`;

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DB_HOST');
      assert.strictEqual(result[1].varName, 'DB_PORT');
      assert.strictEqual(result[0].lineNumber, 1);
      assert.strictEqual(result[1].lineNumber, 1);
    });

    it('should detect mixed patterns in the same file', () => {
      const content = `
a = os.environ["VAR_A"]
b = os.environ['VAR_B']
c = os.environ.get("VAR_C")
d = os.environ.get('VAR_D')
e = os.getenv("VAR_E")
f = os.getenv('VAR_F')
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 6);
      assert.strictEqual(result[0].varName, 'VAR_A');
      assert.strictEqual(result[1].varName, 'VAR_B');
      assert.strictEqual(result[2].varName, 'VAR_C');
      assert.strictEqual(result[3].varName, 'VAR_D');
      assert.strictEqual(result[4].varName, 'VAR_E');
      assert.strictEqual(result[5].varName, 'VAR_F');
    });

    it('should ignore lowercase variable names', () => {
      const content = `x = os.environ["lowercase"]`;

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 0);
    });

    it('should ignore variables starting with numbers', () => {
      const content = `x = os.getenv("123VAR")`;

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 0);
    });

    it('should accept variables starting with underscore', () => {
      const content = `x = os.environ["_PRIVATE_VAR"]`;

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, '_PRIVATE_VAR');
    });

    it('should accept variables with numbers after letters', () => {
      const content = `x = os.getenv("VAR_123_TEST")`;

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'VAR_123_TEST');
    });

    it('should handle empty content', () => {
      const result = scan('', 'test.py');

      assert.strictEqual(result.length, 0);
    });

    it('should handle content with no matches', () => {
      const content = `
x = 42
def test():
    return "hello"
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 0);
    });

    it('should track correct line numbers in multi-line files', () => {
      const content = `
# Line 1
a = 1
b = os.environ["VAR_LINE_4"]
# Line 5
c = 2
d = os.getenv("VAR_LINE_7")
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].lineNumber, 3);
      assert.strictEqual(result[0].varName, 'VAR_LINE_4');
      assert.strictEqual(result[1].lineNumber, 6);
      assert.strictEqual(result[1].varName, 'VAR_LINE_7');
    });

    it('should include filePath in results', () => {
      const content = `x = os.environ["TEST_VAR"]`;

      const result = scan(content, 'src/config/database.py');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'src/config/database.py');
    });

    it('should handle default values in get/getenv', () => {
      const content = `
port = os.environ.get("PORT", "8080")
debug = os.getenv("DEBUG", "false")
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[1].varName, 'DEBUG');
    });

    it('should handle f-strings with env vars', () => {
      const content = `url = f"https://{os.environ['API_HOST']}/api"`;

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'API_HOST');
    });

    it('should handle type hints', () => {
      const content = `
from typing import Optional
api_key: str = os.environ["API_KEY"]
port: int = int(os.getenv("PORT", "3000"))
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'API_KEY');
      assert.strictEqual(result[1].varName, 'PORT');
    });

    it('should handle class attributes', () => {
      const content = `
class Config:
    DATABASE_URL = os.environ["DATABASE_URL"]
    API_KEY = os.getenv("API_KEY")
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
    });

    it('should handle function parameters with defaults', () => {
      const content = `
def connect(host=os.getenv("DB_HOST"), port=os.getenv("DB_PORT")):
    pass
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DB_HOST');
      assert.strictEqual(result[1].varName, 'DB_PORT');
    });

    it('should handle dictionary comprehensions', () => {
      const content = `config = {k: os.environ[k] for k in ["VAR_A", "VAR_B"]}`;

      const result = scan(content, 'test.py');

      // This won't match because the pattern requires a literal string in brackets
      assert.strictEqual(result.length, 0);
    });

    it('should handle comments containing env var patterns', () => {
      const content = `
# This uses os.environ["COMMENTED_VAR"]
x = os.environ["ACTUAL_VAR"]
# os.getenv("ANOTHER_COMMENT")
      `.trim();

      const result = scan(content, 'test.py');

      // Comments are not filtered - regex matches all occurrences
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'COMMENTED_VAR');
      assert.strictEqual(result[1].varName, 'ACTUAL_VAR');
      assert.strictEqual(result[2].varName, 'ANOTHER_COMMENT');
    });

    it('should handle multiline statements', () => {
      const content = `
config = {
    "database": os.environ["DATABASE_URL"],
    "cache": os.getenv("REDIS_URL"),
    "api": os.environ.get("API_KEY")
}
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'REDIS_URL');
      assert.strictEqual(result[2].varName, 'API_KEY');
    });

    it('should handle conditional expressions', () => {
      const content = `
debug = True if os.getenv("DEBUG") == "true" else False
port = int(os.environ.get("PORT")) if os.environ.get("PORT") else 8080
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'DEBUG');
      assert.strictEqual(result[1].varName, 'PORT');
      assert.strictEqual(result[2].varName, 'PORT');
    });

    it('should not match os.environ without brackets', () => {
      const content = `
env = os.environ
keys = os.environ.keys()
      `.trim();

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 0);
    });

    it('should handle mixed quote styles on same line', () => {
      const content = `config = {"a": os.environ["VAR_A"], "b": os.getenv('VAR_B')}`;

      const result = scan(content, 'test.py');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'VAR_A');
      assert.strictEqual(result[1].varName, 'VAR_B');
    });
  });

  describe('getSupportedExtensions()', () => {
    it('should return array of supported extensions', () => {
      const extensions = getSupportedExtensions();

      assert.ok(Array.isArray(extensions));
      assert.ok(extensions.length > 0);
    });

    it('should include .py extension', () => {
      const extensions = getSupportedExtensions();

      assert.ok(extensions.includes('.py'));
    });

    it('should only include .py extension', () => {
      const extensions = getSupportedExtensions();

      assert.strictEqual(extensions.length, 1);
      assert.strictEqual(extensions[0], '.py');
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

    it('should have exactly 3 patterns', () => {
      const patterns = getPatterns();

      assert.strictEqual(patterns.length, 3);
    });
  });
});
