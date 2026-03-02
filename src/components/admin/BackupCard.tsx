import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudUpload,
  CloudDownload,
  Download,
  RefreshCw,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Wifi,
  WifiOff,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  backupApi,
  type BackupConfig,
  type BackupFile,
  type BackupStatus,
} from '../../lib/api'

interface BackupCardProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void
}

export function BackupCard({ onShowToast }: BackupCardProps) {
  const { t } = useTranslation()

  // WebDAV 配置
  const [config, setConfig] = useState<BackupConfig>({
    url: '',
    username: '',
    password: '',
    path: '/NOWEN/',
    autoBackup: false,
    cronExpression: '0 3 * * *',
    maxBackups: 30,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  // 状态
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

  // 加载配置
  const loadConfig = useCallback(async () => {
    try {
      const cfg = await backupApi.getConfig()
      setConfig(cfg)
      setConfigLoaded(true)
      if (cfg.url) {
        setConnected(true)
      }
    } catch {
      setConfigLoaded(true)
    }
  }, [])

  // 加载备份列表
  const loadBackups = useCallback(async () => {
    try {
      setLoading(true)
      const result = await backupApi.list()
      setBackups(result.backups)
    } catch {
      // 未配置时忽略
    } finally {
      setLoading(false)
    }
  }, [])

  // 加载状态
  const loadStatus = useCallback(async () => {
    try {
      const s = await backupApi.status()
      setStatus(s)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    if (configLoaded && config.url) {
      loadBackups()
      loadStatus()
    }
  }, [configLoaded, config.url, loadBackups, loadStatus])

  // 测试连接
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
    } finally {
      setTesting(false)
    }
  }

  // 保存配置
  const handleSave = async () => {
    setSaving(true)
    try {
      await backupApi.saveConfig(config)
      onShowToast('success', t('admin.backup.config_saved', '配置已保存'))
      if (config.url) {
        loadBackups()
        loadStatus()
      }
    } catch (err: any) {
      onShowToast('error', err?.message || t('admin.backup.save_failed', '保存失败'))
    } finally {
      setSaving(false)
    }
  }

  // 立即备份
  const handleBackupNow = async () => {
    setBacking(true)
    try {
      const result = await backupApi.backupNow()
      onShowToast('success', t('admin.backup.backup_success', '备份成功：{{filename}}', { filename: result.filename }))
      loadBackups()
      loadStatus()
    } catch (err: any) {
      onShowToast('error', err?.message || t('admin.backup.backup_failed', '备份失败'))
    } finally {
      setBacking(false)
    }
  }

  // 恢复
  const handleRestore = async (filename: string) => {
    if (!window.confirm(t('admin.backup.restore_confirm', '确定要从此备份恢复数据吗？当前数据将被覆盖。'))) return

    setRestoring(filename)
    try {
      const result = await backupApi.restore(filename)
      onShowToast('success', result.message || t('admin.backup.restore_success', '恢复成功'))
    } catch (err: any) {
      onShowToast('error', err?.message || t('admin.backup.restore_failed', '恢复失败'))
    } finally {
      setRestoring(null)
    }
  }

  // 删除
  const handleDelete = async (filename: string) => {
    if (!window.confirm(t('admin.backup.delete_confirm', '确定删除此备份文件？'))) return

    setDeleting(filename)
    try {
      await backupApi.deleteFile(filename)
      onShowToast('success', t('admin.backup.deleted', '备份已删除'))
      loadBackups()
    } catch (err: any) {
      onShowToast('error', err?.message || t('admin.backup.delete_failed', '删除失败'))
    } finally {
      setDeleting(null)
    }
  }

  // 本地下载
  const handleLocalDownload = () => {
    try {
      backupApi.downloadLocal()
      onShowToast('success', t('admin.backup.local_download_start', '开始下载本地备份'))
    } catch (err: any) {
      onShowToast('error', err?.message || t('admin.backup.local_download_failed', '下载失败'))
    }
  }

  // 本地上传恢复
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

        // 使用 import API 恢复
        const { importData } = await import('../../lib/api')
        await importData(data.data)
        onShowToast('success', t('admin.backup.restore_success', '恢复成功'))
      } catch (err: any) {
        onShowToast('error', err?.message || t('admin.backup.invalid_file', '无效的备份文件格式'))
      }
    }
    input.click()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (str: string) => {
    try {
      // 从文件名解析：nowen-backup-20260302-030000.json
      const match = str.match(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/)
      if (match) {
        return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`
      }
      return new Date(str).toLocaleString()
    } catch {
      return str
    }
  }

  const cronPresets = [
    { label: t('admin.backup.cron_daily', '每天凌晨3点'), value: '0 3 * * *' },
    { label: t('admin.backup.cron_twice_daily', '每12小时'), value: '0 */12 * * *' },
    { label: t('admin.backup.cron_weekly', '每周一凌晨3点'), value: '0 3 * * 1' },
    { label: t('admin.backup.cron_hourly', '每小时'), value: '0 * * * *' },
  ]

  return (
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 云端备份 */}
        <button
          onClick={handleBackupNow}
          disabled={backing || !config.url}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
            'border-gray-200 dark:border-white/10',
            config.url
              ? 'hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/5'
              : 'opacity-50 cursor-not-allowed',
          )}
        >
          {backing ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : (
            <CloudUpload className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          )}
          <span className="text-xs font-medium text-gray-700 dark:text-white/70">
            {t('admin.backup.backup_now', '立即备份')}
          </span>
        </button>

        {/* 刷新列表 */}
        <button
          onClick={loadBackups}
          disabled={loading || !config.url}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
            'border-gray-200 dark:border-white/10',
            config.url
              ? 'hover:border-green-300 dark:hover:border-green-500/30 hover:bg-green-50 dark:hover:bg-green-500/5'
              : 'opacity-50 cursor-not-allowed',
          )}
        >
          <RefreshCw className={cn('w-5 h-5 text-green-500 dark:text-green-400', loading && 'animate-spin')} />
          <span className="text-xs font-medium text-gray-700 dark:text-white/70">
            {t('admin.backup.refresh', '刷新列表')}
          </span>
        </button>

        {/* 本地下载 */}
        <button
          onClick={handleLocalDownload}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
            'border-gray-200 dark:border-white/10',
            'hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/5',
          )}
        >
          <Download className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-white/70">
            {t('admin.backup.local_download', '本地下载')}
          </span>
        </button>

        {/* 本地恢复 */}
        <button
          onClick={handleLocalUpload}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
            'border-gray-200 dark:border-white/10',
            'hover:border-purple-300 dark:hover:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-500/5',
          )}
        >
          <RotateCcw className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-white/70">
            {t('admin.backup.local_restore', '本地恢复')}
          </span>
        </button>
      </div>

      {/* 自动备份状态 */}
      {status && status.enabled && (
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border',
          'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5'
        )}>
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
                <AlertTriangle className="w-3 h-3" />
                {status.lastError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* WebDAV 配置 */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-white/80">
              {t('admin.backup.webdav_config', 'WebDAV 配置')}
            </span>
          </div>
          <motion.div animate={{ rotate: showConfig ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <Settings className="w-4 h-4 text-gray-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-white/5 pt-4">
                {/* URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">
                    {t('admin.backup.webdav_url', 'WebDAV 地址')}
                  </label>
                  <input
                    type="url"
                    value={config.url}
                    onChange={e => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://dav.jianguoyun.com/dav/"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                  <p className="text-[10px] text-gray-400 dark:text-white/30 mt-1">
                    {t('admin.backup.webdav_url_hint', '支持坚果云、群晖、绿联、Alist 等 WebDAV 服务')}
                  </p>
                </div>

                {/* Username & Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">
                      {t('admin.backup.username', '用户名')}
                    </label>
                    <input
                      type="text"
                      value={config.username}
                      onChange={e => setConfig({ ...config, username: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">
                      {t('admin.backup.password', '密码 / 应用密钥')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={config.password}
                        onChange={e => setConfig({ ...config, password: e.target.value })}
                        className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Path & Max Backups */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">
                      {t('admin.backup.remote_path', '远程路径')}
                    </label>
                    <input
                      type="text"
                      value={config.path}
                      onChange={e => setConfig({ ...config, path: e.target.value })}
                      placeholder="/NOWEN/"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">
                      {t('admin.backup.max_backups', '最大保留数')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={config.maxBackups}
                      onChange={e => setConfig({ ...config, maxBackups: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                </div>

                {/* Auto Backup */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoBackup}
                      onChange={e => setConfig({ ...config, autoBackup: e.target.checked })}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500/20"
                    />
                    <span className="text-sm text-gray-700 dark:text-white/70">
                      {t('admin.backup.auto_backup', '启用自动备份')}
                    </span>
                  </label>

                  {config.autoBackup && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-white/50 mb-1.5">
                        {t('admin.backup.schedule', '备份频率')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {cronPresets.map(preset => (
                          <button
                            key={preset.value}
                            onClick={() => setConfig({ ...config, cronExpression: preset.value })}
                            className={cn(
                              'px-3 py-1.5 text-xs rounded-lg border transition-all',
                              config.cronExpression === preset.value
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/50 hover:border-blue-300'
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleTest}
                    disabled={testing || !config.url}
                    className={cn(
                      'px-4 py-2 text-xs font-medium rounded-lg transition-all',
                      'border border-gray-200 dark:border-white/10',
                      'text-gray-700 dark:text-white/70',
                      'hover:bg-gray-50 dark:hover:bg-white/5',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  >
                    {testing ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t('admin.backup.testing', '测试中...')}
                      </span>
                    ) : (
                      t('admin.backup.test_connection', '测试连接')
                    )}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                      'px-4 py-2 text-xs font-medium rounded-lg transition-all',
                      'bg-blue-500 hover:bg-blue-600 text-white',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  >
                    {saving ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t('admin.backup.saving', '保存中...')}
                      </span>
                    ) : (
                      t('admin.backup.save', '保存配置')
                    )}
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
            {backups.length > 0 && (
              <span className="text-xs text-gray-400 dark:text-white/30">
                ({backups.length})
              </span>
            )}
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
              <motion.div
                key={backup.filename}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-all',
                  'border-gray-100 dark:border-white/5',
                  'bg-gray-50 dark:bg-white/[0.02]',
                  'hover:border-gray-200 dark:hover:border-white/10',
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn(
                    'p-1.5 rounded-lg flex-shrink-0',
                    index === 0
                      ? 'bg-blue-100 dark:bg-blue-500/20'
                      : 'bg-gray-100 dark:bg-white/5'
                  )}>
                    <HardDrive className={cn(
                      'w-3.5 h-3.5',
                      index === 0
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-400 dark:text-white/30'
                    )} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-white/70 truncate">
                      {formatDate(backup.filename)}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-white/30">
                      {formatSize(backup.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* 恢复 */}
                  <button
                    onClick={() => handleRestore(backup.filename)}
                    disabled={restoring === backup.filename}
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                    title={t('admin.backup.restore', '恢复')}
                  >
                    {restoring === backup.filename ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {/* 删除 */}
                  <button
                    onClick={() => handleDelete(backup.filename)}
                    disabled={deleting === backup.filename}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title={t('admin.backup.delete', '删除')}
                  >
                    {deleting === backup.filename ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
          {t('admin.backup.tips_title', '使用提示')}
        </p>
        <ul className="text-xs text-amber-600 dark:text-amber-400/70 space-y-1">
          <li>• {t('admin.backup.tip_1', '支持坚果云、群晖 WebDAV、绿联 NAS、Alist 等 WebDAV 服务')}</li>
          <li>• {t('admin.backup.tip_2', '坚果云用户请使用「应用密码」而非登录密码')}</li>
          <li>• {t('admin.backup.tip_3', '备份包含书签、分类、名言、设置等所有数据')}</li>
          <li>• {t('admin.backup.tip_4', '本地下载/恢复不依赖 WebDAV，可作为紧急备份方案')}</li>
        </ul>
      </div>
    </div>
  )
}

export default BackupCard
