
import simpleGit from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

const git = simpleGit();

export async function registerSplitCommand(program) {
    const {
        analyzeStagedChanges,
        groupFilesWithAI,
        groupFilesHeuristic,
        generateCommitMessageForGroup,
        validateGroups
    } = await import(
        new URL('../helpers/splitLogic.js', import.meta.url)
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
        new URL('../helpers/splitUI.js', import.meta.url)
    );

    const {
        getActiveProviderInstance,
        getActiveProvider
    } = await import(
        new URL('./config.js', import.meta.url)
    );

<<<<<<< Updated upstream
    const { stageAllFiles } = await import(
        new URL('../helpers/gitUtils.js', import.meta.url)
    );
=======
// ✅ Centralized Git Executor — preview mode intercepts all git calls
function createGitExecutor(preview) {
    return {
        async raw(args) {
            if (preview) {
                console.log(chalk.gray(`  ↳ [preview] git raw ${JSON.stringify(args)}`));
                return;
            }
            return git.raw(args);
        },
        async add(file) {
            if (preview) {
                console.log(chalk.gray(`  ↳ [preview] git add ${file}`));
                return;
            }
            return git.add(file);
        },
        async commit(message) {
            if (preview) {
                console.log(chalk.gray(`  ↳ [preview] git commit "${message}"`));
                return;
            }
            return git.commit(message);
        },
        async push(remote, branch) {
            if (preview) {
                console.log(chalk.gray(`  ↳ [preview] git push ${remote} ${branch}`));
                return;
            }
            return git.push(remote, branch);
        },
        async checkout(branch) {
            if (preview) {
                console.log(chalk.gray(`  ↳ [preview] git checkout ${branch}`));
                return;
            }
            return git.checkout(branch);
        },
        async merge(branch) {
            if (preview) {
                console.log(chalk.gray(`  ↳ [preview] git merge ${branch}`));
                return;
            }
            return git.merge([branch]);
        },
        async revparse(args) {
            if (preview) {
                console.log(chalk.gray(`  ↳ [preview] git rev-parse ${JSON.stringify(args)}`));
                // Simulate HEAD exists in preview
                return 'preview-sha';
            }
            return git.revparse(args);
        },
        async branch() {
            if (preview) {
                console.log(chalk.gray(`  ↳ [preview] git branch --show-current`));
                return { current: 'preview-branch' };
            }
            return git.branch();
        }
    };
}

// ✅ NOT async — Commander needs sync registration
export function registerSplitCommand(program) {
>>>>>>> Stashed changes

    // Register SIGINT once — prevents duplicate listeners on repeated command execution
    if (!process.listenerCount('SIGINT')) {
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n\n⚠ Split operation cancelled by user.'));
            console.log(chalk.cyan('Your staged changes remain unchanged.'));
            console.log(chalk.gray('Tip: Run gg split again when ready'));
            process.exit(0);
        });
    }

    program
        .command('split')
        .description('Split staged changes into logical atomic commits')
        .option('--genie', 'Enable AI-powered grouping (requires API key)')
        .option('--auto', 'Auto-commit all groups without confirmation')
        .option('--dry-run', 'Preview groups without committing')
        .option('--preview', 'Simulate all Git actions without executing them')
        .option('--push-to-main', 'Push and merge changes into main after splitting')
        .option('--max-groups <n>', 'Maximum number of groups', '5')
        .action(async (opts) => {
            try {
                // Initialize preview mode
                const preview = opts.preview || false;
                if (preview) {
                    console.log(chalk.cyan('\n🔍 Running in PREVIEW mode (no Git commands will execute)'));
                    console.log(chalk.gray('Preview executor initialized – git writes are disabled.\n'));
                }

                // Centralized git executor
                const gitExec = createGitExecutor(preview);

                // 1️⃣ Analyze staged changes
                let filesData = await analyzeStagedChanges();

                // Handle no staged changes
                if (filesData.files.length === 0) {
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

                const useAI = opts.genie && provider;

                if (useAI) {
                    try {
                        groups = await groupFilesWithAI(filesData, provider, maxGroups);

                        const validationErrors = validateGroups(groups, filesData);
                        if (validationErrors) {
                            console.error(chalk.red('AI grouping validation failed:'));
                            validationErrors.forEach(err => console.error(chalk.yellow(`  - ${err}`)));
                            console.log(chalk.cyan('Falling back to heuristic grouping...'));
                            groups = groupFilesHeuristic(filesData, maxGroups);
                        }
                    } catch (err) {
                        const { displayProviderError } = await import(new URL('../helpers/errorHandler.js', import.meta.url));
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
                // Preview mode forces commit-all so entire flow (including push-to-main) is simulated
                let action;
                if (opts.auto) action = 'commit-all';
                else if (preview) action = 'commit-all';
                else action = await promptGroupActions(groups);

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
<<<<<<< Updated upstream
                    // Confirm before committing all
                    if (!opts.auto) {
=======
                    if (!opts.auto && !preview) {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
                            // Unstage all, then restage only this group's files
                            try {
                                await gitExec.revparse(['--verify', 'HEAD']);
                                await gitExec.raw(['reset', '--mixed']);
                            } catch {
                                await gitExec.raw(['rm', '--cached', '-r', '.']);
                            }

>>>>>>> Stashed changes
                            for (const file of group.files) {
                                await gitExec.add(file);
                            }

                            // Generate commit message
                            const message = group.customMessage || await generateCommitMessageForGroup(group, filesData, opts.genie ? provider : null);

<<<<<<< Updated upstream
                            // Commit
                            await git.commit(message);
=======
                            await gitExec.commit(message);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                                    await git.revparse(['--verify', 'HEAD']);
                                    // HEAD exists, use it for reset
                                    await git.reset(['HEAD']);
                                } catch {
                                    // No commits yet, just remove all from staging
                                    await git.raw(['rm', '--cached', '-r', '.']);
=======
                                    await gitExec.revparse(['--verify', 'HEAD']);
                                    await gitExec.raw(['reset', '--mixed']);
                                } catch {
                                    await gitExec.raw(['rm', '--cached', '-r', '.']);
>>>>>>> Stashed changes
                                }

                                // Stage only files for this group
                                for (const file of updatedGroup.files) {
                                    await gitExec.add(file);
                                }

                                // Generate or use custom commit message
                                const message = updatedGroup.customMessage || await generateCommitMessageForGroup(updatedGroup, filesData, opts.genie ? provider : null);

<<<<<<< Updated upstream
                                // Commit
                                await git.commit(message);
=======
                                await gitExec.commit(message);
>>>>>>> Stashed changes
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

                // DEBUG — remove after confirming push block runs
                if (process.env.GITGENIE_DEBUG) {
                    console.log(chalk.gray(`\nDEBUG push check: pushToMain=${opts.pushToMain}, committed=${summary.committed}, preview=${preview}`));
                }

                // 7️⃣ Push to main (if requested and commits were made)
                if (opts.pushToMain && !preview && summary.committed === 0) {
                    console.log(chalk.yellow('\n⚠ No commits were created. Skipping push-to-main.'));
                }

                if (opts.pushToMain && summary.committed > 0) {
                    const branchInfo = await gitExec.branch();
                    const currentBranch = branchInfo.current;
                    console.log(chalk.cyan(`\n🚀 Pushing to origin/${currentBranch} and merging into main...`));

                    await gitExec.push('origin', currentBranch);
                    await gitExec.checkout('main');
                    await gitExec.merge(currentBranch);

                    console.log(chalk.green('\n✓ Changes pushed and merged to main'));
                }

                // Preview mode final confirmation
                if (preview) {
                    console.log(chalk.cyan('\n✅ Preview complete. No changes were made to your repository.'));
                }

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
}
