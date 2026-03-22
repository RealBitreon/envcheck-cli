WWWimport { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { validateGlobPattern } from './ignore.js';
import { loadConfig, mergeConfig } from './config.js';
import { Spinner } from './progress.js';
import { generateSuggestions, findSimilarVariables } from './suggestions.js';
import { startWatchMode } from './watch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parse command-line arguments into a structured options object
 * @param {string[]} args - Command-line arguments (typically process.argv.slice(2))
 * @returns {CLIOptions} Parsed options object
 * @throws {Error} If arguments are invalid
 */
export function parseArguments(args) {
  const options = {
    path: '.',
    envFile: '.env.example',
    format: 'text',
    failOn: 'none',
    ignore: [],
    noColor: false,
    quiet: false,
    version: false,
    help: false,
    watch: false,
    suggestions: true,
    progress: true,
    config: null,
    fix: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    // Handle flags
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      i++;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
      i++;
    } else if (arg === '--no-color') {
      options.noColor = true;
      i++;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
      i++;
    } else if (arg === '--watch' || arg === '-w') {
      options.watch = true;
      i++;
    } else if (arg === '--no-suggestions') {
      options.suggestions = false;
      i++;
    } else if (arg === '--no-progress') {
      options.progress = false;
      i++;
    } else if (arg === '--fix') {
      options.fix = true;
      i++;
    } else if (arg === '--config' || arg === '-c') {
      if (i + 1 >= args.length) {
        throw new Error('--config requires a value');
      }
      options.config = args[i + 1];
      i += 2;
    } else if (arg === '--env-file') {
      if (i + 1 >= args.length) {
        throw new Error('--env-file requires a value');
      }
      options.envFile = args[i + 1];
      i += 2;
    } else if (arg === '--format' || arg === '-f') {
      if (i + 1 >= args.length) {
        throw new Error('--format requires a value');
      }
      options.format = args[i + 1];
      i += 2;
    } else if (arg === '--fail-on') {
      if (i + 1 >= args.length) {
        throw new Error('--fail-on requires a value');
      }
      options.failOn = args[i + 1];
      i += 2;
    } else if (arg === '--ignore' || arg === '-i') {
      if (i + 1 >= args.length) {
        throw new Error('--ignore requires a value');
      }
      options.ignore.push(args[i + 1]);
      i += 2;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unrecognized flag: ${arg}`);
    } else if (arg.startsWith('-') && arg !== '-') {
      throw new Error(`Unrecognized flag: ${arg}`);
    } else {
      // Positional argument (path)
      options.path = arg;
      i++;
    }
  }

  // Validate options
  validateOptions(options);

  return options;
}

/**
 * Validate parsed CLI options
 * @param {CLIOptions} options - Parsed options to validate
 * @throws {Error} If options are invalid
 */
function validateOptions(options) {
  // Skip validation if help or version flags are set
  if (options.help || options.version) {
    return;
  }

  // Validate format
  const validFormats = ['text', 'json', 'github'];
  if (!validFormats.includes(options.format)) {
    throw new Error(
      `Invalid --format value: "${options.format}". Must be one of: ${validFormats.join(', ')}`
    );
  }

  // Validate failOn
  const validFailOn = ['missing', 'unused', 'undocumented', 'all', 'none'];
  if (!validFailOn.includes(options.failOn)) {
    throw new Error(
      `Invalid --fail-on value: "${options.failOn}". Must be one of: ${validFailOn.join(', ')}`
    );
  }

  // Validate ignore patterns (basic check for invalid glob patterns)
  for (const pattern of options.ignore) {
    if (pattern.trim() === '') {
      throw new Error('--ignore pattern cannot be empty');
    }
    try {
      validateGlobPattern(pattern);
    } catch (error) {
      throw new Error(error.message.replace('Invalid glob pattern', 'Invalid --ignore pattern'));
    }
  }

  // Validate path is not empty
  if (options.path.trim() === '') {
    throw new Error('Path argument cannot be empty');
  }

  // Validate envFile is not empty
  if (options.envFile.trim() === '') {
    throw new Error('--env-file path cannot be empty');
  }
}

/**
 * Display help message
 */
export function displayHelp() {
  const helpText = `
envcheck - Validate environment variable usage across your codebase

USAGE:
  envcheck [path] [options]
  envcheck --repl              Start interactive REPL mode
  envcheck                     Start interactive REPL mode (no args)

ARGUMENTS:
  path                    Directory or file to scan (default: ".")

OPTIONS:
  --env-file <path>       Path to .env.example file (default: ".env.example")
  --format, -f <format>   Output format: text, json, github (default: "text")
  --fail-on <condition>   Exit with code 1 if condition met:
                          missing, unused, undocumented, all, none (default: "none")
  --ignore, -i <pattern>  Glob pattern to ignore (repeatable)
  --config, -c <path>     Load configuration from file
  --watch, -w             Watch mode - rerun on file changes
  --fix                   Auto-fix issues by updating .env.example
  --no-color              Disable colored output
  --no-suggestions        Disable intelligent suggestions
  --no-progress           Disable progress indicators
  --quiet, -q             Suppress output when no issues found
  --repl, -r              Start interactive REPL mode
  --version, -v           Display version number
  --help, -h              Display this help message

EXAMPLES:
  envcheck .
  envcheck ./src --env-file .env.production.example
  envcheck . --format json --fail-on missing
  envcheck . --ignore "**/*.test.js" --ignore "**/dist/**"
  envcheck . --format github --fail-on all
  envcheck . --watch
  envcheck . --fix
  envcheck . --config .envcheckrc.json
  envcheck --repl

REPL MODE:
  Start an interactive session with persistent configuration:
    envcheck
    envcheck --repl

  REPL Commands:
    :help                   Show REPL help
    :config                 Show current configuration
    :set <key> <value>      Set configuration (path, format, etc.)
    :history                Show command history
    :results                Show previous results
    :exit                   Exit REPL

  REPL Examples:
    :set path ./src
    :set format json
    . --fail-on missing
    envcheck . --format github

EXIT CODES:
  0  Success (no issues or issues don't match --fail-on)
  1  Validation failed (issues match --fail-on condition)
  2  Error (invalid arguments, file not found, etc.)

For more information, visit: https://github.com/yourusername/envcheck
`;

  console.log(helpText.trim());
}

/**
 * Display version number
 */
export function displayVersion() {
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    console.log(`envcheck v${packageJson.version}`);
  } catch (error) {
    console.log('envcheck (version unknown)');
  }
}

/**
 * @typedef {Object} CLIOptions
 * @property {string} path - Directory or file to scan
 * @property {string} envFile - Path to .env.example file
 * @property {'text'|'json'|'github'} format - Output format
 * @property {'missing'|'unused'|'undocumented'|'all'|'none'} failOn - Exit code condition
 * @property {string[]} ignore - Glob patterns to ignore
 * @property {boolean} noColor - Disable colored output
 * @property {boolean} quiet - Suppress output when no issues
 * @property {boolean} version - Display version
 * @property {boolean} help - Display help
 */

/**
 * Determine exit code based on analysis results and --fail-on flag
 * 
 * @param {{missing: Array, unused: Array, undocumented: Array}} result - Analysis result
 * @param {'missing'|'unused'|'undocumented'|'all'|'none'} failOn - Exit code condition
 * @returns {number} Exit code (0 = success, 1 = validation failed)
 * 
 * Preconditions:
 * - result is a valid AnalysisResult object
 * - failOn is one of: 'missing', 'unused', 'undocumented', 'all', 'none'
 * 
 * Postconditions:
 * - Returns 0 if no issues match failOn criteria
 * - Returns 1 if issues match failOn criteria
 * - 'all' fails if any category has issues
 * - 'none' always returns 0
 * 
 * Requirements: 1.8.1-1.8.5
 */
export function determineExitCode(result, failOn) {
  if (failOn === 'none') {
    return 0;
  }
  
  if (failOn === 'all') {
    return (result.missing.length > 0 || result.unused.length > 0 || result.undocumented.length > 0) ? 1 : 0;
  }
  
  if (failOn === 'missing') {
    return result.missing.length > 0 ? 1 : 0;
  }
  
  if (failOn === 'unused') {
    return result.unused.length > 0 ? 1 : 0;
  }
  
  if (failOn === 'undocumented') {
    return result.undocumented.length > 0 ? 1 : 0;
  }
  
  return 0;
}

/**
 * Main CLI runner - orchestrates the entire workflow
 * 
 * @param {string[]} args - Command-line arguments (typically process.argv.slice(2))
 * @returns {Promise<number>} Exit code (0 = success, 1 = validation failed, 2 = error)
 * 
 * Preconditions:
 * - args is a valid array of strings
 * - Node.js runtime is available with required modules
 * 
 * Postconditions:
 * - Returns exit code 0, 1, or 2
 * - Output is written to stdout or stderr
 * - No unhandled exceptions escape
 * 
 * Requirements: 1.5.1-1.5.10, 1.8.1-1.8.5
 */
export async function run(args) {
  let spinner = null;
  
  try {
    // Step 1: Parse command-line arguments
    const options = parseArguments(args);
    
    // Handle special flags
    if (options.help) {
      displayHelp();
      return 0;
    }
    
    if (options.version) {
      displayVersion();
      return 0;
    }

    // Load config file if specified or found
    let fileConfig = null;
    if (options.config) {
      fileConfig = loadConfig(options.config);
    } else {
      fileConfig = loadConfig(options.path);
    }

    // Merge config file with CLI options
    const mergedOptions = mergeConfig(options, fileConfig);

    // Watch mode
    if (mergedOptions.watch) {
      const runValidation = async () => {
        await runOnce(mergedOptions);
      };
      await startWatchMode(mergedOptions.path, mergedOptions, runValidation);
      return 0;
    }

    // Run once
    return await runOnce(mergedOptions);
    
  } catch (error) {
    if (spinner) spinner.fail();
    // Handle errors gracefully with better messages
    console.error(`\n❌ Error: ${error.message}`);
    
    // Provide helpful hints for common errors
    if (error.code === 'ENOENT') {
      console.error(`\n💡 Tip: Check that the file or directory exists`);
    } else if (error.message.includes('Invalid')) {
      console.error(`\n💡 Tip: Run 'envcheck --help' to see valid options`);
    }
    
    return 2;
  }
}

/**
 * Run validation once (used by both normal and watch mode)
 */
async function runOnce(options) {
  let spinner = null;

  try {
    // Step 2: Load ignore patterns
    if (options.progress && !options.quiet) {
      spinner = new Spinner('Loading configuration...');
      spinner.start();
    }

    const { loadIgnorePatterns } = await import('./ignore.js');
    const ignorePatterns = loadIgnorePatterns(options.path);
    
    // Add CLI-provided ignore patterns
    ignorePatterns.push(...options.ignore);
    
    // Step 3: Scan codebase for files
    if (spinner) spinner.update('Scanning files...');
    
    const { scan: scanFiles } = await import('./scanner.js');
    const filePaths = await scanFiles(options.path, ignorePatterns);
    
    if (spinner) spinner.update(`Analyzing ${filePaths.length} files...`);
    
    // Step 4: Scan files for environment variable references
    const references = await scanFilesForEnvVars(filePaths);
    
    // Step 5: Parse .env.example file
    if (spinner) spinner.update('Parsing .env.example...');
    
    const { parseEnvFile } = await import('./parser.js');
    const definitions = await parseEnvFile(options.envFile);
    
    // Step 6: Analyze and categorize issues
    if (spinner) spinner.update('Analyzing issues...');
    
    const { analyzeIssues } = await import('./analyzer.js');
    const result = analyzeIssues(references, definitions);
    
    if (spinner) {
      const totalIssues = result.missing.length + result.unused.length + result.undocumented.length;
      if (totalIssues === 0) {
        spinner.succeed('Analysis complete - no issues found! ✨');
      } else {
        spinner.info(`Analysis complete - found ${totalIssues} issue(s)`);
      }
    }

    // Step 7: Generate suggestions
    if (options.suggestions && !options.quiet) {
      generateSuggestions(result);
      
      // Add typo detection for missing variables
      for (const missing of result.missing) {
        const definedVars = definitions.map(d => d.varName);
        const similar = findSimilarVariables(missing.varName, definedVars);
        
        if (similar.length > 0) {
          console.log(`\n💡 Did you mean '${similar[0].name}' instead of '${missing.varName}'? (${similar[0].similarity}% similar)`);
        }
      }
    }

    // Step 8: Auto-fix if requested
    if (options.fix && result.missing.length > 0) {
      const { generateEnvExampleFix } = await import('./suggestions.js');
      const { readFileSync, writeFileSync } = await import('fs');
      
      try {
        const existingContent = readFileSync(options.envFile, 'utf-8');
        const fixedContent = generateEnvExampleFix(result, existingContent);
        writeFileSync(options.envFile, fixedContent, 'utf-8');
        console.log(`\n✅ Auto-fixed ${result.missing.length} missing variable(s) in ${options.envFile}`);
      } catch (error) {
        console.error(`\n⚠️  Failed to auto-fix: ${error.message}`);
      }
    }
    
    // Step 9: Format and display output
    const output = await formatOutput(result, options);
    
    // Only output if not quiet mode or if there are issues
    if (!options.quiet || (result.missing.length > 0 || result.unused.length > 0 || result.undocumented.length > 0)) {
      console.log(output);
    }
    
    // Step 10: Determine exit code based on --fail-on flag
    const exitCode = determineExitCode(result, options.failOn);
    
    return exitCode;
    
  } catch (error) {
    if (spinner) spinner.fail('Analysis failed');
    throw error;
  }
}

/**
 * Scan multiple files for environment variable references
 * 
 * @param {string[]} filePaths - Array of file paths to scan
 * @returns {Promise<Array<{varName: string, filePath: string, lineNumber: number, pattern: string}>>}
 * 
 * Preconditions:
 * - filePaths is a valid array of file paths
 * - All files in filePaths exist and are readable
 * 
 * Postconditions:
 * - Returns array of all env var references found across all files
 * - Each reference has valid varName, filePath, lineNumber, pattern
 * 
 * Requirements: 1.1.1-1.1.8
 */
async function scanFilesForEnvVars(filePaths) {
  const { createReadStream } = await import('fs');
  const { createInterface } = await import('readline');
  const path = await import('path');
  
  const jsScanner = await import('./scanners/javascript.js');
  const pyScanner = await import('./scanners/python.js');
  const goScanner = await import('./scanners/go.js');
  const rbScanner = await import('./scanners/ruby.js');
  const rsScanner = await import('./scanners/rust.js');
  const shScanner = await import('./scanners/shell.js');

  const scannersByExtension = new Map([
    ['.js', jsScanner],
    ['.jsx', jsScanner],
    ['.ts', jsScanner],
    ['.tsx', jsScanner],
    ['.mjs', jsScanner],
    ['.cjs', jsScanner],
    ['.py', pyScanner],
    ['.go', goScanner],
    ['.rb', rbScanner],
    ['.rs', rsScanner],
    ['.sh', shScanner],
    ['.bash', shScanner],
    ['.zsh', shScanner],
  ]);

  const concurrency = Math.max(
    1,
    Math.min(32, Number(process.env.ENVCHECK_SCAN_CONCURRENCY) || 8)
  );
  const workerCount = Math.min(concurrency, filePaths.length);
  const referencesPerWorker = Array.from({ length: workerCount }, () => []);
  let currentIndex = 0;

  async function scanSingleFile(filePath, scanner) {
    const references = [];
    const stream = createReadStream(filePath, { encoding: 'utf-8' });
    const lineReader = createInterface({
      input: stream,
      crlfDelay: Infinity,
    });
    let lineNumber = 0;

    for await (const line of lineReader) {
      lineNumber += 1;
      references.push(...scanner.scanLine(line, filePath, lineNumber));
    }

    return references;
  }

  async function runWorker(workerIndex) {
    while (currentIndex < filePaths.length) {
      const index = currentIndex;
      currentIndex += 1;
      const filePath = filePaths[index];

      try {
        const ext = path.extname(filePath).toLowerCase();
        const scanner = scannersByExtension.get(ext);
        if (!scanner) {
          continue;
        }

        const references = await scanSingleFile(filePath, scanner);
        referencesPerWorker[workerIndex].push(...references);
      } catch (error) {
        console.warn(`Warning: Error scanning ${filePath}: ${error.message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: workerCount }, (_, workerIndex) => runWorker(workerIndex))
  );

  return referencesPerWorker.flat();
}

/**
 * Format analysis results based on output format option
 * 
 * @param {{missing: Array, unused: Array, undocumented: Array, summary: Object}} result - Analysis result
 * @param {CLIOptions} options - CLI options including format and display flags
 * @returns {Promise<string>} Formatted output string
 * 
 * Preconditions:
 * - result is a valid AnalysisResult object
 * - options.format is one of: 'text', 'json', 'github'
 * 
 * Postconditions:
 * - Returns formatted string ready for console output
 * - Format matches options.format
 * - Colors are omitted if options.noColor is true
 * 
 * Requirements: 1.6.1-1.6.6
 */
async function formatOutput(result, options) {
  if (options.format === 'json') {
    const { formatJSON } = await import('./formatters/json.js');
    return formatJSON(result);
  } else if (options.format === 'github') {
    const { formatGitHub } = await import('./formatters/github.js');
    return formatGitHub(result);
  } else {
    // Default to text format
    const { formatText } = await import('./formatters/text.js');
    return formatText(result, { noColor: options.noColor, quiet: options.quiet });
  }
}
