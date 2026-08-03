import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { BackgroundBeamsWithCollision } from './background-beams-with-collision'

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth < 768

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
        filter: 'blur(72px)',
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
    if (transparent || mobile) return

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafIdRef.current)
    }
  }, [handleMouseMove, mobile, transparent])

  const renderDecorations = !transparent
  const mobileMotionScale = mobile ? 0.58 : 1

  return (
    <div
      ref={containerRef}
      data-testid="aurora-background"
      data-transparent={transparent ? 'true' : 'false'}
      data-animation-profile="restored"
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
              className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: isDark
                    ? 'linear-gradient(180deg, #090a0f 0%, #0b0d14 52%, #090a10 100%)'
                    : 'linear-gradient(180deg, #fafbff 0%, #f6f8ff 48%, #fafbff 100%)',
                }}
              />

              <AmbientOrb
                className={isDark
                  ? 'left-[-10%] top-[-18%] h-[720px] w-[900px]'
                  : 'left-[-9%] top-[-20%] h-[760px] w-[940px]'}
                background={isDark
                  ? 'radial-gradient(circle, rgba(124, 111, 255, 0.58) 0%, rgba(91, 77, 218, 0.2) 46%, transparent 72%)'
                  : 'radial-gradient(circle, rgba(173, 154, 255, 0.72) 0%, rgba(200, 187, 255, 0.28) 46%, transparent 72%)'}
                opacity={isDark ? 0.68 : 0.58}
                animate={{
                  x: [0, 96 * mobileMotionScale, 28 * mobileMotionScale, 0],
                  y: [0, 42 * mobileMotionScale, -18 * mobileMotionScale, 0],
                  scale: [1, 1.1, 1.04, 1],
                  opacity: [0.82, 1, 0.9, 0.82],
                }}
                duration={18}
              />

              <AmbientOrb
                className={isDark
                  ? 'right-[-14%] top-[4%] h-[760px] w-[860px]'
                  : 'right-[-12%] top-[2%] h-[800px] w-[900px]'}
                background={isDark
                  ? 'radial-gradient(circle, rgba(54, 194, 216, 0.52) 0%, rgba(54, 194, 216, 0.16) 48%, transparent 72%)'
                  : 'radial-gradient(circle, rgba(128, 223, 235, 0.7) 0%, rgba(189, 235, 237, 0.26) 48%, transparent 72%)'}
                opacity={isDark ? 0.6 : 0.54}
                animate={{
                  x: [0, -92 * mobileMotionScale, -24 * mobileMotionScale, 0],
                  y: [0, 70 * mobileMotionScale, 20 * mobileMotionScale, 0],
                  scale: [1, 1.12, 1.05, 1],
                  opacity: [0.8, 1, 0.88, 0.8],
                }}
                duration={21}
              />

              <AmbientOrb
                className={isDark
                  ? 'bottom-[-28%] left-[18%] h-[760px] w-[920px]'
                  : 'bottom-[-30%] left-[14%] h-[820px] w-[980px]'}
                background={isDark
                  ? 'radial-gradient(circle, rgba(76, 120, 255, 0.48) 0%, rgba(76, 120, 255, 0.15) 50%, transparent 74%)'
                  : 'radial-gradient(circle, rgba(135, 180, 255, 0.7) 0%, rgba(191, 214, 255, 0.26) 50%, transparent 74%)'}
                opacity={isDark ? 0.56 : 0.5}
                animate={{
                  x: [0, 82 * mobileMotionScale, 20 * mobileMotionScale, 0],
                  y: [0, -62 * mobileMotionScale, -20 * mobileMotionScale, 0],
                  scale: [1, 1.1, 1.04, 1],
                  opacity: [0.78, 1, 0.9, 0.78],
                }}
                duration={20}
              />

              {!mobile && (
                <motion.div
                  className="absolute -inset-[10%]"
                  style={{
                    background: isDark
                      ? 'radial-gradient(ellipse 46% 38% at var(--mouse-x) var(--mouse-y), rgba(111, 94, 255, 0.34) 0%, rgba(75, 185, 220, 0.14) 46%, transparent 72%)'
                      : 'radial-gradient(ellipse 46% 38% at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.26) 0%, rgba(34, 211, 238, 0.12) 46%, transparent 72%)',
                    mixBlendMode: isDark ? 'screen' : 'multiply',
                  }}
                  animate={{ opacity: [0.74, 1, 0.74], scale: [1, 1.035, 1] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <div
                className="absolute inset-0"
                style={{
                  opacity: isDark ? 0.045 : 0.03,
                  backgroundImage:
                    'radial-gradient(circle at 20% 30%, currentColor 0.5px, transparent 0.6px), radial-gradient(circle at 70% 60%, currentColor 0.4px, transparent 0.55px)',
                  backgroundSize: '11px 11px, 13px 13px',
                  color: isDark ? '#ffffff' : '#4f5d7a',
                  mixBlendMode: isDark ? 'screen' : 'multiply',
                }}
              />
            </motion.div>
          </AnimatePresence>

          {showRadialGradient && (
            <div
              className="fixed inset-0 z-[1] pointer-events-none"
              style={{
                background: isDark
                  ? 'radial-gradient(ellipse 96% 92% at 50% 40%, transparent 12%, rgba(5, 6, 10, 0.34) 100%)'
                  : 'radial-gradient(ellipse 118% 110% at 50% 32%, transparent 34%, rgba(247, 248, 252, 0.28) 100%)',
                transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          )}

          {showBeams && (
            <div
              data-testid="aurora-beam-layer"
              className="fixed inset-0 z-[2] pointer-events-none"
              style={{ opacity: isDark ? 0.96 : 0.86 }}
            >
              <BackgroundBeamsWithCollision
                containerClassName="absolute inset-0"
                className="h-full w-full"
                isDark={isDark}
                isMobile={mobile}
              />
            </div>
          )}
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  )
}
