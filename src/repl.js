import { createInterface } from 'readline';
import { stdin as input, stdout as output } from 'process';
import { dirname } from 'path';
import { parseArguments, run } from './cli.js';
import { setupAutocomplete } from './autocomplete.js';
import { saveConfig, loadConfig } from './config.js';

/**
 * REPL (Read-Eval-Print Loop) for interactive envcheck sessions
 * Provides an interactive shell for running envcheck commands
 */

/**
 * Session state management
 */
export class Session {
  constructor() {
    this.history = [];
    this.results = [];
    this.config = {
      path: '.',
      envFile: '.env.example',
      format: 'text',
      failOn: 'none',
      ignore: [],
      noColor: false,
      quiet: false,
    };
    this.startTime = Date.now();
  }

  addCommand(command) {
    this.history.push({
      command,
      timestamp: Date.now(),
    });
  }

  addResult(result) {
    this.results.push({
      result,
      timestamp: Date.now(),
    });
  }

  getConfig() {
    return { ...this.config };
  }

  setConfig(key, value) {
    if (key in this.config) {
      this.config[key] = value;
      return true;
    }
    return false;
  }

  getHistory() {
    return [...this.history];
  }

  getResults() {
    return [...this.results];
  }

  getDuration() {
    return Date.now() - this.startTime;
  }

  clear() {
    this.history = [];
    this.results = [];
  }
}

/**
 * Command parser for REPL special commands
 */
export class CommandParser {
  constructor(session) {
    this.session = session;
    this.commands = new Map([
      ['help', this.helpCommand.bind(this)],
      ['exit', this.exitCommand.bind(this)],
      ['quit', this.exitCommand.bind(this)],
      ['history', this.historyCommand.bind(this)],
      ['clear', this.clearCommand.bind(this)],
      ['config', this.configCommand.bind(this)],
      ['set', this.setCommand.bind(this)],
      ['get', this.getCommand.bind(this)],
      ['results', this.resultsCommand.bind(this)],
      ['last', this.lastCommand.bind(this)],
      ['watch', this.watchCommand.bind(this)],
      ['save', this.saveCommand.bind(this)],
      ['load', this.loadCommand.bind(this)],
      ['fix', this.fixCommand.bind(this)],
      ['suggest', this.suggestCommand.bind(this)],
    ]);
  }

  isCommand(input) {
    const trimmed = input.trim();
    return trimmed.startsWith(':') || trimmed.startsWith('.');
  }

  async execute(input) {
    const trimmed = input.trim();
    const prefix = trimmed[0];
    const commandLine = trimmed.slice(1).trim();
    const [command, ...args] = commandLine.split(/\s+/);

    if (!this.commands.has(command)) {
      return `Unknown command: ${command}. Type :help for available commands.`;
    }

    return await this.commands.get(command)(args);
  }

  helpCommand() {
    return `
Available REPL Commands:
  :help, .help              Show this help message
  :exit, :quit              Exit the REPL
  :history                  Show command history
  :clear                    Clear history and results
  :config                   Show current configuration
  :set <key> <value>        Set a configuration value
  :get <key>                Get a configuration value
  :results                  Show all previous results
  :last                     Show the last result
  :watch                    Start watch mode
  :save [file]              Save current config to file
  :load [file]              Load config from file
  :fix                      Auto-fix issues in .env.example
  :suggest                  Show intelligent suggestions

Configuration Keys:
  path, envFile, format, failOn, noColor, quiet, suggestions, progress

Examples:
  :set path ./src
  :set format json
  :get envFile
  :save .envcheckrc.json
  envcheck . --format json
  . --fail-on missing
  :fix
`;
  }

  exitCommand() {
    return { exit: true };
  }

  historyCommand() {
    const history = this.session.getHistory();
    if (history.length === 0) {
      return 'No command history.';
    }

    return history
      .map((entry, index) => {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        return `${index + 1}. [${time}] ${entry.command}`;
      })
      .join('\n');
  }

  clearCommand() {
    this.session.clear();
    return 'History and results cleared.';
  }

  configCommand() {
    const config = this.session.getConfig();
    return Object.entries(config)
      .map(([key, value]) => {
        const displayValue = Array.isArray(value) ? `[${value.join(', ')}]` : value;
        return `${key}: ${displayValue}`;
      })
      .join('\n');
  }

  setCommand(args) {
    if (args.length < 2) {
      return 'Usage: :set <key> <value>';
    }

    const [key, ...valueParts] = args;
    const value = valueParts.join(' ');

    // Handle special types
    let parsedValue = value;
    if (value === 'true') parsedValue = true;
    else if (value === 'false') parsedValue = false;
    else if (!isNaN(value) && value !== '') parsedValue = Number(value);

    if (this.session.setConfig(key, parsedValue)) {
      return `Set ${key} = ${parsedValue}`;
    } else {
      return `Unknown configuration key: ${key}`;
    }
  }

  getCommand(args) {
    if (args.length === 0) {
      return 'Usage: :get <key>';
    }

    const key = args[0];
    const config = this.session.getConfig();

    if (key in config) {
      const value = config[key];
      const displayValue = Array.isArray(value) ? `[${value.join(', ')}]` : value;
      return `${key}: ${displayValue}`;
    } else {
      return `Unknown configuration key: ${key}`;
    }
  }

  resultsCommand() {
    const results = this.session.getResults();
    if (results.length === 0) {
      return 'No results yet.';
    }

    return results
      .map((entry, index) => {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        const summary = entry.result.summary || {};
        return `${index + 1}. [${time}] Missing: ${summary.missingCount || 0}, Unused: ${summary.unusedCount || 0}, Undocumented: ${summary.undocumentedCount || 0}`;
      })
      .join('\n');
  }

  lastCommand() {
    const results = this.session.getResults();
    if (results.length === 0) {
      return 'No results yet.';
    }

    const last = results[results.length - 1];
    return JSON.stringify(last.result, null, 2);
  }

  async watchCommand(args) {
    return 'Watch mode not available in REPL. Use: envcheck . --watch';
  }

  async saveCommand(args) {
    const filename = args[0] || '.envcheckrc.json';
    
    try {
      const config = this.session.getConfig();
      const path = saveConfig(config, '.', filename);
      return `Configuration saved to ${path}`;
    } catch (error) {
      return `Failed to save config: ${error.message}`;
    }
  }

  async loadCommand(args) {
    const filename = args[0];
    
    try {
      const config = loadConfig(filename ? dirname(filename) : '.');
      
      if (!config) {
        return 'No configuration file found';
      }

      // Update session config
      for (const [key, value] of Object.entries(config)) {
        this.session.setConfig(key, value);
      }

      return 'Configuration loaded successfully';
    } catch (error) {
      return `Failed to load config: ${error.message}`;
    }
  }

  async fixCommand(args) {
    return 'Auto-fix: Run envcheck with --fix flag to update .env.example';
  }

  async suggestCommand(args) {
    const results = this.session.getResults();
    if (results.length === 0) {
      return 'No results to analyze. Run a check first.';
    }

    const last = results[results.length - 1];
    const { generateSuggestions } = await import('./suggestions.js');
    const suggestions = generateSuggestions(last.result);

    if (suggestions.length === 0) {
      return 'No suggestions - everything looks good! ✨';
    }

    return suggestions
      .map(s => {
        const items = s.items.map(i => `  • ${i.suggestion}`).join('\n');
        return `${s.message}\n${s.action}\n${items}`;
      })
      .join('\n\n');
  }
}

/**
 * Start the REPL
 */
export async function startREPL() {
  const session = new Session();
  const commandParser = new CommandParser(session);
  
  const rl = createInterface({
    input,
    output,
    prompt: 'envcheck> ',
    historySize: 100,
    completer: (line) => {
      const { getCompletions } = require('./autocomplete.js');
      const completions = getCompletions(line);
      return [completions, line];
    },
  });

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  envcheck REPL - Interactive Environment Variable Checker ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n💡 Type :help for available commands, :exit to quit\n');

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    session.addCommand(input);

    try {
      // Check if it's a special command
      if (commandParser.isCommand(input)) {
        const result = await commandParser.execute(input);
        
        if (result && typeof result === 'object' && result.exit) {
          console.log('Goodbye!');
          rl.close();
          return;
        }

        if (result) {
          console.log(result);
        }
      } else {
        // Parse as envcheck command
        let args;
        
        // Handle shorthand: if line starts with '.', treat as 'envcheck .'
        if (input.startsWith('.')) {
          args = input.split(/\s+/);
        } else if (input.startsWith('envcheck')) {
          // Remove 'envcheck' prefix
          args = input.slice('envcheck'.length).trim().split(/\s+/).filter(Boolean);
        } else {
          // Treat as arguments to envcheck
          args = input.split(/\s+/);
        }

        // Merge with session config
        const config = session.getConfig();
        const fullArgs = [
          config.path,
          '--env-file', config.envFile,
          '--format', config.format,
          '--fail-on', config.failOn,
          ...config.ignore.flatMap(pattern => ['--ignore', pattern]),
          ...(config.noColor ? ['--no-color'] : []),
          ...(config.quiet ? ['--quiet'] : []),
          ...args,
        ];

        // Run the command
        const exitCode = await run(fullArgs);
        
        // Store result (we'd need to modify run() to return the actual result)
        session.addResult({ exitCode });

        if (exitCode === 0) {
          console.log('\n✓ Check completed successfully');
        } else if (exitCode === 1) {
          console.log('\n✗ Validation failed');
        } else {
          console.log('\n✗ Error occurred');
        }
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    const duration = Math.round(session.getDuration() / 1000);
    console.log(`\nSession duration: ${duration}s`);
    console.log(`Commands executed: ${session.getHistory().length}`);
    process.exit(0);
  });
}
