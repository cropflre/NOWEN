import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Eye,
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Activity,
  Bookmark,
  MousePointerClick,
  Globe,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  VisitStats,
  TopBookmark,
  VisitTrend,
  RecentVisit,
  visitsApi,
} from '../../lib/api'

interface AnalyticsCardProps {
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void
}

export function AnalyticsCard({ onShowToast }: AnalyticsCardProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [topBookmarks, setTopBookmarks] = useState<TopBookmark[]>([])
  const [trend, setTrend] = useState<VisitTrend[]>([])
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'top' | 'recent'>('overview')
  const [topPeriod, setTopPeriod] = useState<'day' | 'week' | 'month' | 'all'>('all')

  // 加载数据
  const loadData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    else setLoading(true)

    try {
      // 并行请求，但分别处理错误
      const results = await Promise.allSettled([
        visitsApi.stats(),
        visitsApi.top(10, topPeriod),
        visitsApi.trend(7),
        visitsApi.recent(20),
      ])

      // 处理每个结果
      if (results[0].status === 'fulfilled') {
        setStats(results[0].value)
      } else {
        console.error('Failed to load stats:', results[0].reason)
      }

      if (results[1].status === 'fulfilled') {
        setTopBookmarks(results[1].value)
      } else {
        console.error('Failed to load top bookmarks:', results[1].reason)
      }

      if (results[2].status === 'fulfilled') {
        setTrend(results[2].value)
      } else {
        console.error('Failed to load trend:', results[2].reason)
      }

      if (results[3].status === 'fulfilled') {
        setRecentVisits(results[3].value)
      } else {
        console.error('Failed to load recent visits:', results[3].reason)
      }

      // 如果所有请求都失败了，显示错误
      if (results.every(r => r.status === 'rejected')) {
        onShowToast?.('error', t('admin.analytics.load_error'))
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
      onShowToast?.('error', t('admin.analytics.load_error'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [topPeriod, t, onShowToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 刷新热门书签
  useEffect(() => {
    if (!loading) {
      visitsApi.top(10, topPeriod).then(setTopBookmarks).catch(console.error)
    }
  }, [topPeriod, loading])

  // 清除访问记录
  const handleClear = async () => {
    setClearing(true)
    try {
      await visitsApi.clear()
      onShowToast?.('success', t('admin.analytics.clear_success'))
      setShowClearConfirm(false)
      loadData()
    } catch (error) {
      console.error('Failed to clear visits:', error)
      onShowToast?.('error', t('admin.analytics.clear_error'))
    } finally {
      setClearing(false)
    }
  }

  // 计算趋势图的最大值
  const maxTrendValue = Math.max(...trend.map(t => t.count), 1)

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('admin.analytics.just_now')
    if (minutes < 60) return t('admin.analytics.minutes_ago', { count: minutes })
    if (hours < 24) return t('admin.analytics.hours_ago', { count: hours })
    if (days < 7) return t('admin.analytics.days_ago', { count: days })
    return date.toLocaleDateString()
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-8 h-8 text-gray-400 dark:text-white/40" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
            <BarChart3 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{t('admin.analytics.title')}</h3>
            <p className="text-sm text-gray-500 dark:text-white/50">{t('admin.analytics.description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className={cn(
              'p-2 rounded-lg transition-all',
              'bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10',
              'text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white',
              refreshing && 'animate-spin'
            )}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className={cn(
              'p-2 rounded-lg transition-all',
              'bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20',
              'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
            )}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          label={t('admin.analytics.total_visits')}
          value={formatNumber(stats?.totalVisits || 0)}
          gradient="from-blue-500/20 to-cyan-500/20"
          iconColor="text-blue-400"
        />
        <StatCard
          icon={Calendar}
          label={t('admin.analytics.today_visits')}
          value={formatNumber(stats?.todayVisits || 0)}
          gradient="from-green-500/20 to-emerald-500/20"
          iconColor="text-green-400"
        />
        <StatCard
          icon={TrendingUp}
          label={t('admin.analytics.week_visits')}
          value={formatNumber(stats?.weekVisits || 0)}
          gradient="from-purple-500/20 to-pink-500/20"
          iconColor="text-purple-400"
        />
        <StatCard
          icon={Bookmark}
          label={t('admin.analytics.visited_bookmarks')}
          value={`${stats?.visitedBookmarks || 0}/${stats?.totalBookmarks || 0}`}
          gradient="from-orange-500/20 to-amber-500/20"
          iconColor="text-orange-400"
        />
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 p-1 rounded-lg bg-gray-100 dark:bg-white/5">
        {(['overview', 'top', 'recent'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80'
            )}
          >
            {t(`admin.analytics.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* 访问趋势图 */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-gray-500 dark:text-white/60" />
                <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                  {t('admin.analytics.visit_trend')}
                </span>
                <span className="text-xs text-gray-400 dark:text-white/40">
                  ({t('admin.analytics.last_7_days')})
                </span>
              </div>
              <div className="flex items-end gap-2 h-32">
                {trend.map((item, index) => (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.count / maxTrendValue) * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className={cn(
                        'w-full rounded-t-md min-h-[4px]',
                        'bg-gradient-to-t from-blue-500/60 to-blue-400/80 dark:from-blue-500/40 dark:to-blue-400/60'
                      )}
                    />
                    <span className="text-xs text-gray-400 dark:text-white/40">{formatDate(item.date)}</span>
                    <span className="text-xs text-gray-600 dark:text-white/60">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'top' && (
          <motion.div
            key="top"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* 时间段筛选 */}
            <div className="flex gap-2">
              {(['all', 'month', 'week', 'day'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTopPeriod(period)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    topPeriod === period
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-white/5 dark:text-white/50 dark:hover:text-white/80'
                  )}
                >
                  {t(`admin.analytics.period.${period}`)}
                </button>
              ))}
            </div>

            {/* 热门书签列表 */}
            <div className="space-y-2">
              {topBookmarks.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-white/40">
                  <MousePointerClick className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{t('admin.analytics.no_visits')}</p>
                </div>
              ) : (
                topBookmarks.map((bookmark, index) => (
                  <motion.div
                    key={bookmark.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg',
                      'bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 transition-all',
                      'group cursor-pointer'
                    )}
                    onClick={() => window.open(bookmark.url, '_blank')}
                  >
                    {/* 排名 */}
                    <div className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold',
                      index === 0 && 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400',
                      index === 1 && 'bg-gray-200 text-gray-500 dark:bg-gray-400/20 dark:text-gray-300',
                      index === 2 && 'bg-orange-100 text-orange-600 dark:bg-orange-600/20 dark:text-orange-400',
                      index > 2 && 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50'
                    )}>
                      {index + 1}
                    </div>

                    {/* 图标 */}
                    <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                      {bookmark.favicon ? (
                        <img
                          src={bookmark.favicon}
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
                        {bookmark.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-white/40 truncate">
                        {bookmark.url}
                      </p>
                    </div>

                    {/* 访问次数 */}
                    <div className="flex items-center gap-1 text-gray-500 dark:text-white/60">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {formatNumber(bookmark.visitCount)}
                      </span>
                    </div>

                    {/* 外链图标 */}
                    <ExternalLink className="w-4 h-4 text-transparent group-hover:text-gray-400 dark:text-white/0 dark:group-hover:text-white/40 transition-colors" />
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'recent' && (
          <motion.div
            key="recent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {recentVisits.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-white/40">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{t('admin.analytics.no_recent_visits')}</p>
              </div>
            ) : (
              recentVisits.map((visit, index) => (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    'bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 transition-all',
                    'group cursor-pointer'
                  )}
                  onClick={() => window.open(visit.bookmark.url, '_blank')}
                >
                  {/* 图标 */}
                  <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                    {visit.bookmark.favicon ? (
                      <img
                        src={visit.bookmark.favicon}
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
                      {visit.bookmark.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/40 truncate">
                      {visit.bookmark.url}
                    </p>
                  </div>

                  {/* 时间 */}
                  <div className="flex items-center gap-1 text-gray-400 dark:text-white/40">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{formatTime(visit.visitedAt)}</span>
                  </div>

                  {/* 外链图标 */}
                  <ExternalLink className="w-4 h-4 text-transparent group-hover:text-gray-400 dark:text-white/0 dark:group-hover:text-white/40 transition-colors" />
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 清除确认对话框 */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
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
                  {t('admin.analytics.clear_confirm_title')}
                </h3>
              </div>
              <p className="text-gray-500 dark:text-white/60 mb-6">
                {t('admin.analytics.clear_confirm_message')}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-colors',
                    'bg-red-500 hover:bg-red-600 text-white',
                    clearing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {clearing ? t('common.processing') : t('common.confirm')}
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

export default AnalyticsCard
