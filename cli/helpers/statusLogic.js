import simpleGit from 'simple-git';
import { execaCommand } from 'execa';
import chalk from 'chalk';
import {
    StatusError,
    handleStatusError,
    formatNotInRepoError
} from './statusErrors.js';

const git = simpleGit();

/**
 * Get current branch information
 * @returns {Promise<{name: string, detached: boolean}>} Branch info
 */
export async function getCurrentBranch() {
    try {
        const branchInfo = await git.branch();
        return {
            name: branchInfo.current || 'HEAD',
            detached: branchInfo.detached
        };
    } catch (error) {
        throw new StatusError(
            'Failed to get current branch',
            'git',
            ['Ensure you are in a Git repository']
        );
    }
}

/**
 * Get ahead/behind counts relative to upstream
 * @returns {Promise<{ahead: number, behind: number}|null>} Ahead/behind counts or null if no upstream
 */
export async function getAheadBehindCounts() {
    try {
        const { stdout } = await execaCommand('git rev-list --left-right --count @{upstream}...HEAD');
        const [behind, ahead] = stdout.trim().split('\t').map(Number);
        return { ahead, behind };
    } catch (error) {
        // No upstream branch configured
        return null;
    }
}

/**
 * Get last commit information
 * @returns {Promise<{hash: string, message: string}|null>} Last commit info or null if no commits
 */
export async function getLastCommitInfo() {
    try {
        const { stdout } = await execaCommand('git log -1 --oneline');
        if (!stdout || stdout.trim() === '') {
            return null;
        }
        const [hash, ...messageParts] = stdout.trim().split(' ');
        return {
            hash: hash,
            message: messageParts.join(' ')
        };
    } catch (error) {
        // No commits yet
        return null;
    }
}

/**
 * Get git status using simple-git
 * @returns {Promise<Object>} Status object from simple-git
 */
export async function getGitStatus() {
    try {
        return await git.status();
    } catch (error) {
        throw new StatusError(
            'Failed to get repository status',
            'git',
            ['Ensure you are in a Git repository']
        );
    }
}

/**
 * Group files by status (staged, unstaged, untracked)
 * @param {Object} status - Status object from git.status()
 * @returns {Object} Grouped files
 */
export function groupFilesByStatus(status) {
    const groups = {
        staged: [],
        unstaged: [],
        untracked: []
    };

    // Staged files (new files)
    status.created.forEach(file => {
        groups.staged.push({ path: file, icon: '[+]', type: 'added' });
    });

    // Staged files (modified)
    status.staged.forEach(file => {
        // Skip if already in created
        if (!status.created.includes(file)) {
            groups.staged.push({ path: file, icon: '[M]', type: 'modified' });
        }
    });

    // Staged files (deleted)
    status.deleted.forEach(file => {
        groups.staged.push({ path: file, icon: '[D]', type: 'deleted' });
    });

    // Staged files (renamed)
    status.renamed.forEach(item => {
        const path = typeof item === 'string' ? item : `${item.from} → ${item.to}`;
        groups.staged.push({ path, icon: '[R]', type: 'renamed' });
    });

    // Unstaged files (modified)
    status.modified.forEach(file => {
        // Only include if not already staged
        if (!status.staged.includes(file)) {
            groups.unstaged.push({ path: file, icon: '[M]', type: 'modified' });
        }
    });

    // Files with both staged and unstaged changes
    status.files.forEach(fileInfo => {
        if (fileInfo.index && fileInfo.working_dir) {
            // This file has both staged and unstaged changes
            const alreadyInStaged = groups.staged.some(f => f.path === fileInfo.path);
            const alreadyInUnstaged = groups.unstaged.some(f => f.path === fileInfo.path);

            if (!alreadyInUnstaged) {
                groups.unstaged.push({ path: fileInfo.path, icon: '[M]', type: 'modified' });
            }
        }
    });

    // Untracked files
    status.not_added.forEach(file => {
        groups.untracked.push({ path: file, icon: '[?]', type: 'untracked' });
    });

    return groups;
}

/**
 * Check if working tree is clean
 * @param {Object} groups - Grouped files
 * @returns {boolean} True if working tree is clean
 */
export function isWorkingTreeClean(groups) {
    return groups.staged.length === 0 &&
        groups.unstaged.length === 0 &&
        groups.untracked.length === 0;
}

/**
 * Format and display the status header
 * @param {Object} branchInfo - Branch information
 * @param {Object|null} aheadBehind - Ahead/behind counts
 * @param {Object|null} lastCommit - Last commit info
 * @param {Object} groups - Grouped files
 */
export function formatStatusHeader(branchInfo, aheadBehind, lastCommit, groups) {
    const hasChanges = !isWorkingTreeClean(groups);
    const isNotOnMain = branchInfo.name !== 'main' && branchInfo.name !== 'master';

    console.log(chalk.blue.bold('\n📊 Repository Status\n'));

    // Always show branch name
    if (branchInfo.detached) {
        console.log(chalk.yellow(`On detached HEAD`));
    } else {
        console.log(chalk.cyan(`On branch ${chalk.bold(branchInfo.name)}`));
    }

    // Show ahead/behind only when non-zero
    if (aheadBehind) {
        if (aheadBehind.ahead > 0) {
            console.log(chalk.green(`⬆️  Ahead by ${aheadBehind.ahead} commit${aheadBehind.ahead === 1 ? '' : 's'}`));
        }
        if (aheadBehind.behind > 0) {
            console.log(chalk.red(`⬇️  Behind by ${aheadBehind.behind} commit${aheadBehind.behind === 1 ? '' : 's'}`));
        }
    }

    // Show last commit info when there are local changes or not on main
    if (lastCommit && (hasChanges || isNotOnMain)) {
        console.log(chalk.gray(`Last commit: ${lastCommit.hash} ${lastCommit.message}`));
    }

    console.log(''); // Empty line
}

/**
 * Format and display file groups
 * @param {Object} groups - Grouped files
 */
export function formatFileGroups(groups) {
    // Staged files (green)
    if (groups.staged.length > 0) {
        console.log(chalk.green.bold('Changes to be committed:'));
        groups.staged.forEach(file => {
            console.log(chalk.green(`  ${file.icon} ${file.path}`));
        });
        console.log(''); // Empty line
    }

    // Unstaged files (yellow)
    if (groups.unstaged.length > 0) {
        console.log(chalk.yellow.bold('Changes not staged for commit:'));
        groups.unstaged.forEach(file => {
            console.log(chalk.yellow(`  ${file.icon} ${file.path}`));
        });
        console.log(''); // Empty line
    }

    // Untracked files (red)
    if (groups.untracked.length > 0) {
        console.log(chalk.red.bold('Untracked files:'));
        groups.untracked.forEach(file => {
            console.log(chalk.red(`  ${file.icon} ${file.path}`));
        });
        console.log(''); // Empty line
    }
}

/**
 * Format and display the complete status output
 * @param {Object} branchInfo - Branch information
 * @param {Object|null} aheadBehind - Ahead/behind counts
 * @param {Object|null} lastCommit - Last commit info
 * @param {Object} groups - Grouped files
 */
export function formatStatusOutput(branchInfo, aheadBehind, lastCommit, groups) {
    // Display header
    formatStatusHeader(branchInfo, aheadBehind, lastCommit, groups);

    // Check if working tree is clean
    if (isWorkingTreeClean(groups)) {
        console.log(chalk.green('✨ Working tree clean'));
        console.log(''); // Empty line
        return;
    }

    // Display file groups
    formatFileGroups(groups);
}

/**
 * Main handler for status command
 */
export async function handleStatusCommand() {
    try {
        // Get branch information
        const branchInfo = await getCurrentBranch();

        // Get ahead/behind counts
        const aheadBehind = await getAheadBehindCounts();

        // Get last commit info
        const lastCommit = await getLastCommitInfo();

        // Get git status
        const status = await getGitStatus();

        // Group files by status
        const groups = groupFilesByStatus(status);

        // Format and display output
        formatStatusOutput(branchInfo, aheadBehind, lastCommit, groups);

    } catch (error) {
        handleStatusError(error);
        throw error;
    }
}
