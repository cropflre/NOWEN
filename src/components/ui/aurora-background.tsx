import { useCallback, useEffect, useRef, useState } from 'react'
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
  animationName: string
  duration: number
  delay?: number
  paused: boolean
}

const AURORA_STYLES = `
  @keyframes nowen-orb-a {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.82; }
    34% { transform: translate3d(92px, 38px, 0) scale(1.09); opacity: 1; }
    68% { transform: translate3d(28px, -16px, 0) scale(1.04); opacity: 0.9; }
  }

  @keyframes nowen-orb-b {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.8; }
    36% { transform: translate3d(-88px, 66px, 0) scale(1.1); opacity: 1; }
    72% { transform: translate3d(-22px, 18px, 0) scale(1.04); opacity: 0.88; }
  }

  @keyframes nowen-orb-c {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.78; }
    38% { transform: translate3d(78px, -58px, 0) scale(1.09); opacity: 1; }
    74% { transform: translate3d(18px, -18px, 0) scale(1.04); opacity: 0.9; }
  }

  .nowen-ambient-orb {
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
    will-change: transform, opacity;
    contain: layout paint style;
  }

  .nowen-pointer-glow {
    transform: translate3d(calc(var(--mouse-x-px) - 50%), calc(var(--mouse-y-px) - 50%), 0);
    transition: transform 90ms linear;
    backface-visibility: hidden;
    will-change: transform;
    contain: strict;
  }

  @media (max-width: 767px) {
    @keyframes nowen-orb-a {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.84; }
      50% { transform: translate3d(34px, 16px, 0) scale(1.045); opacity: 1; }
    }

    @keyframes nowen-orb-b {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.82; }
      50% { transform: translate3d(-32px, 24px, 0) scale(1.05); opacity: 1; }
    }

    @keyframes nowen-orb-c {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.8; }
      50% { transform: translate3d(28px, -22px, 0) scale(1.045); opacity: 1; }
    }
  }
`

function AmbientOrb({
  className,
  background,
  opacity,
  animationName,
  duration,
  delay = 0,
  paused,
}: AmbientOrbProps) {
  return (
    <div
      className={cn('nowen-ambient-orb absolute rounded-full', className)}
      style={{
        background,
        opacity,
        animationName,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        animationPlayState: paused ? 'paused' : 'running',
      }}
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
  const lastPointerUpdateRef = useRef(0)
  const [isDark, setIsDark] = useState(true)
  const [mobile, setMobile] = useState(isMobileViewport)
  const [isDocumentVisible, setIsDocumentVisible] = useState(() =>
    typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )

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

    const media = window.matchMedia('(max-width: 767px)')
    const syncViewport = () => setMobile(media.matches)
    syncViewport()
    media.addEventListener?.('change', syncViewport)

    return () => media.removeEventListener?.('change', syncViewport)
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState !== 'hidden')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const container = containerRef.current
    if (!container) return

    const now = performance.now()
    // 20fps is enough for a soft glow and avoids repaint pressure from raw pointer frequency.
    if (now - lastPointerUpdateRef.current < 50) return
    lastPointerUpdateRef.current = now

    container.style.setProperty('--mouse-x-px', `${event.clientX}px`)
    container.style.setProperty('--mouse-y-px', `${event.clientY}px`)
  }, [])

  useEffect(() => {
    if (transparent || mobile || !isDocumentVisible) return

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [handlePointerMove, isDocumentVisible, mobile, transparent])

  const renderDecorations = !transparent
  const animationPaused = !isDocumentVisible

  return (
    <div
      ref={containerRef}
      data-testid="aurora-background"
      data-transparent={transparent ? 'true' : 'false'}
      data-animation-profile="compositor"
      data-paused={animationPaused ? 'true' : 'false'}
      className={cn('relative min-h-screen w-full overflow-hidden', className)}
      style={{
        '--mouse-x-px': '50vw',
        '--mouse-y-px': '42vh',
        background: transparent ? 'transparent' : 'var(--color-bg-primary)',
        transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      } as React.CSSProperties}
    >
      <style>{AURORA_STYLES}</style>

      {renderDecorations && (
        <div data-testid="aurora-decorations" aria-hidden="true">
          <div
            className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
            style={{ contain: 'layout paint style' }}
          >
            <div
              className="absolute inset-0 transition-colors duration-500"
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
              animationName="nowen-orb-a"
              duration={18}
              delay={-6}
              paused={animationPaused}
            />

            <AmbientOrb
              className={isDark
                ? 'right-[-14%] top-[4%] h-[760px] w-[860px]'
                : 'right-[-12%] top-[2%] h-[800px] w-[900px]'}
              background={isDark
                ? 'radial-gradient(circle, rgba(54, 194, 216, 0.52) 0%, rgba(54, 194, 216, 0.16) 48%, transparent 72%)'
                : 'radial-gradient(circle, rgba(128, 223, 235, 0.7) 0%, rgba(189, 235, 237, 0.26) 48%, transparent 72%)'}
              opacity={isDark ? 0.6 : 0.54}
              animationName="nowen-orb-b"
              duration={21}
              delay={-11}
              paused={animationPaused}
            />

            <AmbientOrb
              className={isDark
                ? 'bottom-[-28%] left-[18%] h-[760px] w-[920px]'
                : 'bottom-[-30%] left-[14%] h-[820px] w-[980px]'}
              background={isDark
                ? 'radial-gradient(circle, rgba(76, 120, 255, 0.48) 0%, rgba(76, 120, 255, 0.15) 50%, transparent 74%)'
                : 'radial-gradient(circle, rgba(135, 180, 255, 0.7) 0%, rgba(191, 214, 255, 0.26) 50%, transparent 74%)'}
              opacity={isDark ? 0.56 : 0.5}
              animationName="nowen-orb-c"
              duration={20}
              delay={-3}
              paused={animationPaused}
            />

            {!mobile && (
              <div
                className="nowen-pointer-glow absolute left-0 top-0 h-[520px] w-[640px] rounded-full"
                style={{
                  background: isDark
                    ? 'radial-gradient(ellipse, rgba(111, 94, 255, 0.32) 0%, rgba(75, 185, 220, 0.13) 46%, transparent 72%)'
                    : 'radial-gradient(ellipse, rgba(99, 102, 241, 0.24) 0%, rgba(34, 211, 238, 0.11) 46%, transparent 72%)',
                  mixBlendMode: isDark ? 'screen' : 'multiply',
                  opacity: animationPaused ? 0.7 : 1,
                }}
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
          </div>

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
              style={{ opacity: isDark ? 0.96 : 0.86, contain: 'layout paint style' }}
            >
              <BackgroundBeamsWithCollision
                containerClassName="absolute inset-0"
                className="h-full w-full"
                isDark={isDark}
                isMobile={mobile}
                paused={animationPaused}
              />
            </div>
          )}
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  )
}
