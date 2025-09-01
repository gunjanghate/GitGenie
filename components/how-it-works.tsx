"use client"

import { AnimateIn } from "./parts/animate-in"
import { CopyButton } from "./parts/copy-button"
import AmbientBackground from "./parts/ambient-background"

export default function HowItWorks() {
  const steps = [
    {
      badge: "Step 1",
      title: "Install",
      cmd: "npm i @gunjanghate/git-genie",
      desc: "Add Git Genie to your repository.",
    },
    {
      badge: "Step 2",
      title: "Generate commit",
      cmd: 'gg "your code changes"',
      desc: "Stages changes and generates a Conventional Commit using AI.",
    },
    {
      badge: "Step 3",
      title: "Push & done",
      cmd: "gg --push",
      desc: "Push with optional merge depending on flags.",
    },
  ]

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <AmbientBackground />
      <div className="mb-10">
        <AnimateIn>
          <h2 id="how-title" className="text-2xl font-semibold sm:text-3xl">
            How it works
          </h2>
        </AnimateIn>
        <AnimateIn delay={60}>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Three steps with clean defaults. Use flags to tailor your flow.
          </p>
        </AnimateIn>
      </div>

      <ol className="grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <AnimateIn key={s.badge} delay={i * 90}>
            <li className="group flex h-full flex-col rounded-2xl border border-white/10 bg-zinc-900/40 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_3px_rgba(245,158,11,0.12)]">
              <div className="mb-3 inline-flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                  {s.badge}
                </span>
                <span className="text-sm text-zinc-300">{s.title}</span>
              </div>
              <p className="text-zinc-300">{s.desc}</p>
              <div className="mt-auto flex w-full items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2.5 font-mono text-sm text-zinc-200 transition-all duration-200 group-hover:border-amber-400/40">
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
