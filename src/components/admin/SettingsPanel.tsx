import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, 
  Palette, 
  Shield, 
  Database,
  Gauge
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { SiteSettingsCard } from './SiteSettingsCard'
import { ThemeCard } from './ThemeCard'
import { SecurityCard } from './SecurityCard'
import { DataManagementCard } from './DataManagementCard'
import { WidgetSettingsCard } from './WidgetSettingsCard'
import { SiteSettings, WidgetVisibility } from '../../lib/api'
import { Bookmark, Category } from '../../types/bookmark'
import { ThemeId } from '../../hooks/useTheme.tsx'

// 设置子标签页类型
type SettingsTab = 'site' | 'theme' | 'widget' | 'security' | 'data'

interface SettingsTabItem {
  id: SettingsTab
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  descKey: string
  gradient: string
  iconBg: string
}

const settingsTabs: SettingsTabItem[] = [
  { 
    id: 'site', 
    labelKey: 'admin.settings.tabs.site', 
    icon: Globe, 
    descKey: 'admin.settings.tabs.site_desc',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    iconBg: 'from-cyan-500/20 to-blue-600/20'
  },
  { 
    id: 'theme', 
    labelKey: 'admin.settings.tabs.theme', 
    icon: Palette, 
    descKey: 'admin.settings.tabs.theme_desc',
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconBg: 'from-purple-500/20 to-pink-600/20'
  },
  { 
    id: 'widget', 
    labelKey: 'admin.settings.tabs.widget', 
    icon: Gauge, 
    descKey: 'admin.settings.tabs.widget_desc',
    gradient: 'from-sky-500/20 to-violet-500/20',
    iconBg: 'from-sky-500/20 to-violet-600/20'
  },
  { 
    id: 'security', 
    labelKey: 'admin.settings.tabs.security', 
    icon: Shield, 
    descKey: 'admin.settings.tabs.security_desc',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconBg: 'from-amber-500/20 to-orange-600/20'
  },
  { 
    id: 'data', 
    labelKey: 'admin.settings.tabs.data', 
    icon: Database, 
    descKey: 'admin.settings.tabs.data_desc',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconBg: 'from-emerald-500/20 to-teal-600/20'
  },
]

interface SettingsPanelProps {
  // 站点设置
  siteSettings: SiteSettings
  onSiteSettingsChange: (settings: SiteSettings) => void
  onSaveSiteSettings: () => Promise<void>
  isSavingSiteSettings: boolean
  siteSettingsSuccess: boolean
  siteSettingsError: string
  // 主题设置
  themeId: ThemeId
  isDark: boolean
  autoMode: boolean
  onThemeChange: (id: ThemeId, origin?: { x: number; y: number }) => void
  onAutoModeChange: (auto: boolean) => void
  onToggleDarkMode: (origin?: { x: number; y: number }) => void
  // 仪表设置
  widgetVisibility: WidgetVisibility
  onWidgetVisibilityChange: (visibility: WidgetVisibility) => void
  onSaveWidgetSettings: () => Promise<void>
  isSavingWidgetSettings: boolean
  widgetSettingsSuccess: boolean
  widgetSettingsError: string
  // 安全设置
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>
  isChangingPassword: boolean
  passwordSuccess: boolean
  passwordError: string
  onClearPasswordError: () => void
  onClearPasswordSuccess: () => void
  // 数据管理
  bookmarks: Bookmark[]
  categories: Category[]
  onImport: (data: { bookmarks: Bookmark[]; categories: Category[]; settings: SiteSettings }) => Promise<void>
  onFactoryReset?: () => void
}

export function SettingsPanel({
  // 站点设置
  siteSettings,
  onSiteSettingsChange,
  onSaveSiteSettings,
  isSavingSiteSettings,
  siteSettingsSuccess,
  siteSettingsError,
  // 主题设置
  themeId,
  isDark,
  autoMode,
  onThemeChange,
  onAutoModeChange,
  onToggleDarkMode,
  // 仪表设置
  widgetVisibility,
  onWidgetVisibilityChange,
  onSaveWidgetSettings,
  isSavingWidgetSettings,
  widgetSettingsSuccess,
  widgetSettingsError,
  // 安全设置
  onChangePassword,
  isChangingPassword,
  passwordSuccess,
  passwordError,
  onClearPasswordError,
  onClearPasswordSuccess,
  // 数据管理
  bookmarks,
  categories,
  onImport,
  onFactoryReset,
}: SettingsPanelProps) {
  const { t } = useTranslation()
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('site')

  return (
    <div className="space-y-6">
      {/* 标签页导航 */}
      <div 
        className="relative p-1.5 rounded-2xl"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {/* 标签页按钮网格 - 响应式 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeSettingsTab === tab.id
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                  'text-left overflow-hidden group',
                  isActive && 'shadow-lg'
                )}
                style={{
                  background: isActive 
                    ? 'var(--color-bg-secondary)' 
                    : 'transparent',
                  border: isActive 
                    ? '1px solid var(--color-primary)' 
                    : '1px solid transparent',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* 激活状态背景渐变 */}
                {isActive && (
                  <motion.div
                    layoutId="settings-tab-bg"
                    className={cn(
                      'absolute inset-0 bg-gradient-to-r opacity-20',
                      tab.gradient
                    )}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                
                {/* 图标 */}
                <div 
                  className={cn(
                    'relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    'bg-gradient-to-br transition-all duration-300',
                    tab.iconBg,
                    isActive && 'shadow-md'
                  )}
                  style={{
                    border: isActive 
                      ? '1px solid var(--color-primary)' 
                      : '1px solid var(--color-glass-border)',
                  }}
                >
                  <Icon 
                    className={cn(
                      'w-5 h-5 transition-colors duration-300',
                      isActive ? 'text-[var(--color-primary)]' : ''
                    )} 
                    style={{ 
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' 
                    }}
                  />
                </div>
                
                {/* 文本 */}
                <div className="relative min-w-0 flex-1">
                  <div 
                    className={cn(
                      'font-medium text-sm truncate transition-colors duration-300'
                    )}
                    style={{ 
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' 
                    }}
                  >
                    {t(tab.labelKey)}
                  </div>
                  <div 
                    className="text-xs truncate mt-0.5 hidden sm:block"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t(tab.descKey)}
                  </div>
                </div>

                {/* 激活指示器 */}
                {isActive && (
                  <motion.div
                    layoutId="settings-tab-indicator"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'var(--color-primary)' }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* 标签页内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSettingsTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="max-w-3xl"
        >
          {/* 站点配置 */}
          {activeSettingsTab === 'site' && (
            <SiteSettingsCard
              settings={siteSettings}
              onChange={onSiteSettingsChange}
              onSave={onSaveSiteSettings}
              isSaving={isSavingSiteSettings}
              success={siteSettingsSuccess}
              error={siteSettingsError}
            />
          )}

          {/* 主题配色 */}
          {activeSettingsTab === 'theme' && (
            <ThemeCard
              currentThemeId={themeId}
              isDark={isDark}
              autoMode={autoMode}
              onThemeChange={onThemeChange}
              onAutoModeChange={onAutoModeChange}
              onToggleDarkMode={onToggleDarkMode}
            />
          )}

          {/* 系统状态 - 仪表显示设置 */}
          {activeSettingsTab === 'widget' && (
            <WidgetSettingsCard
              visibility={widgetVisibility}
              onChange={onWidgetVisibilityChange}
              onSave={onSaveWidgetSettings}
              isSaving={isSavingWidgetSettings}
              success={widgetSettingsSuccess}
              error={widgetSettingsError}
            />
          )}

          {/* 安全设置 */}
          {activeSettingsTab === 'security' && (
            <SecurityCard
              onChangePassword={onChangePassword}
              isChanging={isChangingPassword}
              success={passwordSuccess}
              error={passwordError}
              onClearError={onClearPasswordError}
              onClearSuccess={onClearPasswordSuccess}
            />
          )}

          {/* 数据管理 */}
          {activeSettingsTab === 'data' && (
            <DataManagementCard
              bookmarks={bookmarks}
              categories={categories}
              settings={siteSettings}
              onImport={onImport}
              onFactoryReset={onFactoryReset}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
