import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeIssues,
  groupReferencesByVariable,
  createDefinitionMap,
  findMissing,
  findUnused,
  findUndocumented,
  calculateSummary
} from '../src/analyzer.js';

describe('Analyzer', () => {
  describe('groupReferencesByVariable', () => {
    it('should group references by variable name', () => {
      const references = [
        { varName: 'DATABASE_URL', filePath: 'src/db.js', lineNumber: 10, pattern: 'process.env.DATABASE_URL' },
        { varName: 'DATABASE_URL', filePath: 'src/config.js', lineNumber: 5, pattern: 'process.env.DATABASE_URL' },
        { varName: 'API_KEY', filePath: 'src/api.js', lineNumber: 3, pattern: 'process.env.API_KEY' }
      ];

      const result = groupReferencesByVariable(references);

      assert.equal(result.size, 2);
      assert.equal(result.get('DATABASE_URL').length, 2);
      assert.equal(result.get('API_KEY').length, 1);
      assert.deepEqual(result.get('DATABASE_URL')[0], references[0]);
      assert.deepEqual(result.get('DATABASE_URL')[1], references[1]);
    });

    it('should handle empty references array', () => {
      const result = groupReferencesByVariable([]);
      assert.equal(result.size, 0);
    });

    it('should handle single reference', () => {
      const references = [
        { varName: 'PORT', filePath: 'src/server.js', lineNumber: 1, pattern: 'process.env.PORT' }
      ];

      const result = groupReferencesByVariable(references);

      assert.equal(result.size, 1);
      assert.equal(result.get('PORT').length, 1);
    });
  });

  describe('createDefinitionMap', () => {
    it('should create a map of definitions by variable name', () => {
      const definitions = [
        { varName: 'DATABASE_URL', hasComment: true, comment: 'Database connection string', lineNumber: 1 },
        { varName: 'API_KEY', hasComment: false, comment: null, lineNumber: 2 }
      ];

      const result = createDefinitionMap(definitions);

      assert.equal(result.size, 2);
      assert.deepEqual(result.get('DATABASE_URL'), definitions[0]);
      assert.deepEqual(result.get('API_KEY'), definitions[1]);
    });

    it('should handle empty definitions array', () => {
      const result = createDefinitionMap([]);
      assert.equal(result.size, 0);
    });

    it('should handle duplicate variable names (last one wins)', () => {
      const definitions = [
        { varName: 'PORT', hasComment: true, comment: 'First', lineNumber: 1 },
        { varName: 'PORT', hasComment: false, comment: null, lineNumber: 2 }
      ];

      const result = createDefinitionMap(definitions);

      assert.equal(result.size, 1);
      assert.equal(result.get('PORT').hasComment, false);
      assert.equal(result.get('PORT').lineNumber, 2);
    });
  });

  describe('findMissing', () => {
    it('should find variables used in code but not defined', () => {
      const referencedVars = new Set(['DATABASE_URL', 'API_KEY', 'SECRET']);
      const definedVars = new Set(['DATABASE_URL', 'API_KEY']);
      const refsByVar = new Map([
        ['SECRET', [
          { varName: 'SECRET', filePath: 'src/auth.js', lineNumber: 10, pattern: 'process.env.SECRET' }
        ]]
      ]);

      const result = findMissing(referencedVars, definedVars, refsByVar);

      assert.equal(result.length, 1);
      assert.equal(result[0].varName, 'SECRET');
      assert.equal(result[0].references.length, 1);
      assert.equal(result[0].references[0].filePath, 'src/auth.js');
    });

    it('should return empty array when all variables are defined', () => {
      const referencedVars = new Set(['DATABASE_URL', 'API_KEY']);
      const definedVars = new Set(['DATABASE_URL', 'API_KEY', 'EXTRA']);
      const refsByVar = new Map();

      const result = findMissing(referencedVars, definedVars, refsByVar);

      assert.equal(result.length, 0);
    });

    it('should sort results by variable name', () => {
      const referencedVars = new Set(['ZEBRA', 'ALPHA', 'BETA']);
      const definedVars = new Set([]);
      const refsByVar = new Map([
        ['ZEBRA', [{ varName: 'ZEBRA', filePath: 'z.js', lineNumber: 1, pattern: 'process.env.ZEBRA' }]],
        ['ALPHA', [{ varName: 'ALPHA', filePath: 'a.js', lineNumber: 1, pattern: 'process.env.ALPHA' }]],
        ['BETA', [{ varName: 'BETA', filePath: 'b.js', lineNumber: 1, pattern: 'process.env.BETA' }]]
      ]);

      const result = findMissing(referencedVars, definedVars, refsByVar);

      assert.equal(result.length, 3);
      assert.equal(result[0].varName, 'ALPHA');
      assert.equal(result[1].varName, 'BETA');
      assert.equal(result[2].varName, 'ZEBRA');
    });
  });

  describe('findUnused', () => {
    it('should find variables defined but never used', () => {
      const definedVars = new Set(['DATABASE_URL', 'API_KEY', 'LEGACY_VAR']);
      const referencedVars = new Set(['DATABASE_URL', 'API_KEY']);
      const defByVar = new Map([
        ['LEGACY_VAR', { varName: 'LEGACY_VAR', hasComment: true, comment: 'Old variable', lineNumber: 5 }]
      ]);

      const result = findUnused(definedVars, referencedVars, defByVar);

      assert.equal(result.length, 1);
      assert.equal(result[0].varName, 'LEGACY_VAR');
      assert.equal(result[0].definition.comment, 'Old variable');
    });

    it('should return empty array when all variables are used', () => {
      const definedVars = new Set(['DATABASE_URL', 'API_KEY']);
      const referencedVars = new Set(['DATABASE_URL', 'API_KEY', 'EXTRA']);
      const defByVar = new Map();

      const result = findUnused(definedVars, referencedVars, defByVar);

      assert.equal(result.length, 0);
    });

    it('should sort results by variable name', () => {
      const definedVars = new Set(['ZEBRA', 'ALPHA', 'BETA']);
      const referencedVars = new Set([]);
      const defByVar = new Map([
        ['ZEBRA', { varName: 'ZEBRA', hasComment: false, comment: null, lineNumber: 3 }],
        ['ALPHA', { varName: 'ALPHA', hasComment: false, comment: null, lineNumber: 1 }],
        ['BETA', { varName: 'BETA', hasComment: false, comment: null, lineNumber: 2 }]
      ]);

      const result = findUnused(definedVars, referencedVars, defByVar);

      assert.equal(result.length, 3);
      assert.equal(result[0].varName, 'ALPHA');
      assert.equal(result[1].varName, 'BETA');
      assert.equal(result[2].varName, 'ZEBRA');
    });
  });

  describe('findUndocumented', () => {
    it('should find variables used and defined but lacking comments', () => {
      const referencedVars = new Set(['DATABASE_URL', 'API_KEY', 'SECRET']);
      const definedVars = new Set(['DATABASE_URL', 'API_KEY']);
      const refsByVar = new Map([
        ['API_KEY', [{ varName: 'API_KEY', filePath: 'src/api.js', lineNumber: 3, pattern: 'process.env.API_KEY' }]]
      ]);
      const defByVar = new Map([
        ['DATABASE_URL', { varName: 'DATABASE_URL', hasComment: true, comment: 'DB URL', lineNumber: 1 }],
        ['API_KEY', { varName: 'API_KEY', hasComment: false, comment: null, lineNumber: 2 }]
      ]);

      const result = findUndocumented(referencedVars, definedVars, refsByVar, defByVar);

      assert.equal(result.length, 1);
      assert.equal(result[0].varName, 'API_KEY');
      assert.equal(result[0].definition.hasComment, false);
      assert.equal(result[0].references.length, 1);
    });

    it('should return empty array when all variables have comments', () => {
      const referencedVars = new Set(['DATABASE_URL', 'API_KEY']);
      const definedVars = new Set(['DATABASE_URL', 'API_KEY']);
      const refsByVar = new Map();
      const defByVar = new Map([
        ['DATABASE_URL', { varName: 'DATABASE_URL', hasComment: true, comment: 'DB URL', lineNumber: 1 }],
        ['API_KEY', { varName: 'API_KEY', hasComment: true, comment: 'API Key', lineNumber: 2 }]
      ]);

      const result = findUndocumented(referencedVars, definedVars, refsByVar, defByVar);

      assert.equal(result.length, 0);
    });

    it('should sort results by variable name', () => {
      const referencedVars = new Set(['ZEBRA', 'ALPHA', 'BETA']);
      const definedVars = new Set(['ZEBRA', 'ALPHA', 'BETA']);
      const refsByVar = new Map([
        ['ZEBRA', [{ varName: 'ZEBRA', filePath: 'z.js', lineNumber: 1, pattern: 'process.env.ZEBRA' }]],
        ['ALPHA', [{ varName: 'ALPHA', filePath: 'a.js', lineNumber: 1, pattern: 'process.env.ALPHA' }]],
        ['BETA', [{ varName: 'BETA', filePath: 'b.js', lineNumber: 1, pattern: 'process.env.BETA' }]]
      ]);
      const defByVar = new Map([
        ['ZEBRA', { varName: 'ZEBRA', hasComment: false, comment: null, lineNumber: 3 }],
        ['ALPHA', { varName: 'ALPHA', hasComment: false, comment: null, lineNumber: 1 }],
        ['BETA', { varName: 'BETA', hasComment: false, comment: null, lineNumber: 2 }]
      ]);

      const result = findUndocumented(referencedVars, definedVars, refsByVar, defByVar);

      assert.equal(result.length, 3);
      assert.equal(result[0].varName, 'ALPHA');
      assert.equal(result[1].varName, 'BETA');
      assert.equal(result[2].varName, 'ZEBRA');
    });
  });

  describe('calculateSummary', () => {
    it('should calculate correct summary statistics', () => {
      const missing = [{ varName: 'VAR1' }, { varName: 'VAR2' }];
      const unused = [{ varName: 'VAR3' }];
      const undocumented = [{ varName: 'VAR4' }, { varName: 'VAR5' }, { varName: 'VAR6' }];
      const referencedVars = new Set(['VAR1', 'VAR2', 'VAR4', 'VAR5', 'VAR6']);
      const definedVars = new Set(['VAR3', 'VAR4', 'VAR5', 'VAR6']);

      const result = calculateSummary(missing, unused, undocumented, referencedVars, definedVars);

      assert.equal(result.totalMissing, 2);
      assert.equal(result.totalUnused, 1);
      assert.equal(result.totalUndocumented, 3);
      assert.equal(result.totalReferences, 5);
      assert.equal(result.totalDefinitions, 4);
    });

    it('should handle empty arrays', () => {
      const result = calculateSummary([], [], [], new Set(), new Set());

      assert.equal(result.totalMissing, 0);
      assert.equal(result.totalUnused, 0);
      assert.equal(result.totalUndocumented, 0);
      assert.equal(result.totalReferences, 0);
      assert.equal(result.totalDefinitions, 0);
    });
  });

  describe('analyzeIssues', () => {
    it('should perform complete analysis with all issue types', () => {
      const references = [
        { varName: 'MISSING_VAR', filePath: 'src/app.js', lineNumber: 10, pattern: 'process.env.MISSING_VAR' },
        { varName: 'UNDOCUMENTED_VAR', filePath: 'src/config.js', lineNumber: 5, pattern: 'process.env.UNDOCUMENTED_VAR' },
        { varName: 'DOCUMENTED_VAR', filePath: 'src/db.js', lineNumber: 3, pattern: 'process.env.DOCUMENTED_VAR' }
      ];

      const definitions = [
        { varName: 'UNUSED_VAR', hasComment: true, comment: 'Not used anywhere', lineNumber: 1 },
        { varName: 'UNDOCUMENTED_VAR', hasComment: false, comment: null, lineNumber: 2 },
        { varName: 'DOCUMENTED_VAR', hasComment: true, comment: 'This is documented', lineNumber: 3 }
      ];

      const result = analyzeIssues(references, definitions);

      // Check missing
      assert.equal(result.missing.length, 1);
      assert.equal(result.missing[0].varName, 'MISSING_VAR');
      assert.equal(result.missing[0].references.length, 1);

      // Check unused
      assert.equal(result.unused.length, 1);
      assert.equal(result.unused[0].varName, 'UNUSED_VAR');

      // Check undocumented
      assert.equal(result.undocumented.length, 1);
      assert.equal(result.undocumented[0].varName, 'UNDOCUMENTED_VAR');

      // Check summary
      assert.equal(result.summary.totalMissing, 1);
      assert.equal(result.summary.totalUnused, 1);
      assert.equal(result.summary.totalUndocumented, 1);
      assert.equal(result.summary.totalReferences, 3);
      assert.equal(result.summary.totalDefinitions, 3);
    });

    it('should handle no issues scenario', () => {
      const references = [
        { varName: 'VAR1', filePath: 'src/app.js', lineNumber: 1, pattern: 'process.env.VAR1' },
        { varName: 'VAR2', filePath: 'src/app.js', lineNumber: 2, pattern: 'process.env.VAR2' }
      ];

      const definitions = [
        { varName: 'VAR1', hasComment: true, comment: 'Variable 1', lineNumber: 1 },
        { varName: 'VAR2', hasComment: true, comment: 'Variable 2', lineNumber: 2 }
      ];

      const result = analyzeIssues(references, definitions);

      assert.equal(result.missing.length, 0);
      assert.equal(result.unused.length, 0);
      assert.equal(result.undocumented.length, 0);
      assert.equal(result.summary.totalMissing, 0);
      assert.equal(result.summary.totalUnused, 0);
      assert.equal(result.summary.totalUndocumented, 0);
    });

    it('should handle empty inputs', () => {
      const result = analyzeIssues([], []);

      assert.equal(result.missing.length, 0);
      assert.equal(result.unused.length, 0);
      assert.equal(result.undocumented.length, 0);
      assert.equal(result.summary.totalReferences, 0);
      assert.equal(result.summary.totalDefinitions, 0);
    });

    it('should group multiple references to same variable', () => {
      const references = [
        { varName: 'MISSING_VAR', filePath: 'src/app.js', lineNumber: 10, pattern: 'process.env.MISSING_VAR' },
        { varName: 'MISSING_VAR', filePath: 'src/config.js', lineNumber: 5, pattern: 'process.env.MISSING_VAR' },
        { varName: 'MISSING_VAR', filePath: 'src/db.js', lineNumber: 3, pattern: 'process.env.MISSING_VAR' }
      ];

      const definitions = [];

      const result = analyzeIssues(references, definitions);

      assert.equal(result.missing.length, 1);
      assert.equal(result.missing[0].varName, 'MISSING_VAR');
      assert.equal(result.missing[0].references.length, 3);
      assert.equal(result.summary.totalReferences, 1); // Unique variables
    });

    it('should ensure mutual exclusivity of categories', () => {
      const references = [
        { varName: 'VAR_A', filePath: 'src/a.js', lineNumber: 1, pattern: 'process.env.VAR_A' },
        { varName: 'VAR_B', filePath: 'src/b.js', lineNumber: 1, pattern: 'process.env.VAR_B' },
        { varName: 'VAR_C', filePath: 'src/c.js', lineNumber: 1, pattern: 'process.env.VAR_C' }
      ];

      const definitions = [
        { varName: 'VAR_B', hasComment: false, comment: null, lineNumber: 1 },
        { varName: 'VAR_C', hasComment: true, comment: 'Documented', lineNumber: 2 },
        { varName: 'VAR_D', hasComment: true, comment: 'Unused', lineNumber: 3 }
      ];

      const result = analyzeIssues(references, definitions);

      // Collect all variable names from all categories
      const missingVars = new Set(result.missing.map(m => m.varName));
      const unusedVars = new Set(result.unused.map(u => u.varName));
      const undocumentedVars = new Set(result.undocumented.map(u => u.varName));

      // Check no overlap between categories
      for (const varName of missingVars) {
        assert.ok(!unusedVars.has(varName), `${varName} should not be in both missing and unused`);
        assert.ok(!undocumentedVars.has(varName), `${varName} should not be in both missing and undocumented`);
      }

      for (const varName of unusedVars) {
        assert.ok(!undocumentedVars.has(varName), `${varName} should not be in both unused and undocumented`);
      }
    });
  });
});
