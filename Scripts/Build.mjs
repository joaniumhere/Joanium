/**
 * Build.mjs — Full build orchestrator for Joanium.
 *
 * Steps:
 *   1. Set version from date           (SetVersionByDate.mjs)
 *   2. Copy files to dist/package      (staging directory)
 *   3. Install dependencies in staging (npm install)
 *   4. Minify files in staging         (Minify.mjs)
 *   5. Package with electron-builder
 *   6. Move output artifacts to dist/ and remove dist/package
 *
 * Usage:
 *   node Scripts/Build.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACKAGE_DIR = path.resolve(ROOT, 'dist', 'package');

function run(cmd, cwd = ROOT) {
  console.log(`\n[Build] > ${cmd}\n`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// ── Step 1: Version ────────────────────────────────────────────────────────────

console.log('╔══════════════════════════════════════╗');
console.log('║     Joanium — Production Build       ║');
console.log('╚══════════════════════════════════════╝');

run('node ./Scripts/SetVersionByDate.mjs');

// ── Step 2: Copy to dist/package ───────────────────────────────────────────────

console.log('\n[Build] Preparing staging directory at dist/package...');

if (fs.existsSync(PACKAGE_DIR)) {
  fs.rmSync(PACKAGE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(PACKAGE_DIR, { recursive: true });

const IGNORE_DIRS = new Set(['.git', 'dist', 'node_modules', '.github']);

for (const entry of fs.readdirSync(ROOT)) {
  if (IGNORE_DIRS.has(entry)) continue;
  
  const src = path.join(ROOT, entry);
  const dest = path.join(PACKAGE_DIR, entry);
  
  fs.cpSync(src, dest, { recursive: true });
}

// ── Step 3: Install dependencies in staging ────────────────────────────────────

console.log('\n[Build] Installing dependencies in staging directory...');
run('npm install', PACKAGE_DIR);

// ── Step 4: Minify inside staging ──────────────────────────────────────────────

console.log('\n[Build] Minifying source files in staging directory...');
run('node ./Scripts/Minify.mjs', PACKAGE_DIR);

// ── Step 5: Package ────────────────────────────────────────────────────────────

console.log('\n[Build] Packaging application...');
run('npx electron-builder', PACKAGE_DIR);

// ── Step 6: Move artifacts and cleanup ─────────────────────────────────────────

console.log('\n[Build] Moving artifacts to dist...');
const PACKAGE_DIST = path.join(PACKAGE_DIR, 'dist');
if (fs.existsSync(PACKAGE_DIST)) {
  for (const entry of fs.readdirSync(PACKAGE_DIST)) {
    if (entry.startsWith('builder-') || entry === 'package') continue; // ignore cache and avoid self
    const src = path.join(PACKAGE_DIST, entry);
    const dest = path.join(ROOT, 'dist', entry);
    fs.cpSync(src, dest, { recursive: true });
  }
}

console.log('\n[Build] Cleaning up staging directory...');
fs.rmSync(PACKAGE_DIR, { recursive: true, force: true });

console.log('\n[Build] ✓ Build complete.\n');
