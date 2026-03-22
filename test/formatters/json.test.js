import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatJSON,
  formatMissingIssues,
  formatUnusedIssues,
  formatUndocumentedIssues,
  formatSummary,
  isValidJSON
} from '../../src/formatters/json.js';

describe('JSON Formatter', () => {
  describe('formatMissingIssues', () => {
    it('should format missing issues correctly', () => {
      const missing = [
        {
          varName: 'DATABASE_URL',
          references: [
            { filePath: 'src/db.js', lineNumber: 10, pattern: 'process.env.DATABASE_URL' },
            { filePath: 'src/config.js', lineNumber: 5, pattern: 'process.env.DATABASE_URL' }
          ]
        }
      ];

      const result = formatMissingIssues(missing);

      assert.equal(result.length, 1);
      assert.equal(result[0].varName, 'DATABASE_URL');
      assert.equal(result[0].references.length, 2);
      assert.equal(result[0].references[0].filePath, 'src/db.js');
      assert.equal(result[0].references[0].lineNumber, 10);
      assert.equal(result[0].references[0].pattern, 'process.env.DATABASE_URL');
    });

    it('should handle empty array', () => {
      const result = formatMissingIssues([]);
      assert.deepEqual(result, []);
    });

    it('should handle multiple missing variables', () => {
      const missing = [
        {
          varName: 'VAR1',
          references: [{ filePath: 'a.js', lineNumber: 1, pattern: 'process.env.VAR1' }]
        },
        {
          varName: 'VAR2',
          references: [{ filePath: 'b.js', lineNumber: 2, pattern: 'process.env.VAR2' }]
        }
      ];

      const result = formatMissingIssues(missing);

      assert.equal(result.length, 2);
      assert.equal(result[0].varName, 'VAR1');
      assert.equal(result[1].varName, 'VAR2');
    });
  });

  describe('formatUnusedIssues', () => {
    it('should format unused issues correctly', () => {
      const unused = [
        {
          varName: 'LEGACY_VAR',
          definition: {
            lineNumber: 5,
            hasComment: true,
            comment: 'Old variable'
          }
        }
      ];

      const result = formatUnusedIssues(unused);

      assert.equal(result.length, 1);
      assert.equal(result[0].varName, 'LEGACY_VAR');
      assert.equal(result[0].definition.lineNumber, 5);
      assert.equal(result[0].definition.hasComment, true);
      assert.equal(result[0].definition.comment, 'Old variable');
    });

    it('should handle empty array', () => {
      const result = formatUnusedIssues([]);
      assert.deepEqual(result, []);
    });

    it('should handle variables without comments', () => {
      const unused = [
        {
          varName: 'UNUSED_VAR',
          definition: {
            lineNumber: 3,
            hasComment: false,
            comment: null
          }
        }
      ];

      const result = formatUnusedIssues(unused);

      assert.equal(result[0].definition.hasComment, false);
      assert.equal(result[0].definition.comment, null);
    });
  });

  describe('formatUndocumentedIssues', () => {
    it('should format undocumented issues correctly', () => {
      const undocumented = [
        {
          varName: 'API_KEY',
          references: [
            { filePath: 'src/api.js', lineNumber: 3, pattern: 'process.env.API_KEY' }
          ],
          definition: {
            lineNumber: 2,
            hasComment: false,
            comment: null
          }
        }
      ];

      const result = formatUndocumentedIssues(undocumented);

      assert.equal(result.length, 1);
      assert.equal(result[0].varName, 'API_KEY');
      assert.equal(result[0].references.length, 1);
      assert.equal(result[0].references[0].filePath, 'src/api.js');
      assert.equal(result[0].definition.lineNumber, 2);
      assert.equal(result[0].definition.hasComment, false);
    });

    it('should handle empty array', () => {
      const result = formatUndocumentedIssues([]);
      assert.deepEqual(result, []);
    });

    it('should handle multiple references', () => {
      const undocumented = [
        {
          varName: 'SECRET',
          references: [
            { filePath: 'a.js', lineNumber: 1, pattern: 'process.env.SECRET' },
            { filePath: 'b.js', lineNumber: 2, pattern: 'process.env.SECRET' },
            { filePath: 'c.js', lineNumber: 3, pattern: 'process.env.SECRET' }
          ],
          definition: {
            lineNumber: 10,
            hasComment: false,
            comment: null
          }
        }
      ];

      const result = formatUndocumentedIssues(undocumented);

      assert.equal(result[0].references.length, 3);
    });
  });

  describe('formatSummary', () => {
    it('should format summary correctly', () => {
      const summary = {
        totalMissing: 2,
        totalUnused: 1,
        totalUndocumented: 3,
        totalReferences: 10,
        totalDefinitions: 8
      };

      const result = formatSummary(summary);

      assert.equal(result.totalMissing, 2);
      assert.equal(result.totalUnused, 1);
      assert.equal(result.totalUndocumented, 3);
      assert.equal(result.totalReferences, 10);
      assert.equal(result.totalDefinitions, 8);
    });

    it('should handle zero values', () => {
      const summary = {
        totalMissing: 0,
        totalUnused: 0,
        totalUndocumented: 0,
        totalReferences: 0,
        totalDefinitions: 0
      };

      const result = formatSummary(summary);

      assert.equal(result.totalMissing, 0);
      assert.equal(result.totalUnused, 0);
      assert.equal(result.totalUndocumented, 0);
    });
  });

  describe('isValidJSON', () => {
    it('should return true for valid JSON', () => {
      assert.equal(isValidJSON('{"key": "value"}'), true);
      assert.equal(isValidJSON('[]'), true);
      assert.equal(isValidJSON('null'), true);
      assert.equal(isValidJSON('123'), true);
      assert.equal(isValidJSON('"string"'), true);
    });

    it('should return false for invalid JSON', () => {
      assert.equal(isValidJSON('{key: value}'), false);
      assert.equal(isValidJSON('{"key": undefined}'), false);
      assert.equal(isValidJSON('{'), false);
      assert.equal(isValidJSON(''), false);
    });

    it('should handle complex valid JSON', () => {
      const complexJSON = JSON.stringify({
        missing: [{ varName: 'TEST', references: [] }],
        unused: [],
        undocumented: [],
        summary: { totalMissing: 1 }
      });

      assert.equal(isValidJSON(complexJSON), true);
    });
  });

  describe('formatJSON', () => {
    it('should format complete analysis result as valid JSON', () => {
      const result = {
        missing: [
          {
            varName: 'MISSING_VAR',
            references: [
              { filePath: 'src/app.js', lineNumber: 10, pattern: 'process.env.MISSING_VAR' }
            ]
          }
        ],
        unused: [
          {
            varName: 'UNUSED_VAR',
            definition: {
              lineNumber: 1,
              hasComment: true,
              comment: 'Not used'
            }
          }
        ],
        undocumented: [
          {
            varName: 'UNDOCUMENTED_VAR',
            references: [
              { filePath: 'src/config.js', lineNumber: 5, pattern: 'process.env.UNDOCUMENTED_VAR' }
            ],
            definition: {
              lineNumber: 2,
              hasComment: false,
              comment: null
            }
          }
        ],
        summary: {
          totalMissing: 1,
          totalUnused: 1,
          totalUndocumented: 1,
          totalReferences: 2,
          totalDefinitions: 2
        }
      };

      const json = formatJSON(result);

      // Verify it's valid JSON
      assert.equal(isValidJSON(json), true);

      // Parse and verify structure
      const parsed = JSON.parse(json);
      assert.equal(parsed.missing.length, 1);
      assert.equal(parsed.unused.length, 1);
      assert.equal(parsed.undocumented.length, 1);
      assert.equal(parsed.summary.totalMissing, 1);
    });

    it('should format empty result as valid JSON', () => {
      const result = {
        missing: [],
        unused: [],
        undocumented: [],
        summary: {
          totalMissing: 0,
          totalUnused: 0,
          totalUndocumented: 0,
          totalReferences: 0,
          totalDefinitions: 0
        }
      };

      const json = formatJSON(result);

      assert.equal(isValidJSON(json), true);

      const parsed = JSON.parse(json);
      assert.deepEqual(parsed.missing, []);
      assert.deepEqual(parsed.unused, []);
      assert.deepEqual(parsed.undocumented, []);
      assert.equal(parsed.summary.totalMissing, 0);
    });

    it('should produce pretty-printed JSON with 2-space indentation', () => {
      const result = {
        missing: [],
        unused: [],
        undocumented: [],
        summary: {
          totalMissing: 0,
          totalUnused: 0,
          totalUndocumented: 0,
          totalReferences: 0,
          totalDefinitions: 0
        }
      };

      const json = formatJSON(result);

      // Check for indentation
      assert.ok(json.includes('  "missing"'));
      assert.ok(json.includes('  "unused"'));
      assert.ok(json.includes('  "summary"'));
    });

    it('should handle complex real-world scenario', () => {
      const result = {
        missing: [
          {
            varName: 'DATABASE_URL',
            references: [
              { filePath: 'src/db/connection.js', lineNumber: 12, pattern: 'process.env.DATABASE_URL' },
              { filePath: 'src/config/database.js', lineNumber: 5, pattern: 'process.env.DATABASE_URL' }
            ]
          },
          {
            varName: 'REDIS_HOST',
            references: [
              { filePath: 'src/cache/redis.js', lineNumber: 8, pattern: 'process.env.REDIS_HOST' }
            ]
          }
        ],
        unused: [
          {
            varName: 'LEGACY_API_KEY',
            definition: {
              lineNumber: 15,
              hasComment: true,
              comment: 'Deprecated - use NEW_API_KEY instead'
            }
          }
        ],
        undocumented: [
          {
            varName: 'API_SECRET',
            references: [
              { filePath: 'src/api/auth.js', lineNumber: 20, pattern: 'process.env.API_SECRET' }
            ],
            definition: {
              lineNumber: 3,
              hasComment: false,
              comment: null
            }
          },
          {
            varName: 'JWT_EXPIRY',
            references: [
              { filePath: 'src/auth/jwt.js', lineNumber: 15, pattern: 'process.env.JWT_EXPIRY' }
            ],
            definition: {
              lineNumber: 4,
              hasComment: false,
              comment: null
            }
          }
        ],
        summary: {
          totalMissing: 2,
          totalUnused: 1,
          totalUndocumented: 2,
          totalReferences: 5,
          totalDefinitions: 4
        }
      };

      const json = formatJSON(result);

      // Verify it's valid JSON
      assert.equal(isValidJSON(json), true);

      // Parse and verify all data is preserved
      const parsed = JSON.parse(json);
      assert.equal(parsed.missing.length, 2);
      assert.equal(parsed.missing[0].varName, 'DATABASE_URL');
      assert.equal(parsed.missing[0].references.length, 2);
      assert.equal(parsed.unused.length, 1);
      assert.equal(parsed.unused[0].definition.comment, 'Deprecated - use NEW_API_KEY instead');
      assert.equal(parsed.undocumented.length, 2);
      assert.equal(parsed.summary.totalMissing, 2);
      assert.equal(parsed.summary.totalUnused, 1);
      assert.equal(parsed.summary.totalUndocumented, 2);
    });

    it('should preserve all reference details', () => {
      const result = {
        missing: [
          {
            varName: 'TEST_VAR',
            references: [
              {
                filePath: 'src/test.js',
                lineNumber: 42,
                pattern: 'process.env.TEST_VAR'
              }
            ]
          }
        ],
        unused: [],
        undocumented: [],
        summary: {
          totalMissing: 1,
          totalUnused: 0,
          totalUndocumented: 0,
          totalReferences: 1,
          totalDefinitions: 0
        }
      };

      const json = formatJSON(result);
      const parsed = JSON.parse(json);

      assert.equal(parsed.missing[0].references[0].filePath, 'src/test.js');
      assert.equal(parsed.missing[0].references[0].lineNumber, 42);
      assert.equal(parsed.missing[0].references[0].pattern, 'process.env.TEST_VAR');
    });

    it('should preserve null values in definitions', () => {
      const result = {
        missing: [],
        unused: [
          {
            varName: 'NULL_COMMENT_VAR',
            definition: {
              lineNumber: 10,
              hasComment: false,
              comment: null
            }
          }
        ],
        undocumented: [],
        summary: {
          totalMissing: 0,
          totalUnused: 1,
          totalUndocumented: 0,
          totalReferences: 0,
          totalDefinitions: 1
        }
      };

      const json = formatJSON(result);
      const parsed = JSON.parse(json);

      assert.equal(parsed.unused[0].definition.comment, null);
      assert.equal(parsed.unused[0].definition.hasComment, false);
    });
  });
});
