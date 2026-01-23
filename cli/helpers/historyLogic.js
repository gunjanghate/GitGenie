import { execa, execaCommand } from 'execa';
import chalk from 'chalk';
import {
    HistoryError,
    handleHistoryError,
    formatNoCommitsError
} from './historyErrors.js';

/**
 * Get current git user name and email
 * @returns {Promise<{name: string, email: string}|null>} User info or null
 */
export async function getCurrentUser() {
    try {
        const { stdout: name } = await execaCommand('git config user.name');
        const { stdout: email } = await execaCommand('git config user.email');

        return {
            name: name.trim(),
            email: email.trim()
        };
    } catch (error) {
        // User config not set, return null
        return null;
    }
}

/**
 * Build git log command arguments
 * @param {Object} options - Command options
 * @returns {Promise<Array>} Git log command arguments
 */
export async function buildGitLogCommand(options) {
    const args = ['log', '--pretty=format:%h|%ai|%s'];

    // Time range filters
    if (options.today) {
        args.push('--since=midnight');
    } else if (options.month) {
        args.push('--since=30 days ago');
    } else if (!options.all) {
        // Default: last 7 days (--week or no flag)
        args.push('--since=7 days ago');
    }
    // --all means no time filter

    // Author filter
    if (options.author) {
        args.push(`--author=${options.author}`);
    } else {
        // Default: current user
        const user = await getCurrentUser();
        if (user && user.name) {
            args.push(`--author=${user.name}`);
        }
    }

    // Custom date range (overrides other time filters)
    if (options.since) {
        // Remove any existing --since argument
        const sinceIndex = args.findIndex(arg => arg.startsWith('--since='));
        if (sinceIndex !== -1) {
            args.splice(sinceIndex, 1);
        }
        args.push(`--since=${options.since}`);
    }

    // Limit
    if (options.limit) {
        args.push('-n', options.limit.toString());
    }

    return args;
}

/**
 * Parse git log output into structured data
 * @param {string} stdout - Git log output
 * @returns {Array} Array of commit objects
 */
export function parseCommitOutput(stdout) {
    if (!stdout || stdout.trim() === '') {
        return [];
    }

    return stdout.trim().split('\n').map(line => {
        const [hash, datetime, ...messageParts] = line.split('|');
        const message = messageParts.join('|'); // Handle messages with pipes

        // Parse datetime (format: 2026-01-23 17:30:45 +0530)
        const date = new Date(datetime);

        return {
            hash: hash.trim(),
            datetime: datetime.trim(),
            date: date,
            message: message.trim()
        };
    });
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${month} ${day}, ${hours}:${minutes}`;
}

/**
 * Get time range description
 * @param {Object} options - Command options
 * @returns {string} Time range description
 */
function getTimeRangeDescription(options) {
    if (options.today) {
        return 'Today';
    } else if (options.month) {
        return 'Last 30 Days';
    } else if (options.all) {
        return 'All Time';
    } else if (options.since) {
        return `Since ${options.since}`;
    } else {
        // Default: last 7 days
        return 'Last 7 Days';
    }
}

/**
 * Calculate statistics from commits
 * @param {Array} commits - Array of commit objects
 * @param {Object} options - Command options
 * @returns {Object} Statistics object
 */
export function calculateStatistics(commits, options) {
    return {
        totalCommits: commits.length,
        timeRange: getTimeRangeDescription(options),
        oldestCommit: commits.length > 0 ? commits[commits.length - 1].date : null,
        newestCommit: commits.length > 0 ? commits[0].date : null
    };
}

/**
 * Format history output with colors
 * @param {Array} commits - Array of commit objects
 * @param {Object} stats - Statistics object
 * @param {Object} options - Command options
 * @param {Object|null} user - User info
 */
export function formatHistoryOutput(commits, stats, options, user) {
    // Header
    console.log(chalk.blue(`\n📊 Commit History - ${stats.timeRange}`));

    // Author info
    if (options.author) {
        console.log(chalk.gray(`Author: ${options.author}`));
    } else if (user) {
        console.log(chalk.gray(`Author: ${user.name} <${user.email}>`));
    } else {
        console.log(chalk.gray('Author: All'));
    }

    // Statistics
    console.log(chalk.gray(`Total Commits: ${stats.totalCommits}`));
    console.log(''); // Empty line

    // Commits list
    if (commits.length === 0) {
        formatNoCommitsError(stats.timeRange);
        return;
    }

    commits.forEach(commit => {
        const hash = chalk.yellow(commit.hash);
        const date = chalk.cyan(formatDate(commit.date));
        const message = chalk.white(commit.message);

        console.log(`${hash}  ${date}  ${message}`);
    });

    console.log(''); // Empty line at end
}

/**
 * Main handler for history command
 * @param {Object} options - Command options
 */
export async function handleHistoryCommand(options) {
    try {
        // Get current user for display
        const user = await getCurrentUser();

        // Build git log command arguments
        const gitArgs = await buildGitLogCommand(options);

        // Execute git log
        let stdout;
        try {
            const result = await execa('git', gitArgs);
            stdout = result.stdout;
        } catch (error) {
            // Check if it's because repo has no commits
            if (error.message.includes('does not have any commits yet') ||
                error.message.includes('bad default revision')) {
                formatNoCommitsError('repository');
                return;
            }

            // Check for invalid date format
            if (error.message.includes('invalid date format') ||
                error.message.includes('unknown revision')) {
                throw new HistoryError(
                    `Invalid date format: "${options.since || 'unknown'}"`,
                    'validation',
                    ['Use formats like: "2026-01-20", "3 days ago", "last week"']
                );
            }

            throw error;
        }

        // Parse commits
        const commits = parseCommitOutput(stdout);

        // Calculate statistics
        const stats = calculateStatistics(commits, options);

        // Format and display output
        formatHistoryOutput(commits, stats, options, user);

    } catch (error) {
        handleHistoryError(error);
        throw error;
    }
}
