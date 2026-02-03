/**
 * MonitorDashboard - 默认型全功能面板 (The Command Deck)
 * 设计隐喻：主控室大屏
 * 信息密度最高，包含波浪图、液态球、进程矩阵等
 */
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { 
  Activity, 
  Thermometer, 
  HardDrive, 
  Wifi,
  Clock,
  Box,
  Cpu,
  MemoryStick
} from 'lucide-react'

interface MonitorDashboardProps {
  cpu: number
  mem: number
  temp: number
  net: {
    up: string
    down: string
  }
  disk: {
    used: number
    total: string
    free: string
  }
  containers: {
    running: number
    total: number
  }
  uptime: string
  status: 'healthy' | 'warning' | 'critical'
  className?: string
}

// 迷你进度条组件
function MiniProgress({ 
  value, 
  label, 
  icon: Icon,
  color = 'cyan'
}: { 
  value: number
  label: string
  icon: React.ElementType
  color?: 'cyan' | 'purple' | 'green' | 'orange' | 'rose'
}) {
  const colorMap = {
    cyan: { bar: 'bg-cyan-500', glow: 'shadow-cyan-500/50' },
    purple: { bar: 'bg-purple-500', glow: 'shadow-purple-500/50' },
    green: { bar: 'bg-green-500', glow: 'shadow-green-500/50' },
    orange: { bar: 'bg-orange-500', glow: 'shadow-orange-500/50' },
    rose: { bar: 'bg-rose-500', glow: 'shadow-rose-500/50' },
  }
  
  const getBarColor = (val: number) => {
    if (val > 80) return 'bg-red-500 shadow-red-500/50'
    if (val > 60) return 'bg-amber-500 shadow-amber-500/50'
    return `${colorMap[color].bar} ${colorMap[color].glow}`
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-white/50">
          <Icon className="w-3 h-3" />
          <span>{label}</span>
        </div>
        <span className={cn(
          "font-mono font-bold tabular-nums",
          value > 80 ? "text-red-400" : value > 60 ? "text-amber-400" : "text-white/80"
        )}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full shadow-lg", getBarColor(value))}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

// 数据块组件
function DataBlock({ 
  label, 
  value, 
  subValue,
  icon: Icon,
  trend
}: { 
  label: string
  value: string
  subValue?: string
  icon: React.ElementType
  trend?: 'up' | 'down'
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5">
      <div className="p-2 rounded-lg bg-cyan-500/10">
        <Icon className="w-4 h-4 text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-white/40 uppercase tracking-wider">{label}</div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-mono font-bold text-white/90 truncate">{value}</span>
          {trend && (
            <span className={cn(
              "text-[10px]",
              trend === 'up' ? "text-green-400" : "text-red-400"
            )}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
        </div>
        {subValue && (
          <div className="text-[10px] text-white/30 truncate">{subValue}</div>
        )}
      </div>
    </div>
  )
}

export function MonitorDashboard({
  cpu,
  mem,
  temp,
  net,
  disk,
  containers,
  uptime,
  status,
  className,
}: MonitorDashboardProps) {
  const statusConfig = {
    healthy: { color: 'text-green-400', bg: 'bg-green-500', label: '系统正常' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500', label: '负载较高' },
    critical: { color: 'text-red-400', bg: 'bg-red-500', label: '系统告警' },
  }

  return (
    <div className={cn(
      "relative p-4 rounded-2xl overflow-hidden",
      "bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95",
      "border border-cyan-500/10",
      "backdrop-blur-xl",
      className
    )}>
      {/* 背景网格 */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      {/* 头部状态 */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div 
            className={cn("w-2 h-2 rounded-full", statusConfig[status].bg)}
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className={cn("text-xs font-medium", statusConfig[status].color)}>
            {statusConfig[status].label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/30">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{uptime}</span>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="relative z-10 space-y-3 mb-4">
        <MiniProgress value={cpu} label="CPU" icon={Cpu} color="cyan" />
        <MiniProgress value={mem} label="内存" icon={MemoryStick} color="purple" />
        <MiniProgress value={disk.used} label="存储" icon={HardDrive} color="orange" />
      </div>

      {/* 数据网格 */}
      <div className="relative z-10 grid grid-cols-2 gap-2">
        <DataBlock 
          label="温度" 
          value={temp > 0 ? `${temp}°C` : '--'} 
          icon={Thermometer}
        />
        <DataBlock 
          label="网络" 
          value={net.down}
          subValue={`↑ ${net.up}`}
          icon={Wifi}
        />
        {containers.total > 0 && (
          <DataBlock 
            label="容器" 
            value={`${containers.running}/${containers.total}`}
            subValue="运行中"
            icon={Box}
          />
        )}
        <DataBlock 
          label="可用空间" 
          value={disk.free}
          icon={HardDrive}
        />
      </div>

      {/* 底部扫描线 */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </div>
  )
}

export default MonitorDashboard
