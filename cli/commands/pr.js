import chalk from "chalk";
import ora from "ora";
import simpleGit from "simple-git";
import { getActiveProviderInstance } from "../commands/config.js";

const git = simpleGit();

export async function registerPRCommand(program) {
  program
    .command("pr")
    .description("Generate PR description from recent commits")
    .option("--count <number>", "Number of commits to analyze", "5")
    .option("--genie", "Generate PR description using AI")
    .action(async (options) => {
      try {
        // Bug 2 fix: parseInt with radix-10 and positive-integer validation
        const rawCount = parseInt(options.count, 10);
        if (
          options.count !== undefined &&
          (isNaN(rawCount) || rawCount < 1 || rawCount > 10000)
        ) {
          console.error(
            chalk.red(
              `\u2716  --count must be a positive integer (1\u201310000), got: "${options.count}"`
            )
          );
          process.exit(1);
        }
        const requestedCount = !isNaN(rawCount) && rawCount > 0 ? rawCount : 5;
        const useAI = options.genie || false;

        // Bug 1 fix: clamp requestedCount to the number of commits that actually exist
        let safeCount = requestedCount;
        let diffRange = `HEAD~${requestedCount}..HEAD`;
        try {
          const totalRaw = await git.raw(["rev-list", "--count", "HEAD"]);
          const total = Math.max(1, parseInt(totalRaw.trim(), 10) || 1);
          safeCount = Math.min(requestedCount, total);
          if (safeCount < requestedCount) {
            console.log(
              chalk.yellow(
                `\u26a0  Repository has only ${total} commit(s); using --count ${safeCount} instead of ${requestedCount}.`
              )
            );
          }
          if (total === safeCount) {
            // Use root commit SHA so we capture ALL history (HEAD~N would fail for N===total)
            const rootSha = (
              await git.raw(["rev-list", "--max-parents=0", "HEAD"])
            ).trim();
            diffRange = `${rootSha}..HEAD`;
          } else {
            diffRange = `HEAD~${safeCount}..HEAD`;
          }
        } catch (_countErr) {
          // Fallback: use original count; diff error will be caught below
        }

        console.log(chalk.blue(`Analyzing last ${safeCount} commits...\n`));

        // Get commits (ignore merge commits)
        const log = await git.raw([
          "log",
          "-n",
          `${safeCount}`,
          "--pretty=format:%s",
          "--no-merges",
        ]);

        const commits = log.split("\n").filter(Boolean);

        // Bug 4 fix: early-exit with clear message when no commits found
        if (commits.length === 0) {
          console.log(
            chalk.yellow(
              "\u26a0  No commits found in the requested range. Nothing to describe."
            )
          );
          process.exit(0);
        }

        // Bug 3 fix: try-catch around diff so a git error doesn't crash the process
        let filesRaw = "";
        try {
          filesRaw = await git.raw([
            "diff",
            "--name-only",
            diffRange,
          ]);
        } catch (_diffErr) {
          console.log(
            chalk.yellow(
              "\u26a0  Could not determine changed files \u2014 showing commits only."
            )
          );
        }

        const files = [...new Set(filesRaw.split("\n").filter(Boolean))];

        // ================= AI MODE =================
        if (useAI) {
          const provider = await getActiveProviderInstance();

          if (!provider) {
            console.log(
              chalk.yellow(
                "\u26a0 AI provider not configured. Falling back to structured mode."
              )
            );
          } else {
            const spinner = ora("Generating PR description using AI...").start();

            try {
              const aiDescription = await provider.generatePRDescription(
                commits.join("\n")
              );

              spinner.succeed("AI PR description generated\n");
              console.log(aiDescription);
              return;
            } catch (err) {
              spinner.fail("AI generation failed. Falling back to structured mode.");
            }
          }
        }

        // ================= STRUCTURED MODE =================

        // -------- Commit Classification --------
        const features = [];
        const fixes = [];
        const refactors = [];
        const others = [];

        for (const commit of commits) {
          const lower = commit.toLowerCase();

          if (lower.startsWith("feat")) {
            features.push(commit);
          } else if (lower.startsWith("fix")) {
            fixes.push(commit);
          } else if (lower.startsWith("refactor")) {
            refactors.push(commit);
          } else {
            others.push(commit);
          }
        }

        // -------- Build Changes Section --------
        let changes = "";

        if (features.length) {
          changes += "### Features\n";
          changes += features.map((c) => `- ${c}`).join("\n") + "\n\n";
        }

        if (fixes.length) {
          changes += "### Bug Fixes\n";
          changes += fixes.map((c) => `- ${c}`).join("\n") + "\n\n";
        }

        if (refactors.length) {
          changes += "### Refactoring\n";
          changes += refactors.map((c) => `- ${c}`).join("\n") + "\n\n";
        }

        if (others.length) {
          changes += "### Other Changes\n";
          changes += others.map((c) => `- ${c}`).join("\n") + "\n";
        }

        // -------- Generate Summary --------
        const summaryParts = [];

        if (features.length) summaryParts.push("new features");
        if (fixes.length) summaryParts.push("bug fixes");
        if (refactors.length) summaryParts.push("code refactoring");

        let summary = "This PR includes updates from recent commits.";

        if (summaryParts.length) {
          summary = `This PR includes ${summaryParts.join(
            ", "
          )} based on recent commits.`;
        }

        // -------- Output PR Template --------
        const prTemplate = `## Summary
${summary}

## Changes
${changes}
## Files Modified
${files.length > 0 ? files.map((f) => `- \`${f}\``).join("\n") : "_No file diff available._"}

## Testing
- [ ] All existing tests pass
- [ ] New tests added for changed functionality
- [ ] Manual testing completed

## Breaking Changes
None
`;

        console.log(chalk.green("\n\u2705 PR Description Generated:\n"));
        console.log(prTemplate);
      } catch (error) {
        console.error(chalk.red(`Error generating PR description: ${error.message}`));
        process.exit(1);
      }
    });
}
