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
  AlertTriangle,
  Globe,
  FileCode
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Bookmark, Category } from '../../types/bookmark'
import { SiteSettings, factoryReset, clearAuthStatus } from '../../lib/api'
import { isBrowserBookmarkHTML, parseBrowserBookmarks } from '../../lib/bookmarkParser'

interface ExportData {
  version: string
  exportedAt: string
  data: {
    bookmarks: Bookmark[]
    categories: Category[]
    settings: SiteSettings
  }
}

// SunPanel 数据格式
interface SunPanelIcon {
  itemType?: number
  src?: string
  text?: string
  backgroundColor?: string
}

interface SunPanelChild {
  icon?: SunPanelIcon
  sort?: number
  title: string
  url: string
  lanUrl?: string
  description?: string
  openMethod?: number
  cardType?: number
  backgroundColor?: string
  expandParam?: Record<string, unknown>
}

interface SunPanelCategory {
  title: string
  sort?: number
  children: SunPanelChild[]
  cardStyle?: Record<string, unknown>
}

interface SunPanelData {
  version?: number
  appName?: string
  exportTime?: string
  appVersion?: string
  md5?: string
  icons: SunPanelCategory[]
}

// 检测是否为 SunPanel 格式
function isSunPanelFormat(data: any): data is SunPanelData {
  return (
    data?.appName === 'Sun-Panel-Config' ||
    (Array.isArray(data?.icons) && data.icons.length > 0 && data.icons[0]?.children)
  )
}

// 生成随机颜色（用于分类）
const CATEGORY_COLORS = [
  '#667eea', '#f093fb', '#f5576c', '#43e97b', '#fa709a',
  '#4facfe', '#00f2fe', '#a18cd1', '#fbc2eb', '#fccb90',
  '#e0c3fc', '#8fd3f4', '#84fab0', '#fad0c4', '#a6c0fe',
]

// 将 SunPanel 数据转换为 NOWEN 格式
function convertSunPanelData(sunPanel: SunPanelData): ExportData['data'] {
  const now = Date.now()
  const categories: Category[] = []
  const bookmarks: Bookmark[] = []

  sunPanel.icons.forEach((group, groupIndex) => {
    // 创建分类
    const categoryId = `sunpanel-${groupIndex}-${now}`
    categories.push({
      id: categoryId,
      name: group.title,
      color: CATEGORY_COLORS[groupIndex % CATEGORY_COLORS.length],
      orderIndex: group.sort !== undefined && group.sort !== 9999 ? group.sort : groupIndex,
    })

    // 转换该分类下的书签
    group.children.forEach((child, childIndex) => {
      if (!child.url) return

      const bookmark: Bookmark = {
        id: `sunpanel-${groupIndex}-${childIndex}-${now}`,
        url: child.url,
        title: child.title || child.url,
        description: child.description || undefined,
        category: categoryId,
        orderIndex: child.sort !== undefined && child.sort !== 9999 ? child.sort : childIndex,
        createdAt: now + childIndex,
        updatedAt: now + childIndex,
      }

      // 内网链接
      if (child.lanUrl) {
        bookmark.internalUrl = child.lanUrl
      }

      // 图标：SunPanel 的 icon.src 可能是相对路径（/uploads/...）或完整 URL
      if (child.icon?.src) {
        const iconSrc = child.icon.src
        if (iconSrc.startsWith('http://') || iconSrc.startsWith('https://')) {
          bookmark.iconUrl = iconSrc
        }
        // 相对路径的图标（/uploads/...）无法直接使用，跳过
      }

      bookmarks.push(bookmark)
    })
  })

  return {
    bookmarks,
    categories,
    settings: {} as SiteSettings,
  }
}

// 生成 Netscape Bookmark File 格式的 HTML（兼容所有主流浏览器导入）
function generateBookmarkHTML(
  bookmarks: Bookmark[],
  categories: Category[],
  siteName: string
): string {
  const now = Math.floor(Date.now() / 1000)
  const categoryMap = new Map<string, Category>()
  categories.forEach(c => categoryMap.set(c.id, c))

  // 按分类分组
  const grouped = new Map<string, Bookmark[]>()
  const uncategorized: Bookmark[] = []

  bookmarks.forEach(b => {
    if (b.category && categoryMap.has(b.category)) {
      if (!grouped.has(b.category)) grouped.set(b.category, [])
      grouped.get(b.category)!.push(b)
    } else {
      uncategorized.push(b)
    }
  })

  // 对分类按 orderIndex 排序
  const sortedCategories = [...categories].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

  function escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function renderBookmark(b: Bookmark): string {
    const addDate = b.createdAt ? Math.floor(b.createdAt / 1000) : now
    const iconAttr = b.favicon && b.favicon.startsWith('data:')
      ? ` ICON="${escapeHTML(b.favicon)}"`
      : b.iconUrl
        ? ` ICON="${escapeHTML(b.iconUrl)}"`
        : ''
    return `        <DT><A HREF="${escapeHTML(b.url)}" ADD_DATE="${addDate}"${iconAttr}>${escapeHTML(b.title || b.url)}</A>`
  }

  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}" PERSONAL_TOOLBAR_FOLDER="true">${escapeHTML(siteName || 'NOWEN Bookmarks')}</H3>
    <DL><p>\n`

  // 输出各分类
  for (const cat of sortedCategories) {
    const items = grouped.get(cat.id)
    if (!items || items.length === 0) continue

    const sorted = [...items].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    html += `        <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${escapeHTML(cat.name)}</H3>\n`
    html += `        <DL><p>\n`
    for (const b of sorted) {
      html += renderBookmark(b) + '\n'
    }
    html += `        </DL><p>\n`
  }

  // 输出未分类书签
  if (uncategorized.length > 0) {
    const sorted = [...uncategorized].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    for (const b of sorted) {
      html += renderBookmark(b) + '\n'
    }
  }

  html += `    </DL><p>\n</DL><p>\n`
  return html
}

interface DataManagementCardProps {
  bookmarks: Bookmark[]
  categories: Category[]
  settings: SiteSettings
  onImport: (data: ExportData['data'], enableAiEnrich?: boolean) => Promise<void>
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
  const [isExportingHTML, setIsExportingHTML] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const htmlFileInputRef = useRef<HTMLInputElement>(null)
  const [showImportModeModal, setShowImportModeModal] = useState(false)
  const [pendingBrowserData, setPendingBrowserData] = useState<ExportData['data'] | null>(null)
  const [pendingBrowserStats, setPendingBrowserStats] = useState<{ totalLinks: number; totalFolders: number } | null>(null)

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

  // 导出 HTML 书签文件（兼容各大浏览器导入）
  const handleExportHTML = async () => {
    setIsExportingHTML(true)
    setError(null)
    setSuccess(null)

    try {
      const html = generateBookmarkHTML(bookmarks, categories, settings?.siteTitle || 'NOWEN')

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess(t('admin.settings.data.export_html_success'))
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || t('admin.settings.data.export_error'))
    } finally {
      setIsExportingHTML(false)
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
      const rawData = JSON.parse(text)

      let importPayload: ExportData['data']
      let sourceLabel = ''

      // 检测是否为 SunPanel 格式
      if (isSunPanelFormat(rawData)) {
        const converted = convertSunPanelData(rawData)

        if (converted.bookmarks.length === 0) {
          throw new Error(t('admin.settings.data.no_bookmarks'))
        }

        const confirmMsg = t('admin.settings.data.sunpanel_import_confirm', {
          bookmarks: converted.bookmarks.length,
          categories: converted.categories.length,
          version: rawData.appVersion || '?',
          time: rawData.exportTime || '-',
        })

        if (!confirm(confirmMsg)) {
          setIsImporting(false)
          return
        }

        importPayload = converted
        sourceLabel = 'SunPanel'
      } else {
        // NOWEN 原生格式
        const data: ExportData = rawData

        if (!data.version || !data.data) {
          throw new Error(t('admin.settings.data.invalid_format'))
        }

        if (!data.data.bookmarks || !Array.isArray(data.data.bookmarks)) {
          throw new Error(t('admin.settings.data.no_bookmarks'))
        }

        const confirmMsg = t('admin.settings.data.import_confirm', {
          bookmarks: data.data.bookmarks?.length || 0,
          categories: data.data.categories?.length || 0,
          time: new Date(data.exportedAt).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US')
        })

        if (!confirm(confirmMsg)) {
          setIsImporting(false)
          return
        }

        importPayload = data.data
        sourceLabel = 'NOWEN'
      }

      await onImport(importPayload)

      const successMsg = sourceLabel === 'SunPanel'
        ? t('admin.settings.data.sunpanel_import_success', {
            bookmarks: importPayload.bookmarks.length,
            categories: importPayload.categories.length,
          })
        : t('admin.settings.data.import_success', {
            bookmarks: importPayload.bookmarks.length,
            categories: importPayload.categories?.length || 0,
          })

      setSuccess(successMsg)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError(t('admin.settings.data.json_error'))
      } else {
        setError(err.message || t('admin.settings.data.import_error'))
      }
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 导入浏览器 HTML 书签
  const handleBrowserImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(null)

    try {
      const text = await file.text()

      if (!isBrowserBookmarkHTML(text)) {
        throw new Error(t('admin.settings.data.not_bookmark_html'))
      }

      const result = parseBrowserBookmarks(text)

      if (result.bookmarks.length === 0) {
        throw new Error(t('admin.settings.data.no_bookmarks'))
      }

      // 保存解析结果，弹出导入模式选择
      setPendingBrowserData({
        bookmarks: result.bookmarks,
        categories: result.categories,
        settings: result.settings,
      })
      setPendingBrowserStats({
        totalLinks: result.stats.totalLinks,
        totalFolders: result.categories.length,
      })
      setShowImportModeModal(true)
    } catch (err: any) {
      setError(err.message || t('admin.settings.data.import_error'))
    } finally {
      if (htmlFileInputRef.current) {
        htmlFileInputRef.current.value = ''
      }
    }
  }

  // 执行浏览器书签导入（覆盖模式）
  const handleBrowserImportExecute = async (mode: 'overwrite' | 'merge') => {
    if (!pendingBrowserData) return

    setShowImportModeModal(false)
    setIsImporting(true)
    setError(null)

    try {
      if (mode === 'merge') {
        // 合并模式：保留现有数据，将新书签追加
        const existingUrls = new Set(bookmarks.map(b => b.url))
        const newBookmarks = pendingBrowserData.bookmarks.filter(b => !existingUrls.has(b.url))

        // 合并分类：避免重名
        const existingCatNames = new Set(categories.map(c => c.name))
        const newCategories = pendingBrowserData.categories.filter(c => !existingCatNames.has(c.name))

        // 更新新书签的分类 ID 映射（如果同名分类已存在，使用已有的 ID）
        const catNameToId = new Map<string, string>()
        categories.forEach(c => catNameToId.set(c.name, c.id))
        newCategories.forEach(c => catNameToId.set(c.name, c.id))

        const remappedBookmarks = newBookmarks.map(b => {
          if (b.category) {
            const cat = pendingBrowserData.categories.find(c => c.id === b.category)
            if (cat && catNameToId.has(cat.name)) {
              return { ...b, category: catNameToId.get(cat.name) }
            }
          }
          return b
        })

        // 构造合并后的完整数据发送给后端
        const mergedData = {
          bookmarks: [...bookmarks, ...remappedBookmarks],
          categories: [...categories, ...newCategories],
          settings: pendingBrowserData.settings,
        }

        await onImport(mergedData)

        const skipped = pendingBrowserData.bookmarks.length - newBookmarks.length
        let msg = t('admin.settings.data.browser_merge_success', {
          bookmarks: newBookmarks.length,
          categories: newCategories.length,
        })
        if (skipped > 0) {
          msg += ' ' + t('admin.settings.data.browser_merge_skipped', { count: skipped })
        }
        setSuccess(msg)
      } else {
        // 覆盖模式：直接替换
        await onImport(pendingBrowserData)
        setSuccess(t('admin.settings.data.browser_import_success', {
          bookmarks: pendingBrowserData.bookmarks.length,
          categories: pendingBrowserData.categories.length,
        }))
      }

      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      setError(err.message || t('admin.settings.data.import_error'))
    } finally {
      setIsImporting(false)
      setPendingBrowserData(null)
      setPendingBrowserStats(null)
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
      
      // 清除登录状态，刷新后需要重新登录
      clearAuthStatus()
      
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
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Export JSON Button */}
          <motion.button
            onClick={handleExport}
            disabled={isExporting}
            whileHover={{ scale: isExporting ? 1 : 1.02 }}
            whileTap={{ scale: isExporting ? 1 : 0.98 }}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl',
              'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
              'border border-emerald-500/20 hover:border-emerald-500/40',
              'transition-all duration-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
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
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.export')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.export_desc')}</p>
            </div>
          </motion.button>

          {/* Export HTML Button */}
          <motion.button
            onClick={handleExportHTML}
            disabled={isExportingHTML}
            whileHover={{ scale: isExportingHTML ? 1 : 1.02 }}
            whileTap={{ scale: isExportingHTML ? 1 : 0.98 }}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl',
              'bg-gradient-to-br from-amber-500/10 to-orange-500/10',
              'border border-amber-500/20 hover:border-amber-500/40',
              'transition-all duration-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              {isExportingHTML ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full"
                />
              ) : (
                <FileCode className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.export_html')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.export_html_desc')}</p>
            </div>
          </motion.button>

          {/* Import JSON Button */}
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            whileHover={{ scale: isImporting ? 1 : 1.02 }}
            whileTap={{ scale: isImporting ? 1 : 0.98 }}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl',
              'bg-gradient-to-br from-blue-500/10 to-indigo-500/10',
              'border border-blue-500/20 hover:border-blue-500/40',
              'transition-all duration-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
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
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.import')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.import_desc')}</p>
            </div>
          </motion.button>

          {/* Import Browser Bookmarks Button */}
          <motion.button
            onClick={() => htmlFileInputRef.current?.click()}
            disabled={isImporting}
            whileHover={{ scale: isImporting ? 1 : 1.02 }}
            whileTap={{ scale: isImporting ? 1 : 0.98 }}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl',
              'bg-gradient-to-br from-purple-500/10 to-violet-500/10',
              'border border-purple-500/20 hover:border-purple-500/40',
              'transition-all duration-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.browser_import')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.browser_import_desc')}</p>
            </div>
          </motion.button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <input
            ref={htmlFileInputRef}
            type="file"
            accept=".html,.htm"
            onChange={handleBrowserImport}
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

        {/* Browser Import Mode Modal */}
        <AnimatePresence>
          {showImportModeModal && pendingBrowserStats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowImportModeModal(false); setPendingBrowserData(null); setPendingBrowserStats(null); }}
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
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {t('admin.settings.data.browser_import_title')}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {t('admin.settings.data.browser_import_detected', {
                        bookmarks: pendingBrowserStats.totalLinks,
                        categories: pendingBrowserStats.totalFolders,
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {/* Merge Mode */}
                  <motion.button
                    onClick={() => handleBrowserImportExecute('merge')}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full p-4 rounded-xl text-left transition-colors"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {t('admin.settings.data.import_mode_merge')}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {t('admin.settings.data.import_mode_merge_desc')}
                        </p>
                      </div>
                    </div>
                  </motion.button>

                  {/* Overwrite Mode */}
                  <motion.button
                    onClick={() => handleBrowserImportExecute('overwrite')}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full p-4 rounded-xl text-left transition-colors"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {t('admin.settings.data.import_mode_overwrite')}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {t('admin.settings.data.import_mode_overwrite_desc')}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                </div>

                <motion.button
                  onClick={() => { setShowImportModeModal(false); setPendingBrowserData(null); setPendingBrowserStats(null); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {t('admin.settings.data.reset_cancel')}
                </motion.button>
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
          <div className="flex items-center gap-2 mt-1 ml-6" style={{ color: 'var(--color-text-muted)' }}>
            <Globe className="w-3.5 h-3.5" />
            <span className="text-xs">{t('admin.settings.data.browser_format_hint')}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 ml-6" style={{ color: 'var(--color-text-muted)' }}>
            <FileCode className="w-3.5 h-3.5" />
            <span className="text-xs">{t('admin.settings.data.export_html_hint')}</span>
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
