"use client"
import chirag from "../public/chirag.png"
import Link from "next/link"
import { Star, Package, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { FlipWords } from "./ui/flip-words"
import { BackgroundParticles } from "./parts/background-particles"
import { AnimateIn } from "./parts/animate-in"
import { CopyButton } from "./parts/copy-button"
import Image from "next/image"
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { ChevronRight } from "lucide-react";
 
export default function Hero() {
  const words = ["origins", "staging", "commits", "pushes"];
  return (
    <header aria-label="Hero" className="relative overflow-hidden border-b border-white/5">
      <BackgroundParticles />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-center px-6 py-24 sm:py-28 md:py-32 min-h-[85svh]">
        <AnimateIn delay={40}>

             <div className="group relative mx-auto flex items-center justify-center rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f] mb-5">
      <span
        className={cn(
          "absolute inset-0 block h-full w-full animate-gradient rounded-[inherit] bg-gradient-to-r drop-shadow-2xl from-[#ffaa40]/50 via-[#ffff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]",
        )}
        style={{
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "destination-out",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "subtract",
          WebkitClipPath: "padding-box",
        }}
      />
         <Sparkles className="h-4 w-4 text-amber-400" aria-hidden="true" /> <hr className="mx-2 h-4 w-px shrink-0 bg-neutral-500" />
      <AnimatedGradientText className="text-xs font-medium">
        Your own Github Genie | 1.2k+ downloads
      </AnimatedGradientText>
      <ChevronRight
        className="ml-1 size-4 stroke-neutral-500 transition-transform
 duration-300 ease-in-out group-hover:translate-x-0.5"
      />
    </div>
        </AnimateIn>

        <AnimateIn>
          <h1 className={cn("text-balance text-center text-4xl font-semibold sm:text-5xl md:text-6xl leading-tight flex gap-3 justify-center items-center")}>
            Meet <span className="text-transparent bg-clip-text bg-gradient-to-bl from-amber-400 to-amber-800">GitGenie</span>{" "}
            {/* <Sparkles className="inline-block align-middle h-[1em] w-[1em] text-white" aria-hidden="true" /> */}
            <Image
              src={chirag}
              alt="Git Genie"
              width={50}
              height={50}
              priority
              placeholder="blur"
              className="w-24"
            />

          </h1>
        </AnimateIn>

        <AnimateIn delay={100}>
          <article className="text-pretty mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed text-zinc-300 sm:text-xl">
            Your AI-powered Git assistant — automate  <FlipWords words={words} /> <br />  with just one command.
          </article>
        </AnimateIn>

        <AnimateIn delay={150}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="https://github.com/gunjanghate/GitGenie"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.03] hover:shadow-[0_0_0_3px_rgba(245,158,11,0.30)]"
              aria-label="Star on GitHub"
            >
              <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <span>Star on GitHub</span>
            </Link>
            <Link
              href="https://www.npmjs.com/package/@gunjanghate/git-genie"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.03] hover:border-amber-400/40 hover:shadow-[0_0_0_3px_rgba(245,158,11,0.18)]"
              aria-label="Install via npm"
            >
              <Package className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span>Install via npm</span>
            </Link>
          </div>
          <div className="my-12 flex lg:w-full items-center gap-2 rounded-lg border border-white/10 hover:border-amber-500/50 bg-black/60 px-4 py-2.5 font-mono text-sm text-zinc-200 transition-all duration-200 group-hover:border-amber-400/40">
            <div className="flex-1 min-w-0">
              <code
                aria-label={`install command`}
                className="block overflow-hidden text-ellipsis whitespace-nowrap pr-1"
                title={"install command"}
              >
                npm i @gunjanghate/git-genie
              </code>
            </div>
            <div className="shrink-0">
              <CopyButton text={"npm i @gunjanghate/git-genie@latest"} />
            </div>
          </div>
          {/* Product Hunt badge */}
          <div className="mt-6 flex justify-center">
            <Link
              href="https://www.producthunt.com/products/gitgenie?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-gitgenie"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitGenie on Product Hunt"
              className="inline-block"
            >
              <Image
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1012878&theme=dark&t=1757106620847"
                alt="GitGenie - Powered git assistant | Product Hunt"
                width={250}
                height={54}
                style={{ width: "250px", height: "54px" }}
                priority
              />
            </Link>
          </div>
        </AnimateIn>
      </div>
    </header>
  )
}
