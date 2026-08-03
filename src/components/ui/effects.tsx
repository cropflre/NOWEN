import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface MeteorsProps {
  number?: number
  className?: string
}

const MAX_VISIBLE_METEORS = 6

export function Meteors({ number = MAX_VISIBLE_METEORS, className }: MeteorsProps) {
  const meteorCount = Math.max(0, Math.min(number, MAX_VISIBLE_METEORS))

  // Keep each meteor's position and timing stable across parent re-renders.
  // A long, staggered cycle keeps only one or two meteors visible at once.
  const meteors = useMemo(
    () =>
      Array.from({ length: meteorCount }, (_, i) => ({
        id: i,
        left: `${35 + Math.random() * 75}%`,
        top: `${Math.random() * 22}%`,
        animationDelay: `${i * 2.2 + Math.random() * 1.2}s`,
        animationDuration: `${12 + Math.random() * 3.5}s`,
      })),
    [meteorCount]
  )

  return (
    <div
      aria-hidden="true"
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
    >
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className="absolute w-0.5 h-0.5 rounded-full bg-white/80 animate-meteor motion-reduce:hidden"
          style={{
            left: meteor.left,
            top: meteor.top,
            animationDelay: meteor.animationDelay,
            animationDuration: meteor.animationDuration,
            willChange: 'transform, opacity',
          }}
        >
          {/* Tail */}
          <span className="absolute top-1/2 -translate-y-1/2 w-[120px] h-px bg-gradient-to-r from-white/40 via-white/20 to-transparent" />
        </span>
      ))}
    </div>
  )
}

interface SparklesProps {
  children: React.ReactNode
  className?: string
  sparkleCount?: number
}

export function Sparkles({ children, className, sparkleCount = 10 }: SparklesProps) {
  const sparkles = Array.from({ length: sparkleCount }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 2,
    duration: Math.random() * 1 + 1,
    size: Math.random() * 4 + 2,
  }))

  return (
    <span className={cn('relative inline-block', className)}>
      {sparkles.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          className="absolute inline-block"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            width: sparkle.size,
            height: sparkle.size,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: sparkle.duration,
            repeat: Infinity,
            delay: sparkle.delay,
            ease: 'easeInOut',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
              fill="currentColor"
              className="text-nebula-cyan"
            />
          </svg>
        </motion.span>
      ))}
      {children}
    </span>
  )
}

interface GlowingBorderProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function GlowingBorder({ children, className, glowColor = '#667eea' }: GlowingBorderProps) {
  return (
    <div className={cn('relative group', className)}>
      {/* Animated Border */}
      <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${glowColor}, transparent, ${glowColor}, transparent)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      
      {/* Content with background */}
      <div className="relative rounded-2xl bg-[#0d0d14]">
        {children}
      </div>
    </div>
  )
}

interface TracingBeamProps {
  className?: string
  status?: 'online' | 'offline' | 'warning'
}

export function TracingBeam({ className, status = 'online' }: TracingBeamProps) {
  const colors = {
    online: '#22c55e',
    offline: '#ef4444',
    warning: '#f59e0b',
  }

  return (
    <div className={cn('relative w-1 h-full', className)}>
      {/* Track */}
      <div className="absolute inset-0 rounded-full bg-white/5" />
      
      {/* Beam */}
      <motion.div
        className="absolute w-full rounded-full"
        style={{
          background: `linear-gradient(to bottom, transparent, ${colors[status]}, transparent)`,
          height: '40%',
        }}
        animate={{
          top: ['0%', '60%', '0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Glow */}
      <motion.div
        className="absolute w-4 h-4 -left-1.5 rounded-full"
        style={{
          background: colors[status],
          filter: 'blur(8px)',
        }}
        animate={{
          top: ['0%', '60%', '0%'],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
