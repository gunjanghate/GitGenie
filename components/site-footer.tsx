import Link from "next/link"
import AmbientBackground from "./parts/ambient-background"
import chirag from "@/public/chirag.png"
import Image from "next/image"
export default function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-black overflow-hidden mx-auto lg:mx-32 rounded-t-3xl">
      {/* Subtle amber glow for footer cohesion */}
      <AmbientBackground variant="footer" />
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center items-center gap-8 lg:gap-32 px-6 py-12 text-center">
        
        <FooterCol
          title="GitGenie "
          links={[
        { href: "https://github.com/gunjanghate/GitGenie", label: "GitHub Repo" },
        { href: "https://www.npmjs.com/package/@gunjanghate/git-genie", label: "NPM Package" },
        { href: "#docs", label: "Docs" },
          ]}
        />
        <FooterCol
          title="Community"
          links={[
        { href: "https://github.com/gunjanghate/GitGenie#contributing", label: "Contribute" },
        { href: "https://github.com/gunjanghate/GitGenie/issues", label: "Report Issues" },
        { href: "https://github.com/gunjanghate/GitGenie/discussions", label: "Discussion" },
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
        { href: "#how-it-works", label: "Install" },
        { href: "#usage", label: "Usage" },
        { href: "#usage", label: "Flags" },
          ]}
        />
        <FooterCol
          title="Follow"
          links={[
        { href: "https://twitter.com/gunjanghate11", label: "Twitter/X" },
        { href: "https://www.npmjs.com/package/@gunjanghate/git-genie", label: "NPM" },
        { href: "https://github.com/gunjanghate/GitGenie", label: "GitHub" },
          ]}
        />
      </div>
      <div className="px-6 flex gap-4 justify-center items-center pb-8 text-center text-xs text-zinc-400">
       <Image src={chirag} width={18} height={18} alt="Chirag" className="h-8 w-8 rounded-full" /> <p>© {new Date().getFullYear()} GitGenie. MIT Licensed.</p>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-sm font-semibold text-amber-400/70">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={`${l.href}-${l.label}`}>
            <Link href={l.href} className="text-sm text-zinc-300 transition-colors  relative group">
              {l.label}
              <span className="absolute left-0  -bottom-1 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
