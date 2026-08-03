import { useEffect, useMemo, useState } from 'react'
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
  }
  duration: number
}

function AmbientOrb({ className, background, opacity, animate, duration }: AmbientOrbProps) {
  return (
    <motion.div
      className={cn('absolute rounded-full will-change-transform', className)}
      style={{
        background,
        filter: 'blur(110px)',
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

  const renderDecorations = !transparent

  return (
    <div
      data-testid="aurora-background"
      data-transparent={transparent ? 'true' : 'false'}
      className={cn('relative min-h-screen w-full overflow-hidden', className)}
      style={{
        background: transparent ? 'transparent' : 'var(--color-bg-primary)',
        transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
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
                  ? 'radial-gradient(circle, rgba(124, 111, 255, 0.3) 0%, rgba(91, 77, 218, 0.1) 48%, transparent 72%)'
                  : 'radial-gradient(circle, rgba(200, 187, 255, 0.52) 0%, rgba(200, 187, 255, 0.16) 48%, transparent 72%)'}
                opacity={isDark ? 0.48 : 0.42}
                animate={mobile ? undefined : { x: [0, 54, 0], y: [0, 22, 0], scale: [1, 1.035, 1] }}
                duration={32}
              />

              <AmbientOrb
                className={isDark
                  ? 'right-[-12%] top-[10%] h-[680px] w-[760px]'
                  : 'right-[-10%] top-[6%] h-[720px] w-[800px]'}
                background={isDark
                  ? 'radial-gradient(circle, rgba(54, 194, 216, 0.22) 0%, rgba(54, 194, 216, 0.08) 48%, transparent 72%)'
                  : 'radial-gradient(circle, rgba(189, 235, 237, 0.54) 0%, rgba(189, 235, 237, 0.16) 48%, transparent 72%)'}
                opacity={isDark ? 0.42 : 0.38}
                animate={mobile ? undefined : { x: [0, -48, 0], y: [0, 36, 0], scale: [1, 1.045, 1] }}
                duration={36}
              />

              <AmbientOrb
                className={isDark
                  ? 'bottom-[-24%] left-[22%] h-[620px] w-[760px]'
                  : 'bottom-[-28%] left-[18%] h-[680px] w-[820px]'}
                background={isDark
                  ? 'radial-gradient(circle, rgba(76, 120, 255, 0.2) 0%, rgba(76, 120, 255, 0.06) 50%, transparent 74%)'
                  : 'radial-gradient(circle, rgba(191, 214, 255, 0.56) 0%, rgba(191, 214, 255, 0.15) 50%, transparent 74%)'}
                opacity={isDark ? 0.38 : 0.36}
                animate={mobile ? undefined : { x: [0, 42, 0], y: [0, -28, 0], scale: [1, 1.03, 1] }}
                duration={34}
              />

              {/* Extremely subtle paper grain prevents the light theme from feeling empty. */}
              <div
                className="absolute inset-0"
                style={{
                  opacity: isDark ? 0.035 : 0.026,
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
                  ? 'radial-gradient(ellipse 90% 88% at 50% 42%, transparent 22%, rgba(5, 6, 10, 0.52) 100%)'
                  : 'radial-gradient(ellipse 112% 105% at 50% 34%, transparent 42%, rgba(247, 248, 252, 0.5) 100%)',
                transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          )}

          {/* Preserve the optional effect for dark mode, but keep it invisible in the light ambient theme. */}
          {showBeams && (
            <div
              className="fixed inset-0 pointer-events-none transition-opacity duration-700"
              style={{ opacity: isDark ? 0.24 : 0 }}
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
