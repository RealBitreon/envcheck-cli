import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { parseArguments, displayHelp, displayVersion, run } from '../src/cli.js';

describe('CLI Argument Parser', () => {
  describe('parseArguments', () => {
    it('should parse default options with no arguments', () => {
      const options = parseArguments([]);
      assert.strictEqual(options.path, '.');
      assert.strictEqual(options.envFile, '.env.example');
      assert.strictEqual(options.format, 'text');
      assert.strictEqual(options.failOn, 'none');
      assert.deepStrictEqual(options.ignore, []);
      assert.strictEqual(options.noColor, false);
      assert.strictEqual(options.quiet, false);
      assert.strictEqual(options.version, false);
      assert.strictEqual(options.help, false);
    });

    it('should parse path argument', () => {
      const options = parseArguments(['./src']);
      assert.strictEqual(options.path, './src');
    });

    it('should parse multiple path arguments (last one wins)', () => {
      const options = parseArguments(['./src', './lib']);
      assert.strictEqual(options.path, './lib');
    });

    it('should parse --env-file flag', () => {
      const options = parseArguments(['--env-file', '.env.production.example']);
      assert.strictEqual(options.envFile, '.env.production.example');
    });

    it('should throw error if --env-file has no value', () => {
      assert.throws(
        () => parseArguments(['--env-file']),
        { message: '--env-file requires a value' }
      );
    });

    it('should parse --format flag with text', () => {
      const options = parseArguments(['--format', 'text']);
      assert.strictEqual(options.format, 'text');
    });

    it('should parse --format flag with json', () => {
      const options = parseArguments(['--format', 'json']);
      assert.strictEqual(options.format, 'json');
    });

    it('should parse --format flag with github', () => {
      const options = parseArguments(['--format', 'github']);
      assert.strictEqual(options.format, 'github');
    });

    it('should parse -f short flag', () => {
      const options = parseArguments(['-f', 'json']);
      assert.strictEqual(options.format, 'json');
    });

    it('should throw error if --format has no value', () => {
      assert.throws(
        () => parseArguments(['--format']),
        { message: '--format requires a value' }
      );
    });

    it('should throw error if --format has invalid value', () => {
      assert.throws(
        () => parseArguments(['--format', 'invalid']),
        { message: /Invalid --format value/ }
      );
    });

    it('should parse --fail-on flag with missing', () => {
      const options = parseArguments(['--fail-on', 'missing']);
      assert.strictEqual(options.failOn, 'missing');
    });

    it('should parse --fail-on flag with unused', () => {
      const options = parseArguments(['--fail-on', 'unused']);
      assert.strictEqual(options.failOn, 'unused');
    });

    it('should parse --fail-on flag with undocumented', () => {
      const options = parseArguments(['--fail-on', 'undocumented']);
      assert.strictEqual(options.failOn, 'undocumented');
    });

    it('should parse --fail-on flag with all', () => {
      const options = parseArguments(['--fail-on', 'all']);
      assert.strictEqual(options.failOn, 'all');
    });

    it('should parse --fail-on flag with none', () => {
      const options = parseArguments(['--fail-on', 'none']);
      assert.strictEqual(options.failOn, 'none');
    });

    it('should throw error if --fail-on has no value', () => {
      assert.throws(
        () => parseArguments(['--fail-on']),
        { message: '--fail-on requires a value' }
      );
    });

    it('should throw error if --fail-on has invalid value', () => {
      assert.throws(
        () => parseArguments(['--fail-on', 'invalid']),
        { message: /Invalid --fail-on value/ }
      );
    });

    it('should parse single --ignore flag', () => {
      const options = parseArguments(['--ignore', '**/*.test.js']);
      assert.deepStrictEqual(options.ignore, ['**/*.test.js']);
    });

    it('should parse multiple --ignore flags', () => {
      const options = parseArguments([
        '--ignore', '**/*.test.js',
        '--ignore', '**/dist/**',
        '--ignore', 'node_modules/**'
      ]);
      assert.deepStrictEqual(options.ignore, [
        '**/*.test.js',
        '**/dist/**',
        'node_modules/**'
      ]);
    });

    it('should parse -i short flag', () => {
      const options = parseArguments(['-i', '**/*.test.js']);
      assert.deepStrictEqual(options.ignore, ['**/*.test.js']);
    });

    it('should throw error if --ignore has no value', () => {
      assert.throws(
        () => parseArguments(['--ignore']),
        { message: '--ignore requires a value' }
      );
    });

    it('should throw error if --ignore pattern is empty', () => {
      assert.throws(
        () => parseArguments(['--ignore', '']),
        { message: '--ignore pattern cannot be empty' }
      );
    });

    it('should parse --no-color flag', () => {
      const options = parseArguments(['--no-color']);
      assert.strictEqual(options.noColor, true);
    });

    it('should parse --quiet flag', () => {
      const options = parseArguments(['--quiet']);
      assert.strictEqual(options.quiet, true);
    });

    it('should parse -q short flag', () => {
      const options = parseArguments(['-q']);
      assert.strictEqual(options.quiet, true);
    });

    it('should parse --version flag', () => {
      const options = parseArguments(['--version']);
      assert.strictEqual(options.version, true);
    });

    it('should parse -v short flag', () => {
      const options = parseArguments(['-v']);
      assert.strictEqual(options.version, true);
    });

    it('should parse --help flag', () => {
      const options = parseArguments(['--help']);
      assert.strictEqual(options.help, true);
    });

    it('should parse -h short flag', () => {
      const options = parseArguments(['-h']);
      assert.strictEqual(options.help, true);
    });

    it('should throw error for unrecognized long flag', () => {
      assert.throws(
        () => parseArguments(['--unknown']),
        { message: 'Unrecognized flag: --unknown' }
      );
    });

    it('should throw error for unrecognized short flag', () => {
      assert.throws(
        () => parseArguments(['-x']),
        { message: 'Unrecognized flag: -x' }
      );
    });

    it('should parse complex combination of arguments', () => {
      const options = parseArguments([
        './src',
        '--env-file', '.env.prod.example',
        '--format', 'json',
        '--fail-on', 'missing',
        '--ignore', '**/*.test.js',
        '--ignore', '**/dist/**',
        '--no-color',
        '--quiet'
      ]);

      assert.strictEqual(options.path, './src');
      assert.strictEqual(options.envFile, '.env.prod.example');
      assert.strictEqual(options.format, 'json');
      assert.strictEqual(options.failOn, 'missing');
      assert.deepStrictEqual(options.ignore, ['**/*.test.js', '**/dist/**']);
      assert.strictEqual(options.noColor, true);
      assert.strictEqual(options.quiet, true);
    });

    it('should skip validation when --help flag is set', () => {
      // Should not throw even with invalid format
      const options = parseArguments(['--help', '--format', 'invalid']);
      assert.strictEqual(options.help, true);
    });

    it('should skip validation when --version flag is set', () => {
      // Should not throw even with invalid format
      const options = parseArguments(['--version', '--format', 'invalid']);
      assert.strictEqual(options.version, true);
    });

    it('should throw error if path is empty string', () => {
      assert.throws(
        () => parseArguments(['']),
        { message: 'Path argument cannot be empty' }
      );
    });

    it('should throw error if --env-file path is empty', () => {
      assert.throws(
        () => parseArguments(['--env-file', '']),
        { message: '--env-file path cannot be empty' }
      );
    });

    it('should handle flags in any order', () => {
      const options = parseArguments([
        '--no-color',
        './src',
        '--format', 'json',
        '--quiet'
      ]);

      assert.strictEqual(options.path, './src');
      assert.strictEqual(options.format, 'json');
      assert.strictEqual(options.noColor, true);
      assert.strictEqual(options.quiet, true);
    });

    it('should handle mixed short and long flags', () => {
      const options = parseArguments([
        '-f', 'json',
        '-i', '**/*.test.js',
        '--no-color',
        '-q'
      ]);

      assert.strictEqual(options.format, 'json');
      assert.deepStrictEqual(options.ignore, ['**/*.test.js']);
      assert.strictEqual(options.noColor, true);
      assert.strictEqual(options.quiet, true);
    });
  });

  describe('displayHelp', () => {
    it('should display help without throwing', () => {
      // Capture console.log output
      const originalLog = console.log;
      let output = '';
      console.log = (msg) => { output += msg; };

      try {
        displayHelp();
        assert.ok(output.includes('envcheck'));
        assert.ok(output.includes('USAGE'));
        assert.ok(output.includes('OPTIONS'));
        assert.ok(output.includes('EXAMPLES'));
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('displayVersion', () => {
    it('should display version without throwing', () => {
      // Capture console.log output
      const originalLog = console.log;
      let output = '';
      console.log = (msg) => { output += msg; };

      try {
        displayVersion();
        assert.ok(output.includes('envcheck'));
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('run performance behavior', () => {
    const testRoot = path.join('test', 'fixtures', 'cli-performance');

    before(() => {
      fs.mkdirSync(testRoot, { recursive: true });
    });

    after(() => {
      fs.rmSync(testRoot, { recursive: true, force: true });
    });

    it('should scan a large file through streaming and return success', async () => {
      const caseDir = path.join(testRoot, 'large-file');
      fs.mkdirSync(caseDir, { recursive: true });

      const largeFilePath = path.join(caseDir, 'app.js');
      const envPath = path.join(caseDir, '.env.example');
      const lineCount = 20000;
      const lines = new Array(lineCount).fill('const url = process.env.LARGE_VAR;').join('\n');

      fs.writeFileSync(largeFilePath, lines);
      fs.writeFileSync(envPath, 'LARGE_VAR=value\n');

      const exitCode = await run([caseDir, '--env-file', envPath, '--fail-on', 'none', '--quiet']);

      assert.strictEqual(exitCode, 0);
    });

    it('should scan many files with configurable concurrency and return success', async () => {
      const caseDir = path.join(testRoot, 'many-files');
      fs.mkdirSync(caseDir, { recursive: true });

      const envPath = path.join(caseDir, '.env.example');
      fs.writeFileSync(envPath, 'BULK_VAR=value\n');

      for (let i = 0; i < 300; i++) {
        fs.writeFileSync(
          path.join(caseDir, `file${i}.js`),
          `const value${i} = process.env.BULK_VAR;\n`
        );
      }

      const previousConcurrency = process.env.ENVCHECK_SCAN_CONCURRENCY;
      process.env.ENVCHECK_SCAN_CONCURRENCY = '4';

      try {
        const exitCode = await run([caseDir, '--env-file', envPath, '--fail-on', 'none', '--quiet']);
        assert.strictEqual(exitCode, 0);
      } finally {
        if (previousConcurrency === undefined) {
          delete process.env.ENVCHECK_SCAN_CONCURRENCY;
        } else {
          process.env.ENVCHECK_SCAN_CONCURRENCY = previousConcurrency;
        }
      }
    });
  });
});
