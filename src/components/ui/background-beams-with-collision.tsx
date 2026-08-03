"use client"

import React, { useCallback, useRef, useState } from "react"
import { AnimatePresence, motion, useAnimationFrame } from "framer-motion"
import { cn } from "../../lib/utils"

interface BeamOptions {
  left: string
  duration: number
  delay: number
  repeatDelay: number
  height: number
  width?: number
}

interface BackgroundBeamsWithCollisionProps {
  children?: React.ReactNode
  className?: string
  containerClassName?: string
  isDark?: boolean
  isMobile?: boolean
  reducedMotion?: boolean
}

const DESKTOP_BEAMS: BeamOptions[] = [
  { left: "8%", duration: 8.4, delay: 0.8, repeatDelay: 3.2, height: 72 },
  { left: "24%", duration: 6.8, delay: 3.6, repeatDelay: 4.8, height: 48 },
  { left: "41%", duration: 9.2, delay: 1.9, repeatDelay: 5.2, height: 88, width: 1.5 },
  { left: "59%", duration: 7.6, delay: 5.1, repeatDelay: 3.8, height: 56 },
  { left: "76%", duration: 10.4, delay: 2.7, repeatDelay: 4.2, height: 96, width: 1.5 },
  { left: "91%", duration: 7.1, delay: 6.2, repeatDelay: 5.5, height: 64 },
]

const MOBILE_BEAMS: BeamOptions[] = [
  { left: "26%", duration: 9.6, delay: 1.6, repeatDelay: 7.4, height: 54 },
  { left: "74%", duration: 11.2, delay: 6.8, repeatDelay: 8.2, height: 68 },
]

export const BackgroundBeamsWithCollision = ({
  children,
  className,
  containerClassName,
  isDark = true,
  isMobile = false,
  reducedMotion = false,
}: BackgroundBeamsWithCollisionProps) => {
  const beams = isMobile ? MOBILE_BEAMS : DESKTOP_BEAMS
  const [explosions, setExplosions] = useState<{ id: number; x: number }[]>([])

  const beamGradient = isDark
    ? "linear-gradient(to top, rgba(103, 232, 249, 0.96), rgba(129, 140, 248, 0.92) 42%, rgba(167, 139, 250, 0.36) 72%, transparent)"
    : "linear-gradient(to top, rgba(37, 99, 235, 0.9), rgba(124, 58, 237, 0.76) 42%, rgba(14, 165, 233, 0.3) 72%, transparent)"

  const beamShadow = isDark
    ? "0 0 10px rgba(103, 232, 249, 0.88), 0 0 24px rgba(129, 140, 248, 0.62)"
    : "0 0 9px rgba(37, 99, 235, 0.58), 0 0 22px rgba(124, 58, 237, 0.4)"

  const lineGradient = isDark
    ? "linear-gradient(90deg, transparent 4%, rgba(103, 232, 249, 0.28) 30%, rgba(129, 140, 248, 0.56) 50%, rgba(103, 232, 249, 0.28) 70%, transparent 96%)"
    : "linear-gradient(90deg, transparent 4%, rgba(37, 99, 235, 0.18) 30%, rgba(124, 58, 237, 0.4) 50%, rgba(14, 165, 233, 0.18) 70%, transparent 96%)"

  const lineShadow = isDark
    ? "0 0 18px 3px rgba(103, 232, 249, 0.2), 0 0 34px 8px rgba(129, 140, 248, 0.16)"
    : "0 0 14px 2px rgba(37, 99, 235, 0.15), 0 0 28px 6px rgba(124, 58, 237, 0.12)"

  const explosionColor = isDark ? "rgb(103, 232, 249)" : "rgb(37, 99, 235)"
  const explosionAccent = isDark ? "rgb(167, 139, 250)" : "rgb(124, 58, 237)"

  const addExplosion = useCallback((x: number) => {
    const id = Date.now() + Math.random()
    setExplosions((current) => [...current.slice(-9), { id, x }])
  }, [])

  const removeExplosion = useCallback((id: number) => {
    setExplosions((current) => current.filter((explosion) => explosion.id !== id))
  }, [])

  if (reducedMotion) return null

  return (
    <div
      data-testid="background-beams"
      data-beam-count={beams.length}
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", containerClassName)}
    >
      <div className={cn("relative h-full w-full overflow-hidden", className)}>
        {beams.map((beam, index) => (
          <BeamEffect
            key={`${beam.left}-${index}`}
            beamOptions={beam}
            beamGradient={beamGradient}
            beamShadow={beamShadow}
            onCollision={addExplosion}
          />
        ))}

        {children}

        <AnimatePresence>
          {explosions.map((explosion) => (
            <ImpactDroplets
              key={explosion.id}
              x={explosion.x}
              color={explosionColor}
              accent={explosionAccent}
              mobile={isMobile}
              onComplete={() => removeExplosion(explosion.id)}
            />
          ))}
        </AnimatePresence>

        <div
          className="absolute bottom-0 inset-x-0 h-px"
          style={{
            background: lineGradient,
            boxShadow: lineShadow,
          }}
        />
      </div>
    </div>
  )
}

const ImpactDroplets = React.memo(({
  x,
  color,
  accent,
  mobile,
  onComplete,
}: {
  x: number
  color: string
  accent: string
  mobile: boolean
  onComplete: () => void
}) => {
  const particleCount = mobile ? 5 : 8
  const particles = React.useMemo(
    () => Array.from({ length: particleCount }, (_, index) => {
      const progress = particleCount === 1 ? 0.5 : index / (particleCount - 1)
      const angle = Math.PI + progress * Math.PI
      const speed = (mobile ? 16 : 22) + Math.random() * (mobile ? 13 : 24)

      return {
        dx: Math.cos(angle) * speed,
        lift: Math.sin(angle) * speed - (mobile ? 9 : 14),
        size: (mobile ? 1.5 : 1.8) + Math.random() * (mobile ? 1.8 : 2.6),
        duration: 0.58 + Math.random() * 0.34,
        delay: Math.random() * 0.06,
        color: index % 3 === 0 ? accent : color,
      }
    }),
    [accent, color, mobile, particleCount],
  )

  return (
    <motion.div
      className="absolute bottom-[2px] pointer-events-none"
      style={{ left: x }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0.98 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.85 }}
      onAnimationComplete={onComplete}
    >
      <motion.span
        className="absolute rounded-full border"
        style={{
          left: 0,
          bottom: -1,
          borderColor: color,
          boxShadow: `0 0 14px ${color}`,
        }}
        initial={{ width: 4, height: 3, x: -2, y: 0, opacity: 0.9 }}
        animate={{
          width: mobile ? 24 : 38,
          height: mobile ? 8 : 12,
          x: mobile ? -12 : -19,
          y: mobile ? -3 : -5,
          opacity: 0,
        }}
        transition={{ duration: mobile ? 0.52 : 0.68, ease: "easeOut" }}
      />

      <motion.span
        className="absolute rounded-full"
        style={{
          width: mobile ? 5 : 7,
          height: mobile ? 5 : 7,
          left: mobile ? -2.5 : -3.5,
          bottom: -2,
          background: color,
          boxShadow: `0 0 14px ${color}, 0 0 24px ${accent}`,
        }}
        initial={{ scale: 0.45, opacity: 1 }}
        animate={{ scale: [0.45, 1.5, 0.2], opacity: [1, 0.72, 0] }}
        transition={{ duration: 0.62, ease: "easeOut" }}
      />

      {particles.map((particle, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size * 1.7,
            left: -particle.size / 2,
            bottom: 0,
            background: particle.color,
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.8, rotate: 0 }}
          animate={{
            x: [0, particle.dx, particle.dx * 1.12],
            y: [0, particle.lift, 5],
            opacity: [1, 0.86, 0],
            scale: [0.8, 1, 0.3],
            rotate: [0, particle.dx > 0 ? 18 : -18, particle.dx > 0 ? 34 : -34],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </motion.div>
  )
})

ImpactDroplets.displayName = "ImpactDroplets"

const BeamEffect = React.memo(({
  beamOptions,
  beamGradient,
  beamShadow,
  onCollision,
}: {
  beamOptions: BeamOptions
  beamGradient: string
  beamShadow: string
  onCollision: (x: number) => void
}) => {
  const beamRef = useRef<HTMLDivElement>(null)
  const hasFiredRef = useRef(false)

  useAnimationFrame(() => {
    const beam = beamRef.current
    const container = beam?.parentElement
    if (!beam || !container) return

    const containerRect = container.getBoundingClientRect()
    const beamRect = beam.getBoundingClientRect()
    const distanceToBottom = containerRect.bottom - beamRect.bottom

    if (distanceToBottom < 22 && distanceToBottom > -50 && !hasFiredRef.current) {
      hasFiredRef.current = true
      onCollision(beamRect.left - containerRect.left + beamRect.width / 2)
    } else if (distanceToBottom > 120) {
      hasFiredRef.current = false
    }
  })

  return (
    <motion.div
      ref={beamRef}
      className="absolute top-0 rounded-full will-change-transform"
      style={{
        left: beamOptions.left,
        width: beamOptions.width ?? 1,
        height: beamOptions.height,
        background: beamGradient,
        boxShadow: beamShadow,
      }}
      initial={{ translateY: `-${beamOptions.height + 120}px`, opacity: 0 }}
      animate={{
        translateY: "calc(100vh + 90px)",
        opacity: [0, 0.72, 1, 0.84, 0],
      }}
      transition={{
        duration: beamOptions.duration,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        delay: beamOptions.delay,
        repeatDelay: beamOptions.repeatDelay,
        times: [0, 0.08, 0.3, 0.78, 1],
      }}
    />
  )
})

BeamEffect.displayName = "BeamEffect"

export default BackgroundBeamsWithCollision
