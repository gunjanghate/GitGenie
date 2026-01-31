import chalk from 'chalk';

/**
 * Custom error class for history operations
 */
export class HistoryError extends Error {
    constructor(message, type = 'general', suggestions = []) {
        super(message);
        this.name = 'HistoryError';
        this.type = type;
        this.suggestions = suggestions;
    }
}

/**
 * Handle history errors with user-friendly messages
 * @param {Error} error - Error object
 */
export function handleHistoryError(error) {
    console.log(''); // Empty line for spacing

    if (error instanceof HistoryError) {
        console.error(chalk.red(`❌ ${error.message}`));

        if (error.suggestions.length > 0) {
            console.log(chalk.cyan('\n💡 Suggestions:'));
            error.suggestions.forEach(suggestion => {
                console.log(chalk.gray(`  • ${suggestion}`));
            });
        }
    } else if (error.message.includes('not a git repository')) {
        console.error(chalk.red('❌ This is not a Git repository.'));
        console.log(chalk.yellow('Run this command from inside a project folder that has been initialized with Git.'));
        console.log(chalk.cyan('💡 To initialize: git init'));
    } else if (error.message.includes('does not have any commits yet')) {
        console.error(chalk.red('❌ This repository has no commits yet.'));
        console.log(chalk.yellow('You need at least one commit before using this feature.'));
        console.log(chalk.cyan('💡 Create your first commit: gg "initial commit"'));
    } else {
        console.error(chalk.red('❌ Failed to retrieve commit history'));
        console.error(chalk.yellow(error.message));
    }

    console.log(''); // Empty line for spacing
}

/**
 * Validate date format
 * @param {string} date - Date string to validate
 * @throws {HistoryError} If date format is invalid
 */
export function validateDateFormat(date) {
    // Git accepts many formats, so we'll let git handle validation
    // This is just a basic check for obviously wrong inputs
    if (!date || date.trim() === '') {
        throw new HistoryError(
            'Date cannot be empty',
            'validation',
            ['Provide a valid date like: "2026-01-20", "3 days ago", "last week"']
        );
    }
}

/**
 * Format "no commits found" error message
 * @param {string} range - Time range description
 */
export function formatNoCommitsError(range) {
    console.log(chalk.yellow(`\n📭 No commits found in ${range}`));
    console.log(chalk.cyan('\n💡 Tips:'));
    console.log(chalk.gray('  • Try a different time range (--all, --month, --week)'));
    console.log(chalk.gray('  • Check if you specified the correct author (--author)'));
    console.log(chalk.gray('  • Use --all to see all commits in the repository'));
    console.log('');
}

/**
 * Format invalid author error
 * @param {string} author - Author name
 */
export function formatInvalidAuthorError(author) {
    console.log(chalk.yellow(`\n⚠️  No commits found for author: "${author}"`));
    console.log(chalk.cyan('\n💡 Tips:'));
    console.log(chalk.gray('  • Check the spelling of the author name'));
    console.log(chalk.gray('  • Try without --author to see all commits'));
    console.log(chalk.gray('  • Use: git log --all --format="%an" | sort -u  (to list all authors)'));
    console.log('');
}

/**
 * Validate limit parameter
 * @param {number} limit - Limit value
 * @throws {HistoryError} If limit is invalid
 */
export function validateLimit(limit) {
    if (limit !== undefined && limit !== null) {
        if (isNaN(limit) || limit < 1) {
            throw new HistoryError(
                'Limit must be a positive number',
                'validation',
                ['Use --limit=10 to show 10 commits', 'Omit --limit to show all commits']
            );
        }
    }
}
