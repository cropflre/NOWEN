/**
 * Monitor Components - 态势感知变形监控系统
 * 三种信息密度的"信息胶囊"
 */

// 主组件（变形金刚）
export { SystemMonitor, type MonitorVariant, type SystemMonitorProps } from './SystemMonitor'
export { default } from './SystemMonitor'

// 子组件（独立使用）
export { MonitorWidget } from './MonitorWidget'
export { MonitorTicker } from './MonitorTicker'
export { MonitorDashboard } from './MonitorDashboard'

// Hook
export { useSystemVital, type SystemVitalData } from '../../hooks/useSystemVital'
