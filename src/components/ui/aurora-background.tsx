import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { BackgroundBeamsWithCollision } from './background-beams-with-collision'

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth < 768

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface AuroraBackgroundProps {
  children?: React.ReactNode
  className?: string
  showRadialGradient?: boolean
  showBeams?: boolean
  /** 壁纸启用时使用透明模式，所有 Aurora 装饰层都必须停止渲染。 */
  transparent?: boolean
}

interface AmbientOrbProps {
  className: string
  background: string
  opacity: number
  animate?: {
    x: number[]
    y: number[]
    scale: number[]
    opacity?: number[]
  }
  duration: number
}

function AmbientOrb({ className, background, opacity, animate, duration }: AmbientOrbProps) {
  return (
    <motion.div
      className={cn('absolute rounded-full will-change-transform', className)}
      style={{
        background,
        filter: 'blur(96px)',
        opacity,
      }}
      animate={animate}
      transition={animate ? { duration, repeat: Infinity, ease: 'easeInOut' } : undefined}
    />
  )
}

export function AuroraBackground({
  children,
  className,
  showRadialGradient = true,
  showBeams = false,
  transparent = false,
}: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number>(0)
  const [isDark, setIsDark] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion)
  const mobile = useMemo(() => isMobileViewport(), [])

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotionPreference = () => setReduceMotion(media.matches)
    syncMotionPreference()
    media.addEventListener?.('change', syncMotionPreference)

    return () => media.removeEventListener?.('change', syncMotionPreference)
  }, [])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const container = containerRef.current
    if (!container) return

    cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(() => {
      const { width, height, left, top } = container.getBoundingClientRect()
      if (width <= 0 || height <= 0) return

      container.style.setProperty('--mouse-x', `${((event.clientX - left) / width) * 100}%`)
      container.style.setProperty('--mouse-y', `${((event.clientY - top) / height) * 100}%`)
    })
  }, [])

  useEffect(() => {
    if (transparent || mobile || reduceMotion) return

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafIdRef.current)
    }
  }, [handleMouseMove, mobile, reduceMotion, transparent])

  const renderDecorations = !transparent
  const animateOrb = !reduceMotion
  const mobileMotionScale = mobile ? 0.42 : 1

  return (
    <div
      ref={containerRef}
      data-testid="aurora-background"
      data-transparent={transparent ? 'true' : 'false'}
      data-reduced-motion={reduceMotion ? 'true' : 'false'}
      className={cn('relative min-h-screen w-full overflow-hidden', className)}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '45%',
        background: transparent ? 'transparent' : 'var(--color-bg-primary)',
        transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      } as React.CSSProperties}
    >
      {renderDecorations && (
        <div data-testid="aurora-decorations" aria-hidden="true">
          <AnimatePresence mode="wait">
            <motion.div
              key={isDark ? 'ambient-dark' : 'ambient-light'}
              className="fixed inset-0 overflow-hidden pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65 }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: isDark
                    ? 'linear-gradient(180deg, #090a0f 0%, #0b0d14 52%, #090a10 100%)'
                    : 'linear-gradient(180deg, #fafbff 0%, #f7f8fc 48%, #fafbff 100%)',
                }}
              />

              <AmbientOrb
                className={isDark
                  ? 'left-[-10%] top-[-16%] h-[620px] w-[760px]'
                  : 'left-[-8%] top-[-18%] h-[680px] w-[820px]'}
                background={isDark
                  ? 'radial-gradient(circle, rgba(124, 111, 255, 0.44) 0%, rgba(91, 77, 218, 0.14) 48%, transparent 72%)'
                  : 'radial-gradient(circle, rgba(183, 166, 255, 0.66) 0%, rgba(200, 187, 255, 0.2) 48%, transparent 72%)'}
                opacity={isDark ? 0.58 : 0.5}
                animate={animateOrb ? {
                  x: [0, 66 * mobileMotionScale, 0],
                  y: [0, 30 * mobileMotionScale, 0],
                  scale: [1, 1.055, 1],
                  opacity: [0.84, 1, 0.84],
                } : undefined}
                duration={26}
              />

              <AmbientOrb
                className={isDark
                  ? 'right-[-12%] top-[10%] h-[680px] w-[760px]'
                  : 'right-[-10%] top-[6%] h-[720px] w-[800px]'}
                background={isDark
                  ? 'radial-gradient(circle, rgba(54, 194, 216, 0.36) 0%, rgba(54, 194, 216, 0.11) 48%, transparent 72%)'
                  : 'radial-gradient(circle, rgba(154, 229, 235, 0.64) 0%, rgba(189, 235, 237, 0.2) 48%, transparent 72%)'}
                opacity={isDark ? 0.5 : 0.45}
                animate={animateOrb ? {
                  x: [0, -58 * mobileMotionScale, 0],
                  y: [0, 44 * mobileMotionScale, 0],
                  scale: [1, 1.065, 1],
                  opacity: [0.82, 1, 0.82],
                } : undefined}
                duration={30}
              />

              <AmbientOrb
                className={isDark
                  ? 'bottom-[-24%] left-[22%] h-[620px] w-[760px]'
                  : 'bottom-[-28%] left-[18%] h-[680px] w-[820px]'}
                background={isDark
                  ? 'radial-gradient(circle, rgba(76, 120, 255, 0.34) 0%, rgba(76, 120, 255, 0.1) 50%, transparent 74%)'
                  : 'radial-gradient(circle, rgba(154, 190, 255, 0.66) 0%, rgba(191, 214, 255, 0.2) 50%, transparent 74%)'}
                opacity={isDark ? 0.46 : 0.43}
                animate={animateOrb ? {
                  x: [0, 52 * mobileMotionScale, 0],
                  y: [0, -38 * mobileMotionScale, 0],
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8],
                } : undefined}
                duration={28}
              />

              {!mobile && !reduceMotion && (
                <motion.div
                  className="absolute -inset-[8%]"
                  style={{
                    background: isDark
                      ? 'radial-gradient(ellipse 42% 34% at var(--mouse-x) var(--mouse-y), rgba(111, 94, 255, 0.22) 0%, rgba(75, 185, 220, 0.08) 48%, transparent 72%)'
                      : 'radial-gradient(ellipse 42% 34% at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.18) 0%, rgba(34, 211, 238, 0.08) 48%, transparent 72%)',
                    mixBlendMode: isDark ? 'screen' : 'multiply',
                  }}
                  animate={{ opacity: [0.72, 1, 0.72], scale: [1, 1.02, 1] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <div
                className="absolute inset-0"
                style={{
                  opacity: isDark ? 0.04 : 0.028,
                  backgroundImage:
                    'radial-gradient(circle at 20% 30%, currentColor 0.45px, transparent 0.55px), radial-gradient(circle at 70% 60%, currentColor 0.35px, transparent 0.5px)',
                  backgroundSize: '11px 11px, 13px 13px',
                  color: isDark ? '#ffffff' : '#4f5d7a',
                  mixBlendMode: isDark ? 'screen' : 'multiply',
                }}
              />
            </motion.div>
          </AnimatePresence>

          {showRadialGradient && (
            <div
              className="fixed inset-0 pointer-events-none"
              style={{
                background: isDark
                  ? 'radial-gradient(ellipse 94% 90% at 50% 40%, transparent 18%, rgba(5, 6, 10, 0.44) 100%)'
                  : 'radial-gradient(ellipse 116% 108% at 50% 32%, transparent 38%, rgba(247, 248, 252, 0.42) 100%)',
                transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          )}

          {showBeams && !reduceMotion && (
            <div
              data-testid="aurora-beam-layer"
              className="fixed inset-0 pointer-events-none transition-opacity duration-700"
              style={{ opacity: isDark ? 0.58 : 0.44 }}
            >
              <BackgroundBeamsWithCollision
                containerClassName="absolute inset-0"
                className="h-full w-full"
                isDark={isDark}
                isMobile={mobile}
                reducedMotion={reduceMotion}
              />
            </div>
          )}
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  )
}
