/**
 * Issue Analyzer Module
 * 
 * Compares environment variable references from code against definitions
 * in .env.example and categorizes issues into three types:
 * - MISSING: Used in code but absent from .env.example
 * - UNUSED: Defined in .env.example but never referenced
 * - UNDOCUMENTED: Used and defined but lacking inline comments
 */

/**
 * Analyzes environment variable usage and categorizes issues
 * 
 * @param {Array<{varName: string, filePath: string, lineNumber: number, pattern: string}>} references - Env var references from code
 * @param {Array<{varName: string, hasComment: boolean, comment: string|null, lineNumber: number}>} definitions - Env var definitions from .env.example
 * @returns {{missing: Array, unused: Array, undocumented: Array, summary: Object}} Analysis result
 */
export function analyzeIssues(references, definitions) {
  // Group references by variable name for efficient lookup
  const refsByVar = groupReferencesByVariable(references);
  
  // Create definition lookup map
  const defByVar = createDefinitionMap(definitions);
  
  // Get unique variable names from both sources
  const referencedVars = new Set(references.map(ref => ref.varName));
  const definedVars = new Set(definitions.map(def => def.varName));
  
  // Detect MISSING variables (used in code but not in .env.example)
  const missing = findMissing(referencedVars, definedVars, refsByVar);
  
  // Detect UNUSED variables (in .env.example but never used)
  const unused = findUnused(definedVars, referencedVars, defByVar);
  
  // Detect UNDOCUMENTED variables (used and defined but no comment)
  const undocumented = findUndocumented(referencedVars, definedVars, refsByVar, defByVar);
  
  // Calculate summary statistics
  const summary = calculateSummary(missing, unused, undocumented, referencedVars, definedVars);
  
  return {
    missing,
    unused,
    undocumented,
    summary
  };
}

/**
 * Groups environment variable references by variable name
 * 
 * @param {Array<{varName: string, filePath: string, lineNumber: number, pattern: string}>} references
 * @returns {Map<string, Array>} Map of variable name to array of references
 */
export function groupReferencesByVariable(references) {
  const refsByVar = new Map();
  
  for (const ref of references) {
    if (!refsByVar.has(ref.varName)) {
      refsByVar.set(ref.varName, []);
    }
    refsByVar.get(ref.varName).push(ref);
  }
  
  return refsByVar;
}

/**
 * Creates a lookup map of definitions by variable name
 * 
 * @param {Array<{varName: string, hasComment: boolean, comment: string|null, lineNumber: number}>} definitions
 * @returns {Map<string, Object>} Map of variable name to definition object
 */
export function createDefinitionMap(definitions) {
  const defByVar = new Map();
  
  for (const def of definitions) {
    defByVar.set(def.varName, def);
  }
  
  return defByVar;
}

/**
 * Finds MISSING variables (used in code but not in .env.example)
 * 
 * @param {Set<string>} referencedVars - Set of variable names used in code
 * @param {Set<string>} definedVars - Set of variable names defined in .env.example
 * @param {Map<string, Array>} refsByVar - Map of variable name to references
 * @returns {Array<{varName: string, references: Array}>} Array of missing variable issues
 */
export function findMissing(referencedVars, definedVars, refsByVar) {
  const missing = [];
  
  for (const varName of referencedVars) {
    if (!definedVars.has(varName)) {
      missing.push({
        varName,
        references: refsByVar.get(varName)
      });
    }
  }
  
  // Sort by variable name for consistent output
  return missing.sort((a, b) => a.varName.localeCompare(b.varName));
}

/**
 * Finds UNUSED variables (defined in .env.example but never used)
 * 
 * @param {Set<string>} definedVars - Set of variable names defined in .env.example
 * @param {Set<string>} referencedVars - Set of variable names used in code
 * @param {Map<string, Object>} defByVar - Map of variable name to definition
 * @returns {Array<{varName: string, definition: Object}>} Array of unused variable issues
 */
export function findUnused(definedVars, referencedVars, defByVar) {
  const unused = [];
  
  for (const varName of definedVars) {
    if (!referencedVars.has(varName)) {
      unused.push({
        varName,
        definition: defByVar.get(varName)
      });
    }
  }
  
  // Sort by variable name for consistent output
  return unused.sort((a, b) => a.varName.localeCompare(b.varName));
}

/**
 * Finds UNDOCUMENTED variables (used and defined but no inline comment)
 * 
 * @param {Set<string>} referencedVars - Set of variable names used in code
 * @param {Set<string>} definedVars - Set of variable names defined in .env.example
 * @param {Map<string, Array>} refsByVar - Map of variable name to references
 * @param {Map<string, Object>} defByVar - Map of variable name to definition
 * @returns {Array<{varName: string, references: Array, definition: Object}>} Array of undocumented variable issues
 */
export function findUndocumented(referencedVars, definedVars, refsByVar, defByVar) {
  const undocumented = [];
  
  for (const varName of referencedVars) {
    if (definedVars.has(varName)) {
      const def = defByVar.get(varName);
      if (!def.hasComment) {
        undocumented.push({
          varName,
          references: refsByVar.get(varName),
          definition: def
        });
      }
    }
  }
  
  // Sort by variable name for consistent output
  return undocumented.sort((a, b) => a.varName.localeCompare(b.varName));
}

/**
 * Calculates summary statistics for the analysis
 * 
 * @param {Array} missing - Array of missing variable issues
 * @param {Array} unused - Array of unused variable issues
 * @param {Array} undocumented - Array of undocumented variable issues
 * @param {Set<string>} referencedVars - Set of variable names used in code
 * @param {Set<string>} definedVars - Set of variable names defined in .env.example
 * @returns {{totalMissing: number, totalUnused: number, totalUndocumented: number, totalReferences: number, totalDefinitions: number}}
 */
export function calculateSummary(missing, unused, undocumented, referencedVars, definedVars) {
  return {
    totalMissing: missing.length,
    totalUnused: unused.length,
    totalUndocumented: undocumented.length,
    totalReferences: referencedVars.size,
    totalDefinitions: definedVars.size
  };
}
