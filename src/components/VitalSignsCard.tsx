/**
 * VitalSignsCard - 生命体征监控卡片
 * 视觉风格：钢铁侠 Arc Reactor + 液态球 + 实时趋势图
 * 设计隐喻：反应堆核心 (Reactor Core)
 * 功能：实时显示 CPU 负载和内存使用 + 历史趋势
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import useSWR from 'swr'
import { Activity, Thermometer, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../lib/utils'
import { useThemeContext } from '../hooks/useTheme'

// ============================================
// 类型定义
// ============================================

interface DynamicSystemInfo {
  cpu: {
    load: number
    temperature: number | null
  }
  memory: {
    total: number
    used: number
    free: number
    usagePercent: number
    swapTotal: number
    swapUsed: number
  }
  uptime: string
}

interface ApiResponse {
  success: boolean
  data: DynamicSystemInfo
}

interface HistoryPoint {
  cpu: number
  mem: number
  time: number
}

// 格式化字节
function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// API Fetcher
const fetcher = async (url: string): Promise<DynamicSystemInfo> => {
  const res = await fetch(url)
  const json: ApiResponse = await res.json()
  if (!json.success) throw new Error('API request failed')
  return json.data
}

// 安全获取数值
function safeNumber(value: number | undefined | null, defaultValue: number = 0): number {
  if (value === undefined || value === null || isNaN(value)) return defaultValue
  return value
}

// ============================================
// AnimatedValue - 数字滚动动画
// ============================================
function AnimatedValue({ value, suffix = '%', className }: { value: number; suffix?: string; className?: string }) {
  const prevValue = useRef(value)
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 })
  const display = useTransform(spring, (current) => Math.round(current))
  const [displayValue, setDisplayValue] = useState(Math.round(value))
  const [trend, setTrend] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (value !== prevValue.current) {
      setTrend(value > prevValue.current ? 'up' : 'down')
      prevValue.current = value
    }
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayValue(Math.round(v)))
    return unsubscribe
  }, [display])

  return (
    <span className={cn('tabular-nums inline-flex items-center', className)}>
      <motion.span key={displayValue} initial={{ scale: 1 }} animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.3 }}>
        {displayValue}{suffix}
      </motion.span>
      {trend && (
        <motion.span
          className={cn("ml-0.5 text-[0.5em]", trend === 'up' ? "text-rose-400/60" : "text-green-400/60")}
          initial={{ opacity: 0, y: trend === 'up' ? 4 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          key={`trend-${displayValue}`}
        >
          {trend === 'up' ? '▲' : '▼'}
        </motion.span>
      )}
    </span>
  )
}

// ============================================
// MiniTrendChart - 迷你趋势折线图 (SVG)
// ============================================
const MAX_HISTORY = 30 // 保留 30 个数据点（约 90 秒）

function MiniTrendChart({ 
  history, 
  dataKey,
  color,
  gradientId,
  isDark,
  height = 56,
  label,
  currentValue
}: { 
  history: HistoryPoint[]
  dataKey: 'cpu' | 'mem'
  color: string
  gradientId: string
  isDark: boolean
  height?: number
  label: string
  currentValue: number
}) {
  const width = 200
  const padding = { top: 4, bottom: 4, left: 0, right: 0 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 警告级别颜色
  const isWarning = currentValue > 70
  const isCritical = currentValue > 90
  const lineColor = isCritical ? '#f43f5e' : isWarning ? '#fbbf24' : color

  if (history.length < 2) {
    return (
      <div className="relative">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            isDark ? "text-white/50" : "text-slate-500"
          )}>
            {label}
          </span>
          <span className="text-xs font-bold font-mono tabular-nums" style={{ color: lineColor }}>
            --
          </span>
        </div>
        <div style={{ height }} className="flex items-center justify-center rounded-lg">
          <span className={cn("text-xs font-mono", isDark ? "text-white/25" : "text-slate-400")}>
            collecting...
          </span>
        </div>
      </div>
    )
  }

  // 构建路径
  const points = history.map((point, i) => {
    const x = padding.left + (i / (MAX_HISTORY - 1)) * chartWidth
    const y = padding.top + chartHeight - (Math.min(100, point[dataKey]) / 100) * chartHeight
    return { x, y }
  })

  // 平滑贝塞尔曲线
  const linePath = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`
    const prev = points[i - 1]
    const cpx = (prev.x + point.x) / 2
    return `${path} C ${cpx} ${prev.y}, ${cpx} ${point.y}, ${point.x} ${point.y}`
  }, '')

  // 填充区域路径
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  return (
    <div className="relative">
      {/* 标签 + 数值 */}
      <div className="flex items-center justify-between mb-1 px-1">
        <span className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          isDark ? "text-white/50" : "text-slate-500"
        )}>
          {label}
        </span>
        <span className={cn(
          "text-sm font-bold font-mono tabular-nums"
        )} style={{ color: lineColor }}>
          {Math.round(currentValue)}%
        </span>
      </div>

      <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={isDark ? "0.35" : "0.25"} />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* 参考线 50% / 80% */}
        <line
          x1={padding.left} y1={padding.top + chartHeight * 0.5}
          x2={width - padding.right} y2={padding.top + chartHeight * 0.5}
          stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
          strokeDasharray="4 4"
        />
        <line
          x1={padding.left} y1={padding.top + chartHeight * 0.2}
          x2={width - padding.right} y2={padding.top + chartHeight * 0.2}
          stroke={isDark ? "rgba(244,63,94,0.12)" : "rgba(244,63,94,0.1)"}
          strokeDasharray="3 5"
        />

        {/* 渐变填充区域 */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* 折线 */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: isDark ? `drop-shadow(0 0 4px ${lineColor}50)` : `drop-shadow(0 1px 2px ${lineColor}30)` }}
        />

        {/* 当前值端点 */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          fill={lineColor}
          stroke={isDark ? "#0f172a" : "#ffffff"}
          strokeWidth={1.5}
        >
          <animate attributeName="r" values="3;4;3" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  )
}

// ============================================
// ArcReactor - CPU 负载环形反应堆（紧凑版）
// ============================================
function ArcReactor({ load: rawLoad, isMobile = false, isDark = true }: { load: number; isMobile?: boolean; isDark?: boolean }) {
  const load = safeNumber(rawLoad, 0)
  const clampedLoad = Math.max(0, Math.min(100, load))
  
  const isOverheating = clampedLoad > 80
  const isCool = clampedLoad < 30
  
  const primaryColor = isCool 
    ? (isDark ? '#06b6d4' : '#0891b2')
    : isOverheating 
      ? '#f43f5e'
      : clampedLoad < 50 
        ? (isDark ? '#22d3ee' : '#06b6d4')
        : clampedLoad < 65 
          ? (isDark ? '#fbbf24' : '#f59e0b')
          : '#fb7185'

  const glowColor = isCool 
    ? (isDark ? 'rgba(6, 182, 212, 0.6)' : 'rgba(8, 145, 178, 0.4)')
    : isOverheating 
      ? (isDark ? 'rgba(244, 63, 94, 0.8)' : 'rgba(244, 63, 94, 0.5)')
      : (isDark ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.3)')

  const size = isMobile ? 68 : 88
  const strokeWidth = isMobile ? 4 : 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedLoad / 100) * circumference
  const innerRadius1 = radius - (isMobile ? 6 : 8)
  const innerCircumference1 = 2 * Math.PI * innerRadius1
  const innerOffset1 = innerCircumference1 - (clampedLoad / 100) * innerCircumference1
  const innerRadius2 = radius - (isMobile ? 12 : 16)
  const center = size / 2

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={cn("absolute rounded-full", isOverheating ? "animate-pulse-fast" : "animate-pulse-slow")}
        style={{ width: size + 16, height: size + 16, background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
      <svg width={size} height={size} className={cn("relative z-10", isOverheating && "animate-pulse")}>
        <defs>
          <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={isDark ? "2" : "1.5"} result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity={isDark ? "0.6" : "0.7"} />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"} strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={radius} fill="none" stroke="url(#arcGradient)" strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} transform={`rotate(-90 ${center} ${center})`} filter="url(#arcGlow)"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
        <circle cx={center} cy={center} r={innerRadius1} fill="none" stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"} strokeWidth={2.5} />
        <circle cx={center} cy={center} r={innerRadius1} fill="none" stroke={primaryColor} strokeWidth={2.5} strokeLinecap="round"
          strokeDasharray={innerCircumference1} strokeDashoffset={innerOffset1} transform={`rotate(-90 ${center} ${center})`} opacity={0.7}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out 0.1s' }} />
        <circle cx={center} cy={center} r={innerRadius2} fill="none" stroke={primaryColor} strokeWidth={1.5} strokeDasharray="5 7"
          opacity={isDark ? 0.4 : 0.5} className="animate-spin-slow" style={{ transformOrigin: 'center' }} />
        <circle cx={center} cy={center} r={isMobile ? 8 : 11} fill={isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)"}
          stroke={primaryColor} strokeWidth={1.5} className="animate-pulse-subtle" />
        <polygon
          points={`${center},${center - (isMobile ? 3.5 : 5)} ${center - (isMobile ? 3 : 4)},${center + (isMobile ? 2.5 : 3.5)} ${center + (isMobile ? 3 : 4)},${center + (isMobile ? 2.5 : 3.5)}`}
          fill={primaryColor} opacity={0.9} className={isOverheating ? "animate-blink" : ""} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className={cn("text-center", isMobile ? "mt-7" : "mt-9")}>
          <span className={cn("font-bold font-mono transition-colors duration-300", isMobile ? "text-sm" : "text-lg",
            isCool && (isDark ? "text-cyan-400" : "text-cyan-700"),
            !isCool && !isOverheating && (isDark ? "text-amber-400" : "text-amber-700"),
            isOverheating && (isDark ? "text-rose-400" : "text-rose-700"))}
            style={{ textShadow: isDark ? 'none' : '0 0 8px rgba(0,0,0,0.1)' }}>
            <AnimatedValue value={clampedLoad} />
          </span>
          <p className={cn("uppercase tracking-widest font-semibold mt-0.5", isMobile ? "text-[7px]" : "text-[9px]", isDark ? "text-white/50" : "text-slate-600")}>CPU</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// LiquidOrb - 内存液态球（紧凑版）
// ============================================
function LiquidOrb({ 
  memoryPercent: rawMemoryPercent, swapPercent: rawSwapPercent = 0,
  memoryUsed, memoryTotal, isMobile = false, isDark = true
}: { 
  memoryPercent: number; swapPercent?: number; memoryUsed: string; memoryTotal: string; isMobile?: boolean; isDark?: boolean
}) {
  const memoryPercent = safeNumber(rawMemoryPercent, 0)
  const swapPercent = safeNumber(rawSwapPercent, 0)
  const hasSwapWarning = swapPercent > 0
  const size = isMobile ? 62 : 82
  const safeMemoryPercent = Math.max(0, Math.min(100, memoryPercent))
  const waterY = size - (safeMemoryPercent / 100) * size
  const center = size / 2
  const waterColor = isDark ? '#22d3ee' : '#0891b2'
  const waterColorDark = isDark ? '#0891b2' : '#0e7490'

  return (
    <div className="relative flex items-center justify-center">
      {hasSwapWarning && (
        <div className="absolute rounded-full animate-swap-warning"
          style={{ width: size + 16, height: size + 16,
            background: isDark ? 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)' }} />
      )}
      <svg width={size} height={size} className="relative z-10"
        style={{ filter: isDark ? 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
        <defs>
          <clipPath id="liquidOrbClip"><circle cx={center} cy={center} r={center - 3} /></clipPath>
          <linearGradient id="liquidWaterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={waterColor} stopOpacity={isDark ? "0.9" : "0.85"} />
            <stop offset="100%" stopColor={waterColorDark} stopOpacity={isDark ? "0.7" : "0.75"} />
          </linearGradient>
          <radialGradient id="liquidOrbHighlight" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <circle cx={center} cy={center} r={center - 3} fill={isDark ? "rgba(0, 30, 50, 0.8)" : "rgba(240, 249, 255, 0.9)"}
          stroke={hasSwapWarning ? '#fbbf24' : (isDark ? '#0891b2' : '#0e7490')} strokeWidth={hasSwapWarning ? 2 : 1.5} />
        <g clipPath="url(#liquidOrbClip)">
          <rect x={0} y={0} width={size} height={size} fill="url(#liquidWaterGradient)" opacity={0.5}
            style={{ transform: `translateY(${waterY + 3}px)`, transition: 'transform 0.8s ease-out' }} />
          <rect x={0} y={0} width={size} height={size} fill="url(#liquidWaterGradient)" opacity={0.7}
            style={{ transform: `translateY(${waterY}px)`, transition: 'transform 0.8s ease-out' }} />
          <ellipse cx={center} cy={0} rx={center + 6} ry={3} fill={waterColor} opacity={0.5}
            style={{ transform: `translateY(${waterY}px)`, transition: 'transform 0.8s ease-out' }} />
          {hasSwapWarning && <rect x={0} y={size - 14} width={size} height={18} fill="#fbbf24" className="animate-swap-flash" />}
          <circle cx={size * 0.2} cy={size} r={isMobile ? 1.5 : 2} fill="rgba(255,255,255,0.5)" className="animate-bubble-1" />
          <circle cx={size * 0.5} cy={size} r={isMobile ? 1 : 1.5} fill="rgba(255,255,255,0.5)" className="animate-bubble-2" />
          <circle cx={size * 0.8} cy={size} r={isMobile ? 1 : 1.5} fill="rgba(255,255,255,0.5)" className="animate-bubble-3" />
        </g>
        <circle cx={center} cy={center} r={center - 3} fill="url(#liquidOrbHighlight)" />
        <circle cx={center} cy={center} r={center - 3} fill="none" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)"} strokeWidth={1} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className={cn("font-bold font-mono transition-colors duration-300", isMobile ? "text-sm" : "text-lg",
          hasSwapWarning ? (isDark ? "text-amber-400" : "text-amber-700") : (isDark ? "text-cyan-400" : "text-cyan-800"))}
          style={{ textShadow: isDark ? 'none' : '0 0 8px rgba(255,255,255,0.6)' }}>
          <AnimatedValue value={safeMemoryPercent} />
        </span>
        <p className={cn("uppercase tracking-widest font-semibold mt-0.5", isMobile ? "text-[6px]" : "text-[9px]", isDark ? "text-white/50" : "text-slate-600")}
          style={{ textShadow: isDark ? 'none' : '0 0 4px rgba(255,255,255,0.8)' }}>MEM</p>
        <p className={cn("font-mono font-medium", isMobile ? "text-[6px]" : "text-[8px]", isDark ? "text-white/40" : "text-slate-500")}
          style={{ textShadow: isDark ? 'none' : '0 0 4px rgba(255,255,255,0.8)' }}>
          {memoryUsed}/{memoryTotal}
        </p>
        {hasSwapWarning && (
          <p className={cn("font-mono font-semibold mt-0.5 animate-pulse", isMobile ? "text-[6px]" : "text-[8px]", isDark ? "text-amber-400/80" : "text-amber-700")}>⚠ Swap</p>
        )}
      </div>
    </div>
  )
}

// ============================================
// 主组件：VitalSignsCard
// ============================================
const VS_COLLAPSE_KEY = 'nowen-card-collapse-vital'

export function VitalSignsCard({ className }: { className?: string }) {
  const { isDark } = useThemeContext()
  const { t } = useTranslation()
  const historyRef = useRef<HistoryPoint[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem(VS_COLLAPSE_KEY) === '1' } catch { return false }
  })
  
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(VS_COLLAPSE_KEY, next ? '1' : '0') } catch { /* */ }
      return next
    })
  }, [])
  
  const { data, error, isLoading } = useSWR<DynamicSystemInfo>(
    '/api/system/dynamic',
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: false }
  )

  // 累积历史数据
  const updateHistory = useCallback((info: DynamicSystemInfo) => {
    const point: HistoryPoint = {
      cpu: safeNumber(info.cpu?.load, 0),
      mem: safeNumber(info.memory?.usagePercent, 0),
      time: Date.now(),
    }
    const newHistory = [...historyRef.current, point].slice(-MAX_HISTORY)
    historyRef.current = newHistory
    setHistory(newHistory)
  }, [])

  useEffect(() => {
    if (data) updateHistory(data)
  }, [data, updateHistory])

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className={cn(
      "relative rounded-2xl backdrop-blur-xl p-3 sm:p-4 min-w-0",
      isCollapsed ? "h-auto" : "h-full",
      isDark 
        ? "bg-gradient-to-br from-slate-900/95 via-slate-800/80 to-slate-900/95 border border-cyan-500/20"
        : "bg-gradient-to-br from-white/95 via-slate-50/90 to-white/95 border border-cyan-200/50 shadow-xl shadow-cyan-500/5",
      className
    )}>
      {/* 背景网格 */}
      <div className={cn("absolute inset-0 rounded-2xl overflow-hidden", isDark ? "opacity-[0.02]" : "opacity-[0.04]")}
        style={{
          backgroundImage: isDark 
            ? `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`
            : `linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }} />

      {/* 标题栏 */}
      <div className="relative z-10 flex items-center gap-1.5 mb-2">
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2, repeat: Infinity }}>
          <Activity className={cn("w-3.5 h-3.5", isDark ? "text-cyan-400" : "text-cyan-600")} />
        </motion.div>
        <span className={cn("text-xs sm:text-sm font-medium tracking-wider", isDark ? "text-white/80" : "text-slate-700")}>
          {t('monitor.vital_signs')}
        </span>
        
        {data?.cpu?.temperature && data.cpu.temperature > 0 && (
          <div className={cn("ml-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono",
            data.cpu.temperature > 80 ? (isDark ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-600")
              : data.cpu.temperature > 60 ? (isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600")
                : (isDark ? "bg-cyan-500/10 text-cyan-400/70" : "bg-cyan-100 text-cyan-600"))}>
            <Thermometer className="w-2.5 h-2.5" />
            <span>{Math.round(data.cpu.temperature)}°C</span>
          </div>
        )}

        {/* Mini 摘要（收缩时显示） */}
        {isCollapsed && data && (
          <div className="flex items-center gap-3 ml-1">
            <span className={cn(
              "text-xs font-mono font-bold tabular-nums",
              (data.cpu?.load ?? 0) > 80 ? "text-red-500" : (data.cpu?.load ?? 0) > 50 ? "text-amber-500" : isDark ? "text-cyan-400" : "text-cyan-600"
            )}>CPU {(data.cpu?.load ?? 0).toFixed(0)}%</span>
            <span className={cn(
              "text-xs font-mono font-bold tabular-nums",
              (data.memory?.usagePercent ?? 0) > 80 ? "text-red-500" : (data.memory?.usagePercent ?? 0) > 50 ? "text-amber-500" : isDark ? "text-purple-400" : "text-purple-600"
            )}>MEM {(data.memory?.usagePercent ?? 0).toFixed(0)}%</span>
          </div>
        )}
        
        <div className="ml-auto flex items-center gap-1.5">
          <motion.div className={cn("w-1.5 h-1.5 rounded-full", isDark ? "bg-green-400" : "bg-green-500")}
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className={cn("text-[10px] font-mono", isDark ? "text-white/40" : "text-slate-400")}>LIVE</span>
          {/* 折叠切换 */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "p-0.5 rounded-md transition-colors",
              isDark ? "hover:bg-white/10 text-white/40 hover:text-white/70" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            )}
            title={isCollapsed ? '展开' : '收缩'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 主内容 - 可折叠 */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
      {/* 主内容 */}
      <div className="relative z-10">
        {isLoading && !data && (
          <div className="flex items-center justify-center py-12">
            <div className={cn("w-8 h-8 border-2 rounded-full animate-spin",
              isDark ? "border-cyan-400/30 border-t-cyan-400" : "border-cyan-300 border-t-cyan-600")} />
          </div>
        )}

        {error && (
          <div className={cn("flex items-center justify-center py-12 text-xs", isDark ? "text-red-400" : "text-red-600")}>
            数据获取失败
          </div>
        )}

        {data && (
          <div className="space-y-2">
            {/* 上部：指示器 */}
            <div className={cn("flex flex-row items-center justify-center", isMobile ? "gap-2" : "gap-2 sm:gap-4")}>
              <div className="flex-shrink-0 flex flex-col items-center">
                <ArcReactor load={data.cpu?.load ?? 0} isMobile={isMobile} isDark={isDark} />
              </div>
              <div className={cn("flex-shrink-0 w-px bg-gradient-to-b from-transparent to-transparent",
                isMobile ? "h-14" : "h-16 sm:h-20", isDark ? "via-cyan-500/30" : "via-cyan-400/40")} />
              <div className="flex-shrink-0 flex flex-col items-center">
                <LiquidOrb
                  memoryPercent={data.memory?.usagePercent ?? 0}
                  swapPercent={data.memory?.swapTotal > 0 ? (data.memory.swapUsed / data.memory.swapTotal) * 100 : 0}
                  memoryUsed={formatBytes(data.memory?.used ?? 0)}
                  memoryTotal={formatBytes(data.memory?.total ?? 0)}
                  isMobile={isMobile}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* 分隔线 */}
            <div className={cn("h-px mx-2", isDark ? "bg-cyan-500/10" : "bg-cyan-200/30")} />

            {/* 下部：趋势图 */}
            <div className={cn("grid gap-3", isMobile ? "grid-cols-1" : "grid-cols-2")}>
              <MiniTrendChart
                history={history}
                dataKey="cpu"
                color={isDark ? '#22d3ee' : '#0891b2'}
                gradientId="cpuTrendGrad"
                isDark={isDark}
                height={isMobile ? 44 : 56}
                label="CPU"
                currentValue={safeNumber(data.cpu?.load, 0)}
              />
              <MiniTrendChart
                history={history}
                dataKey="mem"
                color={isDark ? '#a78bfa' : '#7c3aed'}
                gradientId="memTrendGrad"
                isDark={isDark}
                height={isMobile ? 44 : 56}
                label="MEM"
                currentValue={safeNumber(data.memory?.usagePercent, 0)}
              />
            </div>
          </div>
        )}
      </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部装饰 */}
      <div className={cn("absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent animate-pulse",
        isDark ? "via-cyan-400/30" : "via-cyan-400/40")} />

      {/* CSS 动画 */}
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.5; } }
        @keyframes pulse-fast { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes pulse-subtle { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        @keyframes blink { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.4; } }
        @keyframes bubble-rise-1 { 0% { transform: translateY(82px); opacity: 0; } 50% { opacity: 0.6; } 100% { transform: translateY(0); opacity: 0; } }
        @keyframes bubble-rise-2 { 0% { transform: translateY(82px); opacity: 0; } 50% { opacity: 0.6; } 100% { transform: translateY(0); opacity: 0; } }
        @keyframes bubble-rise-3 { 0% { transform: translateY(82px); opacity: 0; } 50% { opacity: 0.6; } 100% { transform: translateY(0); opacity: 0; } }
        @keyframes swap-warning { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes swap-flash { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        .animate-pulse-fast { animation: pulse-fast 0.5s ease-in-out infinite; }
        .animate-pulse-subtle { animation: pulse-subtle 1.5s ease-in-out infinite; }
        .animate-blink { animation: blink 0.3s ease-in-out infinite; }
        .animate-bubble-1 { animation: bubble-rise-1 3s ease-out infinite; }
        .animate-bubble-2 { animation: bubble-rise-2 2.8s ease-out infinite 0.8s; }
        .animate-bubble-3 { animation: bubble-rise-3 3.2s ease-out infinite 1.5s; }
        .animate-swap-warning { animation: swap-warning 1.5s ease-in-out infinite; }
        .animate-swap-flash { animation: swap-flash 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

export default VitalSignsCard
