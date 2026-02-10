import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Database, 
  Download, 
  Upload, 
  FileJson,
  CheckCircle, 
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  RotateCcw,
  AlertTriangle
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Bookmark, Category } from '../../types/bookmark'
import { SiteSettings, factoryReset } from '../../lib/api'

interface ExportData {
  version: string
  exportedAt: string
  data: {
    bookmarks: Bookmark[]
    categories: Category[]
    settings: SiteSettings
  }
}

interface DataManagementCardProps {
  bookmarks: Bookmark[]
  categories: Category[]
  settings: SiteSettings
  onImport: (data: ExportData['data']) => Promise<void>
  onFactoryReset?: () => void
}

export function DataManagementCard({
  bookmarks,
  categories,
  settings,
  onImport,
  onFactoryReset,
}: DataManagementCardProps) {
  const { t, i18n } = useTranslation()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 导出数据
  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    setSuccess(null)

    try {
      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: {
          bookmarks,
          categories,
          settings,
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `nebula-portal-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess(t('admin.settings.data.export_success'))
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || t('admin.settings.data.export_error'))
    } finally {
      setIsExporting(false)
    }
  }

  // 导入数据
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setError(null)
    setSuccess(null)

    try {
      const text = await file.text()
      const data: ExportData = JSON.parse(text)

      // 验证数据格式
      if (!data.version || !data.data) {
        throw new Error(t('admin.settings.data.invalid_format'))
      }

      if (!data.data.bookmarks || !Array.isArray(data.data.bookmarks)) {
        throw new Error(t('admin.settings.data.no_bookmarks'))
      }

      // 确认导入
      const confirmMsg = t('admin.settings.data.import_confirm', {
        bookmarks: data.data.bookmarks?.length || 0,
        categories: data.data.categories?.length || 0,
        time: new Date(data.exportedAt).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US')
      })

      if (!confirm(confirmMsg)) {
        setIsImporting(false)
        return
      }

      await onImport(data.data)

      setSuccess(t('admin.settings.data.import_success', {
        bookmarks: data.data.bookmarks.length,
        categories: data.data.categories?.length || 0
      }))
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError(t('admin.settings.data.json_error'))
      } else {
        setError(err.message || t('admin.settings.data.import_error'))
      }
    } finally {
      setIsImporting(false)
      // 重置 input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 恢复出厂设置
  const handleFactoryReset = async () => {
    setIsResetting(true)
    setError(null)
    setSuccess(null)

    try {
      await factoryReset()
      setSuccess(t('admin.settings.data.reset_success'))
      setShowResetConfirm(false)
      
      // 通知父组件刷新数据
      if (onFactoryReset) {
        onFactoryReset()
      }
      
      // 延迟后刷新页面，让用户看到成功提示
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message || '恢复出厂设置失败')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative group"
    >
      {/* Card Container */}
      <div 
        className="relative overflow-hidden rounded-2xl backdrop-blur-xl p-6"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {/* Animated Border Gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-transparent to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:block hidden" />
        
        {/* Header */}
        <div className="relative flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center">
              <Database className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="absolute -inset-2 rounded-xl bg-emerald-500/20 blur-xl opacity-50 -z-10 dark:block hidden" />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.title')}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.subtitle')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-4 mb-6">
          <div 
            className="p-3 rounded-xl"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <FileText className="w-4 h-4" />
              <span className="text-xs">{t('admin.settings.data.stats.bookmarks')}</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{bookmarks.length}</p>
          </div>
          <div 
            className="p-3 rounded-xl"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <Layers className="w-4 h-4" />
              <span className="text-xs">{t('admin.settings.data.stats.categories')}</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{categories.length}</p>
          </div>
          <div 
            className="p-3 rounded-xl"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <Calendar className="w-4 h-4" />
              <span className="text-xs">{t('admin.settings.data.stats.today')}</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {new Date().toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="relative grid grid-cols-2 gap-4">
          {/* Export Button */}
          <motion.button
            onClick={handleExport}
            disabled={isExporting}
            whileHover={{ scale: isExporting ? 1 : 1.02 }}
            whileTap={{ scale: isExporting ? 1 : 0.98 }}
            className={cn(
              'flex flex-col items-center gap-3 p-5 rounded-xl',
              'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
              'border border-emerald-500/20 hover:border-emerald-500/40',
              'transition-all duration-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              {isExporting ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full"
                />
              ) : (
                <Download className="w-5 h-5 text-emerald-500" />
              )}
            </div>
            <div className="text-center">
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.export')}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.export_desc')}</p>
            </div>
          </motion.button>

          {/* Import Button */}
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            whileHover={{ scale: isImporting ? 1 : 1.02 }}
            whileTap={{ scale: isImporting ? 1 : 0.98 }}
            className={cn(
              'flex flex-col items-center gap-3 p-5 rounded-xl',
              'bg-gradient-to-br from-blue-500/10 to-indigo-500/10',
              'border border-blue-500/20 hover:border-blue-500/40',
              'transition-all duration-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              {isImporting ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full"
                />
              ) : (
                <Upload className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="text-center">
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.import')}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.import_desc')}</p>
            </div>
          </motion.button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* Factory Reset Button */}
        <motion.button
          onClick={() => setShowResetConfirm(true)}
          disabled={isResetting}
          whileHover={{ scale: isResetting ? 1 : 1.02 }}
          whileTap={{ scale: isResetting ? 1 : 0.98 }}
          className={cn(
            'relative w-full mt-4 flex items-center justify-center gap-3 p-4 rounded-xl',
            'bg-gradient-to-br from-red-500/10 to-orange-500/10',
            'border border-red-500/20 hover:border-red-500/40',
            'transition-all duration-300',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            {isResetting ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full"
              />
            ) : (
              <RotateCcw className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="text-left">
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.factory_reset')}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.factory_reset_desc')}</p>
          </div>
        </motion.button>

        {/* Factory Reset Confirmation Modal */}
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowResetConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl p-6"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {t('admin.settings.data.reset_confirm_title')}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {t('admin.settings.data.reset_confirm_subtitle')}
                    </p>
                  </div>
                </div>

                <div 
                  className="p-4 rounded-xl mb-6"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-glass-border)',
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('admin.settings.data.reset_warning')}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <li>• {t('admin.settings.data.reset_warning_bookmarks')}</li>
                    <li>• {t('admin.settings.data.reset_warning_categories')}</li>
                    <li>• {t('admin.settings.data.reset_warning_quotes')}</li>
                    <li>• {t('admin.settings.data.reset_warning_settings')}</li>
                    <li>• {t('admin.settings.data.reset_warning_password')} <span className="text-red-400">admin123</span></li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowResetConfirm(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl font-medium transition-colors"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {t('admin.settings.data.reset_cancel')}
                  </motion.button>
                  <motion.button
                    onClick={handleFactoryReset}
                    disabled={isResetting}
                    whileHover={{ scale: isResetting ? 1 : 1.02 }}
                    whileTap={{ scale: isResetting ? 1 : 0.98 }}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-medium',
                      'bg-gradient-to-r from-red-500 to-orange-500 text-white',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isResetting ? t('admin.settings.data.resetting') : t('admin.settings.data.reset_confirm')}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Format Info */}
        <div 
          className="relative mt-4 p-3 rounded-xl"
          style={{
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-glass-border)',
          }}
        >
          <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <FileJson className="w-4 h-4" />
            <span className="text-xs">{t('admin.settings.data.format_hint')}</span>
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
              {success}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
