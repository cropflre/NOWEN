// API 基础地址 - 使用环境变量验证
import { getApiBase } from './env'
const API_BASE = getApiBase()

import type { Bookmark, Category } from '../types/bookmark'
import { ApiError, NetworkError, getHttpErrorMessage } from './error-handling'

// ========== API 类型定义 ==========

// 创建书签请求参数
export interface CreateBookmarkParams {
  url: string
  title: string
  description?: string
  favicon?: string
  ogImage?: string
  icon?: string
  iconUrl?: string
  category?: string
  tags?: string
  isReadLater?: boolean
}

// 更新书签请求参数
export interface UpdateBookmarkParams {
  url?: string
  title?: string
  description?: string
  favicon?: string
  ogImage?: string
  icon?: string
  iconUrl?: string
  category?: string
  tags?: string[]
  isPinned?: boolean
  isReadLater?: boolean
  isRead?: boolean
  orderIndex?: number
}

// 创建分类请求参数
export interface CreateCategoryParams {
  name: string
  icon?: string
  color: string
}

// 更新分类请求参数
export interface UpdateCategoryParams {
  name?: string
  icon?: string
  color?: string
  orderIndex?: number
}

// 元数据响应
export interface MetadataResponse {
  title?: string
  description?: string
  favicon?: string
  ogImage?: string
  error?: string
}

// 登录响应
export interface LoginResponse {
  success: boolean
  token: string
  user: { id: string; username: string }
  requirePasswordChange?: boolean
}

// 通用成功响应
export interface SuccessResponse {
  success: boolean
  message?: string
}

// 验证响应
export interface VerifyResponse {
  valid: boolean
  user: { id: string; username: string }
}

// 重排序项
export interface ReorderItem {
  id: string
  orderIndex: number
}

// ========== 请求工具函数 ==========

interface RequestOptions extends RequestInit {
  requireAuth?: boolean
  timeout?: number
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
  const { requireAuth = false, timeout = 30000, ...fetchOptions } = options
  
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

  // 创建 AbortController 用于超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    
    // 处理无内容响应
    if (res.status === 204) {
      return undefined as T
    }
    
    // 尝试解析 JSON
    let data: Record<string, unknown> | undefined
    try {
      data = await res.json()
    } catch {
      // 如果无法解析 JSON，继续处理
    }
    
    if (!res.ok) {
      // 401 未授权 - 清除登录状态
      if (res.status === 401) {
        localStorage.removeItem('admin_authenticated')
        localStorage.removeItem('admin_login_time')
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_username')
        localStorage.removeItem('admin_require_password_change')
      }
      
      // 构建 ApiError
      const message = (data?.error as string) || (data?.message as string) || getHttpErrorMessage(res.status)
      const details = data?.details as Array<{ field: string; message: string }> | undefined
      throw new ApiError(message, res.status, details)
    }
    
    return data as T
  } catch (error) {
    clearTimeout(timeoutId)
    
    // 处理 AbortError（超时）
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('请求超时，请稍后重试', 408)
    }
    
    // 处理网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('网络连接失败，请检查网络设置')
    }
    
    // 重新抛出 ApiError
    if (error instanceof ApiError) {
      throw error
    }
    
    // 其他错误
    throw new NetworkError('请求失败，请稍后重试')
  }
}

// ========== 书签 API ==========

export async function fetchBookmarks(): Promise<Bookmark[]> {
  return request<Bookmark[]>('/api/bookmarks')
}

// 分页查询参数
export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  isPinned?: boolean
  isReadLater?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'orderIndex'
  sortOrder?: 'asc' | 'desc'
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// 分页获取书签
export async function fetchBookmarksPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<Bookmark>> {
  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString())
  if (params.search) searchParams.set('search', params.search)
  if (params.category) searchParams.set('category', params.category)
  if (typeof params.isPinned === 'boolean') searchParams.set('isPinned', params.isPinned.toString())
  if (typeof params.isReadLater === 'boolean') searchParams.set('isReadLater', params.isReadLater.toString())
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  
  const queryString = searchParams.toString()
  const endpoint = `/api/bookmarks/paginated${queryString ? `?${queryString}` : ''}`
  
  return request<PaginatedResponse<Bookmark>>(endpoint)
}

export async function createBookmark(data: CreateBookmarkParams): Promise<Bookmark> {
  return request<Bookmark>('/api/bookmarks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateBookmark(id: string, data: UpdateBookmarkParams): Promise<Bookmark> {
  return request<Bookmark>(`/api/bookmarks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteBookmark(id: string): Promise<void> {
  return request<void>(`/api/bookmarks/${id}`, {
    method: 'DELETE',
  })
}

export async function reorderBookmarks(items: ReorderItem[]): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/bookmarks/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  })
}

// ========== 分类 API ==========

export async function fetchCategories(): Promise<Category[]> {
  return request<Category[]>('/api/categories')
}

export async function createCategory(data: CreateCategoryParams): Promise<Category> {
  return request<Category>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCategory(id: string, data: UpdateCategoryParams): Promise<Category> {
  return request<Category>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteCategory(id: string): Promise<void> {
  return request<void>(`/api/categories/${id}`, {
    method: 'DELETE',
  })
}

export async function reorderCategories(items: ReorderItem[]): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/categories/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  })
}

// ========== 元数据 API ==========

export async function fetchMetadata(url: string): Promise<MetadataResponse> {
  return request<MetadataResponse>('/api/metadata', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

// 兼容旧导入名称
export const metadataApi = {
  parse: fetchMetadata,
}

// ========== 管理员 API ==========

export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
  const data = await request<LoginResponse>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  
  // 保存登录状态
  if (data.success && data.token) {
    localStorage.setItem('admin_authenticated', 'true')
    localStorage.setItem('admin_login_time', Date.now().toString())
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_username', data.user.username)
    // 保存是否需要修改密码的状态
    if (data.requirePasswordChange) {
      localStorage.setItem('admin_require_password_change', 'true')
    } else {
      localStorage.removeItem('admin_require_password_change')
    }
  }
  
  return data
}

export async function adminChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
    requireAuth: true,
  })
}

// 验证 Token 有效性
export async function adminVerify(): Promise<VerifyResponse> {
  return request<VerifyResponse>('/api/admin/verify', {
    requireAuth: true,
  })
}

// 退出登录
export async function adminLogout(): Promise<void> {
  try {
    await request<SuccessResponse>('/api/admin/logout', {
      method: 'POST',
      requireAuth: true,
    })
  } finally {
    clearAuthStatus()
  }
}

// 认证状态响应类型
export interface AuthStatus {
  isValid: boolean
  username: string | null
  requirePasswordChange?: boolean
}

// 验证登录状态
export function checkAuthStatus(): AuthStatus {
  const authenticated = localStorage.getItem('admin_authenticated')
  const loginTime = localStorage.getItem('admin_login_time')
  const username = localStorage.getItem('admin_username')
  const requirePasswordChange = localStorage.getItem('admin_require_password_change') === 'true'
  
  if (authenticated === 'true' && loginTime) {
    // 登录有效期 24 小时
    const isValid = Date.now() - parseInt(loginTime) < 24 * 60 * 60 * 1000
    if (isValid) {
      return { isValid: true, username, requirePasswordChange }
    }
  }
  
  // 已过期，清除登录状态
  clearAuthStatus()
  return { isValid: false, username: null }
}

// 清除登录状态
export function clearAuthStatus(): void {
  localStorage.removeItem('admin_authenticated')
  localStorage.removeItem('admin_login_time')
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_username')
  localStorage.removeItem('admin_require_password_change')
}

// 清除密码变更标志
export function clearPasswordChangeFlag(): void {
  localStorage.removeItem('admin_require_password_change')
}

// ========== 站点设置 API ==========

// 仪表显示配置
export interface WidgetVisibility {
  systemMonitor?: boolean      // 系统监控仪表
  hardwareIdentity?: boolean   // 硬件信息卡片
  vitalSigns?: boolean         // 生命体征卡片
  networkTelemetry?: boolean   // 网络遥测卡片
  processMatrix?: boolean      // 进程矩阵卡片
  dockMiniMonitor?: boolean    // Dock 迷你监控
  mobileTicker?: boolean       // 移动端状态栏
}

// 菜单项可见性配置
export interface MenuVisibility {
  languageToggle?: boolean  // 多语言切换开关
  themeToggle?: boolean     // 日间/夜间模式切换开关
}

export interface SiteSettings {
  siteTitle?: string
  siteFavicon?: string
  enableBeamAnimation?: boolean
  enableLiteMode?: boolean // 精简模式开关 - 禅 (Zen)
  enableWeather?: boolean  // 天气显示开关
  enableLunar?: boolean    // 农历显示开关
  widgetVisibility?: WidgetVisibility
  menuVisibility?: MenuVisibility  // 菜单项可见性配置
}

// 转换设置值类型（后端存储为字符串）
function parseSettings(raw: Record<string, string>): SiteSettings {
  // 解析 widgetVisibility JSON
  let widgetVisibility: WidgetVisibility = {
    systemMonitor: false,
    hardwareIdentity: false,
    vitalSigns: false,
    networkTelemetry: false,
    processMatrix: false,
    dockMiniMonitor: false,
    mobileTicker: false,
  }
  
  if (raw.widgetVisibility) {
    try {
      const parsed = JSON.parse(raw.widgetVisibility)
      widgetVisibility = { ...widgetVisibility, ...parsed }
    } catch (e) {
      // 忽略解析错误，使用默认值
    }
  }

  // 解析 menuVisibility JSON
  let menuVisibility: MenuVisibility = {
    languageToggle: true,
    themeToggle: true,
  }
  
  if (raw.menuVisibility) {
    try {
      const parsed = JSON.parse(raw.menuVisibility)
      menuVisibility = { ...menuVisibility, ...parsed }
    } catch (e) {
      // 忽略解析错误，使用默认值
    }
  }

  return {
    siteTitle: raw.siteTitle,
    siteFavicon: raw.siteFavicon,
    // 默认开启光束，默认关闭精简模式
    enableBeamAnimation: raw.enableBeamAnimation === undefined ? true : raw.enableBeamAnimation === 'true' || raw.enableBeamAnimation === '1',
    enableLiteMode: raw.enableLiteMode === 'true' || raw.enableLiteMode === '1',
    // 默认开启天气和农历
    enableWeather: raw.enableWeather === undefined ? true : raw.enableWeather === 'true' || raw.enableWeather === '1',
    enableLunar: raw.enableLunar === undefined ? true : raw.enableLunar === 'true' || raw.enableLunar === '1',
    widgetVisibility,
    menuVisibility,
  }
}

export async function fetchSettings(): Promise<SiteSettings> {
  const raw = await request<Record<string, string>>('/api/settings')
  return parseSettings(raw)
}

export async function updateSettings(settings: SiteSettings): Promise<SiteSettings> {
  // 转换布尔值为字符串发送
  const payload: Record<string, string | undefined> = {
    siteTitle: settings.siteTitle,
    siteFavicon: settings.siteFavicon,
    enableBeamAnimation: settings.enableBeamAnimation ? 'true' : 'false',
    enableLiteMode: settings.enableLiteMode ? 'true' : 'false',
    enableWeather: settings.enableWeather ? 'true' : 'false',
    enableLunar: settings.enableLunar ? 'true' : 'false',
    widgetVisibility: settings.widgetVisibility ? JSON.stringify(settings.widgetVisibility) : undefined,
    menuVisibility: settings.menuVisibility ? JSON.stringify(settings.menuVisibility) : undefined,
  }
  const raw = await request<Record<string, string>>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
    requireAuth: true,
  })
  return parseSettings(raw)
}

// ========== API 导出对象 (便于统一使用) ==========

export const bookmarkApi = {
  list: fetchBookmarks,
  listPaginated: fetchBookmarksPaginated,
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
  reorder: reorderCategories,
}

export const adminApi = {
  login: adminLogin,
  changePassword: adminChangePassword,
  verify: adminVerify,
  logout: adminLogout,
  checkStatus: checkAuthStatus,
  clearStatus: clearAuthStatus,
  clearPasswordChangeFlag,
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
    bookmarks: Bookmark[]
    categories: Category[]
    settings: SiteSettings
  }
}

export async function exportData(): Promise<ExportData> {
  return request<ExportData>('/api/export', {
    requireAuth: true,
  })
}

export async function importData(data: ExportData['data']): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/import', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export async function factoryReset(): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/factory-reset', {
    method: 'POST',
    requireAuth: true,
  })
}

export const dataApi = {
  export: exportData,
  import: importData,
  factoryReset,
}

// ========== 名言 API ==========

export interface QuotesData {
  quotes: string[]
  useDefaultQuotes: boolean
}

export interface QuotesUpdateResponse {
  success: boolean
  count: number
}

export async function fetchQuotes(): Promise<QuotesData> {
  return request<QuotesData>('/api/quotes')
}

export async function updateQuotes(quotes: string[], useDefaultQuotes?: boolean): Promise<QuotesUpdateResponse> {
  return request<QuotesUpdateResponse>('/api/quotes', {
    method: 'PUT',
    body: JSON.stringify({ quotes, useDefaultQuotes }),
    requireAuth: true,
  })
}

export const quotesApi = {
  list: fetchQuotes,
  update: updateQuotes,
}

// ========== 访问统计 API ==========

export interface VisitStats {
  totalVisits: number
  todayVisits: number
  weekVisits: number
  monthVisits: number
  totalBookmarks: number
  visitedBookmarks: number
}

export interface TopBookmark {
  id: string
  url: string
  title: string
  description?: string
  favicon?: string
  icon?: string
  iconUrl?: string
  category?: string
  visitCount: number
}

export interface VisitTrend {
  date: string
  count: number
}

export interface RecentVisit {
  id: string
  visitedAt: string
  ip?: string
  userAgent?: string
  bookmark: {
    id: string
    url: string
    title: string
    favicon?: string
    icon?: string
    iconUrl?: string
  }
}

export interface BookmarkVisitStats {
  bookmarkId: string
  visitCount: number
  lastVisited: string | null
  trend: number[]
}

// 获取总体统计概览
export async function fetchVisitStats(): Promise<VisitStats> {
  return request<VisitStats>('/api/visits/stats', { requireAuth: true })
}

// 获取热门书签排行
export async function fetchTopBookmarks(
  limit: number = 10,
  period: 'day' | 'week' | 'month' | 'year' | 'all' = 'all'
): Promise<TopBookmark[]> {
  return request<TopBookmark[]>(`/api/visits/top?limit=${limit}&period=${period}`, { requireAuth: true })
}

// 获取访问趋势
export async function fetchVisitTrend(days: number = 7): Promise<VisitTrend[]> {
  return request<VisitTrend[]>(`/api/visits/trend?days=${days}`, { requireAuth: true })
}

// 获取最近访问记录
export async function fetchRecentVisits(limit: number = 20): Promise<RecentVisit[]> {
  return request<RecentVisit[]>(`/api/visits/recent?limit=${limit}`, { requireAuth: true })
}

// 获取单个书签的统计
export async function fetchBookmarkStats(bookmarkId: string): Promise<BookmarkVisitStats> {
  return request<BookmarkVisitStats>(`/api/visits/stats/${bookmarkId}`, { requireAuth: true })
}

// 记录访问（公开接口）
export async function trackVisit(bookmarkId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/api/visits/track', {
    method: 'POST',
    body: JSON.stringify({ bookmarkId }),
  })
}

// 清除所有访问记录
export async function clearVisits(): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/api/visits/clear', {
    method: 'DELETE',
    requireAuth: true,
  })
}

export const visitsApi = {
  stats: fetchVisitStats,
  top: fetchTopBookmarks,
  trend: fetchVisitTrend,
  recent: fetchRecentVisits,
  bookmarkStats: fetchBookmarkStats,
  track: trackVisit,
  clear: clearVisits,
}

// ========== 健康检查 API ==========

export interface HealthCheckResult {
  bookmarkId: string
  url: string
  title: string
  favicon?: string
  icon?: string
  iconUrl?: string
  category?: string
  status: 'ok' | 'error' | 'timeout' | 'redirect'
  statusCode?: number
  responseTime: number
  error?: string
  redirectUrl?: string
}

export interface HealthCheckSummary {
  total: number
  ok: number
  error: number
  timeout: number
  redirect: number
  averageResponseTime: number
}

export interface HealthCheckResponse {
  results: HealthCheckResult[]
  summary: HealthCheckSummary
}

export async function checkBookmarksHealth(bookmarkIds?: string[]): Promise<HealthCheckResponse> {
  return request<HealthCheckResponse>('/api/health-check', {
    method: 'POST',
    body: JSON.stringify({ bookmarkIds }),
    requireAuth: true,
    timeout: 300000, // 5 分钟超时（批量检查耗时）
  })
}

export const healthCheckApi = {
  check: checkBookmarksHealth,
}

// 重新导出类型供外部使用
export type { Bookmark, Category } from '../types/bookmark'
