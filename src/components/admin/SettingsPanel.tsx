import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, 
  Palette, 
  Shield, 
  Gauge,
  Image,
  Sparkles,
  Cloud
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { SiteSettingsCard } from './SiteSettingsCard'
import { ThemeCard } from './ThemeCard'
import { SecurityCard } from './SecurityCard'
import { WidgetSettingsCard } from './WidgetSettingsCard'
import { WallpaperSettingsCard } from './WallpaperSettingsCard'
import { AiSettingsCard } from './AiSettingsCard'
import { NowenNoteSettingsCard } from './NowenNoteSettingsCard'
import { SiteSettings, WidgetVisibility } from '../../lib/api'
import { ThemeId } from '../../hooks/useTheme.tsx'

// 设置子标签页类型
type SettingsTab = 'site' | 'theme' | 'wallpaper' | 'widget' | 'security' | 'ai' | 'sync'

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
    id: 'wallpaper', 
    labelKey: 'admin.settings.tabs.wallpaper', 
    icon: Image, 
    descKey: 'admin.settings.tabs.wallpaper_desc',
    gradient: 'from-violet-500/20 to-fuchsia-500/20',
    iconBg: 'from-violet-500/20 to-fuchsia-600/20'
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
    id: 'ai', 
    labelKey: 'admin.settings.tabs.ai', 
    icon: Sparkles, 
    descKey: 'admin.settings.tabs.ai_desc',
    gradient: 'from-purple-500/20 to-cyan-500/20',
    iconBg: 'from-purple-500/20 to-cyan-600/20'
  },
  { 
    id: 'sync', 
    labelKey: 'admin.settings.tabs.sync', 
    icon: Cloud, 
    descKey: 'admin.settings.tabs.sync_desc',
    gradient: 'from-violet-500/20 to-indigo-500/20',
    iconBg: 'from-violet-500/20 to-indigo-600/20'
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
  /** 重新拉取站点设置（nowen-note 一键连接/断开后用来刷新 token 状态） */
  onReloadSiteSettings?: () => Promise<void>
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
  onChangeUsername: (newUsername: string, password: string) => Promise<void>
  isChangingPassword: boolean
  isChangingUsername: boolean
  passwordSuccess: boolean
  usernameSuccess: boolean
  passwordError: string
  usernameError: string
  currentUsername: string
  onClearPasswordError: () => void
  onClearPasswordSuccess: () => void
  onClearUsernameError: () => void
  onClearUsernameSuccess: () => void
  // 壁纸设置
  onSaveWallpaperSettings: () => Promise<void>
  isSavingWallpaperSettings: boolean
  wallpaperSettingsSuccess: boolean
  wallpaperSettingsError: string
}

export function SettingsPanel({
  // 站点设置
  siteSettings,
  onSiteSettingsChange,
  onSaveSiteSettings,
  isSavingSiteSettings,
  siteSettingsSuccess,
  siteSettingsError,
  onReloadSiteSettings,
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
  onChangeUsername,
  isChangingPassword,
  isChangingUsername,
  passwordSuccess,
  usernameSuccess,
  passwordError,
  usernameError,
  currentUsername,
  onClearPasswordError,
  onClearPasswordSuccess,
  onClearUsernameError,
  onClearUsernameSuccess,
  // 壁纸设置
  onSaveWallpaperSettings,
  isSavingWallpaperSettings,
  wallpaperSettingsSuccess,
  wallpaperSettingsError,
}: SettingsPanelProps) {
  const { t } = useTranslation()
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('site')

  return (
    <div className="w-full space-y-6">
      {/* 标签页导航 - 分段控件式紧凑设计 */}
      <div
        className="relative p-1.5 rounded-2xl"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {/*
          自适应策略：
          - 移动端 (<md): 横向滚动条带，每个按钮 min-width 84px，可手势横划
          - md 及以上 (≥768px): N 列等分网格，竖排"图标+文字"分段控件风格
          - 不再使用"横排大按钮"——经实测在中等屏幕下 7 个按钮无论如何都塞不下
        */}
        {/* 移动端：横向滚动 */}
        <div className="md:hidden flex gap-1.5 overflow-x-auto scrollbar-hide -mx-0.5 px-0.5 snap-x snap-mandatory">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeSettingsTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl',
                  'transition-all duration-300 overflow-hidden snap-start',
                  'flex-shrink-0 min-w-[84px]',
                  isActive && 'shadow-md',
                )}
                style={{
                  background: isActive ? 'var(--color-bg-secondary)' : 'transparent',
                  border: isActive
                    ? '1px solid var(--color-primary)'
                    : '1px solid transparent',
                }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="settings-tab-bg-mobile"
                    className={cn('absolute inset-0 bg-gradient-to-br opacity-15', tab.gradient)}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    'relative w-8 h-8 rounded-lg flex items-center justify-center',
                    'bg-gradient-to-br flex-shrink-0',
                    tab.iconBg,
                  )}
                  style={{
                    border: isActive
                      ? '1px solid var(--color-primary)'
                      : '1px solid var(--color-glass-border)',
                  }}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
                    )}
                  />
                </div>
                <span
                  className="relative text-[11px] font-medium leading-tight whitespace-nowrap"
                  style={{
                    color: isActive
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-secondary)',
                  }}
                >
                  {t(tab.labelKey)}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/*
          桌面端：N 列等分网格（N = settingsTabs.length），图标在上文字在下
          - 用 grid 而非 flex，每列 minmax(0, 1fr) 强制等分且允许缩小到 0，min-width 不再阻塞
          - 中等屏 (md~lg)：仅显示图标 + 主标题（紧凑两行）
          - 大屏 (xl+)：可选显示描述
        */}
        <div
          className="hidden md:grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${settingsTabs.length}, minmax(0, 1fr))`,
          }}
        >
          {settingsTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeSettingsTab === tab.id

            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-2 px-2 py-3 rounded-xl',
                  'transition-all duration-300 overflow-hidden group min-w-0',
                  isActive && 'shadow-lg',
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
                      'absolute inset-0 bg-gradient-to-br opacity-15',
                      tab.gradient,
                    )}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* 图标 */}
                <div
                  className={cn(
                    'relative w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    'bg-gradient-to-br transition-all duration-300',
                    tab.iconBg,
                    isActive && 'shadow-md',
                  )}
                  style={{
                    border: isActive
                      ? '1px solid var(--color-primary)'
                      : '1px solid var(--color-glass-border)',
                  }}
                >
                  <Icon
                    className={cn(
                      'w-[18px] h-[18px] transition-colors duration-300',
                      isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
                    )}
                  />
                </div>

                {/* 主标题 - 跨断点字号自适应 */}
                <div className="relative w-full min-w-0 text-center">
                  <div
                    className="font-medium text-xs lg:text-[13px] truncate transition-colors duration-300 leading-tight"
                    title={t(tab.labelKey)}
                    style={{
                      color: isActive
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    {t(tab.labelKey)}
                  </div>
                </div>

                {/* 激活指示器 - 顶部小光带 */}
                {isActive && (
                  <motion.div
                    layoutId="settings-tab-indicator"
                    className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
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
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeSettingsTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn('w-full', activeSettingsTab === 'site' ? 'max-w-none' : 'max-w-4xl')}
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

          {/* 壁纸设置 */}
          {activeSettingsTab === 'wallpaper' && (
            <WallpaperSettingsCard
              settings={siteSettings}
              onChange={onSiteSettingsChange}
              onSave={onSaveWallpaperSettings}
              isSaving={isSavingWallpaperSettings}
              success={wallpaperSettingsSuccess}
              error={wallpaperSettingsError}
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
              onChangeUsername={onChangeUsername}
              isChanging={isChangingPassword}
              isChangingUsername={isChangingUsername}
              success={passwordSuccess}
              usernameSuccess={usernameSuccess}
              error={passwordError}
              usernameError={usernameError}
              currentUsername={currentUsername}
              onClearError={onClearPasswordError}
              onClearSuccess={onClearPasswordSuccess}
              onClearUsernameError={onClearUsernameError}
              onClearUsernameSuccess={onClearUsernameSuccess}
            />
          )}

          {/* AI 设置 */}
          {activeSettingsTab === 'ai' && (
            <AiSettingsCard
              enableAutoAi={siteSettings.enableAutoAi ?? true}
              onAutoAiChange={(enabled) => {
                onSiteSettingsChange({ ...siteSettings, enableAutoAi: enabled })
                // 自动保存
                onSaveSiteSettings()
              }}
            />
          )}

          {/* nowen-note 同步配置 */}
          {activeSettingsTab === 'sync' && (
            <NowenNoteSettingsCard
              settings={siteSettings}
              onChange={onSiteSettingsChange}
              onSave={onSaveSiteSettings}
              onReload={onReloadSiteSettings}
              isSaving={isSavingSiteSettings}
              success={siteSettingsSuccess}
              error={siteSettingsError}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
