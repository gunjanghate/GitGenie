"use client"
import { AnimateIn } from "./parts/animate-in"
import AmbientBackground from "./parts/ambient-background"
import { BackgroundParticles } from "./parts/background-particles"
import Link from "next/link"
export default function Community() {
  return (
    <section
      id="community"
      aria-labelledby="community-title"
      className="relative isolate mx-auto max-w-6xl px-6 py-28 md:py-32 overflow-hidden"
    >
      <AmbientBackground variant="cta" />
      <AnimateIn>
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-35 md:opacity-50">
          <BackgroundParticles />
        </div>
      </AnimateIn>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 -z-10 bg-[radial-gradient(600px_220px_at_50%_0,rgba(245,158,11,0.12),transparent)] blur-2xl"
      />

      <div className="text-center">
        <AnimateIn>
          <div className="flex flex-col min-w-full justify-center items-center">

            <h2 id="community-title" className="text-2xl font-semibold sm:text-3xl">
              Join the community.
            </h2>
            <div className="line h-1 mt-1 animate-collapsible-down w-24 bg-gradient-to-br from-amber-400 to-amber-800"></div>

          </div>
        </AnimateIn>
        <AnimateIn delay={60}>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-300">
            Contribute to Git Genie's development, share feedback, and connect with fellow developers.
          </p>
        </AnimateIn>

        <AnimateIn delay={120}>
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10">
              <h3 className="text-lg font-medium text-white">Contribute</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Help improve Git Genie by contributing code, documentation, or translations.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10">
              <h3 className="text-lg font-medium text-white">Feedback</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Share your ideas, feature requests, and help shape the future of Git Genie.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10">
              <h3 className="text-lg font-medium text-white">Support</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Get help from the community and help others with their Git workflows.
              </p>
            </div>
          </div>
        </AnimateIn>

        <AnimateIn delay={180}>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="https://github.com/gunjanghate/GitGenie"
              className="inline-block rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-[1.03] hover:shadow-[0_0_0_3px_rgba(245,158,11,0.25)] focus-visible:scale-[1.01]"
            >
              View on GitHub
            </Link>
            <Link
              href="https://github.com/gunjanghate/GitGenie/issues"
              className="inline-block rounded-full border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.03] hover:shadow-[0_0_0_3px_rgba(245,158,11,0.25)] focus-visible:scale-[1.01]"
            >
              Report Issues
            </Link>
          </div>
        </AnimateIn>
      </div>
    </section>
  )
}
