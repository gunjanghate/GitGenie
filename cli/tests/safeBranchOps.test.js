import { validateBranchName } from '../helpers/safeBranchOps.js';

console.log('Running validateBranchName unit tests...');
let passed = 0, failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.log(`❌ ${message}`);
    failed++;
  }
}

async function assertThrows(fn, message) {
  try {
    await fn();
    console.log(`❌ ${message} (expected throw, but none occurred)`);
    failed++;
  } catch (err) {
    console.log(`✅ ${message}`);
    passed++;
  }
}

// Test 1: invalid input types return false, not throw
assert((await validateBranchName(null)) === false, 'null branchName returns false');
assert((await validateBranchName('')) === false, 'empty string returns false');

// Test 2: invalid characters return false
assert((await validateBranchName('bad name')) === false, 'branch name with space returns false');
assert((await validateBranchName('bad~name')) === false, 'branch name with ~ returns false');

// Test 3: a genuinely available name inside this real repo returns true
const available = await validateBranchName('totally-new-unique-branch-name-xyz-123');
assert(available === true, 'available branch name in a real git repo returns true');

// Test 4: an existing branch (main) returns false
const existsResult = await validateBranchName('main');
assert(existsResult === false, 'existing branch "main" returns false');

console.log('='.repeat(50));
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));
if (failed > 0) process.exit(1);
console.log('✨ All safeBranchOps tests passed! ✨');
