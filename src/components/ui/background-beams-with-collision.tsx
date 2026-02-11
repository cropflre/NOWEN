"use client"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence, useMotionValue, useAnimationFrame } from "framer-motion"
import React, { useState, useCallback, useRef } from "react"

export const BackgroundBeamsWithCollision = ({
  children,
  className,
  isDark = true,
}: {
  children?: React.ReactNode
  className?: string
  containerClassName?: string
  isDark?: boolean
}) => {
  const beams = [
    { initialX: 10, translateX: 10, duration: 7, repeatDelay: 3, delay: 2 },
    { initialX: 600, translateX: 600, duration: 3, repeatDelay: 3, delay: 4 },
    { initialX: 100, translateX: 100, duration: 7, repeatDelay: 7, className: "h-6" },
    { initialX: 400, translateX: 400, duration: 5, repeatDelay: 14, delay: 4 },
    { initialX: 800, translateX: 800, duration: 11, repeatDelay: 2, className: "h-20" },
    { initialX: 1000, translateX: 1000, duration: 4, repeatDelay: 2, className: "h-12" },
    { initialX: 1200, translateX: 1200, duration: 6, repeatDelay: 4, delay: 2, className: "h-6" },
    { initialX: 200, translateX: 200, duration: 8, repeatDelay: 5, delay: 1 },
    { initialX: 1400, translateX: 1400, duration: 5, repeatDelay: 6, className: "h-8" },
    { initialX: 300, translateX: 300, duration: 9, repeatDelay: 4, delay: 3, className: "h-16" },
  ]

  const beamGradient = isDark
    ? "linear-gradient(to top, var(--color-glow), var(--color-glow-secondary), transparent)"
    : "linear-gradient(to top, rgba(59, 130, 246, 0.6), rgba(147, 51, 234, 0.4), transparent)"
  
  const beamShadow = isDark
    ? "0 0 8px var(--color-glow), 0 0 16px var(--color-glow-secondary)"
    : "0 0 8px rgba(59, 130, 246, 0.5), 0 0 16px rgba(147, 51, 234, 0.3)"
  
  const lineGradient = isDark
    ? "linear-gradient(90deg, transparent 10%, var(--color-glow) 50%, transparent 90%)"
    : "linear-gradient(90deg, transparent 10%, rgba(59, 130, 246, 0.5) 50%, transparent 90%)"
  
  const lineShadow = isDark
    ? "0 0 20px 5px var(--color-glow), 0 0 40px 10px var(--color-glow-secondary)"
    : "0 0 15px 3px rgba(59, 130, 246, 0.4), 0 0 30px 8px rgba(147, 51, 234, 0.2)"

  const explosionColor = isDark
    ? "var(--color-glow)"
    : "rgba(59, 130, 246, 0.8)"

  const [explosions, setExplosions] = useState<{ id: number; x: number }[]>([])

  const addExplosion = useCallback((x: number) => {
    const id = Date.now() + Math.random()
    setExplosions(prev => [...prev, { id, x }])
  }, [])

  const removeExplosion = useCallback((id: number) => {
    setExplosions(prev => prev.filter(e => e.id !== id))
  }, [])

  return (
    <div
      className={cn(
        "relative flex items-center w-full h-full justify-center overflow-hidden",
        className
      )}
    >
      {beams.map((beam, idx) => (
        <BeamEffect
          key={`beam-${idx}`}
          beamOptions={beam}
          beamGradient={beamGradient}
          beamShadow={beamShadow}
          onCollision={addExplosion}
        />
      ))}

      {children}
      
      {/* 碰撞爆炸粒子 */}
      <AnimatePresence>
        {explosions.map(e => (
          <ExplosionParticles
            key={e.id}
            x={e.x}
            color={explosionColor}
            onComplete={() => removeExplosion(e.id)}
          />
        ))}
      </AnimatePresence>

      {/* 底部碰撞线 */}
      <div
        className="absolute bottom-0 w-full inset-x-0 pointer-events-none h-1"
        style={{
          background: lineGradient,
          boxShadow: lineShadow,
        }}
      />
    </div>
  )
}

// 爆炸粒子组件
const ExplosionParticles = React.memo(({
  x,
  color,
  onComplete,
}: {
  x: number
  color: string
  onComplete: () => void
}) => {
  const particles = React.useMemo(() => 
    Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI + Math.PI
      const speed = 15 + Math.random() * 25
      return {
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 5,
        size: 1.5 + Math.random() * 2.5,
        duration: 0.3 + Math.random() * 0.4,
      }
    }), []
  )

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, bottom: 2 }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      onAnimationComplete={onComplete}
    >
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: p.dx,
            y: p.dy,
            opacity: 0,
            scale: 0.2,
          }}
          transition={{
            duration: p.duration,
            ease: "easeOut",
          }}
        />
      ))}
    </motion.div>
  )
})

ExplosionParticles.displayName = "ExplosionParticles"

/**
 * 光束组件 - 通过 ref 监测实际 DOM 位置判断是否到达底部
 */
const BeamEffect = React.memo(({
  beamOptions = {},
  beamGradient,
  beamShadow,
  onCollision,
}: {
  beamOptions?: {
    initialX?: number
    translateX?: number
    initialY?: number
    translateY?: number
    rotate?: number
    className?: string
    duration?: number
    delay?: number
    repeatDelay?: number
  }
  beamGradient?: string
  beamShadow?: string
  onCollision?: (x: number) => void
}) => {
  const beamRef = useRef<HTMLDivElement>(null)
  const hasFiredRef = useRef(false)

  // 每帧检测光束位置，到达容器底部时触发爆炸
  useAnimationFrame(() => {
    const el = beamRef.current
    if (!el || !el.parentElement) return

    const containerRect = el.parentElement.getBoundingClientRect()
    const beamRect = el.getBoundingClientRect()
    
    // 光束底边距容器底边的距离
    const distanceToBottom = containerRect.bottom - beamRect.bottom

    if (distanceToBottom < 30 && !hasFiredRef.current) {
      // 光束到达底部，触发爆炸
      hasFiredRef.current = true
      const x = beamOptions.translateX || 0
      onCollision?.(x)
    } else if (distanceToBottom > 100) {
      // 光束远离底部，重置触发标记（为下一次循环做准备）
      hasFiredRef.current = false
    }
  })

  return (
    <motion.div
      ref={beamRef}
      initial={{
        translateY: beamOptions.initialY || "-200px",
        translateX: beamOptions.initialX || "0px",
        rotate: beamOptions.rotate || 0,
        opacity: 0.8,
      }}
      animate={{
        translateY: "calc(100vh - 10px)",
        translateX: beamOptions.translateX || "0px",
        rotate: beamOptions.rotate || 0,
        opacity: [0.8, 1, 0.8, 0],
      }}
      transition={{
        duration: beamOptions.duration || 8,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        delay: beamOptions.delay || 0,
        repeatDelay: beamOptions.repeatDelay || 0,
      }}
      className={cn(
        "absolute left-0 top-20 m-auto h-14 w-px rounded-full will-change-transform",
        beamOptions.className
      )}
      style={{
        background: beamGradient || "linear-gradient(to top, var(--color-glow), var(--color-glow-secondary), transparent)",
        boxShadow: beamShadow || "0 0 8px var(--color-glow), 0 0 16px var(--color-glow-secondary)",
      }}
    />
  )
})

BeamEffect.displayName = "BeamEffect"

export default BackgroundBeamsWithCollision
