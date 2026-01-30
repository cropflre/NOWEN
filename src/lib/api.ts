// API 基础路径：开发环境通过 vite proxy 代理，生产环境直接访问
const API_BASE = '/api'

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  
  if (response.status === 204) {
    return null as T
  }
  
  return response.json()
}

// ========== 书签 API ==========

export interface BookmarkData {
  id: string
  url: string
  title: string
  description?: string | null
  favicon?: string | null
  ogImage?: string | null
  category?: string | null
  tags?: string | null
  orderIndex: number
  isPinned: boolean
  isReadLater: boolean
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateBookmarkInput {
  url: string
  title: string
  description?: string
  favicon?: string
  ogImage?: string
  category?: string
  tags?: string
  isReadLater?: boolean
}

export const bookmarkApi = {
  getAll: () => request<BookmarkData[]>('/bookmarks'),
  
  create: (data: CreateBookmarkInput) => 
    request<BookmarkData>('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<BookmarkData>) =>
    request<BookmarkData>(`/bookmarks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request<void>(`/bookmarks/${id}`, { method: 'DELETE' }),
  
  reorder: (items: { id: string; orderIndex: number }[]) =>
    request<{ success: boolean }>('/bookmarks/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    }),
}

// ========== 元数据 API ==========

export interface MetadataResult {
  title: string
  description: string
  favicon: string
  ogImage?: string
  error?: string
}

export const metadataApi = {
  parse: (url: string) =>
    request<MetadataResult>('/metadata', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
}

// ========== 分类 API ==========

export interface CategoryData {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  orderIndex: number
}

export const categoryApi = {
  getAll: () => request<CategoryData[]>('/categories'),
  
  create: (data: { name: string; icon?: string; color?: string }) =>
    request<CategoryData>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
