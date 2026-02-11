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

// ========== Lucide 预设图标（向后兼容） ==========

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

// ========== Iconify 支持 ==========

// 判断图标名称是否为 Iconify 格式（包含冒号，如 "mdi:home"）
export function isIconifyIcon(name: string | undefined): boolean {
  return !!name && name.includes(":");
}

// 根据图标名称获取 Lucide 图标组件（仅用于非 Iconify 图标）
export function getIconComponent(name: string | undefined): LucideIcon {
  if (!name || isIconifyIcon(name)) return Folder;
  return iconMap[name] || Folder;
}

// ========== Iconify 搜索 API ==========

export interface IconifySearchResult {
  name: string; // 完整名称如 "mdi:home"
  prefix: string; // 图标集前缀如 "mdi"
  body: string; // 图标名如 "home"
}

// 热门图标集及其代表图标
export const popularIconSets = [
  { prefix: "mdi", name: "Material Design Icons", sample: ["home", "account", "cog", "star", "heart", "bell", "email", "folder"] },
  { prefix: "ri", name: "Remix Icon", sample: ["home-line", "user-line", "settings-line", "search-line", "star-line", "heart-line", "mail-line", "folder-line"] },
  { prefix: "tabler", name: "Tabler Icons", sample: ["home", "user", "settings", "search", "star", "heart", "mail", "folder"] },
  { prefix: "ph", name: "Phosphor Icons", sample: ["house", "user", "gear", "magnifying-glass", "star", "heart", "envelope", "folder"] },
  { prefix: "carbon", name: "Carbon Icons", sample: ["home", "user", "settings", "search", "star", "favorite", "email", "folder"] },
  { prefix: "lucide", name: "Lucide Icons", sample: ["home", "user", "settings", "search", "star", "heart", "mail", "folder"] },
  { prefix: "solar", name: "Solar Icons", sample: ["home-bold", "user-bold", "settings-bold", "magnifer-bold", "star-bold", "heart-bold", "letter-bold", "folder-bold"] },
  { prefix: "fluent", name: "Fluent UI Icons", sample: ["home-20-regular", "person-20-regular", "settings-20-regular", "search-20-regular", "star-20-regular", "heart-20-regular", "mail-20-regular", "folder-20-regular"] },
];

// 从 Iconify API 搜索图标
export async function searchIconifyIcons(
  query: string,
  limit: number = 64
): Promise<IconifySearchResult[]> {
  if (!query.trim()) return [];

  try {
    const url = `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    // API 返回 { icons: ["mdi:home", "mdi:home-outline", ...] }
    if (data.icons && Array.isArray(data.icons)) {
      return data.icons.map((fullName: string) => {
        const [prefix, ...rest] = fullName.split(":");
        return { name: fullName, prefix, body: rest.join(":") };
      });
    }
    return [];
  } catch (err) {
    console.warn("Iconify search failed:", err);
    return [];
  }
}

// 获取指定图标集的图标列表
export async function getIconSetIcons(
  prefix: string,
  limit: number = 64
): Promise<IconifySearchResult[]> {
  try {
    const url = `https://api.iconify.design/collection?prefix=${encodeURIComponent(prefix)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    // 从 uncategorized 或 categories 中提取图标名
    let iconNames: string[] = [];

    if (data.uncategorized) {
      iconNames = data.uncategorized;
    } else if (data.categories) {
      for (const cat of Object.values(data.categories)) {
        iconNames.push(...(cat as string[]));
      }
    }

    return iconNames.slice(0, limit).map((name: string) => ({
      name: `${prefix}:${name}`,
      prefix,
      body: name,
    }));
  } catch (err) {
    console.warn("Iconify collection fetch failed:", err);
    return [];
  }
}

// 导出类型
export type { LucideIcon };
