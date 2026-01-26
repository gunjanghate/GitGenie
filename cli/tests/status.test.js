import { execaCommand } from 'execa';
import chalk from 'chalk';
import {
    getCurrentBranch,
    getAheadBehindCounts,
    getLastCommitInfo,
    getGitStatus,
    groupFilesByStatus,
    isWorkingTreeClean
} from '../helpers/statusLogic.js';

console.log(chalk.blue.bold('\n🧪 Testing Status Command\n'));

/**
 * Test getCurrentBranch
 */
async function testGetCurrentBranch() {
    console.log(chalk.yellow('Testing getCurrentBranch...'));
    try {
        const branchInfo = await getCurrentBranch();
        console.log(chalk.green(`✓ Branch: ${branchInfo.name}, Detached: ${branchInfo.detached}`));
        return true;
    } catch (error) {
        console.log(chalk.red(`✗ Error: ${error.message}`));
        return false;
    }
}

/**
 * Test getAheadBehindCounts
 */
async function testGetAheadBehindCounts() {
    console.log(chalk.yellow('Testing getAheadBehindCounts...'));
    try {
        const counts = await getAheadBehindCounts();
        if (counts) {
            console.log(chalk.green(`✓ Ahead: ${counts.ahead}, Behind: ${counts.behind}`));
        } else {
            console.log(chalk.green('✓ No upstream branch (expected)'));
        }
        return true;
    } catch (error) {
        console.log(chalk.red(`✗ Error: ${error.message}`));
        return false;
    }
}

/**
 * Test getLastCommitInfo
 */
async function testGetLastCommitInfo() {
    console.log(chalk.yellow('Testing getLastCommitInfo...'));
    try {
        const commit = await getLastCommitInfo();
        if (commit) {
            console.log(chalk.green(`✓ Last commit: ${commit.hash} ${commit.message}`));
        } else {
            console.log(chalk.green('✓ No commits yet (expected for new repo)'));
        }
        return true;
    } catch (error) {
        console.log(chalk.red(`✗ Error: ${error.message}`));
        return false;
    }
}

/**
 * Test getGitStatus
 */
async function testGetGitStatus() {
    console.log(chalk.yellow('Testing getGitStatus...'));
    try {
        const status = await getGitStatus();
        console.log(chalk.green(`✓ Status retrieved successfully`));
        console.log(chalk.gray(`  Staged: ${status.staged.length}, Modified: ${status.modified.length}, Untracked: ${status.not_added.length}`));
        return true;
    } catch (error) {
        console.log(chalk.red(`✗ Error: ${error.message}`));
        return false;
    }
}

/**
 * Test groupFilesByStatus
 */
async function testGroupFilesByStatus() {
    console.log(chalk.yellow('Testing groupFilesByStatus...'));
    try {
        const status = await getGitStatus();
        const groups = groupFilesByStatus(status);
        console.log(chalk.green(`✓ Files grouped successfully`));
        console.log(chalk.gray(`  Staged: ${groups.staged.length}, Unstaged: ${groups.unstaged.length}, Untracked: ${groups.untracked.length}`));

        // Test isWorkingTreeClean
        const isClean = isWorkingTreeClean(groups);
        console.log(chalk.gray(`  Working tree clean: ${isClean}`));

        return true;
    } catch (error) {
        console.log(chalk.red(`✗ Error: ${error.message}`));
        return false;
    }
}

/**
 * Test file grouping with mock data
 */
function testGroupingLogic() {
    console.log(chalk.yellow('Testing grouping logic with mock data...'));

    const mockStatus = {
        staged: ['file1.js', 'file2.js'],
        created: ['newfile.js'],
        deleted: ['oldfile.js'],
        renamed: [{ from: 'old.js', to: 'new.js' }],
        modified: ['file3.js', 'file4.js'],
        not_added: ['untracked.js'],
        files: []
    };

    const groups = groupFilesByStatus(mockStatus);

    // Validate grouping
    let passed = true;

    if (groups.staged.length !== 5) { // created(1) + staged(2) + deleted(1) + renamed(1) = 5
        console.log(chalk.red(`✗ Expected 5 staged files, got ${groups.staged.length}`));
        passed = false;
    }

    if (groups.unstaged.length !== 2) { // modified files not in staged
        console.log(chalk.red(`✗ Expected 2 unstaged files, got ${groups.unstaged.length}`));
        passed = false;
    }

    if (groups.untracked.length !== 1) {
        console.log(chalk.red(`✗ Expected 1 untracked file, got ${groups.untracked.length}`));
        passed = false;
    }

    if (passed) {
        console.log(chalk.green('✓ Grouping logic works correctly'));
    }

    return passed;
}

/**
 * Run all tests
 */
async function runTests() {
    const results = [];

    results.push(await testGetCurrentBranch());
    results.push(await testGetAheadBehindCounts());
    results.push(await testGetLastCommitInfo());
    results.push(await testGetGitStatus());
    results.push(await testGroupFilesByStatus());
    results.push(testGroupingLogic());

    console.log('');
    const passed = results.filter(r => r).length;
    const total = results.length;

    if (passed === total) {
        console.log(chalk.green.bold(`✅ All ${total} tests passed!`));
    } else {
        console.log(chalk.yellow.bold(`⚠️  ${passed}/${total} tests passed`));
    }

    console.log('');
}

// Run tests
runTests().catch(error => {
    console.error(chalk.red('Test suite failed:'), error);
    process.exit(1);
});
