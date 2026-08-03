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
  width: number
}

interface BackgroundBeamsWithCollisionProps {
  children?: React.ReactNode
  className?: string
  containerClassName?: string
  isDark?: boolean
  isMobile?: boolean
  /** Kept for compatibility. The NOWEN animation switch is the explicit source of truth. */
  reducedMotion?: boolean
}

const DESKTOP_BEAMS: BeamOptions[] = [
  { left: "4%", duration: 6.4, delay: -2.8, repeatDelay: 0.9, height: 132, width: 2 },
  { left: "17%", duration: 7.2, delay: -5.1, repeatDelay: 1.2, height: 96, width: 2.5 },
  { left: "30%", duration: 5.8, delay: -1.6, repeatDelay: 1.1, height: 118, width: 2 },
  { left: "43%", duration: 7.8, delay: -6.2, repeatDelay: 0.8, height: 154, width: 3 },
  { left: "57%", duration: 6.8, delay: -3.7, repeatDelay: 1.4, height: 108, width: 2.5 },
  { left: "70%", duration: 8.1, delay: -7.1, repeatDelay: 0.9, height: 146, width: 3 },
  { left: "83%", duration: 6.1, delay: -4.5, repeatDelay: 1.3, height: 102, width: 2 },
  { left: "96%", duration: 7.4, delay: -2.2, repeatDelay: 1, height: 126, width: 2.5 },
]

const MOBILE_BEAMS: BeamOptions[] = [
  { left: "18%", duration: 7.4, delay: -4.8, repeatDelay: 1.8, height: 92, width: 2 },
  { left: "51%", duration: 8.2, delay: -2.7, repeatDelay: 2.2, height: 114, width: 2.5 },
  { left: "84%", duration: 7.8, delay: -6.1, repeatDelay: 2, height: 98, width: 2 },
]

export const BackgroundBeamsWithCollision = ({
  children,
  className,
  containerClassName,
  isDark = true,
  isMobile = false,
}: BackgroundBeamsWithCollisionProps) => {
  const beams = isMobile ? MOBILE_BEAMS : DESKTOP_BEAMS
  const [explosions, setExplosions] = useState<{ id: number; x: number }[]>([])

  const beamGradient = isDark
    ? "linear-gradient(to top, rgba(103, 232, 249, 1), rgba(129, 140, 248, 1) 38%, rgba(192, 132, 252, 0.72) 68%, transparent)"
    : "linear-gradient(to top, rgba(14, 116, 255, 0.98), rgba(124, 58, 237, 0.94) 40%, rgba(6, 182, 212, 0.62) 70%, transparent)"

  const beamShadow = isDark
    ? "0 0 12px rgba(103, 232, 249, 0.96), 0 0 30px rgba(129, 140, 248, 0.78), 0 0 54px rgba(167, 139, 250, 0.35)"
    : "0 0 11px rgba(37, 99, 235, 0.82), 0 0 28px rgba(124, 58, 237, 0.6), 0 0 48px rgba(14, 165, 233, 0.3)"

  const lineGradient = isDark
    ? "linear-gradient(90deg, transparent 1%, rgba(103, 232, 249, 0.36) 24%, rgba(129, 140, 248, 0.82) 50%, rgba(103, 232, 249, 0.36) 76%, transparent 99%)"
    : "linear-gradient(90deg, transparent 1%, rgba(37, 99, 235, 0.3) 24%, rgba(124, 58, 237, 0.66) 50%, rgba(14, 165, 233, 0.3) 76%, transparent 99%)"

  const lineShadow = isDark
    ? "0 0 22px 4px rgba(103, 232, 249, 0.3), 0 0 46px 10px rgba(129, 140, 248, 0.22)"
    : "0 0 18px 3px rgba(37, 99, 235, 0.24), 0 0 38px 9px rgba(124, 58, 237, 0.18)"

  const explosionColor = isDark ? "rgb(103, 232, 249)" : "rgb(29, 78, 216)"
  const explosionAccent = isDark ? "rgb(192, 132, 252)" : "rgb(124, 58, 237)"

  const addExplosion = useCallback((x: number) => {
    const id = Date.now() + Math.random()
    setExplosions((current) => [...current.slice(-13), { id, x }])
  }, [])

  const removeExplosion = useCallback((id: number) => {
    setExplosions((current) => current.filter((explosion) => explosion.id !== id))
  }, [])

  return (
    <div
      data-testid="background-beams"
      data-beam-count={beams.length}
      data-animation-profile="restored"
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
          className="absolute bottom-0 inset-x-0 h-[2px]"
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
  const particleCount = mobile ? 7 : 12
  const particles = React.useMemo(
    () => Array.from({ length: particleCount }, (_, index) => {
      const progress = particleCount === 1 ? 0.5 : index / (particleCount - 1)
      const angle = Math.PI + progress * Math.PI
      const speed = (mobile ? 24 : 34) + Math.random() * (mobile ? 18 : 34)

      return {
        dx: Math.cos(angle) * speed,
        lift: Math.sin(angle) * speed - (mobile ? 15 : 24),
        size: (mobile ? 2.2 : 2.8) + Math.random() * (mobile ? 2.4 : 3.6),
        duration: 0.76 + Math.random() * 0.42,
        delay: Math.random() * 0.08,
        color: index % 3 === 0 ? accent : color,
      }
    }),
    [accent, color, mobile, particleCount],
  )

  return (
    <motion.div
      className="absolute bottom-[3px] pointer-events-none"
      style={{ left: x }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.15 }}
      onAnimationComplete={onComplete}
    >
      <motion.span
        className="absolute rounded-full border-2"
        style={{
          left: 0,
          bottom: -2,
          borderColor: color,
          boxShadow: `0 0 18px ${color}, inset 0 0 12px ${accent}`,
        }}
        initial={{ width: 6, height: 4, x: -3, y: 0, opacity: 1 }}
        animate={{
          width: mobile ? 42 : 68,
          height: mobile ? 14 : 22,
          x: mobile ? -21 : -34,
          y: mobile ? -6 : -9,
          opacity: 0,
        }}
        transition={{ duration: mobile ? 0.7 : 0.92, ease: "easeOut" }}
      />

      <motion.span
        className="absolute rounded-full"
        style={{
          width: mobile ? 8 : 11,
          height: mobile ? 8 : 11,
          left: mobile ? -4 : -5.5,
          bottom: -3,
          background: color,
          boxShadow: `0 0 18px ${color}, 0 0 34px ${accent}`,
        }}
        initial={{ scale: 0.35, opacity: 1 }}
        animate={{ scale: [0.35, 1.9, 0.15], opacity: [1, 0.86, 0] }}
        transition={{ duration: 0.86, ease: "easeOut" }}
      />

      {particles.map((particle, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size * 1.9,
            left: -particle.size / 2,
            bottom: 0,
            background: particle.color,
            boxShadow: `0 0 ${particle.size * 4}px ${particle.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.9, rotate: 0 }}
          animate={{
            x: [0, particle.dx, particle.dx * 1.18],
            y: [0, particle.lift, 10],
            opacity: [1, 0.95, 0],
            scale: [0.9, 1.18, 0.25],
            rotate: [0, particle.dx > 0 ? 22 : -22, particle.dx > 0 ? 48 : -48],
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

    if (distanceToBottom < 28 && distanceToBottom > -80 && !hasFiredRef.current) {
      hasFiredRef.current = true
      onCollision(beamRect.left - containerRect.left + beamRect.width / 2)
    } else if (distanceToBottom > 150) {
      hasFiredRef.current = false
    }
  })

  return (
    <motion.div
      ref={beamRef}
      data-testid="beam-streak"
      className="absolute top-0 rounded-full will-change-transform"
      style={{
        left: beamOptions.left,
        width: beamOptions.width,
        height: beamOptions.height,
        background: beamGradient,
        boxShadow: beamShadow,
      }}
      initial={{ translateY: `-${beamOptions.height + 80}px`, opacity: 0.35 }}
      animate={{
        translateY: "calc(100vh + 110px)",
        opacity: [0.35, 1, 1, 0.92, 0.22],
      }}
      transition={{
        duration: beamOptions.duration,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        delay: beamOptions.delay,
        repeatDelay: beamOptions.repeatDelay,
        times: [0, 0.08, 0.42, 0.82, 1],
      }}
    />
  )
})

BeamEffect.displayName = "BeamEffect"

export default BackgroundBeamsWithCollision
