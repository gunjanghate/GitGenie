import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import simpleGit from 'simple-git';
import { stageAllFiles } from '../helpers/gitUtils.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function withTempRepo(run) {
  const dir = await mkdtemp(join(tmpdir(), 'gitgenie-stage-'));
  const prevCwd = process.cwd();
  try {
    process.chdir(dir);
    execSync('git init', { stdio: 'ignore' });
    execSync('git config user.name "Test User"', { stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { stdio: 'ignore' });
    await run(dir);
  } finally {
    process.chdir(prevCwd);
    await rm(dir, { recursive: true, force: true });
  }
}
async function testStagesDotfilesAndRegularFiles() {
  await withTempRepo(async () => {
    await writeFile('.prettierrc', '{}');
    await writeFile('README.md', 'hello');

    await stageAllFiles();

    const status = await simpleGit().status();
    assert(status.staged.includes('.prettierrc'), '.prettierrc should be staged');
    assert(status.staged.includes('README.md'), 'README.md should be staged');
  });
}

async function testStagesDeletions() {
  await withTempRepo(async () => {
    await writeFile('README.md', 'hello');
    execSync('git add README.md', { stdio: 'ignore' });
    execSync('git commit -m "init"', { stdio: 'ignore' });

    execSync('git rm --cached README.md', { stdio: 'ignore' });
    await rm(join(process.cwd(), 'README.md'), { force: true });

    await stageAllFiles();

    const status = await simpleGit().status();
    assert(status.staged.includes('README.md'), 'README.md deletion should be staged');
  });
}

let passed = 0;
let failed = 0;

for (const [name, fn] of [
  ['stages dotfiles and regular files', testStagesDotfilesAndRegularFiles],
  ['stages deletions', testStagesDeletions],
]) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`);
    failed++;
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`\n${passed} passed, ${failed} failed`);
