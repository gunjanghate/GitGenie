
import simpleGit from 'simple-git';
import ora from 'ora';
import chalk from 'chalk';

/** Stage all files (including dotfiles and deletions) */
export async function stageAllFiles() {
    const git = simpleGit();
    const spinner = ora('📂 Staging all files...').start();
    try {
        await git.add(['-A']);
        spinner.succeed(' All files staged');
    } catch (err) {
        spinner.fail('Failed to stage files.');
        console.error(chalk.red('Tip: Make sure you have changes to stage and your repository is not empty.'));
        console.error(chalk.cyan('To check status: git status'));
        throw err;
    }
}

/** Validate a Git remote origin URL (HTTPS or SSH). Returns true or an error message. */
export function validateRemoteUrl(url) {
    if (!url || !url.trim()) return 'Remote URL cannot be empty';

    const trimmed = url.trim();
    const httpsPattern = /^https:\/\/[a-zA-Z0-9.-]+(?::\d{1,5})?\/[^\s]+$/;
    const sshScpPattern = /^git@[a-zA-Z0-9.-]+:[a-zA-Z0-9._\/-]+(?:\.git)?$/;
    const sshUrlPattern = /^ssh:\/\/git@[a-zA-Z0-9.-]+(?::\d{1,5})?\/[a-zA-Z0-9._\/-]+(?:\.git)?$/;

    return (httpsPattern.test(trimmed) || sshScpPattern.test(trimmed) || sshUrlPattern.test(trimmed))
        ? true
        : 'Please enter a valid Git remote URL (https://host[:port]/path, ssh://[user@]host[:port]/path, or user@host:path)';
}
