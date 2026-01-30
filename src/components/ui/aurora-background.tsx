import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

interface AuroraBackgroundProps {
  children?: React.ReactNode
  className?: string
  showRadialGradient?: boolean
}

export function AuroraBackground({
  children,
  className,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDark, setIsDark] = useState(true)

  // 监听主题变化
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    // 初始状态
    setIsDark(document.documentElement.classList.contains('dark'))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { width, height, left, top } = container.getBoundingClientRect()
      const x = ((clientX - left) / width) * 100
      const y = ((clientY - top) / height) * 100
      container.style.setProperty('--mouse-x', `${x}%`)
      container.style.setProperty('--mouse-y', `${y}%`)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative min-h-screen w-full overflow-hidden',
        className
      )}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
        background: 'var(--color-bg-primary)',
        transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      } as React.CSSProperties}
    >
      {/* ============================================
          夜间模式 - Deep Space
          深邃层次 + 流动极光
          ============================================ */}
      <AnimatePresence>
        {isDark && (
          <motion.div 
            className="absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background Beams - 20% 透明度 */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'var(--color-bg-gradient)',
              }}
            />

            {/* Primary Aurora - 跟随鼠标 */}
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
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Floating Orb 1 - Cyan/Primary */}
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{
                background: 'radial-gradient(circle, var(--color-glow-secondary) 0%, transparent 70%)',
                left: '10%',
                top: '20%',
                filter: 'blur(60px)',
                opacity: 0.5,
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Floating Orb 2 - Primary */}
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full"
              style={{
                background: 'radial-gradient(circle, var(--color-glow) 0%, transparent 70%)',
                right: '10%',
                bottom: '20%',
                filter: 'blur(60px)',
                opacity: 0.6,
              }}
              animate={{
                x: [0, -80, 0],
                y: [0, 60, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Center Pulse */}
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full"
              style={{
                background: 'radial-gradient(circle, var(--color-glow) 0%, transparent 70%)',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                filter: 'blur(80px)',
                opacity: 0.5,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================
          日间模式 - Solar Clarity
          高品质纸张质感 + 柔和渐变
          ============================================ */}
      <AnimatePresence>
        {!isDark && (
          <motion.div 
            className="absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 淡蓝色径向渐变 - 左上角 */}
            <div
              className="absolute inset-0"
              style={{
                background: 'var(--color-bg-gradient)',
              }}
            />

            {/* 柔和的漂浮云朵 - 极低透明度 */}
            <motion.div
              className="absolute w-[800px] h-[800px] rounded-full"
              style={{
                background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 60%)',
                left: '-10%',
                top: '-20%',
                filter: 'blur(120px)',
                opacity: 0.08,
              }}
              animate={{
                x: [0, 50, 0],
                y: [0, 30, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{
                background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 60%)',
                right: '-5%',
                bottom: '10%',
                filter: 'blur(120px)',
                opacity: 0.06,
              }}
              animate={{
                x: [0, -40, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* 柔和的顶部渐变 */}
            <div
              className="absolute top-0 left-0 right-0 h-[40vh]"
              style={{
                background: 'linear-gradient(to bottom, var(--color-bg-tertiary) 0%, transparent 100%)',
                opacity: 0.3,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radial Gradient Overlay - 聚焦中心内容 */}
      {showRadialGradient && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark 
              ? 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, var(--color-bg-primary) 70%)'
              : 'radial-gradient(ellipse 100% 100% at 50% 30%, transparent 0%, var(--color-bg-primary) 80%)',
            transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}

      {/* 噪点纹理 - 若隐若现（0.03 深色 / 0.015 浅色） */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: isDark ? 0.03 : 0.015,
          transition: 'opacity 0.5s',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
