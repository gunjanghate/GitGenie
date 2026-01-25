"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import DocsModal from "@/components/docs-modal"
import AmbientBackground from "./parts/ambient-background"
import Image from "next/image"

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
  namespace YT {
    class Player {
      constructor(element: HTMLElement, options?: PlayerOptions)
      destroy(): void
    }
    interface PlayerOptions {
      events?: {
        onStateChange?: (event: OnStateChangeEvent) => void
      }
    }
    interface OnStateChangeEvent {
      data: number
    }
    const PlayerState: {
      ENDED: number
    }
  }
}

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
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
  } catch {
    return undefined
  }
}

export default function DemoVideoSection() {
  // 1. YouTube URL (recommended): "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
  // 2. Direct Google Drive download: "https://drive.google.com/uc?export=download&id=1WXQIao0jxiNrTvmY_0-Xq9kgO-K3KHfg"
  // 3. Local video file: "/demo.mp4"

  const demoSrc = "https://gunjanghate.github.io/demovideo/GitGenie-demo.mp4"
  const youTubeEmbedUrl = getYouTubeEmbed(demoSrc)
  const isYouTube = !!youTubeEmbedUrl

  const [isPlaying, setIsPlaying] = useState(false)
  const [showThumbnail, setShowThumbnail] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handlePlayClick = () => {
    setShowThumbnail(false)
    setIsPlaying(true)

    // For native video, start playback
    if (!isYouTube && videoRef.current) {
      videoRef.current.play()
    }
    // For YouTube, the autoplay in URL will handle it
  }

  const handleVideoEnded = useCallback(() => {
    setShowThumbnail(true)
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    if (!isYouTube || !isPlaying) return

    let player: YT.Player | null = null
    let isMounted = true

    const onPlayerStateChange = (event: YT.OnStateChangeEvent) => {
      if (event.data === YT.PlayerState.ENDED && isMounted) {
        handleVideoEnded()
      }
    }

    const initPlayer = () => {
      if (!iframeRef.current || !isMounted) return
      player = new YT.Player(iframeRef.current, {
        events: {
          onStateChange: onPlayerStateChange,
        },
      })
    }

    const setupPlayer = () => {
      if (window.YT && window.YT.Player) {
        initPlayer()
      } else {
        const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
        if (!existingScript) {
          const tag = document.createElement("script")
          tag.src = "https://www.youtube.com/iframe_api"
          const firstScriptTag = document.getElementsByTagName("script")[0]
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
        }
        const previousCallback = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
          previousCallback?.()
          initPlayer()
        }
      }
    }

    const timeoutId = setTimeout(setupPlayer, 500)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      player?.destroy()
    }
  }, [isYouTube, isPlaying, handleVideoEnded])

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

      {/* Inline video player with thumbnail overlay */}
      <div className="relative mx-auto block aspect-[16/10] w-3/4 rounded-2xl border border-white/10 bg-black shadow-xl overflow-hidden">
        {/* Video player (YouTube or native) */}
        {isYouTube ? (
          <iframe
            key={isPlaying ? "playing" : "paused"}
            ref={iframeRef}
            title="Git Genie demo video"
            src={isPlaying ? youTubeEmbedUrl + "&autoplay=1" : youTubeEmbedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            className="h-full w-full"
            controls={isPlaying}
            playsInline
            preload="metadata"
            poster="/git-genie-demo-poster.png"
            onEnded={handleVideoEnded}
          >
            <source src={demoSrc} type="video/mp4" />
          </video>
        )}

        {/* Thumbnail overlay with play button */}
        {showThumbnail && (
          <button
            onClick={handlePlayClick}
            className="group absolute inset-0 z-10 cursor-pointer"
          >
            <Image
              src="/git-genie-demo-poster.png"
              alt="Git Genie demo thumbnail"
              fill
              priority
              className="object-contain bg-black transition-transform duration-300 group-hover:scale-[1.01]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

            <span className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black shadow transition-transform duration-200 group-hover:scale-110">
              ▶ Play demo
            </span>
          </button>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <DocsModal />
      </div>
    </section>
  )
}
