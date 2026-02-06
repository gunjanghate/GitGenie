"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { DOCS_SECURITY } from "@/components/docs-modal"
import { CodeBlock} from "@/components/docs/markdown-components"

export default function SecurityPage() {
  return (
    <article className="flex-1 min-w-0 w-full lg:max-w-3xl markdown text-zinc-200 pb-16">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
        }}
      >
        {DOCS_SECURITY}
      </ReactMarkdown>
    </article>
  )
}
