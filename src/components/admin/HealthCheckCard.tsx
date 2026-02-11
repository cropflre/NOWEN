import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  Globe,
  ExternalLink,
  Trash2,
  AlertTriangle,
  Shield,
  Zap,
  Activity,
  Filter,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  HealthCheckResult,
  HealthCheckSummary,
  healthCheckApi,
} from '../../lib/api'

interface HealthCheckCardProps {
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void
  onDeleteBookmark?: (id: string) => void
}

type FilterType = 'all' | 'ok' | 'error' | 'timeout' | 'redirect'

export function HealthCheckCard({ onShowToast, onDeleteBookmark }: HealthCheckCardProps) {
  const { t } = useTranslation()
  const [results, setResults] = useState<HealthCheckResult[]>([])
  const [summary, setSummary] = useState<HealthCheckSummary | null>(null)
  const [checking, setChecking] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [hasChecked, setHasChecked] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 执行健康检查
  const runCheck = useCallback(async () => {
    setChecking(true)
    setHasChecked(false)
    setResults([])
    setSummary(null)
    setFilter('all')

    try {
      const response = await healthCheckApi.check()
      setResults(response.results)
      setSummary(response.summary)
      setProgress({ current: response.summary.total, total: response.summary.total })
      setHasChecked(true)

      if (response.summary.error > 0 || response.summary.timeout > 0) {
        onShowToast?.('info', t('admin.healthCheck.found_issues', { count: response.summary.error + response.summary.timeout }))
      } else {
        onShowToast?.('success', t('admin.healthCheck.all_healthy'))
      }
    } catch (error) {
      console.error('Health check failed:', error)
      onShowToast?.('error', t('admin.healthCheck.check_error'))
    } finally {
      setChecking(false)
    }
  }, [t, onShowToast])

  // 批量删除死链
  const handleDeleteDead = useCallback(async () => {
    const deadLinks = results.filter(r => r.status === 'error' || r.status === 'timeout')
    if (deadLinks.length === 0) return

    setDeleting(true)
    try {
      for (const link of deadLinks) {
        onDeleteBookmark?.(link.bookmarkId)
      }
      // 从结果中移除已删除的
      setResults(prev => prev.filter(r => r.status !== 'error' && r.status !== 'timeout'))
      setSummary(prev => prev ? {
        ...prev,
        total: prev.total - deadLinks.length,
        error: 0,
        timeout: 0,
      } : null)
      setShowDeleteConfirm(false)
      onShowToast?.('success', t('admin.healthCheck.deleted_dead', { count: deadLinks.length }))
    } catch (error) {
      onShowToast?.('error', t('admin.healthCheck.delete_error'))
    } finally {
      setDeleting(false)
    }
  }, [results, onDeleteBookmark, onShowToast, t])

  // 过滤结果
  const filteredResults = filter === 'all' ? results : results.filter(r => r.status === filter)

  // 格式化响应时间
  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // 获取状态图标和颜色
  const getStatusInfo = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'ok':
        return { icon: CheckCircle2, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/20', label: t('admin.healthCheck.status_ok') }
      case 'error':
        return { icon: XCircle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-500/20', label: t('admin.healthCheck.status_error') }
      case 'timeout':
        return { icon: Clock, color: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/20', label: t('admin.healthCheck.status_timeout') }
      case 'redirect':
        return { icon: ArrowRightLeft, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20', label: t('admin.healthCheck.status_redirect') }
    }
  }

  // 未检查状态 - 初始页面
  if (!hasChecked && !checking) {
    return (
      <div className="space-y-6">
        {/* 头部 */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <HeartPulse className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{t('admin.healthCheck.title')}</h3>
            <p className="text-sm text-gray-500 dark:text-white/50">{t('admin.healthCheck.description')}</p>
          </div>
        </div>

        {/* 开始检测 CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mb-6"
          >
            <Shield className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('admin.healthCheck.ready_title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/50 mb-6 text-center max-w-md">
            {t('admin.healthCheck.ready_desc')}
          </p>
          <motion.button
            onClick={runCheck}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20"
          >
            <HeartPulse className="w-5 h-5" />
            {t('admin.healthCheck.start_check')}
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // 检测中状态
  if (checking) {
    return (
      <div className="space-y-6">
        {/* 头部 */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <HeartPulse className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{t('admin.healthCheck.title')}</h3>
            <p className="text-sm text-gray-500 dark:text-white/50">{t('admin.healthCheck.checking')}</p>
          </div>
        </div>

        {/* 检测动画 */}
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mb-6"
          >
            <Activity className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />
          </motion.div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('admin.healthCheck.checking')}
          </p>
          <p className="text-sm text-gray-500 dark:text-white/50">
            {t('admin.healthCheck.checking_desc')}
          </p>
        </div>
      </div>
    )
  }

  // 检测完成 - 结果展示
  const deadCount = (summary?.error || 0) + (summary?.timeout || 0)

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <HeartPulse className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{t('admin.healthCheck.title')}</h3>
            <p className="text-sm text-gray-500 dark:text-white/50">{t('admin.healthCheck.description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runCheck}
            disabled={checking}
            className={cn(
              'p-2 rounded-lg transition-all',
              'bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10',
              'text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white',
              checking && 'animate-spin'
            )}
            title={t('admin.healthCheck.recheck')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {deadCount > 0 && onDeleteBookmark && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={cn(
                'p-2 rounded-lg transition-all',
                'bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20',
                'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
              )}
              title={t('admin.healthCheck.delete_dead')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            icon={Globe}
            label={t('admin.healthCheck.stat_total')}
            value={summary.total.toString()}
            gradient="from-gray-500/20 to-slate-500/20"
            iconColor="text-gray-400"
          />
          <StatCard
            icon={CheckCircle2}
            label={t('admin.healthCheck.status_ok')}
            value={summary.ok.toString()}
            gradient="from-green-500/20 to-emerald-500/20"
            iconColor="text-green-400"
          />
          <StatCard
            icon={XCircle}
            label={t('admin.healthCheck.status_error')}
            value={summary.error.toString()}
            gradient="from-red-500/20 to-rose-500/20"
            iconColor="text-red-400"
          />
          <StatCard
            icon={Clock}
            label={t('admin.healthCheck.status_timeout')}
            value={summary.timeout.toString()}
            gradient="from-yellow-500/20 to-amber-500/20"
            iconColor="text-yellow-400"
          />
          <StatCard
            icon={Zap}
            label={t('admin.healthCheck.avg_time')}
            value={formatResponseTime(summary.averageResponseTime)}
            gradient="from-purple-500/20 to-violet-500/20"
            iconColor="text-purple-400"
          />
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex gap-2 p-1 rounded-lg bg-gray-100 dark:bg-white/5">
        {(['all', 'ok', 'error', 'timeout', 'redirect'] as FilterType[]).map((f) => {
          const count = f === 'all' ? results.length : results.filter(r => r.status === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                filter === f
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80'
              )}
            >
              <span className="hidden sm:inline">{t(`admin.healthCheck.filter_${f}`)}</span>
              <span className="sm:hidden">
                {f === 'all' ? <Filter className="w-3.5 h-3.5" /> : null}
                {f === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                {f === 'error' ? <XCircle className="w-3.5 h-3.5" /> : null}
                {f === 'timeout' ? <Clock className="w-3.5 h-3.5" /> : null}
                {f === 'redirect' ? <ArrowRightLeft className="w-3.5 h-3.5" /> : null}
              </span>
              <span className="text-xs opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      {/* 结果列表 */}
      <div className="space-y-2">
        {filteredResults.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-white/40">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{filter === 'all' ? t('admin.healthCheck.no_bookmarks') : t('admin.healthCheck.no_results')}</p>
          </div>
        ) : (
          filteredResults.map((result, index) => {
            const statusInfo = getStatusInfo(result.status)
            const StatusIcon = statusInfo.icon
            return (
              <motion.div
                key={result.bookmarkId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg',
                  'bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 transition-all',
                  'group'
                )}
              >
                {/* 状态图标 */}
                <div className={cn('p-1.5 rounded-md', statusInfo.bg)}>
                  <StatusIcon className={cn('w-4 h-4', statusInfo.color)} />
                </div>

                {/* 书签图标 */}
                <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {result.favicon ? (
                    <img
                      src={result.favicon}
                      alt=""
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <Globe className="w-4 h-4 text-gray-400 dark:text-white/40" />
                  )}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {result.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/40 truncate">
                    {result.url}
                  </p>
                  {result.error && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 truncate">
                      {result.error}
                    </p>
                  )}
                  {result.redirectUrl && (
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 truncate">
                      → {result.redirectUrl}
                    </p>
                  )}
                </div>

                {/* 状态码 */}
                {result.statusCode && (
                  <span className={cn(
                    'text-xs font-mono px-2 py-0.5 rounded',
                    result.statusCode >= 200 && result.statusCode < 300 && 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
                    result.statusCode >= 300 && result.statusCode < 400 && 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
                    result.statusCode >= 400 && result.statusCode < 500 && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
                    result.statusCode >= 500 && 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
                  )}>
                    {result.statusCode}
                  </span>
                )}

                {/* 响应时间 */}
                <span className={cn(
                  'text-xs font-mono whitespace-nowrap',
                  result.responseTime < 1000 ? 'text-green-600 dark:text-green-400' :
                  result.responseTime < 3000 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                )}>
                  {formatResponseTime(result.responseTime)}
                </span>

                {/* 打开链接 */}
                <button
                  onClick={() => window.open(result.url, '_blank')}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </motion.div>
            )
          })
        )}
      </div>

      {/* 删除死链确认对话框 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('admin.healthCheck.delete_confirm_title')}
                </h3>
              </div>
              <p className="text-gray-500 dark:text-white/60 mb-6">
                {t('admin.healthCheck.delete_confirm_message', { count: deadCount })}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteDead}
                  disabled={deleting}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-colors',
                    'bg-red-500 hover:bg-red-600 text-white',
                    deleting && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {deleting ? t('common.loading') : t('admin.healthCheck.delete_dead')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 统计卡片组件
interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string
  gradient: string
  iconColor: string
}

function StatCard({ icon: Icon, label, value, gradient, iconColor }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        'p-4 rounded-xl',
        'bg-gradient-to-br',
        gradient,
        'border border-gray-200 dark:border-white/10'
      )}
    >
      <Icon className={cn('w-5 h-5 mb-2', iconColor)} />
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-white/50">{label}</p>
    </motion.div>
  )
}

export default HealthCheckCard
