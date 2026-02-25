import { useRef, useState, useEffect, useCallback } from 'react'
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

const DESKTOP_DOCK_POSITION_KEY = 'desktop-dock-position'

function loadSavedPosition(): { x: number; y: number } {
  try {
    const saved = localStorage.getItem(DESKTOP_DOCK_POSITION_KEY)
    if (saved) {
      const { x, y } = JSON.parse(saved)
      return { x: Number(x) || 0, y: Number(y) || 0 }
    }
  } catch (e) {
    // ignore
  }
  return { x: 0, y: 0 }
}

export function FloatingDock({ items, leftItems, className }: FloatingDockProps) {
  const hoverMouseX = useMotionValue(Infinity)
  const [isDark, setIsDark] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const initPos = useRef(loadSavedPosition())
  const dragX = useMotionValue(initPos.current.x)
  const dragY = useMotionValue(initPos.current.y)

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

  // 入场动画
  useEffect(() => {
    const pos = initPos.current
    dragX.set(pos.x)
    dragY.set(pos.y + 80)

    const delay = pos.x === 0 && pos.y === 0 ? 500 : 0
    const timer = setTimeout(() => {
      const startY = dragY.get()
      const targetY = pos.y
      const startTime = performance.now()
      const duration = 500

      function anim(now: number) {
        const t = Math.min((now - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        dragY.set(startY + (targetY - startY) * eased)
        if (t < 1) requestAnimationFrame(anim)
      }
      requestAnimationFrame(anim)
    }, delay)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const savePosition = useCallback((x: number, y: number) => {
    try {
      localStorage.setItem(DESKTOP_DOCK_POSITION_KEY, JSON.stringify({ x, y }))
    } catch (e) { /* ignore */ }
  }, [])

  const handleDragEnd = useCallback(() => {
    setTimeout(() => setIsDragging(false), 100)
    savePosition(dragX.get(), dragY.get())
  }, [dragX, dragY, savePosition])

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'flex items-end gap-2 px-4 py-3 rounded-2xl touch-none',
        isDragging && 'cursor-grabbing',
        !isDragging && 'cursor-grab',
        className
      )}
      style={{
        x: dragX,
        y: dragY,
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
        hoverMouseX.set(Infinity)
      }}
      onDragEnd={handleDragEnd}
      onMouseMove={(e) => {
        if (!isDragging) hoverMouseX.set(e.pageX)
      }}
      onMouseLeave={() => hoverMouseX.set(Infinity)}
      initial={false}
      whileDrag={{ scale: 1.02 }}
    >
      {leftItems && leftItems.length > 0 && (
        <>
          {leftItems.map((item) => (
            <DockItem key={item.id} mouseX={hoverMouseX} isDark={isDark} {...item} />
          ))}
          <div
            className="w-px h-8 mx-1"
            style={{ background: 'var(--color-glass-border)' }}
          />
        </>
      )}
      {items.map((item) => (
        <DockItem key={item.id} mouseX={hoverMouseX} isDark={isDark} {...item} />
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

      {isDark && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: `0 0 25px var(--color-glow)` }}
          animate={{ opacity: isHovered ? 0.8 : 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {!isDark && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: isHovered ? 'var(--color-shadow-hover)' : 'none',
            y: isHovered ? -2 : 0,
          }}
          transition={{ duration: 0.2 }}
        />
      )}

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
