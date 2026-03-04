import chalk from "chalk";
import simpleGit from "simple-git";

const git = simpleGit();

export async function registerPRCommand(program) {
  program
    .command("pr")
    .description("Generate PR description from recent commits")
    .option("--number <num>", "Number of commits to analyze", "5")
    
    .action(async (options) => {
      try {
        const count = parseInt(options.number) || 5;

        console.log(chalk.blue(`Analyzing last ${count} commits...\n`));

        // Get commits (ignore merge commits)
        const log = await git.raw([
          "log",
          "-n",
          `${count}`,
          "--pretty=format:%s",
          "--no-merges",
        ]);

        const commits = log.split("\n").filter(Boolean);

        // Get modified files
        const filesRaw = await git.raw([
          "diff",
          "--name-only",
          `HEAD~${count}..HEAD`,
        ]);

        const files = [...new Set(filesRaw.split("\n").filter(Boolean))];

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
          changes += features.map(c => `- ${c}`).join("\n") + "\n\n";
        }

        if (fixes.length) {
          changes += "### Bug Fixes\n";
          changes += fixes.map(c => `- ${c}`).join("\n") + "\n\n";
        }

        if (refactors.length) {
          changes += "### Refactoring\n";
          changes += refactors.map(c => `- ${c}`).join("\n") + "\n\n";
        }

        if (others.length) {
          changes += "### Other Changes\n";
          changes += others.map(c => `- ${c}`).join("\n") + "\n";
        }

        // -------- Generate Summary --------
        const summaryParts = [];

        if (features.length) summaryParts.push("new features");
        if (fixes.length) summaryParts.push("bug fixes");
        if (refactors.length) summaryParts.push("code refactoring");

        let summary = "This PR includes updates from recent commits.";

        if (summaryParts.length) {
          summary = `This PR includes ${summaryParts.join(", ")} based on recent commits.`;
        }

        // -------- Files Modified --------
        const fileList = files.map((f) => `- ${f}`).join("\n");

        // -------- Final PR Description --------
        const prDescription = `
## Summary
${summary}

## Changes Made
${changes}

## Files Modified
${fileList}

## Testing
- Manual testing recommended

## Breaking Changes
None
`;

        console.log(chalk.green("Generated PR Description:\n"));
        console.log(prDescription);

      } catch (err) {
        console.error(chalk.red("Failed to generate PR description"));
        console.error(err.message);
      }
    });
}