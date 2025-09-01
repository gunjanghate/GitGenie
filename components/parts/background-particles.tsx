"use client"

import { useEffect, useRef } from "react"

export function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; r: number }[]>([])
  const prefersReduced = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!

    function resize() {
      const dpr = devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function init() {
      const area = canvas.offsetWidth * canvas.offsetHeight
      const desired = Math.round(area / 12000) // density
      const count = Math.max(24, Math.min(70, desired)) // clamp
      particles.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.22, // slower for smooth movement
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.6,
      }))
    }

    let lastTime = 0
    function draw(now = 0) {
      if (!prefersReduced.current && now - lastTime < 1000 / 45) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }
      lastTime = now

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.globalAlpha = 0.7
      ctx.shadowColor = "rgba(245,158,11,0.16)" // amber glow
      ctx.shadowBlur = 8

      for (const p of particles.current) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.fillStyle = "rgba(245,158,11,0.06)"
        ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!prefersReduced.current) {
        rafRef.current = requestAnimationFrame(draw)
      }
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMotionChange = (e: MediaQueryListEvent | MediaQueryList) => {
      prefersReduced.current = "matches" in e ? e.matches : (e as MediaQueryList).matches
      if (prefersReduced.current) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        draw() // one frame; no loop
      } else {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(draw)
      }
    }
    onMotionChange(mq)

    resize()
    init()
    if (prefersReduced.current) {
      draw()
    } else {
      rafRef.current = requestAnimationFrame(draw)
    }

    const onResize = () => {
      resize()
      init()
    }
    window.addEventListener("resize", onResize)
    mq.addEventListener?.("change", onMotionChange as (ev: Event) => void)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", onResize)
      mq.removeEventListener?.("change", onMotionChange as (ev: Event) => void)
    }
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
      <div className="absolute inset-0 overflow-hidden">
        <span
          className="absolute -top-1/3 left-1/4 h-[60vh] w-[60vh] rounded-full bg-amber-500/10 blur-3xl will-change-transform"
          style={{ animation: "blob1 22s ease-in-out infinite" }}
          aria-hidden="true"
        />
        <span
          className="absolute -bottom-1/3 right-1/4 h-[50vh] w-[50vh] rounded-full bg-white/5 blur-3xl will-change-transform"
          style={{ animation: "blob2 28s ease-in-out infinite" }}
          aria-hidden="true"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(245,158,11,0.08),transparent)]" />
      <style jsx>{`
        @keyframes blob1 {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(30px, 40px, 0) scale(1.06);
          }
        }
        @keyframes blob2 {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-40px, -20px, 0) scale(1.08);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          span {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
