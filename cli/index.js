#!/usr/bin/env node

import { Command } from 'commander';
import simpleGit from 'simple-git';
import dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execaCommand } from 'execa';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
const {
  registerConfigCommand,
  getActiveProviderInstance
} = await import(
  new URL('./commands/config.js', import.meta.url)
);
const { openCommandPalette } = await import(
  new URL('./helpers/commandPalette.js', import.meta.url)
);

const { detectCommitType } = await import(
  new URL('./helpers/detectCommitType.js', import.meta.url)
);

const { displayGeminiError, getDebugModeTip } = await import(
  new URL('./helpers/errorHandler.js', import.meta.url)
);

const {
  analyzeStagedChanges,
  groupFilesWithAI,
  groupFilesHeuristic,
  generateCommitMessageForGroup,
  validateGroups
} = await import(
  new URL('./helpers/splitLogic.js', import.meta.url)
);

const {
  promptGroupActions,
  promptGroupReview,
  promptMergeGroups,
  confirmCommitAll,
  promptStageChanges,
  promptContinueAfterError,
  showSplitSummary,
  promptDryRun
} = await import(
  new URL('./helpers/splitUI.js', import.meta.url)
);

const {
  handleUndoInteractive,
  handleUndoSoft,
  handleUndoMixed,
  handleUndoBatch,
  handleUndoHard
} = await import(
  new URL('./helpers/undoLogic.js', import.meta.url)
);

const { handleUndoError } = await import(
  new URL('./helpers/undoErrors.js', import.meta.url)
);

const { handleHistoryCommand } = await import(
  new URL('./helpers/historyLogic.js', import.meta.url)
);

const { handleStatusCommand } = await import(
  new URL('./helpers/statusLogic.js', import.meta.url)
);


dotenv.config({ debug: false });
const git = simpleGit();

// Config logic moved to ./commands/config.js

const program = new Command();

// Banner and logo for help output (copied exactly from postinstall.js)
const banner = `
    ${chalk.cyan("🔮")} ${chalk.magentaBright("Git")}${chalk.yellow("Genie")} ${chalk.cyan("🔮")}
    ${chalk.gray("┌─────────────────┐")}
    ${chalk.gray("│")} ${chalk.green("✨ AI-Powered Git ✨")}
    ${chalk.gray("│")} ${chalk.blue("Smart Commit Magic")} 
    ${chalk.gray("└─────────────────┘")}
       ${chalk.yellow("⚡")} ${chalk.red("Ready to code!")} ${chalk.yellow("⚡")}
`;
const logo = `
   $$$$$$\   $$$$$$\  
  $$  __$$\ $$  __$$\ 
  $$ /  \__|$$ /  \__|
  $$ |$$$$\ $$ |$$$$\ 
  $$ | \_$$ $$ | \_$$|
  $$ |  $$ $$ |  $$|
   $$$$$$  \$$$$$$  |
    \______/  \______/  
`;

// Show banner/logo on help output
program.configureHelp({
  formatHelp: (cmd, helper) => {
    // Format options
    const options = helper.visibleOptions(cmd)
      .map(opt => `  ${opt.flags}  ${opt.description}`)
      .join('\n');

    // Format arguments (only once)
    const args = helper.visibleArguments(cmd)
      .map(arg => `  <${arg.name}>  ${arg.description || ''}`)
      .join('\n');

    // Format subcommands
    const subcommands = helper.visibleCommands(cmd)
      .map(sub => `  ${sub.name()}  ${sub.description()}`)
      .join('\n');

    // Onboarding instructions (copied from postinstall.js)
    const onboarding = `\n${chalk.green.bold(" Welcome to GitGenie!")}
${logo}
${banner}
` +
      chalk.green("Genie powers already unlocked!") +
      '\nTry your first AI-powered commit:\n' +
      chalk.magenta('   gg "your changes" --genie\n') +
      chalk.yellow("⚡ Unlock Genie powers:") +
      '\n   gg config <your_api_key>\n' +
      chalk.cyan("Or just get started with a manual commit:") +
      '\n' + chalk.magenta('   gg "your commit message"\n') +
      chalk.blue("📖 Docs & guide: https://gitgenie.vercel.app/\n");

    return (
      onboarding +
      '\nUsage:\n  ' + helper.commandUsage(cmd) +
      '\n\nDescription:\n  ' + helper.commandDescription(cmd) +
      (options ? '\n\nOptions:\n' + options : '') +
      (args ? '\n\nArguments:\n' + args : '') +
      (subcommands ? '\n\nCommands:\n' + subcommands : '')
    );
  }
});

// Register commands
registerConfigCommand(program);
// Register `config`


program.command('cl')
  .argument('<url>')
  .argument('[dir]')
  .description('Clone repository')
  .action(async (url, dir) => {
    const spinner = ora('📥 Cloning repository...').start();
    try {
      await git.clone(url, dir);

      // Determine the target directory name for helpful next steps
      const repoNameFromUrl = (() => {
        try {
          const parts = url.split('/').filter(Boolean);
          const last = parts[parts.length - 1] || '';
          return (last || 'repo').replace(/\.git$/i, '');
        } catch {
          return dir || 'repo';
        }
      })();

      const targetDir = dir || repoNameFromUrl;
      spinner.succeed(`✅ Repository cloned to "${targetDir}"`);

      // Helpful next steps
      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.gray(`  cd ${targetDir}`));
      console.log(chalk.gray('  code .'));

      // Try to automatically open the repo in VS Code
      try {
        await execaCommand('code .', { cwd: path.resolve(process.cwd(), targetDir) });
        console.log(chalk.green(`✅ Opened "${targetDir}" in VS Code`));
      } catch (openErr) {
        console.log(chalk.yellow('⚠ Could not open VS Code automatically.'));
        console.log(chalk.cyan('Tip: Ensure the "code" command is on your PATH. In VS Code, use: Command Palette → Shell Command: Install "code" command in PATH.'));
      }
    } catch (err) {
      spinner.fail('❌ Failed to clone repository.');
      console.log(chalk.red(err.message));
      console.log(chalk.cyan('Tip: Ensure the URL is correct and you have access (SSH/HTTPS).'));
    }
  });

// Register `ignore` command
program.command('ignore')
  .argument('[pattern]', 'Pattern or template name to ignore')
  .description('Add pattern/template to .gitignore')
  .option('--global', 'Add to global gitignore (~/.gitignore_global)')
  .option('--comment <text>', 'Add comment above the pattern')
  .option('-t, --template', 'Use standard template (e.g. node, python)')
  .option('-l, --list [keyword]', 'List available templates')
  .action(async (pattern, options) => {
    try {
      const { appendToGitignore } = await import(new URL('./helpers/gitignoreHelper.js', import.meta.url));
      const { TemplateManager } = await import(new URL('./helpers/ignoreTemplates.js', import.meta.url));

      const manager = new TemplateManager();

      // Mode 1: List templates
      if (options.list !== undefined) {
        const keyword = typeof options.list === 'string' ? options.list : null;
        const templates = manager.listTemplates(keyword);

        console.log(chalk.cyan.bold(`\n📋 ${keyword ? `Templates matching "${keyword}"` : 'Popular Templates'}:`));

        if (templates.length === 0) {
          console.log(chalk.yellow('  No templates found.'));
        } else {
          const { default: Table } = await import('cli-table3');
          const table = new Table({
            head: [],
            chars: {
              'top': '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
              'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
              'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
              'right': '│', 'right-mid': '┤', 'middle': '│'
            },
            colWidths: [18, 18, 18, 18], // Slightly wider
            style: { head: [], border: ['gray'] } // Gray border
          });

          // Chunk templates into groups of 4
          let row = [];
          for (let i = 0; i < templates.length; i++) {
            // Add icon or color
            row.push(chalk.cyan.bold(templates[i]));
            if (row.length === 4) {
              table.push(row);
              row = [];
            }
          }
          if (row.length > 0) {
            // Fill remaining cells with empty strings
            while (row.length < 4) row.push('');
            table.push(row);
          }
          console.log(table.toString());
        }
        console.log(chalk.gray(`\n💡 Search: gg ignore --list <keyword>`));
        process.exit(0);
      }

      // Mode 2: Use Template
      if (options.template) {
        if (!pattern) {
          // Interactive selection with search
          const { default: inquirerCheckboxPlus } = await import('inquirer-checkbox-plus');
          inquirer.registerPrompt('checkbox-plus', inquirerCheckboxPlus);

          console.log(chalk.cyan('Controls: ↑↓ to navigate • space to select • type to filter • enter to submit'));

          const allTemplates = manager.listTemplates().filter(Boolean);

          let debounceTimer;

          const { selected } = await inquirer.prompt([{
            type: 'checkbox-plus',
            name: 'selected',
            message: 'Select templates:',
            pageSize: 10,
            searchable: true,
            source: async (answersSoFar, input) => {
              input = input || '';

              return new Promise((resolve) => {
                if (debounceTimer) clearTimeout(debounceTimer);

                debounceTimer = setTimeout(() => {
                  const filtered = input
                    ? allTemplates.filter(t => t.toLowerCase().includes(input.toLowerCase()))
                    : allTemplates;
                  resolve(filtered);
                }, 300);
              });
            }
          }]);

          if (!selected || selected.length === 0) {
            console.log(chalk.yellow('⚠ No templates selected.'));
            process.exit(0);
          }
          pattern = selected.join(',');
        }

        // Support comma-separated templates: node,vscode
        const templateNames = pattern.split(',').map(s => s.trim()).filter(Boolean);
        let combinedContent = '';
        let comment = options.comment ? `# ${options.comment}\n` : '';
        let sources = [];

        const spinner = ora('🔍 Fetching templates...').start();

        for (const name of templateNames) {
          let contentResult = null;
          let finalName = name;

          // Try exact match first
          try {
            contentResult = await manager.getTemplate(name);
          } catch (err) {
            // Not found, try fuzzy match
            spinner.stop();
            const closest = manager.getClosestMatch(name);

            if (closest) {
              console.log(chalk.yellow(`⚠ Template "${name}" not found.`));
              const { confirm } = await inquirer.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: `Did you mean "${closest}"?`,
                default: true
              }]);

              if (confirm) {
                spinner.start(`Fetching corrected template: ${closest}...`);
                try {
                  contentResult = await manager.getTemplate(closest);
                  finalName = closest;
                } catch (fetchErr) {
                  spinner.fail(chalk.red(`Failed to fetch corrected template "${closest}": ${fetchErr.message}`));
                  process.exit(1);
                }
              } else {
                console.log(chalk.red(`❌ Template "${name}" skipped.`));
                continue;
              }
            } else {
              spinner.fail(chalk.red(`❌ Template "${name}" not found.`));
              console.log(chalk.cyan('Run "gg ignore --list" to see available options.'));
              process.exit(1);
            }
          }

          if (contentResult) {
            combinedContent += `\n# Template: ${finalName} (${contentResult.source})\n${contentResult.content}\n`;
            sources.push(`${finalName} (${contentResult.source})`);
          }
        }

        spinner.succeed(`Resolved templates: ${sources.join(', ')}`);

        if (!combinedContent || !combinedContent.trim()) {
          console.log(chalk.yellow('⚠ No templates were selected to add.'));
          process.exit(0);
        }

        const { getGitignorePath } = await import(new URL('./helpers/gitignoreHelper.js', import.meta.url));
        const filePath = getGitignorePath(options.global);

        fs.appendFileSync(filePath, '\n' + comment + combinedContent, 'utf-8');
        console.log(chalk.green(`✅ Added templates to ${path.basename(filePath)}`));
        process.exit(0);
      }

      // Mode 3: Basic Pattern (Legacy)
      if (!pattern) {
        console.error(chalk.red('⚠ Please specify a pattern or template.'));
        process.exit(1);
      }

      const result = appendToGitignore(pattern, {
        global: options.global || false,
        comment: options.comment || null
      });

      if (result.success) {
        console.log(chalk.green(`✅ ${result.message}`));
        if (options.comment) console.log(chalk.gray(`   Comment: ${options.comment}`));
        console.log(chalk.cyan(`   File: ${result.filePath}`));
      } else {
        console.log(chalk.yellow(`⚠ ${result.message}`));
        process.exit(1);
      }

    } catch (err) {
      console.error(chalk.red('Failed to update .gitignore'));
      console.error(chalk.yellow(err.message));
      process.exit(1);
    }
  });

// Register `history` command
program
  .command('history')
  .description('Show commit history with filtering and statistics 📊')
  .option('--today', 'Show commits from today only')
  .option('--week', 'Show commits from last 7 days (default)')
  .option('--month', 'Show commits from last 30 days')
  .option('--all', 'Show all commits')
  .option('--author <name>', 'Filter by specific author')
  .option('--since <date>', 'Show commits since date (e.g., "2026-01-20", "3 days ago")')
  .option('--limit <n>', 'Limit number of commits shown', parseInt)
  .action(async (options) => {
    try {
      await handleHistoryCommand(options);
      process.exit(0);
    } catch (err) {
      console.error(chalk.red('Failed to show history.'));
      console.error(chalk.yellow(err.message));
      process.exit(1);
    }
  });

// Register `status` command
program
  .command('status')
  .alias('st')
  .description('Show visually rich git status with colors and icons 🎨')
  .action(async () => {
    try {
      await handleStatusCommand();
      process.exit(0);
    } catch (err) {
      console.error(chalk.red('Failed to show status.'));
      console.error(chalk.yellow(err.message));
      process.exit(1);
    }
  });

// Register branch helper shortcuts

program.command('b')
  .argument('<branchName>')
  .description('Create & switch to new branch')
  .action(async (branchName) => {
    try {
      await git.checkoutLocalBranch(branchName);
      console.log(chalk.green(`Created & switched to "${branchName}"`));
    } catch (e) {
      console.log(chalk.red(e.message));
    }
  });

program.command('s')
  .argument('<branch>')
  .description('Switch to a branch')
  .action(async (branch) => {
    await git.checkout(branch);
    console.log(chalk.green(`Switched to "${branch}"`));
  });

program.command('wt')
  .argument('<branch>')
  .argument('[dir]')
  .description('Create Git worktree')
  .action(async (branch, dir) => {
    const loc = dir || branch;
    await git.raw(['worktree', 'add', loc, branch]);
    console.log(chalk.green(`Worktree created at "${loc}"`));
  });

// Recovery command with subcommands
const recoverCmd = program.command('recover')
  .description('Recover lost Git commits, files, or branches safely');

recoverCmd.command('list')
  .description('Show recoverable commits from reflog')
  .option('-n, --count <number>', 'Number of reflog entries to scan', '20')
  .action(async (options) => {
    await handleRecoverList(parseInt(options.count));
  });

recoverCmd.command('explain <n>')
  .description('Explain what happened at reflog entry N')
  .action(async (n) => {
    await handleRecoverExplain(parseInt(n));
  });

recoverCmd.command('apply <n>')
  .description('Apply recovery for reflog entry N')
  .action(async (n) => {
    await handleRecoverApply(parseInt(n));
  });

// Default recover command (interactive mode)
recoverCmd.action(async () => {
  await handleRecoverInteractive();
});

// Undo command with subcommands
const undoCmd = program.command('undo')
  .description('Safely undo recent commits with various reset modes');

undoCmd.command('soft [n]')
  .description('Undo N commits, keep changes staged (default: 1)')
  .action(async (n) => {
    await handleUndoSoft(parseInt(n) || 1);
  });

undoCmd.command('mixed [n]')
  .description('Undo N commits, keep changes unstaged (default: 1)')
  .action(async (n) => {
    await handleUndoMixed(parseInt(n) || 1);
  });

undoCmd.command('hard [n]')
  .description('Discard N commits and all changes (DANGEROUS, default: 1)')
  .action(async (n) => {
    await handleUndoHard(parseInt(n) || 1);
  });

// Default undo command (interactive mode)
undoCmd.action(async () => {
  await handleUndoInteractive();
});


// ------------------------------ SPLIT COMMAND ------------------------------
program
  .command('split')
  .description('Split staged changes into logical atomic commits')
  .option('--genie', 'Enable AI-powered grouping (requires API key)')
  .option('--auto', 'Auto-commit all groups without confirmation')
  .option('--dry-run', 'Preview groups without committing')
  .option('--max-groups <n>', 'Maximum number of groups', '5')
  .action(async (opts) => {
    try {
      // Handle Ctrl+C gracefully
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\n⚠ Split operation cancelled by user.'));
        console.log(chalk.cyan('Your staged changes remain unchanged.'));
        console.log(chalk.gray('Tip: Run gg split again when ready'));
        process.exit(0);
      });

      // 1️⃣ Analyze staged changes
      let filesData = await analyzeStagedChanges();

      // Handle no staged changes
      if (filesData.files.length === 0) {
        // Check if there are unstaged changes
        const unstagedDiff = await git.diff();
        const hasUnstagedChanges = !!unstagedDiff;

        const shouldStage = await promptStageChanges(hasUnstagedChanges);
        if (shouldStage) {
          await stageAllFiles();
          filesData = await analyzeStagedChanges();

          if (filesData.files.length === 0) {
            console.error(chalk.red('\n❌ No file changes detected.'));
            console.log(chalk.cyan('Make some changes first, then try committing.'));
            process.exit(1);
          }
        } else {
          console.log(chalk.cyan('Tip: Stage changes with: git add <files>'));
          process.exit(0);
        }
      }

      // Handle single file edge case
      if (filesData.files.length === 1) {
        console.log(chalk.yellow('Only one file changed. No need to split.'));
        console.log(chalk.cyan('Tip: Use regular commit: gg "your message"'));
        process.exit(0);
      }

      // Warn about too many files
      if (filesData.files.length > 50) {
        console.log(chalk.yellow(`⚠ ${filesData.files.length} files changed. This may take a while.`));
        const { shouldContinue } = await inquirer.prompt([{
          type: 'confirm',
          name: 'shouldContinue',
          message: 'Continue with analysis?',
          default: true
        }]);

        if (!shouldContinue) {
          process.exit(0);
        }
      }

      // 2️⃣ Group files (AI or heuristic)
      let groups = [];
      const maxGroups = parseInt(opts.maxGroups) || 5;
      const provider = await getActiveProviderInstance();
      const providerName = await getActiveProvider();

      // Determine if we should use AI (only if explicitly requested and provider exists)
      const useAI = opts.genie && provider;

      if (useAI) {
        try {
          groups = await groupFilesWithAI(filesData, provider, maxGroups);

          // Validate AI-generated groups
          const validationErrors = validateGroups(groups, filesData);
          if (validationErrors) {
            console.error(chalk.red('AI grouping validation failed:'));
            validationErrors.forEach(err => console.error(chalk.yellow(`  - ${err}`)));
            console.log(chalk.cyan('Falling back to heuristic grouping...'));
            groups = groupFilesHeuristic(filesData, maxGroups);
          }
        } catch (err) {
          const { displayProviderError } = await import(new URL('./helpers/errorHandler.js', import.meta.url));
          displayProviderError(err, providerName || 'gemini', 'file grouping');
          console.log(chalk.yellow('Falling back to heuristic grouping...'));
          groups = groupFilesHeuristic(filesData, maxGroups);
        }
      } else {
        if (!provider && opts.genie) {
          console.warn(chalk.yellow('⚠ No AI provider configured. Using heuristic grouping.'));
          console.warn(chalk.cyan('For AI-powered grouping, configure an API key:'));
          console.warn(chalk.gray('Example: gg config <your_api_key> --provider gemini'));
        }
        groups = groupFilesHeuristic(filesData, maxGroups);
      }

      // Handle empty groups
      groups = groups.filter(g => g.files && g.files.length > 0);
      if (groups.length === 0) {
        console.error(chalk.red('No valid groups created. This is unexpected.'));
        console.log(chalk.cyan('Tip: Try staging specific files or use regular commit'));
        process.exit(1);
      }

      // 3️⃣ Dry run mode
      if (opts.dryRun) {
        const confirmed = await promptDryRun();
        if (!confirmed) {
          process.exit(0);
        }

        // Generate commit messages for preview
        const msgSpinner = opts.genie ? ora('🧞 Generating preview messages with AI...').start() : null;
        try {
          for (const group of groups) {
            group.previewMessage = await generateCommitMessageForGroup(group, filesData, opts.genie ? provider : null);
          }
          if (msgSpinner) msgSpinner.succeed('AI messages generated');
        } catch (err) {
          if (msgSpinner) msgSpinner.fail('Failed to generate messages');
          throw err;
        }

        console.log(chalk.cyan.bold('\n📋 Preview of Groups (Dry Run):\n'));
        groups.forEach((group, idx) => {
          console.log(chalk.gray('─'.repeat(60)));
          console.log(chalk.yellow.bold(`[Group ${idx + 1}]`));
          console.log(chalk.green(`Message: ${group.previewMessage}`));
          console.log(chalk.gray(`Files (${group.files.length}):`));
          group.files.forEach(file => console.log(chalk.white(`  • ${file}`)));
        });
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.cyan('\nDry run complete. No commits were made.'));
        process.exit(0);
      }

      // 4️⃣ Interactive or auto mode
      let action = opts.auto ? 'commit-all' : await promptGroupActions(groups);

      // Handle merge action
      if (action === 'merge') {
        const mergeResult = await promptMergeGroups(groups);
        if (mergeResult) {
          // Remove merged groups and add new merged group
          groups = groups.filter((_, idx) => !mergeResult.indicesToRemove.includes(idx));
          groups.push(mergeResult.mergedGroup);

          console.log(chalk.green(`\n✓ Merged ${mergeResult.indicesToRemove.length} groups`));
          action = await promptGroupActions(groups);
        } else {
          action = await promptGroupActions(groups);
        }
      }

      // Handle cancel
      if (action === 'cancel') {
        console.log(chalk.yellow('Split operation cancelled.'));
        process.exit(0);
      }

      // 5️⃣ Commit groups
      const summary = { committed: 0, skipped: 0, failed: 0 };

      if (action === 'commit-all') {
        // Confirm before committing all
        if (!opts.auto) {
          const confirmed = await confirmCommitAll(groups);
          if (!confirmed) {
            console.log(chalk.yellow('Operation cancelled.'));
            process.exit(0);
          }
        }

        // Commit each group
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          const spinner = ora(`Committing group ${i + 1}/${groups.length}...`).start();

          try {
            // Unstage all files first (but keep committed changes)
            // Check if repository has commits (HEAD exists)
            try {
              await git.revparse(['--verify', 'HEAD']);
              // HEAD exists, use it for reset
              await git.reset(['HEAD']);
            } catch {
              // No commits yet, just remove all from staging
              await git.raw(['rm', '--cached', '-r', '.']);
            }

            // Stage only files for this group
            for (const file of group.files) {
              await git.add(file);
            }

            // Generate commit message
            const message = group.customMessage || await generateCommitMessageForGroup(group, filesData, opts.genie ? provider : null);

            // Commit
            await git.commit(message);
            spinner.succeed(chalk.green(`✓ Committed: ${message}`));
            summary.committed++;
            group.committed = true;
          } catch (err) {
            spinner.fail(chalk.red(`✗ Failed to commit group ${i + 1}`));
            console.error(chalk.yellow(`Error: ${err.message}`));
            summary.failed++;

            const shouldContinue = await promptContinueAfterError(`Failed to commit group: ${group.description}`);
            if (!shouldContinue) {
              console.log(chalk.cyan('Tip: Fix the issue and run gg split again'));
              break;
            }
          }
        }
      } else if (action === 'review') {
        // Review each group individually
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          const { action: reviewAction, updatedGroup } = await promptGroupReview(group, i, groups.length);

          if (reviewAction === 'cancel') {
            console.log(chalk.yellow('Operation cancelled.'));
            break;
          }

          if (reviewAction === 'skip') {
            console.log(chalk.yellow(`⏭️  Skipped group ${i + 1}`));
            summary.skipped++;
            continue;
          }

          if (reviewAction === 'commit') {
            const spinner = ora(`Committing group ${i + 1}...`).start();

            try {
              // Unstage all files first (but keep committed changes)
              // Check if repository has commits (HEAD exists)
              try {
                await git.revparse(['--verify', 'HEAD']);
                // HEAD exists, use it for reset
                await git.reset(['HEAD']);
              } catch {
                // No commits yet, just remove all from staging
                await git.raw(['rm', '--cached', '-r', '.']);
              }

              // Stage only files for this group
              for (const file of updatedGroup.files) {
                await git.add(file);
              }

              // Generate or use custom commit message
              const message = updatedGroup.customMessage || await generateCommitMessageForGroup(updatedGroup, filesData, opts.genie ? provider : null);

              // Commit
              await git.commit(message);
              spinner.succeed(chalk.green(`✓ Committed: ${message}`));
              summary.committed++;
              group.committed = true;
            } catch (err) {
              spinner.fail(chalk.red(`✗ Failed to commit group ${i + 1}`));
              console.error(chalk.yellow(`Error: ${err.message}`));
              summary.failed++;

              const shouldContinue = await promptContinueAfterError(`Failed to commit group: ${updatedGroup.description}`);
              if (!shouldContinue) {
                console.log(chalk.cyan('Tip: Fix the issue and run gg split again'));
                break;
              }
            }
          }
        }
      }

      // 6️⃣ Show summary
      showSplitSummary(summary);

      // Restage any uncommitted files
      if (summary.skipped > 0 || summary.failed > 0) {
        console.log(chalk.cyan('\nRestaging uncommitted group files...'));
        // Collect files from skipped/failed groups
        const uncommittedFiles = groups
          .filter(g => !g.committed)
          .flatMap(g => g.files);
        for (const file of uncommittedFiles) {
          try {
            await git.add(file);
          } catch (e) {
            // File may have been deleted
          }
        }
      }

    } catch (err) {
      console.error(chalk.red('Error during split operation: ' + err.message));
      console.error(chalk.yellow('Tip: Review the error above and try again.'));
      console.error(chalk.cyan('To get help: gg split --help'));
      if (process.env.GITGENIE_DEBUG) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(err.stack);
      }
      process.exit(1);
    }
  });


// ------------------------------ MAIN COMMIT COMMAND ------------------------------
program
  .command("commit <desc>")
  .description("Commit changes with AI & smart options")
  .option('--type <type>', 'Commit type')
  .option('--scope <scope>', 'Commit scope', '')
  .option('--genie', 'AI commit message')
  .option('--osc', 'Open-source branch mode')
  .option('--no-branch', 'Commit on current branch (skip prompt)')
  .option('--push-to-main', 'Merge & push to main')
  .option('--remote <url>', 'Set remote origin')
  .action(async (desc, opts) => {
    await runMainFlow(desc, opts);
  });

// Register legacy shorthand commit logic rewritten
program
  .argument('[desc]')
  .option('--type <type>', 'Commit type')
  .option('--scope <scope>', 'Commit scope', '')
  .option('--genie', 'AI mode')
  .option('--osc', 'OSS branch mode')
  .option('--no-branch', 'Skip branch prompt')
  .option('--push-to-main', 'Push to main after commit')
  .option('--remote <url>')
  .action(async (desc, opts) => {
    const first = process.argv[2];

    // 🚫 If first arg is a known subcommand, do nothing here
    if (['commit', 'b', 's', 'wt', 'cl', 'config', 'split', 'ignore'].includes(first)) return;

    // No args → open menu
    if (!desc) {
      await openCommandPalette(program);
      process.exit(0);
    }

    // Run direct commit (only desc input)
    await runMainFlow(desc, opts);
  });

// No-args = open palette
if (!process.argv.slice(2).length) {
  await openCommandPalette(program);
  process.exit(0);
}

// Handle unknown commands
program.on('command:*', async (operands) => {
  const command = operands[0];
  const availableCommands = program.commands.map(cmd => cmd.name());

  console.log(chalk.red(`Error: Unknown command "${command}"`));

  // Simple Levenshtein distance for suggestion
  const levenshtein = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
      }
    }
    return matrix[b.length][a.length];
  };

  let bestMatch = null;
  let minDist = Infinity;

  availableCommands.forEach(cmd => {
    const dist = levenshtein(command, cmd);
    if (dist < minDist && dist <= 3) {
      minDist = dist;
      bestMatch = cmd;
    }
  });

  if (bestMatch) {
    console.log(chalk.yellow(`Did you mean "${chalk.bold(bestMatch)}"?`));
  }
  process.exit(1);
});

program.exitOverride();

try {
  program.parse(process.argv);
} catch (err) {
  // Gracefully handle help/version output by exiting successfully
  if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
    process.exit(0);
  }

  // Catch unknown options or commands
  if (err.code === 'commander.unknownOption' || err.code === 'commander.unknownCommand') {
    const args = process.argv.slice(2);
    const command = args[0]; // First argument is likely the command

    // Only suggest if it looks like a command (not a flag)
    if (command && !command.startsWith('-')) {
      const availableCommands = program.commands.map(cmd => cmd.name());

      // Simple Levenshtein
      const levenshtein = (a, b) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
        for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
          }
        }
        return matrix[b.length][a.length];
      };

      let bestMatch = null;
      let minDist = Infinity;

      availableCommands.forEach(cmd => {
        const dist = levenshtein(command, cmd);
        if (dist < minDist && dist <= 3) {
          minDist = dist;
          bestMatch = cmd;
        }
      });

      if (bestMatch) {
        console.log(chalk.red(`Error: ${err.message}`));
        console.log(chalk.yellow(`Did you mean "${chalk.bold(bestMatch)}"?`));
      } else {
        console.log(chalk.red(err.message));
      }
    } else {
      console.log(chalk.red(err.message));
    }
    process.exit(1);
  }
  // Rethrow other errors
  throw err;
}


/** Generate commit message */
async function generateCommitMessage(diff, opts, desc) {
  const provider = await getActiveProviderInstance();
  const providerName = await getActiveProvider();

  if (!opts.genie || !provider) {
    if (opts.genie && !provider) {
      console.warn(chalk.yellow('⚠ AI provider not configured. Falling back to manual commit message.'));
      console.warn(chalk.cyan('To enable AI commit messages, configure an API key:'));
      console.warn(chalk.gray('Example: gg config <your_api_key> --provider gemini'));
    }
    return `${opts.type}${opts.scope ? `(${opts.scope})` : ''}: ${desc}`;
  }

  const spinner = ora(`🧞 Generating commit message with ${provider.getName()}...`).start();
  try {
    const message = await provider.generateCommitMessage(diff, opts, desc);
    spinner.succeed(` Commit message generated by ${provider.getName()}`);
    return message;
  } catch (err) {
    spinner.fail('AI commit message generation failed. Using manual message instead.');
    const { displayProviderError } = await import(new URL('./helpers/errorHandler.js', import.meta.url));
    displayProviderError(err, providerName || 'gemini', 'commit message');
    return `${opts.type}${opts.scope ? `(${opts.scope})` : ''}: ${desc}`;
  }
}

async function generatePRTitle(diff, opts, desc) {
  const provider = await getActiveProviderInstance();
  const providerName = await getActiveProvider();

  if (!opts.genie || !provider) {
    if (opts.genie && !provider) {
      console.warn(chalk.yellow('⚠ AI provider not configured. Falling back to manual PR title.'));
      console.warn(chalk.cyan('To enable AI PR titles, configure an API key:'));
      console.warn(chalk.gray('Example: gg config <your_api_key> --provider gemini'));
    }
    return `${opts.type}${opts.scope ? `(${opts.scope})` : ''}: ${desc}`;
  }

  const spinner = ora(`🧞 Generating PR title with ${provider.getName()}...`).start();
  try {
    const title = await provider.generatePRTitle(diff, opts, desc);
    spinner.succeed(` PR title generated by ${provider.getName()}`);
    return title;
  } catch (err) {
    spinner.fail('AI PR title generation failed.');
    const { displayProviderError } = await import(new URL('./helpers/errorHandler.js', import.meta.url));
    displayProviderError(err, providerName || 'gemini', 'PR title');
    return `${opts.type}${opts.scope ? `(${opts.scope})` : ''}: ${desc}`;
  }
}

async function generateBranchName(diff, opts, desc) {
  const provider = await getActiveProviderInstance();
  const providerName = await getActiveProvider();

  if (!opts.genie || !provider) {
    // Silently fall back to manual branch naming without warnings
    return `feature/${desc.toLowerCase().replace(/\s+/g, '-')}`;
  }

  const spinner = ora(`🧞 Generating branch name with ${provider.getName()}...`).start();
  try {
    const branchName = await provider.generateBranchName(desc, opts);
    spinner.succeed(` Branch name generated by ${provider.getName()}`);
    return branchName;
  } catch (err) {
    spinner.fail('AI branch name generation failed.');
    const { displayProviderError } = await import(new URL('./helpers/errorHandler.js', import.meta.url));
    displayProviderError(err, providerName || 'unknown provider', 'branch name');
    return `feature/${desc.toLowerCase().replace(/\s+/g, '-')}`;
  }
}

/** Stage all files */
async function stageAllFiles() {
  const spinner = ora('📂 Staging all files...').start();
  try {
    await git.add('./*');
    spinner.succeed(' All files staged');
  } catch (err) {
    spinner.fail('Failed to stage files.');
    console.error(chalk.red('Tip: Make sure you have changes to stage and your repository is not empty.'));
    console.error(chalk.cyan('To check status: git status'));
    throw err;
  }
}

/** Push branch with retry */
async function pushBranch(branchName) {
  const spinner = ora(`🚀 Pushing branch "${branchName}"...`).start();
  const maxRetries = 2;
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      // Use -u to set upstream on first push as well
      await git.push(['-u', 'origin', branchName]);
      spinner.succeed(`Successfully pushed branch "${branchName}"`);
      return;
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) {
        spinner.fail(`Failed to push branch "${branchName}" after ${maxRetries + 1} attempts.`);
        console.error(chalk.red('Tip: Check your remote URL and network connection.'));
        console.error(chalk.cyan('To set remote: git remote add origin <url>'));
        console.error(chalk.gray('Example: git remote add origin https://github.com/username/repo.git'));
        throw err;
      } else {
        spinner.warn(`Push failed. Retrying... (${attempt}/${maxRetries})`);
      }
    }
  }
}

/** Ensure a remote origin exists, optionally prompt user to add one */
async function ensureRemoteOriginInteractive() {
  try {
    const remotes = await git.getRemotes(true);
    const hasOrigin = remotes.some(r => r.name === 'origin');
    if (hasOrigin) return true;

    console.log(chalk.yellow('\nℹ️  No remote repository configured.'));
    console.log(chalk.gray('Your commits are only saved locally until you add a remote.\n'));
    const { wantRemote } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'wantRemote',
        message: 'Would you like to add a remote origin now?',
        default: true
      }
    ]);

    if (!wantRemote) return false;

    const { remoteUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'remoteUrl',
        message: 'Enter remote origin URL (e.g. https://github.com/user/repo.git):',
        validate: (v) => v && v.startsWith('http') || v.startsWith('git@') ? true : 'Please enter a valid Git remote URL'
      }
    ]);

    try {
      await git.remote(['add', 'origin', remoteUrl]);
      console.log(chalk.green(`✅ Remote origin set to ${remoteUrl}`));
      return true;
    } catch {
      console.log(chalk.red('❌ Failed to add remote origin.'));
      return false;
    }
  } catch {
    return false;
  }
}

/** Merge current branch to main and push */
async function mergeToMainAndPush(currentBranch) {
  try {
    console.log(chalk.blue(`ℹ Starting merge process from "${currentBranch}" to main...`));

    const spinner1 = ora('🔄 Switching to main branch...').start();
    await git.checkout('main');
    spinner1.succeed('Switched to main branch');

    const spinner2 = ora('📥 Pulling latest changes from main...').start();
    try {
      await git.pull('origin', 'main');
      spinner2.succeed('Main branch updated');
    } catch {
      spinner2.warn('Could not pull latest changes. Main might not exist on remote yet.');
      console.error(chalk.yellow('Tip: Make sure your remote is set and main branch exists.'));
      console.error(chalk.cyan('To set remote: git remote add origin <url>'));
    }

    const spinner3 = ora(`🔀 Merging "${currentBranch}" into main...`).start();
    await git.merge([currentBranch]);
    spinner3.succeed(`Successfully merged "${currentBranch}" into main`);

    // Ensure remote before pushing
    const hasRemote = await ensureRemoteOriginInteractive();
    const spinner4 = ora('🚀 Pushing main branch to remote...').start();
    if (!hasRemote) {
      spinner4.warn('No remote configured. Skipping push of main.');
    } else {
      await git.push(['-u', 'origin', 'main']);
      spinner4.succeed('Successfully pushed main branch');
    }

    const { cleanupBranch } = await inquirer.prompt([{
      type: 'confirm',
      name: 'cleanupBranch',
      message: `Do you want to delete the feature branch "${currentBranch}"?`,
      default: true
    }]);

    if (cleanupBranch && currentBranch !== 'main') {
      const spinner5 = ora(`🧹 Cleaning up feature branch "${currentBranch}"...`).start();
      try {
        await git.deleteLocalBranch(currentBranch);
        spinner5.succeed(`Deleted local branch "${currentBranch}"`);

        try {
          await git.push('origin', `:${currentBranch}`);
          console.log(chalk.green(`Deleted remote branch "${currentBranch}"`));
        } catch {
          console.log(chalk.yellow(`Remote branch "${currentBranch}" may not exist.`));
          console.error(chalk.cyan('To check remote branches: git branch -r'));
        }
      } catch (err) {
        spinner5.fail(`Failed to delete branch "${currentBranch}".`);
        console.error(chalk.red('Tip: Make sure the branch exists and is not checked out.'));
        console.error(chalk.cyan('To delete branch: git branch -d <branch>'));
        console.error(chalk.gray('Example: git branch -d feature/my-branch'));
      }
    }

    console.log(chalk.green('🎉 Successfully merged to main and pushed!'));
  } catch (err) {
    console.error(chalk.red('Merge process failed: ' + err.message));
    console.error(chalk.yellow('Tip: Resolve any merge conflicts and try again.'));
    console.error(chalk.cyan('To resolve conflicts: git status && git merge --abort'));
    throw err;
  }
}

// Main flow function
async function runMainFlow(desc, opts) {
  try {
    // 1️⃣ Initialize repo if none exists
    let isRepo = await git.checkIsRepo();
    if (!isRepo) {
      console.log(chalk.blue('No git repository found. Initializing...'));
      await git.init();
      console.log(chalk.green('Git repository initialized.'));
      console.log(chalk.cyan('Tip: To add a remote, run: git remote add origin <url>'));
      console.log(chalk.gray('Example: git remote add origin https://github.com/username/repo.git'));
    }

    // 2️⃣ Add remote if provided
    if (opts.remote) {
      try {
        await git.remote(['add', 'origin', opts.remote]);
        console.log(chalk.green(`Remote origin set to ${opts.remote}`));
      } catch {
        console.log(chalk.yellow('Remote origin may already exist.'));
        console.log(chalk.cyan('Tip: To change remote, run: git remote set-url origin <url>'));
      }
    }

    // 3️⃣ Check if repo has commits
    let hasCommits = true;
    try {
      await git.revparse(['--verify', 'HEAD']);
    } catch (e) {
      hasCommits = false;
    }

    // 3.5 Check for detached HEAD state and show warning
    const branchInfo = await git.branch();
    if (branchInfo.detached) {
      console.log(chalk.yellow('\n⚠️  You\'re currently in a detached HEAD state.'));
      console.log(chalk.yellow('Changes made here won\'t belong to any branch.'));
      console.log(chalk.cyan('To continue safely, create a branch:'));
      console.log(chalk.gray('  git switch -c <new-branch-name>\n'));
    }

    // 4️⃣ Determine branch interactively
    let branchName = 'main';
    const currentBranch = branchInfo.current || 'main';

    if (opts.branch == false || !hasCommits) {
      branchName = 'main';
      await git.checkout(['-B', branchName]);
      console.log(chalk.green(`Committing directly to branch: ${branchName}`));
    } else {
      const { branchChoice } = await inquirer.prompt([{
        type: 'list',
        name: 'branchChoice',
        message: `Current branch is "${currentBranch}". Where do you want to commit?`,
        choices: [
          { name: `Commit to current branch (${currentBranch})`, value: 'current' },
          { name: 'Create a new branch', value: 'new' },
        ]
      }]);

      if (branchChoice === 'new') {
        let suggestedBranch;
        let shortTitle = desc;
        // Open source contribution flow
        if (opts.osc) {
          // Prompt for issue number
          const { issueNumber } = await inquirer.prompt([{
            type: 'input',
            name: 'issueNumber',
            message: 'Enter issue number (e.g. 123):',
            validate: input => /^\d+$/.test(input) ? true : 'Issue number must be numeric'
          }]);
          // Generate short title
          if (opts.genie) {
            // Use Gemini to generate short title
            const unstagedDiff = await git.diff() || desc;
            shortTitle = await generateBranchName(unstagedDiff, opts, desc);
            // Only use the last part after slash for short title
            if (shortTitle.includes('/')) shortTitle = shortTitle.split('/')[1];
          } else {
            shortTitle = desc.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
          }
          suggestedBranch = `${opts.type}/#${issueNumber}-${shortTitle}`;
        } else {
          // Non-OSC flow
          if (opts.genie) {
            const unstagedDiff = await git.diff() || desc;
            suggestedBranch = await generateBranchName(unstagedDiff, opts, desc);
          } else {
            suggestedBranch = `${opts.type}/${desc.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
          }
        }

        const { newBranchName } = await inquirer.prompt([{
          type: 'input',
          name: 'newBranchName',
          message: 'Enter new branch name:',
          default: suggestedBranch,
          validate: input => input ? true : 'Branch name cannot be empty'
        }]);

        branchName = newBranchName;
        await git.checkoutLocalBranch(branchName);
        console.log(chalk.blue(`Created and switched to new branch: ${branchName}`));
        console.log(chalk.cyan('Tip: To list branches, run: git branch'));
      } else {
        branchName = currentBranch;
        await git.checkout(branchName);
        console.log(chalk.blue(`Committing to current branch: ${branchName}`));
      }
    }

    // 5️⃣ Stage files
    let diff = await git.diff(['--cached']);
    if (!diff) {
      // Check if there are unstaged changes
      const unstagedDiff = await git.diff();
      if (unstagedDiff) {
        console.log(chalk.yellow('\n⚠️  You have modified files, but nothing is staged yet.'));
        console.log(chalk.cyan('Run git add <file> or git add . to stage your changes before committing.\n'));
      } else {
        console.log(chalk.yellow('\n⚠️  No file changes detected.'));
        console.log(chalk.cyan('Make some changes first, then try committing.\n'));
        process.exit(1);
      }

      console.log(chalk.blue('Staging all files...'));
      await stageAllFiles();
      diff = await git.diff(['--cached']);
      if (!diff) {
        console.error(chalk.red('\n❌ No file changes detected.'));
        console.error(chalk.cyan('Make some changes first, then try committing.'));
        process.exit(1);
      }
    }

    // 6️⃣ Generate commit message
    // Auto detect commit type if user didn't pass one and not using AI
    // console.log("Before commit message generation, opts:", opts);
    if (!opts.type && !opts.genie) {
      // console.log("Detecting commit type...");
      opts.type = await detectCommitType();
      console.log(`🧠 Auto-detected commit type: ${opts.type}`);
    }
    // console.log("After commit type detection, opts:", opts);
    const commitMessage = await generateCommitMessage(diff, opts, desc);

    // 7️⃣ Commit
    await git.commit(commitMessage);
    console.log(chalk.green(`Committed changes with message: "${commitMessage}"`));

    // 8️⃣ Push logic
    if (opts.pushToMain) {
      // If user asked to push to main automatically
      if (branchName === 'main') {
        // Already on main → just push
        const hasRemote = await ensureRemoteOriginInteractive();
        if (!hasRemote) {
          console.log(chalk.yellow('⚠ No remote configured. Skipping push.'));
        } else {
          const spinner = ora(`🚀 Pushing main branch...`).start();
          try {
            await git.push(['-u', 'origin', 'main']);
            spinner.succeed(`✅ Pushed main successfully`);
          } catch (err) {
            spinner.fail(`❌ Failed to push main`);
            throw err;
          }
        }
      } else {
        // On feature branch → merge to main & push
        await mergeToMainAndPush(branchName);
      }

    } else {
      // 🧠 Interactive mode (normal flow)
      const { confirmPush } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmPush',
        message: `Do you want to push branch "${branchName}" to remote?`,
        default: true
      }]);

      if (confirmPush) {
        const hasRemote = await ensureRemoteOriginInteractive();
        if (!hasRemote) {
          console.log(chalk.yellow('⚠ Skipping push because no remote is configured.'));
        } else {
          await pushBranch(branchName);
        }

        if (branchName !== 'main') {
          const { mergeToMain } = await inquirer.prompt([{
            type: 'confirm',
            name: 'mergeToMain',
            message: `Do you want to merge "${branchName}" to main branch and push?`,
            default: false
          }]);
          if (mergeToMain) {
            await mergeToMainAndPush(branchName);
          }
        }
      } else {
        console.log(chalk.yellow('Push skipped.'));
        console.log(chalk.cyan(`To push manually: git push origin ${branchName}`));
      }
    }

  } catch (err) {
    console.error(chalk.red('Error: ' + err.message));
    console.error(chalk.yellow('Tip: Review the error above and try the suggested command.'));
    console.error(chalk.cyan('To get help: gg --help'));
    process.exit(1);
  }
}

// Recovery command handlers
async function handleRecoverList(count) {
  try {
    console.log(chalk.blue('🔍 Scanning reflog for recovery options...'));
    const entries = await parseReflog(count);

    if (entries.length === 0) {
      formatNoRecoveryOptions();
      return;
    }

    console.log(chalk.green(`\n📋 Found ${entries.length} reflog entries:\n`));

    entries.forEach((entry, index) => {
      const num = chalk.cyan(`${index + 1}.`);
      const hash = chalk.yellow(entry.hash);
      const action = chalk.magenta(entry.action);
      const time = chalk.gray(entry.timestamp);
      const msg = entry.message.substring(0, 60) + (entry.message.length > 60 ? '...' : '');

      console.log(`${num} ${hash} ${action} ${time}`);
      console.log(`   ${chalk.white(msg)}\n`);
    });

    console.log(chalk.cyan('💡 Use "gg recover explain <n>" to see details'));
    console.log(chalk.cyan('💡 Use "gg recover apply <n>" to recover'));
  } catch (error) {
    handleRecoveryError(error);
  }
}

async function handleRecoverExplain(n) {
  try {
    const entries = await parseReflog(50);
    validateReflogIndex(n, entries.length);

    const entry = entries[n - 1];
    const commitInfo = await getCommitInfo(entry.fullHash);

    console.log(chalk.blue('\n📖 Recovery Analysis\n'));
    console.log(`${chalk.cyan('Entry:')} #${n}`);
    console.log(`${chalk.cyan('Commit:')} ${commitInfo.hash} (${commitInfo.fullHash})`);
    console.log(`${chalk.cyan('Action:')} ${entry.action}`);
    console.log(`${chalk.cyan('When:')} ${entry.timestamp}`);
    console.log(`${chalk.cyan('Author:')} ${commitInfo.author} <${commitInfo.email}>`);
    console.log(`${chalk.cyan('Date:')} ${commitInfo.date}`);
    console.log(`${chalk.cyan('Message:')} ${commitInfo.subject}`);

    if (commitInfo.files.length > 0) {
      console.log(`${chalk.cyan('Files:')} ${commitInfo.files.length} files changed`);
      commitInfo.files.slice(0, 10).forEach(file => {
        console.log(`  ${chalk.gray('•')} ${file}`);
      });
      if (commitInfo.files.length > 10) {
        console.log(`  ${chalk.gray('... and')} ${commitInfo.files.length - 10} ${chalk.gray('more files')}`);
      }
    }

    console.log(chalk.yellow('\n⚠️  What this means:'));
    if (entry.action === 'reset') {
      console.log(chalk.gray('This commit was lost due to a git reset operation.'));
      console.log(chalk.gray('Recovery will create a new branch with this commit.'));
    } else if (entry.action === 'rebase') {
      console.log(chalk.gray('This commit was modified/lost during a rebase operation.'));
      console.log(chalk.gray('Recovery will restore the original commit to a new branch.'));
    } else if (entry.action === 'commit') {
      console.log(chalk.gray('This is a regular commit in your history.'));
      console.log(chalk.gray('Recovery will create a branch from this point.'));
    } else {
      console.log(chalk.gray('This represents a state change in your repository.'));
      console.log(chalk.gray('Recovery will create a branch from this commit.'));
    }

    console.log(chalk.cyan('\n💡 To recover: gg recover apply ' + n));
  } catch (error) {
    handleRecoveryError(error);
  }
}

async function handleRecoverApply(n) {
  try {
    const entries = await parseReflog(50);
    validateReflogIndex(n, entries.length);

    const entry = entries[n - 1];
    const commitInfo = await getCommitInfo(entry.fullHash);

    console.log(chalk.blue('\n🔄 Recovery Application\n'));
    console.log(`Recovering: ${chalk.yellow(commitInfo.hash)} - ${commitInfo.subject}`);

    const confirmed = await confirmRecoveryAction(
      'safe',
      `Create recovery branch from commit ${commitInfo.hash}`,
      [
        'Create a new branch with the recovered commit',
        'Your current branch will remain unchanged',
        'No existing work will be lost'
      ]
    );

    if (!confirmed) {
      console.log(chalk.yellow('Recovery cancelled.'));
      return;
    }

    const branchName = await createRecoveryBranch(entry.fullHash);

    console.log(chalk.green('\n🎉 Recovery completed successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray(`  git checkout ${branchName}    # Switch to recovery branch`));
    console.log(chalk.gray(`  git log --oneline -5          # Review recovered commits`));
    console.log(chalk.gray(`  git checkout main             # Return to main branch`));
    console.log(chalk.gray(`  git merge ${branchName}       # Merge if satisfied`));

  } catch (error) {
    handleRecoveryError(error);
  }
}

async function handleRecoverInteractive() {
  try {
    console.log(chalk.blue('🔮 Git Recovery Assistant\n'));

    const entries = await parseReflog(20);

    if (entries.length === 0) {
      formatNoRecoveryOptions();
      return;
    }

    console.log(chalk.green('Found potential recovery options:\n'));

    // Show first 5 entries for interactive selection
    const displayEntries = entries.slice(0, 5);
    displayEntries.forEach((entry, index) => {
      const num = chalk.cyan(`${index + 1}.`);
      const hash = chalk.yellow(entry.hash);
      const time = chalk.gray(entry.timestamp);
      const msg = entry.message.substring(0, 50) + (entry.message.length > 50 ? '...' : '');

      console.log(`${num} ${hash} ${time} - ${msg}`);
    });

    console.log(chalk.gray('\nMore options available with "gg recover list"\n'));

    const { choice } = await inquirer.prompt([{
      type: 'list',
      name: 'choice',
      message: 'What would you like to do?',
      choices: [
        { name: 'Explain a specific entry', value: 'explain' },
        { name: 'Recover a specific entry', value: 'apply' },
        { name: 'Show all entries', value: 'list' },
        { name: 'Exit', value: 'exit' }
      ]
    }]);

    if (choice === 'exit') {
      console.log(chalk.gray('Recovery assistant closed.'));
      return;
    }

    if (choice === 'list') {
      await handleRecoverList(50);
      return;
    }

    const { entryNumber } = await inquirer.prompt([{
      type: 'input',
      name: 'entryNumber',
      message: 'Enter entry number:',
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > entries.length) {
          return `Please enter a number between 1 and ${entries.length}`;
        }
        return true;
      }
    }]);

    const n = parseInt(entryNumber);

    if (choice === 'explain') {
      await handleRecoverExplain(n);
    } else if (choice === 'apply') {
      await handleRecoverApply(n);
    }

  } catch (error) {
    handleRecoveryError(error);
  }
}
