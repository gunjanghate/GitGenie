"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import DocsModal from "@/components/docs-modal"
import AmbientBackground from "./parts/ambient-background" // Import AmbientBackground
import Image from "next/image"
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

  // 1. YouTube URL (recommended): "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
  // 2. Direct Google Drive download: "https://drive.google.com/uc?export=download&id=1WXQIao0jxiNrTvmY_0-Xq9kgO-K3KHfg"
  // 3. Local video file: "/demo.mp4"

  const demoSrc = "https://gunjanghate.github.io/demovideo/GitGenie-demo.mp4" // Changed from "../public/demo.mp4" to "/demo.mp4" (correct public path)
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
      className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 z-0 py-12"
    >

      {/* Background: unified AmbientBackground for cohesion */}
      <AmbientBackground variant="demo" />

      <header className="py-12 text-center">
        <div className="w-full flex flex-col justify-center items-center">

          <h2 id="demo-heading" className="text-pretty text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Watch a quick demo
          </h2>
          <div className="line h-1 mt-2 animate-collapsible-down w-24 bg-gradient-to-br from-amber-400 to-amber-800"></div>

        </div>
        <p className="mx-auto mt-2 max-w-2xl text-balance text-base text-zinc-400 sm:text-lg">
          See how to stage, generate a Conventional Commit with AI, and push in one command.
        </p>
      </header>

      {/* Thumbnail only on the page; video plays in modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative mx-auto block aspect-video w-3/4 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-400/60"
            aria-label="Play demo video"
          >
            {/* Poster/thumbnail */}
            <Image
              src="/git-genie-demo-poster.png"
              alt="Git Genie demo thumbnail"
              height={315}
              width={560}
              priority
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


    </section>
  )
}
