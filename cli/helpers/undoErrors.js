import chalk from 'chalk';

/**
 * Display user-friendly error messages for undo operations
 */
export class UndoError extends Error {
    constructor(message, type, suggestions = []) {
        super(message);
        this.type = type;
        this.suggestions = suggestions;
    }
}

export function handleUndoError(error) {
    if (error instanceof UndoError) {
        console.error(chalk.red(`❌ ${error.message}`));

        if (error.suggestions.length > 0) {
            console.log(chalk.cyan('\n💡 Suggestions:'));
            error.suggestions.forEach(suggestion => {
                console.log(chalk.gray(`  • ${suggestion}`));
            });
        }
        return;
    }

    // Handle common Git errors
    if (error.message.includes('not a git repository')) {
        console.error(chalk.red('❌ Not a Git repository'));
        console.log(chalk.cyan('💡 Run this command from inside a Git repository.'));
        console.log(chalk.gray('   To initialize: git init'));
        return;
    }

    if (error.message.includes('does not have any commits yet')) {
        console.error(chalk.red('❌ Repository has no commits yet'));
        console.log(chalk.cyan('💡 Make your first commit before using undo.'));
        console.log(chalk.gray('   Example: git add . && git commit -m "Initial commit"'));
        return;
    }

    if (error.message.includes('ambiguous argument \'HEAD~')) {
        console.error(chalk.red('❌ Not enough commits to undo'));
        console.log(chalk.cyan('💡 The repository doesn\'t have enough commit history.'));
        console.log(chalk.gray('   Use "git log --oneline" to see available commits'));
        return;
    }

    // Generic error fallback
    console.error(chalk.red(`❌ Undo failed: ${error.message}`));
    console.log(chalk.cyan('💡 Try running with --help for usage information.'));
}

export function validateCommitCount(count, maxCommits) {
    if (isNaN(count)) {
        throw new UndoError(
            'Invalid commit count',
            'validation',
            ['Provide a valid number', 'Example: gg undo soft 2']
        );
    }

    if (count < 1) {
        throw new UndoError(
            'Commit count must be at least 1',
            'validation',
            ['Provide a positive number', 'Example: gg undo soft 1']
        );
    }

    if (count > maxCommits) {
        throw new UndoError(
            `Cannot undo ${count} commits (only ${maxCommits} exist)`,
            'validation',
            [
                `Repository has ${maxCommits} commit${maxCommits === 1 ? '' : 's'}`,
                'Use "git log --oneline" to see commit history',
                `Try: gg undo soft ${Math.min(count, maxCommits)}`
            ]
        );
    }
}

export function checkForUncommittedChanges(hasChanges) {
    if (hasChanges) {
        console.log(chalk.yellow('\n⚠️  WARNING: You have uncommitted changes!'));
        console.log(chalk.red('Hard reset will permanently delete these changes.'));
        console.log(chalk.cyan('\n💡 Consider:'));
        console.log(chalk.gray('  • Commit your changes first: git commit -am "message"'));
        console.log(chalk.gray('  • Stash your changes: git stash'));
        console.log(chalk.gray('  • Use soft/mixed reset to preserve changes'));
        console.log('');
    }
}

export function formatNoCommitsError() {
    console.log(chalk.yellow('ℹ️  No commits to undo'));
    console.log(chalk.gray('This repository has no commit history yet.'));
    console.log('');
    console.log(chalk.cyan('💡 Make your first commit:'));
    console.log(chalk.gray('  git add .'));
    console.log(chalk.gray('  git commit -m "Initial commit"'));
}
