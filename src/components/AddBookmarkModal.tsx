import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, Check, AlertCircle, Sparkles, BookmarkPlus, ChevronDown, Settings, Link2, Image } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Bookmark, Category, CustomIcon } from '../types/bookmark'
import { metadataApi } from '../lib/api'
import { cn } from '../lib/utils'
import { presetIcons, getIconComponent } from '../lib/icons'

interface AddBookmarkModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (bookmark: Omit<Bookmark, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => void
  categories: Category[]
  customIcons?: CustomIcon[]
  initialUrl?: string
  editBookmark?: Bookmark | null
  onOpenIconManager?: () => void
}

// 骨架屏组件
function FieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('skeleton rounded-lg', className)} />
  )
}

export function AddBookmarkModal({
  isOpen,
  onClose,
  onAdd,
  categories,
  customIcons = [],
  initialUrl = '',
  editBookmark = null,
  onOpenIconManager,
}: AddBookmarkModalProps) {
  const { t } = useTranslation()
  const [url, setUrl] = useState(initialUrl)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [favicon, setFavicon] = useState('')
  const [icon, setIcon] = useState('')  // lucide 图标名称
  const [iconUrl, setIconUrl] = useState('')  // 自定义图标 URL
  const [iconUrlInput, setIconUrlInput] = useState('')  // URL 输入框
  const [iconTab, setIconTab] = useState<'preset' | 'custom' | 'url'>('preset')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [category, setCategory] = useState('')
  const [isReadLater, setIsReadLater] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const iconPickerRef = useRef<HTMLDivElement>(null)

  // 编辑模式初始化
  useEffect(() => {
    if (editBookmark) {
      setUrl(editBookmark.url)
      setTitle(editBookmark.title)
      setDescription(editBookmark.description || '')
      setFavicon(editBookmark.favicon || '')
      setIcon(editBookmark.icon || '')
      setIconUrl(editBookmark.iconUrl || '')
      setIconUrlInput(editBookmark.iconUrl || '')
      setCategory(editBookmark.category || '')
      setIsReadLater(editBookmark.isReadLater || false)
      setHasAnalyzed(true)
      // 判断使用哪个 tab
      if (editBookmark.iconUrl) {
        // 检查是否是自定义图标库中的
        const isCustomIcon = customIcons.some(ci => ci.url === editBookmark.iconUrl)
        setIconTab(isCustomIcon ? 'custom' : 'url')
      } else if (editBookmark.icon) {
        setIconTab('preset')
      }
    } else if (initialUrl) {
      setUrl(initialUrl)
      analyzeUrl(initialUrl)
    }
  }, [editBookmark, initialUrl, customIcons])

  // 打开时聚焦
  useEffect(() => {
    if (isOpen && !editBookmark) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, editBookmark])

  // 重置表单
  useEffect(() => {
    if (!isOpen) {
      setUrl('')
      setTitle('')
      setDescription('')
      setFavicon('')
      setIcon('')
      setIconUrl('')
      setIconUrlInput('')
      setIconTab('preset')
      setCategory('')
      setIsReadLater(false)
      setError('')
      setHasAnalyzed(false)
      setShowIconPicker(false)
    }
  }, [isOpen])

  // 点击外部关闭图标选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 智能抓取元数据
  const analyzeUrl = async (inputUrl: string) => {
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      return
    }

    setIsAnalyzing(true)
    setHasAnalyzed(false)
    setError('')
    setTitle('')
    setDescription('')
    setFavicon('')

    try {
      const metadata = await metadataApi.parse(inputUrl)
      
      if (metadata.error) {
        throw new Error(metadata.error)
      }

      setTitle(metadata.title || '')
      setDescription(metadata.description || '')
      setFavicon(metadata.favicon || '')
      setHasAnalyzed(true)
    } catch (err) {
      console.error('抓取失败:', err)
      // 使用默认值
      try {
        const urlObj = new URL(inputUrl)
        const domain = urlObj.hostname.replace('www.', '')
        setTitle(domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0])
        setFavicon(`https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`)
        setHasAnalyzed(true)
        // 震动提示
        setShake(true)
        setTimeout(() => setShake(false), 500)
      } catch {
        setError(t('bookmark.modal.url_parse_error'))
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 监听粘贴事件
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text')
    if (pastedText.startsWith('http://') || pastedText.startsWith('https://')) {
      setTimeout(() => analyzeUrl(pastedText), 100)
    }
  }

  const handleUrlBlur = () => {
    if (url && !hasAnalyzed) {
      analyzeUrl(url)
    }
  }

  const handleSubmit = () => {
    if (!url || !title) {
      setError(t('bookmark.modal.required_error'))
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    onAdd({
      url,
      title,
      description: description || undefined,
      favicon: favicon || undefined,
      icon: icon || undefined,
      iconUrl: iconUrl || undefined,
      category: category || undefined,
      isReadLater,
    })

    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 command-backdrop"
            onClick={onClose}
          />

          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: shake ? [0, -10, 10, -10, 10, 0] : 0,
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              x: { duration: 0.4 }
            }}
            className={cn(
              'fixed z-50',
              'inset-0 m-auto',
              'w-full max-w-lg h-fit',
              'rounded-2xl glass shadow-2xl'
            )}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5" style={{ color: 'var(--gradient-1)' }} />
                <h2 
                  className="text-lg font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {editBookmark ? t('bookmark.edit') : t('bookmark.add')}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 表单 */}
            <div className="px-6 py-5 space-y-5">
              {/* URL 输入 */}
              <div>
                <label 
                  className="text-sm mb-2 flex items-center gap-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  URL
                  {isAnalyzing && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--gradient-1)' }}>
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      {t('bookmark.modal.analyzing')}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={handleUrlBlur}
                    onPaste={handlePaste}
                    placeholder={t('bookmark.modal.url_placeholder')}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl glass',
                      'border border-white/10 focus:border-white/30',
                      'outline-none transition-colors',
                      'placeholder:text-white/30'
                    )}
                    style={{ color: 'var(--text-primary)' }}
                  />
                  {isAnalyzing && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--gradient-1)' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* 标题 - 带骨架屏 */}
              <div>
                <label 
                  className="block text-sm mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('bookmark.modal.title')}
                </label>
                {isAnalyzing ? (
                  <FieldSkeleton className="h-12 w-full" />
                ) : (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('bookmark.modal.title_placeholder')}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl glass',
                      'border border-white/10 focus:border-white/30',
                      'outline-none transition-colors',
                      'placeholder:text-white/30'
                    )}
                    style={{ color: 'var(--text-primary)' }}
                  />
                )}
              </div>

              {/* 描述 - 带骨架屏 */}
              <div>
                <label 
                  className="block text-sm mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('bookmark.modal.description_optional')}
                </label>
                {isAnalyzing ? (
                  <div className="space-y-2">
                    <FieldSkeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('bookmark.modal.description_placeholder')}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl glass',
                      'border border-white/10 focus:border-white/30',
                      'outline-none transition-colors',
                      'placeholder:text-white/30'
                    )}
                    style={{ color: 'var(--text-primary)' }}
                  />
                )}
              </div>

              {/* 图标选择 */}
              <div ref={iconPickerRef} className="relative z-20">
                <div className="flex items-center justify-between mb-2">
                  <label 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t('bookmark.modal.custom_icon')}
                  </label>
                  {onOpenIconManager && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowIconPicker(false)
                        onOpenIconManager()
                      }}
                      className="text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--gradient-1)' }}
                    >
                      <Settings className="w-3 h-3" />
                      {t('bookmark.modal.manage_icons')}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl glass',
                    'border border-white/10 hover:border-white/30',
                    'transition-colors flex items-center justify-between'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {iconUrl ? (
                      <>
                        <img src={iconUrl} alt="" className="w-5 h-5 object-contain" />
                        <span style={{ color: 'var(--text-primary)' }} className="truncate max-w-[200px]">
                          {customIcons.find(ci => ci.url === iconUrl)?.name || t('bookmark.modal.custom_image')}
                        </span>
                      </>
                    ) : icon ? (
                      <>
                        {(() => {
                          const IconComp = getIconComponent(icon)
                          return <IconComp className="w-5 h-5" style={{ color: 'var(--gradient-1)' }} />
                        })()}
                        <span style={{ color: 'var(--text-primary)' }}>{icon}</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>{t('bookmark.modal.use_website_icon')}</span>
                    )}
                  </div>
                  <ChevronDown 
                    className={cn(
                      'w-4 h-4 transition-transform flex-shrink-0',
                      showIconPicker && 'rotate-180'
                    )} 
                    style={{ color: 'var(--text-muted)' }} 
                  />
                </button>

                {/* 图标选择器弹出层 - 向上弹出 */}
                <AnimatePresence>
                  {showIconPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'absolute z-50 left-0 right-0 bottom-full mb-2',
                        'p-3 rounded-xl shadow-xl',
                        'border',
                        'max-h-[260px] overflow-y-auto'
                      )}
                      style={{
                        background: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-glass-border)',
                      }}
                    >
                      {/* Tab 切换 */}
                      <div 
                        className="flex gap-1 mb-3 p-1 rounded-lg"
                        style={{ background: 'var(--color-bg-tertiary)' }}
                      >
                        <button
                          type="button"
                          onClick={() => setIconTab('preset')}
                          className={cn(
                            'flex-1 px-3 py-1.5 rounded-md text-xs transition-colors'
                          )}
                          style={{ 
                            background: iconTab === 'preset' ? 'var(--color-bg-secondary)' : 'transparent',
                            color: iconTab === 'preset' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                          }}
                        >
                          {t('bookmark.modal.preset_icons')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIconTab('custom')}
                          className={cn(
                            'flex-1 px-3 py-1.5 rounded-md text-xs transition-colors flex items-center justify-center gap-1'
                          )}
                          style={{ 
                            background: iconTab === 'custom' ? 'var(--color-bg-secondary)' : 'transparent',
                            color: iconTab === 'custom' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                          }}
                        >
                          <Image className="w-3 h-3" />
                          {t('bookmark.modal.my_icons')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIconTab('url')}
                          className={cn(
                            'flex-1 px-3 py-1.5 rounded-md text-xs transition-colors flex items-center justify-center gap-1'
                          )}
                          style={{ 
                            background: iconTab === 'url' ? 'var(--color-bg-secondary)' : 'transparent',
                            color: iconTab === 'url' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                          }}
                        >
                          <Link2 className="w-3 h-3" />
                          URL
                        </button>
                      </div>

                      {/* 清除选项 */}
                      <button
                        type="button"
                        onClick={() => {
                          setIcon('')
                          setIconUrl('')
                          setIconUrlInput('')
                          setShowIconPicker(false)
                        }}
                        className={cn(
                          'w-full px-3 py-2 mb-2 rounded-lg',
                          'text-sm text-left transition-colors'
                        )}
                        style={{ 
                          color: 'var(--color-text-secondary)',
                          background: !icon && !iconUrl ? 'var(--color-bg-tertiary)' : 'transparent'
                        }}
                      >
                        {t('bookmark.modal.use_website_icon')}
                      </button>
                      
                      <div 
                        className="my-2" 
                        style={{ borderTop: '1px solid var(--color-glass-border)' }}
                      />
                      
                      {/* 预设图标网格 */}
                      {iconTab === 'preset' && (
                        <div className="grid grid-cols-6 gap-1">
                          {presetIcons.map(({ name, icon: IconComp }) => (
                            <motion.button
                              key={name}
                              type="button"
                              onClick={() => {
                                setIcon(name)
                                setIconUrl('')
                                setShowIconPicker(false)
                              }}
                              className={cn(
                                'p-2.5 rounded-lg transition-colors'
                              )}
                              style={{
                                background: icon === name && !iconUrl ? 'var(--color-bg-tertiary)' : 'transparent',
                                boxShadow: icon === name && !iconUrl ? 'inset 0 0 0 1px var(--color-primary)' : 'none'
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title={name}
                            >
                              <IconComp 
                                className="w-5 h-5 mx-auto" 
                                style={{ color: icon === name && !iconUrl ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} 
                              />
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {/* 自定义图标库 */}
                      {iconTab === 'custom' && (
                        <div>
                          {customIcons.length === 0 ? (
                            <div 
                              className="text-center py-6"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">{t('bookmark.modal.no_custom_icons')}</p>
                              {onOpenIconManager && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowIconPicker(false)
                                    onOpenIconManager()
                                  }}
                                  className="text-xs mt-2 hover:opacity-80"
                                  style={{ color: 'var(--color-primary)' }}
                                >
                                  {t('bookmark.modal.go_add')}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="grid grid-cols-5 gap-2">
                              {customIcons.map((customIcon) => (
                                <motion.button
                                  key={customIcon.id}
                                  type="button"
                                  onClick={() => {
                                    setIconUrl(customIcon.url)
                                    setIcon('')
                                    setShowIconPicker(false)
                                  }}
                                  className={cn(
                                    'p-2 rounded-lg transition-colors'
                                  )}
                                  style={{
                                    background: iconUrl === customIcon.url ? 'var(--color-bg-tertiary)' : 'transparent',
                                    boxShadow: iconUrl === customIcon.url ? 'inset 0 0 0 1px var(--color-primary)' : 'none'
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title={customIcon.name}
                                >
                                  <img 
                                    src={customIcon.url} 
                                    alt={customIcon.name}
                                    className="w-8 h-8 mx-auto object-contain"
                                  />
                                  <p 
                                    className="text-xs mt-1 truncate text-center"
                                    style={{ color: 'var(--color-text-muted)' }}
                                  >
                                    {customIcon.name}
                                  </p>
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* URL 输入 */}
                      {iconTab === 'url' && (
                        <div className="space-y-3">
                          <input
                            type="url"
                            value={iconUrlInput}
                            onChange={(e) => setIconUrlInput(e.target.value)}
                            placeholder="https://example.com/icon.png"
                            className={cn(
                              'w-full px-3 py-2 rounded-lg',
                              'border outline-none transition-colors text-sm'
                            )}
                            style={{ 
                              color: 'var(--color-text-primary)',
                              background: 'var(--color-bg-tertiary)',
                              borderColor: 'var(--color-glass-border)',
                            }}
                          />
                          <div className="flex gap-2">
                            {iconUrlInput && (
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: 'var(--color-bg-tertiary)' }}
                              >
                                <img 
                                  src={iconUrlInput} 
                                  alt="Preview"
                                  className="w-8 h-8 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                              </div>
                            )}
                            <motion.button
                              type="button"
                              onClick={() => {
                                if (iconUrlInput) {
                                  setIconUrl(iconUrlInput)
                                  setIcon('')
                                  setShowIconPicker(false)
                                }
                              }}
                              disabled={!iconUrlInput}
                              className={cn(
                                'flex-1 px-3 py-2 rounded-lg text-sm',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                              )}
                              style={{ 
                                background: 'var(--color-primary)',
                                color: 'white',
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {t('bookmark.modal.use_this_image')}
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 分类选择 */}
              <div>
                <label 
                  className="block text-sm mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('bookmark.modal.category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'border outline-none transition-colors',
                    'cursor-pointer'
                  )}
                  style={{ 
                    color: 'var(--color-text-primary)',
                    background: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-glass-border)',
                  }}
                >
                  <option value="" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>{t('bookmark.modal.uncategorized')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 稍后阅读开关 */}
              <div className="flex items-center justify-between">
                <label 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('bookmark.mark_read_later')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsReadLater(!isReadLater)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    isReadLater 
                      ? 'bg-gradient-to-r from-[var(--gradient-1)] to-[var(--gradient-2)]' 
                      : 'bg-white/10'
                  )}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                    animate={{ left: isReadLater ? 'calc(100% - 20px)' : '4px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* 预览卡片 */}
              <AnimatePresence>
                {(hasAnalyzed || editBookmark) && (title || favicon || icon || iconUrl) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="p-4 rounded-xl glass border border-white/10 relative overflow-hidden"
                  >
                    {/* 新卡片光环效果 */}
                    {!editBookmark && (
                      <motion.div
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 bg-gradient-to-r from-[var(--gradient-1)]/20 to-[var(--gradient-2)]/20"
                      />
                    )}
                    <div className="flex items-center gap-4 relative">
                      {/* 图标容器 - 统一底座 */}
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 p-1.5">
                        {iconUrl ? (
                          <img 
                            src={iconUrl} 
                            alt="" 
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : icon ? (
                          (() => {
                            const IconComp = getIconComponent(icon)
                            return <IconComp className="w-7 h-7" style={{ color: 'var(--gradient-1)' }} />
                          })()
                        ) : favicon ? (
                          <img 
                            src={favicon} 
                            alt="" 
                            className="w-full h-full object-contain rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <span 
                            className="text-xl font-semibold"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {title?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div 
                          className="font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {title || 'Untitled'}
                        </div>
                        {description && (
                          <div 
                            className="text-sm mt-0.5 line-clamp-2"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {description}
                          </div>
                        )}
                      </div>
                      {isReadLater && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-500" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 分析中骨架屏预览 */}
              {isAnalyzing && (
                <div className="p-4 rounded-xl glass border border-white/10">
                  <div className="flex items-center gap-4">
                    <FieldSkeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <FieldSkeleton className="h-5 w-3/4" />
                      <FieldSkeleton className="h-4 w-full" />
                    </div>
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={onClose}
                className={cn(
                  'px-5 py-2.5 rounded-xl transition-colors'
                )}
                style={{ 
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-bg-tertiary)',
                }}
              >
                {t('bookmark.cancel')}
              </button>
              <motion.button
                onClick={handleSubmit}
                disabled={!url || !title || isAnalyzing}
                className={cn(
                  'px-5 py-2.5 rounded-xl',
                  'text-white font-medium',
                  'hover:opacity-90 transition-opacity',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center gap-2'
                )}
                style={{
                  background: 'var(--color-primary)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editBookmark ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editBookmark ? t('bookmark.save') : t('common.add')}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
