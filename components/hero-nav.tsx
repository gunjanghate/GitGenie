"use client";

import { useState } from "react";
import Image from "next/image";
import chirag from "../public/chirag.png";
import { Menu, X, Star, Package, BookOpen } from "lucide-react";

export default function HeroNav() {
  const [isOpen, setIsOpen] = useState(false);

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
    const element = document.getElementById(id);

    if (element) {
      const navbarHeight = 80;

      const elementPosition =
        element.getBoundingClientRect().top + window.scrollY;

      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 z-[110] w-full border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md shadow-lg shadow-black/10">
      <div className="flex w-full items-center justify-between px-6 py-4">

        {/* LEFT SECTION */}
        <div className="flex items-center gap-2 shrink-0 transition-transform duration-200 hover:scale-[1.02] z-10">
          <Image
            src={chirag}
            alt="GitGenie Logo"
            width={34}
            height={34}
            className="rounded-full"
          />
          <span className="text-lg font-bold tracking-wide text-white">
            GitGenie
          </span>
        </div>

        {/* CENTER SECTION */}
        <div className="hidden xl:flex items-center justify-center gap-2 z-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="cursor-pointer text-zinc-300 text-sm font-medium transition-all duration-200 rounded-full px-3 py-2 hover:text-amber-400 hover:bg-zinc-700/50 whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* RIGHT SECTION */}
        <div className="hidden lg:flex items-center gap-3 shrink-0 z-10">
          {/* STAR BUTTON */}
          <a
            href="https://github.com/gunjanghate/GitGenie"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-amber-400/40 hover:bg-zinc-800 whitespace-nowrap"
          >
            <Star className="w-4 h-4 mr-2" /> Star on GitHub
          </a>

          {/* NPM BUTTON */}
          <a
            href="https://www.npmjs.com/package/@gunjanghate/git-genie"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-amber-400/40 hover:bg-zinc-800 whitespace-nowrap"
          >
            <Package className="w-4 h-4 mr-2" /> Install via npm
          </a>

          {/* DOCS BUTTON */}
          <a
            href="/docs"
            className="cursor-pointer flex items-center rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-all duration-200 hover:scale-[1.03] hover:opacity-90 whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 mr-2" /> View Docs
          </a>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer lg:hidden rounded-full border border-white/10 bg-white/5 p-2 text-white transition-all duration-200 hover:bg-zinc-800 z-50"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

      </div>

      {/* MOBILE MENU PANEL */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-lg px-6 py-6 shadow-2xl transition-all duration-200">
          <div className="flex flex-col gap-6">
            
            {/* Nav Links */}
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    scrollToSection(item.id);
                    setIsOpen(false);
                  }}
                  className="cursor-pointer w-full text-left text-zinc-300 text-base font-medium py-2 px-3 rounded-xl transition-all duration-200 hover:text-amber-400 hover:bg-zinc-900"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-[1px] w-full bg-zinc-800/80" />

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              {/* STAR BUTTON */}
              <a
                href="https://github.com/gunjanghate/GitGenie"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white transition-all duration-200 hover:border-amber-400/40 hover:bg-zinc-800"
              >
                <Star className="w-4 h-4 mr-2" /> Star on GitHub
              </a>

              {/* NPM BUTTON */}
              <a
                href="https://www.npmjs.com/package/@gunjanghate/git-genie"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white transition-all duration-200 hover:border-amber-400/40 hover:bg-zinc-800"
              >
                <Package className="w-4 h-4 mr-2" /> Install via npm
              </a>

              {/* DOCS BUTTON */}
              <a
                href="#"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center rounded-xl bg-amber-400 py-3 text-sm font-medium text-black transition-all duration-200 hover:opacity-90"
              >
                <BookOpen className="w-4 h-4 mr-2" /> View Docs
              </a>
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}