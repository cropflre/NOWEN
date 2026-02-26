import { useState, useEffect, useCallback, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScrollText,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Globe,
  User,
  Terminal,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { fetchLogs, clearLogs, type LogEntry, type LogsResponse } from '../../lib/api'

interface LogsCardProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void
}

const LEVEL_CONFIG = {
  info: {
    icon: Info,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-500/10',
    border: 'border-blue-300 dark:border-blue-500/20',
    label: 'INFO',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-500/10',
    border: 'border-amber-300 dark:border-amber-500/20',
    label: 'WARN',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-500/10',
    border: 'border-red-300 dark:border-red-500/20',
    label: 'ERROR',
  },
}

const TYPE_CONFIG = {
  operation: { label: '操作日志', labelEn: 'Operation', color: 'text-emerald-600 dark:text-emerald-400' },
  api_error: { label: '接口错误', labelEn: 'API Error', color: 'text-red-600 dark:text-red-400' },
  system: { label: '系统日志', labelEn: 'System', color: 'text-cyan-600 dark:text-cyan-400' },
}

export function LogsCard({ onShowToast }: LogsCardProps) {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language?.startsWith('zh')

  const [data, setData] = useState<LogsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(30)
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchLogs({
        page,
        pageSize,
        level: levelFilter || undefined,
        type: typeFilter || undefined,
        search: search || undefined,
      })
      setData(result)
    } catch (err: any) {
      onShowToast('error', isZh ? '加载日志失败' : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, levelFilter, typeFilter, search, onShowToast, isZh])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput)
  }

  const handleClearLogs = async () => {
    const msg = isZh ? '确定要清除所有日志记录吗？此操作不可撤销。' : 'Clear all logs? This cannot be undone.'
    if (!confirm(msg)) return
    try {
      await clearLogs()
      onShowToast('success', isZh ? '日志已清除' : 'Logs cleared')
      setPage(1)
      loadLogs()
    } catch {
      onShowToast('error', isZh ? '清除日志失败' : 'Failed to clear logs')
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    
    if (diff < 60000) return isZh ? '刚刚' : 'Just now'
    if (diff < 3600000) return isZh ? `${Math.floor(diff / 60000)} 分钟前` : `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return isZh ? `${Math.floor(diff / 3600000)} 小时前` : `${Math.floor(diff / 3600000)}h ago`
    
    return d.toLocaleString(isZh ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const stats = data?.stats || { info: 0, warn: 0, error: 0 }
  const pagination = data?.pagination || { page: 1, pageSize: 30, total: 0, totalPages: 0 }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['info', 'warn', 'error'] as const).map((level) => {
          const cfg = LEVEL_CONFIG[level]
          const Icon = cfg.icon
          const count = stats[level]
          const isActive = levelFilter === level
          return (
            <motion.button
              key={level}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setLevelFilter(isActive ? '' : level)
                setPage(1)
              }}
              className={cn(
                'relative p-4 rounded-xl border transition-all',
                isActive
                  ? `${cfg.bg} ${cfg.border} ring-1 ring-current/20`
                  : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.06] hover:bg-gray-100 dark:hover:bg-white/[0.05]'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('w-4 h-4', cfg.color)} />
                <span className={cn('text-xs font-medium uppercase tracking-wider', isActive ? cfg.color : 'text-gray-500 dark:text-white/50')}>
                  {cfg.label}
                </span>
              </div>
              <p className={cn('text-2xl font-bold', isActive ? cfg.color : 'text-gray-800 dark:text-white/80')}>
                {count}
              </p>
            </motion.button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={isZh ? '搜索日志...' : 'Search logs...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white/90 text-sm placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gray-300 dark:focus:border-white/20 transition-colors"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 dark:text-white/40 flex-shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-white/80 text-sm focus:outline-none cursor-pointer"
          >
            <option value="">{isZh ? '全部类型' : 'All Types'}</option>
            <option value="operation">{isZh ? '操作日志' : 'Operations'}</option>
            <option value="api_error">{isZh ? '接口错误' : 'API Errors'}</option>
            <option value="system">{isZh ? '系统日志' : 'System'}</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadLogs()}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white/90 transition-colors"
            title={isZh ? '刷新' : 'Refresh'}
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClearLogs}
            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-500 dark:text-red-400/80 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title={isZh ? '清除全部日志' : 'Clear all logs'}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Log List */}
      <div className="space-y-1.5">
        {loading && !data ? (
          <div className="py-20 text-center text-gray-400 dark:text-white/40">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
            <p className="text-sm">{isZh ? '加载中...' : 'Loading...'}</p>
          </div>
        ) : data?.logs.length === 0 ? (
          <div className="py-20 text-center text-gray-400 dark:text-white/40">
            <ScrollText className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{isZh ? '暂无日志记录' : 'No logs found'}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {data?.logs.map((log, index) => (
              <LogItem
                key={log.id}
                log={log}
                index={index}
                isExpanded={expandedId === log.id}
                onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                formatTime={formatTime}
                isZh={isZh}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500 dark:text-white/40">
            {isZh
              ? `第 ${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，共 ${pagination.total} 条`
              : `${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(pagination.page * pagination.pageSize, pagination.total)} of ${pagination.total}`}
          </p>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/60 disabled:opacity-30 hover:text-gray-700 dark:hover:text-white/90 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <span className="text-xs text-gray-600 dark:text-white/60 px-2">
              {page} / {pagination.totalPages}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/60 disabled:opacity-30 hover:text-gray-700 dark:hover:text-white/90 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}

// 单条日志项
interface LogItemProps {
  log: LogEntry
  index: number
  isExpanded: boolean
  onToggle: () => void
  formatTime: (iso: string) => string
  isZh: boolean
}

const LogItem = forwardRef<HTMLDivElement, LogItemProps>(({
  log,
  index,
  isExpanded,
  onToggle,
  formatTime,
  isZh,
}, ref) => {
  const cfg = LEVEL_CONFIG[log.level]
  const typeCfg = TYPE_CONFIG[log.type]
  const Icon = cfg.icon

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: Math.min(index, 10) * 0.02 }}
      onClick={onToggle}
      className={cn(
        'group relative rounded-xl border cursor-pointer transition-all',
        'bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04]',
        isExpanded ? `${cfg.border} ${cfg.bg}` : 'border-gray-200 dark:border-white/[0.05]'
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Level Icon */}
        <div className={cn('mt-0.5 p-1.5 rounded-lg flex-shrink-0', cfg.bg)}>
          <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">
              {log.message}
            </span>
            <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded', cfg.bg, cfg.color)}>
              {cfg.label}
            </span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.04]', typeCfg.color)}>
              {isZh ? typeCfg.label : typeCfg.labelEn}
            </span>
          </div>

          {log.detail && (
            <p className="text-xs text-gray-500 dark:text-white/40 mt-1 truncate">
              {log.detail}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 dark:text-white/30">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(log.createdAt)}
            </span>
            {log.username && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {log.username}
              </span>
            )}
            {log.method && (
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3" />
                {log.method}
              </span>
            )}
            {log.statusCode && (
              <span className={cn(
                'font-mono',
                log.statusCode >= 500 ? 'text-red-500 dark:text-red-400/60' :
                log.statusCode >= 400 ? 'text-amber-500 dark:text-amber-400/60' :
                'text-emerald-500 dark:text-emerald-400/60'
              )}>
                {log.statusCode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 border-t border-gray-200 dark:border-white/[0.04] space-y-2">
              {log.path && (
                <DetailRow icon={Globe} label={isZh ? '路径' : 'Path'} value={log.path} />
              )}
              {log.detail && (
                <DetailRow icon={Info} label={isZh ? '详情' : 'Detail'} value={log.detail} />
              )}
              {log.ip && (
                <DetailRow icon={Globe} label="IP" value={log.ip} />
              )}
              {log.userAgent && (
                <DetailRow icon={Terminal} label="UA" value={log.userAgent} />
              )}
              <DetailRow icon={Clock} label={isZh ? '时间' : 'Time'} value={new Date(log.createdAt).toLocaleString()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

LogItem.displayName = 'LogItem'

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-white/30 mt-0.5 flex-shrink-0" />
      <span className="text-gray-500 dark:text-white/40 flex-shrink-0 w-10">{label}</span>
      <span className="text-gray-700 dark:text-white/60 break-all font-mono">{value}</span>
    </div>
  )
}

export default LogsCard
