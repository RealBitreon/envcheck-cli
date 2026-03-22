#!/usr/bin/env node

/**
 * Simple benchmark script for envcheck-cli
 * Measures scanning performance on different project sizes
 */

import { performance } from 'node:perf_hooks';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const TEMP_DIR = './benchmark-temp';
const TARGETS = {
  scanTimeMs: 2000,
  memoryMb: 500,
  startupMs: 100,
};

function createTestFiles(count, linesPerFile) {
  mkdirSync(TEMP_DIR, { recursive: true });
  
  for (let i = 0; i < count; i++) {
    const content = Array(linesPerFile)
      .fill(0)
      .map((_, j) => `const var${j} = process.env.TEST_VAR_${i}_${j};`)
      .join('\n');
    
    writeFileSync(join(TEMP_DIR, `file${i}.js`), content);
  }
}

function cleanup() {
  rmSync(TEMP_DIR, { recursive: true, force: true });
}

async function runBenchmark(fileCount, linesPerFile) {
  console.log(`\nBenchmark: ${fileCount} files × ${linesPerFile} lines`);
  
  createTestFiles(fileCount, linesPerFile);
  
  const start = performance.now();
  const { scanDirectory } = await import('../src/scanner.js');
  await scanDirectory(TEMP_DIR);
  
  const end = performance.now();
  const duration = (end - start).toFixed(2);
  
  console.log(`  Time: ${duration}ms`);
  console.log(`  Throughput: ${(fileCount / (duration / 1000)).toFixed(0)} files/sec`);
  
  cleanup();
}

async function validateTargets() {
  console.log('\nPerformance target validation');
  console.log('=============================');

  cleanup();
  createTestFiles(10000, 3);
  const envPath = join(TEMP_DIR, '.env.example');
  writeFileSync(envPath, 'TEST_VAR_0_0=value\n');

  const { run } = await import('../src/cli.js');

  let peakRss = process.memoryUsage().rss;
  const sampler = setInterval(() => {
    peakRss = Math.max(peakRss, process.memoryUsage().rss);
  }, 5);

  const scanStart = performance.now();
  const exitCode = await run([TEMP_DIR, '--env-file', envPath, '--fail-on', 'none', '--quiet']);
  const scanDuration = performance.now() - scanStart;
  clearInterval(sampler);
  peakRss = Math.max(peakRss, process.memoryUsage().rss);

  const startupStart = performance.now();
  const startupResult = spawnSync(process.execPath, ['bin/envcheck.js', '--help'], { encoding: 'utf-8' });
  const startupDuration = performance.now() - startupStart;

  const memoryMb = peakRss / (1024 * 1024);
  const scanPass = scanDuration < TARGETS.scanTimeMs;
  const memoryPass = memoryMb < TARGETS.memoryMb;
  const startupPass = startupDuration < TARGETS.startupMs;
  const cliPass = startupResult.status === 0 && exitCode === 0;

  console.log(`10,000 files scan time: ${scanDuration.toFixed(2)}ms (${scanPass ? 'PASS' : 'FAIL'})`);
  console.log(`Peak RSS memory: ${memoryMb.toFixed(2)}MB (${memoryPass ? 'PASS' : 'FAIL'})`);
  console.log(`CLI startup (--help): ${startupDuration.toFixed(2)}ms (${startupPass ? 'PASS' : 'FAIL'})`);

  if (!cliPass) {
    console.log('CLI execution status: FAIL');
    if (startupResult.stderr) {
      console.log(startupResult.stderr.trim());
    }
  } else {
    console.log('CLI execution status: PASS');
  }

  cleanup();

  if (!(scanPass && memoryPass && startupPass && cliPass)) {
    process.exitCode = 1;
  }
}

async function main() {
  console.log('envcheck-cli Performance Benchmark');
  console.log('==================================');
  
  await runBenchmark(10, 100);
  await runBenchmark(50, 100);
  await runBenchmark(100, 100);
  await runBenchmark(100, 500);
  await validateTargets();
  
  console.log('\n✓ Benchmark complete');
}

main().catch(console.error);
