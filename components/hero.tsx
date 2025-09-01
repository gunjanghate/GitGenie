"use client"

import Link from "next/link"
import { Star, Package, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { BackgroundParticles } from "./parts/background-particles"
import { AnimateIn } from "./parts/animate-in"

export default function Hero() {
  return (
    <header aria-label="Hero" className="relative overflow-hidden border-b border-white/5">
      <BackgroundParticles />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-center px-6 py-24 sm:py-28 md:py-32 min-h-[85svh]">
        <AnimateIn delay={40}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
            <Sparkles className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span className="tracking-wide">Open source on GitHub</span>
          </div>
        </AnimateIn>

        <AnimateIn>
          <h1 className={cn("text-balance text-center text-4xl font-semibold sm:text-5xl md:text-6xl leading-tight")}>
            Meet Git Genie{" "}
            <Sparkles className="inline-block align-middle h-[1em] w-[1em] text-amber-400" aria-hidden="true" />
          </h1>
        </AnimateIn>

        <AnimateIn delay={100}>
          <p className="text-pretty mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed text-zinc-300 sm:text-xl">
            Your AI-powered Git assistant — automate staging, commit messages, branch flow & pushes in one command.
          </p>
        </AnimateIn>

        <AnimateIn delay={150}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="https://github.com/your-org/git-genie"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.03] hover:shadow-[0_0_0_3px_rgba(245,158,11,0.30)]"
              aria-label="Star on GitHub"
            >
              <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <span>Star on GitHub</span>
            </Link>
            <Link
              href="https://www.npmjs.com/package/@gunjanghate/git-genie"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.03] hover:border-amber-400/40 hover:shadow-[0_0_0_3px_rgba(245,158,11,0.18)]"
              aria-label="Install via npm"
            >
              <Package className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span>Install via npm</span>
            </Link>
          </div>
        </AnimateIn>
      </div>
    </header>
  )
}
