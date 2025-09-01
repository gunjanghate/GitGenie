"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      aria-label="Copy to clipboard"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {}
      }}
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-amber-400/40"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-zinc-300" aria-hidden="true" />
          Copy
        </>
      )}
    </button>
  )
}
