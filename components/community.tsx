"use client"
import { AnimateIn } from "./parts/animate-in"
import AmbientBackground from "./parts/ambient-background"
import { BackgroundParticles } from "./parts/background-particles"

export default function Community() {
  return (
    <section
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
          <h2 id="community-title" className="text-2xl font-semibold sm:text-3xl">
            Join the community.
          </h2>
        </AnimateIn>
        <AnimateIn delay={60}>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-300">Contribute on GitHub or file issues.</p>
        </AnimateIn>
        <AnimateIn delay={120}>
          <a
            href="https://github.com/your-org/git-genie/issues"
            className="mt-8 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-[1.03] hover:shadow-[0_0_0_3px_rgba(245,158,11,0.25)] focus-visible:scale-[1.01]"
          >
            Report Issues
          </a>
        </AnimateIn>
      </div>
    </section>
  )
}
