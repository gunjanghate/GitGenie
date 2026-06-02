"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useTranslations } from "next-intl"
import { BlockQuote, CodeBlock } from "@/components/docs/markdown-components"

type LocalizedDocProps = {
  docKey: string
  blockquote?: boolean
}

export default function LocalizedDoc({
  docKey,
  blockquote = false,
}: LocalizedDocProps) {
  const t = useTranslations("DocsContent")
  const content = t.raw(docKey) as string | string[]
  const markdown = Array.isArray(content) ? content.join("\n") : content

  return (
    <article className="flex-1 min-w-0 w-full max-w-full lg:max-w-3xl markdown text-zinc-200 pb-16">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          ...(blockquote ? { blockquote: BlockQuote } : {}),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
