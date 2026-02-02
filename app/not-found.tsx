"use client"

import Link from "next/link"
import { ArrowLeft, AlertCircle } from "lucide-react"
import AmbientBackground from "@/components/parts/ambient-background"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 text-white selection:bg-amber-400/20">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <AmbientBackground />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        {/* Icon */}
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-400/10 border border-amber-400/20 shadow-[0_0_40px_-10px_rgba(251,191,36,0.2)]">
          <AlertCircle className="h-12 w-12 text-amber-400" />
        </div>

        {/* Text */}
        <h1 className="mb-2 text-5xl font-bold tracking-tight sm:text-7xl">
          404
        </h1>
        <h2 className="mb-6 text-2xl font-semibold text-zinc-200 sm:text-3xl">
          Page not found
        </h2>
        <p className="mb-8 max-w-md text-zinc-400">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>

        {/* Action */}
        <Button asChild className="gap-2 bg-amber-400 text-zinc-950 hover:bg-amber-300">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Decorative Grid/Footer Texture */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent z-0 pointer-events-none" />
    </main>
  )
}