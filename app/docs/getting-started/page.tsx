"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { DOCS_GETTING_STARTED } from "@/components/docs-modal"
import { CodeBlock, BlockQuote} from "@/components/docs/markdown-components"

export default function GettingStartedPage() {
  return (
    <article className="flex-1 min-w-0 w-full max-w-full lg:max-w-3xl markdown text-zinc-200 pb-16">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          blockquote: BlockQuote,
        }}
      >
        {DOCS_GETTING_STARTED}
      </ReactMarkdown>
    </article>
  )
}
