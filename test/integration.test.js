import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { run } from '../src/cli.js';

/**
 * Helper to capture console output
 */
function captureOutput(fn) {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  let stdout = '';
  let stderr = '';
  
  console.log = (msg) => { stdout += msg + '\n'; };
  console.error = (msg) => { stderr += msg + '\n'; };
  console.warn = (msg) => { stderr += msg + '\n'; };
  
  return {
    async run() {
      try {
        return await fn();
      } finally {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      }
    },
    get stdout() { return stdout; },
    get stderr() { return stderr; }
  };
}

/**
 * Helper to run CLI with test-friendly defaults
 */
function runTest(args) {
  // Add flags to disable features that might cause issues in tests
  const testArgs = [...args, '--no-progress', '--no-suggestions'];
  return run(testArgs);
}

describe('Integration Tests - End-to-End', () => {
  const testRoot = path.join('test', 'fixtures', 'integration');

  before(() => {
    fs.mkdirSync(testRoot, { recursive: true });
  });

  after(() => {
    fs.rmSync(testRoot, { recursive: true, force: true });
  });

  describe('9.3.1 Text Output Format', () => {
    it('should display missing variables with file references', async () => {
      const caseDir = path.join(testRoot, 'text-missing');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() => 
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example')])
      );
      
      const exitCode = await capture.run();
      
      assert.strictEqual(exitCode, 0);
      assert.ok(capture.stdout.includes('MISSING'));
      assert.ok(capture.stdout.includes('DATABASE_URL'));
      assert.ok(capture.stdout.includes('app.js'));
    });

    it('should display unused variables', async () => {
      const caseDir = path.join(testRoot, 'text-unused');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const port = process.env.PORT;'
      );
      fs.writeFileSync(
        path.join(caseDir, '.env.example'),
        'PORT=3000\nLEGACY_VAR=old\n'
      );

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example')])
      );
      
      const exitCode = await capture.run();
      
      assert.strictEqual(exitCode, 0);
      assert.ok(capture.stdout.includes('UNUSED'));
      assert.ok(capture.stdout.includes('LEGACY_VAR'));
    });

    it('should display undocumented variables', async () => {
      const caseDir = path.join(testRoot, 'text-undocumented');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const secret = process.env.API_SECRET;'
      );
      fs.writeFileSync(
        path.join(caseDir, '.env.example'),
        'API_SECRET=\n'
      );

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example')])
      );
      
      const exitCode = await capture.run();
      
      assert.strictEqual(exitCode, 0);
      assert.ok(capture.stdout.includes('UNDOCUMENTED'));
      assert.ok(capture.stdout.includes('API_SECRET'));
    });

    it('should respect --no-color flag', async () => {
      const caseDir = path.join(testRoot, 'text-no-color');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example'), '--no-color'])
      );
      
      await capture.run();
      
      assert.ok(!capture.stdout.includes('\x1b['), 'Should not contain ANSI codes');
      assert.ok(capture.stdout.includes('DATABASE_URL'));
    });

    it('should respect --quiet flag when no issues', async () => {
      const caseDir = path.join(testRoot, 'text-quiet-no-issues');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const port = process.env.PORT;'
      );
      fs.writeFileSync(
        path.join(caseDir, '.env.example'),
        'PORT=3000 # Server port\n'
      );

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example'), '--quiet'])
      );
      
      await capture.run();
      
      assert.strictEqual(capture.stdout.trim(), '');
    });
  });

  describe('9.3.2 JSON Output Format', () => {
    it('should output valid parseable JSON', async () => {
      const caseDir = path.join(testRoot, 'json-valid');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example'), '--format', 'json'])
      );
      
      await capture.run();
      
      const parsed = JSON.parse(capture.stdout);
      assert.ok(parsed);
      assert.ok(Array.isArray(parsed.missing));
      assert.ok(Array.isArray(parsed.unused));
      assert.ok(Array.isArray(parsed.undocumented));
      assert.ok(parsed.summary);
    });

    it('should include missing variables with references', async () => {
      const caseDir = path.join(testRoot, 'json-missing');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example'), '--format', 'json'])
      );
      
      await capture.run();
      
      const parsed = JSON.parse(capture.stdout);
      assert.strictEqual(parsed.missing.length, 1);
      assert.strictEqual(parsed.missing[0].varName, 'DATABASE_URL');
      assert.ok(parsed.missing[0].references);
      assert.ok(parsed.missing[0].references[0].filePath);
      assert.ok(parsed.missing[0].references[0].lineNumber);
    });

    it('should include accurate summary statistics', async () => {
      const caseDir = path.join(testRoot, 'json-summary');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;\nconst secret = process.env.API_SECRET;'
      );
      fs.writeFileSync(
        path.join(caseDir, '.env.example'),
        'API_SECRET=\nLEGACY_VAR=old\n'
      );

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example'), '--format', 'json'])
      );
      
      await capture.run();
      
      const parsed = JSON.parse(capture.stdout);
      assert.strictEqual(parsed.summary.totalMissing, 1);
      assert.strictEqual(parsed.summary.totalUnused, 1);
      assert.strictEqual(parsed.summary.totalUndocumented, 1);
    });
  });

  describe('9.3.3 GitHub Actions Output Format', () => {
    it('should output ::error annotations for missing variables', async () => {
      const caseDir = path.join(testRoot, 'github-missing');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example'), '--format', 'github'])
      );
      
      await capture.run();
      
      assert.ok(capture.stdout.includes('::error'));
      assert.ok(capture.stdout.includes('DATABASE_URL'));
      assert.ok(capture.stdout.includes('file='));
    });

    it('should output ::warning annotations for unused variables', async () => {
      const caseDir = path.join(testRoot, 'github-unused');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const port = process.env.PORT;'
      );
      fs.writeFileSync(
        path.join(caseDir, '.env.example'),
        'PORT=3000\nLEGACY_VAR=old\n'
      );

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example'), '--format', 'github'])
      );
      
      await capture.run();
      
      assert.ok(capture.stdout.includes('::warning'));
      assert.ok(capture.stdout.includes('LEGACY_VAR'));
    });
  });

  describe('9.3.4 Exit Code Behavior', () => {
    it('should exit with 0 when --fail-on none', async () => {
      const caseDir = path.join(testRoot, 'exit-none');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example'), '--fail-on', 'none'])
      );
      
      const exitCode = await capture.run();
      assert.strictEqual(exitCode, 0);
    });

    it('should exit with 1 when --fail-on missing and missing variables exist', async () => {
      const caseDir = path.join(testRoot, 'exit-missing-fail');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example'), '--fail-on', 'missing'])
      );
      
      const exitCode = await capture.run();
      assert.strictEqual(exitCode, 1);
    });

    it('should exit with 0 when --fail-on missing but no missing variables', async () => {
      const caseDir = path.join(testRoot, 'exit-missing-pass');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const port = process.env.PORT;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000 # Server port\n');

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example'), '--fail-on', 'missing'])
      );
      
      const exitCode = await capture.run();
      assert.strictEqual(exitCode, 0);
    });

    it('should exit with 1 when --fail-on all and any issues exist', async () => {
      const caseDir = path.join(testRoot, 'exit-all-fail');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example'), '--fail-on', 'all'])
      );
      
      const exitCode = await capture.run();
      assert.strictEqual(exitCode, 1);
    });

    it('should exit with 2 on file system errors', async () => {
      const caseDir = path.join(testRoot, 'exit-error');
      fs.mkdirSync(caseDir, { recursive: true });

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, 'nonexistent.env')])
      );
      
      const exitCode = await capture.run();
      assert.strictEqual(exitCode, 2);
    });
  });

  describe('9.3.5 Ignore Pattern Handling', () => {
    it('should ignore files matching --ignore pattern', async () => {
      const caseDir = path.join(testRoot, 'ignore-cli-flag');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(
        path.join(caseDir, 'test.js'),
        'const test = process.env.TEST_VAR;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() =>
        runTest([
          caseDir,
          '--env-file', path.join(caseDir, '.env.example'),
          '--ignore', '**/test.js'
        ])
      );
      
      await capture.run();
      
      assert.ok(capture.stdout.includes('DATABASE_URL'));
      assert.ok(!capture.stdout.includes('TEST_VAR'));
    });

    it('should respect .gitignore patterns', async () => {
      const caseDir = path.join(testRoot, 'ignore-gitignore');
      fs.mkdirSync(caseDir, { recursive: true });
      fs.mkdirSync(path.join(caseDir, 'dist'), { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(
        path.join(caseDir, 'dist', 'bundle.js'),
        'const dist = process.env.DIST_VAR;'
      );
      fs.writeFileSync(path.join(caseDir, '.gitignore'), 'dist/\n');
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example')])
      );
      
      await capture.run();
      
      assert.ok(capture.stdout.includes('DATABASE_URL'));
      assert.ok(!capture.stdout.includes('DIST_VAR'));
    });

    it('should apply default ignore patterns for node_modules', async () => {
      const caseDir = path.join(testRoot, 'ignore-node-modules');
      fs.mkdirSync(caseDir, { recursive: true });
      fs.mkdirSync(path.join(caseDir, 'node_modules', 'pkg'), { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(
        path.join(caseDir, 'node_modules', 'pkg', 'index.js'),
        'const pkg = process.env.PKG_VAR;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() =>
        runTest([caseDir, '--env-file', path.join(caseDir, '.env.example')])
      );
      
      await capture.run();
      
      assert.ok(capture.stdout.includes('DATABASE_URL'));
      assert.ok(!capture.stdout.includes('PKG_VAR'));
    });

    it('should handle multiple --ignore flags', async () => {
      const caseDir = path.join(testRoot, 'ignore-multiple');
      fs.mkdirSync(caseDir, { recursive: true });
      fs.mkdirSync(path.join(caseDir, 'specs'), { recursive: true });

      fs.writeFileSync(
        path.join(caseDir, 'app.js'),
        'const db = process.env.DATABASE_URL;'
      );
      fs.writeFileSync(
        path.join(caseDir, 'specs', 'spec.js'),
        'const test = process.env.TEST_VAR;'
      );
      fs.writeFileSync(path.join(caseDir, '.env.example'), 'PORT=3000\n');

      const capture = captureOutput(() =>
        runTest([
          caseDir,
          '--env-file', path.join(caseDir, '.env.example'),
          '--ignore', '**/specs/**'
        ])
      );
      
      await capture.run();
      
      assert.ok(capture.stdout.includes('DATABASE_URL'), 'Should detect DATABASE_URL from app.js');
      assert.ok(!capture.stdout.includes('TEST_VAR'), 'Should not detect TEST_VAR from ignored specs/');
    });
  });
});
