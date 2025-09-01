"use client"

import { TerminalSquare, MessageSquarePlus, Flag } from "lucide-react"
import { AnimateIn } from "./parts/animate-in"
import AmbientBackground from "./parts/ambient-background"

export default function Features() {
  const items = [
    {
      icon: <TerminalSquare className="h-6 w-6 text-amber-400" aria-hidden="true" />,
      title: "One command.",
      body: "Stage, commit, push, and merge in one go.",
    },
    {
      icon: <MessageSquarePlus className="h-6 w-6 text-amber-400" aria-hidden="true" />,
      title: "AI commit messages.",
      body: "Uses AI (Gemini) for Conventional Commits.",
    },
    {
      icon: <Flag className="h-6 w-6 text-amber-400" aria-hidden="true" />,
      title: "Custom flags.",
      body: "Control with --no-ai, --staged, and more.",
    },
  ]

  return (
    <section aria-labelledby="features-title" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <AmbientBackground />
      <h2 id="features-title" className="sr-only">
        Features
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <AnimateIn key={it.title} delay={idx * 80}>
            <article className="group rounded-2xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                {it.icon}
              </div>
              <h3 className="text-lg font-semibold">{it.title}</h3>
              <p className="mt-2 text-zinc-300">{it.body}</p>
            </article>
          </AnimateIn>
        ))}
      </div>
    </section>
  )
}
