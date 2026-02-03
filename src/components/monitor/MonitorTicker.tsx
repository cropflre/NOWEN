/**
 * MonitorTicker - 一行展示型状态栏 (The Telemetry Stream)
 * 设计隐喻：星际战舰的遥测数据流
 * 高度 40-48px，玻璃拟态背景，横向排列实时指标
 * 支持日间/夜间模式
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { cn } from '../../lib/utils'
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Thermometer, 
  HardDrive, 
  Box,
  Maximize2,
  Minimize2,
  Circle
} from 'lucide-react'
import type { MonitorViewMode } from './SystemMonitor'

interface MonitorTickerProps {
  cpu: number
  mem: number
  temp: number
  net: {
    up: string
    down: string
  }
  disk?: {
    used: number
  }
  containers?: {
    running: number
    total: number
  }
  status: 'healthy' | 'warning' | 'critical'
  className?: string
  compact?: boolean
  onSwitchMode?: (mode: MonitorViewMode) => void
}

// ============================================
// 动画数字组件 - 平滑过渡
// ============================================
function AnimatedNumber({ value, suffix = '', className }: { value: number; suffix?: string; className?: string }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (current) => `${Math.round(current)}${suffix}`)
  
  useEffect(() => {
    spring.set(value)
  }, [spring, value])
  
  return <motion.span className={cn("tabular-nums", className)}>{display}</motion.span>
}

// ============================================
// 迷你波形图组件
// ============================================
function MiniSparkline({ value, color }: { value: number; color: string }) {
  const [history, setHistory] = useState<number[]>([])
  
  useEffect(() => {
    setHistory(prev => {
      const newHistory = [...prev, value]
      if (newHistory.length > 20) newHistory.shift()
      return newHistory
    })
  }, [value])
  
  if (history.length < 2) return null
  
  const height = 16
  const width = 40
  const points = history.map((v, i) => {
    const x = (i / (history.length - 1)) * width
    const y = height - (v / 100) * height
    return `${x},${y}`
  }).join(' ')
  
  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

// ============================================
// 迷你进度条组件 - 适配主题
// ============================================
function MiniProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  )
}

// ============================================
// 主组件
// ============================================
export function MonitorTicker({ 
  cpu, 
  mem, 
  temp,
  net, 
  disk,
  containers,
  status,
  className,
  compact = false,
  onSwitchMode,
}: MonitorTickerProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const isOnline = status !== 'critical'
  
  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  
  // 状态颜色配置
  const statusConfig = {
    healthy: { color: '#22c55e', pulse: false, text: 'SYSTEM ONLINE' },
    warning: { color: '#f59e0b', pulse: true, text: 'ELEVATED LOAD' },
    critical: { color: '#ef4444', pulse: true, text: 'ALERT' },
  }

  // 数值颜色（根据负载）
  const getValueColor = (val: number) => {
    if (val > 80) return '#f87171' // red-400
    if (val > 60) return '#fbbf24' // amber-400
    return '#22d3ee' // cyan-400
  }

  return (
    <div className={cn(
      // 高度和基础布局
      "h-11 flex items-center gap-3 px-4",
      // 玻璃拟态背景 - 适配主题
      "bg-white/70 dark:bg-slate-950/60",
      "backdrop-blur-xl",
      // 边框效果 - 适配主题
      "border-y",
      "border-slate-200/80 dark:border-white/[0.08]",
      // 顶部高光 - 适配主题
      "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
      // 字体和交互
      "font-mono text-xs",
      "text-slate-500 dark:text-white/60",
      "select-none overflow-hidden w-full",
      className
    )}>
      {/* ===== 左侧：状态指示 ===== */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* 呼吸闪烁的状态点 */}
        <motion.div 
          className="relative"
          animate={statusConfig[status].pulse ? {
            scale: [1, 1.2, 1],
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusConfig[status].color }}
          />
          {/* 光晕效果 */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: statusConfig[status].color }}
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        
        <span className={cn(
          "font-bold tracking-wider text-[11px]",
          status === 'healthy' && "text-green-600 dark:text-green-400/90",
          status === 'warning' && "text-amber-600 dark:text-amber-400/90",
          status === 'critical' && "text-red-600 dark:text-red-400/90 animate-pulse"
        )}>
          {statusConfig[status].text}
        </span>
      </div>

      {/* 分隔符 */}
      <div className="w-px h-4 bg-slate-300 dark:bg-white/10" />

      {/* ===== 中间：实时指标 ===== */}
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        {/* CPU 指标 + 迷你波形 */}
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-600/60 dark:text-cyan-400/60" />
          <span className="text-slate-400 dark:text-white/40 text-[10px]">CPU</span>
          <AnimatedNumber 
            value={cpu} 
            suffix="%" 
            className={cn("font-bold", cpu > 80 ? "text-red-500 dark:text-red-400" : cpu > 60 ? "text-amber-500 dark:text-amber-400" : "text-cyan-600 dark:text-cyan-400")}
          />
          {!compact && <MiniSparkline value={cpu} color={getValueColor(cpu)} />}
        </div>

        {/* 内存指标 + 进度条 */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-white/40 text-[10px]">MEM</span>
          <AnimatedNumber 
            value={mem} 
            suffix="%" 
            className={cn("font-bold", mem > 80 ? "text-red-500 dark:text-red-400" : mem > 60 ? "text-amber-500 dark:text-amber-400" : "text-purple-600 dark:text-purple-400")}
          />
          {!compact && <MiniProgressBar value={mem} color={getValueColor(mem)} />}
        </div>

        {!compact && (
          <>
            {/* 温度 */}
            {temp > 0 && (
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-3 h-3 text-orange-500/60 dark:text-orange-400/60" />
                <span className={cn(
                  "tabular-nums font-medium",
                  temp > 80 ? "text-red-500 dark:text-red-400" : temp > 60 ? "text-amber-500 dark:text-amber-400" : "text-orange-500 dark:text-orange-400/80"
                )}>
                  {temp}°C
                </span>
              </div>
            )}

            {/* 分隔符 */}
            <div className="w-px h-4 bg-slate-300 dark:bg-white/10" />

            {/* 网络流量 */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-green-600/60 dark:text-green-400/60" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-500/60 dark:text-red-400/60" />
              )}
              <div className="flex gap-2.5 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="text-[9px] text-green-500 dark:text-green-400">▲</span>
                  <span className="text-purple-600 dark:text-purple-400 tabular-nums">{net.up}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-[9px] text-cyan-500 dark:text-cyan-400">▼</span>
                  <span className="text-cyan-600 dark:text-cyan-400 tabular-nums">{net.down}</span>
                </span>
              </div>
            </div>

            {/* 磁盘 */}
            {disk && (
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-slate-400 dark:text-white/30" />
                <span className={cn(
                  "tabular-nums",
                  disk.used > 80 ? "text-red-500 dark:text-red-400" : disk.used > 60 ? "text-amber-500 dark:text-amber-400" : "text-slate-500 dark:text-white/60"
                )}>
                  {disk.used}%
                </span>
              </div>
            )}

            {/* 容器 */}
            {containers && containers.total > 0 && (
              <div className="flex items-center gap-1.5">
                <Box className="w-3 h-3 text-slate-400 dark:text-white/30" />
                <span className="text-green-600 dark:text-green-400 tabular-nums">{containers.running}</span>
                <span className="text-slate-300 dark:text-white/20">/</span>
                <span className="text-slate-400 dark:text-white/40 tabular-nums">{containers.total}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== 右侧：时间和切换按钮 ===== */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* 装饰性扫描线 */}
        <motion.div 
          className="w-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* 时间显示 */}
        <span className="text-[10px] text-slate-400 dark:text-white/30 tabular-nums w-16 text-right">
          {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
        </span>
        
        {/* 视图切换按钮 */}
        {onSwitchMode && (
          <div className="flex items-center gap-1 border-l border-slate-300 dark:border-white/10 pl-2">
            <button
              onClick={() => onSwitchMode('mini')}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-colors group"
              title="迷你模式"
            >
              <Circle className="w-3.5 h-3.5 text-slate-400 dark:text-white/30 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors" />
            </button>
            <button
              onClick={() => onSwitchMode('default')}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-colors group"
              title="仪表盘模式"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-400 dark:text-white/30 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MonitorTicker
