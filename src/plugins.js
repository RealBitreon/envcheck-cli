/**
 * Plugin system for extensibility
 * Allows users to add custom scanners, formatters, and validators
 */

import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Plugin manager
 */
export class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
  }

  /**
   * Register a plugin
   */
  register(name, plugin) {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} is already registered`);
    }

    this.plugins.set(name, plugin);

    // Initialize plugin
    if (plugin.init) {
      plugin.init(this);
    }

    return this;
  }

  /**
   * Get a plugin by name
   */
  get(name) {
    return this.plugins.get(name);
  }

  /**
   * Check if a plugin is registered
   */
  has(name) {
    return this.plugins.has(name);
  }

  /**
   * Register a hook
   */
  hook(event, callback) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }

    this.hooks.get(event).push(callback);
    return this;
  }

  /**
   * Trigger a hook
   */
  async trigger(event, data) {
    const callbacks = this.hooks.get(event) || [];
    
    for (const callback of callbacks) {
      try {
        await callback(data);
      } catch (error) {
        console.warn(`Hook ${event} failed: ${error.message}`);
      }
    }
  }

  /**
   * Load plugins from directory
   */
  async loadFromDirectory(dir) {
    if (!existsSync(dir)) {
      return;
    }

    try {
      const { readdirSync } = await import('fs');
      const files = readdirSync(dir);

      for (const file of files) {
        if (file.endsWith('.js')) {
          const pluginPath = join(dir, file);
          const plugin = await import(pluginPath);
          const name = file.replace('.js', '');
          
          this.register(name, plugin.default || plugin);
        }
      }
    } catch (error) {
      console.warn(`Failed to load plugins from ${dir}: ${error.message}`);
    }
  }
}

/**
 * Example plugin structure
 */
export const examplePlugin = {
  name: 'example',
  version: '1.0.0',
  
  init(manager) {
    // Register hooks
    manager.hook('beforeScan', async (data) => {
      console.log('Before scan hook');
    });

    manager.hook('afterAnalysis', async (data) => {
      console.log('After analysis hook');
    });
  },

  // Custom scanner
  scanner: {
    extensions: ['.custom'],
    scanLine(line, filePath, lineNumber) {
      // Custom scanning logic
      return [];
    },
  },

  // Custom formatter
  formatter: {
    format(result, options) {
      // Custom formatting logic
      return '';
    },
  },
};
