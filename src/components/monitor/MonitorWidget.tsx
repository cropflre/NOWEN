/**
 * MonitorWidget - 迷你型监控组件 (The Orb Widget)
 * 设计隐喻：钢铁侠胸口的反应堆
 * 通过圆环闭合度和颜色呼吸传递系统健康状态
 */
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface MonitorWidgetProps {
  cpu: number
  mem: number
  temp: number
  status: 'healthy' | 'warning' | 'critical'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// 根据数值获取颜色：低(青) -> 中(紫) -> 高(红)
const getColor = (val: number): string => {
  if (val > 80) return '#f43f5e'  // rose-500
  if (val > 50) return '#d946ef'  // fuchsia-500
  return '#06b6d4'                // cyan-500
}

// 状态颜色映射
const statusColors = {
  healthy: '#22c55e',   // green-500
  warning: '#f59e0b',   // amber-500
  critical: '#ef4444',  // red-500
}

export function MonitorWidget({ 
  cpu, 
  mem, 
  temp, 
  status,
  className,
  size = 'md'
}: MonitorWidgetProps) {
  // 尺寸配置
  const sizeConfig = {
    sm: { container: 'w-20 h-20', viewBox: 80, outerR: 34, middleR: 26, innerR: 18, stroke: 3 },
    md: { container: 'w-32 h-32', viewBox: 128, outerR: 56, middleR: 44, innerR: 32, stroke: 4 },
    lg: { container: 'w-40 h-40', viewBox: 160, outerR: 70, middleR: 56, innerR: 42, stroke: 5 },
  }
  
  const config = sizeConfig[size]
  const center = config.viewBox / 2

  return (
    <div className={cn(
      "relative flex items-center justify-center group cursor-pointer select-none",
      config.container,
      className
    )}>
      {/* 1. 背景光晕：随 CPU 负载变色，模拟能量溢出 */}
      <motion.div 
        className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-500"
        style={{ background: getColor(cpu) }}
        initial={{ opacity: 0.15 }}
        animate={{ 
          opacity: status === 'critical' ? [0.3, 0.5, 0.3] : 0.2,
          scale: status === 'critical' ? [1, 1.1, 1] : 1,
        }}
        transition={{ 
          duration: status === 'critical' ? 1 : 0.5,
          repeat: status === 'critical' ? Infinity : 0,
        }}
      />

      {/* 2. 外层脉冲环（危急状态时） */}
      {status === 'critical' && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-red-500/50"
          animate={{ 
            scale: [1, 1.3, 1.5],
            opacity: [0.5, 0.2, 0],
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}

      {/* 3. SVG 同心圆环组 */}
      <svg 
        className="w-full h-full -rotate-90" 
        viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
      >
        {/* CPU 轨道 + 指示器 (最外层) */}
        <circle 
          cx={center} cy={center} r={config.outerR} 
          stroke="rgba(255,255,255,0.08)" 
          strokeWidth={config.stroke} 
          fill="none" 
        />
        <motion.circle 
          cx={center} cy={center} r={config.outerR}
          stroke={getColor(cpu)} 
          strokeWidth={config.stroke} 
          fill="none" 
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: cpu / 100 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${getColor(cpu)})` }}
        />
        
        {/* Memory 轨道 + 指示器 (中间层) */}
        <circle 
          cx={center} cy={center} r={config.middleR} 
          stroke="rgba(255,255,255,0.08)" 
          strokeWidth={config.stroke} 
          fill="none" 
        />
        <motion.circle 
          cx={center} cy={center} r={config.middleR}
          stroke={getColor(mem)} 
          strokeWidth={config.stroke} 
          fill="none" 
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: mem / 100 }}
          transition={{ duration: 1.5, delay: 0.15, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 4px ${getColor(mem)})` }}
        />

        {/* Temperature 轨道 + 指示器 (最内层) */}
        <circle 
          cx={center} cy={center} r={config.innerR} 
          stroke="rgba(255,255,255,0.08)" 
          strokeWidth={config.stroke} 
          fill="none" 
        />
        <motion.circle 
          cx={center} cy={center} r={config.innerR}
          stroke={getColor(temp)} 
          strokeWidth={config.stroke} 
          fill="none" 
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.min(temp, 100) / 100 }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 3px ${getColor(temp)})` }}
        />
      </svg>

      {/* 4. 核心信息：默认显示状态，Hover 时显示具体数值 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* 默认状态 */}
        <div className="flex flex-col items-center group-hover:hidden">
          <motion.div
            className="w-2 h-2 rounded-full mb-1"
            style={{ background: statusColors[status] }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <span className={cn(
            "font-mono text-white/50 tracking-widest uppercase",
            size === 'sm' ? 'text-[8px]' : 'text-xs'
          )}>
            SYS
          </span>
        </div>
        
        {/* Hover 状态 */}
        <motion.div 
          className="hidden group-hover:flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <span className={cn(
            "font-bold text-white font-mono",
            size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'
          )}>
            {cpu}%
          </span>
          <span className={cn(
            "text-white/50 uppercase",
            size === 'sm' ? 'text-[8px]' : 'text-[10px]'
          )}>
            CPU
          </span>
        </motion.div>
      </div>

      {/* 5. 角标：快速状态指示 */}
      <motion.div
        className={cn(
          "absolute rounded-full border-2 border-slate-900",
          size === 'sm' ? 'w-3 h-3 -top-0.5 -right-0.5' : 'w-4 h-4 top-0 right-0'
        )}
        style={{ background: statusColors[status] }}
        animate={status === 'critical' ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, repeat: status === 'critical' ? Infinity : 0 }}
      />
    </div>
  )
}

export default MonitorWidget
