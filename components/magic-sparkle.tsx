'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
}

export function MagicSparkle() {
  const isMobile = useIsMobile()
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const idCounterRef = useRef(0)
  const lastSpawnRef = useRef(0)

  const prefersReducedMotion = 
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : true

  const spawnSparkle = useCallback((x: number, y: number) => {
    const sparkle: Sparkle = {
      id: idCounterRef.current++,
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      size: Math.random() * 4 + 2,
    }
    setSparkles(prev => [...prev.slice(-15), sparkle])
  }, [])

  useEffect(() => {
    if (isMobile || prefersReducedMotion || typeof window === 'undefined') return

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastSpawnRef.current > 40) {
        spawnSparkle(e.clientX, e.clientY)
        lastSpawnRef.current = now
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isMobile, prefersReducedMotion, spawnSparkle])

  useEffect(() => {
    if (sparkles.length === 0) return
    
    const timeout = setTimeout(() => {
      setSparkles(prev => prev.slice(1))
    }, 600)
    
    return () => clearTimeout(timeout)
  }, [sparkles])

  if (isMobile || prefersReducedMotion || typeof window === 'undefined') return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          initial={{ 
            scale: 0,
            opacity: 1,
          }}
          animate={{ 
            scale: [0, 1.2, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 0.6,
            times: [0, 0.3, 1],
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ffda35 0%, #ee9919 50%, transparent 70%)',
            boxShadow: '0 0 6px 2px rgba(255, 218, 53, 0.6)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}