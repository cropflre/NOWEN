import { Icon } from '@iconify/react'
import { isIconifyIcon, getIconComponent } from '../lib/icons'

interface IconRendererProps {
  icon: string | undefined
  className?: string
  style?: React.CSSProperties
}

/**
 * 统一图标渲染组件
 * - 支持 Iconify 格式（如 "mdi:home"）
 * - 支持旧的 Lucide 名称（如 "globe"）
 * - 自动判断并渲染对应图标
 */
export function IconRenderer({ icon, className = 'w-5 h-5', style }: IconRendererProps) {
  if (!icon) return null

  if (isIconifyIcon(icon)) {
    return <Icon icon={icon} className={className} style={style} />
  }

  const LucideComp = getIconComponent(icon)
  return <LucideComp className={className} style={style} />
}
