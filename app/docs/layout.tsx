"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Menu } from "lucide-react"

import AmbientBackground from "@/components/parts/ambient-background"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

/* ===== DOC GROUPS (ROUTE-BASED) ===== */
const DOC_GROUPS = [
  { label: "Getting Started", href: "/docs/getting-started" },
  { label: "Core Commands", href: "/docs/commands" },
  { label: "Workflows & Internals", href: "/docs/workflows" },
  { label: "AI Features", href: "/docs/ai" },
  { label: "Open Source & Collaboration", href: "/docs/open-source" },
  { label: "Reference & Examples", href: "/docs/reference" },
  { label: "Security & Community", href: "/docs/security" },
]

/* ===== SidebarNav ===== */
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1 border-r border-amber-600/50 rounded-tr-2xl rounded-br-2xl py-10">
      <h2 className="mb-3 px-3 text-sm font-semibold text-white">
        Documentation
      </h2>

      {DOC_GROUPS.map((item) => {
        const active = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "block rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer",
              active
                ? "bg-amber-400/10 text-amber-400 font-medium"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

/* ===== Sidebar ===== */
function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full border-white/10 bg-black/60 backdrop-blur-sm hover:bg-black/80 cursor-pointer"
            aria-label="Open docs navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-64 bg-zinc-900/95 backdrop-blur-sm border-white/10">
          <SheetHeader className="sr-only">
            <SheetTitle>Docs Navigation</SheetTitle>
            <SheetDescription>
              Switch between documentation sections
            </SheetDescription>
          </SheetHeader>

          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6 h-[calc(100vh-3rem)]">
          <SidebarNav />
        </div>
      </aside>
    </>
  )
}

/* ===== Docs Layout ===== */
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
              onClick={() => router.push("/")}
              className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded cursor-pointer"
              aria-label="Navigate to home page"
            >
              Git Genie
            </button>
            <span className="ml-2 text-zinc-400 font-normal">
              / Documentation
            </span>
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <Sidebar />
          {/* Main content wrapper with responsive width constraints */}
          <div className="flex-1 min-w-0 w-full max-w-full lg:max-w-3xl pb-16">
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}