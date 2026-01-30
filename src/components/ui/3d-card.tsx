import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '../../lib/utils'

interface Card3DProps {
  children: React.ReactNode
  className?: string
  containerClassName?: string
  glowColor?: string
}

export function Card3D({
  children,
  className,
  containerClassName,
  glowColor = 'rgba(102, 126, 234, 0.4)',
}: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12deg', '-12deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }

  return (
    <div
      className={cn('relative', containerClassName)}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className={cn(
          'relative rounded-2xl transition-shadow duration-500',
          isHovered && 'shadow-glow-md',
          className
        )}
      >
        {/* Glow Border */}
        <motion.div
          className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${glowColor}, transparent 40%, transparent 60%, ${glowColor})`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
        />

        {/* Border Beam Effect */}
        {isHovered && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <motion.div
              className="absolute w-20 h-20 rounded-full"
              style={{
                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                filter: 'blur(10px)',
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>
        )}

        {/* Card Content */}
        <div
          className="relative z-10 rounded-2xl bg-[#0d0d14]/90 backdrop-blur-xl border border-white/10"
          style={{ transform: 'translateZ(0)' }}
        >
          {children}
        </div>

        {/* Inner Highlight */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
            transform: 'translateZ(20px)',
          }}
        />
      </motion.div>
    </div>
  )
}

// Card子组件 - 带视差效果
interface CardItemProps {
  children: React.ReactNode
  className?: string
  translateZ?: number
}

export function CardItem({ children, className, translateZ = 20 }: CardItemProps) {
  return (
    <div
      className={className}
      style={{
        transform: `translateZ(${translateZ}px)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  )
}
