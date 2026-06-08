
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
    const httpsPattern = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[^\s]*)?$/;
    const sshPattern = /^git@[a-zA-Z0-9.-]+:[a-zA-Z0-9._\/-]+\.git$/;

    return (httpsPattern.test(trimmed) || sshPattern.test(trimmed))
        ? true
        : 'Please enter a valid Git remote URL (https://... or git@host:user/repo.git)';
}
