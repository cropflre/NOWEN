import { motion } from 'framer-motion'
import { 
  Gauge,
  Cpu,
  Activity,
  Network,
  ListTree,
  CircleDot,
  BarChart3,
  Eye,
  EyeOff,
  MonitorSmartphone,
  Monitor
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { WidgetVisibility } from '../../lib/api'

interface WidgetConfig {
  id: keyof WidgetVisibility
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  category: 'dashboard' | 'dock'
}

const widgetConfigs: WidgetConfig[] = [
  {
    id: 'systemMonitor',
    label: '系统监控仪表',
    description: '显示 CPU、内存、磁盘、网络等实时数据',
    icon: Gauge,
    gradient: 'from-cyan-500 to-blue-600',
    category: 'dashboard',
  },
  {
    id: 'hardwareIdentity',
    label: '硬件信息卡片',
    description: '显示处理器、主板、固件等硬件信息',
    icon: Cpu,
    gradient: 'from-indigo-500 to-purple-600',
    category: 'dashboard',
  },
  {
    id: 'vitalSigns',
    label: '生命体征卡片',
    description: '实时显示 CPU 和内存使用率趋势图',
    icon: Activity,
    gradient: 'from-emerald-500 to-green-600',
    category: 'dashboard',
  },
  {
    id: 'networkTelemetry',
    label: '网络遥测卡片',
    description: '显示网络上传下载速度和流量统计',
    icon: Network,
    gradient: 'from-violet-500 to-purple-600',
    category: 'dashboard',
  },
  {
    id: 'processMatrix',
    label: '进程矩阵卡片',
    description: '显示系统运行中的进程列表',
    icon: ListTree,
    gradient: 'from-amber-500 to-orange-600',
    category: 'dashboard',
  },
  {
    id: 'dockMiniMonitor',
    label: 'Dock 迷你监控',
    description: '桌面端 Dock 旁边的迷你监控球',
    icon: CircleDot,
    gradient: 'from-rose-500 to-pink-600',
    category: 'dock',
  },
  {
    id: 'mobileTicker',
    label: '移动端状态栏',
    description: '移动端底部 Dock 上方的状态指示条',
    icon: BarChart3,
    gradient: 'from-teal-500 to-cyan-600',
    category: 'dock',
  },
]

interface WidgetSettingsCardProps {
  visibility: WidgetVisibility
  onChange: (visibility: WidgetVisibility) => void
  onSave: () => Promise<void>
  isSaving: boolean
  success: boolean
  error: string
}

export function WidgetSettingsCard({
  visibility,
  onChange,
  onSave,
  isSaving,
  success,
  error,
}: WidgetSettingsCardProps) {
  const toggleWidget = (id: keyof WidgetVisibility) => {
    onChange({
      ...visibility,
      [id]: !visibility[id],
    })
  }

  const dashboardWidgets = widgetConfigs.filter(w => w.category === 'dashboard')
  const dockWidgets = widgetConfigs.filter(w => w.category === 'dock')

  // 计算显示数量
  const visibleCount = Object.values(visibility).filter(Boolean).length
  const totalCount = widgetConfigs.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative group"
    >
      <div 
        className="relative overflow-hidden rounded-2xl backdrop-blur-xl p-6"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {/* Animated Border Gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/20 via-transparent to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:block hidden" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-600/20 border border-sky-500/20 flex items-center justify-center">
                <Gauge className="w-6 h-6 text-sky-500" />
              </div>
              <div className="absolute -inset-2 rounded-xl bg-sky-500/20 blur-xl opacity-50 -z-10 dark:block hidden" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>仪表显示</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>控制首页仪表组件的显示与隐藏</p>
            </div>
          </div>

          {/* 统计指示 */}
          <div 
            className="px-3 py-1.5 rounded-full text-sm font-medium"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-glass-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span className="text-[var(--color-primary)]">{visibleCount}</span>
            <span className="mx-1">/</span>
            <span>{totalCount}</span>
            <span className="ml-1">已启用</span>
          </div>
        </div>

        {/* Dashboard Widgets Section */}
        <div className="relative mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              仪表板组件
            </span>
            <div className="flex-1 h-px ml-2" style={{ background: 'var(--color-glass-border)' }} />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {dashboardWidgets.map((widget) => {
              const Icon = widget.icon
              const isVisible = visibility[widget.id] !== false
              
              return (
                <motion.div
                  key={widget.id}
                  className={cn(
                    'relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer',
                    isVisible ? 'opacity-100' : 'opacity-60'
                  )}
                  style={{
                    background: isVisible 
                      ? 'var(--color-bg-tertiary)' 
                      : 'var(--color-bg-secondary)',
                    border: isVisible 
                      ? '1px solid var(--color-primary)' 
                      : '1px solid var(--color-glass-border)',
                  }}
                  onClick={() => toggleWidget(widget.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* 图标 */}
                  <div 
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      'bg-gradient-to-br',
                      widget.gradient,
                      !isVisible && 'grayscale'
                    )}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* 文本 */}
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {widget.label}
                    </div>
                    <div 
                      className="text-xs mt-0.5 truncate"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {widget.description}
                    </div>
                  </div>
                  
                  {/* 开关按钮 */}
                  <div 
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0',
                      isVisible
                        ? 'bg-gradient-to-r from-sky-500 to-violet-500'
                        : 'bg-gray-600/50'
                    )}
                  >
                    <motion.div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                      animate={{ left: isVisible ? '1.75rem' : '0.25rem' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                  
                  {/* 状态图标 */}
                  <div className="w-5 flex-shrink-0">
                    {isVisible ? (
                      <Eye className="w-5 h-5 text-green-500" />
                    ) : (
                      <EyeOff className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Dock Widgets Section */}
        <div className="relative mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MonitorSmartphone className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Dock 组件
            </span>
            <div className="flex-1 h-px ml-2" style={{ background: 'var(--color-glass-border)' }} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dockWidgets.map((widget) => {
              const Icon = widget.icon
              const isVisible = visibility[widget.id] !== false
              
              return (
                <motion.div
                  key={widget.id}
                  className={cn(
                    'relative flex items-center gap-3 p-4 rounded-xl transition-all duration-300 cursor-pointer',
                    isVisible ? 'opacity-100' : 'opacity-60'
                  )}
                  style={{
                    background: isVisible 
                      ? 'var(--color-bg-tertiary)' 
                      : 'var(--color-bg-secondary)',
                    border: isVisible 
                      ? '1px solid var(--color-primary)' 
                      : '1px solid var(--color-glass-border)',
                  }}
                  onClick={() => toggleWidget(widget.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* 图标 */}
                  <div 
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      'bg-gradient-to-br',
                      widget.gradient,
                      !isVisible && 'grayscale'
                    )}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  
                  {/* 文本 */}
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium text-sm"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {widget.label}
                    </div>
                    <div 
                      className="text-xs mt-0.5 truncate"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {widget.description}
                    </div>
                  </div>
                  
                  {/* 状态图标 */}
                  <div className="flex-shrink-0">
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* 提示信息 */}
        <div 
          className="relative p-3 rounded-xl mb-6"
          style={{
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-glass-border)',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            💡 提示：隐藏仪表可以减少首页数据请求，提升加载速度。修改后需保存才能生效。
          </p>
        </div>

        {/* 状态消息 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400"
          >
            设置保存成功
          </motion.div>
        )}

        {/* 保存按钮 */}
        <motion.button
          onClick={onSave}
          disabled={isSaving}
          whileHover={{ scale: isSaving ? 1 : 1.02 }}
          whileTap={{ scale: isSaving ? 1 : 0.98 }}
          className={cn(
            'relative w-full py-3 rounded-xl font-medium overflow-hidden',
            'bg-gradient-to-r from-sky-600 to-violet-600',
            'text-white shadow-lg shadow-sky-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-300'
          )}
        >
          <span className="relative z-10">
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                保存中...
              </span>
            ) : '保存配置'}
          </span>
        </motion.button>
      </div>
    </motion.div>
  )
}
