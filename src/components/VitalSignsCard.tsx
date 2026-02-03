/**
 * VitalSignsCard - 生命体征监控卡片
 * 视觉风格：钢铁侠 Arc Reactor + 液态球
 * 设计隐喻：反应堆核心 (Reactor Core)
 * 功能：实时显示 CPU 负载和内存使用
 */
import { useState, useEffect, useRef } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import useSWR from 'swr'
import { Activity, Thermometer } from 'lucide-react'
import { cn } from '../lib/utils'

// ============================================
// 类型定义 - 与 /api/system/dynamic 返回结构匹配
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
  if (!json.success) {
    throw new Error('API request failed')
  }
  return json.data
}

// 安全获取数值，防止 NaN/undefined
function safeNumber(value: number | undefined | null, defaultValue: number = 0): number {
  if (value === undefined || value === null || isNaN(value)) {
    return defaultValue
  }
  return value
}

// ============================================
// AnimatedValue - 数字滚动动画组件
// ============================================
function AnimatedValue({ 
  value, 
  suffix = '%',
  className 
}: { 
  value: number
  suffix?: string
  className?: string 
}) {
  const prevValue = useRef(value)
  const spring = useSpring(value, {
    mass: 0.8,
    stiffness: 75,
    damping: 15
  })
  
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
    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(Math.round(v))
    })
    return unsubscribe
  }, [display])

  return (
    <span className={cn('tabular-nums inline-flex items-center', className)}>
      <motion.span
        key={displayValue}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 0.3 }}
      >
        {displayValue}{suffix}
      </motion.span>
      {trend && (
        <motion.span
          className={cn(
            "ml-0.5 text-[0.5em]",
            trend === 'up' ? "text-rose-400/60" : "text-green-400/60"
          )}
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
// ArcReactor 组件 - CPU 负载环形反应堆
// 完全使用 CSS 动画，避免 framer-motion SVG 属性问题
// ============================================
function ArcReactor({ load: rawLoad, isMobile = false }: { load: number; isMobile?: boolean }) {
  // 安全处理 load 值
  const load = safeNumber(rawLoad, 0)
  const clampedLoad = Math.max(0, Math.min(100, load))
  
  // 颜色逻辑：<30% cyan, 30-80% 渐变, >80% rose + pulse
  const isOverheating = clampedLoad > 80
  const isCool = clampedLoad < 30
  
  const primaryColor = isCool 
    ? '#06b6d4' // cyan-500
    : isOverheating 
      ? '#f43f5e' // rose-500
      : clampedLoad < 50 
        ? '#22d3ee' // cyan-400
        : clampedLoad < 65 
          ? '#fbbf24' // amber-400
          : '#fb7185' // rose-400

  const glowColor = isCool 
    ? 'rgba(6, 182, 212, 0.6)'
    : isOverheating 
      ? 'rgba(244, 63, 94, 0.8)'
      : 'rgba(251, 191, 36, 0.5)'

  // 圆环参数 - 移动端更小尺寸
  const size = isMobile ? 80 : 110
  const strokeWidth = isMobile ? 5 : 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedLoad / 100) * circumference

  // 内部环参数
  const innerRadius1 = radius - (isMobile ? 7 : 10)
  const innerCircumference1 = 2 * Math.PI * innerRadius1
  const innerOffset1 = innerCircumference1 - (clampedLoad / 100) * innerCircumference1

  const innerRadius2 = radius - (isMobile ? 14 : 20)

  // 中心点
  const center = size / 2

  return (
    <div className="relative flex items-center justify-center">
      {/* 外发光效果 */}
      <div
        className={cn(
          "absolute rounded-full",
          isOverheating ? "animate-pulse-fast" : "animate-pulse-slow"
        )}
        style={{
          width: size + 24,
          height: size + 24,
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        }}
      />

      <svg
        width={size}
        height={size}
        className={cn(
          "relative z-10",
          isOverheating && "animate-pulse"
        )}
      >
        <defs>
          {/* 发光滤镜 */}
          <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* 渐变 */}
          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* 背景环 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />

        {/* 主负载环 - 使用 CSS transition 而非 framer-motion */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#arcGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
          filter="url(#arcGlow)"
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out'
          }}
        />

        {/* 内环1 - 背景 */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius1}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={3}
        />

        {/* 内环1 - 负载 */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius1}
          fill="none"
          stroke={primaryColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={innerCircumference1}
          strokeDashoffset={innerOffset1}
          transform={`rotate(-90 ${center} ${center})`}
          opacity={0.7}
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out 0.1s'
          }}
        />

        {/* 内环2 - 装饰性旋转环 */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius2}
          fill="none"
          stroke={primaryColor}
          strokeWidth={1.5}
          strokeDasharray="6 8"
          opacity={0.4}
          className="animate-spin-slow"
          style={{ transformOrigin: 'center' }}
        />

        {/* 中心圆 */}
        <circle
          cx={center}
          cy={center}
          r={isMobile ? 10 : 14}
          fill="rgba(0,0,0,0.5)"
          stroke={primaryColor}
          strokeWidth={1.5}
          className="animate-pulse-subtle"
        />

        {/* 中心三角形 */}
        <polygon
          points={`${center},${center - (isMobile ? 4 : 6)} ${center - (isMobile ? 3.5 : 5)},${center + (isMobile ? 3 : 4)} ${center + (isMobile ? 3.5 : 5)},${center + (isMobile ? 3 : 4)}`}
          fill={primaryColor}
          opacity={0.9}
          className={isOverheating ? "animate-blink" : ""}
        />
      </svg>

      {/* 负载百分比显示 */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className={cn("text-center", isMobile ? "mt-8" : "mt-11")}>
          <span
            className={cn(
              "font-bold font-mono transition-colors duration-300",
              isMobile ? "text-base" : "text-lg",
              isCool && "text-cyan-400",
              !isCool && !isOverheating && "text-amber-400",
              isOverheating && "text-rose-400"
            )}
          >
            <AnimatedValue value={clampedLoad} />
          </span>
          <p className={cn(
            "text-white/40 uppercase tracking-wider mt-0.5",
            isMobile ? "text-[7px]" : "text-[8px]"
          )}>CPU负载</p>
        </div>
      </div>

      {/* CSS 动画样式 */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.4; }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.5s ease-in-out infinite;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 1.5s ease-in-out infinite;
        }
        .animate-blink {
          animation: blink 0.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// ============================================
// LiquidOrb 组件 - 内存液态球
// 完全使用 CSS 动画，避免 framer-motion SVG 属性问题
// ============================================
function LiquidOrb({ 
  memoryPercent: rawMemoryPercent, 
  swapPercent: rawSwapPercent = 0,
  memoryUsed,
  memoryTotal,
  isMobile = false
}: { 
  memoryPercent: number
  swapPercent?: number
  memoryUsed: string
  memoryTotal: string
  isMobile?: boolean
}) {
  // 安全处理数值
  const memoryPercent = safeNumber(rawMemoryPercent, 0)
  const swapPercent = safeNumber(rawSwapPercent, 0)
  
  const hasSwapWarning = swapPercent > 0
  const size = isMobile ? 72 : 100 // 移动端更小尺寸
  const safeMemoryPercent = Math.max(0, Math.min(100, memoryPercent))
  // 水位高度：100% 内存 = 水满（y=0），0% 内存 = 水空（y=size）
  const waterY = size - (safeMemoryPercent / 100) * size
  const center = size / 2

  return (
    <div className="relative flex items-center justify-center">
      {/* Swap 警告光晕 */}
      {hasSwapWarning && (
        <div
          className="absolute rounded-full animate-swap-warning"
          style={{
            width: size + 20,
            height: size + 20,
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)',
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        className="relative z-10"
        style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.3))' }}
      >
        <defs>
          {/* 球体裁剪 */}
          <clipPath id="liquidOrbClip">
            <circle cx={center} cy={center} r={center - 3} />
          </clipPath>

          {/* 水波渐变 */}
          <linearGradient id="liquidWaterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.7" />
          </linearGradient>

          {/* 高亮渐变 */}
          <radialGradient id="liquidOrbHighlight" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* 球体背景 */}
        <circle
          cx={center}
          cy={center}
          r={center - 3}
          fill="rgba(0, 30, 50, 0.8)"
          stroke={hasSwapWarning ? '#fbbf24' : '#0891b2'}
          strokeWidth={hasSwapWarning ? 2 : 1.5}
        />

        {/* 水波动画组 */}
        <g clipPath="url(#liquidOrbClip)">
          {/* 后层水波 */}
          <rect
            x={0}
            y={0}
            width={size}
            height={size}
            fill="url(#liquidWaterGradient)"
            opacity={0.5}
            style={{
              transform: `translateY(${waterY + 4}px)`,
              transition: 'transform 0.8s ease-out'
            }}
          />
          
          {/* 前层水波 */}
          <rect
            x={0}
            y={0}
            width={size}
            height={size}
            fill="url(#liquidWaterGradient)"
            opacity={0.7}
            style={{
              transform: `translateY(${waterY}px)`,
              transition: 'transform 0.8s ease-out'
            }}
          />

          {/* 波浪装饰线 */}
          <ellipse
            cx={center}
            cy={0}
            rx={center + 8}
            ry={4}
            fill="#22d3ee"
            opacity={0.5}
            style={{
              transform: `translateY(${waterY}px)`,
              transition: 'transform 0.8s ease-out'
            }}
          />

          {/* Swap 警告层 */}
          {hasSwapWarning && (
            <rect
              x={0}
              y={size - 18}
              width={size}
              height={22}
              fill="#fbbf24"
              className="animate-swap-flash"
            />
          )}

          {/* 气泡效果 - 根据尺寸调整位置 */}
          <circle cx={size * 0.2} cy={size} r={isMobile ? 1.5 : 2} fill="rgba(255,255,255,0.5)" className="animate-bubble-1" />
          <circle cx={size * 0.5} cy={size} r={isMobile ? 1 : 1.5} fill="rgba(255,255,255,0.5)" className="animate-bubble-2" />
          <circle cx={size * 0.8} cy={size} r={isMobile ? 1 : 1.5} fill="rgba(255,255,255,0.5)" className="animate-bubble-3" />
        </g>

        {/* 高光 */}
        <circle
          cx={center}
          cy={center}
          r={center - 3}
          fill="url(#liquidOrbHighlight)"
        />

        {/* 边框高光 */}
        <circle
          cx={center}
          cy={center}
          r={center - 3}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />
      </svg>

      {/* 数值显示 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span
          className={cn(
            "font-bold font-mono transition-colors duration-300",
            isMobile ? "text-base" : "text-lg",
            hasSwapWarning ? "text-amber-400" : "text-cyan-400"
          )}
        >
          <AnimatedValue value={safeMemoryPercent} />
        </span>
        <p className={cn(
          "text-white/40 uppercase tracking-wider mt-0.5",
          isMobile ? "text-[6px]" : "text-[8px]"
        )}>内存使用</p>
        <p className={cn(
          "text-white/30 font-mono",
          isMobile ? "text-[6px]" : "text-[7px]"
        )}>
          {memoryUsed} / {memoryTotal}
        </p>
        {hasSwapWarning && (
          <p className={cn(
            "text-amber-400/80 font-mono mt-0.5 animate-pulse",
            isMobile ? "text-[6px]" : "text-[7px]"
          )}>
            ⚠ Swap
          </p>
        )}
      </div>

      {/* 气泡和警告动画样式 */}
      <style>{`
        @keyframes bubble-rise-1 {
          0% { transform: translateY(${size}px); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(0); opacity: 0; }
        }
        @keyframes bubble-rise-2 {
          0% { transform: translateY(${size}px); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(0); opacity: 0; }
        }
        @keyframes bubble-rise-3 {
          0% { transform: translateY(${size}px); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(0); opacity: 0; }
        }
        @keyframes swap-warning {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes swap-flash {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        .animate-bubble-1 {
          animation: bubble-rise-1 3s ease-out infinite;
        }
        .animate-bubble-2 {
          animation: bubble-rise-2 2.8s ease-out infinite 0.8s;
        }
        .animate-bubble-3 {
          animation: bubble-rise-3 3.2s ease-out infinite 1.5s;
        }
        .animate-swap-warning {
          animation: swap-warning 1.5s ease-in-out infinite;
        }
        .animate-swap-flash {
          animation: swap-flash 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// ============================================
// 主组件：VitalSignsCard
// ============================================
export function VitalSignsCard({ className }: { className?: string }) {
  const { data, error, isLoading } = useSWR<DynamicSystemInfo>(
    '/api/system/dynamic',
    fetcher,
    {
      refreshInterval: 3000,
      revalidateOnFocus: false,
    }
  )

  // 检测移动端 - 使用窗口宽度
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className={cn(
      "relative rounded-2xl",
      "bg-gradient-to-br from-slate-900/95 via-slate-800/80 to-slate-900/95",
      "border border-cyan-500/20",
      "backdrop-blur-xl",
      "p-3 sm:p-4 h-full min-w-0",
      className
    )}>
      {/* 背景网格 */}
      <div 
        className="absolute inset-0 opacity-[0.02] rounded-2xl overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* 标题栏 */}
      <div className="relative z-10 flex items-center gap-1.5 mb-2 sm:mb-3">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
        </motion.div>
        <span className="text-xs sm:text-sm font-medium text-white/80 tracking-wider">
          核心脉搏
        </span>
        
        {/* 温度显示 */}
        {data?.cpu?.temperature && data.cpu.temperature > 0 && (
          <div className={cn(
            "ml-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono",
            data.cpu.temperature > 80 
              ? "bg-rose-500/20 text-rose-400" 
              : data.cpu.temperature > 60 
                ? "bg-amber-500/20 text-amber-400"
                : "bg-cyan-500/10 text-cyan-400/70"
          )}>
            <Thermometer className="w-2.5 h-2.5" />
            <span>{Math.round(data.cpu.temperature)}°C</span>
          </div>
        )}
        
        {/* 在线状态 */}
        <div className="ml-auto flex items-center gap-1.5">
          <motion.div 
            className="w-1.5 h-1.5 rounded-full bg-green-400"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[10px] text-white/40 font-mono">LIVE</span>
        </div>
      </div>

      {/* 主内容 */}
      <div className="relative z-10">
        {/* 加载状态 */}
        {isLoading && !data && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="flex items-center justify-center py-12 text-red-400 text-xs">
            数据获取失败
          </div>
        )}

        {/* 监控仪表 */}
        {data && (
          <div className={cn(
            "flex flex-row items-center justify-center py-1",
            isMobile ? "gap-3" : "gap-2 sm:gap-4"
          )}>
            {/* CPU 反应堆 */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <ArcReactor load={data.cpu?.load ?? 0} isMobile={isMobile} />
            </div>

            {/* 分隔线 */}
            <div className={cn(
              "flex-shrink-0 w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent",
              isMobile ? "h-16" : "h-20 sm:h-24"
            )} />

            {/* 内存液态球 */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <LiquidOrb
                memoryPercent={data.memory?.usagePercent ?? 0}
                swapPercent={data.memory?.swapTotal > 0 ? (data.memory.swapUsed / data.memory.swapTotal) * 100 : 0}
                memoryUsed={formatBytes(data.memory?.used ?? 0)}
                memoryTotal={formatBytes(data.memory?.total ?? 0)}
                isMobile={isMobile}
              />
            </div>
          </div>
        )}
      </div>

      {/* 底部装饰 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-pulse"
      />
    </div>
  )
}

export default VitalSignsCard
