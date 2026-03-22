#!/usr/bin/env node

/**
 * envcheck CLI entry point
 * 
 * Orchestrates the entire workflow:
 * 1. Parse command-line arguments
 * 2. Load ignore patterns
 * 3. Scan codebase for files
 * 4. Scan files for environment variable references
 * 5. Parse .env.example file
 * 6. Analyze and categorize issues
 * 7. Format and display output
 * 8. Exit with appropriate code
 * 
 * REPL Mode:
 * - Run without arguments or with --repl/-r flag to start interactive mode
 */

import { run } from '../src/cli.js';
import { startREPL } from '../src/repl.js';

process.on('unhandledRejection', (reason) => {
  const message = reason && reason.message ? reason.message : String(reason);
  console.error(`Unhandled rejection: ${message}`);
  process.exit(2);
});

process.on('uncaughtException', (error) => {
  console.error(`Unhandled exception: ${error.message}`);
  process.exit(2);
});

const args = process.argv.slice(2);

// Check for REPL mode
if (args.length === 0 || args.includes('--repl') || args.includes('-r')) {
  // Remove --repl flag if present
  const replArgs = args.filter(arg => arg !== '--repl' && arg !== '-r');
  
  // If no other args, start REPL
  if (replArgs.length === 0) {
    startREPL().catch(error => {
      console.error(`REPL error: ${error.message}`);
      process.exit(2);
    });
  } else {
    // Run command normally
    run(replArgs)
      .then(exitCode => {
        process.exit(exitCode);
      })
      .catch(error => {
        console.error(`Fatal error: ${error.message}`);
        process.exit(2);
      });
  }
} else {
  // Normal CLI mode
  run(args)
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error(`Fatal error: ${error.message}`);
      process.exit(2);
    });
}
