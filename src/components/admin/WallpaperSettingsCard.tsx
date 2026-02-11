import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Image, 
  Upload, 
  Link2, 
  CheckCircle, 
  AlertCircle,
  X,
  Shuffle,
  Eye,
  Droplets,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { SiteSettings, WallpaperSettings } from '../../lib/api'

// 图库源配置
const IMAGE_SOURCES = [
  { id: 'unsplash' as const, name: 'Picsum', baseUrl: 'https://picsum.photos/1920/1080' },
  { id: 'picsum' as const, name: 'Lorem Picsum', baseUrl: 'https://picsum.photos/id/{id}/1920/1080' },
  { id: 'pexels' as const, name: 'Bing壁纸', baseUrl: 'https://bing.img.run/1920x1080.jpg' },
]

interface WallpaperSettingsCardProps {
  settings: SiteSettings
  onChange: (settings: SiteSettings) => void
  onSave: () => Promise<void>
  isSaving: boolean
  success: boolean
  error: string
}

export function WallpaperSettingsCard({
  settings,
  onChange,
  onSave,
  isSaving,
  success,
  error,
}: WallpaperSettingsCardProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [activeSource, setActiveSource] = useState<'upload' | 'url' | 'unsplash' | 'picsum' | 'pexels'>(
    settings.wallpaper?.source || 'upload'
  )
  const [galleryLoading, setGalleryLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const wallpaper = settings.wallpaper || { enabled: false, source: 'upload', blur: 0, overlay: 30 }

  // 获取当前壁纸图片 URL
  const currentImageUrl = wallpaper.source === 'upload' ? wallpaper.imageData : wallpaper.imageUrl

  const updateWallpaper = useCallback((updates: Partial<WallpaperSettings>) => {
    onChange({
      ...settings,
      wallpaper: { ...wallpaper, ...updates },
    })
  }, [settings, wallpaper, onChange])

  // 处理文件上传
  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        return // 限制5MB
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        updateWallpaper({ 
          imageData: event.target?.result as string,
          source: 'upload',
          enabled: true,
        })
        setActiveSource('upload')
      }
      reader.readAsDataURL(file)
    }
  }, [updateWallpaper])

  // 拖拽处理
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
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  // 从图库获取随机图片
  const fetchFromGallery = useCallback((sourceId: 'unsplash' | 'picsum' | 'pexels') => {
    setGalleryLoading(true)
    let url = ''
    const rand = Math.random().toString(36).substring(7)
    
    switch (sourceId) {
      case 'unsplash':
        url = `https://picsum.photos/1920/1080?random=${rand}`
        break
      case 'picsum': {
        // Lorem Picsum - 使用随机 id (0-1084)
        const picId = Math.floor(Math.random() * 1084)
        url = `https://picsum.photos/id/${picId}/1920/1080`
        break
      }
      case 'pexels':
        // Bing 每日壁纸
        url = `https://bing.img.run/1920x1080.jpg?t=${rand}`
        break
    }
    
    updateWallpaper({
      imageUrl: url,
      source: sourceId,
      enabled: true,
    })
    setActiveSource(sourceId)
    
    // 模拟加载完成
    setTimeout(() => setGalleryLoading(false), 1500)
  }, [updateWallpaper])

  // 同步 activeSource
  useEffect(() => {
    if (wallpaper.source) {
      setActiveSource(wallpaper.source)
    }
  }, [wallpaper.source])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative group"
    >
      <div 
        className="relative overflow-hidden rounded-2xl backdrop-blur-xl p-6"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {/* Header */}
        <div className="relative flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center">
              <Image className="w-6 h-6 text-violet-500" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {t('admin.settings.wallpaper.title')}
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t('admin.settings.wallpaper.subtitle')}
            </p>
          </div>
          
          {/* 启用开关 */}
          <button
            type="button"
            onClick={() => updateWallpaper({ enabled: !wallpaper.enabled })}
            className={cn(
              'relative w-12 h-6 rounded-full transition-all duration-300',
              wallpaper.enabled
                ? 'bg-gradient-to-r from-violet-500 to-purple-500'
                : 'bg-gray-600/50'
            )}
          >
            <div
              className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                wallpaper.enabled ? 'left-7' : 'left-1'
              )}
            />
          </button>
        </div>

        <AnimatePresence>
          {wallpaper.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5 overflow-hidden"
            >
              {/* 来源选择标签 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  <Image className="w-4 h-4" />
                  {t('admin.settings.wallpaper.source')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {/* 上传 */}
                  <button
                    onClick={() => setActiveSource('upload')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                    )}
                    style={{
                      background: activeSource === 'upload' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                      color: activeSource === 'upload' ? '#fff' : 'var(--color-text-secondary)',
                      border: `1px solid ${activeSource === 'upload' ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
                    }}
                  >
                    <Upload className="w-3 h-3 inline mr-1" />
                    {t('admin.settings.wallpaper.upload')}
                  </button>
                  {/* URL */}
                  <button
                    onClick={() => setActiveSource('url')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                    )}
                    style={{
                      background: activeSource === 'url' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                      color: activeSource === 'url' ? '#fff' : 'var(--color-text-secondary)',
                      border: `1px solid ${activeSource === 'url' ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
                    }}
                  >
                    <Link2 className="w-3 h-3 inline mr-1" />
                    URL
                  </button>
                  {/* 图库 */}
                  {IMAGE_SOURCES.map((src) => (
                    <button
                      key={src.id}
                      onClick={() => {
                        setActiveSource(src.id)
                        if (src.id !== activeSource) {
                          fetchFromGallery(src.id)
                        }
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                      )}
                      style={{
                        background: activeSource === src.id ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                        color: activeSource === src.id ? '#fff' : 'var(--color-text-secondary)',
                        border: `1px solid ${activeSource === src.id ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
                      }}
                    >
                      {src.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 上传区域 */}
              {activeSource === 'upload' && (
                <div className="space-y-2">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'relative rounded-xl cursor-pointer transition-all duration-300 border-dashed overflow-hidden',
                      isDragging ? 'border-violet-500' : ''
                    )}
                    style={{
                      background: isDragging ? 'rgba(139,92,246,0.1)' : 'var(--color-bg-tertiary)',
                      border: isDragging ? '2px dashed #8b5cf6' : '2px dashed var(--color-glass-border)',
                      minHeight: '120px',
                    }}
                  >
                    {wallpaper.imageData ? (
                      <div className="relative">
                        <img 
                          src={wallpaper.imageData} 
                          alt="wallpaper" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateWallpaper({ imageData: '' })
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <Upload className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          {t('admin.settings.wallpaper.drag_hint')}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {t('admin.settings.wallpaper.size_hint')}
                        </span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file)
                      }}
                    />
                  </div>
                </div>
              )}

              {/* URL 输入 */}
              {activeSource === 'url' && (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={wallpaper.imageUrl || ''}
                      onChange={(e) => updateWallpaper({ imageUrl: e.target.value, source: 'url', enabled: true })}
                      placeholder={t('admin.settings.wallpaper.url_placeholder')}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-300"
                      style={{
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                  {wallpaper.imageUrl && wallpaper.source === 'url' && (
                    <div className="relative rounded-xl overflow-hidden">
                      <img 
                        src={wallpaper.imageUrl} 
                        alt="wallpaper preview" 
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 图库预览 + 换一张 */}
              {['unsplash', 'picsum', 'pexels'].includes(activeSource) && (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden" style={{ minHeight: '120px' }}>
                    {currentImageUrl ? (
                      <>
                        <img 
                          src={currentImageUrl}
                          alt="gallery wallpaper" 
                          className={cn(
                            'w-full h-40 object-cover transition-opacity duration-500',
                            galleryLoading ? 'opacity-50' : 'opacity-100'
                          )}
                        />
                        {galleryLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div 
                        className="w-full h-32 flex items-center justify-center rounded-xl"
                        style={{ background: 'var(--color-bg-tertiary)' }}
                      >
                        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          {t('admin.settings.wallpaper.click_refresh')}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fetchFromGallery(activeSource as 'unsplash' | 'picsum' | 'pexels')}
                    disabled={galleryLoading}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      'disabled:opacity-50'
                    )}
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <Shuffle className="w-4 h-4" />
                    {t('admin.settings.wallpaper.refresh')}
                  </button>
                </div>
              )}

              {/* 模糊度和遮罩滑块 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 模糊度 */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <Droplets className="w-4 h-4" />
                    {t('admin.settings.wallpaper.blur')}
                    <span className="ml-auto text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {wallpaper.blur || 0}px
                    </span>
                  </label>
                  <div 
                    className="px-3 py-3 rounded-xl"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  >
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={wallpaper.blur || 0}
                      onChange={(e) => updateWallpaper({ blur: Number(e.target.value) })}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                      style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-text-muted))' }}
                    />
                  </div>
                </div>

                {/* 遮罩透明度 */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <Eye className="w-4 h-4" />
                    {t('admin.settings.wallpaper.overlay')}
                    <span className="ml-auto text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {wallpaper.overlay ?? 30}%
                    </span>
                  </label>
                  <div 
                    className="px-3 py-3 rounded-xl"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  >
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={wallpaper.overlay ?? 30}
                      onChange={(e) => updateWallpaper({ overlay: Number(e.target.value) })}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                      style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-text-muted))' }}
                    />
                  </div>
                </div>
              </div>

              {/* 实时预览 */}
              {currentImageUrl && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <Eye className="w-4 h-4" />
                    {t('admin.settings.wallpaper.preview')}
                  </label>
                  <div 
                    className="relative rounded-xl overflow-hidden"
                    style={{ height: '160px' }}
                  >
                    <img 
                      src={currentImageUrl}
                      alt="preview" 
                      className="w-full h-full object-cover"
                      style={{ filter: `blur(${wallpaper.blur || 0}px)` }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{ background: `rgba(0,0,0,${(wallpaper.overlay ?? 30) / 100})` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-white/90 text-lg font-bold">NOWEN</p>
                        <p className="text-white/60 text-xs mt-1">{t('admin.settings.wallpaper.preview_hint')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
              {t('admin.settings.wallpaper.saved')}
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
            'bg-gradient-to-r from-violet-600 to-purple-600',
            'text-white shadow-lg shadow-violet-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-300'
          )}
        >
          <span className="relative z-10">
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                {t('admin.settings.wallpaper.saving')}
              </span>
            ) : t('admin.settings.wallpaper.save')}
          </span>
        </motion.button>
      </div>
    </motion.div>
  )
}
