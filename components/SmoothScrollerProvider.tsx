"use client"
import { useEffect } from "react"
import Lenis from "lenis"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
      gsap.registerPlugin(ScrollTrigger)
      const lenis = new Lenis({
        smooth: true,
        lerp: 0.08,
        direction: 'vertical',
        gestureOrientation: 'vertical',
        smoothTouch: false,
        syncTouch: true,
      } as any);
  
      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)
  
      lenis.on("scroll", ScrollTrigger.update)
      ScrollTrigger.scrollerProxy(document.body, {
        scrollTop(value?: number) {
          if (arguments.length && value !== undefined) {
            lenis.scrollTo(value, { immediate: true })
          }
          return lenis.scroll
        },
        getBoundingClientRect() {
          return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
        },
      })
      const onRefresh = () => lenis.raf(performance.now())
      ScrollTrigger.addEventListener("refresh", onRefresh)
      ScrollTrigger.refresh()
  
      return () => {
        lenis.destroy()
        ScrollTrigger.removeEventListener("refresh", onRefresh)
      }
    }, [])

  return <>{children}</>
}