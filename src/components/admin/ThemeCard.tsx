import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor, Check, Palette, ChevronDown } from 'lucide-react'
import { themes, darkThemes, lightThemes, ThemeId, Theme } from '../../hooks/useTheme.tsx'
import { cn } from '../../lib/utils'

interface ThemeCardProps {
  currentThemeId: ThemeId
  isDark: boolean
  autoMode: boolean
  onThemeChange: (id: ThemeId, origin?: { x: number; y: number }) => void
  onAutoModeChange: (auto: boolean) => void
  onToggleDarkMode: (origin?: { x: number; y: number }) => void
}

// 主题预览小卡片 - 优化版
function ThemePreview({ 
  theme, 
  isActive, 
  onClick 
}: { 
  theme: Theme
  isActive: boolean
  onClick: (e: React.MouseEvent) => void 
}) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-xl border transition-all duration-300 text-left w-full group',
        'theme-card',
        isActive && 'ring-2 ring-[var(--color-primary)]'
      )}
      style={{
        borderColor: isActive ? theme.colors.primary : 'var(--color-glass-border)',
        backgroundColor: isActive ? `${theme.colors.primary}10` : 'var(--color-glass)',
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 选中标记 */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.primary }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主题图标和名称 */}
      <div className="flex items-center gap-3 mb-3">
        <motion.span 
          className="text-2xl"
          animate={{ rotate: isActive ? [0, -10, 10, 0] : 0 }}
          transition={{ duration: 0.5 }}
        >
          {theme.icon}
        </motion.span>
        <div>
          <div 
            className="font-medium transition-colors"
            style={{ color: isActive ? theme.colors.primary : 'var(--color-text-primary)' }}
          >
            {theme.name}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {theme.mode === 'dark' ? '深色模式' : '浅色模式'}
          </div>
        </div>
      </div>

      {/* 颜色预览条 - 带悬浮动画 */}
      <div className="flex gap-1.5 h-3">
        {[theme.colors.primary, theme.colors.primaryLight, theme.colors.accent, theme.colors.accentLight].map((color, i) => (
          <motion.div 
            key={i}
            className="flex-1 rounded-full"
            style={{ backgroundColor: color }}
            whileHover={{ scaleY: 1.3 }}
            transition={{ type: 'spring', stiffness: 400 }}
          />
        ))}
      </div>

      {/* 背景色预览 */}
      <div className="flex gap-1.5 h-2 mt-2">
        {[theme.colors.bgPrimary, theme.colors.bgSecondary, theme.colors.bgTertiary].map((color, i) => (
          <div 
            key={i}
            className="flex-1 rounded-full border"
            style={{ 
              backgroundColor: color,
              borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
            }}
          />
        ))}
      </div>
    </motion.button>
  )
}

// 太阳/月亮切换图标 - 带旋转动画
function ThemeToggleIcon({ isDark }: { isDark: boolean }) {
  return (
    <div className="relative w-4 h-4">
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0 }}
            transition={{ duration: 0.3, type: 'spring' }}
            className="absolute inset-0"
          >
            <Moon className="w-4 h-4 text-indigo-300" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0 }}
            transition={{ duration: 0.3, type: 'spring' }}
            className="absolute inset-0"
          >
            <Sun className="w-4 h-4 text-amber-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ThemeCard({
  currentThemeId,
  isDark,
  autoMode,
  onThemeChange,
  onAutoModeChange,
  onToggleDarkMode,
}: ThemeCardProps) {
  const [expandedSection, setExpandedSection] = useState<'dark' | 'light' | null>(
    isDark ? 'dark' : 'light'
  )
  const toggleButtonRef = useRef<HTMLButtonElement>(null)

  // 获取切换按钮位置用于圆圈扩散动画
  const handleToggle = () => {
    if (toggleButtonRef.current) {
      const rect = toggleButtonRef.current.getBoundingClientRect()
      const origin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
      onToggleDarkMode(origin)
    } else {
      onToggleDarkMode()
    }
  }

  return (
    <motion.div
      className="rounded-2xl border theme-card p-6"
      style={{
        borderColor: 'var(--color-glass-border)',
        backgroundColor: 'var(--color-glass)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                : 'linear-gradient(135deg, #f59e0b, #f97316)'
            }}
            animate={{ rotate: isDark ? 0 : 180 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <Palette className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              主题配色
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              自定义界面外观
            </p>
          </div>
        </div>

        {/* 日夜模式切换 - 带动画 */}
        <motion.button
          ref={toggleButtonRef}
          onClick={handleToggle}
          className={cn(
            'relative w-16 h-8 rounded-full p-1 transition-all duration-500',
            'shadow-inner overflow-hidden'
          )}
          style={{
            backgroundColor: isDark ? '#312e81' : '#fef3c7',
            boxShadow: isDark 
              ? 'inset 0 2px 4px rgba(0,0,0,0.3)' 
              : 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* 背景星星/云朵 */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: isDark ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/50 rounded-full"
                style={{
                  left: `${20 + i * 25}%`,
                  top: `${30 + (i % 2) * 40}%`,
                }}
                animate={{ 
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                }}
              />
            ))}
          </motion.div>

          {/* 滑块 */}
          <motion.div
            className="relative w-6 h-6 rounded-full shadow-lg flex items-center justify-center z-10"
            style={{
              backgroundColor: isDark ? '#1e1b4b' : '#ffffff',
              boxShadow: isDark 
                ? '0 2px 8px rgba(99, 102, 241, 0.4)' 
                : '0 2px 8px rgba(0,0,0,0.15)'
            }}
            animate={{ x: isDark ? 0 : 32 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="moon-icon"
                  initial={{ rotate: -90, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  exit={{ rotate: 90, scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun-icon"
                  initial={{ rotate: 90, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  exit={{ rotate: -90, scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.button>
      </div>

      {/* 自动模式开关 */}
      <motion.div 
        className="mb-6 p-4 rounded-xl border transition-all duration-300"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: autoMode ? 'var(--color-primary)' : 'var(--color-border-light)',
        }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: autoMode ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Monitor className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
            </motion.div>
            <div>
              <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                自动切换
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                根据时间自动切换日夜主题（6:00-18:00 日间）
              </div>
            </div>
          </div>
          <motion.button
            onClick={() => onAutoModeChange(!autoMode)}
            className={cn(
              'relative w-12 h-6 rounded-full p-0.5 transition-colors duration-300'
            )}
            style={{
              backgroundColor: autoMode ? 'var(--color-primary)' : 'var(--color-border)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="w-5 h-5 rounded-full bg-white shadow-sm"
              animate={{ x: autoMode ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* 深色主题 */}
      <div className="mb-4">
        <button
          onClick={() => setExpandedSection(expandedSection === 'dark' ? null : 'dark')}
          className="w-full flex items-center justify-between p-3 rounded-xl transition-colors"
          style={{
            backgroundColor: expandedSection === 'dark' ? 'var(--color-border-light)' : 'transparent',
          }}
        >
          <div className="flex items-center gap-2">
            <ThemeToggleIcon isDark={true} />
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              深色主题
            </span>
            <span 
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: 'rgba(99, 102, 241, 0.2)', 
                color: '#818cf8' 
              }}
            >
              {darkThemes.length} 款
            </span>
          </div>
          <motion.div
            animate={{ rotate: expandedSection === 'dark' ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </motion.div>
        </button>
        
        <AnimatePresence>
          {expandedSection === 'dark' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 pt-3">
                {darkThemes.map((theme) => (
                  <ThemePreview
                    key={theme.id}
                    theme={theme}
                    isActive={currentThemeId === theme.id}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      onThemeChange(theme.id as ThemeId, {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                      })
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 浅色主题 */}
      <div>
        <button
          onClick={() => setExpandedSection(expandedSection === 'light' ? null : 'light')}
          className="w-full flex items-center justify-between p-3 rounded-xl transition-colors"
          style={{
            backgroundColor: expandedSection === 'light' ? 'var(--color-border-light)' : 'transparent',
          }}
        >
          <div className="flex items-center gap-2">
            <ThemeToggleIcon isDark={false} />
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              浅色主题
            </span>
            <span 
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: 'rgba(245, 158, 11, 0.2)', 
                color: '#fbbf24' 
              }}
            >
              {lightThemes.length} 款
            </span>
          </div>
          <motion.div
            animate={{ rotate: expandedSection === 'light' ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </motion.div>
        </button>
        
        <AnimatePresence>
          {expandedSection === 'light' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 pt-3">
                {lightThemes.map((theme) => (
                  <ThemePreview
                    key={theme.id}
                    theme={theme}
                    isActive={currentThemeId === theme.id}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      onThemeChange(theme.id as ThemeId, {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                      })
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 当前主题信息 */}
      <motion.div 
        className="mt-6 pt-4 border-t"
        style={{ borderColor: 'var(--color-border-light)' }}
        layout
      >
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--color-text-muted)' }}>当前主题</span>
          <motion.div 
            className="flex items-center gap-2"
            key={currentThemeId}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-lg">{themes[currentThemeId].icon}</span>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {themes[currentThemeId].name}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
