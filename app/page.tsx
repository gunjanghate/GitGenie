import type { Metadata } from "next"
import Hero from "@/components/hero"
import Features from "@/components/features"
import HowItWorks from "@/components/how-it-works"
import Usage from "@/components/usage"
import Community from "@/components/community"
import SiteFooter from "@/components/site-footer"
import DemoVideoSection from "@/components/demo-video"
import FAQ from "@/components/faq"

export const metadata: Metadata = {
  title: "Git Genie — AI-powered Git assistant",
  description:
    "Automate staging, commit messages, branch flow, and pushes in one command. Open-source NPM package to supercharge your Git workflow.",
  alternates: { canonical: "https://git-genie.example.com" },
  openGraph: {
    title: "Git Genie — AI-powered Git assistant",
    description: "Automate staging, commit messages, branch flow, and pushes in one command. Open-source NPM package.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Git Genie — AI-powered Git assistant",
    description: "Automate staging, commit messages, branch flow, and pushes in one command.",
  },
}

export default function Page() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-x-hidden">
      <Hero />
      <Features />
      <HowItWorks />
      <DemoVideoSection />
      <Usage />
      <FAQ />
      <Community />
      <SiteFooter />
    </main>
  )
}
