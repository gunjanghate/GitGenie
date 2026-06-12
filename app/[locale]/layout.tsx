import type React from "react"
import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { Plus_Jakarta_Sans } from "next/font/google"
import SmoothScrollProvider from "@/components/SmoothScrollerProvider"
import { ScrollToTop } from "@/components/ScrollToTop"
import SiteFooter from "@/components/site-footer"
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import { notFound } from 'next/navigation';
import { MagicSparkle } from "@/components/magic-sparkle"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
})

export const metadata: Metadata = {
  title: "Git Genie — AI powered Git assistant",
  description:
    "Automate staging, commit messages, branch flow, and pushes in one command. Open-source NPM package to supercharge your Git workflow.",
  alternates: { canonical: "https://gitgenie.vercel.app" },
  openGraph: {
    title: "Git Genie — AI powered Git assistant",
    description:
      "Automate staging, commit messages, branch flow, and pushes in one command. Open-source NPM package.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Git Genie — AI powered Git assistant",
    description:
      "Automate staging, commit messages, branch flow, and pushes in one command.",
  },
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: "en" | "hi" | "es" }>;
}>) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className="dark"
      data-scroll-behavior="smooth"
    >
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              ::-webkit-scrollbar { width: 8px; }
              ::-webkit-scrollbar-track { background: #1a1a1a; }
              ::-webkit-scrollbar-thumb { background: #ffda35; border-radius: 10px; }
              ::-webkit-scrollbar-thumb:hover { background: #ee9919; }
              * { scrollbar-width: thin; scrollbar-color: #eb9524 #1a1a1a; }
            `,
          }}
        />
      </head>

      <body
        className={`min-h-screen flex flex-col bg-black text-white font-sans ${plusJakarta.variable} ${GeistMono.variable}`}
      >
        <MagicSparkle />
        <NextIntlClientProvider messages={messages}>
          <SmoothScrollProvider>
            <Suspense fallback={null}>{children}</Suspense>
            {/* Footer */}
            <SiteFooter />

            <Analytics />
            <ScrollToTop />
          </SmoothScrollProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}