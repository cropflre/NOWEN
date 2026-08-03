import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface MeteorsProps {
  number?: number
  className?: string
}

const MAX_VISIBLE_METEORS = 6
const METEOR_LAYOUT = [
  { left: '12%', top: '14%', delay: -3.8, duration: 7.2, distance: 220 },
  { left: '37%', top: '8%', delay: -6.4, duration: 8.4, distance: 260 },
  { left: '63%', top: '18%', delay: -2.1, duration: 7.8, distance: 235 },
  { left: '84%', top: '11%', delay: -5.2, duration: 8.8, distance: 280 },
  { left: '25%', top: '31%', delay: -7.1, duration: 9.2, distance: 245 },
  { left: '72%', top: '34%', delay: -4.6, duration: 8.1, distance: 230 },
]

type MeteorStyle = React.CSSProperties & Record<`--${string}`, string | number>

const METEOR_STYLES = `
  @keyframes nowen-meteor-flight {
    0% {
      transform: translate3d(0, 0, 0) rotate(36deg);
      opacity: 0;
    }
    10% { opacity: 0.96; }
    78% { opacity: 0.9; }
    90% {
      transform: translate3d(var(--meteor-x), var(--meteor-y), 0) rotate(36deg);
      opacity: 0;
    }
    100% {
      transform: translate3d(var(--meteor-x), var(--meteor-y), 0) rotate(36deg);
      opacity: 0;
    }
  }

  .nowen-meteor-streak {
    animation-name: nowen-meteor-flight;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    transform: translate3d(0, 0, 0) rotate(36deg);
    backface-visibility: hidden;
    will-change: transform, opacity;
  }
`

export function Meteors({ number = MAX_VISIBLE_METEORS, className }: MeteorsProps) {
  const meteorCount = Math.max(0, Math.min(number, MAX_VISIBLE_METEORS))
  const meteors = useMemo(() => METEOR_LAYOUT.slice(0, meteorCount), [meteorCount])
  const [isDocumentVisible, setIsDocumentVisible] = useState(() =>
    typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState !== 'hidden')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return (
    <div
      aria-hidden="true"
      data-testid="meteor-layer"
      data-meteor-count={meteorCount}
      data-animation-profile="compositor"
      data-paused={isDocumentVisible ? 'false' : 'true'}
      className={cn('fixed inset-0 z-[3] overflow-hidden pointer-events-none', className)}
      style={{ contain: 'layout paint style' }}
    >
      <style>{METEOR_STYLES}</style>
      {meteors.map((meteor, index) => {
        const style: MeteorStyle = {
          left: meteor.left,
          top: meteor.top,
          background: 'rgba(255,255,255,0.98)',
          boxShadow: '0 0 7px rgba(255,255,255,0.92), 0 0 15px rgba(99,102,241,0.68)',
          animationDelay: `${meteor.delay}s`,
          animationDuration: `${meteor.duration + 1.2}s`,
          animationPlayState: isDocumentVisible ? 'running' : 'paused',
          '--meteor-x': `${meteor.distance}px`,
          '--meteor-y': `${meteor.distance * 0.72}px`,
        }

        return (
          <span
            key={index}
            data-testid="meteor-streak"
            className="nowen-meteor-streak absolute block h-[2px] w-[2px] rounded-full"
            style={style}
          >
            <span
              className="absolute right-0 top-1/2 h-[2px] w-[150px] -translate-y-1/2 rounded-full"
              style={{
                transformOrigin: 'right center',
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.18) 32%, rgba(125,211,252,0.58) 72%, rgba(255,255,255,0.92) 100%)',
                boxShadow: '0 0 10px rgba(99,102,241,0.24)',
              }}
            />
          </span>
        )
      })}
    </div>
  )
}

interface SparklesProps {
  children: React.ReactNode
  className?: string
  sparkleCount?: number
}

export function Sparkles({ children, className, sparkleCount = 10 }: SparklesProps) {
  const sparkles = useMemo(
    () => Array.from({ length: sparkleCount }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
      duration: Math.random() * 1 + 1,
      size: Math.random() * 4 + 2,
    })),
    [sparkleCount],
  )

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
