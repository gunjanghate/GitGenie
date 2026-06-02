"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AnimateIn } from "./parts/animate-in"
import { useTranslations } from 'next-intl';

export default function FAQ() {
  const t = useTranslations("FAQ");
  const faqs = t.raw("items") as { question: string; answer: string }[];

  return (
    <section id="faq" aria-labelledby="faq-title" className="relative w-full px-6 lg:px-32 py-20 sm:py-24 min-h-screen z-0">

      <div className="mb-12 text-center">
        <AnimateIn>
          <div className="flex flex-col items-center justify-center w-full">
            <h2 id="faq-title" className="text-2xl font-semibold sm:text-3xl text-white">
              {t("title")}
            </h2>
            <div className="line h-1 mt-2 animate-collapsible-down w-24 bg-gradient-to-br from-amber-400 to-amber-800"></div>
          </div>
        </AnimateIn>
        <AnimateIn delay={60}>
          <p className="mt-3 text-zinc-300">
            {t("subtitle")}
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
