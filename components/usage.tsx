"use client"

import { AnimateIn } from "./parts/animate-in"
import AmbientBackground from "./parts/ambient-two"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { CopyButton } from "./parts/copy-button"

export default function Usage() {
  const flags = [
    { flag: "--genie", desc: "Generate AI commit (alias: --ai).", example: 'gg "oauth added" --ai' },
    { flag: "--type <type>", desc: "Set commit type (default: feat).", example: 'gg "refactor: cleanup" --type feat' },
    { flag: "--scope <scope>", desc: "Set commit scope.", example: 'gg "fix(auth): token refresh" --scope auth' },
    { flag: "--no-branch", desc: "Skip branch selection.", example: 'gg "chore: update deps" --no-branch' },
    { flag: "--push-to-main", desc: "Push to main.", example: "gg --push-to-main" },
    { flag: "--remote <url>", desc: "Add remote.", example: "gg --remote https://github.com/you/repo.git" },
    { flag: "--osc", desc: "Branch name for open source", example: 'gg "improve docs" --osc --type docs' },
  ]

  return (
    <section id="usage" aria-labelledby="usage-title" className="relative mx-auto lg:mx-32 max-w-6xl px-6 py-20 sm:py-24 z-0">
      <AmbientBackground />
      <div className="mb-10">
        <AnimateIn>
          <div>

            <h2 id="usage-title" className="text-2xl font-semibold sm:text-3xl">
              Usage & Flags
            </h2>
            <div className="line h-1 mt-1 animate-collapsible-down w-24 bg-gradient-to-br from-amber-400 to-amber-800"></div>

          </div>
        </AnimateIn>
        <AnimateIn delay={60}>
          <p className="mt-3 max-w-2xl text-zinc-300">Configure Git Genie behavior with clean, human-friendly flags.</p>
        </AnimateIn>
      </div>
      <Accordion type="multiple" className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {flags.map((f, i) => (
          <AnimateIn key={`${f.flag}-${i}`} delay={i * 80}>
            <AccordionItem
              value={f.flag}
              className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-2"
            >
              <AccordionTrigger className="group w-full rounded-xl px-1 py-2 text-left no-underline hover:no-underline">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-sm text-amber-400">{f.flag}</span>
                  <span className="text-zinc-300">{f.desc}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="transition-all data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-300 data-[state=open]:ease-out data-[state=closed]:duration-200 data-[state=closed]:ease-in data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0 data-[state=open]:blur-0 data-[state=closed]:blur-sm data-[state=open]:translate-y-0 data-[state=closed]:-translate-y-1">
                <div className="mt-3 flex items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <span className="truncate font-mono text-xs text-zinc-200" title={f.example}>
                    {f.example}
                  </span>
                  <CopyButton text={f.example} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </AnimateIn>
        ))}
      </Accordion>

      {/* Branch Management Shortcuts Section */}
      <div className="mt-16">
        <AnimateIn>
          <div>

                   <h2 id="shortcuts-title" className="text-2xl font-semibold sm:text-3xl">
              Branch Management Shortcuts
            </h2>
            <div className="line h-1 mt-1 animate-collapsible-down w-24 bg-gradient-to-br from-amber-400 to-amber-800"></div>
          </div>
        </AnimateIn>
            <AnimateIn delay={60}>
          <p className="mt-3 max-w-2xl text-zinc-300 mb-6">Manage your branches effortlessly with these shortcuts.</p>
        </AnimateIn>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          <AnimateIn delay={40}>
            <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-6">
              <span className="font-mono text-base text-amber-400 mb-2">gg b &lt;branchName&gt;</span>
              <span className="text-zinc-300 mb-2">Create and switch to a new branch.<br /><span className="text-xs text-zinc-400">Shortcut for <code>git checkout -b &lt;branchName&gt;</code></span></span>
              <div className="mt-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <span className="font-mono text-xs text-zinc-200">gg b feature/login</span>
                <CopyButton text="gg b feature/login" />
              </div>
            </div>
          </AnimateIn>
          <AnimateIn delay={80}>
            <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-6">
              <span className="font-mono text-base text-amber-400 mb-2">gg s &lt;branchName&gt;</span>
              <span className="text-zinc-300 mb-2">Switch to an existing branch.<br /><span className="text-xs text-zinc-400">Shortcut for <code>git checkout &lt;branchName&gt;</code></span></span>
              <div className="mt-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <span className="font-mono text-xs text-zinc-200">gg s main</span>
                <CopyButton text="gg s main" />
              </div>
            </div>
          </AnimateIn>
          <AnimateIn delay={120}>
            <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-6">
              <span className="font-mono text-base text-amber-400 mb-2">gg wt &lt;branchName&gt; [path] [start]</span>
              <span className="text-zinc-300 mb-2">Create a worktree for a branch.<br /><span className="text-xs text-zinc-400">Auto-creates branch if missing, optionally specify path and start-point.</span></span>
              <div className="mt-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <span className="font-mono text-xs text-zinc-200">gg wt feature/docs ./docs main</span>
                <CopyButton text="gg wt feature/docs ./docs main" />
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}
