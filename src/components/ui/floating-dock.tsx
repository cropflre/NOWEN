import { useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '../../lib/utils'

interface FloatingDockProps {
  items: {
    id: string
    title: string
    icon: React.ReactNode
    href?: string
    onClick?: () => void
  }[]
  className?: string
}

export function FloatingDock({ items, className }: FloatingDockProps) {
  const mouseX = useMotionValue(Infinity)

  return (
    <motion.div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-end gap-2 px-4 py-3 rounded-2xl',
        'bg-[#0d0d14]/80 backdrop-blur-2xl border border-white/10',
        'shadow-2xl shadow-black/50',
        className
      )}
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
    >
      {items.map((item) => (
        <DockItem key={item.id} mouseX={mouseX} {...item} />
      ))}
    </motion.div>
  )
}

interface DockItemProps {
  id: string
  title: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  mouseX: ReturnType<typeof useMotionValue<number>>
}

function DockItem({ title, icon, href, onClick, mouseX }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthSync = useTransform(distance, [-150, 0, 150], [48, 72, 48])
  const heightSync = useTransform(distance, [-150, 0, 150], [48, 72, 48])

  const width = useSpring(widthSync, { mass: 0.1, stiffness: 200, damping: 15 })
  const height = useSpring(heightSync, { mass: 0.1, stiffness: 200, damping: 15 })

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      window.open(href, '_blank')
    }
  }

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[#1a1a24] border border-white/10 whitespace-nowrap"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <span className="text-sm text-white font-medium">{title}</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a24] border-r border-b border-white/10 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon Button */}
      <motion.button
        onClick={handleClick}
        className={cn(
          'w-full h-full rounded-xl flex items-center justify-center',
          'bg-white/5 hover:bg-white/10 border border-white/10',
          'transition-colors duration-200 cursor-pointer',
          'text-white/70 hover:text-white'
        )}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          style={{
            scale: useTransform(width, [48, 72], [1, 1.2]),
          }}
        >
          {icon}
        </motion.div>
      </motion.button>

      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: '0 0 20px rgba(102, 126, 234, 0.3)',
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
}
