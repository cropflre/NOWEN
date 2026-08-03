import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface MeteorsProps {
  number?: number
  className?: string
}

const MAX_VISIBLE_METEORS = 6
const METEOR_LAYOUT = [
  { left: '9%', top: '22%', delay: 0.8, duration: 12.5, distance: 88, rotate: -18 },
  { left: '31%', top: '13%', delay: 5.4, duration: 15.5, distance: 72, rotate: -22 },
  { left: '73%', top: '19%', delay: 3.1, duration: 13.8, distance: 96, rotate: -16 },
  { left: '84%', top: '57%', delay: 9.6, duration: 16.8, distance: 78, rotate: -24 },
  { left: '18%', top: '68%', delay: 12.7, duration: 14.6, distance: 84, rotate: -20 },
  { left: '58%', top: '76%', delay: 7.9, duration: 17.2, distance: 70, rotate: -17 },
]

/**
 * Short diagonal meteor glints. They stay visible enough to give the page character,
 * while avoiding the long vertical streaks that previously resembled rendering faults.
 */
export function Meteors({ number = MAX_VISIBLE_METEORS, className }: MeteorsProps) {
  const meteorCount = Math.max(0, Math.min(number, MAX_VISIBLE_METEORS))
  const meteors = useMemo(() => METEOR_LAYOUT.slice(0, meteorCount), [meteorCount])

  return (
    <div
      aria-hidden="true"
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
    >
      {meteors.map((meteor, index) => (
        <motion.span
          key={index}
          className="absolute h-px w-10 origin-right rounded-full motion-reduce:hidden"
          style={{
            left: meteor.left,
            top: meteor.top,
            rotate: `${meteor.rotate}deg`,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.12) 28%, rgba(99, 102, 241, 0.72) 78%, rgba(224, 231, 255, 0.96) 100%)',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.28)',
          }}
          animate={{
            x: [0, meteor.distance * 0.46, meteor.distance],
            y: [0, -meteor.distance * 0.13, -meteor.distance * 0.28],
            opacity: [0, 0.68, 0],
            scaleX: [0.48, 1, 0.7],
          }}
          transition={{
            duration: meteor.duration,
            repeat: Infinity,
            delay: meteor.delay,
            ease: 'easeInOut',
            times: [0, 0.42, 1],
          }}
        >
          <span
            className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
            style={{
              background: 'rgba(238, 242, 255, 0.98)',
              boxShadow:
                '0 0 8px rgba(125, 211, 252, 0.9), 0 0 16px rgba(129, 140, 248, 0.62)',
            }}
          />
        </motion.span>
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
      <div className="absolute inset-0 rounded-full bg-white/5" />

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
