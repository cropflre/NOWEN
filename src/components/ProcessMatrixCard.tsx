/**
 * ProcessMatrixCard - 进程矩阵卡片
 * 视觉风格：Matrix 矩阵 + 星链状态 (Constellation Status)
 * 设计隐喻：蜂巢矩阵 - 信号灯矩阵
 * 功能：Docker 容器状态光点 + 航天任务计时器风格的运行时间
 */
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { Clock, Satellite } from 'lucide-react'
import { cn } from '../lib/utils'

// ============================================
// 类型定义
// ============================================

interface DockerContainer {
  id: string
  name: string
  image: string
  state: string
  status: string
  started: number
}

interface DynamicSystemInfo {
  uptime: string
  docker: {
    running: number
    paused: number
    stopped: number
    containers: number
  } | null
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

// API Fetcher
const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url)
  const json: ApiResponse<T> = await res.json()
  if (!json.success) {
    throw new Error('API request failed')
  }
  return json.data
}

// ============================================
// 解析运行时间字符串为航天任务格式
// ============================================
function parseUptimeToMission(uptimeStr: string): string {
  // 输入格式: "45天12小时30分钟" 或 "12小时30分钟" 等
  const dayMatch = uptimeStr.match(/(\d+)天/)
  const hourMatch = uptimeStr.match(/(\d+)小时/)
  const minMatch = uptimeStr.match(/(\d+)分钟/)
  
  const days = dayMatch ? parseInt(dayMatch[1]) : 0
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0
  const mins = minMatch ? parseInt(minMatch[1]) : 0
  
  // 格式化为航天任务计时器风格
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0 || days > 0) parts.push(`${hours.toString().padStart(2, '0')}h`)
  parts.push(`${mins.toString().padStart(2, '0')}m`)
  
  return `T+ ${parts.join(' ')}`
}

// ============================================
// 状态映射为中文
// ============================================
function getStateText(state: string): string {
  switch (state) {
    case 'running': return '运行中'
    case 'paused': return '已暂停'
    case 'exited': return '已停止'
    case 'created': return '已创建'
    case 'restarting': return '重启中'
    case 'removing': return '移除中'
    case 'dead': return '已终止'
    default: return '未知'
  }
}

// ============================================
// ContainerDot - 容器光点组件
// ============================================
interface ContainerDotProps {
  container: DockerContainer
}

function ContainerDot({ container }: ContainerDotProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  
  const isRunning = container.state === 'running'
  const isPaused = container.state === 'paused'
  
  // 根据状态确定颜色
  const dotColor = isRunning 
    ? '#22c55e' // 绿色 - 运行中
    : isPaused 
      ? '#f59e0b' // 橙色 - 暂停
      : '#ef4444' // 红色 - 已停止

  // 随机化位置偏移，让点阵更有机
  const randomOffset = useMemo(() => ({
    x: (Math.random() - 0.5) * 4,
    y: (Math.random() - 0.5) * 4,
  }), [])

  // 随机化动画延迟
  const animationDelay = useMemo(() => Math.random() * 2, [])

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    })
    setIsHovered(true)
  }

  return (
    <motion.div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: animationDelay * 0.2, type: 'spring', stiffness: 200 }}
    >
      {/* 外层光晕 - 运行中时显示 */}
      {isRunning && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: dotColor }}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: animationDelay
          }}
        />
      )}

      {/* 光点 */}
      <motion.div
        className={cn(
          "w-3 h-3 rounded-full cursor-pointer relative z-10",
          !isRunning && "opacity-60"
        )}
        style={{
          backgroundColor: dotColor,
          boxShadow: isRunning 
            ? `0 0 8px ${dotColor}, 0 0 16px ${dotColor}50`
            : `0 0 4px ${dotColor}50`,
          transform: `translate(${randomOffset.x}px, ${randomOffset.y}px)`,
        }}
        whileHover={{ scale: 1.5 }}
        animate={isRunning ? {
          opacity: [0.8, 1, 0.8],
        } : {}}
        transition={isRunning ? {
          duration: 2,
          repeat: Infinity,
          delay: animationDelay
        } : {}}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translate(-50%, -100%)',
            }}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-black/95 border border-green-500/30 rounded-lg px-3 py-2 text-xs whitespace-nowrap backdrop-blur-sm shadow-xl">
              <div className="font-mono text-green-400 font-medium text-sm">
                {container.name}
              </div>
              <div className="text-[10px] text-white/40 font-mono mt-0.5">
                {container.image.split(':')[0]}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="text-[10px]" style={{ color: dotColor }}>
                  {getStateText(container.state)}
                </span>
              </div>
            </div>
            {/* 小三角 */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid rgba(34, 197, 94, 0.3)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================
// MatrixRain - 矩阵雨背景效果
// ============================================
function MatrixRain() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-green-500 font-mono text-[10px] animate-matrix-fall"
          style={{
            left: `${(i * 8) + 2}%`,
            animationDuration: `${3 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          {Array.from({ length: 8 }).map((_, j) => (
            <div key={j} className="opacity-50">
              {String.fromCharCode(0x30A0 + Math.random() * 96)}
            </div>
          ))}
        </div>
      ))}
      
      <style>{`
        @keyframes matrix-fall {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        .animate-matrix-fall {
          animation: matrix-fall linear infinite;
        }
      `}</style>
    </div>
  )
}

// ============================================
// MissionTimer - 航天任务计时器
// ============================================
function MissionTimer({ uptime }: { uptime: string }) {
  const missionTime = parseUptimeToMission(uptime)
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => setBlink(prev => !prev), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center gap-3 py-2 px-3 bg-black/50 rounded-lg border border-green-500/20">
      <Clock className="w-3.5 h-3.5 text-green-400" />
      <div className="font-mono text-sm sm:text-base tracking-widest">
        <span className="text-green-500/60 text-xs">运行时间</span>
        <span 
          className={cn(
            "ml-2 text-green-400 font-bold",
            blink ? "opacity-100" : "opacity-80"
          )}
        >
          {missionTime}
        </span>
      </div>
      {/* 状态指示灯 */}
      <div className="flex gap-1 ml-auto">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <div className="w-1.5 h-1.5 rounded-full bg-green-400/50" />
        <div className="w-1.5 h-1.5 rounded-full bg-green-400/30" />
      </div>
    </div>
  )
}

// ============================================
// 主组件：ProcessMatrixCard
// ============================================
export function ProcessMatrixCard({ className }: { className?: string }) {
  // 获取 Docker 容器列表
  const { data: containers, error: containerError, isLoading: containerLoading } = useSWR<DockerContainer[]>(
    '/api/system/docker',
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  // 获取系统动态信息（用于 uptime）
  const { data: systemInfo } = useSWR<DynamicSystemInfo>(
    '/api/system/dynamic',
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: false,
    }
  )

  // 统计容器状态
  const stats = useMemo(() => {
    if (!containers) return { running: 0, stopped: 0, total: 0 }
    return {
      running: containers.filter(c => c.state === 'running').length,
      stopped: containers.filter(c => c.state !== 'running').length,
      total: containers.length,
    }
  }, [containers])

  const uptime = systemInfo?.uptime || '0分钟'

  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden",
      "bg-gradient-to-br from-gray-950 via-gray-900 to-black",
      "border border-green-500/20",
      "backdrop-blur-xl",
      "p-3 sm:p-4 h-full min-w-0",
      className
    )}>
      {/* 矩阵雨背景 */}
      <MatrixRain />

      {/* 扫描线效果 */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.1) 2px, rgba(34, 197, 94, 0.1) 4px)',
        }}
      />

      {/* 标题栏 */}
      <div className="relative z-10 flex items-center gap-1.5 mb-3">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Satellite className="w-3.5 h-3.5 text-green-400" />
        </motion.div>
        <span className="text-xs sm:text-sm font-medium text-green-400/80 tracking-wider">
          服务蜂巢
        </span>
        
        {/* 容器统计 */}
        <div className="ml-auto flex items-center gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <motion.div 
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-green-400">{stats.running}</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400/60" />
            <span className="text-red-400/70">{stats.stopped}</span>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="relative z-10">
        {/* 加载状态 */}
        {containerLoading && !containers && (
          <div className="flex items-center justify-center py-12">
            <div className="text-green-400 font-mono text-xs animate-pulse">
              正在加载矩阵...
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {containerError && (
          <div className="flex items-center justify-center py-8 text-red-400 text-xs font-mono">
            连接失败
          </div>
        )}

        {/* 容器光点矩阵 */}
        {containers && containers.length > 0 && (
          <div className="mb-4">
            <div 
              className="flex flex-wrap gap-3 justify-center items-center p-4 rounded-lg bg-black/30 border border-green-500/10 min-h-[80px]"
            >
              {containers.map((container) => (
                <ContainerDot 
                  key={container.id} 
                  container={container}
                />
              ))}
            </div>
          </div>
        )}

        {/* 无容器状态 */}
        {containers && containers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-green-400/50">
            <div className="text-2xl mb-2">○</div>
            <div className="text-xs font-mono">暂无容器</div>
          </div>
        )}

        {/* 航天任务计时器 */}
        <MissionTimer uptime={uptime} />
      </div>

      {/* 边框发光效果 */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 30px rgba(34, 197, 94, 0.05)',
        }}
      />

      {/* 角落装饰 */}
      <div className="absolute top-2 left-2 w-2 h-2 border-l border-t border-green-500/30" />
      <div className="absolute top-2 right-2 w-2 h-2 border-r border-t border-green-500/30" />
      <div className="absolute bottom-2 left-2 w-2 h-2 border-l border-b border-green-500/30" />
      <div className="absolute bottom-2 right-2 w-2 h-2 border-r border-b border-green-500/30" />
    </div>
  )
}

export default ProcessMatrixCard
