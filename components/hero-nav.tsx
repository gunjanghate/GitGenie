"use client";

export default function HeroNav() {
  const navItems = [
    { id: "features", label: "Features" },
    { id: "how-it-works", label: "How it Works" },
    { id: "demo", label: "Demo" },
    { id: "usage", label: "Usage" },
    { id: "branch-management", label: "Branches" },
    { id: "faq", label: "FAQ" },
    { id: "community", label: "Community" },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
  <nav className="hidden md:flex items-center gap-6 bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-full px-6 py-3 shadow-lg fixed top-4 left-1/2 -translate-x-1/2 z-[110] whitespace-nowrap">
  {navItems.map((item) => (
    <button
      key={item.id}
      onClick={() => scrollToSection(item.id)}
      className="text-zinc-300 text-sm font-medium transition-colors duration-200 rounded-full px-3 py-1 
                 hover:text-amber-400 hover:bg-zinc-700/50 
                 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 
                 active:bg-zinc-700/50"
    >
      {item.label}
    </button>
  ))}
</nav>
  );
}