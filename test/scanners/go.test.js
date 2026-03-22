import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scan, getSupportedExtensions, getPatterns } from '../../src/scanners/go.js';

describe('Go Scanner', () => {
  describe('scan()', () => {
    it('should detect os.Getenv("VAR_NAME")', () => {
      const content = `
package main

import "os"

func main() {
    dbUrl := os.Getenv("DATABASE_URL")
    apiKey := os.Getenv("API_KEY")
}
      `.trim();

      const result = scan(content, 'main.go');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[0].lineNumber, 6);
      assert.strictEqual(result[0].pattern, 'os.Getenv("DATABASE_URL")');
      assert.strictEqual(result[1].varName, 'API_KEY');
      assert.strictEqual(result[1].lineNumber, 7);
    });

    it('should detect os.LookupEnv("VAR_NAME")', () => {
      const content = `
package main

import "os"

func main() {
    port, exists := os.LookupEnv("PORT")
    if !exists {
        port = "8080"
    }
}
      `.trim();

      const result = scan(content, 'main.go');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[0].pattern, 'os.LookupEnv("PORT")');
    });

    it('should detect multiple references on the same line', () => {
      const content = `config := Config{DB: os.Getenv("DB_HOST"), Port: os.Getenv("DB_PORT")}`;

      const result = scan(content, 'config.go');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DB_HOST');
      assert.strictEqual(result[1].varName, 'DB_PORT');
      assert.strictEqual(result[0].lineNumber, 1);
      assert.strictEqual(result[1].lineNumber, 1);
    });

    it('should detect mixed patterns in the same file', () => {
      const content = `
package config

import "os"

var (
    dbUrl = os.Getenv("DATABASE_URL")
    apiKey, hasKey = os.LookupEnv("API_KEY")
    redisHost = os.Getenv("REDIS_HOST")
)
      `.trim();

      const result = scan(content, 'config.go');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
      assert.strictEqual(result[2].varName, 'REDIS_HOST');
    });

    it('should ignore lowercase variable names', () => {
      const content = `x := os.Getenv("lowercase")`;

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 0);
    });

    it('should ignore variables starting with numbers', () => {
      const content = `x := os.Getenv("123VAR")`;

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 0);
    });

    it('should accept variables starting with underscore', () => {
      const content = `x := os.Getenv("_PRIVATE_VAR")`;

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, '_PRIVATE_VAR');
    });

    it('should accept variables with numbers after letters', () => {
      const content = `x := os.Getenv("VAR_123_TEST")`;

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'VAR_123_TEST');
    });

    it('should handle empty content', () => {
      const result = scan('', 'test.go');

      assert.strictEqual(result.length, 0);
    });

    it('should handle content with no matches', () => {
      const content = `
package main

func main() {
    x := 42
    println("hello")
}
      `.trim();

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 0);
    });

    it('should track correct line numbers in multi-line files', () => {
      const content = `
package main

import "os"

func main() {
    // Line 7
    a := os.Getenv("VAR_LINE_8")
    // Line 9
    b := os.LookupEnv("VAR_LINE_10")
}
      `.trim();

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].lineNumber, 7);
      assert.strictEqual(result[0].varName, 'VAR_LINE_8');
      assert.strictEqual(result[1].lineNumber, 9);
      assert.strictEqual(result[1].varName, 'VAR_LINE_10');
    });

    it('should include filePath in results', () => {
      const content = `x := os.Getenv("TEST_VAR")`;

      const result = scan(content, 'src/config/database.go');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'src/config/database.go');
    });

    it('should handle default value patterns', () => {
      const content = `
port := os.Getenv("PORT")
if port == "" {
    port = "8080"
}
      `.trim();

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'PORT');
    });

    it('should handle LookupEnv with conditional', () => {
      const content = `
if apiKey, exists := os.LookupEnv("API_KEY"); exists {
    client.SetAPIKey(apiKey)
}
      `.trim();

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'API_KEY');
    });

    it('should handle struct initialization', () => {
      const content = `
config := &Config{
    DatabaseURL: os.Getenv("DATABASE_URL"),
    RedisHost:   os.Getenv("REDIS_HOST"),
    APIKey:      os.Getenv("API_KEY"),
}
      `.trim();

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'REDIS_HOST');
      assert.strictEqual(result[2].varName, 'API_KEY');
    });

    it('should handle function calls with env vars', () => {
      const content = `
db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
client := redis.NewClient(os.Getenv("REDIS_URL"))
      `.trim();

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'REDIS_URL');
    });

    it('should handle comments containing env var patterns', () => {
      const content = `
// This uses os.Getenv("COMMENTED_VAR")
x := os.Getenv("ACTUAL_VAR")
/* os.Getenv("BLOCK_COMMENT_VAR") */
      `.trim();

      const result = scan(content, 'test.go');

      // Comments are not filtered - regex matches all occurrences
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'COMMENTED_VAR');
      assert.strictEqual(result[1].varName, 'ACTUAL_VAR');
      assert.strictEqual(result[2].varName, 'BLOCK_COMMENT_VAR');
    });

    it('should handle const declarations', () => {
      const content = `
const (
    defaultPort = os.Getenv("DEFAULT_PORT")
    defaultHost = os.Getenv("DEFAULT_HOST")
)
      `.trim();

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DEFAULT_PORT');
      assert.strictEqual(result[1].varName, 'DEFAULT_HOST');
    });

    it('should handle var declarations', () => {
      const content = `
var (
    dbURL = os.Getenv("DATABASE_URL")
    apiKey, hasAPIKey = os.LookupEnv("API_KEY")
)
      `.trim();

      const result = scan(content, 'test.go');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
    });

    it('should handle realistic Go configuration code', () => {
      const content = `
package config

import (
    "os"
    "strconv"
)

type Config struct {
    DatabaseURL string
    Port        int
    APIKey      string
    Debug       bool
}

func Load() *Config {
    port, _ := strconv.Atoi(os.Getenv("PORT"))
    
    return &Config{
        DatabaseURL: os.Getenv("DATABASE_URL"),
        Port:        port,
        APIKey:      os.Getenv("API_KEY"),
        Debug:       os.Getenv("DEBUG") == "true",
    }
}
      `.trim();

      const result = scan(content, 'config.go');

      assert.strictEqual(result.length, 4);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[1].varName, 'DATABASE_URL');
      assert.strictEqual(result[2].varName, 'API_KEY');
      assert.strictEqual(result[3].varName, 'DEBUG');
    });
  });

  describe('getSupportedExtensions()', () => {
    it('should return array of supported extensions', () => {
      const extensions = getSupportedExtensions();

      assert.ok(Array.isArray(extensions));
      assert.ok(extensions.length > 0);
    });

    it('should include .go extension', () => {
      const extensions = getSupportedExtensions();

      assert.ok(extensions.includes('.go'));
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
  });
});
