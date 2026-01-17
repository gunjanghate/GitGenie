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
        const result = await execaCommand(`node "${cliPath}" ${args}`, {
            reject: false,
            shell: true,
            all: true,
            env: { ...process.env, FORCE_COLOR: '0' } // Disable colors for cleaner output
        });

        // Use 'all' which combines stdout and stderr in order
        const output = result.all || result.stdout || result.stderr || '';
        return { output, success: result.exitCode === 0 };
    } catch (error) {
        const output = error.all || error.stdout || error.stderr || error.message || '';
        return { output, success: false };
    }
}

// Test suite
async function runTests() {
    console.log('Running Command Parsing unit tests...\n');
    let passed = 0;
    let failed = 0;

    // Test 1: Main help command shows available commands
    try {
        const { output } = await runCliCommand('--help');
        const lowerOutput = output.toLowerCase();

        // Debug output for CI
        if (!lowerOutput.includes('config')) {
            console.log('DEBUG: Output length:', output.length);
            console.log('DEBUG: First 500 chars:', output.substring(0, 500));
        }

        assert(lowerOutput.includes('config'), `Help should mention config command. Got: ${output.substring(0, 200)}`);
        assert(lowerOutput.includes('use'), `Help should mention use command. Got: ${output.substring(0, 200)}`);
        assert(lowerOutput.includes('gitgenie') || lowerOutput.includes('git'), `Help should mention GitGenie. Got: ${output.substring(0, 200)}`);

        console.log('✅ Test 1 PASSED: Main help command shows available commands');
        passed++;
    } catch (e) {
        console.log('❌ Test 1 FAILED:', e.message);
        failed++;
    }

    // Test 2: Config command help is accessible
    try {
        const { output } = await runCliCommand('config --help');
        const lowerOutput = output.toLowerCase();

        assert(lowerOutput.includes('apikey') || lowerOutput.includes('api'), 'Config help should mention API key');
        assert(lowerOutput.includes('provider'), 'Config help should mention provider option');

        console.log('✅ Test 2 PASSED: Config command help is accessible');
        passed++;
    } catch (e) {
        console.log('❌ Test 2 FAILED:', e.message);
        failed++;
    }

    // Test 3: Use command help shows provider options
    try {
        const { output } = await runCliCommand('use --help');
        const lowerOutput = output.toLowerCase();

        assert(lowerOutput.includes('gemini'), 'Use help should mention Gemini');
        assert(lowerOutput.includes('mistral'), 'Use help should mention Mistral');
        assert(lowerOutput.includes('groq'), 'Use help should mention Groq');

        console.log('✅ Test 3 PASSED: Use command help shows provider options');
        passed++;
    } catch (e) {
        console.log('❌ Test 3 FAILED:', e.message);
        failed++;
    }

    // Test 4: Help flag works with -h
    try {
        const { output } = await runCliCommand('-h');
        const lowerOutput = output.toLowerCase();

        assert(output.length > 0, 'Help output should not be empty');
        assert(lowerOutput.includes('usage') || lowerOutput.includes('commands') || lowerOutput.includes('options'),
            'Help should show usage information');

        console.log('✅ Test 4 PASSED: Help flag works with -h');
        passed++;
    } catch (e) {
        console.log('❌ Test 4 FAILED:', e.message);
        failed++;
    }

    // Test 5: Version command is accessible
    try {
        const { output } = await runCliCommand('--version');

        // Version should be a number like 1.0.12
        assert(output.match(/\d+\.\d+\.\d+/), 'Version should be in semver format');

        console.log('✅ Test 5 PASSED: Version command is accessible');
        passed++;
    } catch (e) {
        console.log('❌ Test 5 FAILED:', e.message);
        failed++;
    }

    // Test 6: CLI displays banner/logo in help
    try {
        const { output } = await runCliCommand('--help');
        const lowerOutput = output.toLowerCase();

        // Check for GitGenie branding
        assert(lowerOutput.includes('gitgenie') || lowerOutput.includes('git') || output.includes('🔮'),
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
