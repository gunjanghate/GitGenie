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
    } catch { }
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
    <div className="relative my-3 w-fit">
      <div className="absolute right-2 top-2 z-10">
        <CopyInline text={code} />
      </div>
      <pre className="text-wrap rounded-lg border border-white/10 bg-black/60 py-8 px-4 text-sm">
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
    const c = (node.props as any)?.children
    const arr = Array.isArray(c) ? c : c ? [c] : []
    return arr.some(check)
  })

  const base = "mb-4 leading-relaxed text-zinc-300"
  return containsBlock ? <div className={base}>{children}</div> : <p className={base}>{children}</p>
}

const DOCS_MD = `# Git Genie — Updated Usage Guide (Current Implementation)

> **Essence:** \`gg\` automates staging, Conventional Commit creation (Gemini), branch flow, optional merge to main, and push. Now includes a persistent API key config command.

---

## Contents
- Quick start
- Install & verify
- Configure Gemini API key
- Command syntax & options
- How it works (mapped to source)
- Common workflows
- Branch & merge behavior
- AI commit generation details
- Examples
- Troubleshooting
- Security & privacy
- Contributing / roadmap
- FAQ / Support

---

## Quick start
Global install:
\`\`\`bash
npm install -g @gunjanghate/git-genie
\`\`\`

Configure your Gemini API key (one time):
\`\`\`bash
gg config YOUR_GEMINI_API_KEY_HERE
\`\`\`

Make a commit with AI assist:
\`\`\`bash
gg "add user profile section" --type feat --scope ui --genie
\`\`\`

## Install & verify
\`\`\`bash
which gg            # macOS / Linux
Get-Command gg      # PowerShell
gg --help
\`\`\`

Use ad‑hoc (no global install):
\`\`\`bash
npx @gunjanghate/git-genie "fix typo" --genie
\`\`\`

## Configure Gemini API key
Priority order used by the CLI:
1. \`GEMINI_API_KEY\` env var (process.env)
2. Stored config file: \`~/.gitgenie/config.json\`

Store key:
\`\`\`bash
gg config <API_KEY>
\`\`\`

Edit manually (optional):
\`\`\`json
{ "GEMINI_API_KEY": "sk-..." }
\`\`\`

Remove key: delete the file \`~/.gitgenie/config.json\`.

## Command syntax
\`\`\`bash
gg <desc> [options]
\`\`\`
\`<desc>\` = short human summary (used in fallback commit message if AI unavailable).

### Subcommands
\`config <apikey>\`  – Persist Gemini key.

### Options
\`--type <type>\`        Conventional Commit type (default: feat)
\`--scope <scope>\`       Optional scope, e.g. auth, api, ui
\`--genie\`               Enable AI commit generation (Gemini)
\`--no-branch\`           Commit directly to main (skip prompt)
\`--push-to-main\`        After commit: merge current branch into main & push
\`--remote <url>\`        Add remote origin if repo just initialized
\`--help\`                Show help

Types: feat | fix | docs | style | refactor | test | chore | ci | build | perf

Fallback commit format (no AI or failure): \`type(scope?): desc\`.

## How it works (step mapping)
1. Parse args via Commander (main action wrapper).
2. Repo check: if not a git repo → \`git init\`.
3. Remote: if \`--remote\` provided → attempt \`git remote add origin <url>\` (ignore if exists).
4. Detect first commit (rev-parse HEAD).
5. Branch logic:
  - If \`--no-branch\` OR no commits → force/create main (\`git checkout -B main\`).
  - Else interactive: current branch vs create new branch.
  - Suggested new branch: \`<type>/<slugified-desc>-YYYY-MM-DD\`.
6. Staging: if no staged diff → auto stage all (./*) → re-check; error if still empty.
7. AI commit generation (if \`--genie\` & key): send staged diff to Gemini model \`gemini-2.0-flash\` with strict prompt; capture plain message.
8. Commit: \`git commit "<message>"\`.
9. Push flow:
  - If \`--push-to-main\` and not on main → merge helper (see below).
  - Else prompt to push; if yes → push with retry (2 retries).
  - If pushed and branch != main → optional prompt to merge to main.
10. Optional merge to main: checkout main → pull → merge feature → push → optional delete local + remote branch.

## Common workflows
Feature with AI + push:
\`\`\`bash
gg "add oauth flow" --type feat --scope auth --genie
\`\`\`

Direct quick fix on main:
\`\`\`bash
gg "fix typo in README" --no-branch --genie
\`\`\`

Initialize new repo + remote:
\`\`\`bash
gg "initial commit" --no-branch --remote https://github.com/you/repo.git --genie
\`\`\`

Auto merge after finishing work:
\`\`\`bash
gg "implement payment flow" --push-to-main
\`\`\`

## Branch & merge behavior
- New branch name slug = type + sanitized desc + date.
- \`--push-to-main\` triggers: checkout main → pull (non-fatal if remote missing) → merge → push main → optional feature cleanup.
- Branch cleanup: interactive confirm; deletes local + tries remote (ignored if absent).

## AI commit generation
Model: \`gemini-2.0-flash\`.
Prompt enforces: Conventional Commit, max ~50 char description, imperative, lowercase first letter, no trailing period.
Only staged diff is sent (added/removed lines & headers). No untracked / unstaged content.
Failure path: logs warning + fallback commit string.

## Examples
Plain conventional commit (no AI):
\`\`\`bash
gg "add dark mode toggle" --type feat --scope ui
\`\`\`

Force AI (if key missing → fallback + warning):
\`\`\`bash
gg "refactor data layer" --type refactor --genie
\`\`\`

Custom remote same run:
\`\`\`bash
gg "initial commit" --no-branch --remote https://github.com/you/new.git
\`\`\`

## Troubleshooting
"GEMINI_API_KEY not found" → Run \`gg config <key>\` or export env var.
"No changes detected to commit" → Ensure edits; check \`git status\`; verify .gitignore.
Push retries failing → validate remote URL & auth; run manual: \`git push origin <branch>\`.
Merge conflicts (during \`--push-to-main\`): resolve manually, then commit & push main.
Branch already exists (creating) → choose a different name.

## Security & privacy
- Only staged diff leaves machine when using AI.
- Avoid staging secrets; keep \`.env\` out of git.
- Delete config file if rotating keys.

## Contributing / roadmap
Planned: PR automation, partial diff selection, stats mode, model selection flag.
Contribute: fork → branch → changes → \`gg "feat xyz" --genie\` → PR.

## FAQ
Q: Windows support?  A: Yes (PowerShell tested).  
Q: Key storage secure?  A: Plain JSON in home dir; set perms yourself if needed.  
Q: Can it open PRs?  A: Not yet (roadmap).  
Q: Model configurable?  A: Currently fixed to \`gemini-2.0-flash\`.

## Publish (maintainers)
\`\`\`bash
npm version patch   # or minor / major
npm publish --access public
\`\`\`

## Support
- GitHub: https://github.com/gunjanghate/git-genie
- Issues: https://github.com/gunjanghate/git-genie/issues
- NPM: https://www.npmjs.com/package/@gunjanghate/git-genie
- X / Twitter: @gunjanghate11

_End of updated docs_
`

export default function DocsModal() {
  const [open, setOpen] = useState(false)
  const content = useMemo(() => (open ? DOCS_MD : ""), [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          id="docs"
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
