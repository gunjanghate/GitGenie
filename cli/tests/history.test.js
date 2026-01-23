// Test file for gg history command
// Run with: node tests/history.test.js

import { strict as assert } from 'assert';
import chalk from 'chalk';

// Test counter
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Simple test runner
 */
function test(description, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(chalk.green(`✓ ${description}`));
    } catch (error) {
        testsFailed++;
        console.log(chalk.red(`✗ ${description}`));
        console.log(chalk.yellow(`  Error: ${error.message}`));
    }
}

/**
 * Test suite for history command
 */
async function runTests() {
    console.log(chalk.blue.bold('\n🧪 Running History Command Tests\n'));

    // Import modules to test
    const {
        parseCommitOutput,
        calculateStatistics,
        buildGitLogCommand,
        getCurrentUser
    } = await import('../helpers/historyLogic.js');

    const {
        HistoryError,
        validateLimit
    } = await import('../helpers/historyErrors.js');

    // Test parseCommitOutput
    test('parseCommitOutput: should parse single commit correctly', () => {
        const input = 'a1b2c3d|2026-01-23 17:30:45 +0530|feat: add history command';
        const result = parseCommitOutput(input);

        assert.equal(result.length, 1);
        assert.equal(result[0].hash, 'a1b2c3d');
        assert.equal(result[0].message, 'feat: add history command');
    });

    test('parseCommitOutput: should parse multiple commits', () => {
        const input = `a1b2c3d|2026-01-23 17:30:45 +0530|feat: add history command
e4f5g6h|2026-01-22 14:22:10 +0530|fix: resolve merge conflict`;
        const result = parseCommitOutput(input);

        assert.equal(result.length, 2);
        assert.equal(result[0].hash, 'a1b2c3d');
        assert.equal(result[1].hash, 'e4f5g6h');
    });

    test('parseCommitOutput: should handle empty input', () => {
        const result = parseCommitOutput('');
        assert.equal(result.length, 0);
    });

    test('parseCommitOutput: should handle commit messages with pipes', () => {
        const input = 'a1b2c3d|2026-01-23 17:30:45 +0530|feat: add feature | update docs';
        const result = parseCommitOutput(input);

        assert.equal(result.length, 1);
        assert.equal(result[0].message, 'feat: add feature | update docs');
    });

    // Test calculateStatistics
    test('calculateStatistics: should calculate correct stats for default options', () => {
        const commits = [
            { hash: 'abc123', date: new Date('2026-01-23'), message: 'commit 1' },
            { hash: 'def456', date: new Date('2026-01-22'), message: 'commit 2' }
        ];
        const options = {};
        const stats = calculateStatistics(commits, options);

        assert.equal(stats.totalCommits, 2);
        assert.equal(stats.timeRange, 'Last 7 Days');
    });

    test('calculateStatistics: should handle --today option', () => {
        const commits = [];
        const options = { today: true };
        const stats = calculateStatistics(commits, options);

        assert.equal(stats.timeRange, 'Today');
    });

    test('calculateStatistics: should handle --month option', () => {
        const commits = [];
        const options = { month: true };
        const stats = calculateStatistics(commits, options);

        assert.equal(stats.timeRange, 'Last 30 Days');
    });

    test('calculateStatistics: should handle --all option', () => {
        const commits = [];
        const options = { all: true };
        const stats = calculateStatistics(commits, options);

        assert.equal(stats.timeRange, 'All Time');
    });

    test('calculateStatistics: should handle --since option', () => {
        const commits = [];
        const options = { since: '2026-01-20' };
        const stats = calculateStatistics(commits, options);

        assert.equal(stats.timeRange, 'Since 2026-01-20');
    });

    // Test buildGitLogCommand
    test('buildGitLogCommand: should build default command (last 7 days)', async () => {
        const options = {};
        const command = await buildGitLogCommand(options);

        assert(command.includes('git log'));
        assert(command.includes('--pretty=format:"%h|%ai|%s"'));
        assert(command.includes('--since="7 days ago"'));
    });

    test('buildGitLogCommand: should build command with --today', async () => {
        const options = { today: true };
        const command = await buildGitLogCommand(options);

        assert(command.includes('--since="midnight"'));
    });

    test('buildGitLogCommand: should build command with --month', async () => {
        const options = { month: true };
        const command = await buildGitLogCommand(options);

        assert(command.includes('--since="30 days ago"'));
    });

    test('buildGitLogCommand: should build command with --all', async () => {
        const options = { all: true };
        const command = await buildGitLogCommand(options);

        assert(!command.includes('--since'));
    });

    test('buildGitLogCommand: should build command with --author', async () => {
        const options = { author: 'John Doe' };
        const command = await buildGitLogCommand(options);

        assert(command.includes('--author="John Doe"'));
    });

    test('buildGitLogCommand: should build command with --since', async () => {
        const options = { since: '2026-01-20' };
        const command = await buildGitLogCommand(options);

        assert(command.includes('--since="2026-01-20"'));
    });

    test('buildGitLogCommand: should build command with --limit', async () => {
        const options = { limit: 10 };
        const command = await buildGitLogCommand(options);

        assert(command.includes('-n 10'));
    });

    // Test HistoryError
    test('HistoryError: should create error with message and type', () => {
        const error = new HistoryError('Test error', 'validation', ['Suggestion 1']);

        assert.equal(error.message, 'Test error');
        assert.equal(error.type, 'validation');
        assert.equal(error.suggestions.length, 1);
        assert.equal(error.suggestions[0], 'Suggestion 1');
    });

    // Test validateLimit
    test('validateLimit: should accept valid positive number', () => {
        assert.doesNotThrow(() => validateLimit(10));
    });

    test('validateLimit: should accept undefined', () => {
        assert.doesNotThrow(() => validateLimit(undefined));
    });

    test('validateLimit: should reject negative numbers', () => {
        assert.throws(() => validateLimit(-5), HistoryError);
    });

    test('validateLimit: should reject zero', () => {
        assert.throws(() => validateLimit(0), HistoryError);
    });

    test('validateLimit: should reject NaN', () => {
        assert.throws(() => validateLimit(NaN), HistoryError);
    });

    // Print summary
    console.log(chalk.blue('\n' + '─'.repeat(50)));
    console.log(chalk.blue.bold('Test Summary:'));
    console.log(chalk.gray(`Total: ${testsRun}`));
    console.log(chalk.green(`Passed: ${testsPassed}`));
    console.log(chalk.red(`Failed: ${testsFailed}`));
    console.log(chalk.blue('─'.repeat(50) + '\n'));

    if (testsFailed > 0) {
        process.exit(1);
    }
}

// Run tests only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(error => {
        console.error(chalk.red('Test execution failed:'));
        console.error(error);
        process.exit(1);
    });
}
