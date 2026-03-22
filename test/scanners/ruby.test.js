import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scan, getSupportedExtensions, getPatterns } from '../../src/scanners/ruby.js';

describe('Ruby Scanner', () => {
  describe('scan()', () => {
    it('should detect ENV["VAR_NAME"] (bracket notation with double quotes)', () => {
      const content = `
db_url = ENV["DATABASE_URL"]
api_key = ENV["API_KEY"]
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[0].lineNumber, 1);
      assert.strictEqual(result[0].pattern, 'ENV["DATABASE_URL"]');
      assert.strictEqual(result[1].varName, 'API_KEY');
      assert.strictEqual(result[1].lineNumber, 2);
    });

    it("should detect ENV['VAR_NAME'] (bracket notation with single quotes)", () => {
      const content = `port = ENV['PORT']`;

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[0].pattern, "ENV['PORT']");
    });

    it('should detect ENV.fetch("VAR_NAME") (fetch method with double quotes)', () => {
      const content = `
host = ENV.fetch("HOST")
debug = ENV.fetch("DEBUG")
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'HOST');
      assert.strictEqual(result[0].pattern, 'ENV.fetch("HOST")');
      assert.strictEqual(result[1].varName, 'DEBUG');
    });

    it("should detect ENV.fetch('VAR_NAME') (fetch method with single quotes)", () => {
      const content = `secret = ENV.fetch('SECRET_KEY')`;

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'SECRET_KEY');
      assert.strictEqual(result[0].pattern, "ENV.fetch('SECRET_KEY')");
    });

    it('should detect multiple references on the same line', () => {
      const content = `config = { db: ENV["DB_HOST"], port: ENV["DB_PORT"] }`;

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DB_HOST');
      assert.strictEqual(result[1].varName, 'DB_PORT');
      assert.strictEqual(result[0].lineNumber, 1);
      assert.strictEqual(result[1].lineNumber, 1);
    });

    it('should detect mixed patterns in the same file', () => {
      const content = `
a = ENV["VAR_A"]
b = ENV['VAR_B']
c = ENV.fetch("VAR_C")
d = ENV.fetch('VAR_D')
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 4);
      assert.strictEqual(result[0].varName, 'VAR_A');
      assert.strictEqual(result[1].varName, 'VAR_B');
      assert.strictEqual(result[2].varName, 'VAR_C');
      assert.strictEqual(result[3].varName, 'VAR_D');
    });

    it('should ignore lowercase variable names', () => {
      const content = `x = ENV["lowercase"]`;

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 0);
    });

    it('should ignore variables starting with numbers', () => {
      const content = `x = ENV.fetch("123VAR")`;

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 0);
    });

    it('should accept variables starting with underscore', () => {
      const content = `x = ENV["_PRIVATE_VAR"]`;

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, '_PRIVATE_VAR');
    });

    it('should accept variables with numbers after letters', () => {
      const content = `x = ENV.fetch("VAR_123_TEST")`;

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'VAR_123_TEST');
    });

    it('should handle empty content', () => {
      const result = scan('', 'test.rb');

      assert.strictEqual(result.length, 0);
    });

    it('should handle content with no matches', () => {
      const content = `
x = 42
def test
  return "hello"
end
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 0);
    });

    it('should track correct line numbers in multi-line files', () => {
      const content = `
# Line 1
a = 1
b = ENV["VAR_LINE_4"]
# Line 5
c = 2
d = ENV.fetch("VAR_LINE_7")
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].lineNumber, 3);
      assert.strictEqual(result[0].varName, 'VAR_LINE_4');
      assert.strictEqual(result[1].lineNumber, 6);
      assert.strictEqual(result[1].varName, 'VAR_LINE_7');
    });

    it('should include filePath in results', () => {
      const content = `x = ENV["TEST_VAR"]`;

      const result = scan(content, 'config/database.rb');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'config/database.rb');
    });

    it('should handle default values in fetch', () => {
      const content = `
port = ENV.fetch("PORT", "8080")
debug = ENV.fetch("DEBUG", "false")
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[1].varName, 'DEBUG');
    });

    it('should handle string interpolation with env vars', () => {
      const content = `url = "https://#{ENV['API_HOST']}/api"`;

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'API_HOST');
    });

    it('should handle class constants', () => {
      const content = `
class Config
  DATABASE_URL = ENV["DATABASE_URL"]
  API_KEY = ENV.fetch("API_KEY")
end
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
    });

    it('should handle method parameters with defaults', () => {
      const content = `
def connect(host = ENV.fetch("DB_HOST"), port = ENV.fetch("DB_PORT"))
  # connection logic
end
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DB_HOST');
      assert.strictEqual(result[1].varName, 'DB_PORT');
    });

    it('should handle hash literals', () => {
      const content = `
config = {
  database: ENV["DATABASE_URL"],
  cache: ENV.fetch("REDIS_URL"),
  api: ENV["API_KEY"]
}
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'REDIS_URL');
      assert.strictEqual(result[2].varName, 'API_KEY');
    });

    it('should handle conditional expressions', () => {
      const content = `
debug = ENV.fetch("DEBUG") == "true" ? true : false
port = ENV["PORT"] ? ENV["PORT"].to_i : 8080
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'DEBUG');
      assert.strictEqual(result[1].varName, 'PORT');
      assert.strictEqual(result[2].varName, 'PORT');
    });

    it('should handle comments containing env var patterns', () => {
      const content = `
# This uses ENV["COMMENTED_VAR"]
x = ENV["ACTUAL_VAR"]
# ENV.fetch("ANOTHER_COMMENT")
      `.trim();

      const result = scan(content, 'test.rb');

      // Comments are not filtered - regex matches all occurrences
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'COMMENTED_VAR');
      assert.strictEqual(result[1].varName, 'ACTUAL_VAR');
      assert.strictEqual(result[2].varName, 'ANOTHER_COMMENT');
    });

    it('should not match ENV without brackets or fetch', () => {
      const content = `
env = ENV
keys = ENV.keys
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 0);
    });

    it('should handle mixed quote styles on same line', () => {
      const content = `config = { a: ENV["VAR_A"], b: ENV.fetch('VAR_B') }`;

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'VAR_A');
      assert.strictEqual(result[1].varName, 'VAR_B');
    });

    it('should handle Rails-style configuration', () => {
      const content = `
Rails.application.configure do
  config.database_url = ENV["DATABASE_URL"]
  config.secret_key_base = ENV.fetch("SECRET_KEY_BASE")
end
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'SECRET_KEY_BASE');
    });

    it('should handle blocks with env vars', () => {
      const content = `
ENV.fetch("WORKERS", "5").to_i.times do |i|
  Worker.new(ENV["QUEUE_NAME"]).start
end
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'WORKERS');
      assert.strictEqual(result[1].varName, 'QUEUE_NAME');
    });

    it('should handle case statements', () => {
      const content = `
case ENV["ENVIRONMENT"]
when "production"
  url = ENV.fetch("PROD_URL")
when "staging"
  url = ENV.fetch("STAGING_URL")
end
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'ENVIRONMENT');
      assert.strictEqual(result[1].varName, 'PROD_URL');
      assert.strictEqual(result[2].varName, 'STAGING_URL');
    });

    it('should handle array literals with env vars', () => {
      const content = `hosts = [ENV["HOST_1"], ENV.fetch("HOST_2"), ENV["HOST_3"]]`;

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 3);
      // Patterns are matched in order: bracket notation first, then fetch
      assert.strictEqual(result[0].varName, 'HOST_1');
      assert.strictEqual(result[1].varName, 'HOST_3');
      assert.strictEqual(result[2].varName, 'HOST_2');
    });

    it('should handle lambda/proc with env vars', () => {
      const content = `
get_port = -> { ENV.fetch("PORT", "3000").to_i }
get_host = proc { ENV["HOST"] }
      `.trim();

      const result = scan(content, 'test.rb');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[1].varName, 'HOST');
    });
  });

  describe('getSupportedExtensions()', () => {
    it('should return array of supported extensions', () => {
      const extensions = getSupportedExtensions();

      assert.ok(Array.isArray(extensions));
      assert.ok(extensions.length > 0);
    });

    it('should include .rb extension', () => {
      const extensions = getSupportedExtensions();

      assert.ok(extensions.includes('.rb'));
    });

    it('should only include .rb extension', () => {
      const extensions = getSupportedExtensions();

      assert.strictEqual(extensions.length, 1);
      assert.strictEqual(extensions[0], '.rb');
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
