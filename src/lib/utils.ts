import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 从 icons.ts 统一导出图标相关内容
export { iconMap, presetIcons, getIconComponent, isIconifyIcon } from './icons'
export type { LucideIcon } from './icons'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function getGreeting(hour: number): string {
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

export function isNightTime(hour: number): boolean {
  return hour < 6 || hour >= 19
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
