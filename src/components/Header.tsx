import { motion } from 'framer-motion'
import { Sun, Moon, Edit3, Search, Sparkles, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTime } from '../hooks/useTime'
import { useTheme } from '../hooks/useTheme'
import { cn } from '../lib/utils'

interface HeaderProps {
  onOpenCommand: () => void
  onToggleEditMode?: () => void
  isEditMode?: boolean
}

export function Header({ onOpenCommand, onToggleEditMode, isEditMode }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { formattedTime, formattedDate } = useTime()
  const { isDark, toggleTheme } = useTheme()

  // 切换语言：在 'en' 和 'zh' 之间循环
  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'zh' : 'en'
    i18n.changeLanguage(nextLang)
  }

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* 左侧 - Logo/品牌 */}
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gradient-1)] to-[var(--gradient-2)] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div 
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {formattedTime}
            </div>
            <div 
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {formattedDate}
            </div>
          </div>
        </motion.div>

        {/* 右侧 - 控制按钮 */}
        <div className="flex items-center gap-2">
          {/* 搜索按钮 */}
          <motion.button
            onClick={onOpenCommand}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10',
              'transition-all duration-200 cursor-pointer'
            )}
            style={{ color: 'var(--text-secondary)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">{t('search')}</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded bg-white/10 text-white/40">
              ⌘K
            </kbd>
          </motion.button>

          {/* 语言切换 */}
          <motion.button
            onClick={toggleLanguage}
            className={cn(
              'p-2.5 rounded-xl',
              'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10',
              'transition-all duration-200 cursor-pointer'
            )}
            style={{ color: 'var(--text-secondary)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t('language_toggle')}
            title={t('language_toggle')}
          >
            <Languages className="w-4 h-4" />
          </motion.button>

          {/* 编辑模式切换 */}
          <motion.button
            onClick={onToggleEditMode}
            className={cn(
              'p-2.5 rounded-xl transition-all duration-200 cursor-pointer',
              isEditMode 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10'
            )}
            style={{ color: isEditMode ? undefined : 'var(--text-secondary)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t('edit_mode')}
            title={t('edit_mode_tooltip')}
          >
            <Edit3 className="w-4 h-4" />
          </motion.button>

          {/* 主题切换 */}
          <motion.button
            onClick={toggleTheme}
            className={cn(
              'p-2.5 rounded-xl',
              'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10',
              'transition-all duration-200 cursor-pointer'
            )}
            style={{ color: 'var(--text-secondary)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t('theme_toggle')}
            title={t('theme_toggle')}
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}
