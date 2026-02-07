"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { AnimateIn } from "./parts/animate-in"
import { CopyButton } from "./parts/copy-button"
import AmbientBackground from "./parts/ambient-two"

export default function HowItWorks() {
  // Ensure ScrollTrigger is registered only on the client
  useEffect(() => {
    if (!gsap.core.globals().ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger)
    }
  }, [])

  const steps = [
    {
      badge: "Step 1",
      title: "Install",
      cmd: "npm install -g @gunjanghate/git-genie",
      desc: "Install Globally or Root of the project.",
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
  ]

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="relative mx-auto lg:mx-32 max-w-6xl px-6 py-20 sm:py-24"
    >
      <AmbientBackground />
      <div className="mb-16">
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

      {/* Scroll Stack Container */}
      <div className="relative space-y-4">
        {steps.map((s, i) => (
          <StackCard
            key={s.badge}
            step={s}
            index={i}
            total={steps.length}
          />
        ))}
      </div>
    </section>
  )
}

interface StackCardProps {
  step: {
    badge: string
    title: string
    cmd: string
    desc: string
  }
  index: number
  total: number
}

function StackCard({ step, index, total }: StackCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!cardRef.current) return

    const el = cardRef.current

    // Single scrubbed timeline instead of manual onUpdate tweens
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "top center",
        scrub: true,
      },
    })

    tl.fromTo(
      el,
      { y: 80, scale: 0.9, opacity: 0.4 },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        ease: "none",
      }
    )

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])

  const stickyTop = 80 + index * 16

  return (
    <div
      ref={cardRef}
      style={{
        position: "sticky",
        top: `${stickyTop}px`,
        zIndex: total - index,
      }}
      className="will-change-transform"
    >
      <div className="relative flex items-start gap-4 sm:gap-6 group bg-zinc-900/90 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-amber-400/40 transition-all duration-300 shadow-xl hover:shadow-amber-400/10">
        {/* Circle Marker */}
        <div className="relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-zinc-900 text-base sm:text-lg font-bold text-amber-400 shadow-lg shadow-amber-400/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-amber-400/40">
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-zinc-100">
              {step.title}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              {step.desc}
            </p>
          </div>

          {/* Command Box */}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-2 sm:px-3 py-2 font-mono text-[10px] sm:text-xs text-zinc-200 transition-all duration-200 group-hover:border-amber-400/40">
            <code
              className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap min-w-0"
              title={step.cmd}
            >
              {step.cmd}
            </code>
            <div className="shrink-0">
              <CopyButton text={step.cmd} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
