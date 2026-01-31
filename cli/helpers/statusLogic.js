import simpleGit from 'simple-git';
import { execaCommand } from 'execa';
import chalk from 'chalk';
import {
    StatusError,
    handleStatusError,
    formatNotInRepoError
} from './statusErrors.js';

// Note: We create git instances per function call to avoid potential race conditions
// in concurrent usage scenarios

/**
 * Get current branch information
 * @returns {Promise<{name: string, detached: boolean}>} Branch info
 */
export async function getCurrentBranch() {
    try {
        const git = simpleGit();
        const branchInfo = await git.branch();
        return {
            name: branchInfo.current || 'HEAD',
            detached: branchInfo.detached || false
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

        if (!stdout || stdout.trim() === '') {
            return null;
        }

        // Handle both tab and space separated output
        const parts = stdout.trim().split(/\s+/);

        if (parts.length < 2) {
            return null;
        }

        const behind = parseInt(parts[0], 10);
        const ahead = parseInt(parts[1], 10);

        // Validate parsed numbers
        if (isNaN(behind) || isNaN(ahead)) {
            return null;
        }

        return { ahead, behind };
    } catch (error) {
        // No upstream branch configured or other git error
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
        const git = simpleGit();
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
    // Input validation
    if (!status || typeof status !== 'object') {
        throw new StatusError(
            'Invalid status object provided',
            'validation',
            ['Status object must be a valid object from git.status()']
        );
    }

    const groups = {
        staged: [],
        unstaged: [],
        untracked: []
    };

    // Defensive programming - ensure all arrays exist
    const created = status.created || [];
    const staged = status.staged || [];
    const deleted = status.deleted || [];
    const renamed = status.renamed || [];
    const modified = status.modified || [];
    const not_added = status.not_added || [];
    const files = status.files || [];

    // Track processed files to avoid duplicates
    const processedStaged = new Set();
    const processedUnstaged = new Set();

    // Staged files (new files)
    created.forEach(file => {
        if (file && !processedStaged.has(file)) {
            groups.staged.push({ path: file, icon: '[+]', type: 'added' });
            processedStaged.add(file);
        }
    });

    // Staged files (modified)
    staged.forEach(file => {
        // Skip if already in created or already processed
        if (file && !created.includes(file) && !processedStaged.has(file)) {
            groups.staged.push({ path: file, icon: '[M]', type: 'modified' });
            processedStaged.add(file);
        }
    });

    // Staged files (deleted)
    deleted.forEach(file => {
        if (file && !processedStaged.has(file)) {
            groups.staged.push({ path: file, icon: '[D]', type: 'deleted' });
            processedStaged.add(file);
        }
    });

    // Staged files (renamed)
    renamed.forEach(item => {
        if (!item) return;
        const path = typeof item === 'string' ? item : `${item.from} → ${item.to}`;
        if (!processedStaged.has(path)) {
            groups.staged.push({ path, icon: '[R]', type: 'renamed' });
            processedStaged.add(path);
        }
    });

    // Unstaged files (modified) - skip if already staged
    modified.forEach(file => {
        if (file && !staged.includes(file) && !processedUnstaged.has(file)) {
            groups.unstaged.push({ path: file, icon: '[M]', type: 'modified' });
            processedUnstaged.add(file);
        }
    });

    // Files with both staged and unstaged changes
    files.forEach(fileInfo => {
        if (!fileInfo || !fileInfo.path) return;

        // Check if file has both index and working directory changes
        if (fileInfo.index && fileInfo.working_dir) {
            // Add to unstaged if not already there
            if (!processedUnstaged.has(fileInfo.path)) {
                groups.unstaged.push({ path: fileInfo.path, icon: '[M]', type: 'modified' });
                processedUnstaged.add(fileInfo.path);
            }
        }
    });

    // Untracked files
    not_added.forEach(file => {
        if (file) {
            groups.untracked.push({ path: file, icon: '[?]', type: 'untracked' });
        }
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
