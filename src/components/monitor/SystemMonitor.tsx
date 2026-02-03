/**
 * SystemMonitor - 变形金刚监控组件 (The Transformer)
 * 根据 variant 属性切换不同形态的"外骨骼"
 * 
 * 三种形态：
 * - mini: 迷你型 (The Orb Widget) - 钢铁侠反应堆风格
 * - ticker: 一行展示型 (The Telemetry Stream) - 终端状态栏
 * - default: 默认型 (The Command Deck) - 全息仪表盘
 */
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

export type MonitorVariant = 'mini' | 'ticker' | 'default'

export interface SystemMonitorProps {
  variant?: MonitorVariant
  className?: string
  // Mini 专属配置
  size?: 'sm' | 'md' | 'lg'
  // Ticker 专属配置
  compact?: boolean
  // 自定义刷新间隔 (ms)
  refreshInterval?: number
  // 是否显示加载状态
  showLoading?: boolean
}

// ============================================
// 加载占位组件
// ============================================

function LoadingPlaceholder({ variant }: { variant: MonitorVariant }) {
  if (variant === 'mini') {
    return (
      <div className="w-32 h-32 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-cyan-400/50 animate-spin" />
      </div>
    )
  }
  
  if (variant === 'ticker') {
    return (
      <div className="h-8 flex items-center justify-center bg-black/40 backdrop-blur-md border-t border-white/5">
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

function ErrorPlaceholder({ variant, onRetry }: { variant: MonitorVariant; onRetry?: () => void }) {
  if (variant === 'mini') {
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
  
  if (variant === 'ticker') {
    return (
      <div className="h-8 flex items-center justify-center gap-2 bg-red-950/20 backdrop-blur-md border-t border-red-500/20">
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
  variant = 'default', 
  className,
  size = 'md',
  compact = false,
  refreshInterval = 3000,
  showLoading = true,
}: SystemMonitorProps) {
  const data = useSystemVital(refreshInterval)

  // 加载状态
  if (data.isLoading && showLoading) {
    return <LoadingPlaceholder variant={variant} />
  }

  // 错误状态
  if (data.error) {
    return <ErrorPlaceholder variant={variant} />
  }

  // 形态切换动画配置
  const transitionConfig = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3 }
  }

  return (
    <AnimatePresence mode="wait">
      {variant === 'mini' && (
        <motion.div key="mini" {...transitionConfig} className={className}>
          <MonitorWidget 
            cpu={data.cpu}
            mem={data.mem}
            temp={data.temp}
            status={data.status}
            size={size}
          />
        </motion.div>
      )}

      {variant === 'ticker' && (
        <motion.div key="ticker" {...transitionConfig} className={cn("w-full", className)}>
          <MonitorTicker 
            cpu={data.cpu}
            mem={data.mem}
            temp={data.temp}
            net={data.net}
            disk={data.disk}
            containers={data.containers}
            status={data.status}
            compact={compact}
          />
        </motion.div>
      )}

      {variant === 'default' && (
        <motion.div key="default" {...transitionConfig} className={cn("w-full", className)}>
          <MonitorDashboard 
            cpu={data.cpu}
            mem={data.mem}
            temp={data.temp}
            net={data.net}
            disk={data.disk}
            containers={data.containers}
            uptime={data.uptime}
            status={data.status}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 导出子组件供单独使用
export { MonitorWidget, MonitorTicker, MonitorDashboard }
export type { SystemVitalData }

export default SystemMonitor
