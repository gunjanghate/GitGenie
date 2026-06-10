import chalk from "chalk";
import didYouMean from "didyoumean";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Reads the current Git repository state from the working directory.
 * Returns an object describing active conditions so the suggestion engine
 * can prioritize the most relevant commands.
 *
 * All calls are wrapped in try/catch so a non-git directory or any Git
 * error never crashes the suggestion path.
 */
function getGitContext() {
  const ctx = {
    isGitRepo: false,
    isMerging: false,
    isRebasing: false,
    isCherryPicking: false,
    isDetachedHEAD: false,
    hasUncommittedChanges: false,
    hasStagedChanges: false,
    hasUntrackedFiles: false,
    currentBranch: null,
  };

  let gitDir;
  try {
    gitDir = execFileSync("git", ["rev-parse", "--git-dir"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    ctx.isGitRepo = true;
  } catch {
    return ctx;
  }

  // Detect in-progress operations by checking for marker files in the git
  // directory. fs + path are used instead of shell commands so paths with
  // spaces are handled safely and the checks work on Windows as well.
  try {
    ctx.isMerging = fs.existsSync(path.join(gitDir, "MERGE_HEAD"));
    ctx.isRebasing = (
      fs.existsSync(path.join(gitDir, "rebase-merge")) ||
      fs.existsSync(path.join(gitDir, "rebase-apply"))
    );
    ctx.isCherryPicking = fs.existsSync(path.join(gitDir, "CHERRY_PICK_HEAD"));
  } catch { /* ignore */ }

  try {
    const branch = execFileSync("git", ["symbolic-ref", "--short", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    ctx.currentBranch = branch || null;
    ctx.isDetachedHEAD = false;
  } catch {
    ctx.isDetachedHEAD = true;
  }

  try {
    const status = execFileSync("git", ["status", "--porcelain"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const lines = status.split("\n").filter(Boolean);
    ctx.hasStagedChanges = lines.some(l => !/^\?/.test(l) && l[0] !== " ");
    ctx.hasUntrackedFiles = lines.some(l => l.startsWith("??"));
    ctx.hasUncommittedChanges = lines.some(l => l[1] !== " " && !l.startsWith("??"));
  } catch { /* ignore */ }

  return ctx;
}

/**
 * Returns an ordered list of suggested command names based on the typed
 * command string and the current Git repository state.
 *
 * Priority logic:
 * 1. Fuzzy-match the typed string against all registered command names.
 * 2. Promote context-specific commands to the front of the list so the
 *    most relevant suggestion appears first.
 * 3. Attach a brief reason when the suggestion is driven by context so
 *    users understand why they are seeing that particular command.
 *
 * @param {string} cmd - The unrecognized command string the user typed.
 * @param {string[]} allCommands - Array of registered command names.
 * @param {object} ctx - Git context from getGitContext().
 * @returns {{ name: string, reason: string | null }[]} Ordered suggestions.
 */
function rankSuggestions(cmd, allCommands, ctx) {
  const fuzzyMatch = didYouMean(cmd, allCommands);
  const suggestions = [];
  const seen = new Set();

  function add(name, reason) {
    if (name && allCommands.includes(name) && !seen.has(name)) {
      suggestions.push({ name, reason });
      seen.add(name);
    }
  }

  // Context-driven promotions
  if (ctx.isMerging) {
    add("recover", "merge conflict detected - use 'recover' to restore a clean state");
    add("undo", "merge conflict detected - use 'undo' to roll back the merge");
  }

  if (ctx.isRebasing) {
    add("recover", "rebase in progress - use 'recover' if you need to abort");
    add("undo", "rebase in progress - use 'undo' to step back");
  }

  if (ctx.isCherryPicking) {
    add("recover", "cherry-pick in progress - use 'recover' to clean up");
  }

  if (ctx.isDetachedHEAD) {
    add("b", "detached HEAD state - create a branch first with 'b'");
    add("recover", "detached HEAD state - use 'recover' if you need to get back");
  }

  if (ctx.hasStagedChanges && cmd.length <= 2) {
    add("commit", "staged changes detected - commit them with 'commit'");
  }

  if (ctx.hasUncommittedChanges && !ctx.hasStagedChanges && cmd.length <= 2) {
    add("status", "uncommitted changes - review them with 'status'");
  }

  // Fuzzy match result goes after context-driven ones
  if (fuzzyMatch) {
    add(fuzzyMatch, null);
  }

  // Fill with remaining commands not yet suggested
  for (const name of allCommands) {
    add(name, null);
  }

  return suggestions;
}

/**
 * Builds the formatted hint lines shown to the user after an unknown command.
 * Shows at most 3 suggestions to avoid overwhelming output.
 */
function formatSuggestionHints(suggestions) {
  const top = suggestions.slice(0, 3);
  return top.map(({ name, reason }, idx) => {
    const label = idx === 0
      ? chalk.green(`  Did you mean: gg ${name}?`)
      : chalk.gray(`  Or try:       gg ${name}`);
    const note = reason ? chalk.yellow(`  (${reason})`) : "";
    return note ? `${label}\n${note}` : label;
  }).join("\n");
}

export function handleUnknownCommand(program) {
  program.on("command:*", ([cmd]) => {
    const allCommands = program.commands.map(c => c.name());
    const ctx = getGitContext();
    const suggestions = rankSuggestions(cmd, allCommands, ctx);

    console.log(chalk.red(`\n❌ Unknown command: "${cmd}"`));

    if (suggestions.length > 0) {
      console.log(formatSuggestionHints(suggestions));
    }

    // Contextual state banner
    const stateFlags = [];
    if (ctx.isMerging)       stateFlags.push(chalk.yellow("⚡ Merge in progress"));
    if (ctx.isRebasing)      stateFlags.push(chalk.yellow("⚡ Rebase in progress"));
    if (ctx.isCherryPicking) stateFlags.push(chalk.yellow("⚡ Cherry-pick in progress"));
    if (ctx.isDetachedHEAD)  stateFlags.push(chalk.yellow("⚠  Detached HEAD state"));
    if (stateFlags.length > 0) {
      console.log(chalk.gray("\n  Repo state: ") + stateFlags.join("  "));
    }

    console.log(chalk.cyan('\n  Run "gg --help" to list all commands\n'));
    process.exit(1);
  });
}
