"use client"

import { AnimateIn } from "./parts/animate-in"
import { CopyButton } from "./parts/copy-button"
import AmbientBackground from "./parts/ambient-three"

export default function HowItWorks() {
  const steps = [
    {
      badge: "Step 1",
      title: "Install",
      cmd: "npm install -g @gunjanghate/git-genie",
      desc: "Install Globally or Root of the project .",
    },
    {
      badge: "Step 2",
      title: "Configure AI (once)",
      cmd: "gg config YOUR_GEMINI_API_KEY",
      desc: "Saves key to ~/.gitgenie/config.json so --genie can generate commits.",
    },
    {
      badge: "Step 3",
      title: "Commit with AI",
      cmd: 'gg "add user profile section" --type feat --scope ui --genie',
      desc: "Auto stages (if needed), builds Conventional Commit via Gemini, commits.",
    },
    {
      badge: "Step 4",
      title: "Push / Merge",
      cmd: 'gg "finish oauth flow" --push-to-main',
      desc: "Either accept push prompts or auto merge to main & push in one go.",
    },
  ];


  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative mx-auto lg:mx-32 max-w-6xl px-6 py-20 sm:py-24 z-0">
      <AmbientBackground />
      <div className="mb-10">
        <AnimateIn>
          <div>

            <h2 id="how-title" className="text-2xl font-semibold sm:text-3xl">
              How it works
            </h2>
            <div className="line h-1 mt-1 animate-collapsible-down w-24 bg-gradient-to-br from-amber-400 to-amber-800"></div>

          </div>
        </AnimateIn>
        <AnimateIn delay={60}>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Three steps with clean defaults. Use flags to tailor your flow.
          </p>
        </AnimateIn>
      </div>

      <ol className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <AnimateIn key={s.badge} delay={i * 90}>
            <li className="group flex h-full flex-col gap-3 sm:gap-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-4 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_3px_rgba(245,158,11,0.12)]">
              <div className="mb-2 sm:mb-3 inline-flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 sm:px-3 py-1 text-xs text-zinc-300">
                  {s.badge}
                </span>
                <span className="text-sm text-zinc-300">{s.title}</span>
              </div>
              <p className="text-sm sm:text-base text-zinc-300">{s.desc}</p>
              <div className="mt-auto flex w-full items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-xs sm:text-sm text-zinc-200 transition-all duration-200 group-hover:border-amber-400/40">
                <div className="flex-1 min-w-0">
                  <code
                    aria-label={`${s.title} command`}
                    className="block overflow-hidden text-ellipsis whitespace-nowrap pr-1"
                    title={s.cmd}
                  >
                    {s.cmd}
                  </code>
                </div>
                <div className="shrink-0">
                  <CopyButton text={s.cmd} />
                </div>
              </div>
            </li>
          </AnimateIn>
        ))}
      </ol>
    </section>
  )
}
