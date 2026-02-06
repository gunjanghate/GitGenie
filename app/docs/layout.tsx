"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import AmbientBackground from "@/components/parts/ambient-background"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <main className="relative min-h-screen text-white bg-linear-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Ambient background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <AmbientBackground />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center">
            <button
              type="button"
              className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 transition-all"
              onClick={() => router.push("/")}
            >
              Git Genie
            </button>
            <span className="text-zinc-400 font-normal ml-2">/ Documentation</span>
          </h1>
        </div>
      </header>

      {/* Page content */}
      {children}
    </main>
  )
}
