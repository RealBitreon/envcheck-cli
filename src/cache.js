/**
 * Caching layer for improved performance
 * Caches file scan results and analysis to speed up repeated runs
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Cache manager
 */
export class Cache {
  constructor(namespace = 'envcheck') {
    this.namespace = namespace;
    this.cacheDir = join(tmpdir(), namespace);
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getCacheKey(data) {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  getCachePath(key) {
    return join(this.cacheDir, `${key}.json`);
  }

  get(key, maxAge = 3600000) {
    try {
      const cacheKey = this.getCacheKey(key);
      const cachePath = this.getCachePath(cacheKey);

      if (!existsSync(cachePath)) {
        return null;
      }

      const stats = statSync(cachePath);
      const age = Date.now() - stats.mtimeMs;

      if (age > maxAge) {
        return null;
      }

      const content = readFileSync(cachePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  set(key, value) {
    try {
      const cacheKey = this.getCacheKey(key);
      const cachePath = this.getCachePath(cacheKey);
      const content = JSON.stringify(value);
      writeFileSync(cachePath, content, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  clear() {
    try {
      const { readdirSync, unlinkSync } = require('fs');
      const files = readdirSync(this.cacheDir);
      
      for (const file of files) {
        unlinkSync(join(this.cacheDir, file));
      }
      
      return true;
    } catch {
      return false;
    }
  }

  has(key) {
    const cacheKey = this.getCacheKey(key);
    const cachePath = this.getCachePath(cacheKey);
    return existsSync(cachePath);
  }
}

/**
 * Create a cached version of a function
 */
export function cached(fn, options = {}) {
  const cache = new Cache(options.namespace);
  const maxAge = options.maxAge || 3600000;

  return async function (...args) {
    const cacheKey = { fn: fn.name, args };
    
    const cached = cache.get(cacheKey, maxAge);
    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(cacheKey, result);
    
    return result;
  };
}
