"use client";

import { AnimateIn } from "./parts/animate-in";
import AmbientBackground from "./parts/ambient-two";
import { Badge } from "@/components/UI/badge";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function NewAddOns() {
  const items = [
    {
      icon: <Sparkles className="h-6 w-6 text-amber-400" aria-hidden="true" />,
      title: "gg split",
      body: (
        <>
          <div>Intelligently split mixed changes into clean, logical commits.</div>

          <ul className="mt-3 space-y-1 text-sm text-zinc-400 list-disc list-inside">
            <li>AI-powered grouping (opt-in)</li>
            <li>Heuristic fallback</li>
            <li>Interactive review flow</li>
          </ul>

          <div className="mt-4 text-xs">
  <Link
    href="/docs/new-add-ons"
    className="text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-4"
  >
    Know more in docs →
  </Link>
</div>
        </>
      ),
    },
  ];

  return (
    <section
      id="add-ons"
      aria-labelledby="add-ons-title"
      className="relative mx-auto lg:mx-32 max-w-6xl px-6 py-20 sm:py-24"
    >
      <AmbientBackground />

      <div className="mb-10 relative z-10">
        <h2
          id="add-ons-title"
          className="text-2xl font-semibold sm:text-3xl text-white flex items-center gap-3"
        >
          New Add Ons
          <Badge className="bg-amber-500 text-black">NEW</Badge>
        </h2>

        <div className="h-1 mt-2 w-25 bg-gradient-to-r from-amber-400 to-amber-800 "></div>
      </div>

      <div className="relative z-10 flex justify-start">
  <div className="w-full sm:w-[70%] lg:w-[55%]">
        {items.map((it, idx) => (
          <AnimateIn key={it.title} delay={idx * 80}>
            <article className="group flex flex-col gap-1 rounded-2xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                {it.icon}
              </div>

              <h3 className="text-lg font-semibold">{it.title}</h3>
              <div className="mt-2 text-zinc-300">{it.body}</div>
            </article>
          </AnimateIn>
        ))}
      </div>
    </div>  
    </section>
  );
}
