/**
 * SystemMonitor - 变形金刚监控组件 (The Transformer)
 * 根据 viewMode 状态动态切换不同形态的"外骨骼"
 * 
 * 三种形态：
 * - mini: 迷你型 (The Orb Widget) - 可拖拽悬浮球
 * - inline: 一行展示型 (The Telemetry Stream) - 全宽状态栏
 * - default: 默认型 (The Command Deck) - 全息仪表盘
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useSystemVital, type SystemVitalData } from '../../hooks/useSystemVital'
import { MonitorWidget } from './MonitorWidget'
import { MonitorTicker } from './MonitorTicker'
import { MonitorDashboard } from './MonitorDashboard'
import { Loader2 } from 'lucide-react'

// ============================================
// 类型定义
// ============================================

export type MonitorViewMode = 'default' | 'mini' | 'inline'

export interface SystemMonitorProps {
  /** 初始视图模式（如果 localStorage 没有保存值则使用此值） */
  initialMode?: MonitorViewMode
  className?: string
  /** Mini 专属配置 */
  size?: 'sm' | 'md' | 'lg'
  /** Ticker 专属配置 */
  compact?: boolean
  /** 自定义刷新间隔 (ms) */
  refreshInterval?: number
  /** 是否显示加载状态 */
  showLoading?: boolean
  /** localStorage 存储的 key */
  storageKey?: string
}

// localStorage key
const STORAGE_KEY_DEFAULT = 'nowen-monitor-view-mode'

// ============================================
// 动画变体配置
// ============================================

const variants = {
  initial: { opacity: 0, scale: 0.9, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
}

const transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
}

// ============================================
// 加载占位组件
// ============================================

function LoadingPlaceholder({ viewMode }: { viewMode: MonitorViewMode }) {
  if (viewMode === 'mini') {
    return (
      <div className="w-32 h-32 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-cyan-400/50 animate-spin" />
      </div>
    )
  }
  
  if (viewMode === 'inline') {
    return (
      <div className="h-10 flex items-center justify-center bg-black/40 backdrop-blur-md border-y border-white/5">
        <div className="flex items-center gap-2 text-xs text-white/30 font-mono">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>CONNECTING...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[200px] flex items-center justify-center rounded-2xl bg-slate-950/50 border border-white/5">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 text-cyan-400/50 animate-spin" />
        <span className="text-xs text-white/30 font-mono">正在连接系统...</span>
      </div>
    </div>
  )
}

// ============================================
// 错误占位组件
// ============================================

function ErrorPlaceholder({ viewMode, onRetry }: { viewMode: MonitorViewMode; onRetry?: () => void }) {
  if (viewMode === 'mini') {
    return (
      <div 
        className="w-32 h-32 flex items-center justify-center cursor-pointer group"
        onClick={onRetry}
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-red-500/30 flex items-center justify-center">
            <span className="text-red-400 text-xs font-mono">ERR</span>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
            点击重试
          </div>
        </div>
      </div>
    )
  }
  
  if (viewMode === 'inline') {
    return (
      <div className="h-10 flex items-center justify-center gap-2 bg-red-950/20 backdrop-blur-md border-y border-red-500/20">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-red-400/80 font-mono">OFFLINE - 连接失败</span>
      </div>
    )
  }

  return (
    <div className="min-h-[200px] flex items-center justify-center rounded-2xl bg-red-950/20 border border-red-500/20">
      <div className="flex flex-col items-center gap-2">
        <div className="text-red-400 text-2xl">⚠</div>
        <span className="text-sm text-red-400/80">系统连接失败</span>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-xs text-white/50 hover:text-white/80 underline"
          >
            重试连接
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// 主组件
// ============================================

export function SystemMonitor({ 
  initialMode = 'default',
  className,
  size = 'md',
  compact = false,
  refreshInterval = 3000,
  showLoading = true,
  storageKey = STORAGE_KEY_DEFAULT,
}: SystemMonitorProps) {
  // 从 localStorage 读取保存的视图模式
  const [viewMode, setViewMode] = useState<MonitorViewMode>(() => {
    if (typeof window === 'undefined') return initialMode
    const saved = localStorage.getItem(storageKey)
    if (saved && ['default', 'mini', 'inline'].includes(saved)) {
      return saved as MonitorViewMode
    }
    return initialMode
  })

  // 获取系统数据
  const data = useSystemVital(refreshInterval)

  // 切换视图模式的回调函数
  const handleSwitchMode = useCallback((newMode: MonitorViewMode) => {
    setViewMode(newMode)
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newMode)
    }
  }, [storageKey])

  // 监听视图模式变化，同步到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, viewMode)
    }
  }, [viewMode, storageKey])

  // 加载状态
  if (data.isLoading && showLoading) {
    return <LoadingPlaceholder viewMode={viewMode} />
  }

  // 错误状态
  if (data.error) {
    return <ErrorPlaceholder viewMode={viewMode} />
  }

  return (
    <AnimatePresence mode="wait">
      {/* Mini 模式：可拖拽悬浮球 */}
      {viewMode === 'mini' && (
        <motion.div
          key="mini"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          className={className}
        >
          <MonitorWidget 
            cpu={data.cpu}
            mem={data.mem}
            temp={data.temp}
            status={data.status}
            size={size}
            onSwitchMode={handleSwitchMode}
          />
        </motion.div>
      )}

      {/* Inline 模式：全宽状态栏 */}
      {viewMode === 'inline' && (
        <motion.div
          key="inline"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          className={cn("w-full", className)}
        >
          <MonitorTicker 
            cpu={data.cpu}
            mem={data.mem}
            temp={data.temp}
            net={data.net}
            disk={data.disk}
            containers={data.containers}
            status={data.status}
            compact={compact}
            onSwitchMode={handleSwitchMode}
          />
        </motion.div>
      )}

      {/* Default 模式：全息仪表盘 */}
      {viewMode === 'default' && (
        <motion.div
          key="default"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          className={cn("w-full", className)}
        >
          <MonitorDashboard 
            cpu={data.cpu}
            mem={data.mem}
            temp={data.temp}
            net={data.net}
            disk={data.disk}
            containers={data.containers}
            uptime={data.uptime}
            status={data.status}
            onSwitchMode={handleSwitchMode}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 导出子组件供单独使用
export { MonitorWidget, MonitorTicker, MonitorDashboard }
export type { SystemVitalData, MonitorViewMode as MonitorVariant }

export default SystemMonitor
