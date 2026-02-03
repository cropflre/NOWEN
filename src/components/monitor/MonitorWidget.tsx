/**
 * MonitorWidget - 迷你型监控组件 (The Orb Widget)
 * 设计隐喻：钢铁侠胸口的反应堆 / 战术 HUD 悬浮球
 * 
 * 特性：
 * - 可拖拽定位
 * - 根据 CPU 负载动态变色
 * - 双击展开为默认视图
 * - 悬停显示详细数据
 * - 支持日间/夜间模式
 */
import { useState, useCallback, useRef } from 'react'
import { motion, useDragControls, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Maximize2, GripVertical } from 'lucide-react'
import type { MonitorViewMode } from './SystemMonitor'

interface MonitorWidgetProps {
  cpu: number
  mem: number
  temp: number
  status: 'healthy' | 'warning' | 'critical'
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onSwitchMode?: (mode: MonitorViewMode) => void
}

// ============================================
// 颜色工具函数
// ============================================

// 根据数值获取颜色：低(青/绿) -> 中(琥珀) -> 高(红)
const getColor = (val: number): string => {
  if (val > 80) return '#ef4444'  // red-500
  if (val > 50) return '#f59e0b'  // amber-500
  return '#22c55e'                // green-500
}

// 获取渐变色
const getGradient = (val: number): string => {
  if (val > 80) return 'from-red-500 to-rose-600'
  if (val > 50) return 'from-amber-500 to-orange-600'
  return 'from-emerald-500 to-cyan-500'
}

// 状态颜色映射
const statusColors = {
  healthy: '#22c55e',   // green-500
  warning: '#f59e0b',   // amber-500
  critical: '#ef4444',  // red-500
}

// ============================================
// 主组件
// ============================================

export function MonitorWidget({ 
  cpu, 
  mem, 
  temp, 
  status,
  className,
  size = 'md',
  onSwitchMode,
}: MonitorWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragControls = useDragControls()
  const lastTapTime = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 尺寸配置
  const sizeConfig = {
    sm: { 
      container: 'w-20 h-20', 
      viewBox: 80, 
      outerR: 34, 
      stroke: 4,
      fontSize: 'text-lg',
      labelSize: 'text-[8px]',
    },
    md: { 
      container: 'w-28 h-28', 
      viewBox: 112, 
      outerR: 48, 
      stroke: 5,
      fontSize: 'text-2xl',
      labelSize: 'text-[10px]',
    },
    lg: { 
      container: 'w-36 h-36', 
      viewBox: 144, 
      outerR: 62, 
      stroke: 6,
      fontSize: 'text-3xl',
      labelSize: 'text-xs',
    },
  }
  
  const config = sizeConfig[size]
  const center = config.viewBox / 2
  const circumference = 2 * Math.PI * config.outerR

  // 双击处理：展开为默认视图
  const handleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapTime.current < 300) {
      // 双击
      onSwitchMode?.('default')
    }
    lastTapTime.current = now
  }, [onSwitchMode])

  // 主颜色
  const primaryColor = getColor(cpu)

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none",
        "touch-none", // 防止触摸滚动干扰
        config.container,
        isDragging && "z-50",
        className
      )}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.1}
      whileDrag={{ scale: 1.05 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      onTap={handleTap}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* 1. 背景光晕：随 CPU 负载变色 */}
      <motion.div 
        className="absolute inset-0 rounded-full blur-2xl transition-colors duration-500"
        style={{ background: primaryColor }}
        animate={{ 
          opacity: status === 'critical' ? [0.3, 0.5, 0.3] : isHovered ? 0.35 : 0.2,
          scale: status === 'critical' ? [1, 1.1, 1] : 1,
        }}
        transition={{ 
          duration: status === 'critical' ? 1 : 0.3,
          repeat: status === 'critical' ? Infinity : 0,
        }}
      />

      {/* 2. 外层脉冲环（危急状态时） */}
      <AnimatePresence>
        {status === 'critical' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: `${statusColors.critical}80` }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ 
              scale: [1, 1.4, 1.6],
              opacity: [0.5, 0.2, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </AnimatePresence>

      {/* 3. 玻璃球体主体 - 适配日间/夜间模式 */}
      <div className={cn(
        "absolute inset-2 rounded-full",
        // 暗色模式
        "dark:bg-slate-950/80",
        // 亮色模式：浅色玻璃效果
        "bg-white/80",
        "backdrop-blur-xl",
        // 边框
        "dark:border-white/10 border-slate-200/80",
        "border",
        // 阴影
        "dark:shadow-2xl dark:shadow-black/50",
        "shadow-xl shadow-slate-300/50",
        // 内部高光
        "before:absolute before:inset-0 before:rounded-full",
        "before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-transparent",
        "dark:before:from-white/10",
      )} />

      {/* 4. SVG 环形进度条 */}
      <svg 
        className="absolute inset-0 w-full h-full -rotate-90" 
        viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
      >
        {/* 轨道背景 - 适配主题 */}
        <circle 
          cx={center} 
          cy={center} 
          r={config.outerR} 
          className="stroke-slate-200 dark:stroke-white/10"
          strokeWidth={config.stroke} 
          fill="none" 
        />
        
        {/* CPU 进度环 */}
        <motion.circle 
          cx={center} 
          cy={center} 
          r={config.outerR}
          stroke={primaryColor}
          strokeWidth={config.stroke}
          fill="none" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - cpu / 100) }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ 
            filter: `drop-shadow(0 0 8px ${primaryColor})`,
          }}
        />
        
        {/* 小刻度线装饰 - 适配主题 */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180)
          const x1 = center + (config.outerR - 8) * Math.cos(angle)
          const y1 = center + (config.outerR - 8) * Math.sin(angle)
          const x2 = center + (config.outerR - 4) * Math.cos(angle)
          const y2 = center + (config.outerR - 4) * Math.sin(angle)
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              className="stroke-slate-300 dark:stroke-white/15"
              strokeWidth="1"
            />
          )
        })}
      </svg>

      {/* 5. 核心信息显示 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <AnimatePresence mode="wait">
          {isHovered ? (
            // Hover 状态：显示详细数据
            <motion.div 
              key="detail"
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <span className={cn(
                "font-bold font-mono",
                "text-slate-800 dark:text-white",
                config.fontSize
              )}>
                {cpu}%
              </span>
              <span className={cn(
                "text-slate-500 dark:text-white/50 uppercase tracking-wider",
                config.labelSize
              )}>
                CPU LOAD
              </span>
              
              {/* 额外指标 */}
              <div className="flex gap-2 mt-1">
                <span className={cn("text-purple-500 dark:text-purple-400", config.labelSize)}>
                  M:{mem}%
                </span>
                {temp > 0 && (
                  <span className={cn("text-orange-500 dark:text-orange-400", config.labelSize)}>
                    T:{temp}°
                  </span>
                )}
              </div>
            </motion.div>
          ) : (
            // 默认状态：状态指示
            <motion.div 
              key="default"
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              {/* 状态呼吸灯 */}
              <motion.div
                className="w-3 h-3 rounded-full mb-1"
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
                "font-mono tracking-widest uppercase",
                "text-slate-500 dark:text-white/60",
                config.labelSize
              )}>
                SYS
              </span>
              {/* CPU 数值预览 */}
              <span className={cn(
                "font-bold font-mono mt-0.5",
                cpu > 80 ? "text-red-500 dark:text-red-400" : cpu > 50 ? "text-amber-500 dark:text-amber-400" : "text-green-500 dark:text-green-400",
                size === 'sm' ? 'text-sm' : 'text-base'
              )}>
                {cpu}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. 角标：快速状态指示 - 适配主题边框 */}
      <motion.div
        className={cn(
          "absolute rounded-full border-2",
          "border-white dark:border-slate-950",
          size === 'sm' ? 'w-3 h-3 top-1 right-1' : 'w-4 h-4 top-2 right-2'
        )}
        style={{ background: statusColors[status] }}
        animate={status === 'critical' ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.5, repeat: status === 'critical' ? Infinity : 0 }}
      />

      {/* 7. 操作提示 (Hover 时显示) */}
      <AnimatePresence>
        {isHovered && onSwitchMode && (
          <motion.div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <span className="text-[9px] text-slate-400 dark:text-white/30 whitespace-nowrap">
              双击展开
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSwitchMode('default')
              }}
              className="p-1 rounded bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300/50 dark:hover:bg-white/10 transition-colors"
              title="展开仪表盘"
            >
              <Maximize2 className="w-3 h-3 text-slate-500 dark:text-white/40" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSwitchMode('inline')
              }}
              className="p-1 rounded bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300/50 dark:hover:bg-white/10 transition-colors"
              title="切换到状态栏"
            >
              <GripVertical className="w-3 h-3 text-slate-500 dark:text-white/40" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. 拖拽指示器 (拖拽时显示) */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default MonitorWidget
