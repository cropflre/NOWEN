import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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
        'relative min-h-screen w-full overflow-hidden bg-[#0a0a0f]',
        className
      )}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
      } as React.CSSProperties}
    >
      {/* Aurora Layers */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary Aurora */}
        <motion.div
          className="absolute -inset-[10px] opacity-50"
          style={{
            background: `
              radial-gradient(
                ellipse 80% 50% at var(--mouse-x, 50%) var(--mouse-y, 50%),
                rgba(102, 126, 234, 0.3) 0%,
                transparent 50%
              ),
              radial-gradient(
                ellipse 60% 40% at 20% 20%,
                rgba(118, 75, 162, 0.4) 0%,
                transparent 50%
              ),
              radial-gradient(
                ellipse 50% 60% at 80% 80%,
                rgba(240, 147, 251, 0.3) 0%,
                transparent 50%
              )
            `,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.6, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Secondary Floating Orbs */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
            left: '10%',
            top: '20%',
            filter: 'blur(60px)',
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

        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(240, 147, 251, 0.2) 0%, transparent 70%)',
            right: '10%',
            bottom: '20%',
            filter: 'blur(60px)',
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

        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.25) 0%, transparent 70%)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(80px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Radial Gradient Overlay */}
      {showRadialGradient && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, #0a0a0f 70%)',
          }}
        />
      )}

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
