#!/usr/bin/env node

import { Command } from 'commander';
import simpleGit from 'simple-git';
import dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import { GoogleGenerativeAI } from "@google/generative-ai";
import inquirer from 'inquirer';
import { execaCommand } from 'execa';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import keytar from 'keytar';
const { openCommandPalette } = await import(
  new URL('./helpers/commandPalette.js', import.meta.url)
);

const { detectCommitType } = await import(
  new URL('./helpers/detectCommitType.js', import.meta.url)
);


dotenv.config({ debug: false });
const git = simpleGit();

// 🔑 Keytar service configuration
const SERVICE_NAME = "GitGenie";
const ACCOUNT_NAME = "gemini_api_key";
const ENCRYPTION_KEY_ACCOUNT = "encryption_key";

// 🔑 Config file path (~/.gitgenie/config.json)
const configDir = path.join(os.homedir(), '.gitgenie');
const configFile = path.join(configDir, 'config.json');

// Generate or retrieve unique encryption key for this user
async function getEncryptionKey() {
  try {
    // Try to get existing encryption key from keytar
    let encryptionKey = await keytar.getPassword(SERVICE_NAME, ENCRYPTION_KEY_ACCOUNT);

    if (!encryptionKey) {
      // Generate a new random 32-byte key for this user
      encryptionKey = crypto.randomBytes(32).toString('hex');
      // Store it securely in keytar
      await keytar.setPassword(SERVICE_NAME, ENCRYPTION_KEY_ACCOUNT, encryptionKey);
    }

    return encryptionKey;
  } catch (error) {
    // Fallback: generate a unique key based on user's home directory and machine
    const uniqueData = os.homedir() + os.hostname() + os.userInfo().username;
    return crypto.createHash('sha256').update(uniqueData).digest('hex');
  }
}

async function encrypt(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text to encrypt must be a non-empty string');
  }

  try {
    const encryptionKey = await getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

async function decrypt(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text to decrypt must be a non-empty string');
  }

  try {
    const encryptionKey = await getEncryptionKey();

    // Validate format - must contain exactly one colon
    const parts = text.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, encrypted] = parts;

    // Validate hex strings
    if (!ivHex || !encrypted || ivHex.length !== 32) {
      throw new Error('Invalid encrypted data structure');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

async function getApiKey() {
  // First check environment variable
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;

  try {
    // Try to get from keytar (secure storage)
    const keyFromKeytar = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (keyFromKeytar) return keyFromKeytar;
  } catch (error) {
    // Keytar failed, continue to config.json fallback
  }

  // Fallback to config.json (encrypted)
  if (fs.existsSync(configFile)) {
    try {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      if (config.GEMINI_API_KEY) {
        try {
          // Decrypt before returning (now async with error handling)
          return await decrypt(config.GEMINI_API_KEY);
        } catch (decryptError) {
          // If decryption fails, the config file might be corrupted
          console.warn(chalk.yellow('⚠ Config file appears corrupted. Please reconfigure your API key.'));
          return null;
        }
      }
      return null;
    } catch (jsonError) {
      // If JSON parsing fails, config file is corrupted
      return null;
    }
  }
  return null;
}

async function saveApiKey(apikey) {
  // Validate input
  if (!apikey || typeof apikey !== 'string' || apikey.trim().length === 0) {
    throw new Error('API key must be a non-empty string');
  }

  const trimmedApiKey = apikey.trim();

  try {
    // Try to save to keytar first (secure storage)
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, trimmedApiKey);
    return true;
  } catch (error) {
    // Keytar failed, fallback to config.json (encrypted)
    try {
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
      const encryptedKey = await encrypt(trimmedApiKey);
      fs.writeFileSync(configFile, JSON.stringify({ GEMINI_API_KEY: encryptedKey }, null, 2));
      return true;
    } catch (err) {
      throw new Error(`Failed to save API key: ${err.message}`);
    }
  }
}

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
// Register `config`
program
  .command('config <apikey>')
  .description('Save your Gemini API key for unlocking genie powers ✨')
  .action(async (apikey) => {
    try {
      await saveApiKey(apikey);
      console.log(chalk.green('✨ Gemini API key saved successfully!'));
    } catch (err) {
      console.error(chalk.red('Failed to save API key.'));
      console.error(chalk.yellow(err.message));
    }
    process.exit(0);
  });

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
    if (['commit', 'b', 's', 'wt', 'cl', 'config'].includes(first)) return;

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

program.parse(process.argv);


/** Generate commit message */
async function generateCommitMessage(diff, opts, desc) {
  const apiKey = await getApiKey();

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

async function generatePRTitle(diff, opts, desc) {
  const apiKey = await getApiKey();

  if (!opts.genie || !apiKey) {
    if (opts.genie && !apiKey) {
      console.warn(chalk.yellow('⚠ GEMINI_API_KEY not found. Falling back to manual PR title.'));
      console.warn(chalk.cyan('To enable AI PR titles, set your API key:'));
      console.warn(chalk.gray('Example: gg config <your_api_key>'));
    }
    return `${opts.type}${opts.scope ? `(${opts.scope})` : ''}: ${desc}`;
  }

  const spinner = ora('🧞 Generating PR title with genie...').start();
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a senior software engineer at a Fortune 500 company. Generate a professional Pull Request title following industry best practices.

    REQUIREMENTS:
    - Clear, descriptive title that summarizes the changes
    - Start with action verb (Add, Fix, Update, Implement, etc.)
    - Keep under 72 characters
    - Use sentence case
    - Focus on the "what" and "why" of the change
    - No period at the end
    - Be specific about the feature/fix being introduced

    Code diff to analyze:
    ${diff}

    Return ONLY the PR title, no explanations or quotes.`;

    const result = await model.generateContent(prompt);
    spinner.succeed(' PR title generated by Gemini');
    return result.response?.text()?.trim() || `${opts.type}: ${desc}`;
  } catch (err) {
    spinner.fail('AI PR title generation failed. Using manual title instead.');
    console.error(chalk.red('Error from Gemini API:'), err.message);
    console.error(chalk.yellow('Tip: Check your API key and network connection.'));
    console.error(chalk.cyan('To set your API key: gg config <your_api_key>'));
    return `${opts.type}${opts.scope ? `(${opts.scope})` : ''}: ${desc}`;
  }
}

async function generateBranchName(diff, opts, desc) {
  const apiKey = await getApiKey();

  if (!opts.genie || !apiKey) {
    // Silently fall back to manual branch naming without warnings
    return `${opts.type}/${desc.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
  }

  const spinner = ora('🧞 Generating branch name with genie...').start();
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a senior software engineer. Generate a professional git branch name following industry best practices.

    REQUIREMENTS:
    - Follow git branch naming conventions
    - Format: type/short-descriptive-name
    - Use kebab-case (dashes between words)
    - Keep under 40 characters total
    - Use appropriate type: feature, fix, hotfix, chore, docs, style, refactor, test
    - Be descriptive but concise
    - No special characters except dashes and forward slash
    - Focus on what the change accomplishes

    Code diff to analyze:
    ${diff}

    Description provided: ${desc}

    Return ONLY the branch name, no explanations or quotes.
    Example format: feature/user-authentication or fix/login-validation`;

    const result = await model.generateContent(prompt);
    spinner.succeed(' Branch name generated by Gemini');
    const aiGeneratedName = result.response?.text()?.trim();

    // Ensure the AI result follows our expected format, fallback if not
    if (aiGeneratedName && aiGeneratedName.includes('/') && aiGeneratedName.length <= 50) {
      return aiGeneratedName;
    } else {
      return `${opts.type}/${desc.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
    }
  } catch (err) {
    spinner.fail('AI branch name generation failed. Using manual name instead.');
    if (opts.genie) {
      console.error(chalk.yellow('Tip: Check your API key and network connection.'));
      console.error(chalk.cyan('To set your API key: gg config <your_api_key>'));
    }
    return `${opts.type}/${desc.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
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

    console.log(chalk.yellow('ℹ No remote "origin" configured.'));
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

    // 4️⃣ Determine branch interactively
    let branchName = 'main';
    const branchInfo = await git.branch();
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
