import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useDragControls, PanInfo } from 'framer-motion'
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

// 存储位置的 key
const DESKTOP_DOCK_POSITION_KEY = 'desktop-dock-position'

export function FloatingDock({ items, leftItems, className }: FloatingDockProps) {
  const mouseX = useMotionValue(Infinity)
  const [isDark, setIsDark] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragControls = useDragControls()
  const containerRef = useRef<HTMLDivElement>(null)

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

  // 从 localStorage 恢复位置
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DESKTOP_DOCK_POSITION_KEY)
      if (saved) {
        const { x, y } = JSON.parse(saved)
        setPosition({ x, y })
      }
    } catch (e) {
      // 忽略解析错误
    }
  }, [])

  // 保存位置到 localStorage
  const savePosition = (x: number, y: number) => {
    try {
      localStorage.setItem(DESKTOP_DOCK_POSITION_KEY, JSON.stringify({ x, y }))
    } catch (e) {
      // 忽略存储错误
    }
  }

  // 拖拽结束处理
  const handleDragEnd = (_: any, info: PanInfo) => {
    // 短暂延迟后重置拖拽状态
    setTimeout(() => setIsDragging(false), 100)
    
    // 计算新位置并保存
    const newX = position.x + info.offset.x
    const newY = position.y + info.offset.y
    setPosition({ x: newX, y: newY })
    savePosition(newX, newY)
  }

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'fixed bottom-6 left-1/2 z-50 touch-none',
        'flex items-end gap-2 px-4 py-3 rounded-2xl',
        isDragging && 'cursor-grabbing',
        !isDragging && 'cursor-grab',
        className
      )}
      style={{
        background: isDark ? 'var(--color-glass)' : 'var(--color-glass)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: isDragging 
          ? `2px solid ${isDark ? 'rgba(34, 211, 238, 0.5)' : 'rgba(59, 130, 246, 0.5)'}` 
          : '1px solid var(--color-glass-border)',
        boxShadow: isDragging
          ? (isDark ? '0 0 20px rgba(34, 211, 238, 0.3)' : '0 0 20px rgba(59, 130, 246, 0.3)')
          : (isDark ? 'none' : 'var(--color-shadow)'),
        transition: 'border 0.2s, box-shadow 0.2s',
      }}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{
        top: -window.innerHeight + 100,
        bottom: 0,
        left: -window.innerWidth / 2 + 100,
        right: window.innerWidth / 2 - 100,
      }}
      onDragStart={() => {
        setIsDragging(true)
        mouseX.set(Infinity) // 拖拽时禁用放大效果
      }}
      onDragEnd={handleDragEnd}
      onMouseMove={(e) => {
        if (!isDragging) mouseX.set(e.pageX)
      }}
      onMouseLeave={() => mouseX.set(Infinity)}
      initial={{ y: 100, opacity: 0, x: '-50%' }}
      animate={{ 
        y: position.y, 
        opacity: 1, 
        x: `calc(-50% + ${position.x}px)` 
      }}
      transition={{ 
        delay: position.x === 0 && position.y === 0 ? 0.5 : 0, 
        type: 'spring', 
        stiffness: 200, 
        damping: 20 
      }}
      whileDrag={{ scale: 1.02 }}
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
