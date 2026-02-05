import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import useSWR from 'swr'
import { Activity, HardDrive, Cpu, Database, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'

// 类型定义
interface DiskInfo {
  mount: string
  usedPercent: number
  total: string
  used: string
  free: string
}

interface PulseData {
  cpu: {
    usage: number
    temperature: number | null
  }
  memory: {
    usedPercent: number
    total: string
    used: string
    free: string
  }
  network: {
    rx_sec: number
    tx_sec: number
    rx_formatted: string
    tx_formatted: string
  }
  disk: {
    usedPercent: number
    total: string
    used: string
    free: string
  }
  disks: DiskInfo[]
  containers: {
    running: number
    total: number
  } | null
  uptime: string
  timestamp: number
}

interface ApiResponse {
  success: boolean
  data: PulseData
  cached?: boolean
}

// 安全获取数值
function safeNumber(value: number | undefined | null, defaultValue: number = 0): number {
  if (value === undefined || value === null || isNaN(value)) {
    return defaultValue
  }
  return value
}

// API Fetcher - 使用 pulse 接口
const fetcher = async (url: string): Promise<PulseData> => {
  const res = await fetch(url)
  const json: ApiResponse = await res.json()
  if (!json.success) {
    throw new Error('API request failed')
  }
  return json.data
}

// ============================================
// CountUp 数字滚动动画组件
// ============================================
function CountUp({ 
  value, 
  duration = 0.8,
  decimals = 0,
  suffix = ''
}: { 
  value: number
  duration?: number
  decimals?: number
  suffix?: string
}) {
  const safeValue = safeNumber(value, 0)
  const spring = useSpring(0, { 
    stiffness: 100, 
    damping: 30,
    duration: duration * 1000
  })
  
  const display = useTransform(spring, (current) => 
    `${current.toFixed(decimals)}${suffix}`
  )
  
  useEffect(() => {
    spring.set(safeValue)
  }, [spring, safeValue])
  
  return (
    <motion.span className="tabular-nums font-mono">
      {display}
    </motion.span>
  )
}

// ============================================
// CPU 心电图 (ECG Wave) 组件
// 使用纯 SVG + CSS 动画，避免 framer-motion SVG 属性问题
// ============================================
function ECGWave({ cpuLoad: rawCpuLoad, isDark = true }: { cpuLoad: number; isDark?: boolean }) {
  const cpuLoad = safeNumber(rawCpuLoad, 0)
  const [pathHistory, setPathHistory] = useState<number[]>([])
  const maxPoints = 60
  
  // 根据 CPU 负载决定颜色和振幅
  const { color, amplitude, speed } = useMemo(() => {
    if (cpuLoad >= 80) {
      return { 
        color: '#ef4444', // 红色 - 心跳过速
        amplitude: 35,
        speed: 0.15
      }
    } else if (cpuLoad >= 50) {
      return { 
        color: isDark ? '#f59e0b' : '#ea580c', // 橙色 - 中等负载
        amplitude: 25,
        speed: 0.25
      }
    } else {
      return { 
        color: isDark ? '#06b6d4' : '#0891b2', // 青色 - 平稳
        amplitude: 15,
        speed: 0.4
      }
    }
  }, [cpuLoad, isDark])

  // 生成心电图数据点
  useEffect(() => {
    const interval = setInterval(() => {
      setPathHistory(prev => {
        const newHistory = [...prev]
        // 生成新的心电图点（模拟 PQRST 波形）
        const time = Date.now() / 1000
        const baseFreq = 1 / speed
        const phase = (time * baseFreq) % 1
        
        let value = 50 // 基线
        
        // P 波
        if (phase > 0.0 && phase < 0.1) {
          value += amplitude * 0.3 * Math.sin((phase / 0.1) * Math.PI)
        }
        // QRS 复合波
        else if (phase > 0.15 && phase < 0.25) {
          const qrsPhase = (phase - 0.15) / 0.1
          if (qrsPhase < 0.2) {
            value -= amplitude * 0.2 // Q 波
          } else if (qrsPhase < 0.5) {
            value += amplitude * ((qrsPhase - 0.2) / 0.3) // R 波上升
          } else if (qrsPhase < 0.8) {
            value += amplitude * (1 - (qrsPhase - 0.5) / 0.3) // R 波下降
          } else {
            value -= amplitude * 0.3 // S 波
          }
        }
        // T 波
        else if (phase > 0.35 && phase < 0.5) {
          value += amplitude * 0.4 * Math.sin(((phase - 0.35) / 0.15) * Math.PI)
        }
        
        // 添加一点随机噪声
        value += (Math.random() - 0.5) * 3
        
        newHistory.push(Math.max(10, Math.min(90, value)))
        if (newHistory.length > maxPoints) {
          newHistory.shift()
        }
        return newHistory
      })
    }, 50)
    
    return () => clearInterval(interval)
  }, [amplitude, speed])

  // 生成 SVG 路径 - 确保始终有有效的路径
  const pathD = useMemo(() => {
    if (pathHistory.length < 2) {
      // 返回一个有效的默认路径（水平线）
      return 'M 0,50 L 100,50'
    }
    
    const points = pathHistory.map((value, index) => {
      const x = (index / (maxPoints - 1)) * 100
      const y = safeNumber(value, 50)
      return `${x},${y}`
    })
    
    return `M ${points.join(' L ')}`
  }, [pathHistory])

  return (
    <div className="relative w-full h-full">
      {/* 背景网格 */}
      <svg className={cn(
        "absolute inset-0 w-full h-full",
        isDark ? "opacity-20" : "opacity-10"
      )} preserveAspectRatio="none">
        <defs>
          <pattern id="ecg-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ecg-grid)" />
      </svg>
      
      {/* 心电图波形 - 使用普通 path 元素 + CSS transition */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="30%" stopColor={color} stopOpacity={isDark ? "0.8" : "0.9"} />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
          <filter id="ecg-glow">
            <feGaussianBlur stdDeviation={isDark ? "2" : "1"} result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* 使用普通 path 而非 motion.path */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#ecg-gradient)"
          strokeWidth={isDark ? "2" : "2.5"}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#ecg-glow)"
        />
      </svg>

      {/* 扫描线效果 */}
      <div
        className="absolute top-0 bottom-0 w-px animate-scan-line"
        style={{ 
          background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
          boxShadow: isDark ? `0 0 10px ${color}` : `0 0 6px ${color}`
        }}
      />
      
      <style>{`
        @keyframes scan-line {
          0% { left: 0%; }
          100% { left: 100%; }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  )
}

// ============================================
// 液态球 (Liquid Orb) 内存可视化组件
// 使用纯 CSS 动画，避免 framer-motion SVG 属性问题
// ============================================
function LiquidOrb({ memUsage: rawMemUsage, isDark = true }: { memUsage: number; isDark?: boolean }) {
  const memUsage = safeNumber(rawMemUsage, 0)
  const clampedMemUsage = Math.max(0, Math.min(100, memUsage))
  const waterLevel = 100 - clampedMemUsage // 转换为从底部开始的高度
  
  // 根据内存使用量决定颜色
  const color = useMemo(() => {
    if (clampedMemUsage >= 80) return '#ef4444'
    if (clampedMemUsage >= 60) return isDark ? '#f59e0b' : '#ea580c'
    return isDark ? '#06b6d4' : '#0891b2'
  }, [clampedMemUsage, isDark])

  return (
    <div className="relative w-20 h-20 mx-auto">
      {/* 外圈发光 */}
      <div
        className="absolute inset-0 rounded-full animate-glow-pulse"
        style={{
          boxShadow: isDark ? `0 0 20px ${color}40` : `0 0 15px ${color}30`
        }}
      />
      
      {/* 玻璃球体 */}
      <div className={cn(
        "absolute inset-0 rounded-full overflow-hidden border backdrop-blur-sm",
        isDark 
          ? "border-white/20 bg-black/30" 
          : "border-slate-300/50 bg-white/40 shadow-lg"
      )}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <defs>
            {/* 液体渐变 */}
            <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={isDark ? "0.9" : "0.85"} />
              <stop offset="100%" stopColor={color} stopOpacity={isDark ? "0.6" : "0.7"} />
            </linearGradient>
            
            {/* 高光效果 */}
            <radialGradient id="orb-highlight" cx="30%" cy="30%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity={isDark ? "0.4" : "0.6"} />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            
            {/* 圆形裁剪 */}
            <clipPath id="orb-clip">
              <circle cx="50" cy="50" r="48" />
            </clipPath>
          </defs>
          
          {/* 液体 - 使用 rect + CSS transform 代替 motion.path */}
          <g clipPath="url(#orb-clip)">
            {/* 后层水波 */}
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              fill={`${color}40`}
              style={{
                transform: `translateY(${waterLevel + 3}%)`,
                transition: 'transform 0.5s ease-out'
              }}
            />
            
            {/* 前层水波 */}
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              fill="url(#liquid-gradient)"
              style={{
                transform: `translateY(${waterLevel}%)`,
                transition: 'transform 0.5s ease-out'
              }}
            />
            
            {/* 波浪线 - 静态椭圆 */}
            <ellipse
              cx="50"
              cy="0"
              rx="55"
              ry="4"
              fill={color}
              opacity="0.5"
              style={{
                transform: `translateY(${waterLevel}%)`,
                transition: 'transform 0.5s ease-out'
              }}
            />
            
            {/* 气泡效果 - CSS 动画 */}
            {clampedMemUsage > 30 && (
              <>
                <circle cx="30" cy="80" r="3" fill="white" opacity="0.3" className="animate-bubble-rise-1" />
                <circle cx="60" cy="85" r="2" fill="white" opacity="0.3" className="animate-bubble-rise-2" />
              </>
            )}
          </g>
          
          {/* 高光 */}
          <circle cx="50" cy="50" r="48" fill="url(#orb-highlight)" />
        </svg>
      </div>
      
      {/* 百分比显示 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          "text-xs font-mono drop-shadow-lg",
          isDark ? "text-white/80" : "text-slate-700 font-semibold"
        )}>
          <CountUp value={clampedMemUsage} decimals={0} suffix="%" />
        </span>
      </div>
      
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes bubble-rise-1 {
          0% { transform: translateY(0); opacity: 0.3; }
          100% { transform: translateY(-60px); opacity: 0; }
        }
        @keyframes bubble-rise-2 {
          0% { transform: translateY(0); opacity: 0.3; }
          100% { transform: translateY(-70px); opacity: 0; }
        }
        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        .animate-bubble-rise-1 {
          animation: bubble-rise-1 2s ease-out infinite;
        }
        .animate-bubble-rise-2 {
          animation: bubble-rise-2 1.5s ease-out infinite 0.5s;
        }
      `}</style>
    </div>
  )
}

// ============================================
// 硬盘圆环 (Disk Ring) 组件
// 使用 CSS transition 代替 motion.circle 动画
// ============================================
function DiskRing({ 
  diskUsage: rawDiskUsage, 
  diskFree, 
  diskLabel,
  isDark = true 
}: { 
  diskUsage: number
  diskFree: string
  diskLabel?: string
  isDark?: boolean 
}) {
  const [isHovered, setIsHovered] = useState(false)
  const diskUsage = safeNumber(rawDiskUsage, 0)
  const clampedDiskUsage = Math.max(0, Math.min(100, diskUsage))
  
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - clampedDiskUsage / 100)
  
  // 根据使用量决定颜色
  const color = useMemo(() => {
    if (clampedDiskUsage >= 90) return '#ef4444'
    if (clampedDiskUsage >= 70) return isDark ? '#f59e0b' : '#ea580c'
    return isDark ? '#667eea' : '#3b82f6'
  }, [clampedDiskUsage, isDark])

  // 简化挂载点显示名称
  const displayLabel = useMemo(() => {
    if (!diskLabel) return null
    // 处理 Windows 盘符 (如 C:\, D:\)
    if (diskLabel.match(/^[A-Za-z]:[\\\/]?$/)) {
      return diskLabel.replace(/[:\\\/]+$/, '')
    }
    // 处理 Linux 挂载点
    if (diskLabel === '/') return '/'
    // 取最后一个路径片段
    const parts = diskLabel.split('/').filter(Boolean)
    return parts.length > 0 ? parts[parts.length - 1] : diskLabel
  }, [diskLabel])

  return (
    <motion.div 
      className="relative w-20 h-20 mx-auto cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
    >
      {/* 发光效果 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              boxShadow: isDark 
                ? `0 0 30px ${color}80, 0 0 60px ${color}40`
                : `0 0 20px ${color}50, 0 0 40px ${color}30`
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
      
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <defs>
          <linearGradient id={`disk-gradient-${diskLabel || 'default'}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}80`} />
          </linearGradient>
        </defs>
        
        {/* 背景圆环 */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className={isDark ? "text-white/10" : "text-slate-300/50"}
        />
        
        {/* 进度圆环 - 使用 CSS transition 代替 motion.circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={`url(#disk-gradient-${diskLabel || 'default'})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
            filter: isDark ? 'none' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
          }}
        />
      </svg>
      
      {/* 中心内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isHovered ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <div className={cn(
                "text-[10px]",
                isDark ? "text-white/60" : "text-slate-500"
              )}>剩余</div>
              <div className="text-xs font-mono font-bold" style={{ color }}>
                {diskFree}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="percent"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              {displayLabel ? (
                <>
                  <span className={cn(
                    "text-xs font-mono font-bold",
                    isDark ? "text-white/80" : "text-slate-700"
                  )} style={{ color }}>
                    {clampedDiskUsage.toFixed(0)}%
                  </span>
                </>
              ) : (
                <HardDrive className={cn(
                  "w-5 h-5",
                  isDark ? "text-white/60" : "text-slate-500"
                )} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 磁盘标签 */}
      {displayLabel && (
        <div className={cn(
          "absolute -bottom-5 left-0 right-0 text-center text-[10px] font-mono truncate px-1",
          isDark ? "text-white/50" : "text-slate-500"
        )}>
          {displayLabel}
        </div>
      )}
    </motion.div>
  )
}

// ============================================
// 小型硬盘圆环（用于多硬盘紧凑显示）
// ============================================
function MiniDiskRing({ 
  diskUsage, 
  diskFree, 
  diskLabel,
  isDark = true 
}: { 
  diskUsage: number
  diskFree: string
  diskLabel: string
  isDark?: boolean 
}) {
  const [isHovered, setIsHovered] = useState(false)
  const clampedDiskUsage = Math.max(0, Math.min(100, safeNumber(diskUsage, 0)))
  
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - clampedDiskUsage / 100)
  
  // 根据使用量决定颜色
  const color = useMemo(() => {
    if (clampedDiskUsage >= 90) return '#ef4444'
    if (clampedDiskUsage >= 70) return isDark ? '#f59e0b' : '#ea580c'
    return isDark ? '#667eea' : '#3b82f6'
  }, [clampedDiskUsage, isDark])

  // 简化挂载点显示名称
  const displayLabel = useMemo(() => {
    if (!diskLabel) return '?'
    // 处理 Windows 盘符
    if (diskLabel.match(/^[A-Za-z]:[\\\/]?$/)) {
      return diskLabel.replace(/[:\\\/]+$/, '')
    }
    // 根目录
    if (diskLabel === '/' || diskLabel === '/host' || diskLabel === '/host/') return '/'
    // 提取卷名（如 volume1 -> V1）
    const volMatch = diskLabel.match(/volume(\d+)/i)
    if (volMatch) return `V${volMatch[1]}`
    // 取最后一个路径片段的首字母
    const parts = diskLabel.split('/').filter(Boolean)
    const lastPart = parts[parts.length - 1] || ''
    return lastPart.substring(0, 2).toUpperCase() || '?'
  }, [diskLabel])

  return (
    <div 
      className="relative flex flex-col items-center cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 圆环 */}
      <div className="relative w-12 h-12">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className={isDark ? "text-white/10" : "text-slate-200"}
          />
          <circle
            cx="25"
            cy="25"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        {/* 中心百分比 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "text-[10px] font-mono font-bold",
            isDark ? "text-white/80" : "text-slate-700"
          )} style={{ color }}>
            {clampedDiskUsage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* 标签 */}
      <span className={cn(
        "text-[10px] font-mono mt-0.5 transition-colors",
        isDark ? "text-white/50 group-hover:text-white/80" : "text-slate-400 group-hover:text-slate-600"
      )}>
        {displayLabel}
      </span>
      
      {/* Hover 提示 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={cn(
              "absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] whitespace-nowrap z-20",
              isDark ? "bg-slate-800 text-white" : "bg-white text-slate-700 shadow-lg border"
            )}
          >
            <div className="font-mono">{diskLabel}</div>
            <div className="text-center">剩余: {diskFree}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// 多硬盘轮播组件
// ============================================
function MultiDiskDisplay({ disks, isDark = true }: { disks: DiskInfo[]; isDark?: boolean }) {
  const [currentPage, setCurrentPage] = useState(0)
  
  // 根据硬盘数量决定显示模式
  const displayMode = useMemo(() => {
    if (disks.length <= 1) return 'single'      // 1个：大圆环
    if (disks.length <= 2) return 'dual'        // 2个：两个中等圆环
    if (disks.length <= 4) return 'compact'     // 3-4个：紧凑小圆环
    return 'paged'                              // 5个以上：分页显示
  }, [disks.length])
  
  const disksPerPage = displayMode === 'paged' ? 4 : disks.length
  const totalPages = Math.ceil(disks.length / disksPerPage)
  
  // 自动轮播（如果有多页）
  useEffect(() => {
    if (totalPages <= 1) return
    const timer = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages)
    }, 5000)
    return () => clearInterval(timer)
  }, [totalPages])
  
  // 当前页的磁盘
  const currentDisks = displayMode === 'paged' 
    ? disks.slice(currentPage * disksPerPage, (currentPage + 1) * disksPerPage)
    : disks
  
  const goToPrev = () => setCurrentPage(prev => (prev - 1 + totalPages) % totalPages)
  const goToNext = () => setCurrentPage(prev => (prev + 1) % totalPages)
  
  if (disks.length === 0) {
    return (
      <div className="space-y-2">
        <div className={cn(
          "flex items-center justify-center text-xs gap-1",
          isDark ? "text-white/60" : "text-slate-500"
        )}>
          <HardDrive className="w-3 h-3" />
          硬盘
        </div>
        <div className={cn(
          "text-center text-xs py-4",
          isDark ? "text-white/40" : "text-slate-400"
        )}>
          未检测到磁盘
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-2 relative">
      {/* 标题 */}
      <div className={cn(
        "flex items-center justify-center text-xs gap-1",
        isDark ? "text-white/60" : "text-slate-500"
      )}>
        <HardDrive className="w-3 h-3" />
        硬盘
        {disks.length > 1 && (
          <span className={cn(
            "ml-1 px-1.5 py-0.5 rounded text-[10px]",
            isDark ? "bg-white/10" : "bg-slate-100"
          )}>
            {disks.length}
          </span>
        )}
      </div>
      
      {/* 磁盘显示区 */}
      <div className="relative">
        {/* 导航按钮 - 只在分页模式时显示 */}
        {displayMode === 'paged' && totalPages > 1 && (
          <>
            <button
              onClick={goToPrev}
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded-full transition-colors",
                isDark 
                  ? "text-white/40 hover:text-white/80 hover:bg-white/10" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded-full transition-colors",
                isDark 
                  ? "text-white/40 hover:text-white/80 hover:bg-white/10" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
        
        {/* 磁盘圆环 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={displayMode === 'paged' ? currentPage : 'static'}
            initial={{ opacity: 0, x: displayMode === 'paged' ? 20 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: displayMode === 'paged' ? -20 : 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex justify-center",
              displayMode === 'paged' && totalPages > 1 && "px-5"
            )}
          >
            {displayMode === 'single' && (
              // 单个大圆环
              <DiskRing
                diskUsage={currentDisks[0].usedPercent}
                diskFree={currentDisks[0].free}
                diskLabel={currentDisks[0].mount}
                isDark={isDark}
              />
            )}
            
            {displayMode === 'dual' && (
              // 两个中等圆环
              <div className="grid grid-cols-2 gap-2 pb-4">
                {currentDisks.map((disk, idx) => (
                  <DiskRing
                    key={`${disk.mount}-${idx}`}
                    diskUsage={disk.usedPercent}
                    diskFree={disk.free}
                    diskLabel={disk.mount}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
            
            {(displayMode === 'compact' || displayMode === 'paged') && (
              // 紧凑小圆环网格
              <div className={cn(
                "grid gap-2 pb-2",
                currentDisks.length <= 2 ? "grid-cols-2" : 
                currentDisks.length === 3 ? "grid-cols-3" : "grid-cols-4"
              )}>
                {currentDisks.map((disk, idx) => (
                  <MiniDiskRing
                    key={`${disk.mount}-${idx}`}
                    diskUsage={disk.usedPercent}
                    diskFree={disk.free}
                    diskLabel={disk.mount}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* 页面指示器 - 只在分页模式时显示 */}
        {displayMode === 'paged' && totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-1">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  idx === currentPage
                    ? isDark 
                      ? "bg-cyan-400 w-3" 
                      : "bg-blue-500 w-3"
                    : isDark 
                      ? "bg-white/20 hover:bg-white/40" 
                      : "bg-slate-300 hover:bg-slate-400"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// 主组件：SystemMonitorCard
// ============================================
export function SystemMonitorCard({ className }: { className?: string }) {
  const { isDark } = useTheme()
  const { t } = useTranslation()
  
  const { data, error, isLoading } = useSWR<PulseData>(
    '/api/system/pulse',
    fetcher,
    {
      refreshInterval: 3000, // 每 3 秒轮询
      revalidateOnFocus: false,
      dedupingInterval: 2000
    }
  )

  // 默认值
  const stats = useMemo(() => ({
    cpuLoad: data?.cpu?.usage ?? 0,
    memUsage: data?.memory?.usedPercent ?? 0,
    disks: data?.disks ?? [],
    uptime: data?.uptime ?? '0天0小时',
  }), [data])

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl",
      "backdrop-blur-xl",
      "p-4 h-full min-h-[280px]",
      // 日间模式：星际指挥中心明亮风格
      isDark 
        ? "bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/80 border border-white/10"
        : "bg-gradient-to-br from-white/90 via-slate-50/80 to-white/90 border border-slate-200/60 shadow-xl shadow-blue-500/5",
      className
    )}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={cn(
          "absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial",
          isDark 
            ? "from-cyan-500/10 via-transparent to-transparent"
            : "from-blue-400/15 via-transparent to-transparent"
        )} />
        <div className={cn(
          "absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial",
          isDark 
            ? "from-purple-500/10 via-transparent to-transparent"
            : "from-indigo-400/10 via-transparent to-transparent"
        )} />
        {/* 日间模式：舰桥网格纹理 */}
        {!isDark && (
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        )}
      </div>

      {/* 标题栏 */}
      <div className="relative z-10 flex items-center gap-2 mb-4">
        <div className="animate-spin-slow">
          <Cpu className={cn(
            "w-4 h-4",
            isDark ? "text-cyan-400" : "text-blue-500"
          )} />
        </div>
        <span className={cn(
          "text-sm font-medium",
          isDark ? "text-white/80" : "text-slate-700"
        )}>{t('monitor.engine_room')}</span>
        
        {/* 状态指示灯 */}
        <div
          className="ml-auto w-2 h-2 rounded-full animate-pulse"
          style={{
            backgroundColor: error ? '#ef4444' : isLoading ? '#f59e0b' : '#22c55e',
            boxShadow: isDark ? undefined : `0 0 6px ${error ? '#ef4444' : isLoading ? '#f59e0b' : '#22c55e'}50`
          }}
        />
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 space-y-4">
        {/* CPU 心电图 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              "flex items-center gap-1",
              isDark ? "text-white/60" : "text-slate-500"
            )}>
              <Activity className="w-3 h-3" />
              CPU
            </span>
            <span className={cn(
              "font-mono",
              isDark ? "text-cyan-400" : "text-blue-600 font-semibold"
            )}>
              <CountUp value={stats.cpuLoad} decimals={1} suffix="%" />
            </span>
          </div>
          <div className={cn(
            "h-16 rounded-lg overflow-hidden border",
            isDark 
              ? "bg-black/30 border-white/5" 
              : "bg-slate-50/80 border-slate-200/50 shadow-inner"
          )}>
            <ECGWave cpuLoad={stats.cpuLoad} isDark={isDark} />
          </div>
        </div>

        {/* 内存和硬盘 - 并排显示 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 内存 - 液态球 */}
          <div className="space-y-2">
            <div className={cn(
              "flex items-center justify-center text-xs gap-1",
              isDark ? "text-white/60" : "text-slate-500"
            )}>
              <Database className="w-3 h-3" />
              内存
            </div>
            <LiquidOrb memUsage={stats.memUsage} isDark={isDark} />
          </div>

          {/* 硬盘 - 多磁盘圆环 */}
          <MultiDiskDisplay disks={stats.disks} isDark={isDark} />
        </div>

        {/* 运行时间 */}
        <motion.div 
          className={cn(
            "flex items-center justify-center gap-2 text-xs pt-2 border-t",
            isDark 
              ? "text-white/50 border-white/5" 
              : "text-slate-500 border-slate-200/50"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span>运行时间:</span>
          <span className={cn(
            "font-mono",
            isDark ? "text-white/70" : "text-slate-700 font-medium"
          )}>{stats.uptime}</span>
        </motion.div>
      </div>

      {/* 加载遮罩 */}
      <AnimatePresence>
        {isLoading && !data && (
          <motion.div
            className={cn(
              "absolute inset-0 flex items-center justify-center backdrop-blur-sm z-20",
              isDark ? "bg-black/50" : "bg-white/60"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="animate-spin">
              <Cpu className={cn(
                "w-8 h-8",
                isDark ? "text-cyan-400" : "text-blue-500"
              )} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            className={cn(
              "absolute bottom-2 left-2 right-2 text-xs rounded px-2 py-1 z-20",
              isDark 
                ? "text-red-400 bg-red-500/10" 
                : "text-red-600 bg-red-50 border border-red-200"
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            连接失败，正在重试...
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default SystemMonitorCard
