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

      const stackDistance = 18
      const baseScale = 0.9
      const scaleStep = 0.03
      const topZ = cards.length * 5

      // initial positions
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
          end: "+=110%",
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

        tl.set(
          card,
          { zIndex: topZ + index },
          start - 0.001
        )

        tl.to(
          prev,
          {
            y: 6 - stackDistance * (index - 1),
            ease: "none",
          },
          start
        )

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
          {/* narrower card so text wraps and height grows slightly */}
          <div className="relative w-full max-w-2xl sm:max-w-xl h-[200px] sm:h-[220px]">
            {STEPS.map((step, index) => (
              <div
                key={step.badge}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el
                }}
                className="absolute inset-0 will-change-transform pointer-events-auto flex justify-center"
              >
                <div className="flex h-full w-full max-w-xl flex-col rounded-2xl border border-white/8 bg-zinc-900/95 px-6 py-5 sm:px-7 sm:py-6 shadow-lg shadow-black/40 backdrop-blur-md">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-amber-400/70 bg-zinc-900 text-xs sm:text-sm font-semibold text-amber-300">
                      {index + 1}
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div>
                        <div className="text-[10px] sm:text-xs font-semibold text-amber-400/70 uppercase tracking-[0.18em] mb-0.5">
                          {step.badge}
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-zinc-50">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-[13px] sm:text-[15px] text-zinc-400 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-white/12 bg-black/80 px-3 sm:px-4 py-2.5 font-mono text-[11px] sm:text-sm text-zinc-200">
                        <code className="flex-1 whitespace-normal break-words">
                          {step.cmd}
                        </code>
                        <CopyButton text={step.cmd} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 h-px w-full bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
