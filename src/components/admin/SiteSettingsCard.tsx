import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, 
  Type, 
  Image, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  Zap,
  Feather,
  CloudSun,
  Moon,
  Languages,
  SunMoon,
  FileText,
  LayoutGrid,
  Shield,
  Users,
  Search,
  Plus,
  Trash2,
  ChevronDown,
  Lightbulb,
  Download,
  Navigation,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { SiteSettings, SearchEngineConfig } from '../../lib/api'

// 预置搜索引擎列表
const BUILTIN_SEARCH_ENGINES: SearchEngineConfig[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={query}', shortcut: 'g', builtin: true },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={query}', shortcut: 'b', builtin: true },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd={query}', shortcut: 'bd', builtin: true },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q={query}', shortcut: 'gh', builtin: true },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}', shortcut: 'dd', builtin: true },
  { id: 'bilibili', name: 'Bilibili', url: 'https://search.bilibili.com/all?keyword={query}', shortcut: 'bili', builtin: true },
]

interface SiteSettingsCardProps {
  settings: SiteSettings
  onChange: (settings: SiteSettings) => void
  onSave: () => Promise<void>
  isSaving: boolean
  success: boolean
  error: string
}

export function SiteSettingsCard({
  settings,
  onChange,
  onSave,
  isSaving,
  success,
  error,
}: SiteSettingsCardProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Handle file drop - convert to data URL for preview
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onChange({ ...settings, siteFavicon: event.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }, [settings, onChange])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative group"
    >
      {/* Card Container with Glass Effect */}
      <div 
        className="relative overflow-hidden rounded-2xl backdrop-blur-xl p-6"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {/* Animated Border Gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:block hidden" />
        
        {/* Header */}
        <div className="relative flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-cyan-500" />
            </div>
            <div className="absolute -inset-2 rounded-xl bg-cyan-500/20 blur-xl opacity-50 -z-10 dark:block hidden" />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.site.title')}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.site.subtitle')}</p>
          </div>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form Fields */}
          <div className="space-y-5">
            {/* Site Title Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Type className="w-4 h-4" />
                {t('admin.settings.site.site_title')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.siteTitle || ''}
                  onChange={e => onChange({ ...settings, siteTitle: e.target.value })}
                  placeholder={t('admin.settings.site.site_title_placeholder')}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-300"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Site Favicon Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Image className="w-4 h-4" />
                {t('admin.settings.site.site_icon')}
              </label>
              
              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 border-dashed',
                  isDragging && 'border-cyan-500'
                )}
                style={{
                  background: isDragging ? 'rgba(6,182,212,0.1)' : 'var(--color-bg-tertiary)',
                  border: isDragging ? '1px dashed #06b6d4' : '1px dashed var(--color-glass-border)',
                }}
              >
                <div className="flex items-center gap-3">
                    {settings.siteFavicon ? (
                    <>
                      <img 
                        src={settings.siteFavicon} 
                        alt="favicon" 
                        className="w-8 h-8 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <span className="text-sm truncate flex-1" style={{ color: 'var(--color-text-muted)' }}>
                        {settings.siteFavicon.startsWith('data:') ? t('admin.settings.site.uploaded_local') : settings.siteFavicon}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {t('admin.settings.site.drag_upload')}
                      </span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        onChange({ ...settings, siteFavicon: event.target?.result as string })
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>

              {/* URL Input */}
              <div className="relative">
                <input
                  type="text"
                  value={settings.siteFavicon?.startsWith('data:') ? '' : (settings.siteFavicon || '')}
                  onChange={e => onChange({ ...settings, siteFavicon: e.target.value })}
                  placeholder={t('admin.settings.site.icon_url_placeholder')}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-300"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Beam Animation Toggle */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Zap className="w-4 h-4" />
                {t('admin.settings.site.beam_animation')}
              </label>
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.beam_effect')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.beam_desc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, enableBeamAnimation: !settings.enableBeamAnimation })}
                  disabled={settings.enableLiteMode}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-all duration-300',
                    settings.enableLiteMode 
                      ? 'bg-gray-600/30 cursor-not-allowed' 
                      : settings.enableBeamAnimation !== false
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        : 'bg-gray-600/50'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                      settings.enableBeamAnimation !== false && !settings.enableLiteMode ? 'left-7' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* VIBE CODING: Lite Mode Toggle - 精简模式开关 (禅) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Feather className="w-4 h-4" />
                {t('admin.settings.site.lite_mode')}
              </label>
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-300"
                style={{
                  background: settings.enableLiteMode 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'var(--color-bg-tertiary)',
                  border: settings.enableLiteMode
                    ? '1px solid rgba(16, 185, 129, 0.2)'
                    : '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.lite_title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.lite_desc')}
                    <span className="ml-1 opacity-75 text-emerald-500">
                      {settings.enableLiteMode ? t('admin.settings.site.lite_enabled') : ''}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ 
                    ...settings, 
                    enableLiteMode: !settings.enableLiteMode,
                    // 开启精简模式时，自动关闭光束动画以确保彻底的 Lite
                    enableBeamAnimation: !settings.enableLiteMode ? false : settings.enableBeamAnimation 
                  })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-all duration-300',
                    settings.enableLiteMode
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                      : 'bg-gray-600/50'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                      settings.enableLiteMode ? 'left-7' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* 天气显示开关 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Shield className="w-4 h-4" />
                {t('admin.settings.site.access_mode')}
              </label>
              <div 
                className="px-4 py-3 rounded-xl space-y-3 transition-colors duration-300"
                style={{
                  background: settings.accessMode === 'private'
                    ? 'rgba(245, 158, 11, 0.1)' 
                    : 'var(--color-bg-tertiary)',
                  border: settings.accessMode === 'private'
                    ? '1px solid rgba(245, 158, 11, 0.2)'
                    : '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.access_mode_title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.access_mode_desc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ ...settings, accessMode: 'public' })}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
                      settings.accessMode !== 'private'
                        ? 'ring-2 ring-cyan-500/40 shadow-sm'
                        : 'hover:bg-white/5'
                    )}
                    style={{
                      background: settings.accessMode !== 'private'
                        ? 'rgba(6, 182, 212, 0.15)'
                        : 'var(--color-bg-secondary)',
                      color: settings.accessMode !== 'private'
                        ? 'rgb(34, 211, 238)'
                        : 'var(--color-text-muted)',
                      border: settings.accessMode !== 'private'
                        ? '1px solid rgba(6, 182, 212, 0.3)'
                        : '1px solid var(--color-glass-border)',
                    }}
                  >
                    <Users className="w-4 h-4" />
                    {t('admin.settings.site.access_mode_public')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...settings, accessMode: 'private' })}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
                      settings.accessMode === 'private'
                        ? 'ring-2 ring-amber-500/40 shadow-sm'
                        : 'hover:bg-white/5'
                    )}
                    style={{
                      background: settings.accessMode === 'private'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'var(--color-bg-secondary)',
                      color: settings.accessMode === 'private'
                        ? 'rgb(251, 191, 36)'
                        : 'var(--color-text-muted)',
                      border: settings.accessMode === 'private'
                        ? '1px solid rgba(245, 158, 11, 0.3)'
                        : '1px solid var(--color-glass-border)',
                    }}
                  >
                    <Shield className="w-4 h-4" />
                    {t('admin.settings.site.access_mode_private')}
                  </button>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {settings.accessMode === 'private'
                    ? t('admin.settings.site.access_mode_private_hint')
                    : t('admin.settings.site.access_mode_public_hint')
                  }
                </p>
              </div>
            </div>

            {/* 新书签默认可见性 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Shield className="w-4 h-4" />
                {t('admin.settings.site.default_visibility')}
              </label>
              <div 
                className="px-4 py-3 rounded-xl space-y-3 transition-colors duration-300"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.default_visibility_title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.default_visibility_desc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ ...settings, defaultBookmarkVisibility: 'public' })}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                      settings.defaultBookmarkVisibility !== 'private'
                        ? 'ring-2 ring-cyan-500/40 shadow-sm'
                        : 'hover:bg-white/5'
                    )}
                    style={{
                      background: settings.defaultBookmarkVisibility !== 'private'
                        ? 'rgba(6, 182, 212, 0.15)'
                        : 'var(--color-bg-secondary)',
                      color: settings.defaultBookmarkVisibility !== 'private'
                        ? 'rgb(34, 211, 238)'
                        : 'var(--color-text-muted)',
                      border: settings.defaultBookmarkVisibility !== 'private'
                        ? '1px solid rgba(6, 182, 212, 0.3)'
                        : '1px solid var(--color-glass-border)',
                    }}
                  >
                    <Users className="w-4 h-4" />
                    {t('admin.settings.site.access_mode_public')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...settings, defaultBookmarkVisibility: 'private' })}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                      settings.defaultBookmarkVisibility === 'private'
                        ? 'ring-2 ring-amber-500/40 shadow-sm'
                        : 'hover:bg-white/5'
                    )}
                    style={{
                      background: settings.defaultBookmarkVisibility === 'private'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'var(--color-bg-secondary)',
                      color: settings.defaultBookmarkVisibility === 'private'
                        ? 'rgb(251, 191, 36)'
                        : 'var(--color-text-muted)',
                      border: settings.defaultBookmarkVisibility === 'private'
                        ? '1px solid rgba(245, 158, 11, 0.3)'
                        : '1px solid var(--color-glass-border)',
                    }}
                  >
                    <Shield className="w-4 h-4" />
                    {t('admin.settings.site.access_mode_private')}
                  </button>
                </div>
              </div>
            </div>

            {/* 天气显示开关 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <CloudSun className="w-4 h-4" />
                {t('admin.settings.site.weather')}
              </label>
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-300"
                style={{
                  background: settings.enableWeather !== false
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'var(--color-bg-tertiary)',
                  border: settings.enableWeather !== false
                    ? '1px solid rgba(59, 130, 246, 0.2)'
                    : '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.weather_title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.weather_desc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, enableWeather: !(settings.enableWeather !== false) })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-all duration-300',
                    settings.enableWeather !== false
                      ? 'bg-gradient-to-r from-blue-500 to-sky-500'
                      : 'bg-gray-600/50'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                      settings.enableWeather !== false ? 'left-7' : 'left-1'
                    )}
                  />
                </button>
              </div>

              {/* 天气城市设置 */}
              {settings.enableWeather !== false && (
                <div 
                  className="px-4 py-3 rounded-xl transition-colors duration-300"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-glass-border)',
                  }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.weather_city')}
                  </p>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.weather_city_desc')}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.weatherCity || ''}
                      onChange={(e) => onChange({ ...settings, weatherCity: e.target.value })}
                      placeholder={t('admin.settings.site.weather_city_placeholder')}
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg outline-none transition-colors"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-glass-border)',
                      }}
                    />
                    {settings.weatherCity && (
                      <button
                        type="button"
                        onClick={() => onChange({ ...settings, weatherCity: '' })}
                        className="px-3 py-1.5 text-xs rounded-lg transition-colors hover:opacity-80"
                        style={{
                          background: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-muted)',
                          border: '1px solid var(--color-glass-border)',
                        }}
                      >
                        {t('admin.settings.site.weather_use_location')}
                      </button>
                    )}
                  </div>

                  {/* 禁用定位开关 - 仅在未设置城市时显示 */}
                  {!settings.weatherCity && (
                    <div 
                      className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-300"
                      style={{
                        background: settings.disableGeolocation
                          ? 'rgba(245, 158, 11, 0.1)' 
                          : 'var(--color-bg-tertiary)',
                        border: settings.disableGeolocation
                          ? '1px solid rgba(245, 158, 11, 0.2)'
                          : '1px solid var(--color-glass-border)',
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {t('admin.settings.site.disable_geolocation_title')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {t('admin.settings.site.disable_geolocation_desc')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange({ ...settings, disableGeolocation: !settings.disableGeolocation })}
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-all duration-300',
                          settings.disableGeolocation
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-gray-600/50'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                            settings.disableGeolocation ? 'left-7' : 'left-1'
                          )}
                        />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 农历显示开关 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Moon className="w-4 h-4" />
                {t('admin.settings.site.lunar')}
              </label>
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-300"
                style={{
                  background: settings.enableLunar !== false
                    ? 'rgba(251, 146, 60, 0.1)' 
                    : 'var(--color-bg-tertiary)',
                  border: settings.enableLunar !== false
                    ? '1px solid rgba(251, 146, 60, 0.2)'
                    : '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.lunar_title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.lunar_desc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, enableLunar: !(settings.enableLunar !== false) })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-all duration-300',
                    settings.enableLunar !== false
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                      : 'bg-gray-600/50'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                      settings.enableLunar !== false ? 'left-7' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* 灵感速记开关 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Lightbulb className="w-4 h-4" />
                {t('admin.settings.site.quick_notes')}
              </label>
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-300"
                style={{
                  background: settings.enableQuickNotes !== false
                    ? 'rgba(168, 85, 247, 0.1)' 
                    : 'var(--color-bg-tertiary)',
                  border: settings.enableQuickNotes !== false
                    ? '1px solid rgba(168, 85, 247, 0.2)'
                    : '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.quick_notes_title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.quick_notes_desc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, enableQuickNotes: !(settings.enableQuickNotes !== false) })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-all duration-300',
                    settings.enableQuickNotes !== false
                      ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                      : 'bg-gray-600/50'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                      settings.enableQuickNotes !== false ? 'left-7' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* 内网下载开关 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Download className="w-4 h-4" />
                {t('admin.settings.site.intranet_download')}
              </label>
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-300"
                style={{
                  background: settings.enableIntranetDownload !== false
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'var(--color-bg-tertiary)',
                  border: settings.enableIntranetDownload !== false
                    ? '1px solid rgba(59, 130, 246, 0.2)'
                    : '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.intranet_download_title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.intranet_download_desc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, enableIntranetDownload: !(settings.enableIntranetDownload !== false) })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-all duration-300',
                    settings.enableIntranetDownload !== false
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      : 'bg-gray-600/50'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                      settings.enableIntranetDownload !== false ? 'left-7' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* 快速定位侧边栏开关 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Navigation className="w-4 h-4" />
                {t('admin.settings.site.sidebar_nav')}
              </label>
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-300"
                style={{
                  background: settings.enableSidebarNav !== false
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'var(--color-bg-tertiary)',
                  border: settings.enableSidebarNav !== false
                    ? '1px solid rgba(16, 185, 129, 0.2)'
                    : '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.sidebar_nav_title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.sidebar_nav_desc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, enableSidebarNav: !(settings.enableSidebarNav !== false) })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-all duration-300',
                    settings.enableSidebarNav !== false
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gray-600/50'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                      settings.enableSidebarNav !== false ? 'left-7' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* 多语言切换开关 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Languages className="w-4 h-4" />
                {t('admin.settings.site.language_toggle')}
              </label>
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-300"
                style={{
                  background: (settings.menuVisibility?.languageToggle !== false)
                    ? 'rgba(139, 92, 246, 0.1)' 
                    : 'var(--color-bg-tertiary)',
                  border: (settings.menuVisibility?.languageToggle !== false)
                    ? '1px solid rgba(139, 92, 246, 0.2)'
                    : '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.language_toggle_title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.language_toggle_desc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ 
                    ...settings, 
                    menuVisibility: { 
                      ...settings.menuVisibility, 
                      languageToggle: !(settings.menuVisibility?.languageToggle !== false) 
                    } 
                  })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-all duration-300',
                    (settings.menuVisibility?.languageToggle !== false)
                      ? 'bg-gradient-to-r from-violet-500 to-purple-500'
                      : 'bg-gray-600/50'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                      (settings.menuVisibility?.languageToggle !== false) ? 'left-7' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* 主题切换开关 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <SunMoon className="w-4 h-4" />
                {t('admin.settings.site.theme_toggle')}
              </label>
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-300"
                style={{
                  background: (settings.menuVisibility?.themeToggle !== false)
                    ? 'rgba(236, 72, 153, 0.1)' 
                    : 'var(--color-bg-tertiary)',
                  border: (settings.menuVisibility?.themeToggle !== false)
                    ? '1px solid rgba(236, 72, 153, 0.2)'
                    : '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.theme_toggle_title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.theme_toggle_desc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ 
                    ...settings, 
                    menuVisibility: { 
                      ...settings.menuVisibility, 
                      themeToggle: !(settings.menuVisibility?.themeToggle !== false) 
                    } 
                  })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-all duration-300',
                    (settings.menuVisibility?.themeToggle !== false)
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500'
                      : 'bg-gray-600/50'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                      (settings.menuVisibility?.themeToggle !== false) ? 'left-7' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* 底部备案信息 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <FileText className="w-4 h-4" />
                {t('admin.settings.site.footer_text')}
              </label>
              <div className="relative">
                <textarea
                  value={settings.footerText || ''}
                  onChange={e => onChange({ ...settings, footerText: e.target.value })}
                  placeholder={t('admin.settings.site.footer_text_placeholder')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-300 resize-none"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('admin.settings.site.footer_text_hint')}
              </p>
            </div>

            {/* 分类书签折叠 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <LayoutGrid className="w-4 h-4" />
                {t('admin.settings.site.category_collapse')}
              </label>
              <div 
                className="px-4 py-3 rounded-xl space-y-3"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.site.category_collapse_title')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.site.category_collapse_desc')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t('admin.settings.site.category_collapse_threshold')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={settings.categoryCollapseThreshold ?? 0}
                      onChange={e => onChange({ ...settings, categoryCollapseThreshold: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-1.5 text-sm rounded-lg outline-none transition-colors"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-glass-border)',
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t('admin.settings.site.category_collapse_show_count')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={settings.categoryInitialShowCount ?? 8}
                      onChange={e => onChange({ ...settings, categoryInitialShowCount: Math.max(1, parseInt(e.target.value) || 8) })}
                      className="w-full px-3 py-1.5 text-sm rounded-lg outline-none transition-colors"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-glass-border)',
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t('admin.settings.site.category_collapse_hint')}
                </p>
              </div>
            </div>

            {/* 搜索引擎设置 */}
            <SearchEngineSettingsSection settings={settings} onChange={onChange} />
          </div>

          {/* Right: Live Preview */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              <ExternalLink className="w-4 h-4" />
              {t('admin.settings.site.preview')}
            </label>
            
            {/* Browser Preview */}
            <div 
              className="rounded-xl overflow-hidden"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-glass-border)',
              }}
            >
              {/* Browser Tab Bar */}
              <div 
                className="flex items-center gap-2 px-3 py-2"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderBottom: '1px solid var(--color-glass-border)',
                }}
              >
                {/* Window Controls */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                
                {/* Tab */}
                <div 
                  className="flex items-center gap-2 ml-4 px-3 py-1.5 rounded-t-lg"
                  style={{
                    background: 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                    borderBottom: 'none',
                  }}
                >
                  {settings.siteFavicon ? (
                    <img 
                      src={settings.siteFavicon} 
                      alt="" 
                      className="w-4 h-4 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = ''
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <span className="text-xs truncate max-w-[120px]" style={{ color: 'var(--color-text-secondary)' }}>
                    {settings.siteTitle || 'NOWEN'}
                  </span>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="p-6 min-h-[140px] relative overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
                {/* Background Decoration */}
                <div className="absolute inset-0 dark:block hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
                </div>
                
                {/* Hero Preview */}
                <div className="relative text-center space-y-2">
                  <motion.h1 
                    key={settings.siteTitle}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-bold bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--color-text-primary), var(--color-text-muted))' }}
                  >
                    {settings.siteTitle || 'NOWEN'}
                  </motion.h1>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.site.preview_subtitle')}</p>
                  
                  {/* Mini Cards Preview */}
                  <div className="flex justify-center gap-2 mt-4">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i}
                        className="w-12 h-8 rounded-lg"
                        style={{
                          background: 'var(--color-glass)',
                          border: '1px solid var(--color-glass-border)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400"
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {t('admin.settings.site.saved')}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button */}
        <motion.button
          onClick={onSave}
          disabled={isSaving}
          whileHover={{ scale: isSaving ? 1 : 1.02 }}
          whileTap={{ scale: isSaving ? 1 : 0.98 }}
          className={cn(
            'relative w-full mt-6 py-3 rounded-xl font-medium overflow-hidden',
            'bg-gradient-to-r from-cyan-600 to-blue-600',
            'text-white shadow-lg shadow-cyan-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-300'
          )}
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <span className="relative z-10">
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                {t('admin.settings.site.saving')}
              </span>
            ) : t('admin.settings.site.save')}
          </span>
        </motion.button>
      </div>
    </motion.div>
  )
}

// ========== 搜索引擎设置子组件 ==========

function SearchEngineSettingsSection({ settings, onChange }: { settings: SiteSettings; onChange: (s: SiteSettings) => void }) {
  const { t } = useTranslation()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEngine, setNewEngine] = useState({ name: '', url: '', shortcut: '' })
  const [addError, setAddError] = useState('')

  // 合并预置引擎和自定义引擎
  const customEngines = settings.searchEngine?.customEngines || []
  const allEngines = [...BUILTIN_SEARCH_ENGINES, ...customEngines]
  const defaultEngineId = settings.searchEngine?.defaultEngineId || 'google'

  const handleSetDefault = (id: string) => {
    onChange({
      ...settings,
      searchEngine: {
        ...settings.searchEngine,
        defaultEngineId: id,
        customEngines,
      },
    })
  }

  const handleAddEngine = () => {
    setAddError('')
    if (!newEngine.name.trim()) {
      setAddError(t('admin.settings.site.search_engine.name_required'))
      return
    }
    if (!newEngine.url.trim() || !newEngine.url.includes('{query}')) {
      setAddError(t('admin.settings.site.search_engine.url_invalid'))
      return
    }
    if (!newEngine.shortcut.trim()) {
      setAddError(t('admin.settings.site.search_engine.shortcut_required'))
      return
    }
    // 检查快捷键冲突
    if (allEngines.some(e => e.shortcut === newEngine.shortcut.trim())) {
      setAddError(t('admin.settings.site.search_engine.shortcut_conflict'))
      return
    }
    const id = `custom_${Date.now()}`
    const engine: SearchEngineConfig = {
      id,
      name: newEngine.name.trim(),
      url: newEngine.url.trim(),
      shortcut: newEngine.shortcut.trim(),
    }
    onChange({
      ...settings,
      searchEngine: {
        ...settings.searchEngine,
        defaultEngineId,
        customEngines: [...customEngines, engine],
      },
    })
    setNewEngine({ name: '', url: '', shortcut: '' })
    setShowAddForm(false)
  }

  const handleDeleteEngine = (id: string) => {
    const updated = customEngines.filter(e => e.id !== id)
    onChange({
      ...settings,
      searchEngine: {
        defaultEngineId: defaultEngineId === id ? 'google' : defaultEngineId,
        customEngines: updated,
      },
    })
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        <Search className="w-4 h-4" />
        {t('admin.settings.site.search_engine.label')}
      </label>
      <div
        className="px-4 py-3 rounded-xl space-y-3"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {t('admin.settings.site.search_engine.title')}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('admin.settings.site.search_engine.desc')}
          </p>
        </div>

        {/* 搜索引擎列表 */}
        <div className="space-y-1.5">
          {allEngines.map(engine => (
            <div
              key={engine.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group',
                engine.id === defaultEngineId
                  ? 'ring-1 ring-cyan-500/40'
                  : 'hover:bg-white/5'
              )}
              style={{
                background: engine.id === defaultEngineId
                  ? 'rgba(6, 182, 212, 0.1)'
                  : 'transparent',
              }}
              onClick={() => handleSetDefault(engine.id)}
            >
              <Globe className="w-4 h-4 shrink-0" style={{ color: engine.id === defaultEngineId ? 'rgb(34, 211, 238)' : 'var(--color-text-muted)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {engine.name}
                  </span>
                  <kbd
                    className="px-1.5 py-0.5 text-[10px] rounded"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  >
                    {engine.shortcut}
                  </kbd>
                  {engine.id === defaultEngineId && (
                    <span className="text-[10px] text-cyan-400 font-medium">
                      {t('admin.settings.site.search_engine.default_badge')}
                    </span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {engine.url}
                </p>
              </div>
              {/* 自定义引擎可删除 */}
              {!engine.builtin && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteEngine(engine.id) }}
                  className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 添加自定义搜索引擎 */}
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-muted)', border: '1px dashed var(--color-glass-border)' }}
          >
            <Plus className="w-4 h-4" />
            {t('admin.settings.site.search_engine.add_custom')}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 p-3 rounded-lg"
            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)' }}
          >
            <input
              type="text"
              value={newEngine.name}
              onChange={e => setNewEngine({ ...newEngine, name: e.target.value })}
              placeholder={t('admin.settings.site.search_engine.name_placeholder')}
              className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-glass-border)',
              }}
            />
            <input
              type="text"
              value={newEngine.url}
              onChange={e => setNewEngine({ ...newEngine, url: e.target.value })}
              placeholder={t('admin.settings.site.search_engine.url_placeholder')}
              className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-glass-border)',
              }}
            />
            <input
              type="text"
              value={newEngine.shortcut}
              onChange={e => setNewEngine({ ...newEngine, shortcut: e.target.value })}
              placeholder={t('admin.settings.site.search_engine.shortcut_placeholder')}
              className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-glass-border)',
              }}
            />
            {addError && (
              <p className="text-xs text-red-400">{addError}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddEngine}
                className="flex-1 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'rgb(34, 211, 238)', border: '1px solid rgba(6, 182, 212, 0.3)' }}
              >
                {t('admin.settings.site.search_engine.confirm_add')}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewEngine({ name: '', url: '', shortcut: '' }); setAddError('') }}
                className="px-3 py-1.5 text-sm rounded-lg transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-glass-border)' }}
              >
                {t('common.cancel')}
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('admin.settings.site.search_engine.url_hint')}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
