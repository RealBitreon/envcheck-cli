import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatGitHub,
  formatMissingAnnotations,
  formatUnusedAnnotation,
  formatUndocumentedAnnotation,
  formatSummaryNotice,
  formatErrorAnnotation,
  formatWarningAnnotation,
  escapeProperty,
  escapeMessage
} from '../../src/formatters/github.js';

describe('GitHub Actions Formatter', () => {
  describe('escapeProperty', () => {
    it('should escape percent signs', () => {
      assert.equal(escapeProperty('file%name'), 'file%25name');
    });

    it('should escape carriage returns', () => {
      assert.equal(escapeProperty('line\rbreak'), 'line%0Dbreak');
    });

    it('should escape newlines', () => {
      assert.equal(escapeProperty('line\nbreak'), 'line%0Abreak');
    });

    it('should escape colons', () => {
      assert.equal(escapeProperty('C:\\path\\file.js'), 'C%3A\\path\\file.js');
    });

    it('should escape commas', () => {
      assert.equal(escapeProperty('file,name'), 'file%2Cname');
    });

    it('should escape multiple special characters', () => {
      assert.equal(escapeProperty('C:\\path,file:name%test'), 'C%3A\\path%2Cfile%3Aname%25test');
    });

    it('should handle empty string', () => {
      assert.equal(escapeProperty(''), '');
    });

    it('should handle normal file paths', () => {
      assert.equal(escapeProperty('src/app.js'), 'src/app.js');
    });
  });

  describe('escapeMessage', () => {
    it('should escape percent signs', () => {
      assert.equal(escapeMessage('100% complete'), '100%25 complete');
    });

    it('should escape carriage returns', () => {
      assert.equal(escapeMessage('line\rbreak'), 'line%0Dbreak');
    });

    it('should escape newlines', () => {
      assert.equal(escapeMessage('line\nbreak'), 'line%0Abreak');
    });

    it('should not escape colons or commas', () => {
      assert.equal(escapeMessage('Error: missing value, check config'), 'Error: missing value, check config');
    });

    it('should handle empty string', () => {
      assert.equal(escapeMessage(''), '');
    });

    it('should handle normal messages', () => {
      assert.equal(escapeMessage('Missing environment variable'), 'Missing environment variable');
    });
  });

  describe('formatErrorAnnotation', () => {
    it('should format basic error annotation', () => {
      const result = formatErrorAnnotation('src/app.js', 10, 'Missing variable');
      assert.equal(result, '::error file=src/app.js,line=10::Missing variable');
    });

    it('should escape file path', () => {
      const result = formatErrorAnnotation('C:\\src\\app.js', 5, 'Error message');
      assert.equal(result, '::error file=C%3A\\src\\app.js,line=5::Error message');
    });

    it('should escape message', () => {
      const result = formatErrorAnnotation('file.js', 1, 'Error with\nnewline');
      assert.equal(result, '::error file=file.js,line=1::Error with%0Anewline');
    });

    it('should handle line number 0', () => {
      const result = formatErrorAnnotation('file.js', 0, 'Error');
      assert.equal(result, '::error file=file.js,line=0::Error');
    });
  });

  describe('formatWarningAnnotation', () => {
    it('should format basic warning annotation', () => {
      const result = formatWarningAnnotation('.env.example', 5, 'Unused variable');
      assert.equal(result, '::warning file=.env.example,line=5::Unused variable');
    });

    it('should escape file path', () => {
      const result = formatWarningAnnotation('path:with:colons', 10, 'Warning');
      assert.equal(result, '::warning file=path%3Awith%3Acolons,line=10::Warning');
    });

    it('should escape message', () => {
      const result = formatWarningAnnotation('file.js', 3, 'Warning: 100% sure');
      assert.equal(result, '::warning file=file.js,line=3::Warning: 100%25 sure');
    });
  });

  describe('formatMissingAnnotations', () => {
    it('should format single reference as error', () => {
      const issue = {
        varName: 'DATABASE_URL',
        references: [
          { filePath: 'src/db.js', lineNumber: 10, pattern: 'process.env.DATABASE_URL' }
        ]
      };

      const result = formatMissingAnnotations(issue);

      assert.equal(result.length, 1);
      assert.equal(
        result[0],
        '::error file=src/db.js,line=10::Missing environment variable: DATABASE_URL is used but not defined in .env.example'
      );
    });

    it('should format multiple references as separate errors', () => {
      const issue = {
        varName: 'API_KEY',
        references: [
          { filePath: 'src/api.js', lineNumber: 5, pattern: 'process.env.API_KEY' },
          { filePath: 'src/config.js', lineNumber: 12, pattern: 'process.env.API_KEY' },
          { filePath: 'src/auth.js', lineNumber: 8, pattern: 'process.env.API_KEY' }
        ]
      };

      const result = formatMissingAnnotations(issue);

      assert.equal(result.length, 3);
      assert.ok(result[0].includes('file=src/api.js,line=5'));
      assert.ok(result[1].includes('file=src/config.js,line=12'));
      assert.ok(result[2].includes('file=src/auth.js,line=8'));
      assert.ok(result[0].includes('API_KEY'));
    });

    it('should handle empty references array', () => {
      const issue = {
        varName: 'EMPTY_VAR',
        references: []
      };

      const result = formatMissingAnnotations(issue);

      assert.deepEqual(result, []);
    });

    it('should escape special characters in file paths', () => {
      const issue = {
        varName: 'TEST_VAR',
        references: [
          { filePath: 'C:\\Users\\test\\file.js', lineNumber: 1, pattern: 'process.env.TEST_VAR' }
        ]
      };

      const result = formatMissingAnnotations(issue);

      assert.ok(result[0].includes('file=C%3A\\Users\\test\\file.js'));
    });
  });

  describe('formatUnusedAnnotation', () => {
    it('should format unused variable as warning', () => {
      const issue = {
        varName: 'LEGACY_VAR',
        definition: {
          lineNumber: 5,
          hasComment: true,
          comment: 'Old variable'
        }
      };

      const result = formatUnusedAnnotation(issue);

      assert.equal(
        result,
        '::warning file=.env.example,line=5::Unused environment variable: LEGACY_VAR is defined in .env.example but never used'
      );
    });

    it('should handle variable without comment', () => {
      const issue = {
        varName: 'UNUSED_VAR',
        definition: {
          lineNumber: 10,
          hasComment: false,
          comment: null
        }
      };

      const result = formatUnusedAnnotation(issue);

      assert.ok(result.includes('UNUSED_VAR'));
      assert.ok(result.includes('line=10'));
      assert.ok(result.includes('::warning'));
    });

    it('should handle line number 1', () => {
      const issue = {
        varName: 'FIRST_VAR',
        definition: {
          lineNumber: 1,
          hasComment: false,
          comment: null
        }
      };

      const result = formatUnusedAnnotation(issue);

      assert.ok(result.includes('line=1'));
    });
  });

  describe('formatUndocumentedAnnotation', () => {
    it('should format undocumented variable as warning', () => {
      const issue = {
        varName: 'SECRET_KEY',
        definition: {
          lineNumber: 3,
          hasComment: false,
          comment: null
        }
      };

      const result = formatUndocumentedAnnotation(issue);

      assert.equal(
        result,
        '::warning file=.env.example,line=3::Undocumented environment variable: SECRET_KEY is missing a comment in .env.example'
      );
    });

    it('should include variable name in message', () => {
      const issue = {
        varName: 'API_SECRET',
        definition: {
          lineNumber: 7,
          hasComment: false,
          comment: null
        }
      };

      const result = formatUndocumentedAnnotation(issue);

      assert.ok(result.includes('API_SECRET'));
      assert.ok(result.includes('line=7'));
      assert.ok(result.includes('::warning'));
    });
  });

  describe('formatSummaryNotice', () => {
    it('should format summary with all issue types', () => {
      const summary = {
        totalMissing: 2,
        totalUnused: 1,
        totalUndocumented: 3
      };

      const result = formatSummaryNotice(summary);

      assert.equal(result, '::notice::Environment check completed - 2 missing, 1 unused, 3 undocumented');
    });

    it('should format summary with only missing issues', () => {
      const summary = {
        totalMissing: 5,
        totalUnused: 0,
        totalUndocumented: 0
      };

      const result = formatSummaryNotice(summary);

      assert.equal(result, '::notice::Environment check completed - 5 missing');
    });

    it('should format summary with only unused issues', () => {
      const summary = {
        totalMissing: 0,
        totalUnused: 3,
        totalUndocumented: 0
      };

      const result = formatSummaryNotice(summary);

      assert.equal(result, '::notice::Environment check completed - 3 unused');
    });

    it('should format summary with only undocumented issues', () => {
      const summary = {
        totalMissing: 0,
        totalUnused: 0,
        totalUndocumented: 4
      };

      const result = formatSummaryNotice(summary);

      assert.equal(result, '::notice::Environment check completed - 4 undocumented');
    });

    it('should format summary with no issues', () => {
      const summary = {
        totalMissing: 0,
        totalUnused: 0,
        totalUndocumented: 0
      };

      const result = formatSummaryNotice(summary);

      assert.equal(result, '::notice::Environment check passed - no issues found');
    });

    it('should format summary with missing and unused only', () => {
      const summary = {
        totalMissing: 1,
        totalUnused: 2,
        totalUndocumented: 0
      };

      const result = formatSummaryNotice(summary);

      assert.equal(result, '::notice::Environment check completed - 1 missing, 2 unused');
    });
  });

  describe('formatGitHub', () => {
    it('should format complete analysis result', () => {
      const result = {
        missing: [
          {
            varName: 'DATABASE_URL',
            references: [
              { filePath: 'src/db.js', lineNumber: 10, pattern: 'process.env.DATABASE_URL' }
            ]
          }
        ],
        unused: [
          {
            varName: 'LEGACY_VAR',
            definition: {
              lineNumber: 5,
              hasComment: true,
              comment: 'Old'
            }
          }
        ],
        undocumented: [
          {
            varName: 'API_KEY',
            definition: {
              lineNumber: 3,
              hasComment: false,
              comment: null
            }
          }
        ],
        summary: {
          totalMissing: 1,
          totalUnused: 1,
          totalUndocumented: 1
        }
      };

      const output = formatGitHub(result);
      const lines = output.split('\n');

      assert.equal(lines.length, 4); // 1 error + 1 warning + 1 warning + 1 notice
      assert.ok(lines[0].startsWith('::error'));
      assert.ok(lines[0].includes('DATABASE_URL'));
      assert.ok(lines[1].startsWith('::warning'));
      assert.ok(lines[1].includes('LEGACY_VAR'));
      assert.ok(lines[2].startsWith('::warning'));
      assert.ok(lines[2].includes('API_KEY'));
      assert.ok(lines[3].startsWith('::notice'));
    });

    it('should format result with no issues', () => {
      const result = {
        missing: [],
        unused: [],
        undocumented: [],
        summary: {
          totalMissing: 0,
          totalUnused: 0,
          totalUndocumented: 0
        }
      };

      const output = formatGitHub(result);

      assert.equal(output, '::notice::Environment check passed - no issues found');
    });

    it('should format result with multiple missing references', () => {
      const result = {
        missing: [
          {
            varName: 'API_KEY',
            references: [
              { filePath: 'src/api.js', lineNumber: 5, pattern: 'process.env.API_KEY' },
              { filePath: 'src/auth.js', lineNumber: 10, pattern: 'process.env.API_KEY' }
            ]
          }
        ],
        unused: [],
        undocumented: [],
        summary: {
          totalMissing: 1,
          totalUnused: 0,
          totalUndocumented: 0
        }
      };

      const output = formatGitHub(result);
      const lines = output.split('\n');

      assert.equal(lines.length, 3); // 2 errors + 1 notice
      assert.ok(lines[0].includes('src/api.js'));
      assert.ok(lines[1].includes('src/auth.js'));
    });

    it('should format result with only unused variables', () => {
      const result = {
        missing: [],
        unused: [
          {
            varName: 'VAR1',
            definition: { lineNumber: 1, hasComment: false, comment: null }
          },
          {
            varName: 'VAR2',
            definition: { lineNumber: 2, hasComment: false, comment: null }
          }
        ],
        undocumented: [],
        summary: {
          totalMissing: 0,
          totalUnused: 2,
          totalUndocumented: 0
        }
      };

      const output = formatGitHub(result);
      const lines = output.split('\n');

      assert.equal(lines.length, 3); // 2 warnings + 1 notice
      assert.ok(lines[0].includes('VAR1'));
      assert.ok(lines[1].includes('VAR2'));
      assert.ok(lines[2].includes('2 unused'));
    });

    it('should format complex real-world scenario', () => {
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
              comment: 'Deprecated'
            }
          }
        ],
        undocumented: [
          {
            varName: 'API_SECRET',
            definition: {
              lineNumber: 3,
              hasComment: false,
              comment: null
            }
          },
          {
            varName: 'JWT_EXPIRY',
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
          totalUndocumented: 2
        }
      };

      const output = formatGitHub(result);
      const lines = output.split('\n');

      // 3 errors (2 for DATABASE_URL, 1 for REDIS_HOST) + 1 warning (unused) + 2 warnings (undocumented) + 1 notice
      assert.equal(lines.length, 7);
      
      // Check errors
      assert.ok(lines[0].includes('::error'));
      assert.ok(lines[0].includes('DATABASE_URL'));
      assert.ok(lines[1].includes('::error'));
      assert.ok(lines[1].includes('DATABASE_URL'));
      assert.ok(lines[2].includes('::error'));
      assert.ok(lines[2].includes('REDIS_HOST'));
      
      // Check warnings
      assert.ok(lines[3].includes('::warning'));
      assert.ok(lines[3].includes('LEGACY_API_KEY'));
      assert.ok(lines[4].includes('::warning'));
      assert.ok(lines[4].includes('API_SECRET'));
      assert.ok(lines[5].includes('::warning'));
      assert.ok(lines[5].includes('JWT_EXPIRY'));
      
      // Check notice
      assert.ok(lines[6].includes('::notice'));
      assert.ok(lines[6].includes('2 missing, 1 unused, 2 undocumented'));
    });

    it('should handle special characters in file paths', () => {
      const result = {
        missing: [
          {
            varName: 'TEST_VAR',
            references: [
              { filePath: 'C:\\Users\\test\\src\\app.js', lineNumber: 1, pattern: 'process.env.TEST_VAR' }
            ]
          }
        ],
        unused: [],
        undocumented: [],
        summary: {
          totalMissing: 1,
          totalUnused: 0,
          totalUndocumented: 0
        }
      };

      const output = formatGitHub(result);

      assert.ok(output.includes('C%3A\\Users\\test\\src\\app.js'));
    });
  });
});
