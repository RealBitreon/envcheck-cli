import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scan, getSupportedExtensions, getPatterns } from '../../src/scanners/rust.js';

describe('Rust Scanner', () => {
  describe('scan()', () => {
    it('should detect env::var("VAR_NAME")', () => {
      const content = `
use std::env;

fn main() {
    let db_url = env::var("DATABASE_URL").unwrap();
    let api_key = env::var("API_KEY").expect("API_KEY not set");
}
      `.trim();

      const result = scan(content, 'main.rs');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[0].lineNumber, 4);
      assert.strictEqual(result[0].pattern, 'env::var("DATABASE_URL")');
      assert.strictEqual(result[1].varName, 'API_KEY');
      assert.strictEqual(result[1].lineNumber, 5);
    });

    it('should detect std::env::var("VAR_NAME")', () => {
      const content = `
fn main() {
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
}
      `.trim();

      const result = scan(content, 'main.rs');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[0].pattern, 'std::env::var("PORT")');
    });

    it('should detect env::var_os("VAR_NAME")', () => {
      const content = `
use std::env;

fn main() {
    let path = env::var_os("PATH").unwrap();
}
      `.trim();

      const result = scan(content, 'main.rs');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'PATH');
      assert.strictEqual(result[0].pattern, 'env::var_os("PATH")');
    });

    it('should detect std::env::var_os("VAR_NAME")', () => {
      const content = `
fn main() {
    let home = std::env::var_os("HOME").expect("HOME not set");
}
      `.trim();

      const result = scan(content, 'main.rs');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'HOME');
      assert.strictEqual(result[0].pattern, 'std::env::var_os("HOME")');
    });

    it('should detect multiple references on the same line', () => {
      const content = `let config = Config { db: env::var("DB_HOST").unwrap(), port: env::var("DB_PORT").unwrap() };`;

      const result = scan(content, 'config.rs');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DB_HOST');
      assert.strictEqual(result[1].varName, 'DB_PORT');
      assert.strictEqual(result[0].lineNumber, 1);
      assert.strictEqual(result[1].lineNumber, 1);
    });

    it('should detect mixed patterns in the same file', () => {
      const content = `
use std::env;

fn load_config() {
    let db_url = env::var("DATABASE_URL").unwrap();
    let api_key = std::env::var("API_KEY").unwrap();
    let path = env::var_os("PATH").unwrap();
    let home = std::env::var_os("HOME").unwrap();
}
      `.trim();

      const result = scan(content, 'config.rs');

      assert.strictEqual(result.length, 4);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
      assert.strictEqual(result[2].varName, 'PATH');
      assert.strictEqual(result[3].varName, 'HOME');
    });

    it('should ignore lowercase variable names', () => {
      const content = `let x = env::var("lowercase").unwrap();`;

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 0);
    });

    it('should ignore variables starting with numbers', () => {
      const content = `let x = env::var("123VAR").unwrap();`;

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 0);
    });

    it('should accept variables starting with underscore', () => {
      const content = `let x = env::var("_PRIVATE_VAR").unwrap();`;

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, '_PRIVATE_VAR');
    });

    it('should accept variables with numbers after letters', () => {
      const content = `let x = env::var("VAR_123_TEST").unwrap();`;

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'VAR_123_TEST');
    });

    it('should handle empty content', () => {
      const result = scan('', 'test.rs');

      assert.strictEqual(result.length, 0);
    });

    it('should handle content with no matches', () => {
      const content = `
fn main() {
    let x = 42;
    println!("hello");
}
      `.trim();

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 0);
    });

    it('should track correct line numbers in multi-line files', () => {
      const content = `
use std::env;

fn main() {
    // Line 5
    let a = env::var("VAR_LINE_6").unwrap();
    // Line 7
    let b = std::env::var("VAR_LINE_8").unwrap();
}
      `.trim();

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].lineNumber, 5);
      assert.strictEqual(result[0].varName, 'VAR_LINE_6');
      assert.strictEqual(result[1].lineNumber, 7);
      assert.strictEqual(result[1].varName, 'VAR_LINE_8');
    });

    it('should include filePath in results', () => {
      const content = `let x = env::var("TEST_VAR").unwrap();`;

      const result = scan(content, 'src/config/database.rs');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'src/config/database.rs');
    });

    it('should handle Result unwrap patterns', () => {
      const content = `
let port = env::var("PORT").unwrap();
let host = env::var("HOST").expect("HOST required");
let debug = env::var("DEBUG").unwrap_or_else(|_| "false".to_string());
      `.trim();

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[1].varName, 'HOST');
      assert.strictEqual(result[2].varName, 'DEBUG');
    });

    it('should handle match expressions', () => {
      const content = `
match env::var("API_KEY") {
    Ok(key) => println!("Key: {}", key),
    Err(_) => println!("No key"),
}
      `.trim();

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'API_KEY');
    });

    it('should handle struct initialization', () => {
      const content = `
let config = Config {
    database_url: env::var("DATABASE_URL").unwrap(),
    redis_host: env::var("REDIS_HOST").unwrap(),
    api_key: env::var("API_KEY").unwrap(),
};
      `.trim();

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'REDIS_HOST');
      assert.strictEqual(result[2].varName, 'API_KEY');
    });

    it('should handle if let expressions', () => {
      const content = `
if let Ok(api_key) = env::var("API_KEY") {
    client.set_api_key(&api_key);
}
      `.trim();

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'API_KEY');
    });

    it('should handle comments containing env var patterns', () => {
      const content = `
// This uses env::var("COMMENTED_VAR")
let x = env::var("ACTUAL_VAR").unwrap();
/* env::var("BLOCK_COMMENT_VAR") */
      `.trim();

      const result = scan(content, 'test.rs');

      // Comments are not filtered - regex matches all occurrences
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'COMMENTED_VAR');
      assert.strictEqual(result[1].varName, 'ACTUAL_VAR');
      assert.strictEqual(result[2].varName, 'BLOCK_COMMENT_VAR');
    });

    it('should handle const declarations', () => {
      const content = `
const DEFAULT_PORT: &str = env::var("DEFAULT_PORT").unwrap();
const DEFAULT_HOST: &str = env::var("DEFAULT_HOST").unwrap();
      `.trim();

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DEFAULT_PORT');
      assert.strictEqual(result[1].varName, 'DEFAULT_HOST');
    });

    it('should handle lazy_static patterns', () => {
      const content = `
lazy_static! {
    static ref DB_URL: String = env::var("DATABASE_URL").unwrap();
    static ref API_KEY: String = env::var("API_KEY").unwrap();
}
      `.trim();

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
    });

    it('should handle realistic Rust configuration code', () => {
      const content = `
use std::env;

#[derive(Debug)]
struct Config {
    database_url: String,
    port: u16,
    api_key: String,
    debug: bool,
}

impl Config {
    fn load() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Config {
            database_url: env::var("DATABASE_URL")?,
            port: env::var("PORT")?.parse()?,
            api_key: env::var("API_KEY")?,
            debug: env::var("DEBUG").unwrap_or_else(|_| "false".to_string()) == "true",
        })
    }
}
      `.trim();

      const result = scan(content, 'config.rs');

      assert.strictEqual(result.length, 4);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[1].varName, 'PORT');
      assert.strictEqual(result[2].varName, 'API_KEY');
      assert.strictEqual(result[3].varName, 'DEBUG');
    });

    it('should handle var_os with OsString operations', () => {
      const content = `
use std::env;
use std::ffi::OsString;

fn main() {
    let path = env::var_os("PATH").unwrap();
    let home = std::env::var_os("HOME").expect("HOME not set");
}
      `.trim();

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'PATH');
      assert.strictEqual(result[1].varName, 'HOME');
    });

    it('should handle Option patterns with var_os', () => {
      const content = `
if let Some(path) = env::var_os("PATH") {
    println!("PATH is set");
}

match std::env::var_os("HOME") {
    Some(home) => println!("Home: {:?}", home),
    None => println!("HOME not set"),
}
      `.trim();

      const result = scan(content, 'test.rs');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'PATH');
      assert.strictEqual(result[1].varName, 'HOME');
    });
  });

  describe('getSupportedExtensions()', () => {
    it('should return array of supported extensions', () => {
      const extensions = getSupportedExtensions();

      assert.ok(Array.isArray(extensions));
      assert.ok(extensions.length > 0);
    });

    it('should include .rs extension', () => {
      const extensions = getSupportedExtensions();

      assert.ok(extensions.includes('.rs'));
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
