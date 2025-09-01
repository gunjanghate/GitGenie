import Link from "next/link"
import AmbientBackground from "./parts/ambient-background"

export default function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-black overflow-hidden">
      {/* Subtle amber glow for footer cohesion */}
      <AmbientBackground variant="footer" />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <FooterCol
          title="Git Genie"
          links={[
            { href: "https://github.com/your-org/git-genie", label: "GitHub Repo" },
            { href: "https://www.npmjs.com/package/@gunjanghate/git-genie", label: "NPM Package" },
            { href: "#", label: "Docs" },
          ]}
        />
        <FooterCol
          title="Community"
          links={[
            { href: "https://github.com/your-org/git-genie#contributing", label: "Contribute" },
            { href: "https://github.com/your-org/git-genie/issues", label: "Report Issues" },
            { href: "https://github.com/your-org/git-genie/discussions", label: "Discussion" },
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
            { href: "https://twitter.com", label: "Twitter/X" },
            { href: "https://www.npmjs.com/package/@gunjanghate/git-genie", label: "NPM" },
            { href: "https://github.com/your-org/git-genie", label: "GitHub" },
          ]}
        />
      </div>
      <div className="px-6 pb-8 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Git Genie. MIT Licensed.
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={`${l.href}-${l.label}`}>
            <Link href={l.href} className="text-sm text-zinc-300 transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
