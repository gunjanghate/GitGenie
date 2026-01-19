/**
 * Unit Tests for GitIgnore Helper
 * 
 * Tests for the gitignore helper module functionality including:
 * - Pattern validation
 * - Duplicate detection
 * - File creation and appending
 * - Comment support
 * 
 * To run these tests: node tests/gitignore.test.js
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
    validatePattern,
    checkPatternExists,
    appendToGitignore,
    getGitignorePath
} from '../helpers/gitignoreHelper.js';

// Test directory setup
const TEST_DIR = path.join(os.tmpdir(), 'gitgenie-test-' + Date.now());
const TEST_GITIGNORE = path.join(TEST_DIR, '.gitignore');
let originalCwd = null;

function setup() {
    // Save original working directory
    originalCwd = process.cwd();

    // Create test directory
    if (!fs.existsSync(TEST_DIR)) {
        fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    // Change to test directory
    process.chdir(TEST_DIR);
}

function cleanup() {
    // Restore original working directory first
    if (originalCwd && fs.existsSync(originalCwd)) {
        process.chdir(originalCwd);
    }

    // Remove test directory and contents
    try {
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, { recursive: true, force: true });
        }
    } catch (err) {
        // Ignore cleanup errors (common on Windows due to file locking)
        console.log('\n⚠️  Note: Test cleanup had minor issues (this is normal on Windows)');
    }

    // Clear saved cwd
    originalCwd = null;
}

function runTests() {
    console.log('Running GitIgnore Helper unit tests...\n');
    let passed = 0;
    let failed = 0;

    // Setup test environment
    setup();

    // Test 1: validatePattern - valid pattern
    try {
        const result = validatePattern('node_modules/');
        assert.strictEqual(result.valid, true, 'Valid pattern should pass validation');
        assert.strictEqual(result.error, null, 'Valid pattern should have no error');
        console.log('✅ Test 1 PASSED: validatePattern accepts valid pattern');
        passed++;
    } catch (e) {
        console.log('❌ Test 1 FAILED:', e.message);
        failed++;
    }

    // Test 2: validatePattern - empty pattern
    try {
        const result = validatePattern('');
        assert.strictEqual(result.valid, false, 'Empty pattern should fail validation');
        assert.strictEqual(result.error, 'Pattern cannot be empty', 'Should have correct error message');
        console.log('✅ Test 2 PASSED: validatePattern rejects empty pattern');
        passed++;
    } catch (e) {
        console.log('❌ Test 2 FAILED:', e.message);
        failed++;
    }

    // Test 3: validatePattern - pattern with null byte
    try {
        const result = validatePattern('test\0file');
        assert.strictEqual(result.valid, false, 'Pattern with null byte should fail');
        assert.strictEqual(result.error, 'Pattern contains invalid null byte');
        console.log('✅ Test 3 PASSED: validatePattern rejects null byte');
        passed++;
    } catch (e) {
        console.log('❌ Test 3 FAILED:', e.message);
        failed++;
    }

    // Test 4: validatePattern - pattern with newline
    try {
        const result = validatePattern('test\nfile');
        assert.strictEqual(result.valid, false, 'Pattern with newline should fail');
        assert.strictEqual(result.error, 'Pattern must be a single line');
        console.log('✅ Test 4 PASSED: validatePattern rejects newline');
        passed++;
    } catch (e) {
        console.log('❌ Test 4 FAILED:', e.message);
        failed++;
    }

    // Test 5: validatePattern - too long pattern
    try {
        const longPattern = 'a'.repeat(501);
        const result = validatePattern(longPattern);
        assert.strictEqual(result.valid, false, 'Too long pattern should fail');
        console.log('✅ Test 5 PASSED: validatePattern rejects too long pattern');
        passed++;
    } catch (e) {
        console.log('❌ Test 5 FAILED:', e.message);
        failed++;
    }

    // Test 5: appendToGitignore - create new file
    try {
        const result = appendToGitignore('node_modules/');
        assert.strictEqual(result.success, true, 'Should successfully append pattern');
        assert.strictEqual(fs.existsSync(TEST_GITIGNORE), true, '.gitignore should be created');
        const content = fs.readFileSync(TEST_GITIGNORE, 'utf-8');
        assert.strictEqual(content, 'node_modules/\n', 'Content should match pattern with newline');
        console.log('✅ Test 5 PASSED: appendToGitignore creates new file');
        passed++;
    } catch (e) {
        console.log('❌ Test 5 FAILED:', e.message);
        failed++;
    }

    // Test 6: appendToGitignore - append to existing file
    try {
        const result = appendToGitignore('*.log');
        assert.strictEqual(result.success, true, 'Should successfully append second pattern');
        const content = fs.readFileSync(TEST_GITIGNORE, 'utf-8');
        assert.strictEqual(content, 'node_modules/\n*.log\n', 'Should have both patterns');
        console.log('✅ Test 6 PASSED: appendToGitignore appends to existing file');
        passed++;
    } catch (e) {
        console.log('❌ Test 6 FAILED:', e.message);
        failed++;
    }

    // Test 7: checkPatternExists - detect duplicate
    try {
        const exists = checkPatternExists(TEST_GITIGNORE, 'node_modules/');
        assert.strictEqual(exists, true, 'Should detect existing pattern');
        console.log('✅ Test 7 PASSED: checkPatternExists detects duplicate');
        passed++;
    } catch (e) {
        console.log('❌ Test 7 FAILED:', e.message);
        failed++;
    }

    // Test 8: appendToGitignore - reject duplicate
    try {
        const result = appendToGitignore('node_modules/');
        assert.strictEqual(result.success, false, 'Should reject duplicate pattern');
        assert.ok(result.message.includes('already exists'), 'Error message should mention duplicate');
        console.log('✅ Test 8 PASSED: appendToGitignore rejects duplicate');
        passed++;
    } catch (e) {
        console.log('❌ Test 8 FAILED:', e.message);
        failed++;
    }

    // Test 9: appendToGitignore - with comment
    try {
        const result = appendToGitignore('dist/', { comment: 'Build output' });
        assert.strictEqual(result.success, true, 'Should successfully append with comment');
        const content = fs.readFileSync(TEST_GITIGNORE, 'utf-8');
        assert.ok(content.includes('# Build output'), 'Should include comment');
        assert.ok(content.includes('dist/'), 'Should include pattern');
        console.log('✅ Test 9 PASSED: appendToGitignore adds comment');
        passed++;
    } catch (e) {
        console.log('❌ Test 9 FAILED:', e.message);
        failed++;
    }

    // Test 10: appendToGitignore - trim whitespace
    try {
        const result = appendToGitignore('  .env  ');
        assert.strictEqual(result.success, true, 'Should successfully append trimmed pattern');
        const content = fs.readFileSync(TEST_GITIGNORE, 'utf-8');
        assert.ok(content.includes('.env\n'), 'Should trim whitespace from pattern');
        assert.ok(!content.includes('  .env  '), 'Should not include untrimmed pattern');
        console.log('✅ Test 10 PASSED: appendToGitignore trims whitespace');
        passed++;
    } catch (e) {
        console.log('❌ Test 10 FAILED:', e.message);
        failed++;
    }

    // Test 11: getGitignorePath - local
    try {
        const localPath = getGitignorePath(false);
        assert.strictEqual(localPath, TEST_GITIGNORE, 'Should return local .gitignore path');
        console.log('✅ Test 11 PASSED: getGitignorePath returns local path');
        passed++;
    } catch (e) {
        console.log('❌ Test 11 FAILED:', e.message);
        failed++;
    }

    // Test 12: getGitignorePath - global
    try {
        const globalPath = getGitignorePath(true);
        const expectedPath = path.join(os.homedir(), '.gitignore_global');
        assert.strictEqual(globalPath, expectedPath, 'Should return global .gitignore path');
        console.log('✅ Test 12 PASSED: getGitignorePath returns global path');
        passed++;
    } catch (e) {
        console.log('❌ Test 12 FAILED:', e.message);
        failed++;
    }

    // Test 13: checkPatternExists - non-existent file
    try {
        const exists = checkPatternExists('/nonexistent/path/.gitignore', 'test');
        assert.strictEqual(exists, false, 'Should return false for non-existent file');
        console.log('✅ Test 13 PASSED: checkPatternExists handles non-existent file');
        passed++;
    } catch (e) {
        console.log('❌ Test 13 FAILED:', e.message);
        failed++;
    }

    // Test 14: appendToGitignore - invalid pattern
    try {
        const result = appendToGitignore('');
        assert.strictEqual(result.success, false, 'Should reject empty pattern');
        assert.ok(result.message.includes('cannot be empty'), 'Should have appropriate error message');
        console.log('✅ Test 14 PASSED: appendToGitignore rejects invalid pattern');
        passed++;
    } catch (e) {
        console.log('❌ Test 14 FAILED:', e.message);
        failed++;
    }

    // Cleanup test environment
    cleanup();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('✨ All tests passed! ✨');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please review the failures above.');
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    runTests();
}
