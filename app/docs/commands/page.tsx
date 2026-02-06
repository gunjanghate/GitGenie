"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { DOCS_COMMANDS } from "@/components/docs-modal"
import { CodeBlock} from "@/components/docs/markdown-components"

export default function CommandsPage() {
  return (
    <article className="flex-1 min-w-0 w-full max-w-full lg:max-w-3xl markdown text-zinc-200 pb-16">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
        }}
      >
        {DOCS_COMMANDS}
      </ReactMarkdown>
    </article>
  )
}
