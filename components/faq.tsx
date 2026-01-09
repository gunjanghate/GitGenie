"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AnimateIn } from "./parts/animate-in"

export default function FAQ() {
  const faqs = [
    {
      question: "Is my API key secure?",
      answer: "Yes. Your API key is stored securely using your operating system's keychain (via keytar) where available. As a fallback, it uses an encrypted local configuration file. Keys never leave your machine except to authenticate requests with Google.",
    },
    {
      question: "Does GitGenie read my entire codebase?",
      answer: "No. GitGenie only analyzes the diff of your currently staged files to generate context-aware commit messages. Your full source code remains local and is not uploaded.",
    },
    {
      question: "Which AI model powers the commit generation?",
      answer: "GitGenie leverages Google's Gemini 2.0 Flash model. It is optimized for speed and accuracy, ensuring your CLI experience remains snappy while delivering professional Conventional Commits.",
    },
    {
      question: "Does it work on Windows?",
      answer: "Absolutely. GitGenie is built on Node.js and is fully cross-platform. It works seamlessly on Windows (PowerShell, Command Prompt, WSL), macOS, and Linux.",
    },
    {
      question: "What is the --osc flag?",
      answer: "The Open Source Contribution (--osc) flag streamlines contributing to projects. It prompts for an issue number and automatically formats your branch name (e.g., fix/#123-short-description) to match common contribution guidelines.",
    },
    {
      question: "Can I use it with any Git repository?",
      answer: "Yes, GitGenie works with any git repository. If you run it in a folder that isn't a git repo yet, it can even initialize one for you.",
    },
  ]

  return (
    <section id="faq" aria-labelledby="faq-title" className="relative mx-auto lg:mx-32 max-w-6xl px-6 py-20 sm:py-24 z-0">
      
      <div className="mb-12 text-center">
        <AnimateIn>
          <div className="flex flex-col items-center justify-center w-full">
            <h2 id="faq-title" className="text-2xl font-semibold sm:text-3xl text-white">
              Frequently asked questions
            </h2>
            <div className="line h-1 mt-2 animate-collapsible-down w-24 bg-gradient-to-br from-amber-400 to-amber-800"></div>
          </div>
        </AnimateIn>
        <AnimateIn delay={60}>
          <p className="mt-3 text-zinc-300">
            Everything you need to know about GitGenie.
          </p>
        </AnimateIn>
      </div>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full flex flex-col gap-4">
          {faqs.map((faq, idx) => (
            <AnimateIn key={idx} delay={idx * 50}>
              <AccordionItem 
                value={`item-${idx}`} 
                className="border border-white/10 bg-zinc-900/40 px-6 rounded-2xl overflow-hidden backdrop-blur-sm transition-all hover:border-amber-500/30"
              >
                <AccordionTrigger className="text-left text-zinc-100 hover:text-amber-400 hover:no-underline py-5 text-base sm:text-lg transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed text-base pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </AnimateIn>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
