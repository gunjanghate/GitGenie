import type { Metadata } from "next"
import Hero from "@/components/hero"
import Features from "@/components/features"
import HowItWorks from "@/components/how-it-works"
import Usage from "@/components/usage"
import Community from "@/components/community"
import SiteFooter from "@/components/site-footer"
import DemoVideoSection from "@/components/demo-video"
import FAQ from "@/components/faq"
import HeroNav from "@/components/hero-nav"


export const metadata: Metadata = {
  metadataBase: new URL("https://gitgenie.vercel.app"),
  title: "Git Genie — AI-powered Git assistant",
  description:
    "Automate staging, commit messages, branch flow, and pushes in one command. Open-source NPM package to supercharge your Git workflow.",
  alternates: { canonical: "https://git-genie.example.com" },
  openGraph: {
    title: "Git Genie — AI-powered Git assistant",
    description: "Automate staging, commit messages, branch flow, and pushes in one command. Open-source NPM package.",
    type: "website",
    images: [
      {
        url: "/gitgenie_logo.png",
        width: 1200,
        height: 630,
        alt: "Git Genie - AI-powered Git assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Git Genie — AI-powered Git assistant",
    description: "Automate staging, commit messages, branch flow, and pushes in one command.",
    images: ["/gitgenie_logo.png"]
  },
}


export default function Page() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-x-hidden">
      <div className="relative">
        <Hero />
        {/* Navigation bar positioned at the top */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
          <HeroNav />
        </div>
      </div>
      <Features />
      <HowItWorks />
      <DemoVideoSection />
      <Usage />
      <FAQ/>
      <Community />
      <SiteFooter />
    </main>
  )
}
