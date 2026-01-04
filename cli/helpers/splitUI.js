import inquirer from 'inquirer';
import chalk from 'chalk';
import { displayGroupPreview } from './splitLogic.js';

/**
 * Prompt user for action on suggested groups
 * @param {Array} groups - Array of group objects
 * @returns {Promise<string>} Selected action
 */
export async function promptGroupActions(groups) {
    console.log(displayGroupPreview(groups));

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: `I've detected ${groups.length} logical group${groups.length > 1 ? 's' : ''} of changes. How would you like to proceed?`,
            choices: [
                { name: '✓ Commit all groups as suggested', value: 'commit-all' },
                { name: '✏️  Review and edit each group', value: 'review' },
                { name: '🔀 Merge groups together', value: 'merge' },
                { name: '❌ Cancel', value: 'cancel' }
            ]
        }
    ]);

    return action;
}

/**
 * Prompt user to review a single group
 * @param {Object} group - Group object
 * @param {number} index - Group index (0-based)
 * @param {number} total - Total number of groups
 * @returns {Promise<Object>} { action, updatedGroup }
 */
export async function promptGroupReview(group, index, total) {
    console.log(chalk.cyan.bold(`\n📝 Reviewing Group ${index + 1} of ${total}\n`));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.yellow(`Type: `) + chalk.white(group.type));
    console.log(chalk.yellow(`Scope: `) + chalk.white(group.scope || '(none)'));
    console.log(chalk.yellow(`Description: `) + chalk.white(group.description));
    console.log(chalk.yellow(`Files (${group.files.length}):`));
    group.files.forEach(file => {
        console.log(chalk.white(`  • ${file}`));
    });
    console.log(chalk.gray('─'.repeat(60)));

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do with this group?',
            choices: [
                { name: '✓ Commit this group', value: 'commit' },
                { name: '✏️  Edit commit message', value: 'edit' },
                { name: '⏭️  Skip this group', value: 'skip' },
                { name: '❌ Cancel all', value: 'cancel' }
            ]
        }
    ]);

    if (action === 'edit') {
        const suggestedMessage = `${group.type}${group.scope ? `(${group.scope})` : ''}: ${group.description}`;

        const { newMessage } = await inquirer.prompt([
            {
                type: 'input',
                name: 'newMessage',
                message: 'Enter commit message:',
                default: suggestedMessage,
                validate: (input) => {
                    if (!input || input.trim().length === 0) {
                        return 'Commit message cannot be empty';
                    }
                    if (input.length > 72) {
                        return 'Commit message should be under 72 characters';
                    }
                    return true;
                }
            }
        ]);

        return {
            action: 'commit',
            updatedGroup: { ...group, customMessage: newMessage.trim() }
        };
    }

    return { action, updatedGroup: group };
}

/**
 * Prompt user to merge groups
 * @param {Array} groups - Array of group objects
 * @returns {Promise<Object|null>} Merged group or null if cancelled
 */
export async function promptMergeGroups(groups) {
    console.log(chalk.cyan.bold('\n🔀 Merge Groups\n'));

    // Show numbered list of groups
    const choices = groups.map((group, idx) => ({
        name: `[${idx + 1}] ${group.type}${group.scope ? `(${group.scope})` : ''}: ${group.description} (${group.files.length} files)`,
        value: idx
    }));

    const { selectedIndices } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selectedIndices',
            message: 'Select groups to merge (use space to select, enter to confirm):',
            choices,
            validate: (input) => {
                if (input.length < 2) {
                    return 'Please select at least 2 groups to merge';
                }
                return true;
            }
        }
    ]);

    if (selectedIndices.length === 0) {
        return null;
    }

    // Merge selected groups
    const mergedFiles = [];
    const types = new Set();
    const scopes = new Set();

    selectedIndices.forEach(idx => {
        mergedFiles.push(...groups[idx].files);
        types.add(groups[idx].type);
        if (groups[idx].scope) scopes.add(groups[idx].scope);
    });

    // Determine merged type (use most common or first)
    const mergedType = Array.from(types)[0];
    const mergedScope = Array.from(scopes).join(',');

    const { description } = await inquirer.prompt([
        {
            type: 'input',
            name: 'description',
            message: 'Enter description for merged group:',
            default: 'merged changes',
            validate: (input) => input.trim().length > 0 || 'Description cannot be empty'
        }
    ]);

    const mergedGroup = {
        files: mergedFiles,
        type: mergedType,
        scope: mergedScope,
        description: description.trim(),
        rationale: 'User merged groups'
    };

    // Return merged group and indices to remove
    return {
        mergedGroup,
        indicesToRemove: selectedIndices
    };
}

/**
 * Confirm committing all groups
 * @param {Array} groups - Array of group objects
 * @returns {Promise<boolean>} True if confirmed
 */
export async function confirmCommitAll(groups) {
    console.log(chalk.cyan.bold('\n✓ Ready to commit all groups\n'));
    console.log(chalk.gray(`Total groups: ${groups.length}`));
    console.log(chalk.gray(`Total files: ${groups.reduce((sum, g) => sum + g.files.length, 0)}`));

    const { confirmed } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmed',
            message: 'Proceed with committing all groups?',
            default: true
        }
    ]);

    return confirmed;
}

/**
 * Prompt user to stage all changes
 * @returns {Promise<boolean>} True if user wants to stage
 */
export async function promptStageChanges() {
    console.log(chalk.yellow('⚠ No staged changes found.'));

    const { shouldStage } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'shouldStage',
            message: 'Would you like to stage all changes now?',
            default: true
        }
    ]);

    return shouldStage;
}

/**
 * Prompt user whether to continue after error
 * @param {string} errorMessage - Error message to display
 * @returns {Promise<boolean>} True if user wants to continue
 */
export async function promptContinueAfterError(errorMessage) {
    console.error(chalk.red(`\n❌ ${errorMessage}\n`));

    const { shouldContinue } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'shouldContinue',
            message: 'Continue with remaining groups?',
            default: true
        }
    ]);

    return shouldContinue;
}

/**
 * Show summary after split operation
 * @param {Object} summary - { committed, skipped, failed }
 */
export function showSplitSummary(summary) {
    console.log(chalk.cyan.bold('\n📊 Split Summary\n'));
    console.log(chalk.gray('─'.repeat(60)));

    if (summary.committed > 0) {
        console.log(chalk.green(`✓ Committed: ${summary.committed} group${summary.committed > 1 ? 's' : ''}`));
    }

    if (summary.skipped > 0) {
        console.log(chalk.yellow(`⏭️  Skipped: ${summary.skipped} group${summary.skipped > 1 ? 's' : ''}`));
    }

    if (summary.failed > 0) {
        console.log(chalk.red(`✗ Failed: ${summary.failed} group${summary.failed > 1 ? 's' : ''}`));
    }

    console.log(chalk.gray('─'.repeat(60)));

    if (summary.committed > 0) {
        console.log(chalk.green('\n🎉 Successfully split your changes into atomic commits!'));
        console.log(chalk.cyan('Tip: View your commits with: git log'));
    }
}

/**
 * Prompt for dry run confirmation
 * @returns {Promise<boolean>} True if user wants to see preview
 */
export async function promptDryRun() {
    const { confirmed } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmed',
            message: 'This is a dry run. No commits will be made. Continue?',
            default: true
        }
    ]);

    return confirmed;
}
