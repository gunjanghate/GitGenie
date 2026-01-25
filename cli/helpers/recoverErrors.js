import chalk from 'chalk';

/**
 * Display user-friendly error messages for recovery operations
 */
export class RecoveryError extends Error {
  constructor(message, type, suggestions = []) {
    super(message);
    this.type = type;
    this.suggestions = suggestions;
  }
}

export function handleRecoveryError(error) {
  if (error instanceof RecoveryError) {
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
    console.error(chalk.red('❌ This is not a Git repository.'));
    console.log(chalk.yellow('Run this command from inside a project folder that has been initialized with Git.'));
    console.log(chalk.cyan('💡 To initialize: git init'));
    return;
  }

  if (error.message.includes('does not have any commits yet')) {
    console.error(chalk.red('❌ This repository has no commits yet.'));
    console.log(chalk.yellow('You need at least one commit before using recovery features.'));
    console.log(chalk.cyan('💡 Create your first commit: gg "initial commit"'));
    return;
  }

  if (error.message.includes('empty reflog')) {
    console.error(chalk.red('❌ No recovery options available.'));
    console.log(chalk.yellow('The reflog is empty — Git hasn\'t recorded any recoverable actions yet.'));
    console.log(chalk.cyan('💡 Reflog entries are created when you make commits, switch branches, etc.'));
    return;
  }

  // Generic error fallback
  console.error(chalk.red(`❌ Recovery failed: ${error.message}`));
  console.log(chalk.cyan('💡 Try running with --help for usage information.'));
}

export function validateReflogIndex(index, maxIndex) {
  if (isNaN(index)) {
    throw new RecoveryError(
      'Invalid option number',
      'validation',
      ['Provide a valid number', 'Use "gg recover list" to see available options']
    );
  }

  if (index < 1 || index > maxIndex) {
    throw new RecoveryError(
      `Option number must be between 1 and ${maxIndex}`,
      'validation',
      [`You entered: ${index}`, 'Use "gg recover list" to see available options']
    );
  }
}

export function checkRepositoryState() {
  // This will be called by the main recovery functions
  // Throws appropriate RecoveryError if repository is in bad state
}

export function formatNoRecoveryOptions() {
  console.log(chalk.yellow('\nℹ️  No recovery options available.'));
  console.log(chalk.gray('This could mean:'));
  console.log(chalk.gray('  • No commits have been lost recently'));
  console.log(chalk.gray('  • Repository is in a clean state'));
  console.log(chalk.gray('  • Reflog has been cleared'));
  console.log('');
  console.log(chalk.cyan('💡 If you\'re looking for something specific:'));
  console.log(chalk.gray('  • Check git log for existing commits'));
  console.log(chalk.gray('  • Use git stash list for stashed changes'));
  console.log(chalk.gray('  • Try git fsck --lost-found for deep recovery'));
}