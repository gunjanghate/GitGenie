"use client"

export default function HeroNav() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const navItems = [
    { id: "features", label: "Features" },
    { id: "how-it-works", label: "How it Works" },
    { id: "demo", label: "Demo" },
    { id: "usage", label: "Usage" },
    { id: "faq", label: "FAQ" },
    { id: "community", label: "Community" },
  ]

  return (
    <nav className="hidden md:flex items-center gap-1 md:gap-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-full px-2 md:px-3 py-2 md:py-2.5 shadow-lg">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollToSection(item.id)}
          className="px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium text-zinc-400 hover:text-orange-500 hover:bg-zinc-800/80 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
