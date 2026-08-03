import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle,
  Droplets,
  Eye,
  Image,
  Link2,
  Shuffle,
  Upload,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { SiteSettings, WallpaperSettings } from '../../lib/api'

type WallpaperSource = NonNullable<WallpaperSettings['source']>
type GallerySource = Extract<WallpaperSource, 'unsplash' | 'picsum' | 'pexels'>

const IMAGE_SOURCES: Array<{ id: GallerySource; name: string }> = [
  { id: 'unsplash', name: 'Picsum' },
  { id: 'picsum', name: 'Lorem Picsum' },
  { id: 'pexels', name: 'Bing壁纸' },
]

const FALLBACK_WALLPAPER: Required<Pick<WallpaperSettings, 'enabled' | 'source' | 'blur' | 'overlay'>> = {
  enabled: false,
  source: 'upload',
  blur: 0,
  overlay: 30,
}

const COPY = {
  zh: {
    invalidFile: '请选择有效的图片文件。',
    fileTooLarge: '图片不能超过 5MB。',
    missingImage: '请先上传图片或填写图片 URL。',
    invalidUrl: '请输入有效的 HTTP 或 HTTPS 图片地址。',
    loadFailed: '图片加载失败，请检查地址、跨域限制或网络状态。',
    visibilityWarning: '当前模糊度和遮罩较高，壁纸可能几乎不可见。',
    homepageHint: '保存后返回前台首页查看最终效果。',
  },
  en: {
    invalidFile: 'Please choose a valid image file.',
    fileTooLarge: 'The image must be 5 MB or smaller.',
    missingImage: 'Upload an image or enter an image URL first.',
    invalidUrl: 'Enter a valid HTTP or HTTPS image URL.',
    loadFailed: 'The image could not be loaded. Check the URL, CORS policy, or network.',
    visibilityWarning: 'The current blur and overlay may make the wallpaper almost invisible.',
    homepageHint: 'Return to the homepage after saving to view the final result.',
  },
  ja: {
    invalidFile: '有効な画像ファイルを選択してください。',
    fileTooLarge: '画像は 5MB 以下にしてください。',
    missingImage: '画像をアップロードするか、画像 URL を入力してください。',
    invalidUrl: '有効な HTTP または HTTPS の画像 URL を入力してください。',
    loadFailed: '画像を読み込めません。URL、CORS、ネットワークを確認してください。',
    visibilityWarning: 'ぼかしとオーバーレイが強いため、壁紙がほとんど見えない可能性があります。',
    homepageHint: '保存後、ホーム画面に戻って最終結果を確認してください。',
  },
  ko: {
    invalidFile: '올바른 이미지 파일을 선택하세요.',
    fileTooLarge: '이미지는 5MB 이하여야 합니다.',
    missingImage: '이미지를 업로드하거나 이미지 URL을 입력하세요.',
    invalidUrl: '올바른 HTTP 또는 HTTPS 이미지 URL을 입력하세요.',
    loadFailed: '이미지를 불러오지 못했습니다. URL, CORS 또는 네트워크를 확인하세요.',
    visibilityWarning: '현재 흐림 및 오버레이 값으로는 배경화면이 거의 보이지 않을 수 있습니다.',
    homepageHint: '저장 후 홈 화면으로 돌아가 최종 결과를 확인하세요.',
  },
} as const

interface WallpaperSettingsCardProps {
  settings: SiteSettings
  onChange: (settings: SiteSettings) => void
  onSave: () => Promise<void>
  isSaving: boolean
  success: boolean
  error: string
}

function isHttpImageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function createGalleryUrl(source: GallerySource): string {
  const nonce = Math.random().toString(36).slice(2)

  if (source === 'unsplash') {
    return `https://picsum.photos/1920/1080?random=${nonce}`
  }

  if (source === 'picsum') {
    const imageId = Math.floor(Math.random() * 1084)
    return `https://picsum.photos/id/${imageId}/1920/1080`
  }

  return `https://bing.img.run/1920x1080.jpg?t=${nonce}`
}

export function WallpaperSettingsCard({
  settings,
  onChange,
  onSave,
  isSaving,
  success,
  error,
}: WallpaperSettingsCardProps) {
  const { t, i18n } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const [localError, setLocalError] = useState('')

  const language = i18n.language.split('-')[0] as keyof typeof COPY
  const copy = COPY[language] || COPY.en

  const wallpaper: WallpaperSettings = {
    ...FALLBACK_WALLPAPER,
    ...settings.wallpaper,
  }
  const activeSource: WallpaperSource = wallpaper.source || 'upload'
  const imageUrl = activeSource === 'upload'
    ? wallpaper.imageData?.trim() || ''
    : wallpaper.imageUrl?.trim() || ''
  const isExternalSource = activeSource !== 'upload'
  const externalUrlValid = !isExternalSource || !imageUrl || isHttpImageUrl(imageUrl)
  const hasUsableImage = Boolean(imageUrl) && externalUrlValid && !previewError
  const canSave = wallpaper.enabled !== true || hasUsableImage
  const visibilityWarning = (wallpaper.overlay ?? 30) >= 80 && (wallpaper.blur ?? 0) >= 14

  const updateWallpaper = useCallback((updates: Partial<WallpaperSettings>) => {
    onChange({
      ...settings,
      wallpaper: {
        ...FALLBACK_WALLPAPER,
        ...settings.wallpaper,
        ...updates,
      },
    })
  }, [onChange, settings])

  useEffect(() => {
    setPreviewError(false)
    setLocalError('')
  }, [activeSource, imageUrl])

  const selectSource = useCallback((source: WallpaperSource) => {
    setLocalError('')
    setPreviewError(false)

    if (source === 'upload' || source === 'url') {
      updateWallpaper({ source, enabled: true })
      return
    }

    setGalleryLoading(true)
    updateWallpaper({
      source,
      imageUrl: createGalleryUrl(source),
      enabled: true,
    })
  }, [updateWallpaper])

  const refreshGallery = useCallback(() => {
    if (!['unsplash', 'picsum', 'pexels'].includes(activeSource)) return

    setGalleryLoading(true)
    setPreviewError(false)
    setLocalError('')
    updateWallpaper({
      source: activeSource,
      imageUrl: createGalleryUrl(activeSource as GallerySource),
      enabled: true,
    })
  }, [activeSource, updateWallpaper])

  const handleFileSelect = useCallback((file: File) => {
    setLocalError('')
    setPreviewError(false)

    if (!file.type.startsWith('image/')) {
      setLocalError(copy.invalidFile)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setLocalError(copy.fileTooLarge)
      return
    }

    const reader = new FileReader()
    reader.onerror = () => setLocalError(copy.invalidFile)
    reader.onload = (event) => {
      const imageData = typeof event.target?.result === 'string' ? event.target.result : ''
      if (!imageData) {
        setLocalError(copy.invalidFile)
        return
      }

      updateWallpaper({
        imageData,
        source: 'upload',
        enabled: true,
      })
    }
    reader.readAsDataURL(file)
  }, [copy.fileTooLarge, copy.invalidFile, updateWallpaper])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleImageError = useCallback(() => {
    setGalleryLoading(false)
    setPreviewError(true)
    setLocalError(copy.loadFailed)
  }, [copy.loadFailed])

  const handleImageLoad = useCallback(() => {
    setGalleryLoading(false)
    setPreviewError(false)
    setLocalError('')
  }, [])

  const handleSave = useCallback(async () => {
    if (wallpaper.enabled) {
      if (!imageUrl) {
        setLocalError(copy.missingImage)
        return
      }
      if (isExternalSource && !isHttpImageUrl(imageUrl)) {
        setLocalError(copy.invalidUrl)
        return
      }
      if (previewError) {
        setLocalError(copy.loadFailed)
        return
      }
    }

    setLocalError('')
    await onSave()
  }, [copy.invalidUrl, copy.loadFailed, copy.missingImage, imageUrl, isExternalSource, onSave, previewError, wallpaper.enabled])

  const sourceButtonStyle = useCallback((selected: boolean) => ({
    background: selected ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
    color: selected ? '#fff' : 'var(--color-text-secondary)',
    border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
  }), [])

  const displayedError = localError || error

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
        <div className="relative flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center">
            <Image className="w-6 h-6 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {t('admin.settings.wallpaper.title')}
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t('admin.settings.wallpaper.subtitle')}
            </p>
          </div>
          <button
            type="button"
            aria-pressed={wallpaper.enabled === true}
            onClick={() => updateWallpaper({ enabled: !wallpaper.enabled })}
            className={cn(
              'relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0',
              wallpaper.enabled
                ? 'bg-gradient-to-r from-violet-500 to-purple-500'
                : 'bg-gray-600/50',
            )}
          >
            <span
              className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                wallpaper.enabled ? 'left-7' : 'left-1',
              )}
            />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {wallpaper.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5 overflow-hidden"
            >
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  <Image className="w-4 h-4" />
                  {t('admin.settings.wallpaper.source')}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => selectSource('upload')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={sourceButtonStyle(activeSource === 'upload')}
                  >
                    <Upload className="w-3 h-3 inline mr-1" />
                    {t('admin.settings.wallpaper.upload')}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectSource('url')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={sourceButtonStyle(activeSource === 'url')}
                  >
                    <Link2 className="w-3 h-3 inline mr-1" />
                    URL
                  </button>
                  {IMAGE_SOURCES.map((source) => (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => selectSource(source.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                      style={sourceButtonStyle(activeSource === source.id)}
                    >
                      {source.name}
                    </button>
                  ))}
                </div>
              </div>

              {activeSource === 'upload' && (
                <div
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault()
                    setIsDragging(false)
                  }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative rounded-xl cursor-pointer transition-all duration-300 overflow-hidden"
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
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          updateWallpaper({ imageData: '' })
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
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
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) handleFileSelect(file)
                      event.target.value = ''
                    }}
                  />
                </div>
              )}

              {activeSource === 'url' && (
                <input
                  type="url"
                  inputMode="url"
                  value={wallpaper.imageUrl || ''}
                  onChange={(event) => updateWallpaper({
                    imageUrl: event.target.value,
                    source: 'url',
                    enabled: true,
                  })}
                  placeholder={t('admin.settings.wallpaper.url_placeholder')}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-300"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: `1px solid ${externalUrlValid ? 'var(--color-glass-border)' : 'rgb(248 113 113)'}`,
                    color: 'var(--color-text-primary)',
                  }}
                />
              )}

              {['unsplash', 'picsum', 'pexels'].includes(activeSource) && (
                <button
                  type="button"
                  onClick={refreshGallery}
                  disabled={galleryLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <Shuffle className="w-4 h-4" />
                  {t('admin.settings.wallpaper.refresh')}
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <Droplets className="w-4 h-4" />
                    {t('admin.settings.wallpaper.blur')}
                    <span className="ml-auto text-xs font-mono">{wallpaper.blur ?? 0}px</span>
                  </label>
                  <div className="px-3 py-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={wallpaper.blur ?? 0}
                      onChange={(event) => updateWallpaper({ blur: Number(event.target.value) })}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                      style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-text-muted))' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <Eye className="w-4 h-4" />
                    {t('admin.settings.wallpaper.overlay')}
                    <span className="ml-auto text-xs font-mono">{wallpaper.overlay ?? 30}%</span>
                  </label>
                  <div className="px-3 py-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={wallpaper.overlay ?? 30}
                      onChange={(event) => updateWallpaper({ overlay: Number(event.target.value) })}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                      style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-text-muted))' }}
                    />
                  </div>
                </div>
              </div>

              {visibilityWarning && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {copy.visibilityWarning}
                </div>
              )}

              {imageUrl && externalUrlValid && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <Eye className="w-4 h-4" />
                    {t('admin.settings.wallpaper.preview')}
                  </label>
                  <div className="relative rounded-xl overflow-hidden bg-black/30" style={{ height: '180px' }}>
                    <img
                      key={imageUrl}
                      src={imageUrl}
                      alt="wallpaper preview"
                      className={cn(
                        'w-full h-full object-cover transition-opacity duration-300',
                        galleryLoading && 'opacity-50',
                      )}
                      style={{
                        filter: `blur(${wallpaper.blur ?? 0}px)`,
                        transform: 'scale(1.08)',
                      }}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: `rgba(0,0,0,${(wallpaper.overlay ?? 30) / 100})` }}
                    />
                    {galleryLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <div>
                        <p className="text-white/90 text-lg font-bold">NOWEN</p>
                        <p className="text-white/60 text-xs mt-1">{t('admin.settings.wallpaper.preview_hint')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {copy.homepageHint}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {displayedError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {displayedError}
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

        <motion.button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !canSave}
          whileHover={{ scale: isSaving || !canSave ? 1 : 1.02 }}
          whileTap={{ scale: isSaving || !canSave ? 1 : 0.98 }}
          className={cn(
            'relative w-full mt-6 py-3 rounded-xl font-medium overflow-hidden',
            'bg-gradient-to-r from-violet-600 to-purple-600',
            'text-white shadow-lg shadow-violet-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-300',
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
