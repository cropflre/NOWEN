/**
 * NetworkTelemetryCard - 网络遥测卡片
 * 视觉风格：心电图监视器 (ECG Monitor)
 * 功能：实时显示网络流量走势图 + IP 地址终端显示
 */
import { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { Wifi, ArrowUp, ArrowDown, Terminal } from 'lucide-react'
import { cn } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'

// ============================================
// 类型定义
// ============================================

interface NetworkInfo {
  iface: string
  operstate: string
  ip4: string
  ip6: string
  rx_bytes: number
  tx_bytes: number
  rx_sec: number
  tx_sec: number
  rxFormatted: string
  txFormatted: string
  rxSpeedFormatted: string
  txSpeedFormatted: string
}

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
  network: NetworkInfo[]
  uptime: string
}

interface ApiResponse {
  success: boolean
  data: DynamicSystemInfo
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

// 安全获取数值
function safeNumber(value: number | undefined | null, defaultValue: number = 0): number {
  if (value === undefined || value === null || isNaN(value)) {
    return defaultValue
  }
  return value
}

// 格式化速率为更友好的显示
function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`
  return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`
}

// ============================================
// NetworkSparkline - 网络流量走势图 (心电图风格)
// ============================================
interface SparklineProps {
  data: number[]
  color: string
  label: string
  currentValue: string
  maxPoints?: number
  isDark?: boolean
}

function NetworkSparkline({ 
  data, 
  color, 
  label, 
  currentValue,
  maxPoints = 60,
  isDark = true
}: SparklineProps) {
  // 计算路径
  const pathD = useMemo(() => {
    if (data.length < 2) {
      return 'M 0,50 L 100,50'
    }
    
    // 找到最大值用于归一化
    const maxValue = Math.max(...data, 1)
    
    const points = data.map((value, index) => {
      const x = (index / (maxPoints - 1)) * 100
      // 归一化到 10-90 范围（留出上下边距）
      const normalizedValue = safeNumber(value, 0) / maxValue
      const y = 90 - (normalizedValue * 80)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    
    return `M ${points.join(' L ')}`
  }, [data, maxPoints])

  // 当前值的位置（用于发光点）
  const currentPoint = useMemo(() => {
    if (data.length < 1) return { x: 100, y: 50 }
    const maxValue = Math.max(...data, 1)
    const lastValue = safeNumber(data[data.length - 1], 0)
    const normalizedValue = lastValue / maxValue
    return {
      x: 100,
      y: 90 - (normalizedValue * 80)
    }
  }, [data])

  return (
    <div className="relative h-full">
      {/* 标签和当前值 */}
      <div className="absolute top-1 left-2 z-20 flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: color, boxShadow: isDark ? `0 0 6px ${color}` : `0 0 4px ${color}` }}
        />
        <span className={cn(
          "text-[10px] uppercase tracking-wider",
          isDark ? "text-white/60" : "text-slate-500"
        )}>{label}</span>
      </div>
      <div className="absolute top-1 right-2 z-20">
        <span 
          className={cn("text-xs font-mono font-semibold", !isDark && "font-bold")}
          style={{ color, textShadow: isDark ? `0 0 8px ${color}50` : 'none' }}
        >
          {currentValue}
        </span>
      </div>

      {/* 背景网格 */}
      <svg className={cn(
        "absolute inset-0 w-full h-full",
        isDark ? "opacity-20" : "opacity-10"
      )} preserveAspectRatio="none">
        <defs>
          <pattern id={`grid-${label}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${label})`} className={isDark ? "text-white/30" : "text-slate-400"} />
      </svg>

      {/* 走势线 */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <defs>
          {/* 渐变 */}
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="30%" stopColor={color} stopOpacity={isDark ? "0.6" : "0.7"} />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
          
          {/* 发光滤镜 */}
          <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={isDark ? "1.5" : "1"} result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* 填充渐变 */}
          <linearGradient id={`fill-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={isDark ? "0.3" : "0.25"} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 填充区域 */}
        <path
          d={`${pathD} L 100,100 L 0,100 Z`}
          fill={`url(#fill-${label})`}
        />
        
        {/* 主线条 */}
        <path
          d={pathD}
          fill="none"
          stroke={`url(#gradient-${label})`}
          strokeWidth={isDark ? "2" : "2.5"}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${label})`}
        />

        {/* 当前值发光点 */}
        <circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r="3"
          fill={color}
          filter={`url(#glow-${label})`}
          className="animate-pulse"
        />
      </svg>

      {/* 扫描线效果 */}
      <div
        className={cn(
          "absolute top-0 bottom-0 w-0.5 animate-scan",
          isDark ? "opacity-60" : "opacity-40"
        )}
        style={{ 
          background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
          boxShadow: `0 0 8px ${color}`
        }}
      />

      <style>{`
        @keyframes scan {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { left: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  )
}

// ============================================
// IPTerminal - 终端风格 IP 显示
// ============================================
function IPTerminal({ ip, iface, isDark = true }: { ip: string; iface: string; isDark?: boolean }) {
  const [showCursor, setShowCursor] = useState(true)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  const displayIP = ip || '0.0.0.0'

  return (
    <div className={cn(
      "rounded-lg px-3 py-2 border",
      isDark 
        ? "bg-black/60 border-emerald-500/20" 
        : "bg-slate-50/80 border-emerald-300/50 shadow-sm"
    )}>
      <div className="flex items-center gap-2 mb-1">
        <Terminal className={cn(
          "w-3 h-3",
          isDark ? "text-emerald-400" : "text-emerald-600"
        )} />
        <span className={cn(
          "text-[9px] uppercase tracking-wider",
          isDark ? "text-emerald-400/70" : "text-emerald-600/70"
        )}>
          {iface}
        </span>
        <div className="ml-auto flex gap-1">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            isDark ? "bg-red-500/80" : "bg-red-400"
          )} />
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            isDark ? "bg-yellow-500/80" : "bg-yellow-400"
          )} />
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            isDark ? "bg-green-500/80" : "bg-green-400"
          )} />
        </div>
      </div>
      <div className={cn(
        "font-mono text-xs sm:text-sm tracking-wider",
        isDark ? "text-emerald-400" : "text-emerald-700"
      )}>
        <span className={isDark ? "text-emerald-600" : "text-emerald-500"}>$</span>
        <span className="ml-1.5">{displayIP}</span>
        <span 
          className={cn(
            "inline-block w-2 h-3.5 ml-0.5 align-middle",
            isDark ? "bg-emerald-400" : "bg-emerald-600",
            showCursor ? "opacity-100" : "opacity-0"
          )}
          style={{ transition: 'opacity 0.1s' }}
        />
      </div>
    </div>
  )
}

// ============================================
// 主组件：NetworkTelemetryCard
// ============================================
export function NetworkTelemetryCard({ className }: { className?: string }) {
  const { isDark } = useTheme()
  const [rxHistory, setRxHistory] = useState<number[]>([])
  const [txHistory, setTxHistory] = useState<number[]>([])
  const maxPoints = 60

  const { data, error, isLoading } = useSWR<DynamicSystemInfo>(
    '/api/system/dynamic',
    fetcher,
    {
      refreshInterval: 2000, // 2秒刷新
      revalidateOnFocus: false,
    }
  )

  // 获取主网络接口
  const primaryNetwork = useMemo(() => {
    if (!data?.network || data.network.length === 0) {
      return null
    }
    // 优先选择状态为 up 的接口
    const activeInterface = data.network.find(n => n.operstate === 'up')
    return activeInterface || data.network[0]
  }, [data])

  // 更新历史数据
  useEffect(() => {
    if (!primaryNetwork) return

    const rx = safeNumber(primaryNetwork.rx_sec, 0)
    const tx = safeNumber(primaryNetwork.tx_sec, 0)

    setRxHistory(prev => {
      const newHistory = [...prev, rx]
      if (newHistory.length > maxPoints) {
        newHistory.shift()
      }
      return newHistory
    })

    setTxHistory(prev => {
      const newHistory = [...prev, tx]
      if (newHistory.length > maxPoints) {
        newHistory.shift()
      }
      return newHistory
    })
  }, [primaryNetwork])

  // 计算当前速率
  const currentRx = primaryNetwork ? formatSpeed(safeNumber(primaryNetwork.rx_sec, 0)) : '0 B/s'
  const currentTx = primaryNetwork ? formatSpeed(safeNumber(primaryNetwork.tx_sec, 0)) : '0 B/s'
  const currentIP = primaryNetwork?.ip4 || ''
  const currentIface = primaryNetwork?.iface || 'eth0'

  // 日间模式颜色调整
  const rxColor = isDark ? '#06b6d4' : '#0891b2'
  const txColor = isDark ? '#a855f7' : '#7c3aed'

  return (
    <div className={cn(
      "relative rounded-2xl",
      "backdrop-blur-xl",
      "p-3 sm:p-4 h-full min-w-0",
      // 日间模式：星际指挥中心明亮风格
      isDark 
        ? "bg-gradient-to-br from-slate-900/95 via-slate-800/80 to-slate-900/95 border border-purple-500/20"
        : "bg-gradient-to-br from-white/95 via-slate-50/90 to-white/95 border border-purple-200/50 shadow-xl shadow-purple-500/5",
      className
    )}>
      {/* 背景网格 */}
      <div 
        className={cn(
          "absolute inset-0 rounded-2xl overflow-hidden",
          isDark ? "opacity-[0.02]" : "opacity-[0.04]"
        )}
        style={{
          backgroundImage: isDark 
            ? `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`
            : `linear-gradient(rgba(139, 92, 246, 0.2) 1px, transparent 1px),
               linear-gradient(90deg, rgba(139, 92, 246, 0.2) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className={cn(
          "absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial",
          isDark 
            ? "from-purple-500/10 via-transparent to-transparent"
            : "from-purple-400/15 via-transparent to-transparent"
        )} />
        <div className={cn(
          "absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial",
          isDark 
            ? "from-cyan-500/10 via-transparent to-transparent"
            : "from-cyan-400/10 via-transparent to-transparent"
        )} />
      </div>

      {/* 标题栏 */}
      <div className="relative z-10 flex items-center gap-1.5 mb-3">
        <div className="relative">
          <Wifi className={cn(
            "w-3.5 h-3.5",
            isDark ? "text-purple-400" : "text-purple-600"
          )} />
          <div className={cn(
            "absolute inset-0 animate-ping",
            isDark ? "opacity-30" : "opacity-20"
          )}>
            <Wifi className={cn(
              "w-3.5 h-3.5",
              isDark ? "text-purple-400" : "text-purple-600"
            )} />
          </div>
        </div>
        <span className={cn(
          "text-xs sm:text-sm font-medium tracking-wider",
          isDark ? "text-white/80" : "text-slate-700"
        )}>
          网络遥测
        </span>
        
        {/* 在线状态 */}
        <div className="ml-auto flex items-center gap-1.5">
          <div 
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              primaryNetwork?.operstate === 'up' 
                ? (isDark ? "bg-green-400 animate-pulse" : "bg-green-500 animate-pulse")
                : (isDark ? "bg-red-400" : "bg-red-500")
            )} 
          />
          <span className={cn(
            "text-[10px] font-mono uppercase",
            isDark ? "text-white/40" : "text-slate-400"
          )}>
            {primaryNetwork?.operstate === 'up' ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* 主内容 */}
      <div className="relative z-10">
        {/* 加载状态 */}
        {isLoading && !data && (
          <div className="flex items-center justify-center py-12">
            <div className={cn(
              "w-8 h-8 border-2 rounded-full animate-spin",
              isDark 
                ? "border-purple-400/30 border-t-purple-400" 
                : "border-purple-300 border-t-purple-600"
            )} />
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className={cn(
            "flex items-center justify-center py-12 text-xs",
            isDark ? "text-red-400" : "text-red-600"
          )}>
            数据获取失败
          </div>
        )}

        {/* 监控内容 */}
        {data && (
          <div className="space-y-3">
            {/* 走势图区域 */}
            <div className="space-y-2">
              {/* 下行流量 - 青色 */}
              <div className={cn(
                "h-14 rounded-lg overflow-hidden border",
                isDark 
                  ? "bg-black/30 border-cyan-500/10" 
                  : "bg-slate-50/80 border-cyan-300/30 shadow-inner"
              )}>
                <div className="flex items-center gap-1 px-2 pt-1">
                  <ArrowDown className={cn(
                    "w-3 h-3",
                    isDark ? "text-cyan-400" : "text-cyan-600"
                  )} />
                </div>
                <NetworkSparkline
                  data={rxHistory}
                  color={rxColor}
                  label="Download"
                  currentValue={currentRx}
                  maxPoints={maxPoints}
                  isDark={isDark}
                />
              </div>

              {/* 上行流量 - 紫色 */}
              <div className={cn(
                "h-14 rounded-lg overflow-hidden border",
                isDark 
                  ? "bg-black/30 border-purple-500/10" 
                  : "bg-slate-50/80 border-purple-300/30 shadow-inner"
              )}>
                <div className="flex items-center gap-1 px-2 pt-1">
                  <ArrowUp className={cn(
                    "w-3 h-3",
                    isDark ? "text-purple-400" : "text-purple-600"
                  )} />
                </div>
                <NetworkSparkline
                  data={txHistory}
                  color={txColor}
                  label="Upload"
                  currentValue={currentTx}
                  maxPoints={maxPoints}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* IP 终端显示 */}
            <IPTerminal ip={currentIP} iface={currentIface} isDark={isDark} />

            {/* 统计数据 */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className={cn(
                "flex items-center justify-between px-2 py-1.5 rounded",
                isDark ? "bg-black/20" : "bg-slate-100/80"
              )}>
                <span className={cn(
                  "flex items-center gap-1",
                  isDark ? "text-white/40" : "text-slate-500"
                )}>
                  <ArrowDown className={cn(
                    "w-2.5 h-2.5",
                    isDark ? "text-cyan-400" : "text-cyan-600"
                  )} />
                  总下载
                </span>
                <span className={cn(
                  "font-mono",
                  isDark ? "text-cyan-400" : "text-cyan-700 font-medium"
                )}>
                  {primaryNetwork?.rxFormatted || '0 B'}
                </span>
              </div>
              <div className={cn(
                "flex items-center justify-between px-2 py-1.5 rounded",
                isDark ? "bg-black/20" : "bg-slate-100/80"
              )}>
                <span className={cn(
                  "flex items-center gap-1",
                  isDark ? "text-white/40" : "text-slate-500"
                )}>
                  <ArrowUp className={cn(
                    "w-2.5 h-2.5",
                    isDark ? "text-purple-400" : "text-purple-600"
                  )} />
                  总上传
                </span>
                <span className={cn(
                  "font-mono",
                  isDark ? "text-purple-400" : "text-purple-700 font-medium"
                )}>
                  {primaryNetwork?.txFormatted || '0 B'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部装饰线 */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent animate-pulse",
          isDark ? "via-purple-400/30" : "via-purple-400/40"
        )}
      />
    </div>
  )
}

export default NetworkTelemetryCard
