// API 基础地址 - 支持环境变量配置
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

// ========== 请求工具函数 ==========

interface RequestOptions extends RequestInit {
  requireAuth?: boolean
}

// 获取存储的 Token
function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

// 统一请求处理
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = false, ...fetchOptions } = options
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }
  
  // 需要认证时添加 Token
  if (requireAuth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  })
  
  // 处理无内容响应
  if (res.status === 204) {
    return undefined as T
  }
  
  const data = await res.json()
  
  if (!res.ok) {
    // 401 未授权 - 清除登录状态
    if (res.status === 401) {
      localStorage.removeItem('admin_authenticated')
      localStorage.removeItem('admin_login_time')
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_username')
    }
    throw new Error(data.error || data.message || `请求失败: ${res.status}`)
  }
  
  return data
}

// ========== 书签 API ==========

export async function fetchBookmarks() {
  return request<any[]>('/api/bookmarks')
}

export async function createBookmark(data: {
  url: string
  title: string
  description?: string
  favicon?: string
  ogImage?: string
  category?: string
  tags?: string
  isReadLater?: boolean
}) {
  return request<any>('/api/bookmarks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateBookmark(id: string, data: Record<string, any>) {
  return request<any>(`/api/bookmarks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteBookmark(id: string) {
  return request<void>(`/api/bookmarks/${id}`, {
    method: 'DELETE',
  })
}

export async function reorderBookmarks(items: { id: string; orderIndex: number }[]) {
  return request<{ success: boolean }>('/api/bookmarks/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  })
}

// ========== 分类 API ==========

export async function fetchCategories() {
  return request<any[]>('/api/categories')
}

export async function createCategory(data: { name: string; icon?: string; color: string }) {
  return request<any>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCategory(id: string, data: Record<string, any>) {
  return request<any>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteCategory(id: string) {
  return request<void>(`/api/categories/${id}`, {
    method: 'DELETE',
  })
}

// ========== 元数据 API ==========

export async function fetchMetadata(url: string) {
  return request<{
    title?: string
    description?: string
    favicon?: string
    ogImage?: string
    error?: string
  }>('/api/metadata', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

// 兼容旧导入名称
export const metadataApi = {
  parse: fetchMetadata,
}

// ========== 管理员 API ==========

export async function adminLogin(username: string, password: string) {
  const data = await request<{
    success: boolean
    token: string
    user: { id: string; username: string }
  }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  
  // 保存登录状态
  if (data.success && data.token) {
    localStorage.setItem('admin_authenticated', 'true')
    localStorage.setItem('admin_login_time', Date.now().toString())
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_username', data.user.username)
  }
  
  return data
}

export async function adminChangePassword(
  currentPassword: string,
  newPassword: string
) {
  return request<{ success: boolean; message: string }>('/api/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
    requireAuth: true,
  })
}

// 验证 Token 有效性
export async function adminVerify() {
  return request<{ valid: boolean; user: { id: string; username: string } }>('/api/admin/verify', {
    requireAuth: true,
  })
}

// 退出登录
export async function adminLogout() {
  try {
    await request<{ success: boolean }>('/api/admin/logout', {
      method: 'POST',
      requireAuth: true,
    })
  } finally {
    clearAuthStatus()
  }
}

// 验证登录状态
export function checkAuthStatus(): { isValid: boolean; username: string | null } {
  const authenticated = localStorage.getItem('admin_authenticated')
  const loginTime = localStorage.getItem('admin_login_time')
  const username = localStorage.getItem('admin_username')
  
  if (authenticated === 'true' && loginTime) {
    // 登录有效期 24 小时
    const isValid = Date.now() - parseInt(loginTime) < 24 * 60 * 60 * 1000
    if (isValid) {
      return { isValid: true, username }
    }
  }
  
  // 已过期，清除登录状态
  clearAuthStatus()
  return { isValid: false, username: null }
}

// 清除登录状态
export function clearAuthStatus() {
  localStorage.removeItem('admin_authenticated')
  localStorage.removeItem('admin_login_time')
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_username')
}

// ========== 站点设置 API ==========

export interface SiteSettings {
  siteTitle?: string
  siteFavicon?: string
}

export async function fetchSettings() {
  return request<SiteSettings>('/api/settings')
}

export async function updateSettings(settings: SiteSettings) {
  return request<SiteSettings>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
    requireAuth: true,
  })
}

// ========== API 导出对象 (便于统一使用) ==========

export const bookmarkApi = {
  list: fetchBookmarks,
  create: createBookmark,
  update: updateBookmark,
  delete: deleteBookmark,
  reorder: reorderBookmarks,
}

export const categoryApi = {
  list: fetchCategories,
  create: createCategory,
  update: updateCategory,
  delete: deleteCategory,
}

export const adminApi = {
  login: adminLogin,
  changePassword: adminChangePassword,
  verify: adminVerify,
  logout: adminLogout,
  checkStatus: checkAuthStatus,
  clearStatus: clearAuthStatus,
}

export const settingsApi = {
  get: fetchSettings,
  update: updateSettings,
}

// ========== 数据导入导出 API ==========

export interface ExportData {
  version: string
  exportedAt: string
  data: {
    bookmarks: any[]
    categories: any[]
    settings: SiteSettings
  }
}

export async function exportData() {
  return request<ExportData>('/api/export', {
    requireAuth: true,
  })
}

export async function importData(data: ExportData['data']) {
  return request<{ success: boolean; message: string }>('/api/import', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export const dataApi = {
  export: exportData,
  import: importData,
}

// ========== 名言 API ==========

export interface QuotesData {
  quotes: string[]
  useDefaultQuotes: boolean
}

export async function fetchQuotes() {
  return request<QuotesData>('/api/quotes')
}

export async function updateQuotes(quotes: string[], useDefaultQuotes?: boolean) {
  return request<{ success: boolean; count: number }>('/api/quotes', {
    method: 'PUT',
    body: JSON.stringify({ quotes, useDefaultQuotes }),
    requireAuth: true,
  })
}

export const quotesApi = {
  list: fetchQuotes,
  update: updateQuotes,
}
