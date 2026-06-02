import inquirer from "inquirer";
import chalk from "chalk";
import { spawn } from "node:child_process";
import simpleGit from "simple-git";

// Fancy header (logo + banner) to show at the top of the palette
const banner = `
        ${chalk.cyan("🔮")} ${chalk.magentaBright("Git")}${chalk.yellow("Genie")} ${chalk.cyan("🔮")}
        ${chalk.gray("┌─────────────────┐")}
        ${chalk.gray("│")} ${chalk.green("✨ AI-Powered Git ✨")}
        ${chalk.gray("│")} ${chalk.blue("Smart Commit Magic")} 
        ${chalk.gray("└─────────────────┘")}
             ${chalk.yellow("⚡")} ${chalk.red("Ready to code!")} ${chalk.yellow("⚡")}
`;
const logo = `
     $$$$$$\\   $$$$$$\\  
    $$  __$$\\ $$  __$$\\ 
    $$ /  \\__|$$ /  \\__|
    $$ |$$$$\\ $$ |$$$$\\ 
    $$ | \\_$$ $$ | \\_$$|
    $$ |  $$ $$ |  $$|
     $$$$$$  \\$$$$$$ |
      \\______/\\______/  
`;

function showHeader() {
    // Clear the screen to avoid any duplicate banner fragments from previous renders
    if (typeof console.clear === 'function') console.clear();
    const sep = chalk.gray("────────────────────────────────────────────────────────────");
    // Print header once
    console.log(chalk.cyan(logo));
    console.log(banner);
    console.log(sep);
    console.log(chalk.bold("GitGenie Command Palette"));
    console.log(chalk.dim("Use ↑/↓ to navigate, Enter to select, Esc/Ctrl+C to cancel"));
    console.log(sep);
}

async function showWorkspaceStatus() {
    const git = simpleGit();

    try {
        const isRepo = await git.checkIsRepo();

        if (!isRepo) {
            console.log(
                chalk.yellow("\n⚠️  No Git repository detected in current directory.\n")
            );
            return;
        }

        const status = await git.status();

        const unstagedChanges =
            status.modified.length + status.not_added.length;

        const untrackedFiles = status.created.length;

        console.log(chalk.cyan("\n📦 GitGenie Workspace Status:\n"));

        console.log(
            chalk.white("  • Active Branch: ") +
            chalk.green(status.current || "main")
        );

        console.log(
            chalk.white("  • Unstaged Changes: ") +
            chalk.yellow(
                `${unstagedChanges} file${unstagedChanges !== 1 ? "s" : ""} modified`
            )
        );

        console.log(
            chalk.white("  • Untracked Assets: ") +
            chalk.magenta(
                `${untrackedFiles} new file${untrackedFiles !== 1 ? "s" : ""}`
            )
        );

        console.log();
    } catch (error) {
        console.log(
            chalk.red("\n❌ Unable to fetch repository status.\n")
        );
    }
}

// A simpler palette that synthesizes a commit wizard and prompts args for known commands
export async function openCommandPalette(program) {
    // Header & intro
    showHeader();
    await showWorkspaceStatus();

    // Exclude any built-in/unknown and any conflicting 'commit' command so we control the UX
    const realCommands = program.commands.filter(c => c._name !== '*' && c._name !== 'commit');
    const choices = [
        new inquirer.Separator(chalk.gray('— Actions —')),
        { name: chalk.green('commit') + chalk.gray(' — Commit changes with optional AI support'), value: '__commit__' },
        ...realCommands.map(c => ({ name: chalk.yellow(c._name) + (c._description ? chalk.gray(` — ${c._description}`) : ''), value: c._name })),
        new inquirer.Separator(),
        { name: chalk.red('Exit') + chalk.gray(' — Quit without running a command'), value: '__exit__' }
    ];

    let selected;
    try {
        const ans = await inquirer.prompt([
            { type: 'list', name: 'selected', message: chalk.magenta('✨ What would you like to do?'), pageSize: 12, choices }
        ]);
        selected = ans.selected;
    } catch (err) {
        // User cancelled (Esc/Ctrl+C) or TTY error
        console.log("\n" + chalk.yellow('✋ Exited the command palette.'));
        console.log(chalk.cyan('Tip: Run ') + chalk.magenta('gg') + chalk.cyan(' again anytime.'));
        return;
    }
    if (!selected) {
        console.log("\n" + chalk.yellow('No selection made. Exiting.'));
        return;
    }

    // If a real command named 'commit' exists and gets selected, route it to our wizard
    if (selected === 'commit') selected = '__commit__';
    if (selected === '__exit__') {
        console.log("\n" + chalk.gray('Goodbye!') + ' ' + chalk.cyan('Tip: Use ') + chalk.magenta('gg') + chalk.cyan(' to reopen the palette.'));
        return;
    }

    const node = process.execPath;
    const entry = process.argv[1];
    const run = async (args) => {
        // Pretty-print the exact command that will run
        const q = (s) => (s.includes(' ') ? `"${s.replace(/"/g, '\\"')}"` : s);
        const printable = ['gg', ...args].map(q).join(' ');
        console.log(chalk.gray(`→ Running: ${printable}`));

        const child = spawn(node, [entry, ...args], {
            stdio: 'inherit',
            cwd: process.cwd(),
            env: process.env
        });
        await new Promise((resolve, reject) => {
            child.on('error', reject);
            child.on('exit', (code) => resolve(code));
        });
    };

    if (selected === '__commit__') {
        let answers;
        try {
            answers = await inquirer.prompt([
                { type: 'input', name: 'desc', message: 'Enter commit message:', validate: v => !!v || 'Commit message is required' },
                { type: 'confirm', name: 'genie', message: 'Use AI commit message?', default: false },
                { type: 'input', name: 'type', message: 'Commit type (feat, fix, docs...)', default: '' },
                { type: 'input', name: 'scope', message: 'Commit scope (optional)' },
                { type: 'confirm', name: 'osc', message: 'Open-source issue mode?', default: false },
                { type: 'confirm', name: 'noBranch', message: 'Commit directly to main (skip branch prompt)?', default: false },
                { type: 'confirm', name: 'pushToMain', message: 'Push to main after commit?', default: false },
                { type: 'input', name: 'remote', message: 'Remote origin URL (optional):', default: '' },
            ]);
        } catch {
            console.log("\n" + chalk.yellow('✋ Exited before completing the commit wizard. No changes were made.'));
            return;
        }
        const args = [answers.desc];
        if (answers.type) args.push('--type', answers.type);
        if (answers.scope) args.push('--scope', answers.scope);
        if (answers.genie) args.push('--genie');
        if (answers.osc) args.push('--osc');
        if (answers.noBranch) args.push('--no-branch');
        if (answers.pushToMain) args.push('--push-to-main');
        if (answers.remote) args.push('--remote', answers.remote);
        await run(args);
        return;
    }

    // Subcommand-specific prompting
    if (selected === 'cl') {
        const { repoUrl, directory } = await inquirer.prompt([
            { type: 'input', name: 'repoUrl', message: 'Repository URL to clone:', validate: v => /^https?:\/\//.test(v) || v.startsWith('git@') || 'Enter a valid repo URL' },
            { type: 'input', name: 'directory', message: 'Optional directory name (blank for default)', default: '' }
        ]);
        const args = ['cl', repoUrl];
        if (directory) args.push(directory);
        await run(args);
        return;
    }
    if (selected === 'b') {
        const { branchName } = await inquirer.prompt([{ type: 'input', name: 'branchName', message: 'New branch name:', validate: v => !!v || 'Branch name is required' }]);
        await run(['b', branchName]);
        return;
    }
    if (selected === 's') {
        const { branchName } = await inquirer.prompt([{ type: 'input', name: 'branchName', message: 'Switch to branch:', validate: v => !!v || 'Branch name is required' }]);
        await run(['s', branchName]);
        return;
    }
    if (selected === 'wt') {
        const { branchName, wtPath } = await inquirer.prompt([
            { type: 'input', name: 'branchName', message: 'Branch for worktree:', validate: v => !!v || 'Branch name is required' },
            { type: 'input', name: 'wtPath', message: 'Worktree path (blank for default)', default: '' }
        ]);
        const args = ['wt', branchName];
        if (wtPath) args.push(wtPath);
        await run(args);
        return;
    }

    // Default: just execute the chosen subcommand
    await run([selected]);
}
