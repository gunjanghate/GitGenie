#!/usr/bin/env node

import { Command } from 'commander';
import simpleGit from 'simple-git';
import dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import { GoogleGenerativeAI } from "@google/generative-ai";
import inquirer from 'inquirer';
import fs from 'fs';
import os from 'os';
import path from 'path';

dotenv.config();
const git = simpleGit();

// 🔑 Config file path (~/.gitgenie/config.json)
const configDir = path.join(os.homedir(), '.gitgenie');
const configFile = path.join(configDir, 'config.json');

function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;

  if (fs.existsSync(configFile)) {
    try {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      return config.GEMINI_API_KEY || null;
    } catch {
      return null;
    }
  }
  return null;
}

let apiKey = getApiKey();

const program = new Command();

// Banner and logo for help output
const banner = `\n${chalk.cyan("🔮")} ${chalk.magentaBright("Git")}${chalk.yellow("Genie")} ${chalk.cyan("🔮")}
${chalk.gray("┌─────────────────┐")}
${chalk.gray("│")} ${chalk.green("✨ AI-Powered Git ✨")} ${chalk.gray("│")}
${chalk.gray("│")} ${chalk.blue("Smart Commit Magic")} ${chalk.gray("│")}
${chalk.gray("└─────────────────┘")}
   ${chalk.yellow("⚡")} ${chalk.red("Ready to code!")} ${chalk.yellow("⚡")}\n`;
const logo = `\n $$$$$$\\   $$$$$$\\  \n$$  __$$\\ $$  __$$\\ \n$$ /  \\__|$$ /  \\__|\n$$ |$$$$\\ $$ |$$$$\\ \n$$ |\\_$$ |$$ |\\_$$ |\n$$ |  $$ |$$ |  $$ |\n\\$$$$$$  |\\$$$$$$  |\n \\______/  \\______/  \n`;

// Show banner/logo on help output
program.configureHelp({
  formatHelp: (cmd, helper) => {
    // Format options
    const options = helper.visibleOptions(cmd)
      .map(opt => `  ${opt.flags}  ${opt.description}`)
      .join('\n');

    // Format arguments
    const args = helper.visibleArguments(cmd)
      .map(arg => `  <${arg.name}>  ${arg.description || ''}`)
      .join('\n');

    // Format subcommands
    const subcommands = helper.visibleCommands(cmd)
      .map(sub => `  ${sub.name()}  ${sub.description()}`)
      .join('\n');

    return (
      chalk.green.bold("\n Welcome to GitGenie!") +
      logo +
      banner +
      '\nUsage:\n  ' + helper.commandUsage(cmd) +
      '\n\nDescription:\n  ' + helper.commandDescription(cmd) +
      (options ? '\n\nOptions:\n' + options : '') +
      (args ? '\n\nArguments:\n' + args : '') +
      (subcommands ? '\n\nSubcommands:\n' + subcommands : '')
    );
  }
});

//  Config command as a subcommand
program
  .command('config <apikey>')
  .description('Save your Gemini API key for unlocking genie powers ✨')
  .action((apikey) => {
    try {
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(configFile, JSON.stringify({ GEMINI_API_KEY: apikey }, null, 2));
      console.log(chalk.green(' Gemini API key saved successfully!'));
    } catch (err) {
      console.error(chalk.red('❌ Failed to save API key.'));
      console.error(chalk.yellow('Tip: Make sure you have write permissions to your home directory.'));
      console.error(chalk.cyan('Try running: gg config <your_api_key>'));
      console.error(chalk.gray('Example: gg config AIzaSy...'));
    }
    process.exit(0);
  });

// ⚡ Main program configuration
program
  .name('gg')
  .description('GitGenie: Generate and manage commits with AI')
  .argument('<desc>', 'Short description of the change')
  .option('--type <type>', 'Commit type', 'feat')
  .option('--scope <scope>', 'Commit scope', '')
  .option('--genie', 'Enable AI commit message generation using Gemini')
  .option('--no-branch', 'Skip interactive branch choice and commit to main')
  .option('--push-to-main', 'Automatically merge current branch to main and push')
  .option('--remote <url>', 'Add remote origin if repo is new')
  .action(async (desc, opts) => {
    // Move all the main logic here
    await runMainFlow(desc, opts);
  });

/** Generate commit message */
async function generateCommitMessage(diff, opts, desc) {
  if (!opts.genie || !apiKey) {
    if (opts.genie && !apiKey) {
      console.warn(chalk.yellow('⚠ GEMINI_API_KEY not found. Falling back to manual commit message.'));
      console.warn(chalk.cyan('To enable AI commit messages, set your API key:'));
      console.warn(chalk.gray('Example: gg config <your_api_key>'));
    }
    return `${opts.type}${opts.scope ? `(${opts.scope})` : ''}: ${desc}`;
  }

  const spinner = ora('🧞 Generating commit message with genie...').start();
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a senior software engineer at a Fortune 500 company. Generate a professional git commit message following strict industry standards.

    REQUIREMENTS:
    - Follow Conventional Commits specification exactly
    - Format: type(scope): description
    - Description must be under 50 characters
    - Use imperative mood (add, fix, update, not adds, fixes, updates)
    - First letter of description lowercase
    - No period at the end
    - Choose appropriate type: feat, fix, docs, style, refactor, test, chore, ci, build, perf
    - Include scope when relevant (component/module/area affected)

    Code diff to analyze:
    ${diff}

    Return ONLY the commit message, no explanations or quotes.`;

    const result = await model.generateContent(prompt);
    spinner.succeed(' Commit message generated by Gemini');
    return result.response?.text()?.trim() || `${opts.type}: ${desc}`;
  } catch (err) {
    spinner.fail('AI commit message generation failed. Using manual message instead.');
    console.error(chalk.red('Error from Gemini API:'), err.message);
    console.error(chalk.yellow('Tip: Check your API key and network connection.'));
    console.error(chalk.cyan('To set your API key: gg config <your_api_key>'));
    return `${opts.type}${opts.scope ? `(${opts.scope})` : ''}: ${desc}`;
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
      await git.push('origin', branchName);
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

    const spinner4 = ora('🚀 Pushing main branch to remote...').start();
    await git.push('origin', 'main');
    spinner4.succeed('Successfully pushed main branch');

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
    } catch {
      hasCommits = false;
    }

    // 4️⃣ Determine branch interactively
    let branchName = 'main';
    const branchInfo = await git.branch();
    const currentBranch = branchInfo.current || 'main';

    if (opts.noBranch || !hasCommits) {
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
        const suggestedBranch = `${opts.type}/${desc.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;

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
      console.log(chalk.yellow('No staged changes found. Staging all files...'));
      await stageAllFiles();
      diff = await git.diff(['--cached']);
      if (!diff) {
        console.error(chalk.red('No changes detected to commit even after staging.'));
        console.error(chalk.cyan('Tip: Make sure you have modified files. To check: git status'));
        process.exit(1);
      }
    }

    // 6️⃣ Generate commit message
    const commitMessage = await generateCommitMessage(diff, opts, desc);

    // 7️⃣ Commit
    await git.commit(commitMessage);
    console.log(chalk.green(`Committed changes with message: "${commitMessage}"`));

    // 8️⃣ Push logic
    if (opts.pushToMain && branchName !== 'main') {
      await mergeToMainAndPush(branchName);
    } else {
      const { confirmPush } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmPush',
        message: `Do you want to push branch "${branchName}" to remote?`,
        default: true
      }]);

      if (confirmPush) {
        await pushBranch(branchName);

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
        console.log(chalk.cyan('Tip: To push manually, run: git push origin <branch>'));
        console.log(chalk.gray('Example: git push origin main'));
      }
    }

  } catch (err) {
    console.error(chalk.red('Error: ' + err.message));
    console.error(chalk.yellow('Tip: Review the error above and try the suggested command.'));
    console.error(chalk.cyan('To get help: gg --help'));
    process.exit(1);
  }
}

// Parse arguments
program.parse(process.argv);