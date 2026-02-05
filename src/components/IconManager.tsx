import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Upload, Link2, Image, AlertCircle } from 'lucide-react'
import { CustomIcon } from '../types/bookmark'
import { cn } from '../lib/utils'

interface IconManagerProps {
  isOpen: boolean
  onClose: () => void
  customIcons: CustomIcon[]
  onAddIcon: (icon: Omit<CustomIcon, 'id' | 'createdAt'>) => void
  onDeleteIcon: (id: string) => void
  embedded?: boolean // 内嵌模式，不显示弹窗
}

export function IconManager({
  isOpen,
  onClose,
  customIcons,
  onAddIcon,
  onDeleteIcon,
  embedded = false,
}: IconManagerProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload')
  const [iconName, setIconName] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setIconName('')
    setIconUrl('')
    setPreviewUrl('')
    setError('')
    setIsUploading(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError(t('admin.icons.file_type_error'))
      return
    }

    // 检查文件大小（限制 500KB）
    if (file.size > 500 * 1024) {
      setError(t('admin.icons.file_size_error'))
      return
    }

    setIsUploading(true)
    setError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setPreviewUrl(base64)
      setIsUploading(false)
      
      // 自动生成名称
      if (!iconName) {
        const name = file.name.replace(/\.[^/.]+$/, '')
        setIconName(name)
      }
    }
    reader.onerror = () => {
      setError(t('admin.icons.read_error'))
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // 处理 URL 输入
  const handleUrlChange = (url: string) => {
    setIconUrl(url)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      setPreviewUrl(url)
      setError('')
    } else if (url) {
      setPreviewUrl('')
    }
  }

  // 添加图标
  const handleAddIcon = () => {
    if (!iconName.trim()) {
      setError(t('admin.icons.name_required'))
      return
    }

    const finalUrl = activeTab === 'upload' ? previewUrl : iconUrl
    if (!finalUrl) {
      setError(activeTab === 'upload' ? t('admin.icons.upload_required') : t('admin.icons.url_required'))
      return
    }

    onAddIcon({ name: iconName.trim(), url: finalUrl })
    resetForm()
  }

  // 删除图标确认
  const handleDeleteIcon = (id: string, name: string) => {
    if (confirm(t('admin.icons.delete_confirm', { name }))) {
      onDeleteIcon(id)
    }
  }

  // 内容组件
  const content = (
    <div className="space-y-6">
      {/* 添加新图标 */}
      <div 
        className="p-6 rounded-2xl space-y-4"
        style={{
          background: embedded ? 'var(--color-glass)' : undefined,
          border: embedded ? '1px solid var(--color-glass-border)' : undefined,
        }}
      >
        <h3 
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {t('admin.icons.add_new')}
        </h3>

        {/* Tab 切换 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              activeTab === 'upload' 
                ? 'bg-white/20' 
                : 'hover:bg-white/10'
            )}
            style={{ color: activeTab === 'upload' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
          >
            <Upload className="w-4 h-4" />
            {t('admin.icons.upload')}
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              activeTab === 'url' 
                ? 'bg-white/20' 
                : 'hover:bg-white/10'
            )}
            style={{ color: activeTab === 'url' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
          >
            <Link2 className="w-4 h-4" />
            {t('admin.icons.url')}
          </button>
        </div>

        {/* 输入区域 */}
        <div className="flex gap-4">
          {/* 预览/上传区域 */}
          <div className="flex-shrink-0">
            {activeTab === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-20 h-20 rounded-xl border-2 border-dashed',
                  'flex items-center justify-center cursor-pointer',
                  'hover:border-white/30 transition-colors',
                  previewUrl ? 'border-transparent' : 'border-white/20'
                )}
              >
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Plus className="w-6 h-6" style={{ color: 'var(--color-text-muted)' }} />
                )}
              </div>
            ) : (
              <div 
                className="w-20 h-20 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-bg-tertiary)' }}
              >
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain rounded-lg"
                    onError={() => setPreviewUrl('')}
                  />
                ) : (
                  <Link2 className="w-6 h-6" style={{ color: 'var(--color-text-muted)' }} />
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* 表单 */}
          <div className="flex-1 space-y-3">
            <input
              type="text"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              placeholder={t('admin.icons.name')}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl',
                'border focus:outline-none',
                'transition-colors',
                'placeholder:opacity-50'
              )}
              style={{ 
                color: 'var(--color-text-primary)',
                background: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-glass-border)',
              }}
            />

            {activeTab === 'url' && (
              <input
                type="url"
                value={iconUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={t('admin.icons.url_placeholder')}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl',
                  'border focus:outline-none',
                  'transition-colors',
                  'placeholder:opacity-50'
                )}
                style={{ 
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-glass-border)',
                }}
              />
            )}

            <motion.button
              onClick={handleAddIcon}
              disabled={isUploading}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl',
                'text-white font-medium',
                'hover:opacity-90 transition-opacity',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
              style={{ background: 'var(--color-primary)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              {t('admin.icons.add')}
            </motion.button>
          </div>
        </div>

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

        {/* 提示 */}
        <p 
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('admin.icons.format_hint')}
        </p>
      </div>

      {/* 图标库 */}
      <div 
        className="p-6 rounded-2xl space-y-4"
        style={{
          background: embedded ? 'var(--color-glass)' : undefined,
          border: embedded ? '1px solid var(--color-glass-border)' : undefined,
        }}
      >
        <h3 
          className="text-sm font-medium flex items-center gap-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {t('admin.icons.my_icons')}
          <span 
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ 
              color: 'var(--color-text-muted)',
              background: 'var(--color-bg-tertiary)',
            }}
          >
            {customIcons.length}
          </span>
        </h3>

        {customIcons.length === 0 ? (
          <div 
            className="text-center py-8"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('admin.icons.empty')}</p>
            <p className="text-sm mt-1">{t('admin.icons.empty_hint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {customIcons.map((icon) => (
              <motion.div
                key={icon.id}
                className="group relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div 
                  className={cn(
                    'w-full aspect-square rounded-xl p-2',
                    'flex items-center justify-center',
                    'transition-colors'
                  )}
                  style={{ 
                    background: 'var(--color-bg-tertiary)',
                  }}
                  title={icon.name}
                >
                  <img 
                    src={icon.url} 
                    alt={icon.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* 删除按钮 */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleDeleteIcon(icon.id, icon.name)}
                  className={cn(
                    'absolute -top-1.5 -right-1.5',
                    'w-5 h-5 rounded-full',
                    'bg-red-500 text-white',
                    'flex items-center justify-center',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'shadow-lg'
                  )}
                >
                  <X className="w-3 h-3" />
                </motion.button>

                {/* 名称 */}
                <p 
                  className="text-xs text-center mt-1 truncate"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {icon.name}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // 内嵌模式直接返回内容
  if (embedded) {
    return content
  }

  // 弹窗模式
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
            onClick={handleClose}
          />

          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed z-50',
              'inset-0 m-auto',
              'w-full max-w-2xl h-fit max-h-[80vh]',
              'rounded-2xl shadow-2xl',
              'flex flex-col'
            )}
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            {/* 头部 */}
            <div 
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--color-glass-border)' }}
            >
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <h2 
                  className="text-lg font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t('admin.icons.title')}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--color-glass-hover)]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-6">
              {content}
            </div>

            {/* 底部 */}
            <div 
              className="flex justify-end px-6 py-4"
              style={{ borderTop: '1px solid var(--color-glass-border)' }}
            >
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl transition-colors"
                style={{ 
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-tertiary)',
                }}
              >
                {t('admin.icons.done')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
