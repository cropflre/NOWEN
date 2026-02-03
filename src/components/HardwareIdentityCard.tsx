/**
 * HardwareIdentityCard - 静态全息蓝图
 * 视觉风格：系统启动自检 (POST Sequence)
 * 设计隐喻：精密档案 + 终端读取硬件底层
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { 
  Cpu, 
  CircuitBoard, 
  MemoryStick, 
  HardDrive, 
  Monitor,
  Server,
  Terminal,
  Scan
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'

// ============================================
// 类型定义
// ============================================

interface StaticSystemInfo {
  cpu: {
    brand: string
    manufacturer: string
    speed: number
    speedMax: number
    cores: number
    physicalCores: number
    processors: number
    cache: {
      l1d: number
      l1i: number
      l2: number
      l3: number
    }
  }
  system: {
    manufacturer: string
    model: string
    version: string
  }
  bios: {
    vendor: string
    version: string
    releaseDate: string
  }
  memory: {
    total: string
    slots: Array<{
      bank: string
      type: string
      size: string
      clockSpeed: number
      manufacturer: string
    }>
  }
  disks: Array<{
    name: string
    type: string
    size: string
    vendor: string
  }>
  graphics: {
    controllers: Array<{
      vendor: string
      model: string
      vram: string
    }>
    displays: Array<{
      model: string
      resolution: string
    }>
  }
  os: {
    platform: string
    distro: string
    release: string
    kernel: string
    arch: string
    hostname: string
  }
}

interface ApiResponse {
  success: boolean
  data: StaticSystemInfo
  cached?: boolean
}

// API Fetcher
const fetcher = async (url: string): Promise<StaticSystemInfo> => {
  const res = await fetch(url)
  const json: ApiResponse = await res.json()
  if (!json.success) {
    throw new Error('API request failed')
  }
  return json.data
}

// ============================================
// TerminalLine - 终端输出行（响应式）
// ============================================
interface TerminalLineProps {
  prefix?: string
  label: string
  value: string
  status?: 'ok' | 'warn' | 'info'
  delay?: number
  icon?: React.ElementType
  color?: string
  isMobile?: boolean
  isDark?: boolean
}

function TerminalLine({ 
  prefix = '>', 
  label, 
  value, 
  status = 'ok',
  delay = 0,
  icon: Icon,
  color = 'cyan',
  isMobile = false,
  isDark = true
}: TerminalLineProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [displayValue, setDisplayValue] = useState('')
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    return () => clearTimeout(visibilityTimer)
  }, [delay])

  useEffect(() => {
    if (!isVisible) return
    
    let currentIndex = 0
    // 移动端打字速度更快
    const typeSpeed = isMobile ? 15 : 25
    const typeTimer = setInterval(() => {
      if (currentIndex <= value.length) {
        setDisplayValue(value.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(typeTimer)
        setTimeout(() => setShowStatus(true), 100)
      }
    }, typeSpeed)

    return () => clearInterval(typeTimer)
  }, [isVisible, value, isMobile])

  const statusColors = isDark ? {
    ok: 'text-green-400',
    warn: 'text-amber-400',
    info: 'text-cyan-400'
  } : {
    ok: 'text-green-600',
    warn: 'text-amber-600',
    info: 'text-blue-600'
  }

  const statusText = {
    ok: '✓',
    warn: '⚠',
    info: 'ℹ'
  }

  const colorClasses: Record<string, string> = isDark ? {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    rose: 'text-rose-400'
  } : {
    cyan: 'text-blue-600',
    purple: 'text-indigo-600',
    green: 'text-emerald-600',
    orange: 'text-orange-600',
    rose: 'text-rose-600'
  }

  if (!isVisible) return null

  return (
    <motion.div 
      className={cn(
        "flex items-center gap-1.5 font-mono",
        isMobile ? "py-0.5 text-[10px]" : "py-1 text-xs gap-2"
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 前缀 + Icon */}
      <span className={cn(
        "flex-shrink-0",
        isMobile ? "w-3" : "w-4",
        isDark ? "text-white/30" : "text-slate-400"
      )}>{prefix}</span>
      {Icon && <Icon className={cn("flex-shrink-0", colorClasses[color], isMobile ? "w-2.5 h-2.5" : "w-3 h-3")} />}
      
      {/* 标签 */}
      <span className={cn(
        "flex-shrink-0",
        isDark ? "text-white/50" : "text-slate-500"
      )}>{label}</span>
      
      {/* 值 */}
      <span className={cn("flex-1 truncate", colorClasses[color], !isDark && "font-medium")}>
        {displayValue}
        {displayValue.length < value.length && (
          <span className={cn(
            "inline-block w-[5px] h-[10px] bg-current animate-pulse ml-0.5",
            isDark ? "opacity-100" : "opacity-70"
          )} />
        )}
      </span>
      
      {/* 状态 */}
      <AnimatePresence>
        {showStatus && (
          <motion.span 
            className={cn("flex-shrink-0 font-bold", statusColors[status])}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {statusText[status]}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================
// POST 启动序列头部（中文版）
// ============================================
function PostHeader({ onComplete, isMobile, isDark = true }: { onComplete: () => void; isMobile: boolean; isDark?: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const onCompleteRef = useRef(onComplete)
  
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])
  
  const bootLines = useMemo(() => [
    'NOWEN BIOS v2.4.1',
    '正在初始化硬件扫描...',
    '内存检测... 通过',
    'CPU检测... 通过',
    '存储检测... 通过',
    '════════════════════',
    '系统档案已加载'
  ], [])

  useEffect(() => {
    if (currentIndex >= bootLines.length) {
      const timeout = setTimeout(() => onCompleteRef.current(), 300)
      return () => clearTimeout(timeout)
    }
    
    // 移动端更快的显示速度
    const timer = setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, isMobile ? 100 : 150)
    
    return () => clearTimeout(timer)
  }, [currentIndex, bootLines.length, isMobile])

  const visibleLines = bootLines.slice(0, currentIndex)

  return (
    <div className={cn(
      "font-mono mb-2 space-y-0.5",
      isMobile ? "text-[9px]" : "text-[10px]",
      isDark ? "text-green-400/70" : "text-emerald-600/80"
    )}>
      {visibleLines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={line.includes('═') ? (isDark ? 'text-white/20' : 'text-slate-300') : ''}
        >
          {line}
        </motion.div>
      ))}
    </div>
  )
}

// ============================================
// 主组件：HardwareIdentityCard
// ============================================
export function HardwareIdentityCard({ className }: { className?: string }) {
  const { isDark } = useTheme()
  
  const { data, error, isLoading } = useSWR<StaticSystemInfo>(
    '/api/system/static',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  )

  const [bootComplete, setBootComplete] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleBootComplete = useCallback(() => {
    setBootComplete(true)
    setTimeout(() => setShowContent(true), 100)
  }, [])

  // 格式化硬件信息（中文标签）
  const hardwareEntries = useMemo(() => {
    if (!data) return []

    const entries = [
      {
        label: '处理器',
        value: data.cpu?.brand || '未知',
        icon: Cpu,
        color: 'cyan',
        status: 'ok' as const
      },
      {
        label: '主板',
        value: `${data.system?.manufacturer || ''} ${data.system?.model || '未知'}`.trim(),
        icon: CircuitBoard,
        color: 'purple',
        status: 'ok' as const
      },
      {
        label: '固件',
        value: data.bios?.version || '未知',
        icon: Terminal,
        color: 'green',
        status: 'info' as const
      },
      {
        label: '内存',
        value: data.memory?.total || '未知',
        icon: MemoryStick,
        color: 'green',
        status: 'ok' as const
      },
      {
        label: '存储',
        value: data.disks?.[0] 
          ? `${data.disks[0].name} (${data.disks[0].size})` 
          : '未知',
        icon: HardDrive,
        color: 'orange',
        status: 'ok' as const
      },
      {
        label: '显卡',
        value: data.graphics?.controllers?.[0]?.model || '集成显卡',
        icon: Monitor,
        color: 'rose',
        status: data.graphics?.controllers?.[0]?.vram ? 'ok' as const : 'info' as const
      },
      {
        label: '系统',
        value: `${data.os?.distro || data.os?.platform || '未知'}`,
        icon: Server,
        color: 'purple',
        status: 'ok' as const
      },
    ].filter(item => item.value !== '未知' && item.value.trim() !== '')

    // 移动端只显示关键信息
    if (isMobile) {
      return entries.filter(e => ['处理器', '内存', '存储', '系统'].includes(e.label))
    }
    return entries
  }, [data, isMobile])

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl",
      "backdrop-blur-xl",
      "h-full",
      isMobile ? "p-3" : "p-4",
      // 日间模式：蓝图风格明亮版
      isDark 
        ? "bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 border border-cyan-500/10"
        : "bg-gradient-to-br from-slate-50/95 via-white/90 to-slate-50/95 border border-blue-200/50 shadow-xl shadow-blue-500/5",
      className
    )}>
      {/* 背景网格 */}
      <div 
        className={cn(
          "absolute inset-0",
          isDark ? "opacity-[0.015]" : "opacity-[0.04]"
        )}
        style={{
          backgroundImage: isDark 
            ? `linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
               linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)`
            : `linear-gradient(rgba(59, 130, 246, 0.4) 1px, transparent 1px),
               linear-gradient(90deg, rgba(59, 130, 246, 0.4) 1px, transparent 1px)`,
          backgroundSize: isMobile ? '8px 8px' : '12px 12px'
        }}
      />

      {/* 扫描线效果 */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none",
          isDark ? "opacity-30" : "opacity-10"
        )}
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
        }}
      />

      {/* 顶部 HUD 装饰 */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent to-transparent",
        isDark ? "via-cyan-400/40" : "via-blue-400/50"
      )} />
      
      {/* 标题栏 */}
      <div className={cn(
        "relative z-10 flex items-center gap-1.5 mb-2",
        isMobile ? "mb-1.5" : "mb-2"
      )}>
        <div className={cn(
          "w-2 h-2 rounded-full",
          isDark ? "bg-red-500/80" : "bg-red-400"
        )} />
        <div className={cn(
          "w-2 h-2 rounded-full",
          isDark ? "bg-yellow-500/80" : "bg-yellow-400"
        )} />
        <div className={cn(
          "w-2 h-2 rounded-full",
          isDark ? "bg-green-500/80" : "bg-green-400"
        )} />
        <span className={cn(
          "ml-2 font-mono tracking-wider",
          isMobile ? "text-[8px]" : "text-[10px]",
          isDark ? "text-white/30" : "text-slate-400"
        )}>
          {isMobile ? '/硬件档案' : '/sys/hardware/identity'}
        </span>
      </div>

      {/* 主内容区 */}
      <div className="relative z-10">
        {/* 加载状态 */}
        {isLoading && !data && (
          <div className={cn(
            "flex flex-col items-center justify-center",
            isMobile ? "py-4" : "py-8"
          )}>
            <Scan className={cn(
              "w-6 h-6 animate-spin mb-2",
              isDark ? "text-cyan-400/60" : "text-blue-500/70"
            )} />
            <div className={cn(
              "font-mono animate-pulse",
              isMobile ? "text-[10px]" : "text-xs",
              isDark ? "text-cyan-400/60" : "text-blue-600/70"
            )}>
              正在扫描硬件...
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className={cn(
            "flex items-center justify-center",
            isMobile ? "py-4" : "py-8"
          )}>
            <span className={cn(
              "font-mono",
              isMobile ? "text-[10px]" : "text-xs",
              isDark ? "text-red-400" : "text-red-600"
            )}>
              [错误] 硬件检测失败
            </span>
          </div>
        )}

        {/* 数据加载完成 - POST序列 */}
        {data && !bootComplete && (
          <PostHeader onComplete={handleBootComplete} isMobile={isMobile} isDark={isDark} />
        )}

        {/* 硬件信息列表 */}
        {showContent && (
          <div className="space-y-0">
            {hardwareEntries.map((entry, index) => (
              <TerminalLine
                key={entry.label}
                label={entry.label}
                value={entry.value}
                icon={entry.icon}
                color={entry.color}
                status={entry.status}
                delay={index * (isMobile ? 80 : 120)}
                isMobile={isMobile}
                isDark={isDark}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className={cn(
        "absolute left-3 right-3 flex items-center justify-between",
        isMobile ? "bottom-1.5" : "bottom-2 left-4 right-4"
      )}>
        <span className={cn(
          "font-mono",
          isMobile ? "text-[8px]" : "text-[9px]",
          isDark ? "text-white/20" : "text-slate-400"
        )}>
          {bootComplete ? '扫描完成' : '初始化中...'}
        </span>
        <div className="flex items-center gap-1">
          <div className={cn(
            "rounded-full",
            isMobile ? "w-1 h-1" : "w-1.5 h-1.5",
            bootComplete 
              ? (isDark ? "bg-green-400" : "bg-green-500") 
              : (isDark ? "bg-cyan-400 animate-pulse" : "bg-blue-500 animate-pulse")
          )} />
          <span className={cn(
            "font-mono",
            isMobile ? "text-[8px]" : "text-[9px]",
            isDark ? "text-white/20" : "text-slate-400"
          )}>
            {bootComplete ? '就绪' : '忙碌'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default HardwareIdentityCard
