"use client"

import type React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Copy, Menu } from "lucide-react"
import { isValidElement, useMemo, useState, useEffect, useRef } from "react"
import AmbientBackground from "@/components/parts/ambient-background"
import { DOCS_MD } from "@/components/docs-modal"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Star, Package, Sparkles } from "lucide-react"

// TOC ITEMS
const TOC_ITEMS = [
    { id: "contents", label: "Contents" },
    { id: "quick-start", label: "Quick Start" },
    { id: "install-verify", label: "Install & Verify" },
    { id: "configure-gemini-api-key", label: "Configure API Key" },
    { id: "command-syntax", label: "Command Syntax" },
    { id: "command-palette-interactive", label: "Command Palette" },
    { id: "how-it-works-mapped-to-source", label: "How it Works" },
    { id: "common-workflows", label: "Common Workflows" },
    { id: "branch-merge-behavior", label: "Branch & Merge Behavior" },
    { id: "ai-commit-generation", label: "AI Commit Generation" },
    { id: "ai-branch-pr-generation", label: "AI Branch & PR Generation" },
    { id: "open-source-contributions-osc", label: "Open Source (--osc)" },
    { id: "examples", label: "Examples" },
    { id: "troubleshooting", label: "Troubleshooting" },
    { id: "security-privacy", label: "Security & Privacy" },
    { id: "contributing-roadmap", label: "Contributing / Roadmap" },
    { id: "faq", label: "FAQ" },
    { id: "publish-maintainers", label: "Publish (Maintainers)" },
    { id: "support", label: "Support" },
]

function CopyInline({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    async function onCopy() {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
        } catch { }
    }
    return (
        <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/90 transition hover:bg-white/10 cursor-pointer"
            aria-label="Copy code"
        >
            <Copy size={12} className="opacity-80" />
            <span>{copied ? "Copied" : "Copy"}</span>
        </button>
    )
}

function CodeBlock(props: any) {
    const { inline, className, children } = props
    const raw = children ?? ""
    const code = Array.isArray(raw) ? raw.join("") : String(raw)
    const languageClass = (className || "").toString()
    const isInline = (inline ?? true) && !/language-/.test(languageClass)

    if (isInline) {
        return <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.875em] font-mono">{code}</code>
    }

    const lang = languageClass.replace("language-", "")
    return (
        <div className="group relative my-4 rounded-lg border border-white/10 bg-black/40 overflow-hidden max-w-full">
            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyInline text={code} />
            </div>
            <pre className="overflow-x-auto p-4 text-[0.875rem] leading-relaxed">
                <code className={lang ? `language-${lang}` : undefined}>{code}</code>
            </pre>
        </div>
    )
}

function SafeParagraph({ children }: { children: React.ReactNode }) {
    const kids = Array.isArray(children) ? children : [children]

    const containsBlock = kids.some(function check(node: any): boolean {
        if (!isValidElement(node)) return false
        const t = node.type
        if (t === "pre" || t === "div" || t === "table" || t === "ul" || t === "ol" || t === "hr" || t === "blockquote") {
            return true
        }
        const c = (node.props as any)?.children
        const arr = Array.isArray(c) ? c : c ? [c] : []
        return arr.some(check)
    })

    const base = "mb-4 leading-7 text-zinc-300/90"
    return containsBlock ? <div className={base}>{children}</div> : <p className={base}>{children}</p>
}

// Helper to extract plain text from React nodes recursively
const textFromNode = (node: React.ReactNode): string => {
    if (typeof node === "string" || typeof node === "number") return String(node)
    if (Array.isArray(node)) return node.map(textFromNode).join("")
    if (isValidElement(node)) return textFromNode(node.props.children)
    return ""
}

// Helper to sanitize IDs consistently
const createId = (node: React.ReactNode) =>
    textFromNode(node).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")


export default function DocsPage() {
    const router = useRouter()
    const content = useMemo(() => DOCS_MD, [])
    const [activeSection, setActiveSection] = useState("")
    const observerRef = useRef<IntersectionObserver | null>(null)

    useEffect(() => {
        // Set up intersection observer for active section highlighting
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id)
                    }
                })
            },
            { rootMargin: "-100px 0px -80% 0px" }
        )

        const headings = document.querySelectorAll("article h2[id]")
        headings.forEach((heading) => observerRef.current?.observe(heading))

        return () => {
            observerRef.current?.disconnect()
        }
    }, [content])
    
    return (
        <>
                    {/* Main article content - Responsive widths */}
                    <article className="flex-1 min-w-0 w-full max-w-full lg:max-w-3xl markdown text-zinc-200 pb-16">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code: CodeBlock,
                                h1: ({ children }) => {
                                    const id = createId(children);
                                    return <h1 id={id} className="mb-4 text-3xl md:text-4xl font-bold text-white">{children}</h1>
                                },
                                h2: ({ children }) => {
                                    const id = createId(children);
                                    return (
                                        <h2 
                                            id={id} 
                                            className="mt-12 mb-4 pb-2 text-2xl font-semibold text-white border-b border-white/10 scroll-mt-24"
                                        >
                                            {children}
                                        </h2>
                                    )
                                },
                                h3: ({ children }) => {
                                    const id = createId(children);
                                    return <h3 id={id} className="mt-8 mb-3 text-xl font-semibold text-white/95 scroll-mt-24">{children}</h3>
                                },
                                h4: ({ children }) => {
                                    return <h4 className="mt-6 mb-2 text-lg font-semibold text-white/90">{children}</h4>
                                },
                                p: (props) => <SafeParagraph>{props.children}</SafeParagraph>,
                                ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-2 text-zinc-300/90 leading-7">{children}</ul>,
                                ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-2 text-zinc-300/90 leading-7">{children}</ol>,
                                li: ({ children }) => <li className="pl-1">{children}</li>,
                                a: ({ href, children, ...props }: any) => {
                                    const isInternal = href?.startsWith("#");
                                    if (isInternal) {
                                        return (
                                            <a 
                                                href={href}
                                                className="text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const id = href.replace("#", "");
                                                    const element = document.getElementById(id);
                                                    if (element) {
                                                        element.scrollIntoView({ behavior: "smooth" });
                                                        window.history.replaceState(null, "", href);
                                                    }
                                                }}
                                                {...props}
                                            >
                                                {children}
                                            </a>
                                        )
                                    }
                                    return (
                                        <a 
                                            href={href} 
                                            className="text-amber-400 hover:text-amber-300 underline decoration-amber-400/30 hover:decoration-amber-300 transition-colors cursor-pointer" 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            {...props}
                                        >
                                            {children}
                                        </a>
                                    )
                                },
                                blockquote: ({ children }) => (
                                    <blockquote className="my-4 border-l-4 border-amber-400/40 bg-amber-400/5 pl-4 py-2 text-zinc-300/90 rounded-r">
                                        {children}
                                    </blockquote>
                                ),
                                hr: () => <hr className="my-8 border-white/10" />,
                                table: ({ children }) => (
                                    <div className="my-4 overflow-x-auto w-full">
                                        <table className="w-full border-collapse text-sm">{children}</table>
                                    </div>
                                ),
                                thead: ({ children }) => <thead className="border-b border-white/10">{children}</thead>,
                                tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
                                tr: ({ children }) => <tr>{children}</tr>,
                                th: ({ children }) => <th className="px-4 py-2 text-left font-semibold text-white/90">{children}</th>,
                                td: ({ children }) => <td className="px-4 py-2 text-zinc-300/90">{children}</td>,
                            }}
                        >

                            {content}
                        </ReactMarkdown>

                    </article>

        </>
        )
}
