"use client";

import { AnimateIn } from "./parts/animate-in";
import AmbientBackground from "./parts/ambient-two";
import { CopyButton } from "./parts/copy-button";
import { useTranslations } from 'next-intl';

export default function Usage() {
  const t = useTranslations("Usage");
  const flags = [
    {
      flag: "--genie",
      desc: t("f1"),
      example: 'gg "oauth added" --ai',
    },
    {
      flag: "--type <type>",
      desc: t("f2"),
      example: 'gg "refactor: cleanup" --type feat',
    },
    {
      flag: "--scope <scope>",
      desc: t("f3"),
      example: 'gg "fix(auth): token refresh" --scope auth',
    },
    {
      flag: "--no-branch",
      desc: t("f4"),
      example: 'gg "chore: update deps" --no-branch',
    },
    {
      flag: "--push-to-main",
      desc: t("f5"),
      example: "gg --push-to-main",
    },
    {
      flag: "--remote <url>",
      desc: t("f6"),
      example: "gg --remote https://github.com/you/repo.git",
    },
    {
      flag: "--osc",
      desc: t("f7"),
      example: 'gg "improve docs" --osc --type docs',
    },
  ];

  // Responsive Check: Initialize as null to avoid hydration mismatch, then determine on mount

  return (
    <section
      id="usage"
      aria-labelledby="usage-title"
      className="relative w-full px-6 lg:px-32 py-20 sm:py-24 min-h-screen z-0"
    >
      <AmbientBackground />
      <div className="mb-10">
        <AnimateIn>
          <div>
            <h2 id="usage-title" className="text-2xl font-semibold sm:text-3xl">
              {t("title")}
            </h2>
            <div className="line h-1 mt-1 animate-collapsible-down w-24 bg-gradient-to-br from-amber-400 to-amber-800"></div>
          </div>
        </AnimateIn>
        <AnimateIn delay={60}>
          <p className="mt-3 max-w-2xl text-zinc-300">
            {t("subtitle")}
          </p>
        </AnimateIn>
      </div>

      {/* RESPONSIVE LOGIC:
          - Wait until mounted (isDesktop !== null) to prevent SSR mismatch
          - Desktop (isDesktop = true): Renders type="multiple" (Grid Layout)
          - Mobile (isDesktop = false): Renders type="single" (Stack Layout)
      */}
      <div className="grid items-stretch gap-6 lg:grid-cols-4 grid-cols-1 auto-rows-[1fr] mb-16">
        {renderFlags(flags)}
      </div>

      {/* Branch Management Shortcuts Section */}
      <section
        id="branch-management"
        className="mt-24 pt-8 border-t border-white/10"
      >
        <AnimateIn>
          <div>
            <h2
              id="shortcuts-title"
              className="text-2xl font-semibold sm:text-3xl"
            >
              {t("shortcuts_title")}
            </h2>
            <div className="line h-1 mt-1 animate-collapsible-down w-24 bg-gradient-to-br from-amber-400 to-amber-800"></div>
          </div>
        </AnimateIn>
        <AnimateIn delay={60}>
          <p className="mt-3 max-w-2xl text-zinc-300 mb-6">
            {t("shortcuts_subtitle")}
          </p>
        </AnimateIn>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          <AnimateIn delay={40}>
            <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-6">
              <span className="font-mono text-base text-amber-400 mb-2">
                gg b &lt;branch&gt;
              </span>
              <span className="text-zinc-300 mb-4 text-sm">
                {t("s1")}
                <br />
                <span className="text-xs text-zinc-400">{t("s1_sub")}</span>
              </span>
              <div className="mt-auto flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <span className="font-mono text-xs text-zinc-200 break-all">
                  gg b feature/login
                </span>
                <CopyButton text="gg b feature/login" />
              </div>
            </div>
          </AnimateIn>
          <AnimateIn delay={80}>
            <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-6">
              <span className="font-mono text-base text-amber-400 mb-2">
                gg s &lt;branch&gt;
              </span>
              <span className="text-zinc-300 mb-4 text-sm">
                {t("s2")}
                <br />
                <span className="text-xs text-zinc-400">{t("s2_sub")}</span>
              </span>
              <div className="mt-auto flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <span className="font-mono text-xs text-zinc-200 break-all">
                  gg s main
                </span>
                <CopyButton text="gg s main" />
              </div>
            </div>
          </AnimateIn>
          <AnimateIn delay={120}>
            <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-6">
              <span className="font-mono text-base text-amber-400 mb-2">
                gg wt ...
              </span>
              <span className="text-zinc-300 mb-4 text-sm">
                {t("s3")}
                <br />
                <span className="text-xs text-zinc-400">
                  {t("s3_sub")}
                </span>
              </span>
              <div className="mt-auto flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <span className="font-mono text-xs text-zinc-200 break-all">
                  gg wt docs ./docs
                </span>
                <CopyButton text="gg wt docs ./docs" />
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>
    </section>
  );
}

function renderFlags(flags: any[]) {
  return flags.map((f, i) => (
    <AnimateIn key={`${f.flag}-${i}`} delay={i * 80}>
      <div className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-4 h-full">
        <div className="flex flex-col gap-1 mb-3">
          <span className="font-mono text-sm text-amber-400 break-words">
            {f.flag}
          </span>
          <span className="text-zinc-300 text-sm leading-snug">{f.desc}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
          <span
            className="min-w-0 break-all font-mono text-xs text-zinc-200"
            title={f.example}
          >
            {f.example}
          </span>
          <CopyButton text={f.example} />
        </div>
      </div>
    </AnimateIn>
  ));
}
