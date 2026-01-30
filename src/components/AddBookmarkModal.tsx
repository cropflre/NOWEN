import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, Check, AlertCircle, Sparkles, BookmarkPlus } from 'lucide-react'
import { Bookmark, Category } from '../types/bookmark'
import { metadataApi } from '../lib/api'
import { cn } from '../lib/utils'

interface AddBookmarkModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (bookmark: Omit<Bookmark, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => void
  categories: Category[]
  initialUrl?: string
  editBookmark?: Bookmark | null
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
  initialUrl = '',
  editBookmark = null,
}: AddBookmarkModalProps) {
  const [url, setUrl] = useState(initialUrl)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [favicon, setFavicon] = useState('')
  const [category, setCategory] = useState('')
  const [isReadLater, setIsReadLater] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 编辑模式初始化
  useEffect(() => {
    if (editBookmark) {
      setUrl(editBookmark.url)
      setTitle(editBookmark.title)
      setDescription(editBookmark.description || '')
      setFavicon(editBookmark.favicon || '')
      setCategory(editBookmark.category || '')
      setIsReadLater(editBookmark.isReadLater || false)
      setHasAnalyzed(true)
    } else if (initialUrl) {
      setUrl(initialUrl)
      analyzeUrl(initialUrl)
    }
  }, [editBookmark, initialUrl])

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
      setCategory('')
      setIsReadLater(false)
      setError('')
      setHasAnalyzed(false)
    }
  }, [isOpen])

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
        setError('无法解析 URL')
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
      setError('请填写 URL 和标题')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    onAdd({
      url,
      title,
      description: description || undefined,
      favicon: favicon || undefined,
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
                  {editBookmark ? '编辑书签' : '添加书签'}
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
                  className="block text-sm mb-2 flex items-center gap-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  URL
                  {isAnalyzing && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--gradient-1)' }}>
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      智能分析中...
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
                    placeholder="粘贴链接，自动获取信息..."
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
                  标题
                </label>
                {isAnalyzing ? (
                  <FieldSkeleton className="h-12 w-full" />
                ) : (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="网站标题"
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
                  描述 (可选)
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
                    placeholder="简短描述"
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

              {/* 分类选择 */}
              <div>
                <label 
                  className="block text-sm mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  分类
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
                  <option value="" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>未分类</option>
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
                  标记为稍后阅读
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
                {(hasAnalyzed || editBookmark) && (title || favicon) && (
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
                        {favicon ? (
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
                  'px-5 py-2.5 rounded-xl',
                  'hover:bg-white/10 transition-colors'
                )}
                style={{ color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <motion.button
                onClick={handleSubmit}
                disabled={!url || !title || isAnalyzing}
                className={cn(
                  'px-5 py-2.5 rounded-xl',
                  'bg-gradient-to-r from-[var(--gradient-1)] to-[var(--gradient-2)]',
                  'text-white font-medium',
                  'hover:opacity-90 transition-opacity',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center gap-2'
                )}
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
                {editBookmark ? '保存' : '添加'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
