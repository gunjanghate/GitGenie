// Simple test to verify recovery functions work correctly
import { parseReflog } from '../helpers/reflogParser.js';
import { createRecoveryBranch, validateBranchName } from '../helpers/safeBranchOps.js';
import { confirmRecoveryAction } from '../helpers/confirmationPrompt.js';

// Test reflog parsing (read-only operation)
console.log('Testing reflog parsing...');
try {
  const entries = await parseReflog(5);
  console.log(`✅ Found ${entries.length} reflog entries`);
  if (entries.length > 0) {
    console.log(`   First entry: ${entries[0].hash} - ${entries[0].action}`);
  }
} catch (error) {
  console.log(`⚠️  Reflog test: ${error.message}`);
}

// Test branch name validation
console.log('\nTesting branch name validation...');
const testNames = [
  'recovery-2024-01-03',
  'invalid name with spaces',
  'valid-branch-name',
  'invalid~branch',
  ''
];

for (const name of testNames) {
  const isValid = await validateBranchName(name);
  console.log(`   "${name}": ${isValid ? '✅ valid' : '❌ invalid'}`);
}

console.log('\n🎉 Recovery system tests completed');
console.log('💡 All operations are read-only and safe');