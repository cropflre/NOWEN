import { useState, useRef, useCallback } from 'react'
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
  Moon
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { SiteSettings } from '../../lib/api'

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
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>站点配置</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>自定义您的网站外观</p>
          </div>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form Fields */}
          <div className="space-y-5">
            {/* Site Title Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Type className="w-4 h-4" />
                站点标题
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.siteTitle || ''}
                  onChange={e => onChange({ ...settings, siteTitle: e.target.value })}
                  placeholder="请输入站点标题"
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
                站点图标
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
                        {settings.siteFavicon.startsWith('data:') ? '已上传本地图片' : settings.siteFavicon}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        拖拽图片或点击上传
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
                  placeholder="或输入图标 URL"
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
                光束动画
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
                    背景光束效果
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    开启后显示动态光束碰撞动画
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
                精简模式
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
                    性能优先 (Lite)
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    关闭所有耗能特效（极光、流星、3D），仅保留核心功能。
                    <span className="ml-1 opacity-75 text-emerald-500">
                      {settings.enableLiteMode ? '当前已开启' : ''}
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
                <CloudSun className="w-4 h-4" />
                天气显示
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
                    实时天气
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    在首页显示当前位置的天气信息（需要定位权限）
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
            </div>

            {/* 农历显示开关 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <Moon className="w-4 h-4" />
                农历显示
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
                    农历日期
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    在日期旁显示农历、节气和传统节日
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
          </div>

          {/* Right: Live Preview */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              <ExternalLink className="w-4 h-4" />
              实时预览
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
                    {settings.siteTitle || 'Nebula Portal'}
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
                    {settings.siteTitle || 'Nebula Portal'}
                  </motion.h1>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>探索精选网站导航</p>
                  
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
              设置保存成功
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
                保存中...
              </span>
            ) : '保存配置'}
          </span>
        </motion.button>
      </div>
    </motion.div>
  )
}
