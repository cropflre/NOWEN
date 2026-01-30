export interface Bookmark {
  id: string
  url: string
  title: string
  description?: string
  favicon?: string
  ogImage?: string
  category?: string
  tags?: string[]
  orderIndex: number
  createdAt: number
  updatedAt: number
  isPinned?: boolean
  isReadLater?: boolean
  isRead?: boolean
}

export interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  orderIndex: number
}

export interface BookmarkStore {
  bookmarks: Bookmark[]
  categories: Category[]
}

// 初始示例数据
export const initialBookmarks: Bookmark[] = [
  {
    id: '1',
    url: 'https://github.com',
    title: 'GitHub',
    description: 'Where the world builds software',
    favicon: 'https://github.githubassets.com/favicons/favicon.svg',
    category: 'dev',
    orderIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPinned: true,
  },
  {
    id: '2',
    url: 'https://vercel.com',
    title: 'Vercel',
    description: 'Develop. Preview. Ship.',
    favicon: 'https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico',
    category: 'dev',
    orderIndex: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '3',
    url: 'https://tailwindcss.com',
    title: 'Tailwind CSS',
    description: 'Rapidly build modern websites without ever leaving your HTML',
    favicon: 'https://tailwindcss.com/favicons/favicon.ico',
    category: 'dev',
    orderIndex: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '4',
    url: 'https://react.dev',
    title: 'React',
    description: 'The library for web and native user interfaces',
    favicon: 'https://react.dev/favicon.ico',
    category: 'dev',
    orderIndex: 3,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '5',
    url: 'https://www.notion.so',
    title: 'Notion',
    description: 'Your connected workspace for wiki, docs & projects',
    favicon: 'https://www.notion.so/images/favicon.ico',
    category: 'productivity',
    orderIndex: 4,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '6',
    url: 'https://linear.app',
    title: 'Linear',
    description: 'Streamline issues, projects, and product roadmaps',
    favicon: 'https://linear.app/favicon.ico',
    category: 'productivity',
    orderIndex: 5,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isReadLater: true,
  },
  {
    id: '7',
    url: 'https://figma.com',
    title: 'Figma',
    description: 'The collaborative interface design tool',
    favicon: 'https://static.figma.com/app/icon/1/favicon.ico',
    category: 'design',
    orderIndex: 6,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '8',
    url: 'https://dribbble.com',
    title: 'Dribbble',
    description: 'Discover the world\'s top designers & creatives',
    favicon: 'https://cdn.dribbble.com/assets/favicon-b38525134603b9513174ec887944bde1a869eb6cd414f4c21a034b8a94b645c.ico',
    category: 'design',
    orderIndex: 7,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

export const initialCategories: Category[] = [
  { id: 'dev', name: '开发', icon: 'code', color: '#667eea', orderIndex: 0 },
  { id: 'productivity', name: '效率', icon: 'zap', color: '#f093fb', orderIndex: 1 },
  { id: 'design', name: '设计', icon: 'palette', color: '#f5576c', orderIndex: 2 },
  { id: 'reading', name: '阅读', icon: 'book', color: '#43e97b', orderIndex: 3 },
  { id: 'media', name: '媒体', icon: 'play', color: '#fa709a', orderIndex: 4 },
]
