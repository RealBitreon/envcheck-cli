/**
 * Progress indicators and spinners for CLI operations
 */

/**
 * Simple spinner for long-running operations
 */
export class Spinner {
  constructor(message = 'Processing...') {
    this.message = message;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.currentFrame = 0;
    this.interval = null;
    this.isSpinning = false;
  }

  start() {
    if (this.isSpinning) return;
    
    this.isSpinning = true;
    this.currentFrame = 0;
    
    // Hide cursor
    process.stdout.write('\x1B[?25l');
    
    this.interval = setInterval(() => {
      const frame = this.frames[this.currentFrame];
      process.stdout.write(`\r${frame} ${this.message}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  update(message) {
    this.message = message;
  }

  succeed(message) {
    this.stop();
    process.stdout.write(`\r✓ ${message || this.message}\n`);
  }

  fail(message) {
    this.stop();
    process.stdout.write(`\r✗ ${message || this.message}\n`);
  }

  warn(message) {
    this.stop();
    process.stdout.write(`\r⚠ ${message || this.message}\n`);
  }

  info(message) {
    this.stop();
    process.stdout.write(`\rℹ ${message || this.message}\n`);
  }

  stop() {
    if (!this.isSpinning) return;
    
    this.isSpinning = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    // Clear line and show cursor
    process.stdout.write('\r\x1B[K');
    process.stdout.write('\x1B[?25h');
  }
}

/**
 * Progress bar for file scanning
 */
export class ProgressBar {
  constructor(total, message = 'Progress') {
    this.total = total;
    this.current = 0;
    this.message = message;
    this.width = 40;
    this.startTime = Date.now();
  }

  update(current, message) {
    this.current = current;
    if (message) this.message = message;
    this.render();
  }

  increment(message) {
    this.current++;
    if (message) this.message = message;
    this.render();
  }

  render() {
    const percentage = Math.min(100, Math.floor((this.current / this.total) * 100));
    const filled = Math.floor((this.current / this.total) * this.width);
    const empty = this.width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const rate = this.current / elapsed || 0;
    const eta = this.current > 0 ? Math.floor((this.total - this.current) / rate) : 0;
    
    process.stdout.write(
      `\r${this.message}: [${bar}] ${percentage}% (${this.current}/${this.total}) ETA: ${eta}s`
    );
  }

  complete(message) {
    this.current = this.total;
    this.render();
    process.stdout.write(`\n✓ ${message || 'Complete'}\n`);
  }
}

/**
 * Multi-line progress display for concurrent operations
 */
export class MultiProgress {
  constructor() {
    this.tasks = new Map();
    this.lineCount = 0;
  }

  addTask(id, message) {
    this.tasks.set(id, {
      message,
      status: 'pending',
      spinner: 0,
    });
    this.render();
  }

  updateTask(id, status, message) {
    const task = this.tasks.get(id);
    if (task) {
      task.status = status;
      if (message) task.message = message;
      this.render();
    }
  }

  render() {
    // Move cursor up to overwrite previous output
    if (this.lineCount > 0) {
      process.stdout.write(`\x1B[${this.lineCount}A`);
    }

    const lines = [];
    for (const [id, task] of this.tasks) {
      const icon = this.getStatusIcon(task.status);
      lines.push(`${icon} ${task.message}`);
    }

    this.lineCount = lines.length;
    process.stdout.write(lines.join('\n') + '\n');
  }

  getStatusIcon(status) {
    const icons = {
      pending: '⋯',
      running: '⠿',
      success: '✓',
      error: '✗',
      warning: '⚠',
    };
    return icons[status] || '•';
  }

  clear() {
    if (this.lineCount > 0) {
      process.stdout.write(`\x1B[${this.lineCount}A`);
      process.stdout.write('\x1B[J');
    }
    this.tasks.clear();
    this.lineCount = 0;
  }
}
