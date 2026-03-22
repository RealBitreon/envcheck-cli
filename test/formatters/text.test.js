import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatText,
  hasNoIssues,
  formatMissingSection,
  formatUnusedSection,
  formatUndocumentedSection,
  formatSummary,
  colorize
} from '../../src/formatters/text.js';

describe('Text Formatter', () => {
  describe('hasNoIssues()', () => {
    it('should return true when no issues exist', () => {
      const result = {
        missing: [],
        unused: [],
        undocumented: []
      };
      
      assert.strictEqual(hasNoIssues(result), true);
    });
    
    it('should return false when missing issues exist', () => {
      const result = {
        missing: [{ varName: 'TEST', references: [] }],
        unused: [],
        undocumented: []
      };
      
      assert.strictEqual(hasNoIssues(result), false);
    });
    
    it('should return false when unused issues exist', () => {
      const result = {
        missing: [],
        unused: [{ varName: 'TEST', definition: {} }],
        undocumented: []
      };
      
      assert.strictEqual(hasNoIssues(result), false);
    });
    
    it('should return false when undocumented issues exist', () => {
      const result = {
        missing: [],
        unused: [],
        undocumented: [{ varName: 'TEST', references: [], definition: {} }]
      };
      
      assert.strictEqual(hasNoIssues(result), false);
    });
  });
  
  describe('colorize()', () => {
    it('should apply ANSI color codes when noColor is false', () => {
      const result = colorize('test', '\x1b[31m', false);
      
      assert.ok(result.includes('\x1b[31m'));
      assert.ok(result.includes('\x1b[0m'));
      assert.ok(result.includes('test'));
    });
    
    it('should return plain text when noColor is true', () => {
      const result = colorize('test', '\x1b[31m', true);
      
      assert.strictEqual(result, 'test');
      assert.ok(!result.includes('\x1b['));
    });
  });
  
  describe('formatMissingSection()', () => {
    it('should format missing variables with references', () => {
      const missing = [
        {
          varName: 'DATABASE_URL',
          references: [
            { filePath: 'src/db.js', lineNumber: 10, pattern: 'process.env.DATABASE_URL' },
            { filePath: 'src/config.js', lineNumber: 5, pattern: 'process.env.DATABASE_URL' }
          ]
        }
      ];
      
      const output = formatMissingSection(missing, true);
      
      assert.ok(output.includes('🔴'));
      assert.ok(output.includes('MISSING'));
      assert.ok(output.includes('(1)'));
      assert.ok(output.includes('DATABASE_URL'));
      assert.ok(output.includes('src/db.js:10'));
      assert.ok(output.includes('src/config.js:5'));
      assert.ok(output.includes('→'));
    });
    
    it('should format multiple missing variables', () => {
      const missing = [
        {
          varName: 'API_KEY',
          references: [
            { filePath: 'src/api.js', lineNumber: 3, pattern: 'process.env.API_KEY' }
          ]
        },
        {
          varName: 'SECRET',
          references: [
            { filePath: 'src/auth.js', lineNumber: 7, pattern: 'process.env.SECRET' }
          ]
        }
      ];
      
      const output = formatMissingSection(missing, true);
      
      assert.ok(output.includes('(2)'));
      assert.ok(output.includes('API_KEY'));
      assert.ok(output.includes('SECRET'));
    });
    
    it('should not include ANSI codes when noColor is true', () => {
      const missing = [
        {
          varName: 'TEST',
          references: [
            { filePath: 'test.js', lineNumber: 1, pattern: 'process.env.TEST' }
          ]
        }
      ];
      
      const output = formatMissingSection(missing, true);
      
      assert.ok(!output.includes('\x1b['));
    });
  });
  
  describe('formatUnusedSection()', () => {
    it('should format unused variables with line numbers', () => {
      const unused = [
        {
          varName: 'LEGACY_KEY',
          definition: { lineNumber: 15, hasComment: false, comment: null }
        }
      ];
      
      const output = formatUnusedSection(unused, true);
      
      assert.ok(output.includes('🟡'));
      assert.ok(output.includes('UNUSED'));
      assert.ok(output.includes('(1)'));
      assert.ok(output.includes('LEGACY_KEY'));
      assert.ok(output.includes('.env.example:15'));
    });
    
    it('should format multiple unused variables', () => {
      const unused = [
        {
          varName: 'OLD_VAR',
          definition: { lineNumber: 5, hasComment: false, comment: null }
        },
        {
          varName: 'DEPRECATED',
          definition: { lineNumber: 10, hasComment: true, comment: 'Old config' }
        }
      ];
      
      const output = formatUnusedSection(unused, true);
      
      assert.ok(output.includes('(2)'));
      assert.ok(output.includes('OLD_VAR'));
      assert.ok(output.includes('DEPRECATED'));
    });
  });
  
  describe('formatUndocumentedSection()', () => {
    it('should format undocumented variables', () => {
      const undocumented = [
        {
          varName: 'API_SECRET',
          references: [
            { filePath: 'src/api.js', lineNumber: 5, pattern: 'process.env.API_SECRET' }
          ],
          definition: { lineNumber: 8, hasComment: false, comment: null }
        }
      ];
      
      const output = formatUndocumentedSection(undocumented, true);
      
      assert.ok(output.includes('🟢'));
      assert.ok(output.includes('UNDOCUMENTED'));
      assert.ok(output.includes('(1)'));
      assert.ok(output.includes('API_SECRET'));
      assert.ok(output.includes('.env.example:8'));
    });
    
    it('should format multiple undocumented variables', () => {
      const undocumented = [
        {
          varName: 'VAR1',
          references: [{ filePath: 'a.js', lineNumber: 1, pattern: 'process.env.VAR1' }],
          definition: { lineNumber: 2, hasComment: false, comment: null }
        },
        {
          varName: 'VAR2',
          references: [{ filePath: 'b.js', lineNumber: 3, pattern: 'process.env.VAR2' }],
          definition: { lineNumber: 4, hasComment: false, comment: null }
        }
      ];
      
      const output = formatUndocumentedSection(undocumented, true);
      
      assert.ok(output.includes('(2)'));
      assert.ok(output.includes('VAR1'));
      assert.ok(output.includes('VAR2'));
    });
  });
  
  describe('formatSummary()', () => {
    it('should format summary with all issue types', () => {
      const summary = {
        totalMissing: 2,
        totalUnused: 1,
        totalUndocumented: 3
      };
      
      const output = formatSummary(summary, true);
      
      assert.ok(output.includes('Summary:'));
      assert.ok(output.includes('2 missing'));
      assert.ok(output.includes('1 unused'));
      assert.ok(output.includes('3 undocumented'));
    });
    
    it('should format summary with only missing issues', () => {
      const summary = {
        totalMissing: 5,
        totalUnused: 0,
        totalUndocumented: 0
      };
      
      const output = formatSummary(summary, true);
      
      assert.ok(output.includes('5 missing'));
      assert.ok(!output.includes('unused'));
      assert.ok(!output.includes('undocumented'));
    });
    
    it('should format summary with only unused issues', () => {
      const summary = {
        totalMissing: 0,
        totalUnused: 3,
        totalUndocumented: 0
      };
      
      const output = formatSummary(summary, true);
      
      assert.ok(output.includes('3 unused'));
      assert.ok(!output.includes('missing'));
      assert.ok(!output.includes('undocumented'));
    });
    
    it('should show success message when no issues', () => {
      const summary = {
        totalMissing: 0,
        totalUnused: 0,
        totalUndocumented: 0
      };
      
      const output = formatSummary(summary, true);
      
      assert.ok(output.includes('✓'));
      assert.ok(output.includes('No issues found'));
    });
  });
  
  describe('formatText()', () => {
    it('should format complete analysis result', () => {
      const result = {
        missing: [
          {
            varName: 'DB_URL',
            references: [
              { filePath: 'db.js', lineNumber: 5, pattern: 'process.env.DB_URL' }
            ]
          }
        ],
        unused: [
          {
            varName: 'OLD_KEY',
            definition: { lineNumber: 10, hasComment: false, comment: null }
          }
        ],
        undocumented: [
          {
            varName: 'SECRET',
            references: [
              { filePath: 'auth.js', lineNumber: 3, pattern: 'process.env.SECRET' }
            ],
            definition: { lineNumber: 7, hasComment: false, comment: null }
          }
        ],
        summary: {
          totalMissing: 1,
          totalUnused: 1,
          totalUndocumented: 1
        }
      };
      
      const output = formatText(result, { noColor: true });
      
      assert.ok(output.includes('MISSING'));
      assert.ok(output.includes('UNUSED'));
      assert.ok(output.includes('UNDOCUMENTED'));
      assert.ok(output.includes('Summary:'));
      assert.ok(output.includes('DB_URL'));
      assert.ok(output.includes('OLD_KEY'));
      assert.ok(output.includes('SECRET'));
    });
    
    it('should return empty string in quiet mode with no issues', () => {
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
      
      const output = formatText(result, { quiet: true });
      
      assert.strictEqual(output, '');
    });
    
    it('should return output in quiet mode with issues', () => {
      const result = {
        missing: [
          {
            varName: 'TEST',
            references: [
              { filePath: 'test.js', lineNumber: 1, pattern: 'process.env.TEST' }
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
      
      const output = formatText(result, { quiet: true, noColor: true });
      
      assert.ok(output.length > 0);
      assert.ok(output.includes('TEST'));
    });
    
    it('should include ANSI codes when noColor is false', () => {
      const result = {
        missing: [
          {
            varName: 'TEST',
            references: [
              { filePath: 'test.js', lineNumber: 1, pattern: 'process.env.TEST' }
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
      
      const output = formatText(result, { noColor: false });
      
      assert.ok(output.includes('\x1b['));
    });
    
    it('should not include ANSI codes when noColor is true', () => {
      const result = {
        missing: [
          {
            varName: 'TEST',
            references: [
              { filePath: 'test.js', lineNumber: 1, pattern: 'process.env.TEST' }
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
      
      const output = formatText(result, { noColor: true });
      
      assert.ok(!output.includes('\x1b['));
    });
    
    it('should handle empty result gracefully', () => {
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
      
      const output = formatText(result, { noColor: true });
      
      assert.ok(output.includes('No issues found'));
    });
  });
});
