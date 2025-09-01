"use client"

import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"

export function AnimateIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setTimeout(() => setVisible(true), delay)
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "translate-y-0 opacity-100 blur-0" : "translate-y-4 opacity-0 blur-sm"}`}
    >
      {children}
    </div>
  )
}
