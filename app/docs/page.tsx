"use client"

import type React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Copy } from "lucide-react"
import { isValidElement, useMemo, useState } from "react"
import AmbientBackground from "@/components/parts/ambient-background"
import { DOCS_MD } from "@/components/docs-modal"
import { useRouter } from "next/navigation"

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
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/90 transition hover:bg-white/10"
            aria-label="Copy code"
        >
            <Copy size={14} className="opacity-80" />
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
        return <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.92em]">{code}</code>
    }

    const lang = languageClass.replace("language-", "")
    return (
        <div className="relative my-3 w-fit">
            <div className="absolute right-2 top-2 z-10">
                <CopyInline text={code} />
            </div>
            <pre className="text-wrap rounded-lg border border-white/10 bg-black/60 py-8 px-4 text-sm">
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

    const base = "mb-4 leading-relaxed text-zinc-300"
    return containsBlock ? <div className={base}>{children}</div> : <p className={base}>{children}</p>
}

export default function DocsPage() {
    const router = useRouter()
    const content = useMemo(() => DOCS_MD, [])
    return (
        <main className="relative min-h-screen text-white">
            {/* Ambient background */}
           
          

            {/* Top heading */}
            <header className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-6 text-center">
                <h1 className="text-3xl md:text-4xl font-bold"><span className="cursor-pointer text-transparent bg-clip-text bg-gradient-to-bl from-amber-400 to-amber-800" onClick={()=>{
                    router.push("/");
                }}>Git Genie</span> — Documentation</h1>
                <div className="mx-auto mt-2 h-1 w-24 bg-gradient-to-br from-amber-400 to-amber-800" />
                <p className="mx-auto mt-3 max-w-2xl text-zinc-300">Full reference for installation, usage, command palette, and advanced workflows.</p>
            </header>

            {/* Scrollable content */}
            <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16">
                <div className="relative h-full overflow-y-visible p-0 md:p-2 lg:p-4">
                    <article className="markdown text-zinc-200 mx-auto max-w-3xl">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code: CodeBlock,
                                h1: ({ children }) => <h1 className="mb-4 text-3xl md:text-4xl font-bold">{children}</h1>,
                                h2: ({ children }) => <h2 className="mt-8 mb-3 text-2xl font-semibold text-yellow-700">{children}</h2>,
                                h3: ({ children }) => <h3 className="mt-6 mb-2 text-xl font-semibold text-white">{children}</h3>,
                                p: (props) => <SafeParagraph>{props.children}</SafeParagraph>,
                                ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-1">{children}</ol>,
                                a: (props) => (
                                    <a {...props} className="text-amber-400 hover:underline" target="_blank" rel="noreferrer" />
                                ),
                                blockquote: ({ children }) => (
                                    <blockquote className="mb-4 border-l-2 border-amber-400/40 pl-4 text-zinc-300">{children}</blockquote>
                                ),
                                hr: () => <hr className="my-6 border-white/10" />,
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </article>
                </div>
            </div>
        </main>
    )
}
