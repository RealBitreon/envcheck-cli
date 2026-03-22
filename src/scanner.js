/**
 * File Scanner Module
 * 
 * Recursively scans directories to find source files and detect environment variable references.
 * Handles symlinks, permission errors, and integrates with ignore patterns.
 * 
 * Requirements: 1.4.1-1.4.5
 */

import fs from 'fs';
import path from 'path';
import { shouldIgnore } from './ignore.js';
import { normalizePath } from './utils.js';

/**
 * Get supported file extensions for scanning
 * 
 * @returns {string[]} Array of file extensions to scan
 * 
 * Requirements: 1.4.2
 */
export function getSupportedExtensions() {
  return [
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',  // JavaScript/TypeScript
    '.py',                                          // Python
    '.go',                                          // Go
    '.rb',                                          // Ruby
    '.rs',                                          // Rust
    '.sh', '.bash', '.zsh'                          // Shell/Bash
  ];
}

/**
 * Check if a file has a supported extension
 * 
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if file extension is supported
 * 
 * Requirements: 1.4.2
 */
export function hasSupportedExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return getSupportedExtensions().includes(ext);
}

/**
 * Scan a directory recursively for source files
 * 
 * @param {string} dirPath - Directory path to scan
 * @param {string[]} ignorePatterns - Array of ignore patterns
 * @param {Set<string>} visitedPaths - Set of visited paths (for symlink cycle detection)
 * @returns {Promise<string[]>} Array of file paths to scan
 * 
 * Preconditions:
 * - dirPath is a valid directory path
 * - ignorePatterns is a valid array (may be empty)
 * 
 * Postconditions:
 * - Returns array of all source files found
 * - Excludes files matching ignore patterns
 * - Handles symlink cycles without infinite loops
 * - Continues on permission errors
 * 
 * Requirements: 1.4.1, 1.4.3, 1.4.4, 1.4.5
 */
export async function scanDirectory(dirPath, ignorePatterns = [], visitedPaths = new Set()) {
  const files = [];
  const normalizedDirPath = normalizePath(path.resolve(dirPath));
  
  // Check if we've already visited this path (symlink cycle detection)
  if (visitedPaths.has(normalizedDirPath)) {
    return files;
  }
  
  visitedPaths.add(normalizedDirPath);
  
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = normalizePath(path.relative(process.cwd(), fullPath));
      
      // Check if path should be ignored (check both full path and just the name)
      if (shouldIgnore(relativePath, ignorePatterns) || 
          shouldIgnore(entry.name, ignorePatterns) ||
          shouldIgnore(relativePath + '/', ignorePatterns)) {
        continue;
      }
      
      try {
        let stats;
        
        if (entry.isSymbolicLink()) {
          // For symlinks, get stats of the target
          try {
            stats = await fs.promises.stat(fullPath);
          } catch (error) {
            // Broken symlink or permission denied - skip it
            console.warn(`Warning: Cannot access symlink target: ${relativePath}`);
            continue;
          }
        } else {
          stats = entry;
        }
        
        if (stats.isDirectory()) {
          // Recursively scan subdirectory
          const subFiles = await scanDirectory(fullPath, ignorePatterns, visitedPaths);
          files.push(...subFiles);
        } else if (stats.isFile() && hasSupportedExtension(fullPath)) {
          // Add file to list if it has a supported extension
          files.push(fullPath);
        }
      } catch (error) {
        // Permission denied or other error - log warning and continue
        if (error.code === 'EACCES' || error.code === 'EPERM') {
          console.warn(`Warning: Permission denied: ${relativePath}`);
        } else {
          console.warn(`Warning: Error accessing ${relativePath}: ${error.message}`);
        }
        continue;
      }
    }
  } catch (error) {
    // Directory read error - log warning and return what we have
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      console.warn(`Warning: Permission denied: ${normalizedDirPath}`);
    } else if (error.code === 'ENOENT') {
      console.warn(`Warning: Directory not found: ${normalizedDirPath}`);
    } else {
      console.warn(`Warning: Error reading directory ${normalizedDirPath}: ${error.message}`);
    }
  }
  
  return files;
}

/**
 * Scan a single file or directory
 * 
 * @param {string} targetPath - File or directory path to scan
 * @param {string[]} ignorePatterns - Array of ignore patterns
 * @returns {Promise<string[]>} Array of file paths to scan
 * 
 * Preconditions:
 * - targetPath exists and is readable
 * 
 * Postconditions:
 * - Returns array with single file if targetPath is a file
 * - Returns array of all source files if targetPath is a directory
 * 
 * Requirements: 1.4.1, 1.5.1
 */
export async function scan(targetPath, ignorePatterns = []) {
  try {
    const stats = await fs.promises.stat(targetPath);
    
    if (stats.isFile()) {
      // Single file - return it if it has a supported extension
      if (hasSupportedExtension(targetPath)) {
        return [targetPath];
      } else {
        return [];
      }
    } else if (stats.isDirectory()) {
      // Directory - scan recursively
      return await scanDirectory(targetPath, ignorePatterns);
    } else {
      console.warn(`Warning: ${targetPath} is neither a file nor a directory`);
      return [];
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Path not found: ${targetPath}`);
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      throw new Error(`Permission denied: ${targetPath}`);
    } else {
      throw new Error(`Error accessing ${targetPath}: ${error.message}`);
    }
  }
}
