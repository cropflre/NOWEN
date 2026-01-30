import { useRef, useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '../../lib/utils'

// Border Beam - 流动的边框光效
interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  borderWidth?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
}

export function BorderBeam({
  className,
  size = 200,
  duration = 12,
  borderWidth = 1.5,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={{
        '--size': size,
        '--duration': duration,
        '--border-width': borderWidth,
        '--color-from': colorFrom,
        '--color-to': colorTo,
        '--delay': `-${delay}s`,
      } as React.CSSProperties}
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]',
        // Mask
        '![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]',
        // Beam
        'after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--size)*1px)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]',
        className
      )}
    />
  )
}

// Magnetic Button - 磁吸效果按钮
interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  strength?: number
  onClick?: () => void
}

export function MagneticButton({
  children,
  className,
  strength = 0.3,
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * strength)
    y.set((e.clientY - centerY) * strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  )
}

// Breathing Dot - 呼吸灯效果
interface BreathingDotProps {
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BreathingDot({
  color = '#22c55e',
  size = 'sm',
  className,
}: BreathingDotProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  return (
    <span className={cn('relative flex', sizeClasses[size], className)}>
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex rounded-full h-full w-full"
        style={{ backgroundColor: color }}
      />
    </span>
  )
}

// Vanish Input - 消散效果输入框
interface VanishInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder?: string
  placeholders?: string[]
  className?: string
}

export function VanishInput({
  value,
  onChange,
  onSubmit,
  placeholder = '搜索...',
  placeholders,
  className,
}: VanishInputProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)
  const [isFocused, setIsFocused] = useState(false)

  // 轮换 placeholder
  useEffect(() => {
    if (!placeholders || placeholders.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentPlaceholder(prev => (prev + 1) % placeholders.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [placeholders])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit()
    }
  }

  const displayPlaceholder = placeholders?.[currentPlaceholder] ?? placeholder

  return (
    <div className={cn('relative group', className)}>
      {/* Border Beam Effect */}
      {isFocused && (
        <BorderBeam
          size={100}
          duration={8}
          colorFrom="rgba(102, 126, 234, 0.8)"
          colorTo="rgba(0, 242, 254, 0.8)"
        />
      )}

      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={displayPlaceholder}
        className={cn(
          'w-full px-5 py-3.5 rounded-xl',
          'bg-white/[0.03] backdrop-blur-xl',
          'border border-white/[0.08]',
          'text-white placeholder:text-white/30',
          'focus:outline-none focus:border-white/20',
          'transition-all duration-300'
        )}
      />

      {/* Animated Placeholder */}
      {!value && !isFocused && placeholders && (
        <div className="absolute inset-0 flex items-center px-5 pointer-events-none overflow-hidden">
          <motion.span
            key={currentPlaceholder}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.3, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-white/30"
          >
            {displayPlaceholder}
          </motion.span>
        </div>
      )}
    </div>
  )
}

// Background Lines - 连接线效果
interface BackgroundLinesProps {
  className?: string
  children?: React.ReactNode
}

export function BackgroundLines({ className, children }: BackgroundLinesProps) {
  return (
    <div className={cn('relative', className)}>
      {/* SVG Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(102, 126, 234, 0)" />
            <stop offset="50%" stopColor="rgba(102, 126, 234, 0.3)" />
            <stop offset="100%" stopColor="rgba(102, 126, 234, 0)" />
          </linearGradient>
        </defs>
        
        {/* Horizontal Lines */}
        {[...Array(5)].map((_, i) => (
          <motion.line
            key={`h-${i}`}
            x1="0"
            y1={`${20 + i * 20}%`}
            x2="100%"
            y2={`${20 + i * 20}%`}
            stroke="url(#line-gradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ delay: i * 0.1, duration: 1.5 }}
          />
        ))}
      </svg>
      
      {children}
    </div>
  )
}
