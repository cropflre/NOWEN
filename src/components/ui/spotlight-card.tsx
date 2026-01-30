import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
  spotlightColor?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(102, 126, 234, 0.15)',
  size = 'md',
  onClick,
  onContextMenu,
}: SpotlightCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleMouseEnter = useCallback(() => {
    setOpacity(1)
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setOpacity(0)
    setIsHovered(false)
  }, [])

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  }

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-white/[0.03] backdrop-blur-xl',
        'border border-white/[0.08]',
        'transition-all duration-300',
        onClick && 'cursor-pointer',
        sizeClasses[size],
        className
      )}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {/* Spotlight Gradient - 跟随鼠标的聚光灯效果 */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />

      {/* Border Spotlight - 边缘发光 */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />

      {/* Animated Border Beam */}
      {isHovered && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div
            className="absolute w-20 h-20 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm animate-border-beam"
            style={{
              offsetPath: `rect(0 100% 100% 0 round ${16}px)`,
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

// 带状态指示器的卡片
interface StatusCardProps extends SpotlightCardProps {
  status?: 'online' | 'offline' | 'loading'
  statusColor?: string
}

export function StatusCard({
  children,
  status,
  statusColor,
  ...props
}: StatusCardProps) {
  const getStatusColor = () => {
    if (statusColor) return statusColor
    switch (status) {
      case 'online': return '#22c55e'
      case 'offline': return '#ef4444'
      case 'loading': return '#eab308'
      default: return undefined
    }
  }

  const color = getStatusColor()

  return (
    <SpotlightCard {...props}>
      {status && color && (
        <div className="absolute top-3 right-3 z-20">
          <span
            className="relative flex h-2.5 w-2.5"
          >
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: color }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ backgroundColor: color }}
            />
          </span>
        </div>
      )}
      {children}
    </SpotlightCard>
  )
}
