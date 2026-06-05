import simpleGit from "simple-git";
const git = simpleGit();

// Keyword matching for FEAT/FIX
const fixKeywords = ["fix", "bug", "error", "issue", "resolve", "patch"];
const featKeywords = ["add", "implement", "feature", "new", "create"];

/**
 * Known binary file extensions.
 * Files with these extensions are NEVER text-diffed — they are skipped
 * before any diff payload is fetched to avoid OOM on large binary assets.
 * CWE-20 / CWE-770 guard.
 */
const BINARY_EXTENSIONS = new Set([
  "png","jpg","jpeg","gif","webp","svg","ico","bmp","tiff","avif",
  "mp4","mov","avi","mkv","webm","mp3","wav","ogg","flac","aac",
  "zip","tar","gz","bz2","xz","7z","rar",
  "pdf","doc","docx","xls","xlsx","ppt","pptx",
  "wasm","o","so","dll","exe","bin","node","pyc",
  "db","sqlite","sqlite3","ttf","otf","woff","woff2",
]);

function hasBinaryExtension(filePath) {
  const ext = (filePath.split(".").pop() ?? "").toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

export async function detectCommitType() {
  try {
    // Step 1 — get names only (no binary data yet)
    const nameStatus = await git.diff(["--cached", "--name-only"]);
    const changedFiles = nameStatus
      .split("\n")
      .map(f => f.trim())
      .filter(Boolean);

    // Step 2 — if every staged file is binary, return safe default immediately
    if (changedFiles.length > 0 && changedFiles.every(hasBinaryExtension)) {
      return "feat"; // binary-only commit — skip content scan
    }

    // Step 3 — diff only non-binary files to avoid raw-binary OOM
    const textFiles = changedFiles.filter(f => !hasBinaryExtension(f));
    const diffArgs = textFiles.length > 0
      ? ["--cached", "--", ...textFiles]
      : ["--cached"];

    const diff = await git.diff(diffArgs);
    if (!diff) return "feat";

    // File-based classification (unchanged behaviour)
    const files = diff
      .split("\n")
      .filter(line => line.startsWith("diff --git"))
      .join("\n");

    if (files.match(/\.md/i))                                        return "docs";
    if (files.match(/package\.json|pnpm-lock|yarn\.lock|config|\.env/i)) return "chore";
    if (files.match(/\.test\.|\.spec\./i))                        return "test";
    if (files.match(/\.css|\.scss|\.tailwind\./i))                return "style";

    // Content-based — FIX or FEAT? (safe: text-only diff)
    const diffLower = diff.toLowerCase();
    if (fixKeywords.some(w => diffLower.includes(w))) return "fix";
    if (featKeywords.some(w => diffLower.includes(w))) return "feat";

    return "feat"; // Default
  } catch {
    return "feat";
  }
}
