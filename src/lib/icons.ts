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
} from "lucide-react";

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
};

// 预设图标列表（用于图标选择器）
export const presetIcons: { name: string; icon: LucideIcon }[] = Object.entries(
  iconMap
).map(([name, icon]) => ({ name, icon }));

// 根据图标名称获取图标组件
export function getIconComponent(name: string | undefined): LucideIcon {
  return iconMap[name || ""] || Folder;
}

// 导出类型
export type { LucideIcon };
