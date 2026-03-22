/**
 * Autocomplete functionality for REPL
 * Provides intelligent tab completion for commands, options, and file paths
 */

import { readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';

/**
 * Get autocomplete suggestions for the current input
 */
export function getCompletions(line) {
  const trimmed = line.trim();
  
  // Command completion
  if (trimmed.startsWith(':') || trimmed.startsWith('.')) {
    return getCommandCompletions(trimmed.slice(1));
  }
  
  // Flag completion
  if (trimmed.includes('--')) {
    return getFlagCompletions(trimmed);
  }
  
  // Path completion
  return getPathCompletions(trimmed);
}

/**
 * Get command completions
 */
function getCommandCompletions(partial) {
  const commands = [
    'help',
    'exit',
    'quit',
    'history',
    'clear',
    'config',
    'set',
    'get',
    'results',
    'last',
    'watch',
    'save',
    'load',
  ];
  
  return commands
    .filter(cmd => cmd.startsWith(partial))
    .map(cmd => `:${cmd}`);
}

/**
 * Get flag completions
 */
function getFlagCompletions(line) {
  const flags = [
    '--env-file',
    '--format',
    '--fail-on',
    '--ignore',
    '--no-color',
    '--quiet',
    '--help',
    '--version',
    '--watch',
    '--config',
  ];
  
  const lastWord = line.split(/\s+/).pop();
  
  if (!lastWord.startsWith('--')) {
    return [];
  }
  
  return flags.filter(flag => flag.startsWith(lastWord));
}

/**
 * Get path completions
 */
function getPathCompletions(line) {
  try {
    const words = line.split(/\s+/);
    const lastWord = words[words.length - 1] || '.';
    
    let dir = '.';
    let prefix = '';
    
    if (lastWord.includes('/') || lastWord.includes('\\')) {
      dir = dirname(lastWord);
      prefix = basename(lastWord);
    } else {
      prefix = lastWord;
    }
    
    const entries = readdirSync(dir);
    
    return entries
      .filter(entry => entry.startsWith(prefix))
      .map(entry => {
        const fullPath = join(dir, entry);
        try {
          const isDir = statSync(fullPath).isDirectory();
          return isDir ? `${entry}/` : entry;
        } catch {
          return entry;
        }
      })
      .slice(0, 20); // Limit to 20 suggestions
  } catch {
    return [];
  }
}

/**
 * Setup readline autocomplete
 */
export function setupAutocomplete(rl) {
  rl.on('line', (line) => {
    // Store in history
    if (line.trim()) {
      rl.history.unshift(line);
    }
  });
  
  // Custom completer function
  const completer = (line) => {
    const completions = getCompletions(line);
    return [completions, line];
  };
  
  return completer;
}
