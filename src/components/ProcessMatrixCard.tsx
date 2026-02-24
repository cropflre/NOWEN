/**
 * ProcessMatrixCard - 进程矩阵卡片
 * 视觉风格：Matrix 矩阵 + 星链状态 (Constellation Status)
 * 设计隐喻：蜂巢矩阵 - 信号灯矩阵
 * 功能：
 *   - 光点 Tab: Docker 容器状态光点 + 航天任务计时器风格的运行时间
 *   - Docker Tab: 容器列表 + 状态 + 启停控制
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR, { mutate } from 'swr'
import { Satellite, Play, Square, RotateCcw, Container, Grip, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'
import { isDemoMode } from '../lib/api'

// ============================================
// 类型定义
// ============================================

interface DockerContainer {
  id: string
  name: string
  image: string
  state: string
  status: string
  started: number
}

interface DynamicSystemInfo {
  uptime: string
  docker: {
    running: number
    paused: number
    stopped: number
    containers: number
  } | null
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

type TabType = 'matrix' | 'docker'

// API Fetcher
const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url)
  const json: ApiResponse<T> = await res.json()
  if (!json.success) {
    throw new Error('API request failed')
  }
  return json.data
}

// ============================================
// 解析运行时间字符串为航天任务格式
// ============================================
function parseUptimeToMission(uptimeStr: string): string {
  const dayMatch = uptimeStr.match(/(\d+)天/)
  const hourMatch = uptimeStr.match(/(\d+)小时/)
  const minMatch = uptimeStr.match(/(\d+)分钟/)
  
  const days = dayMatch ? parseInt(dayMatch[1]) : 0
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0
  const mins = minMatch ? parseInt(minMatch[1]) : 0
  
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0 || days > 0) parts.push(`${hours.toString().padStart(2, '0')}h`)
  parts.push(`${mins.toString().padStart(2, '0')}m`)
  
  return `T+ ${parts.join(' ')}`
}

// ============================================
// 状态映射
// ============================================
function getStateText(state: string): string {
  switch (state) {
    case 'running': return '运行中'
    case 'paused': return '已暂停'
    case 'exited': return '已停止'
    case 'created': return '已创建'
    case 'restarting': return '重启中'
    case 'removing': return '移除中'
    case 'dead': return '已终止'
    default: return '未知'
  }
}

function getStateColor(state: string, isDark: boolean) {
  switch (state) {
    case 'running': return isDark ? '#22c55e' : '#16a34a'
    case 'paused': return isDark ? '#f59e0b' : '#d97706'
    default: return isDark ? '#ef4444' : '#dc2626'
  }
}

// ============================================
// ContainerDot - 容器光点组件
// ============================================
interface ContainerDotProps {
  container: DockerContainer
  isDark?: boolean
}

function ContainerDot({ container, isDark = true }: ContainerDotProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  
  const isRunning = container.state === 'running'
  const isPaused = container.state === 'paused'
  
  const dotColor = isRunning 
    ? (isDark ? '#22c55e' : '#16a34a')
    : isPaused 
      ? (isDark ? '#f59e0b' : '#d97706')
      : (isDark ? '#ef4444' : '#dc2626')

  const randomOffset = useMemo(() => ({
    x: (Math.random() - 0.5) * 4,
    y: (Math.random() - 0.5) * 4,
  }), [])

  const animationDelay = useMemo(() => Math.random() * 2, [])

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    })
    setIsHovered(true)
  }

  return (
    <motion.div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: animationDelay * 0.2, type: 'spring', stiffness: 200 }}
    >
      {isRunning && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: dotColor }}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: animationDelay
          }}
        />
      )}

      <motion.div
        className={cn(
          "w-3 h-3 rounded-full cursor-pointer relative z-10",
          !isRunning && "opacity-60"
        )}
        style={{
          backgroundColor: dotColor,
          boxShadow: isRunning 
            ? (isDark 
                ? `0 0 8px ${dotColor}, 0 0 16px ${dotColor}50`
                : `0 0 6px ${dotColor}, 0 0 12px ${dotColor}40`)
            : (isDark ? `0 0 4px ${dotColor}50` : `0 0 3px ${dotColor}40`),
          transform: `translate(${randomOffset.x}px, ${randomOffset.y}px)`,
        }}
        whileHover={{ scale: 1.5 }}
        animate={isRunning ? {
          opacity: [0.8, 1, 0.8],
        } : {}}
        transition={isRunning ? {
          duration: 2,
          repeat: Infinity,
          delay: animationDelay
        } : {}}
      />

      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translate(-50%, -100%)',
            }}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className={cn(
              "rounded-lg px-3 py-2 text-xs whitespace-nowrap backdrop-blur-sm shadow-xl",
              isDark 
                ? "bg-black/95 border border-green-500/30" 
                : "bg-white/95 border border-green-300/50"
            )}>
              <div className={cn(
                "font-mono font-medium text-sm",
                isDark ? "text-green-400" : "text-green-700"
              )}>
                {container.name}
              </div>
              <div className={cn(
                "text-[10px] font-mono mt-0.5",
                isDark ? "text-white/40" : "text-slate-500"
              )}>
                {container.image.split(':')[0]}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="text-[10px]" style={{ color: dotColor }}>
                  {getStateText(container.state)}
                </span>
              </div>
            </div>
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: isDark ? '5px solid rgba(34, 197, 94, 0.3)' : '5px solid rgba(34, 197, 94, 0.4)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================
// MatrixRain - 矩阵雨背景效果
// ============================================
function MatrixRain({ isDark = true }: { isDark?: boolean }) {
  return (
    <div className={cn(
      "absolute inset-0 overflow-hidden pointer-events-none",
      isDark ? "opacity-20" : "opacity-10"
    )}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "absolute font-mono text-[10px] animate-matrix-fall",
            isDark ? "text-green-500" : "text-emerald-600"
          )}
          style={{
            left: `${(i * 8) + 2}%`,
            animationDuration: `${3 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          {Array.from({ length: 8 }).map((_, j) => (
            <div key={j} className="opacity-50">
              {String.fromCharCode(0x30A0 + Math.random() * 96)}
            </div>
          ))}
        </div>
      ))}
      
      <style>{`
        @keyframes matrix-fall {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        .animate-matrix-fall {
          animation: matrix-fall linear infinite;
        }
      `}</style>
    </div>
  )
}

// ============================================
// MissionTimer - 紧凑内联运行时间
// ============================================
function MissionTimer({ uptime, isDark = true }: { uptime: string; isDark?: boolean }) {
  const missionTime = parseUptimeToMission(uptime)

  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px]">
      <div className={cn(
        "w-1.5 h-1.5 rounded-full animate-pulse",
        isDark ? "bg-green-400" : "bg-emerald-500"
      )} />
      <span className={cn(
        isDark ? "text-green-500/50" : "text-emerald-600/60"
      )}>
        {missionTime}
      </span>
    </div>
  )
}

// ============================================
// DockerContainerRow - 容器列表行组件
// ============================================
interface DockerContainerRowProps {
  container: DockerContainer
  isDark: boolean
  isDemo: boolean
  loadingAction: string | null
  onAction: (id: string, action: 'start' | 'stop' | 'restart') => void
}

function DockerContainerRow({ container, isDark, isDemo, loadingAction, onAction }: DockerContainerRowProps) {
  const isRunning = container.state === 'running'
  const stateColor = getStateColor(container.state, isDark)
  const isLoading = loadingAction !== null
  
  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors",
        isDark
          ? "bg-black/30 border-green-500/10 hover:border-green-500/25"
          : "bg-emerald-50/40 border-emerald-200/30 hover:border-emerald-300/50"
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 状态灯 */}
      <div className="flex-shrink-0">
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: stateColor }}
          animate={isRunning ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] } : {}}
          transition={isRunning ? { duration: 2, repeat: Infinity } : {}}
        />
      </div>

      {/* 容器信息 */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-xs font-mono font-medium truncate",
          isDark ? "text-green-300" : "text-emerald-700"
        )}>
          {container.name}
        </div>
        <div className={cn(
          "text-[10px] font-mono truncate",
          isDark ? "text-white/30" : "text-slate-400"
        )}>
          {container.image.length > 30 ? container.image.split(':')[0] : container.image}
        </div>
      </div>

      {/* 状态标签 */}
      <div
        className={cn(
          "flex-shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded",
          isDark ? "bg-black/40" : "bg-white/60"
        )}
        style={{ color: stateColor }}
      >
        {getStateText(container.state)}
      </div>

      {/* 控制按钮 */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {isRunning ? (
          <>
            <button
              onClick={() => onAction(container.id, 'stop')}
              disabled={isDemo || isLoading}
              className={cn(
                "p-1 rounded transition-colors",
                isDark
                  ? "hover:bg-red-500/20 text-red-400/70 hover:text-red-400"
                  : "hover:bg-red-50 text-red-400 hover:text-red-500",
                (isDemo || isLoading) && "opacity-30 cursor-not-allowed"
              )}
              title="停止"
            >
              {loadingAction === 'stop' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Square className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={() => onAction(container.id, 'restart')}
              disabled={isDemo || isLoading}
              className={cn(
                "p-1 rounded transition-colors",
                isDark
                  ? "hover:bg-amber-500/20 text-amber-400/70 hover:text-amber-400"
                  : "hover:bg-amber-50 text-amber-500 hover:text-amber-600",
                (isDemo || isLoading) && "opacity-30 cursor-not-allowed"
              )}
              title="重启"
            >
              {loadingAction === 'restart' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RotateCcw className="w-3 h-3" />
              )}
            </button>
          </>
        ) : (
          <button
            onClick={() => onAction(container.id, 'start')}
            disabled={isDemo || isLoading}
            className={cn(
              "p-1 rounded transition-colors",
              isDark
                ? "hover:bg-green-500/20 text-green-400/70 hover:text-green-400"
                : "hover:bg-green-50 text-green-500 hover:text-green-600",
              (isDemo || isLoading) && "opacity-30 cursor-not-allowed"
            )}
            title="启动"
          >
            {loadingAction === 'start' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ============================================
// 主组件：ProcessMatrixCard
// ============================================
export function ProcessMatrixCard({ className }: { className?: string }) {
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const isDemo = isDemoMode()
  const [activeTab, setActiveTab] = useState<TabType>('matrix')
  const [actionLoading, setActionLoading] = useState<Record<string, string | null>>({})
  
  // 获取 Docker 容器列表
  const { data: containers, error: containerError, isLoading: containerLoading } = useSWR<DockerContainer[]>(
    '/api/system/docker',
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  // 获取系统动态信息（用于 uptime）
  const { data: systemInfo } = useSWR<DynamicSystemInfo>(
    '/api/system/dynamic',
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: false,
    }
  )

  // 统计容器状态
  const stats = useMemo(() => {
    if (!containers) return { running: 0, stopped: 0, total: 0 }
    return {
      running: containers.filter(c => c.state === 'running').length,
      stopped: containers.filter(c => c.state !== 'running').length,
      total: containers.length,
    }
  }, [containers])

  // Docker 容器操作
  const handleDockerAction = useCallback(async (containerId: string, action: 'start' | 'stop' | 'restart') => {
    if (isDemo) return
    
    setActionLoading(prev => ({ ...prev, [containerId]: action }))
    try {
      const res = await fetch(`/api/system/docker/${containerId}/${action}`, { method: 'POST' })
      const json = await res.json()
      if (!json.success) {
        console.error(`Docker ${action} failed:`, json.error)
      }
      // 刷新容器列表
      mutate('/api/system/docker')
    } catch (err) {
      console.error(`Docker ${action} error:`, err)
    } finally {
      setActionLoading(prev => ({ ...prev, [containerId]: null }))
    }
  }, [isDemo])

  const uptime = systemInfo?.uptime || '0分钟'

  // Tab 配置
  const tabs: { key: TabType; icon: React.ReactNode; label: string }[] = [
    { key: 'matrix', icon: <Grip className="w-3 h-3" />, label: t('monitor.tab_matrix', '光点') },
    { key: 'docker', icon: <Container className="w-3 h-3" />, label: 'Docker' },
  ]

  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden",
      "backdrop-blur-xl",
      "p-3 sm:p-4 h-full min-w-0",
      isDark 
        ? "bg-gradient-to-br from-gray-950 via-gray-900 to-black border border-green-500/20"
        : "bg-gradient-to-br from-emerald-50/95 via-white/90 to-emerald-50/95 border border-emerald-200/50 shadow-xl shadow-emerald-500/5",
      className
    )}>
      {/* 矩阵雨背景 */}
      <MatrixRain isDark={isDark} />

      {/* 扫描线效果 */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none",
          isDark ? "opacity-10" : "opacity-5"
        )}
        style={{
          background: isDark 
            ? 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.1) 2px, rgba(34, 197, 94, 0.1) 4px)'
            : 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16, 185, 129, 0.1) 2px, rgba(16, 185, 129, 0.1) 4px)',
        }}
      />

      {/* 标题栏 */}
      <div className="relative z-10 mb-2.5 space-y-2">
        {/* 第一行：标题 + 运行时间 + 容器统计 */}
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="flex-shrink-0"
          >
            <Satellite className={cn(
              "w-3.5 h-3.5",
              isDark ? "text-green-400" : "text-emerald-600"
            )} />
          </motion.div>
          <span className={cn(
            "text-xs sm:text-sm font-medium tracking-wider flex-shrink-0",
            isDark ? "text-green-400/80" : "text-emerald-700"
          )}>
            {t('monitor.service_hive')}
          </span>

          {/* 运行时间 */}
          <MissionTimer uptime={uptime} isDark={isDark} />

          {/* 容器统计 */}
          <div className="ml-auto flex items-center gap-2 text-[10px] font-mono flex-shrink-0">
            <div className="flex items-center gap-1">
              <motion.div 
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isDark ? "bg-green-400" : "bg-emerald-500"
                )}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className={isDark ? "text-green-400" : "text-emerald-600 font-medium"}>{stats.running}</span>
            </div>
            <span className={isDark ? "text-white/20" : "text-slate-300"}>|</span>
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                isDark ? "bg-red-400/60" : "bg-red-400"
              )} />
              <span className={isDark ? "text-red-400/70" : "text-red-500"}>{stats.stopped}</span>
            </div>
          </div>
        </div>

        {/* 第二行：Tab 切换 */}
        <div className={cn(
          "flex items-center rounded-lg border p-0.5 gap-0.5",
          isDark ? "border-green-500/15 bg-black/20" : "border-emerald-200/40 bg-emerald-50/40"
        )}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono transition-all duration-200",
                activeTab === tab.key
                  ? (isDark 
                      ? "bg-green-500/20 text-green-400 shadow-sm shadow-green-500/10" 
                      : "bg-emerald-100 text-emerald-700 shadow-sm")
                  : (isDark 
                      ? "text-white/30 hover:text-white/50 hover:bg-white/5" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="relative z-10">
        {/* 加载状态 */}
        {containerLoading && !containers && (
          <div className="flex items-center justify-center py-12">
            <div className={cn(
              "font-mono text-xs animate-pulse",
              isDark ? "text-green-400" : "text-emerald-600"
            )}>
              正在加载矩阵...
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {containerError && (
          <div className={cn(
            "flex items-center justify-center py-8 text-xs font-mono",
            isDark ? "text-red-400" : "text-red-600"
          )}>
            连接失败
          </div>
        )}

        {/* Tab 内容 */}
        <AnimatePresence mode="wait">
          {/* ===== 光点矩阵 Tab ===== */}
          {activeTab === 'matrix' && containers && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {containers.length > 0 ? (
                <div className="mb-4">
                  <div className={cn(
                    "flex flex-wrap gap-3 justify-center items-center p-4 rounded-lg border min-h-[80px]",
                    isDark 
                      ? "bg-black/30 border-green-500/10" 
                      : "bg-emerald-50/50 border-emerald-200/30"
                  )}>
                    {containers.map((container) => (
                      <ContainerDot 
                        key={container.id} 
                        container={container}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "flex flex-col items-center justify-center py-8",
                  isDark ? "text-green-400/50" : "text-emerald-500/60"
                )}>
                  <div className="text-2xl mb-2">○</div>
                  <div className="text-xs font-mono">暂无容器</div>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== Docker 列表 Tab ===== */}
          {activeTab === 'docker' && containers && (
            <motion.div
              key="docker"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {containers.length > 0 ? (
                <div className="mb-4 space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-thin pr-1">
                  {/* Docker 统计摘要 */}
                  <div className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-mono",
                    isDark ? "bg-green-500/5 text-green-500/60" : "bg-emerald-50 text-emerald-600/70"
                  )}>
                    <span>共 {stats.total} 个容器</span>
                    <span>
                      <span style={{ color: getStateColor('running', isDark) }}>{stats.running} 运行</span>
                      {stats.stopped > 0 && (
                        <>
                          <span className="mx-1">·</span>
                          <span style={{ color: getStateColor('exited', isDark) }}>{stats.stopped} 停止</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* 容器列表 */}
                  {containers.map(container => (
                    <DockerContainerRow
                      key={container.id}
                      container={container}
                      isDark={isDark}
                      isDemo={isDemo}
                      loadingAction={actionLoading[container.id] || null}
                      onAction={handleDockerAction}
                    />
                  ))}

                  {/* 演示模式提示 */}
                  {isDemo && (
                    <div className={cn(
                      "text-center text-[10px] font-mono py-1",
                      isDark ? "text-amber-400/50" : "text-amber-600/60"
                    )}>
                      演示模式下禁止操作容器
                    </div>
                  )}
                </div>
              ) : (
                <div className={cn(
                  "flex flex-col items-center justify-center py-8",
                  isDark ? "text-green-400/50" : "text-emerald-500/60"
                )}>
                  <Container className="w-6 h-6 mb-2 opacity-50" />
                  <div className="text-xs font-mono">暂无 Docker 容器</div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 边框发光效果 */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: isDark 
            ? 'inset 0 0 30px rgba(34, 197, 94, 0.05)' 
            : 'inset 0 0 20px rgba(16, 185, 129, 0.03)',
        }}
      />

      {/* 角落装饰 */}
      <div className={cn(
        "absolute top-2 left-2 w-2 h-2 border-l border-t",
        isDark ? "border-green-500/30" : "border-emerald-400/40"
      )} />
      <div className={cn(
        "absolute top-2 right-2 w-2 h-2 border-r border-t",
        isDark ? "border-green-500/30" : "border-emerald-400/40"
      )} />
      <div className={cn(
        "absolute bottom-2 left-2 w-2 h-2 border-l border-b",
        isDark ? "border-green-500/30" : "border-emerald-400/40"
      )} />
      <div className={cn(
        "absolute bottom-2 right-2 w-2 h-2 border-r border-b",
        isDark ? "border-green-500/30" : "border-emerald-400/40"
      )} />
    </div>
  )
}

export default ProcessMatrixCard
