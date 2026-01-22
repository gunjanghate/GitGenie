import { execaCommand } from 'execa';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { confirmRecoveryAction } from './confirmationPrompt.js';
import {
    UndoError,
    handleUndoError,
    validateCommitCount,
    checkForUncommittedChanges,
    formatNoCommitsError
} from './undoErrors.js';

/**
 * Get recent commits for preview
 * @param {number} count - Number of commits to fetch
 * @returns {Promise<Array>} Array of commit objects
 */
export async function getRecentCommits(count) {
    try {
        const { stdout } = await execaCommand(`git log --oneline -n ${count}`);

        if (!stdout || stdout.trim() === '') {
            return [];
        }

        return stdout.trim().split('\n').map(line => {
            const [hash, ...messageParts] = line.split(' ');
            return {
                hash: hash,
                message: messageParts.join(' ')
            };
        });
    } catch (error) {
        if (error.message.includes('does not have any commits yet')) {
            return [];
        }
        throw error;
    }
}

/**
 * Check working directory status for uncommitted changes
 * @returns {Promise<boolean>} True if there are uncommitted changes
 */
export async function checkWorkingDirectoryStatus() {
    try {
        const { stdout } = await execaCommand('git status --porcelain');
        return stdout.trim().length > 0;
    } catch (error) {
        throw new UndoError(
            'Failed to check working directory status',
            'git',
            ['Ensure you are in a Git repository']
        );
    }
}

/**
 * Validate undo count against repository history
 * @param {number} n - Number of commits to undo
 * @returns {Promise<void>}
 */
export async function validateUndoCount(n) {
    const commits = await getRecentCommits(100);

    if (commits.length === 0) {
        formatNoCommitsError();
        process.exit(0);
    }

    validateCommitCount(n, commits.length);
}

/**
 * Handle soft reset: undo N commits, keep changes staged
 * @param {number} n - Number of commits to undo
 */
export async function handleUndoSoft(n) {
    try {
        await validateUndoCount(n);

        const commits = await getRecentCommits(n);

        console.log(chalk.blue('\n🔄 Soft Reset Preview\n'));
        console.log(chalk.yellow(`Undoing last ${n} commit${n === 1 ? '' : 's'}:`));
        commits.forEach((commit, idx) => {
            console.log(chalk.gray(`  ${idx + 1}. ${commit.hash} ${commit.message}`));
        });
        console.log('');

        const confirmed = await confirmRecoveryAction(
            'safe',
            `Undo last ${n} commit${n === 1 ? '' : 's'} (keep changes staged)`,
            [
                'Commits will be removed from history',
                'All changes will remain staged',
                'You can re-commit with a new message',
                'This operation is reversible via git reflog'
            ]
        );

        if (!confirmed) {
            console.log(chalk.yellow('Undo cancelled.'));
            return;
        }

        await execaCommand(`git reset --soft HEAD~${n}`);

        console.log(chalk.green(`\n✅ Successfully undid ${n} commit${n === 1 ? '' : 's'}`));
        console.log(chalk.cyan('\n📋 Next steps:'));
        console.log(chalk.gray('  git status              # See staged changes'));
        console.log(chalk.gray('  git commit -m "msg"     # Re-commit with new message'));
        console.log(chalk.gray('  git reflog              # View history (for recovery)'));

    } catch (error) {
        handleUndoError(error);
        process.exit(1);
    }
}

/**
 * Handle mixed reset: undo N commits, keep changes unstaged
 * @param {number} n - Number of commits to undo
 */
export async function handleUndoMixed(n) {
    try {
        await validateUndoCount(n);

        const commits = await getRecentCommits(n);

        console.log(chalk.blue('\n🔄 Mixed Reset Preview\n'));
        console.log(chalk.yellow(`Undoing last ${n} commit${n === 1 ? '' : 's'}:`));
        commits.forEach((commit, idx) => {
            console.log(chalk.gray(`  ${idx + 1}. ${commit.hash} ${commit.message}`));
        });
        console.log('');

        const confirmed = await confirmRecoveryAction(
            'safe',
            `Undo last ${n} commit${n === 1 ? '' : 's'} (keep changes unstaged)`,
            [
                'Commits will be removed from history',
                'All changes will remain in working directory (unstaged)',
                'You can review and re-stage changes',
                'This operation is reversible via git reflog'
            ]
        );

        if (!confirmed) {
            console.log(chalk.yellow('Undo cancelled.'));
            return;
        }

        await execaCommand(`git reset --mixed HEAD~${n}`);

        console.log(chalk.green(`\n✅ Successfully undid ${n} commit${n === 1 ? '' : 's'}`));
        console.log(chalk.cyan('\n📋 Next steps:'));
        console.log(chalk.gray('  git status              # See unstaged changes'));
        console.log(chalk.gray('  git add <files>         # Stage changes you want'));
        console.log(chalk.gray('  git commit -m "msg"     # Commit staged changes'));

    } catch (error) {
        handleUndoError(error);
        process.exit(1);
    }
}

/**
 * Handle hard reset: discard N commits and all changes (DANGEROUS)
 * @param {number} n - Number of commits to undo
 */
export async function handleUndoHard(n) {
    try {
        await validateUndoCount(n);

        const commits = await getRecentCommits(n);
        const hasUncommittedChanges = await checkWorkingDirectoryStatus();

        console.log(chalk.red('\n🚨 HARD RESET WARNING\n'));
        console.log(chalk.yellow(`This will PERMANENTLY DELETE:`));
        console.log(chalk.gray(`  • Last ${n} commit${n === 1 ? '' : 's'}:`));
        commits.forEach((commit, idx) => {
            console.log(chalk.gray(`    ${idx + 1}. ${commit.hash} ${commit.message}`));
        });

        if (hasUncommittedChanges) {
            checkForUncommittedChanges(true);
        } else {
            console.log(chalk.gray('  • No uncommitted changes detected'));
            console.log('');
        }

        const confirmed = await confirmRecoveryAction(
            'dangerous',
            `PERMANENTLY DELETE last ${n} commit${n === 1 ? '' : 's'} and all changes`,
            [
                '⚠️  All changes in these commits will be LOST',
                '⚠️  Any uncommitted changes will be LOST',
                '⚠️  This cannot be easily undone',
                'Recovery is only possible via git reflog (advanced)'
            ]
        );

        if (!confirmed) {
            console.log(chalk.yellow('Hard reset cancelled.'));
            return;
        }

        await execaCommand(`git reset --hard HEAD~${n}`);

        console.log(chalk.green(`\n✅ Hard reset completed`));
        console.log(chalk.yellow(`⚠️  ${n} commit${n === 1 ? '' : 's'} and all changes permanently deleted`));
        console.log(chalk.cyan('\n💡 Recovery (advanced):'));
        console.log(chalk.gray('  git reflog              # Find lost commit hash'));
        console.log(chalk.gray('  gg recover              # Use recovery assistant'));

    } catch (error) {
        handleUndoError(error);
        process.exit(1);
    }
}

/**
 * Handle batch undo: interactive selection of commits to undo
 */
export async function handleUndoBatch() {
    try {
        const commits = await getRecentCommits(20);

        if (commits.length === 0) {
            formatNoCommitsError();
            return;
        }

        console.log(chalk.blue('\n📋 Batch Undo - Select Commits\n'));

        const { count } = await inquirer.prompt([{
            type: 'input',
            name: 'count',
            message: `How many commits to undo? (1-${commits.length}):`,
            validate: (input) => {
                const num = parseInt(input);
                if (isNaN(num) || num < 1 || num > commits.length) {
                    return `Please enter a number between 1 and ${commits.length}`;
                }
                return true;
            }
        }]);

        const n = parseInt(count);
        const selectedCommits = commits.slice(0, n);

        console.log(chalk.yellow(`\nYou selected ${n} commit${n === 1 ? '' : 's'}:`));
        selectedCommits.forEach((commit, idx) => {
            console.log(chalk.gray(`  ${idx + 1}. ${commit.hash} ${commit.message}`));
        });
        console.log('');

        const { mode } = await inquirer.prompt([{
            type: 'list',
            name: 'mode',
            message: 'How would you like to undo these commits?',
            choices: [
                { name: 'Soft (keep changes staged)', value: 'soft' },
                { name: 'Mixed (keep changes unstaged)', value: 'mixed' },
                { name: 'Hard (discard all changes) ⚠️', value: 'hard' },
                { name: 'Cancel', value: 'cancel' }
            ]
        }]);

        if (mode === 'cancel') {
            console.log(chalk.yellow('Batch undo cancelled.'));
            return;
        }

        // Execute the selected mode
        if (mode === 'soft') {
            await handleUndoSoft(n);
        } else if (mode === 'mixed') {
            await handleUndoMixed(n);
        } else if (mode === 'hard') {
            await handleUndoHard(n);
        }

    } catch (error) {
        handleUndoError(error);
        process.exit(1);
    }
}

/**
 * Handle interactive undo mode
 */
export async function handleUndoInteractive() {
    try {
        console.log(chalk.blue('🔮 Git Undo Assistant\n'));

        const commits = await getRecentCommits(5);

        if (commits.length === 0) {
            formatNoCommitsError();
            return;
        }

        console.log(chalk.green('Recent commits:\n'));
        commits.forEach((commit, idx) => {
            console.log(chalk.gray(`  ${idx + 1}. ${commit.hash} ${commit.message}`));
        });
        console.log('');

        const { action } = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            message: 'What action would you like to perform?',
            choices: [
                { name: '[Soft] Undo last commit (Keep changes staged)', value: 'soft' },
                { name: '[Mixed] Undo last commit (Keep changes unstaged)', value: 'mixed' },
                { name: '[Batch] Undo last N commits...', value: 'batch' },
                { name: '[Hard] Discard last commit (Danger ⚠️)', value: 'hard' },
                { name: '[Exit] Cancel operation', value: 'exit' }
            ]
        }]);

        if (action === 'exit') {
            console.log(chalk.gray('Undo assistant closed.'));
            return;
        }

        if (action === 'soft') {
            await handleUndoSoft(1);
        } else if (action === 'mixed') {
            await handleUndoMixed(1);
        } else if (action === 'batch') {
            await handleUndoBatch();
        } else if (action === 'hard') {
            await handleUndoHard(1);
        }

    } catch (error) {
        handleUndoError(error);
        process.exit(1);
    }
}
