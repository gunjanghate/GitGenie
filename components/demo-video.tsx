"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import DocsModal from "@/components/docs-modal"
import AmbientBackground from "./parts/ambient-background" // Import AmbientBackground

function getYouTubeEmbed(url: string) {
  // Supports youtube.com or youtu.be → returns /embed/... with sane params
  try {
    const u = new URL(url)
    let id = ""
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.slice(1)
    } else if (u.searchParams.get("v")) {
      id = u.searchParams.get("v") || ""
    }
    if (!id) return undefined
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&autoplay=1`
  } catch {
    return undefined
  }
}

export default function DemoVideoSection() {
  // Read at build/runtime for public env; fallback to demo mp4
  const demoSrc =
    process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  const youTubeOpenUrl = useMemo(() => getYouTubeEmbed(demoSrc), [demoSrc])
  const isYouTube = !!youTubeOpenUrl

  const [open, setOpen] = useState(false)
  // Force unmount/mount to stop playback when dialog closes
  const [playerKey, setPlayerKey] = useState(0)

  const onOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) {
      // bump key to remount player next time (stops playback)
      setPlayerKey((k) => k + 1)
    }
  }

  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
    >
      {/* Background: unified AmbientBackground for cohesion */}
      <AmbientBackground variant="demo" />

      <header className="mb-6 text-center">
        <h2 id="demo-heading" className="text-pretty text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Watch a quick demo
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-balance text-base text-zinc-400 sm:text-lg">
          See how to stage, generate a Conventional Commit with AI, and push in one command.
        </p>
      </header>

      {/* Thumbnail only on the page; video plays in modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative mx-auto block aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-400/60"
            aria-label="Play demo video"
          >
            {/* Poster/thumbnail */}
            <img
              src="/git-genie-demo-poster.png"
              alt="Git Genie demo thumbnail"
              className="h-full w-full transform object-cover transition duration-300 ease-out group-hover:scale-[1.02] will-change-transform"
            />
            {/* Dark gradient for readability */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            {/* Play button */}
            <span className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black shadow-md transition group-hover:scale-105">
              ▶ Play demo
            </span>
          </button>
        </DialogTrigger>

        {/* Overlay + Content (video only renders when open) */}
        <DialogOverlay className="fixed inset-0 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogContent className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 border border-white/10 bg-black/70 p-0 shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:blur-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <DialogTitle className="sr-only">Git Genie demo video</DialogTitle>
          <div className="aspect-video w-full overflow-hidden rounded-2xl">
            {open &&
              (isYouTube ? (
                <iframe
                  key={playerKey}
                  title="Git Genie demo video"
                  src={youTubeOpenUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <video key={playerKey} className="h-full w-full" autoPlay controls playsInline preload="metadata">
                  <source src={demoSrc} type="video/mp4" />
                </video>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-4 flex justify-center">
        <DocsModal />
      </div>

      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-500">
        Tip: set NEXT_PUBLIC_DEMO_VIDEO_URL to your MP4 or YouTube URL to replace this demo without code changes.
      </p>
    </section>
  )
}
