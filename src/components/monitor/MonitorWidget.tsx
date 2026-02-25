/**
 * MonitorWidget - 桌面端迷你监控胶囊
 * 紧凑胶囊式设计，固定位置，悬停展开详情
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Maximize2, GripVertical, Cpu, MemoryStick, Thermometer } from 'lucide-react'
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

const getColor = (val: number): string => {
  if (val > 80) return '#ef4444'
  if (val > 50) return '#f59e0b'
  return '#22c55e'
}

const statusColors = {
  healthy: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
}

// ============================================
// 迷你进度环
// ============================================
function MiniRing({
  value,
  color,
  size = 24,
  strokeWidth = 2.5,
}: {
  value: number
  color: string
  size?: number
  strokeWidth?: number
}) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const center = size / 2

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={center} cy={center} r={r}
        className="stroke-slate-200/40 dark:stroke-white/10"
        strokeWidth={strokeWidth} fill="none"
      />
      <motion.circle
        cx={center} cy={center} r={r}
        stroke={color} strokeWidth={strokeWidth}
        fill="none" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - value / 100) }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 2px ${color}80)` }}
      />
    </svg>
  )
}

// ============================================
// 主组件
// ============================================
export function MonitorWidget({
  cpu, mem, temp, status, className, onSwitchMode,
}: MonitorWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const widgetRef = useRef<HTMLDivElement>(null)

  // 主题监听
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    setIsDark(document.documentElement.classList.contains('dark'))
    return () => obs.disconnect()
  }, [])

  // 入场动画
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(t)
  }, [])

  const cpuColor = getColor(cpu)
  const memColor = getColor(mem)
  const sColor = statusColors[status]

  return (
    <div
      ref={widgetRef}
      className={cn(
        "select-none transition-opacity duration-300",
        entered ? 'opacity-100' : 'opacity-0',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative flex items-center rounded-full"
        style={{
          background: isDark
            ? 'rgba(15, 23, 42, 0.75)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
          padding: '6px 10px',
          gap: '8px',
        }}
        animate={{ scale: isHovered ? 1.03 : 1 }}
        transition={{ duration: 0.15 }}
      >
        {/* 状态灯 */}
        <motion.div
          className="w-[6px] h-[6px] rounded-full flex-shrink-0"
          style={{ background: sColor }}
          animate={status === 'critical'
            ? { scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }
            : { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }
          }
          transition={{ duration: status === 'critical' ? 0.7 : 2.5, repeat: Infinity }}
        />

        {/* CPU */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="relative">
            <MiniRing value={cpu} color={cpuColor} size={22} strokeWidth={2} />
            <Cpu className="absolute inset-0 m-auto text-slate-400 dark:text-white/40" style={{ width: 9, height: 9 }} />
          </div>
          <span className={cn(
            "text-[10px] font-bold font-mono tabular-nums leading-none",
            cpu > 80 ? "text-red-500 dark:text-red-400"
              : cpu > 50 ? "text-amber-500 dark:text-amber-400"
              : "text-green-600 dark:text-green-400",
          )}>{cpu}%</span>
        </div>

        {/* 分隔点 */}
        <div className="w-[3px] h-[3px] rounded-full bg-slate-300/60 dark:bg-white/15 flex-shrink-0" />

        {/* MEM */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="relative">
            <MiniRing value={mem} color={memColor} size={22} strokeWidth={2} />
            <MemoryStick className="absolute inset-0 m-auto text-slate-400 dark:text-white/40" style={{ width: 9, height: 9 }} />
          </div>
          <span className={cn(
            "text-[10px] font-bold font-mono tabular-nums leading-none",
            mem > 80 ? "text-red-500 dark:text-red-400"
              : mem > 50 ? "text-amber-500 dark:text-amber-400"
              : "text-green-600 dark:text-green-400",
          )}>{mem}%</span>
        </div>

        {/* 温度（有数据时显示） */}
        <AnimatePresence>
          {temp > 0 && (
            <motion.div
              className="flex items-center gap-0.5 flex-shrink-0"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
            >
              <div className="w-[3px] h-[3px] rounded-full bg-slate-300/60 dark:bg-white/15" />
              <Thermometer className={cn(
                "w-[10px] h-[10px] ml-0.5",
                temp > 70 ? "text-red-500" : temp > 50 ? "text-amber-500" : "text-blue-400"
              )} />
              <span className={cn(
                "text-[10px] font-mono tabular-nums",
                temp > 70 ? "text-red-500 dark:text-red-400"
                  : temp > 50 ? "text-amber-500 dark:text-amber-400"
                  : "text-blue-500 dark:text-blue-400",
              )}>{temp}°</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover 操作区 */}
        <AnimatePresence>
          {isHovered && onSwitchMode && (
            <motion.div
              className="flex items-center gap-0.5 flex-shrink-0 overflow-hidden"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="w-[3px] h-[3px] rounded-full bg-slate-300/60 dark:bg-white/15 ml-0.5" />
              <button
                onClick={(e) => { e.stopPropagation(); onSwitchMode('default') }}
                className="p-0.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors ml-0.5"
                title="仪表盘"
              >
                <Maximize2 className="w-[10px] h-[10px] text-slate-400 dark:text-white/40" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onSwitchMode('inline') }}
                className="p-0.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                title="状态栏"
              >
                <GripVertical className="w-[10px] h-[10px] text-slate-400 dark:text-white/40" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 危急状态光晕 */}
      {status === 'critical' && (
        <motion.div
          className="absolute -bottom-0.5 left-3 right-3 h-1.5 rounded-full blur-sm"
          style={{ background: statusColors.critical }}
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </div>
  )
}

export default MonitorWidget
