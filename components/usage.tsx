"use client"

import { useState, useEffect } from "react"
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

  // Responsive Check: Initialize as null to avoid hydration mismatch, then determine on mount
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    // Check on mount and resize
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

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

      {/* RESPONSIVE LOGIC:
          - Wait until mounted (isDesktop !== null) to prevent SSR mismatch
          - Desktop (isDesktop = true): Renders type="multiple" (Grid Layout)
          - Mobile (isDesktop = false): Renders type="single" (Stack Layout)
      */}
      {isDesktop === null ? null : isDesktop ? (
        // DESKTOP: Multiple cards can be open, 4-column grid
        <Accordion 
          type="multiple" 
          className="grid items-stretch gap-6 lg:grid-cols-4 auto-rows-[1fr]"
        >
           {renderFlags(flags)}
        </Accordion>
      ) : (
        // MOBILE/TABLET: Only one card open at a time, Single column stack
        <Accordion 
          type="single" 
          collapsible 
          className="grid items-start gap-4 grid-cols-1"
        >
           {renderFlags(flags)}
        </Accordion>
      )}

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
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          <AnimateIn delay={40}>
            <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-6">
              <span className="font-mono text-base text-amber-400 mb-2">gg b &lt;branch&gt;</span>
              <span className="text-zinc-300 mb-4 text-sm">Create and switch to a new branch.<br /><span className="text-xs text-zinc-400">git checkout -b</span></span>
              <div className="mt-auto flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <span className="font-mono text-xs text-zinc-200 break-all">gg b feature/login</span>
                <CopyButton text="gg b feature/login" />
              </div>
            </div>
          </AnimateIn>
          <AnimateIn delay={80}>
            <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-6">
              <span className="font-mono text-base text-amber-400 mb-2">gg s &lt;branch&gt;</span>
              <span className="text-zinc-300 mb-4 text-sm">Switch to an existing branch.<br /><span className="text-xs text-zinc-400">git checkout</span></span>
              <div className="mt-auto flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <span className="font-mono text-xs text-zinc-200 break-all">gg s main</span>
                <CopyButton text="gg s main" />
              </div>
            </div>
          </AnimateIn>
          <AnimateIn delay={120}>
            <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-6">
              <span className="font-mono text-base text-amber-400 mb-2">gg wt ...</span>
              <span className="text-zinc-300 mb-4 text-sm">Create a worktree for a branch.<br /><span className="text-xs text-zinc-400">Auto-creates branch if missing.</span></span>
              <div className="mt-auto flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <span className="font-mono text-xs text-zinc-200 break-all">gg wt docs ./docs</span>
                <CopyButton text="gg wt docs ./docs" />
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}

function renderFlags(flags: any[]) {
  return flags.map((f, i) => (
    <AnimateIn key={`${f.flag}-${i}`} delay={i * 80}>
      <AccordionItem
        value={f.flag}
        className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-2 h-full"
      >
        <AccordionTrigger className="group w-full rounded-xl px-1 py-2 text-left no-underline hover:no-underline cursor-pointer">
          <div className="flex flex-col gap-1 pr-2">
            <span className="font-mono text-sm text-amber-400 break-words">{f.flag}</span>
            <span className="text-zinc-300 text-sm leading-snug">{f.desc}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="transition-all">
          <div className="mt-3 flex items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <span className="truncate font-mono text-xs text-zinc-200" title={f.example}>
              {f.example}
            </span>
            <CopyButton text={f.example} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </AnimateIn>
  ))
}
