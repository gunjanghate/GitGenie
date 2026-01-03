import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * Requires user to type "yes" exactly to proceed with dangerous operations
 * @param {string} message - Warning message to display
 * @param {string} action - Description of the action being confirmed
 * @returns {Promise<boolean>} true if user confirmed, false if aborted
 */
export async function requireExactConfirmation(message, action) {
  console.log(chalk.yellow('⚠️  SAFETY CONFIRMATION REQUIRED'));
  console.log(chalk.red(message));
  console.log(chalk.gray(`Action: ${action}`));
  console.log('');
  
  const { confirmation } = await inquirer.prompt([{
    type: 'input',
    name: 'confirmation',
    message: 'Type "yes" to proceed (anything else will abort):',
    validate: (input) => {
      if (input === 'yes') return true;
      return 'You must type exactly "yes" to proceed';
    }
  }]);

  if (confirmation !== 'yes') {
    console.log(chalk.yellow('Operation aborted by user.'));
    return false;
  }

  return true;
}

/**
 * Simple yes/no confirmation with default to abort
 * @param {string} message - Question to ask user
 * @param {boolean} defaultValue - Default value (defaults to false for safety)
 * @returns {Promise<boolean>} true if user confirmed, false otherwise
 */
export async function confirmAction(message, defaultValue = false) {
  const { confirmed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirmed',
    message: message,
    default: defaultValue
  }]);

  return confirmed;
}

/**
 * Show safety warning and get confirmation for recovery actions
 * @param {string} riskLevel - 'safe', 'moderate', or 'dangerous'
 * @param {string} action - Description of what will happen
 * @param {Array} details - Array of detail strings to show
 * @returns {Promise<boolean>} true if user confirmed
 */
export async function confirmRecoveryAction(riskLevel, action, details = []) {
  const riskColors = {
    safe: chalk.green,
    moderate: chalk.yellow,
    dangerous: chalk.red
  };

  const riskIcons = {
    safe: '✅',
    moderate: '⚠️ ',
    dangerous: '🚨'
  };

  console.log('');
  console.log(riskIcons[riskLevel] + ' ' + riskColors[riskLevel](`${riskLevel.toUpperCase()} OPERATION`));
  console.log(chalk.white(action));
  
  if (details.length > 0) {
    console.log('');
    console.log(chalk.gray('This will:'));
    details.forEach(detail => {
      console.log(chalk.gray(`• ${detail}`));
    });
  }

  console.log('');

  // Use appropriate confirmation based on risk level
  if (riskLevel === 'dangerous') {
    return await requireExactConfirmation(
      'This is a DANGEROUS operation that could cause data loss.',
      action
    );
  } else if (riskLevel === 'moderate') {
    return await confirmAction(`Continue with this ${riskLevel} operation?`, false);
  } else {
    return await confirmAction(`Continue?`, true);
  }
}