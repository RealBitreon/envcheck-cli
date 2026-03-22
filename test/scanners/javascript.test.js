import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scan, getSupportedExtensions, getPatterns } from '../../src/scanners/javascript.js';

describe('JavaScript Scanner', () => {
  describe('scan()', () => {
    it('should detect process.env.VAR_NAME (dot notation)', () => {
      const content = `
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;
      `.trim();

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DATABASE_URL');
      assert.strictEqual(result[0].lineNumber, 1);
      assert.strictEqual(result[0].pattern, 'process.env.DATABASE_URL');
      assert.strictEqual(result[1].varName, 'API_KEY');
      assert.strictEqual(result[1].lineNumber, 2);
    });

    it('should detect process.env["VAR_NAME"] (bracket notation with double quotes)', () => {
      const content = `const port = process.env["PORT"];`;

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'PORT');
      assert.strictEqual(result[0].pattern, 'process.env["PORT"]');
    });

    it("should detect process.env['VAR_NAME'] (bracket notation with single quotes)", () => {
      const content = `const host = process.env['HOST'];`;

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'HOST');
      assert.strictEqual(result[0].pattern, "process.env['HOST']");
    });

    it('should detect import.meta.env.VAR_NAME (Vite pattern)', () => {
      const content = `
const apiUrl = import.meta.env.VITE_API_URL;
const mode = import.meta.env.MODE;
      `.trim();

      const result = scan(content, 'test.ts');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'VITE_API_URL');
      assert.strictEqual(result[0].pattern, 'import.meta.env.VITE_API_URL');
      assert.strictEqual(result[1].varName, 'MODE');
    });

    it('should detect multiple references on the same line', () => {
      const content = `const config = { db: process.env.DB_HOST, port: process.env.DB_PORT };`;

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'DB_HOST');
      assert.strictEqual(result[1].varName, 'DB_PORT');
      assert.strictEqual(result[0].lineNumber, 1);
      assert.strictEqual(result[1].lineNumber, 1);
    });

    it('should detect mixed patterns in the same file', () => {
      const content = `
const a = process.env.VAR_A;
const b = process.env["VAR_B"];
const c = process.env['VAR_C'];
const d = import.meta.env.VAR_D;
      `.trim();

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 4);
      assert.strictEqual(result[0].varName, 'VAR_A');
      assert.strictEqual(result[1].varName, 'VAR_B');
      assert.strictEqual(result[2].varName, 'VAR_C');
      assert.strictEqual(result[3].varName, 'VAR_D');
    });

    it('should ignore lowercase variable names', () => {
      const content = `const x = process.env.lowercase;`;

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 0);
    });

    it('should ignore variables starting with numbers', () => {
      const content = `const x = process.env.123VAR;`;

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 0);
    });

    it('should accept variables starting with underscore', () => {
      const content = `const x = process.env._PRIVATE_VAR;`;

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, '_PRIVATE_VAR');
    });

    it('should accept variables with numbers after letters', () => {
      const content = `const x = process.env.VAR_123_TEST;`;

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'VAR_123_TEST');
    });

    it('should handle empty content', () => {
      const result = scan('', 'test.js');

      assert.strictEqual(result.length, 0);
    });

    it('should handle content with no matches', () => {
      const content = `
const x = 42;
function test() {
  return "hello";
}
      `.trim();

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 0);
    });

    it('should track correct line numbers in multi-line files', () => {
      const content = `
// Line 1
const a = 1;
const b = process.env.VAR_LINE_4;
// Line 5
const c = 2;
const d = process.env.VAR_LINE_7;
      `.trim();

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].lineNumber, 3);
      assert.strictEqual(result[0].varName, 'VAR_LINE_4');
      assert.strictEqual(result[1].lineNumber, 6);
      assert.strictEqual(result[1].varName, 'VAR_LINE_7');
    });

    it('should include filePath in results', () => {
      const content = `const x = process.env.TEST_VAR;`;

      const result = scan(content, 'src/config/database.js');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'src/config/database.js');
    });

    it('should handle TypeScript syntax', () => {
      const content = `
const apiUrl: string = process.env.API_URL || 'default';
const port: number = parseInt(process.env.PORT || '3000');
      `.trim();

      const result = scan(content, 'test.ts');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'API_URL');
      assert.strictEqual(result[1].varName, 'PORT');
    });

    it('should handle JSX/TSX syntax', () => {
      const content = `
export default function App() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  return <div>{import.meta.env.VITE_TITLE}</div>;
}
      `.trim();

      const result = scan(content, 'App.tsx');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].varName, 'NEXT_PUBLIC_API_URL');
      assert.strictEqual(result[1].varName, 'VITE_TITLE');
    });

    it('should handle destructuring patterns', () => {
      const content = `
const { DATABASE_URL, REDIS_URL } = process.env;
      `.trim();

      const result = scan(content, 'test.js');

      // Destructuring doesn't match our patterns (no .VAR_NAME or ['VAR_NAME'])
      assert.strictEqual(result.length, 0);
    });

    it('should handle template literals', () => {
      const content = 'const url = `https://${process.env.API_HOST}/api`;';

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].varName, 'API_HOST');
    });

    it('should not match process.env without variable name', () => {
      const content = `
const env = process.env;
const keys = Object.keys(process.env);
      `.trim();

      const result = scan(content, 'test.js');

      assert.strictEqual(result.length, 0);
    });

    it('should handle comments containing env var patterns', () => {
      const content = `
// This uses process.env.COMMENTED_VAR
const x = process.env.ACTUAL_VAR;
/* process.env.BLOCK_COMMENT_VAR */
      `.trim();

      const result = scan(content, 'test.js');

      // Comments are not filtered - regex matches all occurrences
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].varName, 'COMMENTED_VAR');
      assert.strictEqual(result[1].varName, 'ACTUAL_VAR');
      assert.strictEqual(result[2].varName, 'BLOCK_COMMENT_VAR');
    });
  });

  describe('getSupportedExtensions()', () => {
    it('should return array of supported extensions', () => {
      const extensions = getSupportedExtensions();

      assert.ok(Array.isArray(extensions));
      assert.ok(extensions.length > 0);
    });

    it('should include common JS/TS extensions', () => {
      const extensions = getSupportedExtensions();

      assert.ok(extensions.includes('.js'));
      assert.ok(extensions.includes('.jsx'));
      assert.ok(extensions.includes('.ts'));
      assert.ok(extensions.includes('.tsx'));
      assert.ok(extensions.includes('.mjs'));
      assert.ok(extensions.includes('.cjs'));
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
