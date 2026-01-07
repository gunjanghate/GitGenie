import type React from "react"
import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { Plus_Jakarta_Sans } from "next/font/google"
import SmoothScrollProvider from "@/components/SmoothScrollerProvider"
import { ScrollToTop } from "@/components/ScrollToTop"
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
})

export const metadata: Metadata = {
  title: "Git Genie — AI-powered Git assistant",
  description:
    "Automate staging, commit messages, branch flow, and pushes in one command. Open-source NPM package to supercharge your Git workflow.",
  alternates: { canonical: "https://gitgenie.vercel.app" },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`font-sans ${plusJakarta.variable} ${GeistMono.variable}`}>
        <SmoothScrollProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
          <ScrollToTop />
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
