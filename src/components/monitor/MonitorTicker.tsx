/**
 * MonitorTicker - 一行展示型状态栏 (The Telemetry Stream)
 * 设计隐喻：黑客终端的状态栏
 * 适合常驻页面边缘，像股票代码或新闻滚动条
 */
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Wifi, WifiOff, Activity, Thermometer, HardDrive, Box } from 'lucide-react'

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
  compact?: boolean  // 紧凑模式，只显示核心指标
}

// 数字滚动动画组件
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      className={className}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 10, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {value.toString().padStart(2, '0')}
    </motion.span>
  )
}

export function MonitorTicker({ 
  cpu, 
  mem, 
  temp,
  net, 
  disk,
  containers,
  status,
  className,
  compact = false
}: MonitorTickerProps) {
  const isOnline = status !== 'critical'
  
  // 状态颜色
  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  }

  // 数值颜色（根据负载）
  const getValueColor = (val: number) => {
    if (val > 80) return 'text-red-400'
    if (val > 60) return 'text-amber-400'
    return 'text-cyan-400'
  }

  return (
    <div className={cn(
      "h-8 flex items-center gap-4 px-4",
      "bg-black/40 backdrop-blur-md",
      "border-t border-white/5",
      "font-mono text-xs text-white/60",
      "select-none overflow-hidden w-full",
      className
    )}>
      {/* 1. 状态指示灯 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <motion.div 
          className={cn("w-2 h-2 rounded-full", statusColors[status])}
          animate={status === 'critical' ? { 
            scale: [1, 1.3, 1],
            opacity: [1, 0.5, 1],
          } : {}}
          transition={{ duration: 0.8, repeat: status === 'critical' ? Infinity : 0 }}
        />
        <span className={cn(
          "font-bold tracking-wider",
          isOnline ? "text-green-400/80" : "text-red-400/80"
        )}>
          {isOnline ? 'ONLINE' : 'ALERT'}
        </span>
      </div>

      <span className="text-white/10">│</span>

      {/* 2. CPU */}
      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-white/30" />
        <span className="text-white/40">CPU</span>
        <span className={cn("font-bold tabular-nums", getValueColor(cpu))}>
          <AnimatedNumber value={cpu} />%
        </span>
      </div>

      {/* 3. 内存 */}
      <div className="flex items-center gap-1.5">
        <span className="text-white/40">MEM</span>
        <span className={cn("font-bold tabular-nums", getValueColor(mem))}>
          <AnimatedNumber value={mem} />%
        </span>
      </div>

      {!compact && (
        <>
          {/* 4. 温度 */}
          {temp > 0 && (
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3 h-3 text-white/30" />
              <span className={cn("tabular-nums", getValueColor(temp))}>
                {temp}°C
              </span>
            </div>
          )}

          <span className="text-white/10">│</span>

          {/* 5. 网络流量 */}
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="w-3 h-3 text-green-400/60" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400/60" />
            )}
            <div className="flex gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-purple-400">
                <span className="text-[9px]">↑</span>
                <span className="tabular-nums">{net.up}</span>
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="text-[9px]">↓</span>
                <span className="tabular-nums">{net.down}</span>
              </span>
            </div>
          </div>

          {/* 6. 磁盘 */}
          {disk && (
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-white/30" />
              <span className={cn("tabular-nums", getValueColor(disk.used))}>
                {disk.used}%
              </span>
            </div>
          )}

          {/* 7. 容器 */}
          {containers && containers.total > 0 && (
            <div className="flex items-center gap-1.5">
              <Box className="w-3 h-3 text-white/30" />
              <span className="text-green-400 tabular-nums">{containers.running}</span>
              <span className="text-white/20">/</span>
              <span className="text-white/40 tabular-nums">{containers.total}</span>
            </div>
          )}
        </>
      )}
      
      {/* 8. 装饰性扫描线 */}
      <div className="ml-auto flex items-center gap-2">
        <motion.div 
          className="w-16 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-[10px] text-white/20 tabular-nums">
          {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
        </span>
      </div>
    </div>
  )
}

export default MonitorTicker
