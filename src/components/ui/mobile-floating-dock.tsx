/**
 * Mobile Floating Dock - 移动端可展开悬浮坞
 * Vibe: 花瓣式展开，收起时只是右下角的一个小能量球
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DockItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  onClick: () => void
  isActive?: boolean
}

interface MobileFloatingDockProps {
  items: DockItem[]
  className?: string
}

// 液态动画配置
const LIQUID_SPRING = {
  // 展开/收起 - 像花瓣绽放
  expand: { type: 'spring' as const, stiffness: 300, damping: 25 },
  // 单个项目入场 - 错落有致
  item: { type: 'spring' as const, stiffness: 400, damping: 28 },
  // 背景模糊层
  backdrop: { duration: 0.3 },
}

export function MobileFloatingDock({ items, className }: MobileFloatingDockProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleItemClick = (item: DockItem) => {
    // 触觉反馈 (如果支持)
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    item.onClick()
    setIsExpanded(false)
  }

  const toggleDock = () => {
    // 触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
    setIsExpanded(!isExpanded)
  }

  return (
    <>
      {/* 背景遮罩 - 展开时出现 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={LIQUID_SPRING.backdrop}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* 悬浮坞容器 */}
      <div className={cn('fixed bottom-6 right-6 z-50', className)}>
        {/* 展开的菜单项 - 花瓣式布局 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end"
            >
              {items.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.5, x: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    x: 0,
                    transition: {
                      ...LIQUID_SPRING.item,
                      delay: index * 0.05,
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.5, 
                    x: 20,
                    transition: {
                      duration: 0.15,
                      delay: (items.length - index - 1) * 0.03,
                    }
                  }}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl',
                    'bg-black/80 backdrop-blur-xl border',
                    item.isActive 
                      ? 'border-cyan-400/30' 
                      : 'border-white/10',
                    'active:scale-95 transition-transform'
                  )}
                  style={{
                    boxShadow: item.isActive 
                      ? '0 0 20px rgba(0, 242, 254, 0.3)' 
                      : '0 4px 20px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* 标签 */}
                  <span 
                    className="text-sm font-medium whitespace-nowrap"
                    style={{
                      color: item.isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {item.label}
                  </span>
                  
                  {/* 图标 */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: item.isActive 
                        ? 'rgba(0, 242, 254, 0.15)' 
                        : 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <item.icon 
                      className="w-5 h-5" 
                      style={{
                        color: item.isActive ? 'rgba(0, 242, 254, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                      }}
                    />
                  </div>

                  {/* 选中态能量指示条 */}
                  {item.isActive && (
                    <motion.div
                      layoutId="mobileDockIndicator"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(0, 242, 254, 0.8), rgba(102, 126, 234, 0.6))',
                        boxShadow: '0 0 10px rgba(0, 242, 254, 0.5)',
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主按钮 - 能量球 */}
        <motion.button
          onClick={toggleDock}
          animate={{
            rotate: isExpanded ? 180 : 0,
            scale: isExpanded ? 0.9 : 1,
          }}
          transition={LIQUID_SPRING.expand}
          className={cn(
            'relative w-14 h-14 rounded-full',
            'flex items-center justify-center',
            'bg-black/80 backdrop-blur-xl',
            'border border-white/10',
            'active:scale-90 transition-transform'
          )}
          style={{
            boxShadow: isExpanded 
              ? '0 0 30px rgba(0, 242, 254, 0.4)' 
              : '0 4px 20px rgba(0, 0, 0, 0.4)',
          }}
          aria-label={isExpanded ? '关闭导航' : '打开导航'}
          aria-expanded={isExpanded}
        >
          {/* 能量环 - 呼吸动画 */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(0, 242, 254, 0)',
                '0 0 0 8px rgba(0, 242, 254, 0.1)',
                '0 0 0 0 rgba(0, 242, 254, 0)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* 图标切换 */}
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6 text-cyan-400" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="w-6 h-6 text-white/80" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 活跃项指示点 */}
          {!isExpanded && items.some(item => item.isActive) && (
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #00f2fe, #667eea)',
                boxShadow: '0 0 8px rgba(0, 242, 254, 0.6)',
              }}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.button>
      </div>
    </>
  )
}
