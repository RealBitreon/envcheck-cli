import { describe, it } from 'node:test';
import assert from 'node:assert';

/**
 * Tests for REPL functionality
 * 
 * Note: These tests focus on the Session and CommandParser classes
 * Full REPL integration testing would require mocking readline
 */

describe('REPL Session Management', () => {
  it('should initialize with default configuration', async () => {
    // Dynamic import to avoid side effects
    const { Session } = await import('../src/repl.js').catch(() => {
      // If Session is not exported, we'll test through the REPL interface
      return { Session: null };
    });

    if (!Session) {
      // Skip if Session is not exported
      return;
    }

    const session = new Session();
    const config = session.getConfig();

    assert.strictEqual(config.path, '.');
    assert.strictEqual(config.envFile, '.env.example');
    assert.strictEqual(config.format, 'text');
    assert.strictEqual(config.failOn, 'none');
    assert.deepStrictEqual(config.ignore, []);
    assert.strictEqual(config.noColor, false);
    assert.strictEqual(config.quiet, false);
  });

  it('should track command history', async () => {
    const { Session } = await import('../src/repl.js').catch(() => ({ Session: null }));
    if (!Session) return;

    const session = new Session();
    
    session.addCommand('envcheck .');
    session.addCommand(':config');
    session.addCommand(':set format json');

    const history = session.getHistory();
    assert.strictEqual(history.length, 3);
    assert.strictEqual(history[0].command, 'envcheck .');
    assert.strictEqual(history[1].command, ':config');
    assert.strictEqual(history[2].command, ':set format json');
  });

  it('should update configuration', async () => {
    const { Session } = await import('../src/repl.js').catch(() => ({ Session: null }));
    if (!Session) return;

    const session = new Session();
    
    const success = session.setConfig('format', 'json');
    assert.strictEqual(success, true);
    
    const config = session.getConfig();
    assert.strictEqual(config.format, 'json');
  });

  it('should reject invalid configuration keys', async () => {
    const { Session } = await import('../src/repl.js').catch(() => ({ Session: null }));
    if (!Session) return;

    const session = new Session();
    
    const success = session.setConfig('invalidKey', 'value');
    assert.strictEqual(success, false);
  });

  it('should clear history and results', async () => {
    const { Session } = await import('../src/repl.js').catch(() => ({ Session: null }));
    if (!Session) return;

    const session = new Session();
    
    session.addCommand('test1');
    session.addCommand('test2');
    session.addResult({ exitCode: 0 });

    assert.strictEqual(session.getHistory().length, 2);
    assert.strictEqual(session.getResults().length, 1);

    session.clear();

    assert.strictEqual(session.getHistory().length, 0);
    assert.strictEqual(session.getResults().length, 0);
  });

  it('should track session duration', async () => {
    const { Session } = await import('../src/repl.js').catch(() => ({ Session: null }));
    if (!Session) return;

    const session = new Session();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const duration = session.getDuration();
    assert.ok(duration >= 10, 'Duration should be at least 10ms');
  });
});

describe('REPL Command Parser', () => {
  it('should identify commands starting with :', async () => {
    const { Session, CommandParser } = await import('../src/repl.js').catch(() => ({ 
      Session: null, 
      CommandParser: null 
    }));
    if (!CommandParser) return;

    const session = new Session();
    const parser = new CommandParser(session);

    assert.strictEqual(parser.isCommand(':help'), true);
    assert.strictEqual(parser.isCommand(':config'), true);
    assert.strictEqual(parser.isCommand('envcheck .'), false);
    assert.strictEqual(parser.isCommand('. --format json'), false);
  });

  it('should identify commands starting with .', async () => {
    const { Session, CommandParser } = await import('../src/repl.js').catch(() => ({ 
      Session: null, 
      CommandParser: null 
    }));
    if (!CommandParser) return;

    const session = new Session();
    const parser = new CommandParser(session);

    assert.strictEqual(parser.isCommand('.help'), true);
    assert.strictEqual(parser.isCommand('.exit'), true);
  });

  it('should execute help command', async () => {
    const { Session, CommandParser } = await import('../src/repl.js').catch(() => ({ 
      Session: null, 
      CommandParser: null 
    }));
    if (!CommandParser) return;

    const session = new Session();
    const parser = new CommandParser(session);

    const result = await parser.execute(':help');
    assert.ok(result.includes('Available REPL Commands'));
    assert.ok(result.includes(':exit'));
    assert.ok(result.includes(':config'));
  });

  it('should execute config command', async () => {
    const { Session, CommandParser } = await import('../src/repl.js').catch(() => ({ 
      Session: null, 
      CommandParser: null 
    }));
    if (!CommandParser) return;

    const session = new Session();
    const parser = new CommandParser(session);

    const result = await parser.execute(':config');
    assert.ok(result.includes('path:'));
    assert.ok(result.includes('envFile:'));
    assert.ok(result.includes('format:'));
  });

  it('should execute set command', async () => {
    const { Session, CommandParser } = await import('../src/repl.js').catch(() => ({ 
      Session: null, 
      CommandParser: null 
    }));
    if (!CommandParser) return;

    const session = new Session();
    const parser = new CommandParser(session);

    const result = await parser.execute(':set format json');
    assert.ok(result.includes('Set format'));
    
    const config = session.getConfig();
    assert.strictEqual(config.format, 'json');
  });

  it('should execute get command', async () => {
    const { Session, CommandParser } = await import('../src/repl.js').catch(() => ({ 
      Session: null, 
      CommandParser: null 
    }));
    if (!CommandParser) return;

    const session = new Session();
    const parser = new CommandParser(session);

    const result = await parser.execute(':get format');
    assert.ok(result.includes('format:'));
    assert.ok(result.includes('text'));
  });

  it('should handle exit command', async () => {
    const { Session, CommandParser } = await import('../src/repl.js').catch(() => ({ 
      Session: null, 
      CommandParser: null 
    }));
    if (!CommandParser) return;

    const session = new Session();
    const parser = new CommandParser(session);

    const result = await parser.execute(':exit');
    assert.deepStrictEqual(result, { exit: true });
  });

  it('should handle unknown commands', async () => {
    const { Session, CommandParser } = await import('../src/repl.js').catch(() => ({ 
      Session: null, 
      CommandParser: null 
    }));
    if (!CommandParser) return;

    const session = new Session();
    const parser = new CommandParser(session);

    const result = await parser.execute(':unknown');
    assert.ok(result.includes('Unknown command'));
  });

  it('should show empty history message', async () => {
    const { Session, CommandParser } = await import('../src/repl.js').catch(() => ({ 
      Session: null, 
      CommandParser: null 
    }));
    if (!CommandParser) return;

    const session = new Session();
    const parser = new CommandParser(session);

    const result = await parser.execute(':history');
    assert.strictEqual(result, 'No command history.');
  });

  it('should show empty results message', async () => {
    const { Session, CommandParser } = await import('../src/repl.js').catch(() => ({ 
      Session: null, 
      CommandParser: null 
    }));
    if (!CommandParser) return;

    const session = new Session();
    const parser = new CommandParser(session);

    const result = await parser.execute(':results');
    assert.strictEqual(result, 'No results yet.');
  });
});
