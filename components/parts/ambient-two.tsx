"use client"

import { cn } from "@/lib/utils"

type Variant = "default" | "cta" | "footer" | "demo"

export default function AmbientBackground({
  className,
  variant = "default",
}: {
  className?: string
  variant?: Variant
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      {variant === "default" && (
      <>
        {/* <span
        className="absolute -bottom-1/3 left-1/4 h-[45vh] w-[45vh] rounded-full bg-amber-500/10 blur-3xl will-change-transform"
        style={{ animation: "amb_blob1 26s ease-in-out infinite" }}
        aria-hidden="true"
        /> */}
        <span
        className="absolute -top-1/3 right-1/4 h-[40vh] w-[40vh] sm:h-[30vh] sm:w-[30vh] rounded-full bg-white/5 blur-3xl will-change-transform"
        style={{ animation: "amb_blob2 30s ease-in-out infinite" }}
        aria-hidden="true"
        />
        <span
        className="absolute top-1/2 left-1/4 h-[40vh] w-[40vh] sm:h-[30vh] sm:w-[30vh] rounded-full bg-white/5 blur-3xl will-change-transform"
        style={{ animation: "amb_blob2 30s ease-in-out infinite" }}
        aria-hidden="true"
        />
        {/* <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_-120px,rgba(245,158,11,0.06),transparent)]" /> */}
      </>
      )}

      {variant === "cta" && (
      <>
        {/* soft focus behind CTA area */}
        <div className="absolute inset-0 bg-[radial-gradient(400px_200px_at_50%_70%,rgba(245,158,11,0.10),transparent)] sm:bg-[radial-gradient(600px_260px_at_50%_70%,rgba(245,158,11,0.10),transparent)]" />
        <span
        className="absolute -bottom-1/4 left-1/2 h-[30vh] w-[30vh] sm:h-[40vh] sm:w-[40vh] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl will-change-transform"
        style={{ animation: "amb_blob2 28s ease-in-out infinite" }}
        aria-hidden="true"
        />
      </>
      )}

      {variant === "footer" && (
      <>
        {/* glow rising from footer top */}
        <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-60px,rgba(245,158,11,0.08),transparent)] sm:bg-[radial-gradient(900px_300px_at_50%_-60px,rgba(245,158,11,0.08),transparent)]" />
        <span
        className="absolute -top-1/3 left-1/2 h-[35vh] w-[35vh] sm:h-[50vh] sm:w-[50vh] -translate-x-1/2 rounded-full bg-amber-500/8 blur-3xl will-change-transform"
        style={{ animation: "amb_blob1 24s ease-in-out infinite" }}
        aria-hidden="true"
        />
      </>
      )}

      {variant === "demo" && (
      <>
        {/* Top-center aurora glow */}
        <div className="absolute inset-0 bg-[radial-gradient(500px_250px_at_50%_0%,rgba(245,158,11,0.10),transparent)] sm:bg-[radial-gradient(800px_360px_at_50%_0%,rgba(245,158,11,0.10),transparent)]" />
        {/* Left-bottom soft blob */}
        <span
        className="absolute -bottom-1/4 left-1/6 h-[30vh] w-[30vh] sm:h-[42vh] sm:w-[42vh] rounded-full bg-amber-500/10 blur-3xl will-change-transform"
        style={{ animation: "amb_blob1 26s ease-in-out infinite" }}
        aria-hidden="true"
        />
        {/* Right-mid soft blob */}
        <span
        className="absolute top-1/4 -right-1/6 h-[25vh] w-[25vh] sm:h-[36vh] sm:w-[36vh] rounded-full bg-white/6 blur-3xl will-change-transform"
        style={{ animation: "amb_blob2 30s ease-in-out infinite" }}
        aria-hidden="true"
        />
      </>
      )}

      <style jsx>{`
      @keyframes amb_blob1 {
        0%,
        100% {
        transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
        transform: translate3d(24px, 30px, 0) scale(1.05);
        }
      }
      @keyframes amb_blob2 {
        0%,
        100% {
        transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
        transform: translate3d(-28px, -18px, 0) scale(1.07);
        }
      }
      @media (max-width: 640px) {
        @keyframes amb_blob1 {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(12px, 15px, 0) scale(1.03);
        }
        }
        @keyframes amb_blob2 {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(-14px, -9px, 0) scale(1.04);
        }
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
