'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
  velocityX?: number
  velocityY?: number
  isClick?: boolean
}

export function MagicSparkle() {
  const isMobile = useIsMobile()
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const [isEnabled, setIsEnabled] = useState(false)
  const idCounterRef = useRef(0)
  const lastSpawnRef = useRef(0)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setIsEnabled(!prefersReducedMotion)
  }, [])

  const spawnSparkle = useCallback((x: number, y: number) => {
    const sparkle: Sparkle = {
      id: idCounterRef.current++,
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      size: Math.random() * 4 + 2,
    }
    setSparkles(prev => [...prev.slice(-15), sparkle])
  }, [])

  const spawnClickSparkles = useCallback((x: number, y: number) => {
    const newSparkles: Sparkle[] = []
    const numSparkles = 8 + Math.floor(Math.random() * 6)
    
    for (let i = 0; i < numSparkles; i++) {
      const angle = (Math.PI * 2 * i) / numSparkles + Math.random() * 0.5
      const speed = 30 + Math.random() * 50
      const sparkle: Sparkle = {
        id: idCounterRef.current++,
        x: x,
        y: y,
        size: Math.random() * 6 + 3,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        isClick: true,
      }
      newSparkles.push(sparkle)
    }
    
    setSparkles(prev => [...prev.slice(-30), ...newSparkles])
  }, [])

  useEffect(() => {
    if (isMobile || !isEnabled) return

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastSpawnRef.current > 40) {
        spawnSparkle(e.clientX, e.clientY)
        lastSpawnRef.current = now
      }
    }

    const handleClick = (e: MouseEvent) => {
      spawnClickSparkles(e.clientX, e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('click', handleClick, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [isMobile, isEnabled, spawnSparkle, spawnClickSparkles])

  useEffect(() => {
    if (sparkles.length === 0) return
    
    const timeout = setTimeout(() => {
      setSparkles(prev => prev.slice(1))
    }, 600)
    
    return () => clearTimeout(timeout)
  }, [sparkles])

  if (isMobile || !isEnabled) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          initial={{ 
            scale: sparkle.isClick ? 0 : 0,
            opacity: 1,
            x: sparkle.velocityX ? 0 : undefined,
            y: sparkle.velocityY ? 0 : undefined,
          }}
          animate={{ 
            scale: sparkle.isClick ? [0, 1, 0] : [0, 1.2, 0],
            opacity: sparkle.isClick ? [1, 1, 0] : [1, 1, 0],
            x: sparkle.velocityX ? sparkle.velocityX * 0.5 : undefined,
            y: sparkle.velocityY ? sparkle.velocityY * 0.5 : undefined,
          }}
          transition={{
            duration: sparkle.isClick ? 0.5 : 0.6,
            times: sparkle.isClick ? [0, 0.2, 1] : [0, 0.3, 1],
            ease: sparkle.isClick ? 'easeOut' : 'easeOut',
          }}
          style={{
            position: 'absolute',
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
            borderRadius: '50%',
            background: sparkle.isClick 
              ? 'radial-gradient(circle, #fff 0%, #ffda35 40%, transparent 70%)'
              : 'radial-gradient(circle, #ffda35 0%, #ee9919 50%, transparent 70%)',
            boxShadow: sparkle.isClick 
              ? '0 0 8px 3px rgba(255, 255, 255, 0.8), 0 0 12px 4px rgba(255, 218, 53, 0.6)'
              : '0 0 6px 2px rgba(255, 218, 53, 0.6)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}