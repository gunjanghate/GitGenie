"use client";

import { TerminalSquare, MessageSquarePlus, Flag } from "lucide-react";
import { AnimateIn } from "./parts/animate-in";
import AmbientBackground from "./parts/ambient-two";

export default function Features() {
  const items = [
    {
      icon: (
        <TerminalSquare className="h-6 w-6 text-amber-400" aria-hidden="true" />
      ),
      title: "One command.",
      body: "Stage, commit, push, and merge in one go.",
    },
    {
      icon: (
        <MessageSquarePlus
          className="h-6 w-6 text-amber-400"
          aria-hidden="true"
        />
      ),
      title: "AI commit messages.",
      body: "Uses AI (Gemini) for Conventional Commits.",
    },
    {
      icon: <Flag className="h-6 w-6 text-amber-400" aria-hidden="true" />,
      title: "Custom flags.",
      body: "Control with --genie, --staged, and more.",
    },
    {
      icon: (
        <TerminalSquare className="h-6 w-6 text-amber-400" aria-hidden="true" />
      ),
      title: "gg split",
      body: "Split large staged changes into smaller, logical commits using auto or interactive modes.",
      isNew: true,
    },
  ];

  return (
    <section
      aria-labelledby="features-title"
      className="relative mx-auto lg:mx-32 max-w-6xl px-6 py-20 sm:py-24"
    >
      <AmbientBackground />

      <div className="mb-10 relative z-10">
        <h2
          id="features-title"
          className="text-2xl font-semibold sm:text-3xl text-white"
        >
          Features
        </h2>
        <div className="line h-1 mt-1 animate-collapsible-down w-24 bg-gradient-to-br from-amber-400 to-amber-800"></div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 relative z-10">
        {items.map((it, idx) => (
          <AnimateIn key={it.title} delay={idx * 80}>
            <article className="group flex flex-col gap-1 rounded-2xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                {it.icon}
              </div>

              <h3 className="flex items-center gap-2 text-lg font-semibold">
                {it.title}
                {it.isNew && (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-black">
                    NEW
                  </span>
                )}
              </h3>

              <p className="mt-2 text-zinc-300">{it.body}</p>
            </article>
          </AnimateIn>
        ))}
      </div>
    </section>
  );
}
