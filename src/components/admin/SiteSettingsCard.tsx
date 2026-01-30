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
  Sparkles
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
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6">
        {/* Animated Border Gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Header */}
        <div className="relative flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="absolute -inset-2 rounded-xl bg-cyan-500/20 blur-xl opacity-50 -z-10" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">站点配置</h3>
            <p className="text-sm text-white/40">自定义您的网站外观</p>
          </div>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form Fields */}
          <div className="space-y-5">
            {/* Site Title Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white/60">
                <Type className="w-4 h-4" />
                站点标题
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.siteTitle || ''}
                  onChange={e => onChange({ ...settings, siteTitle: e.target.value })}
                  placeholder="请输入站点标题"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-black/20 border border-white/10',
                    'text-white placeholder:text-white/30',
                    'focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
                    'transition-all duration-300'
                  )}
                />
              </div>
            </div>

            {/* Site Favicon Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white/60">
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
                  'relative px-4 py-3 rounded-xl cursor-pointer transition-all duration-300',
                  'bg-black/20 border border-dashed',
                  isDragging 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : 'border-white/10 hover:border-white/20'
                )}
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
                      <span className="text-sm text-white/50 truncate flex-1">
                        {settings.siteFavicon.startsWith('data:') ? '已上传本地图片' : settings.siteFavicon}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-white/30" />
                      <span className="text-sm text-white/30">
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
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-black/20 border border-white/10',
                    'text-white placeholder:text-white/30',
                    'focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
                    'transition-all duration-300'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-white/60">
              <ExternalLink className="w-4 h-4" />
              实时预览
            </label>
            
            {/* Browser Preview */}
            <div className="rounded-xl overflow-hidden bg-black/40 border border-white/10">
              {/* Browser Tab Bar */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border-b border-white/10">
                {/* Window Controls */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                
                {/* Tab */}
                <div className="flex items-center gap-2 ml-4 px-3 py-1.5 rounded-t-lg bg-white/5 border-t border-x border-white/10">
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
                  <span className="text-xs text-white/70 truncate max-w-[120px]">
                    {settings.siteTitle || 'Nebula Portal'}
                  </span>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="p-6 min-h-[140px] bg-gradient-to-b from-[#0a0a0f] to-[#0d0d15] relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
                </div>
                
                {/* Hero Preview */}
                <div className="relative text-center space-y-2">
                  <motion.h1 
                    key={settings.siteTitle}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60"
                  >
                    {settings.siteTitle || 'Nebula Portal'}
                  </motion.h1>
                  <p className="text-xs text-white/30">探索精选网站导航</p>
                  
                  {/* Mini Cards Preview */}
                  <div className="flex justify-center gap-2 mt-4">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i}
                        className="w-12 h-8 rounded-lg bg-white/5 border border-white/10"
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
