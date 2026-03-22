import { describe, it } from 'node:test';
import { formatText } from '../../src/formatters/text.js';

describe('Text Formatter Visual Output', () => {
  it('should display formatted output with colors', () => {
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
          definition: { lineNumber: 15, hasComment: true, comment: 'Deprecated API key' }
        }
      ],
      undocumented: [
        {
          varName: 'API_SECRET',
          references: [
            { filePath: 'src/api/client.js', lineNumber: 3, pattern: 'process.env.API_SECRET' }
          ],
          definition: { lineNumber: 8, hasComment: false, comment: null }
        },
        {
          varName: 'JWT_EXPIRY',
          references: [
            { filePath: 'src/auth/jwt.js', lineNumber: 10, pattern: 'process.env.JWT_EXPIRY' }
          ],
          definition: { lineNumber: 12, hasComment: false, comment: null }
        },
        {
          varName: 'LOG_LEVEL',
          references: [
            { filePath: 'src/logger.js', lineNumber: 5, pattern: 'process.env.LOG_LEVEL' }
          ],
          definition: { lineNumber: 20, hasComment: false, comment: null }
        }
      ],
      summary: {
        totalMissing: 2,
        totalUnused: 1,
        totalUndocumented: 3,
        totalReferences: 15,
        totalDefinitions: 14
      }
    };
    
    console.log('\n--- WITH COLORS ---');
    console.log(formatText(result, { noColor: false }));
    
    console.log('\n\n--- WITHOUT COLORS ---');
    console.log(formatText(result, { noColor: true }));
    
    console.log('\n\n--- QUIET MODE (with issues) ---');
    console.log(formatText(result, { quiet: true, noColor: true }));
    
    console.log('\n\n--- QUIET MODE (no issues) ---');
    const emptyResult = {
      missing: [],
      unused: [],
      undocumented: [],
      summary: {
        totalMissing: 0,
        totalUnused: 0,
        totalUndocumented: 0,
        totalReferences: 10,
        totalDefinitions: 10
      }
    };
    const quietOutput = formatText(emptyResult, { quiet: true, noColor: true });
    console.log(quietOutput === '' ? '(empty string)' : quietOutput);
    
    console.log('\n\n--- NO ISSUES ---');
    console.log(formatText(emptyResult, { noColor: true }));
  });
});
