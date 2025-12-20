import simpleGit from "simple-git";
const git = simpleGit();

// Keyword matching for FEAT/FIX
const fixKeywords = ["fix", "bug", "error", "issue", "resolve", "patch"];
const featKeywords = ["add", "implement", "feature", "new", "create"];

export async function detectCommitType() {
  try {
    const diff = await git.diff(["--cached"]);

    if (!diff) return "feat"; // Default fallback

    // Get changed file list
    const files = diff.split("\n").filter(line => line.startsWith("diff --git")).join("\n");

    // File-based classification
    if (files.match(/\.md/i)) return "docs";
    if (files.match(/package\.json|pnpm-lock|yarn\.lock|config|\.env/i)) return "chore";
    if (files.match(/\.test\.|\.spec\./i)) return "test";
    if (files.match(/\.css|\.scss|\.tailwind\./i)) return "style";

    // Content-based — FIX or FEAT?
    const diffLower = diff.toLowerCase();

    if (fixKeywords.some(w => diffLower.includes(w))) return "fix";
    if (featKeywords.some(w => diffLower.includes(w))) return "feat";

    return "feat"; // Default
  } catch {
    return "feat";
  }
}
