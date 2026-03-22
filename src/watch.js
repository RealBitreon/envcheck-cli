/**
 * Watch mode for continuous validation
 * Monitors file changes and re-runs validation automatically
 */

import { watch } from 'fs';
import { join } from 'path';

/**
 * Watch mode manager
 */
export class Watcher {
  constructor(path, options, onChange) {
    this.path = path;
    this.options = options;
    this.onChangeCallback = onChange;
    this.watchers = [];
    this.debounceTimer = null;
    this.debounceDelay = 300;
    this.isRunning = false;
  }

  start() {
    console.log(`\n👀 Watching for changes in ${this.path}...`);
    console.log('Press Ctrl+C to stop\n');

    try {
      const watcher = watch(
        this.path,
        { recursive: true },
        (eventType, filename) => {
          if (filename && this.shouldProcess(filename)) {
            this.handleChange(eventType, filename);
          }
        }
      );

      this.watchers.push(watcher);
      this.isRunning = true;

      // Initial run
      this.triggerChange('initial', 'startup');

    } catch (error) {
      console.error(`Failed to start watch mode: ${error.message}`);
      throw error;
    }
  }

  shouldProcess(filename) {
    // Ignore common non-source files
    const ignorePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /\.log$/,
      /\.tmp$/,
      /~$/,
    ];

    return !ignorePatterns.some(pattern => pattern.test(filename));
  }

  handleChange(eventType, filename) {
    // Debounce rapid changes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.triggerChange(eventType, filename);
    }, this.debounceDelay);
  }

  async triggerChange(eventType, filename) {
    if (this.onChangeCallback) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`\n[${timestamp}] Change detected: ${filename}`);
      console.log('─'.repeat(50));

      try {
        await this.onChangeCallback();
      } catch (error) {
        console.error(`Error during validation: ${error.message}`);
      }

      console.log('─'.repeat(50));
      console.log('Waiting for changes...\n');
    }
  }

  stop() {
    this.isRunning = false;
    
    for (const watcher of this.watchers) {
      watcher.close();
    }
    
    this.watchers = [];
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    console.log('\n👋 Watch mode stopped');
  }
}

/**
 * Start watch mode
 */
export async function startWatchMode(path, options, runValidation) {
  const watcher = new Watcher(path, options, runValidation);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    watcher.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    watcher.stop();
    process.exit(0);
  });

  watcher.start();

  // Keep process alive
  return new Promise(() => {});
}
