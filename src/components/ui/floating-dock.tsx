import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '../../lib/utils'

interface DockItemType {
  id: string
  title: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
}

interface FloatingDockProps {
  items: DockItemType[]
  leftItems?: DockItemType[]
  className?: string
}

export function FloatingDock({ items, leftItems, className }: FloatingDockProps) {
  const mouseX = useMotionValue(Infinity)
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

    setIsDark(document.documentElement.classList.contains('dark'))

    return () => observer.disconnect()
  }, [])

  return (
    <motion.div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-end gap-2 px-4 py-3 rounded-2xl',
        className
      )}
      style={{
        background: isDark ? 'var(--color-glass)' : 'var(--color-glass)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid var(--color-glass-border)',
        boxShadow: isDark 
          ? 'none' 
          : 'var(--color-shadow)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
    >
      {/* Left Items */}
      {leftItems && leftItems.length > 0 && (
        <>
          {leftItems.map((item) => (
            <DockItem key={item.id} mouseX={mouseX} isDark={isDark} {...item} />
          ))}
          <div 
            className="w-px h-8 mx-1" 
            style={{ background: 'var(--color-glass-border)' }}
          />
        </>
      )}
      {/* Main Items */}
      {items.map((item) => (
        <DockItem key={item.id} mouseX={mouseX} isDark={isDark} {...item} />
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
  isDark: boolean
}

function DockItem({ title, icon, href, onClick, mouseX, isDark }: DockItemProps) {
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
            className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)',
              boxShadow: isDark ? 'none' : 'var(--color-shadow)',
            }}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </span>
            <div 
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
              style={{
                background: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-glass-border)',
                borderBottom: '1px solid var(--color-glass-border)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon Button - 主题自适应样式 */}
      <motion.button
        onClick={handleClick}
        className="w-full h-full rounded-xl flex items-center justify-center cursor-pointer overflow-hidden"
        style={{
          background: isHovered 
            ? 'var(--color-glass-hover)' 
            : 'var(--color-glass)',
          border: `1px solid ${isHovered ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
          color: isHovered ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
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

      {/* 夜间模式：发光效果 */}
      {isDark && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: `0 0 25px var(--color-glow)`,
          }}
          animate={{ opacity: isHovered ? 0.8 : 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* 日间模式：悬浮阴影 */}
      {!isDark && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{ 
            boxShadow: isHovered 
              ? 'var(--color-shadow-hover)' 
              : 'none',
            y: isHovered ? -2 : 0,
          }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* 夜间模式：边框流光效果 */}
      {isDark && isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)`,
            padding: '1px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  )
}
