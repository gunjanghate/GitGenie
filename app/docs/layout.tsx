"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"

import AmbientBackground from "@/components/parts/ambient-background"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

/* ===== TOC ITEMS (copied as-is) ===== */
const TOC_ITEMS = [
  { id: "contents", label: "Contents" },
  { id: "quick-start", label: "Quick Start" },
  { id: "install-verify", label: "Install & Verify" },
  { id: "configure-gemini-api-key", label: "Configure API Key" },
  { id: "command-syntax", label: "Command Syntax" },
  { id: "command-palette-interactive", label: "Command Palette" },
  { id: "how-it-works-mapped-to-source", label: "How it Works" },
  { id: "common-workflows", label: "Common Workflows" },
  { id: "branch-merge-behavior", label: "Branch & Merge Behavior" },
  { id: "ai-commit-generation", label: "AI Commit Generation" },
  { id: "ai-branch-pr-generation", label: "AI Branch & PR Generation" },
  { id: "open-source-contributions-osc", label: "Open Source (--osc)" },
  { id: "examples", label: "Examples" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "security-privacy", label: "Security & Privacy" },
  { id: "contributing-roadmap", label: "Contributing / Roadmap" },
  { id: "faq", label: "FAQ" },
  { id: "support", label: "Support" },
]

/* ===== SidebarNav ===== */
function SidebarNav({
  activeSection,
  onItemClick,
}: {
  activeSection: string
  onItemClick?: (id: string) => void
}) {
  return (
    <nav className="space-y-1 border-r-amber-600/50 border-r rounded-tr-2xl rounded-br-2xl py-10">
      <h2 className="mb-3 text-sm font-semibold text-white">On This Page</h2>
      {TOC_ITEMS.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(e) => {
            e.preventDefault()
            const el = document.getElementById(item.id)
            if (el) {
              el.scrollIntoView({ behavior: "smooth" })
              window.history.replaceState(null, "", `#${item.id}`)
            }
            onItemClick?.(item.id)
          }}
          className={cn(
            "block py-1.5 px-3 text-sm transition-colors rounded-md cursor-pointer",
            activeSection === item.id
              ? "text-amber-400 bg-amber-400/10 font-medium"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          )}
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}

/* ===== Sidebar ===== */
function Sidebar() {
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")

  return (
    <>
      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full border-white/10 bg-black/60 backdrop-blur-sm"
            aria-label="Open table of contents"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-64 bg-zinc-900/95 backdrop-blur-sm border-white/10">
          <SheetHeader className="sr-only">
            <SheetTitle>Documentation Navigation</SheetTitle>
            <SheetDescription>Select a section to jump to its content.</SheetDescription>
          </SheetHeader>

          <SidebarNav
            activeSection={activeSection}
            onItemClick={(id) => {
              setActiveSection(id)
              setOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6 h-[calc(100vh-3rem)]">
          <SidebarNav activeSection={activeSection} onItemClick={setActiveSection} />
        </div>
      </aside>
    </>
  )
}

/* ===== Docs Layout ===== */
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

      {/* Content + Sidebar */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <Sidebar />
          {children}
        </div>
      </div>
    </main>
  )
}
