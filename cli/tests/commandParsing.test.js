/**
 * Unit Tests for Command Parsing
 * 
 * These tests verify that the CLI commands are properly structured
 * and accessible without executing actual Git operations.
 * 
 * To run these tests manually with Node.js: node tests/commandParsing.test.js
 */

import { execaCommand } from 'execa';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliPath = join(__dirname, '..', 'index.js');

// Helper function to run CLI command and get output
async function runCliCommand(args) {
    try {
        const { stdout, stderr } = await execaCommand(`node ${cliPath} ${args}`, {
            reject: false,
            shell: true
        });
        return { stdout, stderr, success: true };
    } catch (error) {
        return { stdout: error.stdout || '', stderr: error.stderr || '', success: false };
    }
}

// Test suite
async function runTests() {
    console.log('Running Command Parsing unit tests...\n');
    let passed = 0;
    let failed = 0;

    // Test 1: Main help command shows available commands
    try {
        const { stdout } = await runCliCommand('--help');

        assert(stdout.includes('config'), 'Help should mention config command');
        assert(stdout.includes('use'), 'Help should mention use command');
        assert(stdout.includes('GitGenie') || stdout.includes('Git'), 'Help should mention GitGenie');

        console.log('✅ Test 1 PASSED: Main help command shows available commands');
        passed++;
    } catch (e) {
        console.log('❌ Test 1 FAILED:', e.message);
        failed++;
    }

    // Test 2: Config command help is accessible
    try {
        const { stdout } = await runCliCommand('config --help');

        assert(stdout.includes('apikey') || stdout.includes('API'), 'Config help should mention API key');
        assert(stdout.includes('provider') || stdout.includes('Provider'), 'Config help should mention provider option');

        console.log('✅ Test 2 PASSED: Config command help is accessible');
        passed++;
    } catch (e) {
        console.log('❌ Test 2 FAILED:', e.message);
        failed++;
    }

    // Test 3: Use command help shows provider options
    try {
        const { stdout } = await runCliCommand('use --help');

        assert(stdout.includes('gemini') || stdout.includes('Gemini'), 'Use help should mention Gemini');
        assert(stdout.includes('mistral') || stdout.includes('Mistral'), 'Use help should mention Mistral');
        assert(stdout.includes('groq') || stdout.includes('Groq'), 'Use help should mention Groq');

        console.log('✅ Test 3 PASSED: Use command help shows provider options');
        passed++;
    } catch (e) {
        console.log('❌ Test 3 FAILED:', e.message);
        failed++;
    }

    // Test 4: Help flag works with -h
    try {
        const { stdout } = await runCliCommand('-h');

        assert(stdout.length > 0, 'Help output should not be empty');
        assert(stdout.includes('Usage') || stdout.includes('Commands') || stdout.includes('Options'),
            'Help should show usage information');

        console.log('✅ Test 4 PASSED: Help flag works with -h');
        passed++;
    } catch (e) {
        console.log('❌ Test 4 FAILED:', e.message);
        failed++;
    }

    // Test 5: Version command is accessible
    try {
        const { stdout } = await runCliCommand('--version');

        // Version should be a number like 1.0.12
        assert(stdout.match(/\d+\.\d+\.\d+/), 'Version should be in semver format');

        console.log('✅ Test 5 PASSED: Version command is accessible');
        passed++;
    } catch (e) {
        console.log('❌ Test 5 FAILED:', e.message);
        failed++;
    }

    // Test 6: CLI displays banner/logo in help
    try {
        const { stdout } = await runCliCommand('--help');

        // Check for GitGenie branding
        assert(stdout.includes('GitGenie') || stdout.includes('Git') || stdout.includes('🔮'),
            'Help should display GitGenie branding');

        console.log('✅ Test 6 PASSED: CLI displays banner/logo in help');
        passed++;
    } catch (e) {
        console.log('❌ Test 6 FAILED:', e.message);
        failed++;
    }

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
runTests();
