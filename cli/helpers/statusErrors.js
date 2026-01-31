import chalk from 'chalk';

/**
 * Custom error class for status command
 */
export class StatusError extends Error {
    constructor(message, type = 'unknown', suggestions = []) {
        super(message);
        this.name = 'StatusError';
        this.type = type;
        this.suggestions = suggestions;
    }
}

/**
 * Handle status command errors with helpful messages
 * @param {Error} error - Error object
 */
export function handleStatusError(error) {
    console.error(chalk.red('\n❌ Status Command Error\n'));

    if (error instanceof StatusError) {
        console.error(chalk.yellow(`Error: ${error.message}`));

        if (error.suggestions && error.suggestions.length > 0) {
            console.error(chalk.cyan('\n💡 Suggestions:'));
            error.suggestions.forEach(suggestion => {
                console.error(chalk.gray(`  • ${suggestion}`));
            });
        }
    } else if (error.message.includes('not a git repository')) {
        formatNotInRepoError();
    } else {
        console.error(chalk.yellow(`Error: ${error.message}`));
        console.error(chalk.cyan('\n💡 Try:'));
        console.error(chalk.gray('  • Ensure you are in a Git repository'));
        console.error(chalk.gray('  • Run: git status (to see raw Git output)'));
    }

    console.error(''); // Empty line
}

/**
 * Format error when not in a git repository
 */
export function formatNotInRepoError() {
    console.error(chalk.yellow('Not a Git repository'));
    console.error(chalk.cyan('\n💡 Initialize a repository:'));
    console.error(chalk.gray('  git init'));
    console.error(chalk.gray('  gg \"initial commit\" --no-branch'));
    console.error(''); // Empty line
}

/**
 * Format error when no upstream branch is configured
 */
export function formatNoUpstreamError() {
    console.error(chalk.yellow('No upstream branch configured'));
    console.error(chalk.cyan('\n💡 Set upstream branch:'));
    console.error(chalk.gray('  git push -u origin <branch-name>'));
    console.error(''); // Empty line
}
