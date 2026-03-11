import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudUpload,
  CloudDownload,
  Download,
  RefreshCw,
  Trash2,
  Settings,
  HardDrive,
  Wifi,
  WifiOff,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Database,
  Upload,
  FileCode,
  Globe,
  FileJson,
  FileText,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  backupApi,
  type BackupConfig,
  type BackupFile,
  type BackupStatus,
  SiteSettings,
  factoryReset,
  clearAuthStatus,
} from '../../lib/api'
import { Bookmark, Category } from '../../types/bookmark'
import { isBrowserBookmarkHTML, parseBrowserBookmarks } from '../../lib/bookmarkParser'

// ========== SunPanel 数据格式支持 ==========

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

interface ExportData {
  version: string
  exportedAt: string
  data: {
    bookmarks: Bookmark[]
    categories: Category[]
    settings: SiteSettings
  }
}

function isSunPanelFormat(data: any): data is SunPanelData {
  return (
    data?.appName === 'Sun-Panel-Config' ||
    (Array.isArray(data?.icons) && data.icons.length > 0 && data.icons[0]?.children)
  )
}

const CATEGORY_COLORS = [
  '#667eea', '#f093fb', '#f5576c', '#43e97b', '#fa709a',
  '#4facfe', '#00f2fe', '#a18cd1', '#fbc2eb', '#fccb90',
  '#e0c3fc', '#8fd3f4', '#84fab0', '#fad0c4', '#a6c0fe',
]

function convertSunPanelData(sunPanel: SunPanelData): ExportData['data'] {
  const now = Date.now()
  const categories: Category[] = []
  const bookmarks: Bookmark[] = []

  sunPanel.icons.forEach((group, groupIndex) => {
    const categoryId = `sunpanel-${groupIndex}-${now}`
    categories.push({
      id: categoryId,
      name: group.title,
      color: CATEGORY_COLORS[groupIndex % CATEGORY_COLORS.length],
      orderIndex: group.sort !== undefined && group.sort !== 9999 ? group.sort : groupIndex,
    })

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
      if (child.lanUrl) bookmark.internalUrl = child.lanUrl
      if (child.icon?.src) {
        const iconSrc = child.icon.src
        if (iconSrc.startsWith('http://') || iconSrc.startsWith('https://')) {
          bookmark.iconUrl = iconSrc
        }
      }
      bookmarks.push(bookmark)
    })
  })

  return { bookmarks, categories, settings: {} as SiteSettings }
}

function generateBookmarkHTML(
  bookmarks: Bookmark[],
  categories: Category[],
  siteName: string
): string {
  const now = Math.floor(Date.now() / 1000)
  const categoryMap = new Map<string, Category>()
  categories.forEach(c => categoryMap.set(c.id, c))

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

  const sortedCategories = [...categories].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

  function escapeHTML(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function renderBookmark(b: Bookmark): string {
    const addDate = b.createdAt ? Math.floor(b.createdAt / 1000) : now
    const iconAttr = b.favicon && b.favicon.startsWith('data:')
      ? ` ICON="${escapeHTML(b.favicon)}"`
      : b.iconUrl ? ` ICON="${escapeHTML(b.iconUrl)}"` : ''
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

  for (const cat of sortedCategories) {
    const items = grouped.get(cat.id)
    if (!items || items.length === 0) continue
    const sorted = [...items].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    html += `        <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${escapeHTML(cat.name)}</H3>\n`
    html += `        <DL><p>\n`
    for (const b of sorted) html += renderBookmark(b) + '\n'
    html += `        </DL><p>\n`
  }

  if (uncategorized.length > 0) {
    const sorted = [...uncategorized].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    for (const b of sorted) html += renderBookmark(b) + '\n'
  }

  html += `    </DL><p>\n</DL><p>\n`
  return html
}

// ========== 组件 ==========

interface BackupCardProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void
  bookmarks: Bookmark[]
  categories: Category[]
  settings: SiteSettings
  onImport: (data: ExportData['data'], enableAiEnrich?: boolean) => Promise<void>
  onFactoryReset?: () => void
}

export function BackupCard({ onShowToast, bookmarks, categories, settings, onImport, onFactoryReset }: BackupCardProps) {
  const { t, i18n } = useTranslation()

  // ========== WebDAV 状态 ==========
  const [config, setConfig] = useState<BackupConfig>({
    url: '', username: '', password: '', path: '/NOWEN/',
    autoBackup: false, cronExpression: '0 3 * * *', maxBackups: 30,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [status, setStatus] = useState<BackupStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [backing, setBacking] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)

  // ========== 数据管理状态 ==========
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingHTML, setIsExportingHTML] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [dataSuccess, setDataSuccess] = useState<string | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const htmlFileInputRef = useRef<HTMLInputElement>(null)
  const [showImportModeModal, setShowImportModeModal] = useState(false)
  const [pendingBrowserData, setPendingBrowserData] = useState<ExportData['data'] | null>(null)
  const [pendingBrowserStats, setPendingBrowserStats] = useState<{ totalLinks: number; totalFolders: number } | null>(null)
  const [enableAiEnrich, setEnableAiEnrich] = useState(settings.enableAiEnrichOnImport ?? false)

  // ========== WebDAV 加载 ==========
  const loadConfig = useCallback(async () => {
    try {
      const cfg = await backupApi.getConfig()
      setConfig(cfg)
      setConfigLoaded(true)
      if (cfg.url) setConnected(true)
    } catch { setConfigLoaded(true) }
  }, [])

  const loadBackups = useCallback(async () => {
    try {
      setLoading(true)
      const result = await backupApi.list()
      setBackups(result.backups)
    } catch {} finally { setLoading(false) }
  }, [])

  const loadStatus = useCallback(async () => {
    try { const s = await backupApi.status(); setStatus(s) } catch {}
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])
  useEffect(() => {
    if (configLoaded && config.url) { loadBackups(); loadStatus() }
  }, [configLoaded, config.url, loadBackups, loadStatus])

  // ========== WebDAV 操作 ==========
  const handleTest = async () => {
    setTesting(true)
    try {
      const result = await backupApi.testConnection(config)
      if (result.success) {
        setConnected(true)
        onShowToast('success', t('admin.backup.test_success', 'WebDAV 连接成功'))
      } else {
        setConnected(false)
        onShowToast('error', result.message || t('admin.backup.test_failed', '连接失败'))
      }
    } catch (err: any) {
      setConnected(false)
      onShowToast('error', err?.message || t('admin.backup.test_failed', '连接失败'))
    } finally { setTesting(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await backupApi.saveConfig(config)
      onShowToast('success', t('admin.backup.config_saved', '配置已保存'))
      if (config.url) { loadBackups(); loadStatus() }
    } catch (err: any) {
      onShowToast('error', err?.message || t('admin.backup.save_failed', '保存失败'))
    } finally { setSaving(false) }
  }

  const handleBackupNow = async () => {
    setBacking(true)
    try {
      const result = await backupApi.backupNow()
      onShowToast('success', t('admin.backup.backup_success', '备份成功：{{filename}}', { filename: result.filename }))
      loadBackups(); loadStatus()
    } catch (err: any) {
      onShowToast('error', err?.message || t('admin.backup.backup_failed', '备份失败'))
    } finally { setBacking(false) }
  }

  const handleRestore = async (filename: string) => {
    if (!window.confirm(t('admin.backup.restore_confirm', '确定要从此备份恢复数据吗？当前数据将被覆盖。'))) return
    setRestoring(filename)
    try {
      const result = await backupApi.restore(filename)
      onShowToast('success', result.message || t('admin.backup.restore_success', '恢复成功'))
    } catch (err: any) {
      onShowToast('error', err?.message || t('admin.backup.restore_failed', '恢复失败'))
    } finally { setRestoring(null) }
  }

  const handleDelete = async (filename: string) => {
    if (!window.confirm(t('admin.backup.delete_confirm', '确定删除此备份文件？'))) return
    setDeleting(filename)
    try {
      await backupApi.deleteFile(filename)
      onShowToast('success', t('admin.backup.deleted', '备份已删除'))
      loadBackups()
    } catch (err: any) {
      onShowToast('error', err?.message || t('admin.backup.delete_failed', '删除失败'))
    } finally { setDeleting(null) }
  }

  const handleLocalDownload = () => {
    try {
      backupApi.downloadLocal()
      onShowToast('success', t('admin.backup.local_download_start', '开始下载本地备份'))
    } catch (err: any) {
      onShowToast('error', err?.message || t('admin.backup.local_download_failed', '下载失败'))
    }
  }

  const handleLocalUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (!data?.data?.bookmarks) {
          onShowToast('error', t('admin.backup.invalid_file', '无效的备份文件格式'))
          return
        }
        if (!window.confirm(t('admin.backup.local_restore_confirm', '确定从本地文件恢复数据吗？当前数据将被覆盖。'))) return
        const { importData } = await import('../../lib/api')
        await importData(data.data)
        onShowToast('success', t('admin.backup.restore_success', '恢复成功'))
      } catch (err: any) {
        onShowToast('error', err?.message || t('admin.backup.invalid_file', '无效的备份文件格式'))
      }
    }
    input.click()
  }

  const handleDownloadDb = () => {
    try {
      backupApi.downloadDb()
      onShowToast('success', t('admin.backup.db_download_start', '开始下载数据库文件'))
    } catch (err: any) {
      onShowToast('error', err?.message || t('admin.backup.db_download_failed', '下载失败'))
    }
  }

  const handleUploadDb = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.db'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (!file.name.endsWith('.db')) {
        onShowToast('error', t('admin.backup.invalid_db_file', '请选择 .db 格式的数据库文件'))
        return
      }
      if (!window.confirm(t('admin.backup.db_restore_confirm', '确定用此数据库文件覆盖当前数据吗？此操作不可撤销。'))) return
      try {
        const result = await backupApi.uploadDb(file)
        onShowToast('success', result.message || t('admin.backup.restore_success', '恢复成功'))
      } catch (err: any) {
        onShowToast('error', err?.message || t('admin.backup.db_restore_failed', '数据库恢复失败'))
      }
    }
    input.click()
  }

  // ========== 数据管理操作 ==========
  const handleExport = async () => {
    setIsExporting(true)
    setDataError(null); setDataSuccess(null)
    try {
      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: { bookmarks, categories, settings },
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nebula-portal-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDataSuccess(t('admin.settings.data.export_success'))
      setTimeout(() => setDataSuccess(null), 3000)
    } catch (err: any) {
      setDataError(err.message || t('admin.settings.data.export_error'))
    } finally { setIsExporting(false) }
  }

  const handleExportHTML = async () => {
    setIsExportingHTML(true)
    setDataError(null); setDataSuccess(null)
    try {
      const html = generateBookmarkHTML(bookmarks, categories, settings?.siteTitle || 'NOWEN')
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDataSuccess(t('admin.settings.data.export_html_success'))
      setTimeout(() => setDataSuccess(null), 3000)
    } catch (err: any) {
      setDataError(err.message || t('admin.settings.data.export_error'))
    } finally { setIsExportingHTML(false) }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true); setDataError(null); setDataSuccess(null)
    try {
      const text = await file.text()
      const rawData = JSON.parse(text)
      let importPayload: ExportData['data']
      let sourceLabel = ''

      if (isSunPanelFormat(rawData)) {
        const converted = convertSunPanelData(rawData)
        if (converted.bookmarks.length === 0) throw new Error(t('admin.settings.data.no_bookmarks'))
        const confirmMsg = t('admin.settings.data.sunpanel_import_confirm', {
          bookmarks: converted.bookmarks.length,
          categories: converted.categories.length,
          version: rawData.appVersion || '?',
          time: rawData.exportTime || '-',
        })
        if (!confirm(confirmMsg)) { setIsImporting(false); return }
        importPayload = converted; sourceLabel = 'SunPanel'
      } else {
        const data: ExportData = rawData
        if (!data.version || !data.data) throw new Error(t('admin.settings.data.invalid_format'))
        if (!data.data.bookmarks || !Array.isArray(data.data.bookmarks)) throw new Error(t('admin.settings.data.no_bookmarks'))
        const confirmMsg = t('admin.settings.data.import_confirm', {
          bookmarks: data.data.bookmarks?.length || 0,
          categories: data.data.categories?.length || 0,
          time: new Date(data.exportedAt).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US')
        })
        if (!confirm(confirmMsg)) { setIsImporting(false); return }
        importPayload = data.data; sourceLabel = 'NOWEN'
      }

      await onImport(importPayload, enableAiEnrich)
      const successMsg = sourceLabel === 'SunPanel'
        ? t('admin.settings.data.sunpanel_import_success', { bookmarks: importPayload.bookmarks.length, categories: importPayload.categories.length })
        : t('admin.settings.data.import_success', { bookmarks: importPayload.bookmarks.length, categories: importPayload.categories?.length || 0 })
      setDataSuccess(successMsg)
      setTimeout(() => setDataSuccess(null), 5000)
    } catch (err: any) {
      if (err instanceof SyntaxError) setDataError(t('admin.settings.data.json_error'))
      else setDataError(err.message || t('admin.settings.data.import_error'))
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleBrowserImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDataError(null); setDataSuccess(null)
    try {
      const text = await file.text()
      if (!isBrowserBookmarkHTML(text)) throw new Error(t('admin.settings.data.not_bookmark_html'))
      const result = parseBrowserBookmarks(text)
      if (result.bookmarks.length === 0) throw new Error(t('admin.settings.data.no_bookmarks'))
      setPendingBrowserData({ bookmarks: result.bookmarks, categories: result.categories, settings: result.settings })
      setPendingBrowserStats({ totalLinks: result.stats.totalLinks, totalFolders: result.categories.length })
      setShowImportModeModal(true)
    } catch (err: any) {
      setDataError(err.message || t('admin.settings.data.import_error'))
    } finally {
      if (htmlFileInputRef.current) htmlFileInputRef.current.value = ''
    }
  }

  const handleBrowserImportExecute = async (mode: 'overwrite' | 'merge') => {
    if (!pendingBrowserData) return
    setShowImportModeModal(false); setIsImporting(true); setDataError(null)
    try {
      if (mode === 'merge') {
        const existingUrls = new Set(bookmarks.map(b => b.url))
        const newBookmarks = pendingBrowserData.bookmarks.filter(b => !existingUrls.has(b.url))
        const existingCatNames = new Set(categories.map(c => c.name))
        const newCategories = pendingBrowserData.categories.filter(c => !existingCatNames.has(c.name))
        const catNameToId = new Map<string, string>()
        categories.forEach(c => catNameToId.set(c.name, c.id))
        newCategories.forEach(c => catNameToId.set(c.name, c.id))
        const remappedBookmarks = newBookmarks.map(b => {
          if (b.category) {
            const cat = pendingBrowserData.categories.find(c => c.id === b.category)
            if (cat && catNameToId.has(cat.name)) return { ...b, category: catNameToId.get(cat.name) }
          }
          return b
        })
        const mergedData = {
          bookmarks: [...bookmarks, ...remappedBookmarks],
          categories: [...categories, ...newCategories],
          settings: pendingBrowserData.settings,
        }
        await onImport(mergedData, enableAiEnrich)
        const skipped = pendingBrowserData.bookmarks.length - newBookmarks.length
        let msg = t('admin.settings.data.browser_merge_success', { bookmarks: newBookmarks.length, categories: newCategories.length })
        if (skipped > 0) msg += ' ' + t('admin.settings.data.browser_merge_skipped', { count: skipped })
        setDataSuccess(msg)
      } else {
        await onImport(pendingBrowserData, enableAiEnrich)
        setDataSuccess(t('admin.settings.data.browser_import_success', {
          bookmarks: pendingBrowserData.bookmarks.length,
          categories: pendingBrowserData.categories.length,
        }))
      }
      setTimeout(() => setDataSuccess(null), 5000)
    } catch (err: any) {
      setDataError(err.message || t('admin.settings.data.import_error'))
    } finally {
      setIsImporting(false); setPendingBrowserData(null); setPendingBrowserStats(null)
    }
  }

  const handleFactoryReset = async () => {
    setIsResetting(true); setDataError(null); setDataSuccess(null)
    try {
      await factoryReset()
      setDataSuccess(t('admin.settings.data.reset_success'))
      setShowResetConfirm(false)
      if (onFactoryReset) onFactoryReset()
      clearAuthStatus()
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      setDataError(err.message || '恢复出厂设置失败')
    } finally { setIsResetting(false) }
  }

  // ========== 工具函数 ==========
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (str: string) => {
    try {
      const match = str.match(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/)
      if (match) return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`
      return new Date(str).toLocaleString()
    } catch { return str }
  }

  const cronPresets = [
    { label: t('admin.backup.cron_daily', '每天凌晨3点'), value: '0 3 * * *' },
    { label: t('admin.backup.cron_twice_daily', '每12小时'), value: '0 */12 * * *' },
    { label: t('admin.backup.cron_weekly', '每周一凌晨3点'), value: '0 3 * * 1' },
    { label: t('admin.backup.cron_hourly', '每小时'), value: '0 * * * *' },
  ]

  return (
    <div className="space-y-6">
      {/* ===== 数据管理区域 ===== */}
      <div
        className="relative overflow-hidden rounded-2xl backdrop-blur-xl p-6"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-transparent to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:block hidden" />

        {/* Header */}
        <div className="relative flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center">
              <Database className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.title')}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.subtitle')}</p>
          </div>
        </div>

        {/* NAS Docker 更新警告 */}
        <div className="relative flex items-start gap-3 mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {t('admin.backup.nas_update_warning')}
          </p>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <FileText className="w-4 h-4" />
              <span className="text-xs">{t('admin.settings.data.stats.bookmarks')}</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{bookmarks.length}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <Layers className="w-4 h-4" />
              <span className="text-xs">{t('admin.settings.data.stats.categories')}</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{categories.length}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <Calendar className="w-4 h-4" />
              <span className="text-xs">{t('admin.settings.data.stats.today')}</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {new Date().toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* 导入导出操作 */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 导出 JSON */}
          <motion.button onClick={handleExport} disabled={isExporting}
            whileHover={{ scale: isExporting ? 1 : 1.02 }} whileTap={{ scale: isExporting ? 1 : 0.98 }}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl', 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10', 'border border-emerald-500/20 hover:border-emerald-500/40', 'transition-all duration-300', 'disabled:opacity-50 disabled:cursor-not-allowed')}>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              {isExporting ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full" />
                : <Download className="w-5 h-5 text-emerald-500" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.export')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.export_desc')}</p>
            </div>
          </motion.button>

          {/* 导出 HTML */}
          <motion.button onClick={handleExportHTML} disabled={isExportingHTML}
            whileHover={{ scale: isExportingHTML ? 1 : 1.02 }} whileTap={{ scale: isExportingHTML ? 1 : 0.98 }}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl', 'bg-gradient-to-br from-amber-500/10 to-orange-500/10', 'border border-amber-500/20 hover:border-amber-500/40', 'transition-all duration-300', 'disabled:opacity-50 disabled:cursor-not-allowed')}>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              {isExportingHTML ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full" />
                : <FileCode className="w-5 h-5 text-amber-500" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.export_html')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.export_html_desc')}</p>
            </div>
          </motion.button>

          {/* 导入 JSON */}
          <motion.button onClick={() => fileInputRef.current?.click()} disabled={isImporting}
            whileHover={{ scale: isImporting ? 1 : 1.02 }} whileTap={{ scale: isImporting ? 1 : 0.98 }}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl', 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10', 'border border-blue-500/20 hover:border-blue-500/40', 'transition-all duration-300', 'disabled:opacity-50 disabled:cursor-not-allowed')}>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              {isImporting ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full" />
                : <Upload className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.import')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.import_desc')}</p>
            </div>
          </motion.button>

          {/* 导入浏览器书签 */}
          <motion.button onClick={() => htmlFileInputRef.current?.click()} disabled={isImporting}
            whileHover={{ scale: isImporting ? 1 : 1.02 }} whileTap={{ scale: isImporting ? 1 : 0.98 }}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl', 'bg-gradient-to-br from-purple-500/10 to-violet-500/10', 'border border-purple-500/20 hover:border-purple-500/40', 'transition-all duration-300', 'disabled:opacity-50 disabled:cursor-not-allowed')}>
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.browser_import')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.browser_import_desc')}</p>
            </div>
          </motion.button>

          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <input ref={htmlFileInputRef} type="file" accept=".html,.htm" onChange={handleBrowserImport} className="hidden" />
        </div>

        {/* AI 刮削元数据开关 */}
        <div
          className="relative mt-4 flex items-center justify-between p-4 rounded-xl transition-all duration-300"
          style={{
            background: enableAiEnrich ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.08))' : 'var(--color-bg-tertiary)',
            border: enableAiEnrich ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid var(--color-glass-border)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
              enableAiEnrich ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20' : 'bg-white/5'
            )}>
              <Sparkles className={cn('w-5 h-5 transition-colors duration-300', enableAiEnrich ? 'text-purple-400' : 'text-gray-500')} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {t('admin.settings.data.ai_enrich_toggle')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {t('admin.settings.data.ai_enrich_toggle_desc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enableAiEnrich}
            onClick={() => setEnableAiEnrich(!enableAiEnrich)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none shrink-0',
              enableAiEnrich ? 'bg-purple-500' : 'bg-gray-600'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white transition-transform duration-300 shadow-sm',
                enableAiEnrich ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* 恢复出厂设置 */}
        <motion.button onClick={() => setShowResetConfirm(true)} disabled={isResetting}
          whileHover={{ scale: isResetting ? 1 : 1.02 }} whileTap={{ scale: isResetting ? 1 : 0.98 }}
          className={cn('relative w-full mt-4 flex items-center justify-center gap-3 p-4 rounded-xl', 'bg-gradient-to-br from-red-500/10 to-orange-500/10', 'border border-red-500/20 hover:border-red-500/40', 'transition-all duration-300', 'disabled:opacity-50 disabled:cursor-not-allowed')}>
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            {isResetting ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full" />
              : <RotateCcw className="w-5 h-5 text-red-500" />}
          </div>
          <div className="text-left">
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.factory_reset')}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.factory_reset_desc')}</p>
          </div>
        </motion.button>

        {/* 格式提示 */}
        <div className="relative mt-4 p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}>
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

        {/* 状态消息 */}
        <AnimatePresence>
          {dataError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{dataError}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {dataSuccess && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />{dataSuccess}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 恢复出厂设置确认弹窗 */}
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowResetConfirm(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl p-6"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)' }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.reset_confirm_title')}</h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.reset_confirm_subtitle')}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('admin.settings.data.reset_warning')}</p>
                  <ul className="mt-2 space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <li>• {t('admin.settings.data.reset_warning_bookmarks')}</li>
                    <li>• {t('admin.settings.data.reset_warning_categories')}</li>
                    <li>• {t('admin.settings.data.reset_warning_quotes')}</li>
                    <li>• {t('admin.settings.data.reset_warning_settings')}</li>
                    <li>• {t('admin.settings.data.reset_warning_password')} <span className="text-red-400">admin123</span></li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <motion.button onClick={() => setShowResetConfirm(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl font-medium transition-colors"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.data.reset_cancel')}
                  </motion.button>
                  <motion.button onClick={handleFactoryReset} disabled={isResetting}
                    whileHover={{ scale: isResetting ? 1 : 1.02 }} whileTap={{ scale: isResetting ? 1 : 0.98 }}
                    className={cn('flex-1 py-3 rounded-xl font-medium', 'bg-gradient-to-r from-red-500 to-orange-500 text-white', 'disabled:opacity-50 disabled:cursor-not-allowed')}>
                    {isResetting ? t('admin.settings.data.resetting') : t('admin.settings.data.reset_confirm')}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 浏览器书签导入模式选择弹窗 */}
        <AnimatePresence>
          {showImportModeModal && pendingBrowserStats && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowImportModeModal(false); setPendingBrowserData(null); setPendingBrowserStats(null) }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl p-6"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)' }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.browser_import_title')}</h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {t('admin.settings.data.browser_import_detected', { bookmarks: pendingBrowserStats.totalLinks, categories: pendingBrowserStats.totalFolders })}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <motion.button onClick={() => handleBrowserImportExecute('merge')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full p-4 rounded-xl text-left transition-colors"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.import_mode_merge')}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.import_mode_merge_desc')}</p>
                      </div>
                    </div>
                  </motion.button>
                  <motion.button onClick={() => handleBrowserImportExecute('overwrite')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full p-4 rounded-xl text-left transition-colors"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.data.import_mode_overwrite')}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.data.import_mode_overwrite_desc')}</p>
                      </div>
                    </div>
                  </motion.button>
                </div>
                <motion.button onClick={() => { setShowImportModeModal(false); setPendingBrowserData(null); setPendingBrowserStats(null) }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-muted)' }}>
                  {t('admin.settings.data.reset_cancel')}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== 云备份区域 ===== */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <CloudUpload className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {t('admin.backup.title', '云备份')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/50">
                {t('admin.backup.description', 'WebDAV 云端备份 & 本地备份下载')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connected !== null && (
              <span className={cn(
                'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                connected
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
                  : 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
              )}>
                {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {connected ? t('admin.backup.connected', '已连接') : t('admin.backup.disconnected', '未连接')}
              </span>
            )}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
          <button onClick={handleBackupNow} disabled={backing || !config.url}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border transition-all', 'border-gray-200 dark:border-white/10',
              config.url ? 'hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/5' : 'opacity-50 cursor-not-allowed')}>
            {backing ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : <CloudUpload className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
            <span className="text-xs font-medium text-gray-700 dark:text-white/70">{t('admin.backup.backup_now', '立即备份')}</span>
          </button>

          <button onClick={loadBackups} disabled={loading || !config.url}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border transition-all', 'border-gray-200 dark:border-white/10',
              config.url ? 'hover:border-green-300 dark:hover:border-green-500/30 hover:bg-green-50 dark:hover:bg-green-500/5' : 'opacity-50 cursor-not-allowed')}>
            <RefreshCw className={cn('w-5 h-5 text-green-500 dark:text-green-400', loading && 'animate-spin')} />
            <span className="text-xs font-medium text-gray-700 dark:text-white/70">{t('admin.backup.refresh', '刷新列表')}</span>
          </button>

          <button onClick={handleLocalDownload}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border transition-all', 'border-gray-200 dark:border-white/10',
              'hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/5')}>
            <Download className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-white/70">{t('admin.backup.local_download', '本地下载')}</span>
          </button>

          <button onClick={handleLocalUpload}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border transition-all', 'border-gray-200 dark:border-white/10',
              'hover:border-purple-300 dark:hover:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-500/5')}>
            <RotateCcw className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-white/70">{t('admin.backup.local_restore', '本地恢复')}</span>
          </button>

          <button onClick={handleDownloadDb}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border transition-all', 'border-gray-200 dark:border-white/10',
              'hover:border-teal-300 dark:hover:border-teal-500/30 hover:bg-teal-50 dark:hover:bg-teal-500/5')}>
            <Database className="w-5 h-5 text-teal-500 dark:text-teal-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-white/70">{t('admin.backup.db_download', '下载 DB')}</span>
          </button>

          <button onClick={handleUploadDb}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border transition-all', 'border-gray-200 dark:border-white/10',
              'hover:border-rose-300 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/5')}>
            <Upload className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-white/70">{t('admin.backup.db_restore', '恢复 DB')}</span>
          </button>
        </div>

        {/* 自动备份状态 */}
        {status && status.enabled && (
          <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border', 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5')}>
            <Play className="w-4 h-4 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-700 dark:text-green-400">
                {t('admin.backup.auto_active', '自动备份已启用')}
                <span className="text-green-600/70 dark:text-green-400/60 ml-2">
                  {cronPresets.find(p => p.value === status.cronExpression)?.label || status.cronExpression}
                </span>
              </p>
              {status.lastBackupTime && (
                <p className="text-[10px] text-green-600/60 dark:text-green-400/40 mt-0.5">
                  {t('admin.backup.last_backup', '上次备份')}: {new Date(status.lastBackupTime).toLocaleString()}
                </p>
              )}
              {status.lastError && (
                <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{status.lastError}
                </p>
              )}
            </div>
          </div>
        )}

        {/* WebDAV 配置 */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
          <button onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-white/80">{t('admin.backup.webdav_config', 'WebDAV 配置')}</span>
            </div>
            <motion.div animate={{ rotate: showConfig ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <Settings className="w-4 h-4 text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showConfig && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-white/5 pt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">{t('admin.backup.webdav_url', 'WebDAV 地址')}</label>
                    <input type="url" value={config.url} onChange={e => setConfig({ ...config, url: e.target.value })} placeholder="https://dav.jianguoyun.com/dav/"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                    <p className="text-[10px] text-gray-400 dark:text-white/30 mt-1">{t('admin.backup.webdav_url_hint', '支持坚果云、群晖、绿联、Alist 等 WebDAV 服务')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">{t('admin.backup.username', '用户名')}</label>
                      <input type="text" value={config.username} onChange={e => setConfig({ ...config, username: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">{t('admin.backup.password', '密码 / 应用密钥')}</label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} value={config.password} onChange={e => setConfig({ ...config, password: e.target.value })}
                          className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60">
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">{t('admin.backup.remote_path', '远程路径')}</label>
                      <input type="text" value={config.path} onChange={e => setConfig({ ...config, path: e.target.value })} placeholder="/NOWEN/"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">{t('admin.backup.max_backups', '最大保留数')}</label>
                      <input type="number" min={1} max={100} value={config.maxBackups} onChange={e => setConfig({ ...config, maxBackups: parseInt(e.target.value) || 30 })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={config.autoBackup} onChange={e => setConfig({ ...config, autoBackup: e.target.checked })}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500/20" />
                      <span className="text-sm text-gray-700 dark:text-white/70">{t('admin.backup.auto_backup', '启用自动备份')}</span>
                    </label>
                    {config.autoBackup && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">{t('admin.backup.schedule', '备份频率')}</label>
                        <div className="flex flex-wrap gap-2">
                          {cronPresets.map(preset => (
                            <button key={preset.value} onClick={() => setConfig({ ...config, cronExpression: preset.value })}
                              className={cn('px-3 py-1.5 text-xs rounded-lg border transition-all',
                                config.cronExpression === preset.value
                                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/50 hover:border-blue-300')}>
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={handleTest} disabled={testing || !config.url}
                      className={cn('px-4 py-2 text-xs font-medium rounded-lg transition-all', 'border border-gray-200 dark:border-white/10', 'text-gray-700 dark:text-white/70', 'hover:bg-gray-50 dark:hover:bg-white/5', 'disabled:opacity-50 disabled:cursor-not-allowed')}>
                      {testing ? <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />{t('admin.backup.testing', '测试中...')}</span>
                        : t('admin.backup.test_connection', '测试连接')}
                    </button>
                    <button onClick={handleSave} disabled={saving}
                      className={cn('px-4 py-2 text-xs font-medium rounded-lg transition-all', 'bg-blue-500 hover:bg-blue-600 text-white', 'disabled:opacity-50 disabled:cursor-not-allowed')}>
                      {saving ? <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />{t('admin.backup.saving', '保存中...')}</span>
                        : t('admin.backup.save', '保存配置')}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 备份列表 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-white/70 flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              {t('admin.backup.cloud_backups', '云端备份')}
              {backups.length > 0 && <span className="text-xs text-gray-400 dark:text-white/30">({backups.length})</span>}
            </h4>
          </div>

          {!config.url ? (
            <div className="text-center py-8 text-gray-400 dark:text-white/30">
              <CloudDownload className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">{t('admin.backup.no_config', '请先配置 WebDAV 连接')}</p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 mx-auto mb-2 text-blue-500 animate-spin" />
              <p className="text-xs text-gray-400 dark:text-white/30">{t('admin.backup.loading', '加载中...')}</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-white/30">
              <CloudUpload className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">{t('admin.backup.no_backups', '暂无云端备份')}</p>
              <p className="text-[10px] mt-1">{t('admin.backup.no_backups_hint', '点击「立即备份」创建第一个备份')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
              {backups.map((backup, index) => (
                <motion.div key={backup.filename} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                  className={cn('flex items-center justify-between p-3 rounded-xl border transition-all', 'border-gray-100 dark:border-white/5', 'bg-gray-50 dark:bg-white/[0.02]', 'hover:border-gray-200 dark:hover:border-white/10')}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn('p-1.5 rounded-lg flex-shrink-0', index === 0 ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-gray-100 dark:bg-white/5')}>
                      <HardDrive className={cn('w-3.5 h-3.5', index === 0 ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-white/30')} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-white/70 truncate">{formatDate(backup.filename)}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/30">{formatSize(backup.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleRestore(backup.filename)} disabled={restoring === backup.filename}
                      className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                      title={t('admin.backup.restore', '恢复')}>
                      {restoring === backup.filename ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(backup.filename)} disabled={deleting === backup.filename}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title={t('admin.backup.delete', '删除')}>
                      {deleting === backup.filename ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 提示信息 */}
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">{t('admin.backup.tips_title', '使用提示')}</p>
          <ul className="text-xs text-amber-600 dark:text-amber-400/70 space-y-1">
            <li>• {t('admin.backup.tip_1', '支持坚果云、群晖 WebDAV、绿联 NAS、Alist 等 WebDAV 服务')}</li>
            <li>• {t('admin.backup.tip_2', '坚果云用户请使用「应用密码」而非登录密码')}</li>
            <li>• {t('admin.backup.tip_3', '备份包含书签、分类、名言、设置等所有数据')}</li>
            <li>• {t('admin.backup.tip_4', '本地下载/恢复不依赖 WebDAV，可作为紧急备份方案')}</li>
            <li>• {t('admin.backup.tip_5', '「下载/恢复 DB」直接操作原始数据库文件，包含完整数据（含访问统计、日志等）')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default BackupCard
