/**
 * HardwareSpecsCard - JARVIS 风格硬件规格卡片
 * 视觉风格：钢铁侠 JARVIS 界面的透明蓝图
 * 功能：显示 CPU、主板、内存等硬件信息
 */
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { 
  Cpu, 
  CircuitBoard, 
  MemoryStick, 
  HardDrive, 
  Monitor,
  Server,
  Scan,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { cn } from '../lib/utils'

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
// TypewriterText 组件 - 逐字打出效果
// ============================================
function TypewriterText({ 
  text, 
  delay = 0,
  speed = 50,
  className,
  onComplete
}: { 
  text: string
  delay?: number
  speed?: number
  className?: string
  onComplete?: () => void
}) {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    setDisplayText('')
    setIsComplete(false)
    setHasStarted(false)
    
    const startTimeout = setTimeout(() => {
      setHasStarted(true)
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [text, delay])

  useEffect(() => {
    if (!hasStarted) return
    
    if (displayText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, displayText.length + 1))
      }, speed)
      return () => clearTimeout(timeout)
    } else {
      setIsComplete(true)
      onComplete?.()
    }
  }, [displayText, text, speed, hasStarted, onComplete])

  return (
    <span className={cn('font-mono', className)}>
      {displayText}
      {!isComplete && hasStarted && (
        <motion.span
          className="inline-block w-[2px] h-[1em] ml-0.5 bg-cyan-400"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        />
      )}
    </span>
  )
}

// ============================================
// ScanLine 组件 - 扫描线效果
// ============================================
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
      initial={{ top: 0, opacity: 0 }}
      animate={{ 
        top: ['0%', '100%'],
        opacity: [0, 1, 1, 0]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  )
}

// ============================================
// HardwareItem 组件 - 单个硬件信息项
// ============================================
function HardwareItem({
  icon: Icon,
  label,
  value,
  subValue,
  delay = 0,
  color = 'cyan'
}: {
  icon: React.ElementType
  label: string
  value: string
  subValue?: string
  delay?: number
  color?: 'cyan' | 'purple' | 'green' | 'orange'
}) {
  const [isScanned, setIsScanned] = useState(false)
  
  const colorClasses = {
    cyan: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
    purple: 'text-purple-400 border-purple-400/30 bg-purple-400/5',
    green: 'text-green-400 border-green-400/30 bg-green-400/5',
    orange: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  }

  const glowClasses = {
    cyan: 'shadow-cyan-400/20',
    purple: 'shadow-purple-400/20',
    green: 'shadow-green-400/20',
    orange: 'shadow-orange-400/20',
  }

  return (
    <motion.div
      className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02] backdrop-blur-sm"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.15, duration: 0.5 }}
    >
      {/* Icon */}
      <motion.div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center',
          colorClasses[color],
          isScanned && `shadow-lg ${glowClasses[color]}`
        )}
        animate={isScanned ? {
          boxShadow: [
            `0 0 10px var(--tw-shadow-color)`,
            `0 0 20px var(--tw-shadow-color)`,
            `0 0 10px var(--tw-shadow-color)`
          ]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Icon className="w-5 h-5" />
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
          <AnimatePresence>
            {isScanned && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-green-400"
              >
                <CheckCircle2 className="w-3 h-3" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className={cn('text-sm font-medium', colorClasses[color].split(' ')[0])}>
          <TypewriterText 
            text={value} 
            delay={delay * 150 + 300} 
            speed={30}
            onComplete={() => setIsScanned(true)}
          />
        </div>
        {subValue && (
          <div className="text-xs text-white/30 mt-0.5 font-mono">
            {isScanned && subValue}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================
// 主组件：HardwareSpecsCard
// ============================================
export function HardwareSpecsCard({ className }: { className?: string }) {
  const { data, error, isLoading } = useSWR<StaticSystemInfo>(
    '/api/system/static',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // 1小时内不重复请求
    }
  )

  const [scanPhase, setScanPhase] = useState<'scanning' | 'complete'>('scanning')

  // 扫描完成后切换状态
  useEffect(() => {
    if (data) {
      const timeout = setTimeout(() => {
        setScanPhase('complete')
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [data])

  // 格式化硬件信息
  const hardwareItems = useMemo(() => {
    if (!data) return []

    const items = [
      {
        icon: Cpu,
        label: '处理器',
        value: data.cpu?.brand || '未知',
        subValue: data.cpu ? `${data.cpu.physicalCores}核/${data.cpu.cores}线程 @ ${data.cpu.speedMax}GHz` : undefined,
        color: 'cyan' as const
      },
      {
        icon: CircuitBoard,
        label: '主板',
        value: data.system?.model || data.system?.manufacturer || '未知',
        subValue: data.bios ? `BIOS ${data.bios.version}` : undefined,
        color: 'purple' as const
      },
      {
        icon: MemoryStick,
        label: '内存',
        value: data.memory?.total || '未知',
        subValue: data.memory?.slots?.[0] 
          ? `${data.memory.slots[0].type} @ ${data.memory.slots[0].clockSpeed}MHz` 
          : undefined,
        color: 'green' as const
      },
      {
        icon: HardDrive,
        label: '存储',
        value: data.disks?.[0]?.name || '未知',
        subValue: data.disks?.[0] 
          ? `${data.disks[0].size} ${data.disks[0].type}` 
          : undefined,
        color: 'orange' as const
      },
      {
        icon: Monitor,
        label: '显卡',
        value: data.graphics?.controllers?.[0]?.model || '未知',
        subValue: data.graphics?.controllers?.[0]?.vram 
          ? `显存: ${data.graphics.controllers[0].vram}` 
          : undefined,
        color: 'cyan' as const
      },
      {
        icon: Server,
        label: '系统',
        value: data.os?.distro || data.os?.platform || '未知',
        subValue: data.os ? `${data.os.arch} | ${data.os.hostname}` : undefined,
        color: 'purple' as const
      },
    ]

    return items.filter(item => item.value !== '未知')
  }, [data])

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl",
      "bg-gradient-to-br from-slate-900/90 via-slate-800/70 to-slate-900/90",
      "border border-cyan-500/20",
      "backdrop-blur-xl",
      "p-5 h-full",
      className
    )}>
      {/* 背景网格 */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* 角落装饰 */}
      <div className="absolute top-0 left-0 w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400/60 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-cyan-400/60 to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-16 h-16">
        <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-cyan-400/60 to-transparent" />
        <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-cyan-400/60 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 w-16 h-16">
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400/60 to-transparent" />
        <div className="absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t from-cyan-400/60 to-transparent" />
      </div>
      <div className="absolute bottom-0 right-0 w-16 h-16">
        <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-cyan-400/60 to-transparent" />
        <div className="absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t from-cyan-400/60 to-transparent" />
      </div>

      {/* 扫描线 */}
      {scanPhase === 'scanning' && data && <ScanLine />}

      {/* 标题栏 */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={scanPhase === 'scanning' ? { 
              rotate: 360,
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              scale: { duration: 1, repeat: Infinity }
            }}
          >
            <Scan className="w-4 h-4 text-cyan-400" />
          </motion.div>
          <span className="text-sm font-medium text-white/80 tracking-wider uppercase">
            硬件扫描
          </span>
        </div>

        {/* 状态指示 */}
        <div className="flex items-center gap-2">
          <motion.div
            className={cn(
              "w-2 h-2 rounded-full",
              scanPhase === 'complete' ? 'bg-green-400' : 'bg-cyan-400'
            )}
            animate={{
              opacity: [1, 0.4, 1],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs text-white/40 font-mono">
            {scanPhase === 'scanning' ? '扫描中...' : '扫描完成'}
          </span>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 space-y-2">
        {/* 加载状态 */}
        <AnimatePresence>
          {isLoading && !data && (
            <motion.div
              className="flex flex-col items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Scan className="w-8 h-8 text-cyan-400" />
              </motion.div>
              <span className="mt-3 text-sm text-cyan-400/60 font-mono">
                正在初始化硬件扫描...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 错误状态 */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">硬件扫描失败</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 硬件信息列表 */}
        {data && (
          <div className="grid gap-2">
            {hardwareItems.map((item, index) => (
              <HardwareItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                subValue={item.subValue}
                delay={index}
                color={item.color}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部装饰线 */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
        initial={{ width: '0%' }}
        animate={{ width: scanPhase === 'complete' ? '80%' : '40%' }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </div>
  )
}

export default HardwareSpecsCard
