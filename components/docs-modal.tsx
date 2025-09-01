/* eslint-disable react/no-unescaped-entities */
"use client"

import type React from "react"

import { useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Copy } from "lucide-react"
import { isValidElement } from "react"

function CopyInline({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/90 transition hover:bg-white/10"
      aria-label="Copy code"
    >
      <Copy size={14} className="opacity-80" />
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  )
}

function CodeBlock(props: any) {
  const { inline, className, children } = props

  // Normalize text
  const raw = children ?? ""
  const code = Array.isArray(raw) ? raw.join("") : String(raw)

  // Treat as inline if:
  // - inline is true, OR
  // - no language-* class is present (ReactMarkdown sets language-* for fenced blocks)
  const languageClass = (className || "").toString()
  const isInline = (inline ?? true) && !/language-/.test(languageClass)

  if (isInline) {
    return <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.92em]">{code}</code>
  }

  const lang = languageClass.replace("language-", "")
  return (
    <div className="relative my-3">
      <div className="absolute right-2 top-2 z-10">
        <CopyInline text={code} />
      </div>
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-4 text-sm">
        <code className={lang ? `language-${lang}` : undefined}>{code}</code>
      </pre>
    </div>
  )
}

function SafeParagraph({ children }: { children: React.ReactNode }) {
  const kids = Array.isArray(children) ? children : [children]

  const containsBlock = kids.some(function check(node: any): boolean {
    if (!isValidElement(node)) return false
    const t = node.type
    if (t === "pre" || t === "div" || t === "table" || t === "ul" || t === "ol" || t === "hr" || t === "blockquote") {
      return true
    }
    const c = node.props?.children
    const arr = Array.isArray(c) ? c : c ? [c] : []
    return arr.some(check)
  })

  const base = "mb-4 leading-relaxed text-zinc-300"
  return containsBlock ? <div className={base}>{children}</div> : <p className={base}>{children}</p>
}

const DOCS_MD = `# Git Genie — Complete Usage Guide

> **Short:** Git Genie (\`git-genie\` / \`gg\`) is an AI-powered CLI that automates staging, Conventional Commit generation (Gemini), branch flow, and push/merge in one command. This page is your one-stop reference.

---

## Table of contents
- Quick start
- Install & verify
- Basic command syntax
- Flags / Options (deep dive)
- How Git Genie works (step-by-step)
- Complete workflows (examples)
- Advanced usage & edge cases
- Hooks & CI tips
- Troubleshooting & common errors
- Security & privacy
- Contribution guide
- FAQ
- Changelog & releases
- Contact & support

---

## Quick start (30 seconds)
Install (global):
\`\`\`bash
npm install -g @gunjanghate/git-genie
# or
npm install -g git-genie-cli   # if you published under a different name
Run a quick test:
\`\`\`

\`\`\`bash
gg "fix readme typos" --no-ai
# or
git-genie "feat: add login" --type feat --scope auth
\`\`\`

## Install & verify

Global install
\`\`\`bash
npm install -g @gunjanghate/git-genie
\`\`\`

One-line test without installing globally (npx)
\`\`\`bash
npx @gunjanghate/git-genie "fix typo" --no-ai
\`\`\`

Verify your install
\`\`\`bash
which gg       # macOS/Linux
Get-Command gg # PowerShell
gg --help
\`\`\`

## Basic command syntax
\`\`\`bash
gg "<short description>" [options]
\`\`\`

Example:
\`\`\`bash
gg "add new auth flow" --type feat --scope auth
\`\`\`

\`<short description>\` is a short human description used in fallback commit messages and optionally fed to AI as context.

## Flags & options (full reference)
\`\`\`bash
--type <type>        # Commit type (default: feat). Common: feat, fix, docs, style, refactor, test, chore, ci, build, perf
--scope <scope>      # Optional scope for Conventional Commit (e.g., auth, api, ui)
--no-ai              # Disable AI commit generation (force fallback)
--no-branch          # Skip interactive branch selection and commit directly to main
--push-to-main       # Merge current branch to main and push main (use carefully)
--remote <url>       # Add remote origin when initializing a new repo
--help               # Show usage
\`\`\`

Examples:

Use fallback commit message:
\`\`\`bash
gg "update docs" --no-ai
\`\`\`

Create a feature branch with suggested name and use AI:
\`\`\`bash
gg "add oauth" --type feat --scope auth
\`\`\`

Initialize repo, set remote and commit to main:
\`\`\`bash
gg "initial commit" --no-branch --remote https://github.com/you/repo.git --no-ai
\`\`\`

Auto-merge feature branch to main and push:
\`\`\`bash
gg "finish feature X" --push-to-main
\`\`\`

## How Git Genie works (end-to-end flow)

**Parse CLI args**  
Commander reads the short description and flags.

**Repo check / init**  
\`git checkIsRepo()\` — if not a repo, runs \`git init\` and sets up main.

**Add remote (optional)**  
If \`--remote <url>\` provided, tries \`git remote add origin <url>\`.

**Has commits check**  
If no commits yet, Git Genie can create initial branch/commit as required.

**Branch decision**  
If \`--no-branch\` or no commits: switch/create main.

Otherwise: interactive prompt (commit to current branch or create new branch). New branch suggestion: \`{type}/{slug}-{YYYY-MM-DD}\`.

**Staging**  
Runs \`git diff --cached\`. If empty, auto runs \`git add ./\` and re-checks the diff. If still empty, aborts with “no changes”.

**Commit message generation**  
If AI enabled (and \`GEMINI_API_KEY\` present): send staged diff to Gemini \`gemini-1.5-flash\` with a concise prompt that requests a Conventional Commit message.

If AI disabled or API fails: fallback message uses \`\${type}\${scope ? (\${scope}) : ''}: \${desc}\`.

**Commit**  
\`git commit "<message>"\`. Handles first-commit scenarios.

**Push / Merge**  
If user confirmed push, uses \`git push origin <branch>\` (with retry logic).

If \`--push-to-main\` OR user accepted the merge prompt: checkout main, pull, \`git merge <branch>\`, push main, optionally delete the feature branch (offers remote deletion too).

### Commit message generation – practical notes
What is sent to AI? Only the staged diff (\`git diff --cached\`) — lines starting with +/- and file headers.

Privacy: If sensitive, use \`--no-ai\`. Do not commit secrets. Always ensure \`.env\` is in \`.gitignore\`.

Prompting rules: Git Genie requests a short Conventional Commit format \`type(scope): description\`, imperative mood, <50 char description, no trailing period.

Example AI-generated message:
\`\`\`bash
feat(auth): add OAuth2 password grant support
\`\`\`

## Complete common workflows (step-by-step)

1) Normal feature workflow (recommended)
\`\`\`bash
# Work locally, stage changes automatically if you forget
gg "add user profile page" --type feat --scope ui
# Confirm push when prompted; optionally merge to main afterward
\`\`\`
Outcome: feature branch created (if not on main), message generated by AI, commit done, pushed to remote.

2) Quick fix directly to main
\`\`\`bash
gg "fix typo in README" --no-branch --no-ai
\`\`\`
Outcome: commit made directly on main with fallback message.

3) First commit for a new repo + remote
\`\`\`bash
gg "initial commit" --no-branch --no-ai --remote https://github.com/you/repo.git
\`\`\`
Outcome: repo initialized, remote added, first commit on main, optional push when asked.

4) Auto-merge after a feature
\`\`\`bash
gg "implement payment flow" --push-to-main
\`\`\`
Outcome: commits on feature branch, then auto-merge into main and push (may prompt to delete the feature branch).

## Advanced & edge-case guidance

- Merge conflicts: \`--push-to-main\` will fail if merge conflicts exist. Resolve manually:
  - \`git checkout main\`
  - \`git merge <branch>\`
  - Resolve conflicts, \`git add\` changed files, \`git commit\` and \`git push\`
- Large diffs / token limits: If your staged diff is huge and AI provider errors, Git Genie falls back to a simple conventional message. Consider staging only essential files or passing a \`--stat\` mode (planned / future).
- Monorepos: Not auto-scoped: use \`--scope\` to indicate package scope.
- CI usage: You can call \`npx @gunjanghate/git-genie\` in CI, but CI environments should set environment variables and ensure proper git credentials (token-based) if pushing automatically.

## Hooks & local integration
To use Git Genie with git commit hooks, you can add a \`prepare-commit-msg\` hook that uses a helper mode (if you add such a mode). Example baseline hook (safe fallback):
\`\`\`bash
#!/usr/bin/env bash
# skips merge commits
if grep -qi 'merge' "$1" 2>/dev/null; then exit 0; fi
DIFF=$(git diff --staged)
if [ -z "$DIFF" ]; then exit 0; fi
# Basic fallback subject for the hook:
echo "chore: update files" > "$1"
exit 0
\`\`\`
Note: hooks are local to each dev. Provide a script \`scripts/install-hooks\` to distribute (optional).

## Troubleshooting (common errors & fixes)
- "Not a Git repository"  
  Fix: run inside a repo or initialize: \`git init\` or use \`gg ... --no-branch --remote <url>\`.

- "No changes detected to commit even after staging."  
  Cause: files ignored by \`.gitignore\` or nothing to commit. Check \`git status\`.

- Gemini/API fails or \`GEMINI_API_KEY\` missing  
  Fix: set \`GEMINI_API_KEY\` in \`.env\` or OS env; otherwise use \`--no-ai\`.

- Push failed (network/auth)  
  Fix: check remote URL, authenticate (\`gh auth login\` or set git credentials), retry. If persistent, push manually: \`git push origin <branch>\`.

- Publish / npm pitfalls  
  If \`npm publish\` errors about name conflicts, publish under a scope: \`@username/git-genie\` and use \`npm publish --access public\`.

## Security & privacy
Only the staged diff is sent to Gemini; if that still contains secrets, do not use AI. Use \`--no-ai\`.

Don't commit credentials or \`.env\` files. Add \`.env\` to \`.gitignore\`.

Use private org policy for sensitive repos.

## Contributing
To contribute:

- Fork the repo → clone → \`npm install\`.
- Create a feature branch: \`git checkout -b feat/cool\`.
- Make changes, test locally: \`npm link\` to test CLI.
- Run: \`gg "describe your change" --no-ai\` to make a commit for PR.\*
- Open a PR against main, include a short description and testing steps.

\* You can also commit manually for PR changes.

## FAQ (short)
- **Q: Can Git Genie auto-open a PR?**  
  **A:** Not in the current release — PR autopilot is planned (requires \`gh\` CLI integration).

- **Q: Will my code be shared with Google?**  
  **A:** Staged diffs are sent to Gemini when AI is enabled. Use \`--no-ai\` if you prefer not to share.

- **Q: Does it work on Windows?**  
  **A:** Yes — tested on PowerShell. \`chmod\` is not required on Windows.

## Changelog & releases (how you publish)
Bump version and publish:
\`\`\`bash
npm version patch    # increments package.json
npm publish --access public   # scoped packages require --access public
\`\`\`

## Support & contact
- GitHub: https://github.com/gunjanghate/git-genie
- Issues: https://github.com/gunjanghate/git-genie/issues
- NPM: https://www.npmjs.com/package/@gunjanghate/git-genie
- Twitter/X: @gunjanghate

_End of docs_
`

export default function DocsModal() {
  const [open, setOpen] = useState(false)
  const content = useMemo(() => (open ? DOCS_MD : ""), [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
        >
          View full docs
        </button>
      </DialogTrigger>
      <DialogOverlay className="fixed inset-0 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <DialogContent className="fixed left-1/2 top-1/2 z-50 h-[86vh] w-[98vw] max-w-7xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-0 shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:blur-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
        <DialogTitle className="sr-only">Git Genie — Complete Usage Guide</DialogTitle>

        {/* Ambient amber glow behind content */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[50%] w-[80%] -translate-x-1/2 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Scrollable content with comfy padding and hidden scrollbar */}
        <div className="relative h-full overflow-y-auto p-6 md:p-8 lg:p-12 scrollbar-none">
          {/* Left vertical accent rule (subtle) */}
          <div
            aria-hidden
            className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-amber-400/50 via-amber-400/20 to-transparent"
          />

          <article className="markdown text-zinc-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock,
                h1: ({ children }) => <h1 className="mb-4 text-3xl md:text-4xl font-bold text-white">{children}</h1>,
                h2: ({ children }) => <h2 className="mt-8 mb-3 text-2xl font-semibold text-white">{children}</h2>,
                h3: ({ children }) => <h3 className="mt-6 mb-2 text-xl font-semibold text-white">{children}</h3>,
                p: (props) => <SafeParagraph>{props.children}</SafeParagraph>,
                ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-1">{children}</ol>,
                a: (props) => (
                  <a {...props} className="text-amber-400 hover:underline" target="_blank" rel="noreferrer" />
                ),
                blockquote: ({ children }) => (
                  <blockquote className="mb-4 border-l-2 border-amber-400/40 pl-4 text-zinc-300">{children}</blockquote>
                ),
                hr: () => <hr className="my-6 border-white/10" />,
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  )
}
