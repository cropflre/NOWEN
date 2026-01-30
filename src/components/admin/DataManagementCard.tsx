import { useState, useRef } from 'react'
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
  Layers
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Bookmark, Category } from '../../types/bookmark'
import { SiteSettings } from '../../lib/api'

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
}

export function DataManagementCard({
  bookmarks,
  categories,
  settings,
  onImport,
}: DataManagementCardProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
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

      setSuccess('数据导出成功')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || '导出失败')
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
        throw new Error('无效的备份文件格式')
      }

      if (!data.data.bookmarks || !Array.isArray(data.data.bookmarks)) {
        throw new Error('备份文件中没有书签数据')
      }

      // 确认导入
      const confirmMsg = `确定要导入此备份吗？\n\n` +
        `- 书签: ${data.data.bookmarks?.length || 0} 个\n` +
        `- 分类: ${data.data.categories?.length || 0} 个\n` +
        `- 备份时间: ${new Date(data.exportedAt).toLocaleString()}\n\n` +
        `注意: 这将覆盖现有的所有数据！`

      if (!confirm(confirmMsg)) {
        setIsImporting(false)
        return
      }

      await onImport(data.data)

      setSuccess(`成功导入 ${data.data.bookmarks.length} 个书签和 ${data.data.categories?.length || 0} 个分类`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('文件格式错误，请选择有效的 JSON 备份文件')
      } else {
        setError(err.message || '导入失败')
      }
    } finally {
      setIsImporting(false)
      // 重置 input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>数据管理</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>导入导出您的书签数据</p>
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
              <span className="text-xs">书签</span>
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
              <span className="text-xs">分类</span>
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
              <span className="text-xs">今日</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
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
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>导出备份</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>下载 JSON 文件</p>
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
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>导入备份</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>恢复 JSON 文件</p>
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
            <span className="text-xs">支持格式: JSON 备份文件 (.json)</span>
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
