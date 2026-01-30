import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  Code2,
  Zap,
  Palette,
  BookOpen,
  Play,
  Briefcase,
  Coffee,
  Globe,
  Heart,
  Home,
  Image,
  Link,
  Mail,
  Map,
  MessageCircle,
  Music,
  Settings,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
  Video,
  Wallet,
  Gamepad2,
  Camera,
  Cpu,
  Database,
  FileText,
  Folder,
  Gift,
  Headphones,
  Key,
  Layers,
  type LucideIcon,
} from 'lucide-react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 图标名称到组件的映射
export const iconMap: Record<string, LucideIcon> = {
  code: Code2,
  zap: Zap,
  palette: Palette,
  book: BookOpen,
  play: Play,
  briefcase: Briefcase,
  coffee: Coffee,
  globe: Globe,
  heart: Heart,
  home: Home,
  image: Image,
  link: Link,
  mail: Mail,
  map: Map,
  message: MessageCircle,
  music: Music,
  settings: Settings,
  cart: ShoppingCart,
  star: Star,
  trending: TrendingUp,
  users: Users,
  video: Video,
  wallet: Wallet,
  gamepad: Gamepad2,
  camera: Camera,
  cpu: Cpu,
  database: Database,
  file: FileText,
  folder: Folder,
  gift: Gift,
  headphones: Headphones,
  key: Key,
  layers: Layers,
}

// 根据图标名称获取图标组件
export function getIconComponent(name: string | undefined): LucideIcon {
  return iconMap[name || ''] || Folder
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
