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
      const { clientX, clientY } = event
      const { width, height, left, top } = container.getBoundingClientRect()
      if (width <= 0 || height <= 0) return

      container.style.setProperty('--mouse-x', `${((clientX - left) / width) * 100}%`)
      container.style.setProperty('--mouse-y', `${((clientY - top) / height) * 100}%`)
    })
  }, [])

  useEffect(() => {
    // 透明模式用于展示用户壁纸，不需要继续计算鼠标跟随动画。
    if (transparent) return

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafIdRef.current)
    }
  }, [handleMouseMove, transparent])

  const renderDecorations = !transparent

  return (
    <div
      ref={containerRef}
      data-testid="aurora-background"
      data-transparent={transparent ? 'true' : 'false'}
      className={cn('relative min-h-screen w-full overflow-hidden', className)}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
        background: transparent ? 'transparent' : 'var(--color-bg-primary)',
        transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      } as React.CSSProperties}
    >
      {renderDecorations && (
        <div data-testid="aurora-decorations" aria-hidden="true">
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div
                key="dark-aurora"
                className="fixed inset-0 overflow-hidden pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: 'var(--color-bg-gradient)' }}
                />

                <motion.div
                  className="absolute -inset-[10px]"
                  style={{
                    background: `
                      radial-gradient(
                        ellipse 80% 50% at var(--mouse-x, 50%) var(--mouse-y, 50%),
                        var(--color-glow) 0%,
                        transparent 50%
                      ),
                      radial-gradient(
                        ellipse 60% 40% at 20% 20%,
                        var(--color-glow-secondary) 0%,
                        transparent 50%
                      ),
                      radial-gradient(
                        ellipse 50% 60% at 80% 80%,
                        var(--color-glow) 0%,
                        transparent 50%
                      )
                    `,
                    opacity: 0.6,
                  }}
                  animate={mobile ? undefined : {
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.7, 0.5],
                  }}
                  transition={mobile ? undefined : {
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {!mobile && (
                  <>
                    <motion.div
                      className="absolute h-[600px] w-[600px] rounded-full will-change-transform"
                      style={{
                        background: 'radial-gradient(circle, var(--color-glow-secondary) 0%, transparent 70%)',
                        left: '10%',
                        top: '20%',
                        filter: 'blur(60px)',
                        opacity: 0.5,
                      }}
                      animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute h-[500px] w-[500px] rounded-full will-change-transform"
                      style={{
                        background: 'radial-gradient(circle, var(--color-glow) 0%, transparent 70%)',
                        right: '10%',
                        bottom: '20%',
                        filter: 'blur(60px)',
                        opacity: 0.6,
                      }}
                      animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
                      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="light-aurora"
                className="fixed inset-0 overflow-hidden pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: 'var(--color-bg-gradient)' }}
                />

                <motion.div
                  className="absolute -inset-[10px]"
                  style={{
                    background: `
                      radial-gradient(
                        ellipse 80% 50% at var(--mouse-x, 50%) var(--mouse-y, 50%),
                        rgba(59, 130, 246, 0.35) 0%,
                        transparent 50%
                      ),
                      radial-gradient(
                        ellipse 60% 40% at 20% 20%,
                        rgba(147, 51, 234, 0.3) 0%,
                        transparent 50%
                      ),
                      radial-gradient(
                        ellipse 50% 60% at 80% 80%,
                        rgba(59, 130, 246, 0.25) 0%,
                        transparent 50%
                      )
                    `,
                  }}
                  animate={mobile ? undefined : {
                    scale: [1, 1.15, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={mobile ? undefined : {
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {!mobile ? (
                  <>
                    <motion.div
                      className="absolute h-[700px] w-[700px] rounded-full will-change-transform"
                      style={{
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
                        left: '5%',
                        top: '15%',
                        filter: 'blur(40px)',
                        opacity: 0.8,
                      }}
                      animate={{ x: [0, 150, 0], y: [0, -80, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute h-[600px] w-[600px] rounded-full will-change-transform"
                      style={{
                        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.35) 0%, transparent 70%)',
                        right: '5%',
                        bottom: '15%',
                        filter: 'blur(40px)',
                        opacity: 0.7,
                      }}
                      animate={{ x: [0, -120, 0], y: [0, 100, 0], scale: [1, 1.15, 1] }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </>
                ) : (
                  <motion.div
                    className="absolute"
                    style={{
                      width: '120%',
                      height: '60%',
                      left: '-10%',
                      top: '20%',
                      background: 'radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.12) 40%, transparent 70%)',
                    }}
                    animate={{ opacity: [0.6, 0.9, 0.6] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                <div
                  className="absolute left-0 right-0 top-0 h-[40vh]"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 100%)',
                    opacity: 0.5,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {showRadialGradient && (
            <div
              className="fixed inset-0 pointer-events-none"
              style={{
                background: isDark
                  ? 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, var(--color-bg-primary) 70%)'
                  : 'radial-gradient(ellipse 100% 100% at 50% 30%, transparent 0%, var(--color-bg-primary) 80%)',
                transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          )}

          {showBeams && (
            <div className="fixed inset-0 pointer-events-none">
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
