"use client"

import { Copy } from "lucide-react"
import { useState } from "react"

function CopyInline({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:bg-white/10 rounded transition-colors"
      title="Copy code"
    >
      <Copy size={16} className={copied ? "text-green-400" : "text-white/60"} />
    </button>
  )
}

export function CodeBlock(props: any) {
  const { inline, className, children } = props
  const raw = Array.isArray(children) ? children.join("") : String(children ?? "")
  const hasNewline = raw.includes("\n")

  // ✅ Treat single-line blocks as inline code
  if (inline || (!hasNewline && raw.length < 60)) {
    return (
      <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.875em] font-mono">
        {raw}
      </code>
    )
  }

  return (
    <div className="group relative my-4 rounded-lg border border-white/10 bg-black/40 overflow-hidden">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyInline text={raw} />
      </div>
      <pre className="overflow-x-auto p-4 text-[0.875rem] leading-relaxed">
        <code className={className}>{raw}</code>
      </pre>
    </div>
  )
}

