import { Home, Search, Plus, Languages, Sun, Moon, LayoutDashboard, Github } from 'lucide-react';
import { TFunction } from 'i18next';

export interface DockItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  IconComponent: React.FC<{ className?: string }>;
  href?: string;
  onClick?: () => void;
}

// Dock 导航项生成函数
export const createDockItems = (
  isDark: boolean,
  onToggleTheme: () => void,
  t: TFunction,
  onToggleLanguage: () => void
): DockItem[] => [
  {
    id: 'home',
    title: t('dock.home'),
    icon: <Home className="w-5 h-5" />,
    IconComponent: Home,
  },
  {
    id: 'search',
    title: t('dock.search'),
    icon: <Search className="w-5 h-5" />,
    IconComponent: Search,
  },
  {
    id: 'add',
    title: t('dock.add'),
    icon: <Plus className="w-5 h-5" />,
    IconComponent: Plus,
  },
  {
    id: 'language',
    title: t('language_toggle'),
    icon: <Languages className="w-5 h-5" />,
    IconComponent: Languages,
    onClick: onToggleLanguage,
  },
  {
    id: 'theme',
    title: isDark ? t('dock.theme_light') : t('dock.theme_dark'),
    icon: isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />,
    IconComponent: isDark ? Sun : Moon,
    onClick: onToggleTheme,
  },
  {
    id: 'admin',
    title: t('dock.admin'),
    icon: <LayoutDashboard className="w-5 h-5" />,
    IconComponent: LayoutDashboard,
  },
  {
    id: 'github',
    title: 'GitHub',
    icon: <Github className="w-5 h-5" />,
    IconComponent: Github,
    href: 'https://github.com/cropflre/NOWEN',
  },
];

// 根据菜单可见性过滤 Dock 项
export const filterDockItems = (
  items: DockItem[],
  menuVisibility: { languageToggle?: boolean; themeToggle?: boolean }
): DockItem[] => {
  return items.filter((item) => {
    if (item.id === 'language' && menuVisibility.languageToggle === false) {
      return false;
    }
    if (item.id === 'theme' && menuVisibility.themeToggle === false) {
      return false;
    }
    return true;
  });
};
