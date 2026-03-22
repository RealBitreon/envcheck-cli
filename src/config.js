/**
 * Configuration file management
 * Supports .envcheckrc, .envcheckrc.json, envcheck.config.js
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Load configuration from file
 */
export function loadConfig(cwd = '.') {
  const configFiles = [
    '.envcheckrc',
    '.envcheckrc.json',
    'envcheck.config.json',
    '.envcheckrc.js',
    'envcheck.config.js',
  ];

  for (const file of configFiles) {
    const configPath = join(cwd, file);
    
    if (existsSync(configPath)) {
      try {
        if (file.endsWith('.js')) {
          // Dynamic import for JS config files
          return loadJSConfig(configPath);
        } else {
          // JSON config
          const content = readFileSync(configPath, 'utf-8');
          return JSON.parse(content);
        }
      } catch (error) {
        console.warn(`Warning: Failed to load config from ${file}: ${error.message}`);
      }
    }
  }

  return null;
}

/**
 * Load JavaScript config file
 */
async function loadJSConfig(configPath) {
  try {
    const module = await import(configPath);
    return module.default || module;
  } catch (error) {
    throw new Error(`Failed to load JS config: ${error.message}`);
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(config, cwd = '.', filename = '.envcheckrc.json') {
  const configPath = join(cwd, filename);
  
  try {
    const content = JSON.stringify(config, null, 2);
    writeFileSync(configPath, content, 'utf-8');
    return configPath;
  } catch (error) {
    throw new Error(`Failed to save config: ${error.message}`);
  }
}

/**
 * Merge CLI options with config file
 */
export function mergeConfig(cliOptions, fileConfig) {
  if (!fileConfig) return cliOptions;

  return {
    ...fileConfig,
    ...cliOptions,
    // Merge arrays
    ignore: [...(fileConfig.ignore || []), ...(cliOptions.ignore || [])],
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config) {
  const errors = [];

  if (config.format && !['text', 'json', 'github'].includes(config.format)) {
    errors.push(`Invalid format: ${config.format}`);
  }

  if (config.failOn && !['missing', 'unused', 'undocumented', 'all', 'none'].includes(config.failOn)) {
    errors.push(`Invalid failOn: ${config.failOn}`);
  }

  if (config.ignore && !Array.isArray(config.ignore)) {
    errors.push('ignore must be an array');
  }

  return errors;
}

/**
 * Get default configuration
 */
export function getDefaultConfig() {
  return {
    path: '.',
    envFile: '.env.example',
    format: 'text',
    failOn: 'none',
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
    noColor: false,
    quiet: false,
  };
}
