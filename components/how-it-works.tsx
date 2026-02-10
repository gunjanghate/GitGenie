"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { CopyButton } from "./parts/copy-button"
import AmbientBackground from "./parts/ambient-two"
import { AnimateIn } from "./parts/animate-in"

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    badge: "Step 1",
    title: "Install",
    cmd: "npm install -g @gunjanghate/git-genie",
    desc: "Install globally or in your project root.",
  },
  {
    badge: "Step 2",
    title: "Configure AI (once)",
    cmd: "gg config YOUR_GEMINI_API_KEY",
    desc: "Stores the key in ~/.gitgenie/config.json so --genie can generate commits.",
  },
  {
    badge: "Step 3",
    title: "Commit with AI",
    cmd: 'gg "add user profile section" --type feat --scope ui --genie',
    desc: "Stages changes if needed, builds a Conventional Commit via Gemini, then commits.",
  },
  {
    badge: "Step 4",
    title: "Push / Merge",
    cmd: 'gg "finish oauth flow" --push-to-main',
    desc: "Accept prompts or auto-merge to main and push in one go.",
  },
]

export default function HowItWorks() {
  const pinRef = useRef<HTMLDivElement | null>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    if (!pinRef.current) return

    const ctx = gsap.context(() => {
      const cards = cardsRef.current
      if (!cards.length) return

      const stackDistance = 18   // tighter stack
      const baseScale = 0.9
      const scaleStep = 0.03
      const topZ = cards.length * 5

      // initial state
      cards.forEach((card, index) => {
        if (index === 0) {
          gsap.set(card, {
            y: 0,
            scale: 1,
            zIndex: topZ,
          })
        } else {
          gsap.set(card, {
            y: "100vh",
            scale: baseScale,
            zIndex: topZ - (index + 1),
          })
        }
      })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: "top top",
          end: "+=110%",        // slightly shorter for less lag
          scrub: true,
          pin: true,
        },
      })

      const segment = 1 / (cards.length - 1)

      cards.forEach((card, index) => {
        if (index === 0) return
        const prev = cards[index - 1]

        const start = segment * (index - 1)
        const end = segment * index

        // ensure new card is on top before moving
        tl.set(
          card,
          { zIndex: topZ + index },
          start - 0.001
        )

        // nudge previous card down a bit first
        tl.to(
          prev,
          {
            y: 6 - stackDistance * (index - 1),
            ease: "none",
          },
          start
        )

        // bring new card from bottom to front
        tl.fromTo(
          card,
          {
            y: "100vh",
            scale: baseScale,
          },
          {
            y: 0,
            scale: 1,
            ease: "none",
          },
          start
        )

        // then move previous card into its stacked position
        tl.to(
          prev,
          {
            y: -stackDistance * index,
            scale: baseScale + scaleStep * (index - 1),
            ease: "none",
          },
          start + segment * 0.3
        )

        tl.set(
          card,
          { zIndex: topZ + index },
          end - 0.001
        )
      })
    }, pinRef)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="relative mx-auto lg:mx-32 max-w-6xl px-6 py-20 sm:py-24"
    >
      <AmbientBackground />

      {/* Header */}
      <div className="mb-10">
        <AnimateIn>
          <div>
            <h2 id="how-title" className="text-2xl font-semibold sm:text-3xl">
              How it works
            </h2>
            <div className="h-1 mt-1 animate-collapsible-down w-20 bg-gradient-to-br from-amber-400 to-amber-700" />
          </div>
        </AnimateIn>
        <AnimateIn delay={60}>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Four steps with sensible defaults. Use flags to tailor your flow.
          </p>
        </AnimateIn>
      </div>

      {/* Pinned stack */}
      <div ref={pinRef} className="relative h-[80vh] overflow-visible">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full max-w-3xl h-[440px] sm:h-[460px]">
            {STEPS.map((step, index) => (
              <div
                key={step.badge}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el
                }}
                className="absolute inset-0 will-change-transform pointer-events-auto"
              >
                <div className="flex h-full flex-col rounded-2xl border border-white/8 bg-zinc-900/95 px-6 py-5 sm:px-7 sm:py-7 shadow-lg shadow-black/40 backdrop-blur-md">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-amber-400/70 bg-zinc-900 text-base sm:text-lg font-semibold text-amber-300">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      <div>
                        <div className="text-[10px] sm:text-xs font-semibold text-amber-400/70 uppercase tracking-[0.18em] mb-1">
                          {step.badge}
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-zinc-50 mb-1">
                          {step.title}
                        </h3>
                        <p className="text-sm sm:text-[15px] text-zinc-400">
                          {step.desc}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/12 bg-black/80 px-3 sm:px-4 py-2.5 font-mono text-xs sm:text-sm text-zinc-200">
                        <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {step.cmd}
                        </code>
                        <CopyButton text={step.cmd} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-px w-full bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
