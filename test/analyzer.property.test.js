import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { analyzeIssues } from '../src/analyzer.js';

/**
 * Property-Based Tests for Analyzer Module
 * 
 * These tests verify correctness properties that should hold for ALL possible inputs,
 * not just specific test cases. Uses fast-check to generate random test data.
 * 
 * Test Coverage:
 * - Property 1: Mutual Exclusivity - No variable appears in multiple categories
 * - Property 2: Summary Accuracy - Summary counts match actual data
 * - Property 3: Idempotency - Same input always produces same output
 * - Property 4: Variable Name Validity - All output variables have valid names
 * - Property 5: Reference Grouping - All references are properly grouped
 * - Property 6: Empty Input Handling - Graceful handling of edge cases
 * 
 * Each property is tested with 50-100 randomly generated test cases.
 */

// Arbitrary generators for test data
const varNameArbitrary = fc.stringMatching(/^[A-Z_][A-Z0-9_]{0,30}$/);

const referenceArbitrary = fc.record({
  varName: varNameArbitrary,
  filePath: fc.stringMatching(/^[a-z]+\/[a-z]+\.js$/),
  lineNumber: fc.integer({ min: 1, max: 1000 }),
  pattern: fc.string()
});

const definitionArbitrary = fc.record({
  varName: varNameArbitrary,
  hasComment: fc.boolean(),
  comment: fc.option(fc.string(), { nil: null }),
  lineNumber: fc.integer({ min: 1, max: 1000 })
}).map(def => ({
  ...def,
  // Ensure consistency: if hasComment is false, comment must be null
  comment: def.hasComment ? (def.comment || 'Default comment') : null
}));

describe('Analyzer Property-Based Tests', () => {
  describe('Property 1: Mutual Exclusivity', () => {
    it('should ensure no variable appears in multiple categories', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.array(definitionArbitrary, { minLength: 0, maxLength: 50 }),
          (references, definitions) => {
            const result = analyzeIssues(references, definitions);

            // Collect all variable names from each category
            const missingVars = new Set(result.missing.map(m => m.varName));
            const unusedVars = new Set(result.unused.map(u => u.varName));
            const undocumentedVars = new Set(result.undocumented.map(u => u.varName));

            // Check no overlap between missing and unused
            for (const varName of missingVars) {
              assert.ok(
                !unusedVars.has(varName),
                `Variable ${varName} appears in both missing and unused categories`
              );
            }

            // Check no overlap between missing and undocumented
            for (const varName of missingVars) {
              assert.ok(
                !undocumentedVars.has(varName),
                `Variable ${varName} appears in both missing and undocumented categories`
              );
            }

            // Check no overlap between unused and undocumented
            for (const varName of unusedVars) {
              assert.ok(
                !undocumentedVars.has(varName),
                `Variable ${varName} appears in both unused and undocumented categories`
              );
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should categorize each variable correctly based on usage and definition', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.array(definitionArbitrary, { minLength: 0, maxLength: 50 }),
          (references, definitions) => {
            const result = analyzeIssues(references, definitions);

            const referencedVars = new Set(references.map(r => r.varName));
            const definedVars = new Set(definitions.map(d => d.varName));
            const defMap = new Map(definitions.map(d => [d.varName, d]));

            // Verify MISSING: used in code but not defined
            for (const missing of result.missing) {
              assert.ok(
                referencedVars.has(missing.varName),
                `Missing variable ${missing.varName} should be referenced`
              );
              assert.ok(
                !definedVars.has(missing.varName),
                `Missing variable ${missing.varName} should not be defined`
              );
            }

            // Verify UNUSED: defined but not used
            for (const unused of result.unused) {
              assert.ok(
                definedVars.has(unused.varName),
                `Unused variable ${unused.varName} should be defined`
              );
              assert.ok(
                !referencedVars.has(unused.varName),
                `Unused variable ${unused.varName} should not be referenced`
              );
            }

            // Verify UNDOCUMENTED: used and defined but no comment
            for (const undoc of result.undocumented) {
              assert.ok(
                referencedVars.has(undoc.varName),
                `Undocumented variable ${undoc.varName} should be referenced`
              );
              assert.ok(
                definedVars.has(undoc.varName),
                `Undocumented variable ${undoc.varName} should be defined`
              );
              const def = defMap.get(undoc.varName);
              assert.ok(
                def && !def.hasComment,
                `Undocumented variable ${undoc.varName} should have no comment`
              );
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Summary Accuracy', () => {
    it('should have summary counts matching array lengths', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.array(definitionArbitrary, { minLength: 0, maxLength: 50 }),
          (references, definitions) => {
            const result = analyzeIssues(references, definitions);

            // Summary counts should match array lengths
            assert.equal(
              result.summary.totalMissing,
              result.missing.length,
              'totalMissing should match missing array length'
            );
            assert.equal(
              result.summary.totalUnused,
              result.unused.length,
              'totalUnused should match unused array length'
            );
            assert.equal(
              result.summary.totalUndocumented,
              result.undocumented.length,
              'totalUndocumented should match undocumented array length'
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have totalReferences equal to unique referenced variables', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.array(definitionArbitrary, { minLength: 0, maxLength: 50 }),
          (references, definitions) => {
            const result = analyzeIssues(references, definitions);

            const uniqueReferencedVars = new Set(references.map(r => r.varName));

            assert.equal(
              result.summary.totalReferences,
              uniqueReferencedVars.size,
              'totalReferences should equal unique referenced variable count'
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have totalDefinitions equal to unique defined variables', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.array(definitionArbitrary, { minLength: 0, maxLength: 50 }),
          (references, definitions) => {
            const result = analyzeIssues(references, definitions);

            const uniqueDefinedVars = new Set(definitions.map(d => d.varName));

            assert.equal(
              result.summary.totalDefinitions,
              uniqueDefinedVars.size,
              'totalDefinitions should equal unique defined variable count'
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should satisfy the accounting equation: totalReferences = missing + undocumented + documented', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.array(definitionArbitrary, { minLength: 0, maxLength: 50 }),
          (references, definitions) => {
            const result = analyzeIssues(references, definitions);

            const referencedVars = new Set(references.map(r => r.varName));
            const definedVars = new Set(definitions.map(d => d.varName));
            const defMap = new Map(definitions.map(d => [d.varName, d]));

            // Count documented variables (referenced, defined, and has comment)
            let documentedCount = 0;
            for (const varName of referencedVars) {
              if (definedVars.has(varName)) {
                const def = defMap.get(varName);
                if (def && def.hasComment) {
                  documentedCount++;
                }
              }
            }

            // Accounting equation
            const accountedFor = result.summary.totalMissing + result.summary.totalUndocumented + documentedCount;

            assert.equal(
              accountedFor,
              result.summary.totalReferences,
              `All referenced variables should be accounted for: ${result.summary.totalMissing} missing + ${result.summary.totalUndocumented} undocumented + ${documentedCount} documented = ${accountedFor}, but totalReferences = ${result.summary.totalReferences}`
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Idempotency', () => {
    it('should produce identical results when called multiple times with same input', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.array(definitionArbitrary, { minLength: 0, maxLength: 50 }),
          (references, definitions) => {
            const result1 = analyzeIssues(references, definitions);
            const result2 = analyzeIssues(references, definitions);
            const result3 = analyzeIssues(references, definitions);

            // Deep equality check for all three results
            assert.deepEqual(result1, result2, 'First and second calls should produce identical results');
            assert.deepEqual(result2, result3, 'Second and third calls should produce identical results');
            assert.deepEqual(result1, result3, 'First and third calls should produce identical results');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not mutate input arrays', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.array(definitionArbitrary, { minLength: 0, maxLength: 50 }),
          (references, definitions) => {
            // Normalize objects to have regular prototypes (fc.record creates null prototype objects)
            const normalizeObj = (obj) => ({ ...obj });
            const normalizedRefs = references.map(normalizeObj);
            const normalizedDefs = definitions.map(normalizeObj);

            // Create deep copies of normalized inputs
            const referencesCopy = JSON.parse(JSON.stringify(normalizedRefs));
            const definitionsCopy = JSON.parse(JSON.stringify(normalizedDefs));

            // Call analyzeIssues
            analyzeIssues(normalizedRefs, normalizedDefs);

            // Verify inputs were not mutated
            assert.deepEqual(
              normalizedRefs,
              referencesCopy,
              'References array should not be mutated'
            );
            assert.deepEqual(
              normalizedDefs,
              definitionsCopy,
              'Definitions array should not be mutated'
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce consistent results for references regardless of order', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 2, maxLength: 20 }),
          fc.array(definitionArbitrary, { minLength: 2, maxLength: 20 }),
          (references, definitions) => {
            // Remove duplicate definitions (keep only unique varNames) to avoid order-dependent behavior
            const uniqueDefs = Array.from(
              new Map(definitions.map(d => [d.varName, d])).values()
            );

            // Helper to sort references within each issue for comparison
            const sortReferences = (result) => {
              const sorted = JSON.parse(JSON.stringify(result));
              for (const missing of sorted.missing) {
                missing.references.sort((a, b) => {
                  if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
                  if (a.lineNumber !== b.lineNumber) return a.lineNumber - b.lineNumber;
                  return a.pattern.localeCompare(b.pattern);
                });
              }
              for (const undoc of sorted.undocumented) {
                undoc.references.sort((a, b) => {
                  if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
                  if (a.lineNumber !== b.lineNumber) return a.lineNumber - b.lineNumber;
                  return a.pattern.localeCompare(b.pattern);
                });
              }
              return sorted;
            };

            // Analyze with original order
            const result1 = sortReferences(analyzeIssues(references, uniqueDefs));

            // Analyze with shuffled references
            const shuffledRefs = [...references].sort(() => Math.random() - 0.5);
            const result2 = sortReferences(analyzeIssues(shuffledRefs, uniqueDefs));

            // Results should be identical after sorting references
            assert.deepEqual(result1, result2, 'Results should be same regardless of reference order');

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 4: Variable Name Validity', () => {
    it('should only include variables with valid names in results', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.array(definitionArbitrary, { minLength: 0, maxLength: 50 }),
          (references, definitions) => {
            const result = analyzeIssues(references, definitions);

            const validVarNamePattern = /^[A-Z_][A-Z0-9_]*$/;

            // Check all missing variables have valid names
            for (const missing of result.missing) {
              assert.ok(
                validVarNamePattern.test(missing.varName),
                `Missing variable name "${missing.varName}" should match pattern ^[A-Z_][A-Z0-9_]*$`
              );
            }

            // Check all unused variables have valid names
            for (const unused of result.unused) {
              assert.ok(
                validVarNamePattern.test(unused.varName),
                `Unused variable name "${unused.varName}" should match pattern ^[A-Z_][A-Z0-9_]*$`
              );
            }

            // Check all undocumented variables have valid names
            for (const undoc of result.undocumented) {
              assert.ok(
                validVarNamePattern.test(undoc.varName),
                `Undocumented variable name "${undoc.varName}" should match pattern ^[A-Z_][A-Z0-9_]*$`
              );
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve variable names exactly as provided in input', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 1, maxLength: 20 }),
          fc.array(definitionArbitrary, { minLength: 1, maxLength: 20 }),
          (references, definitions) => {
            const result = analyzeIssues(references, definitions);

            const inputVarNames = new Set([
              ...references.map(r => r.varName),
              ...definitions.map(d => d.varName)
            ]);

            const outputVarNames = new Set([
              ...result.missing.map(m => m.varName),
              ...result.unused.map(u => u.varName),
              ...result.undocumented.map(u => u.varName)
            ]);

            // Every output variable name should exist in input
            for (const varName of outputVarNames) {
              assert.ok(
                inputVarNames.has(varName),
                `Output variable "${varName}" should exist in input`
              );
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle variables with edge case names correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('_', '__', 'A', 'Z', '_A', '_Z', 'A_', 'Z_', 'A_B_C_D_E_F_G'),
          fc.boolean(),
          (varName, isReferenced) => {
            const references = isReferenced ? [
              { varName, filePath: 'test.js', lineNumber: 1, pattern: `process.env.${varName}` }
            ] : [];
            
            const definitions = !isReferenced ? [
              { varName, hasComment: true, comment: 'Test', lineNumber: 1 }
            ] : [];

            const result = analyzeIssues(references, definitions);

            // Should categorize correctly
            if (isReferenced) {
              assert.equal(result.missing.length, 1);
              assert.equal(result.missing[0].varName, varName);
            } else {
              assert.equal(result.unused.length, 1);
              assert.equal(result.unused[0].varName, varName);
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 5: Reference Grouping', () => {
    it('should group all references for each missing variable', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 1, maxLength: 50 }),
          (references) => {
            const definitions = []; // No definitions, so all are missing

            const result = analyzeIssues(references, definitions);

            // Count references per variable in input
            const refCountMap = new Map();
            for (const ref of references) {
              refCountMap.set(ref.varName, (refCountMap.get(ref.varName) || 0) + 1);
            }

            // Verify each missing variable has correct number of references
            for (const missing of result.missing) {
              const expectedCount = refCountMap.get(missing.varName);
              assert.equal(
                missing.references.length,
                expectedCount,
                `Missing variable ${missing.varName} should have ${expectedCount} references`
              );
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all reference details (filePath, lineNumber, pattern)', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 1, maxLength: 30 }),
          (references) => {
            const definitions = []; // No definitions

            const result = analyzeIssues(references, definitions);

            // Create a set of reference signatures from input
            const inputRefSignatures = new Set(
              references.map(r => `${r.varName}:${r.filePath}:${r.lineNumber}:${r.pattern}`)
            );

            // Create a set of reference signatures from output
            const outputRefSignatures = new Set();
            for (const missing of result.missing) {
              for (const ref of missing.references) {
                outputRefSignatures.add(`${ref.varName}:${ref.filePath}:${ref.lineNumber}:${ref.pattern}`);
              }
            }

            // All input references should appear in output
            assert.equal(
              outputRefSignatures.size,
              inputRefSignatures.size,
              'All input references should be preserved in output'
            );

            for (const sig of inputRefSignatures) {
              assert.ok(
                outputRefSignatures.has(sig),
                `Reference signature ${sig} should be in output`
              );
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Empty Input Handling', () => {
    it('should handle empty references array correctly', () => {
      fc.assert(
        fc.property(
          fc.array(definitionArbitrary, { minLength: 0, maxLength: 20 }),
          (definitions) => {
            const result = analyzeIssues([], definitions);

            // No references means no missing or undocumented
            assert.equal(result.missing.length, 0, 'Should have no missing variables');
            assert.equal(result.undocumented.length, 0, 'Should have no undocumented variables');
            
            // All definitions should be unused
            assert.equal(
              result.unused.length,
              new Set(definitions.map(d => d.varName)).size,
              'All unique definitions should be unused'
            );

            assert.equal(result.summary.totalReferences, 0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty definitions array correctly', () => {
      fc.assert(
        fc.property(
          fc.array(referenceArbitrary, { minLength: 0, maxLength: 20 }),
          (references) => {
            const result = analyzeIssues(references, []);

            // No definitions means no unused or undocumented
            assert.equal(result.unused.length, 0, 'Should have no unused variables');
            assert.equal(result.undocumented.length, 0, 'Should have no undocumented variables');
            
            // All references should be missing
            assert.equal(
              result.missing.length,
              new Set(references.map(r => r.varName)).size,
              'All unique references should be missing'
            );

            assert.equal(result.summary.totalDefinitions, 0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle both empty arrays correctly', () => {
      const result = analyzeIssues([], []);

      assert.equal(result.missing.length, 0);
      assert.equal(result.unused.length, 0);
      assert.equal(result.undocumented.length, 0);
      assert.equal(result.summary.totalMissing, 0);
      assert.equal(result.summary.totalUnused, 0);
      assert.equal(result.summary.totalUndocumented, 0);
      assert.equal(result.summary.totalReferences, 0);
      assert.equal(result.summary.totalDefinitions, 0);
    });
  });
});
