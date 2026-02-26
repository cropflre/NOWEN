// API 基础地址 - 使用环境变量验证
import { getApiBase } from './env'
const API_BASE = getApiBase()

import type { Bookmark, Category } from '../types/bookmark'
import { ApiError, NetworkError, getHttpErrorMessage } from './error-handling'

// ========== API 类型定义 ==========

// 创建书签请求参数
export interface CreateBookmarkParams {
  url: string
  internalUrl?: string
  title: string
  description?: string
  favicon?: string
  ogImage?: string
  icon?: string
  iconUrl?: string
  category?: string
  tags?: string[]
  isReadLater?: boolean
}

// 更新书签请求参数
export interface UpdateBookmarkParams {
  url?: string
  internalUrl?: string
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
  tag?: string
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
  if (params.tag) searchParams.set('tag', params.tag)
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
  return request<Bookmark>(`/api/bookmarks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteBookmark(id: string): Promise<void> {
  return request<void>(`/api/bookmarks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function reorderBookmarks(items: ReorderItem[]): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/bookmarks/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  })
}

// 获取所有已使用的标签
export async function fetchTags(): Promise<string[]> {
  return request<string[]>('/api/bookmarks/tags')
}

// 标签统计信息
export interface TagStat {
  name: string
  count: number
}

// 获取标签列表（带使用计数）
export async function fetchTagStats(): Promise<TagStat[]> {
  return request<TagStat[]>('/api/bookmarks/tags/stats')
}

// 重命名/合并标签
export async function renameTag(oldName: string, newName: string): Promise<{ success: boolean; updatedCount: number }> {
  return request('/api/bookmarks/tags/rename', {
    method: 'PATCH',
    body: JSON.stringify({ oldName, newName }),
  })
}

// 删除标签
export async function deleteTag(name: string): Promise<{ success: boolean; updatedCount: number }> {
  return request(`/api/bookmarks/tags/${encodeURIComponent(name)}`, {
    method: 'DELETE',
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
  return request<Category>(`/api/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteCategory(id: string): Promise<void> {
  return request<void>(`/api/categories/${encodeURIComponent(id)}`, {
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

export async function fetchMetadata(url: string, lang?: string): Promise<MetadataResponse> {
  return request<MetadataResponse>('/api/metadata', {
    method: 'POST',
    body: JSON.stringify({ url, lang }),
  })
}

// 兼容旧导入名称
export const metadataApi = {
  parse: fetchMetadata,
} as const

// ========== AI API ==========

export interface AiStatusResponse {
  configured: boolean
  provider: string | null
  model: string | null
  apiBase: string | null
  hasApiKey: boolean
}

export interface AiCategorizeResponse {
  category: string
  isNewCategory: boolean
  categoryId: string | null
  tags: string[]
  summary: string
  confidence: number
  error?: string
}

export interface AiConfigResponse {
  provider: string
  apiKey: string
  apiBase: string
  model: string
}

export interface AiChatResponse {
  reply: string
  bookmarks?: Array<{
    id: string
    title: string
    url: string
    description?: string
    categoryName?: string
  }>
  error?: string
}

export interface AiTestResponse {
  success: boolean
  message: string
  model?: string
}

export async function getAiStatus(): Promise<AiStatusResponse> {
  return request<AiStatusResponse>('/api/ai/status')
}

export async function aiCategorize(params: {
  url: string
  title: string
  description?: string
  lang?: string
}): Promise<AiCategorizeResponse> {
  return request<AiCategorizeResponse>('/api/ai/categorize', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function getAiConfig(): Promise<AiConfigResponse> {
  return request<AiConfigResponse>('/api/ai/config', { requireAuth: true })
}

export async function saveAiConfig(config: {
  provider: string
  apiKey?: string
  apiBase?: string
  model?: string
}): Promise<{ success: boolean }> {
  return request('/api/ai/config', {
    method: 'PUT',
    body: JSON.stringify(config),
    requireAuth: true,
  })
}

export async function testAiConnection(): Promise<AiTestResponse> {
  return request<AiTestResponse>('/api/ai/test', {
    method: 'POST',
    requireAuth: true,
  })
}

export async function aiChat(params: {
  message: string
  lang?: string
}): Promise<AiChatResponse> {
  return request<AiChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export const aiApi = {
  status: getAiStatus,
  categorize: aiCategorize,
  getConfig: getAiConfig,
  saveConfig: saveAiConfig,
  testConnection: testAiConnection,
  chat: aiChat,
} as const

// ========== 演示模式判断 ==========

/** 判断当前是否为演示模式（通过 118.145.185.221 访问） */
export function isDemoMode(): boolean {
  return window.location.hostname === '118.145.185.221'
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
    // 保存是否需要修改密码的状态（演示模式下跳过强制改密）
    if (data.requirePasswordChange && !isDemoMode()) {
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

export async function adminChangeUsername(
  newUsername: string,
  password: string
): Promise<SuccessResponse & { username?: string }> {
  const data = await request<SuccessResponse & { username?: string }>('/api/admin/change-username', {
    method: 'POST',
    body: JSON.stringify({ newUsername, password }),
    requireAuth: true,
  })
  
  // 更新 localStorage 中的用户名
  if (data.success && data.username) {
    localStorage.setItem('admin_username', data.username)
  }
  
  return data
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
  aiAssistant?: boolean        // AI 助手
}

// 菜单项可见性配置
export interface MenuVisibility {
  languageToggle?: boolean  // 多语言切换开关
  themeToggle?: boolean     // 日间/夜间模式切换开关
}

// 壁纸设置
export interface WallpaperSettings {
  enabled?: boolean         // 是否启用壁纸
  source?: 'upload' | 'url' | 'unsplash' | 'picsum' | 'pexels'  // 壁纸来源
  imageData?: string        // 上传的图片 data URL
  imageUrl?: string         // 外部图片 URL
  blur?: number             // 模糊度 0-20
  overlay?: number          // 遮罩透明度 0-100
}

export interface SiteSettings {
  siteTitle?: string
  siteFavicon?: string
  enableBeamAnimation?: boolean
  enableLiteMode?: boolean // 精简模式开关 - 禅 (Zen)
  enableWeather?: boolean  // 天气显示开关
  enableLunar?: boolean    // 农历显示开关
  weatherCity?: string     // 手动设置的天气城市名
  footerText?: string      // 底部备案信息
  categoryCollapseThreshold?: number  // 分类书签折叠阈值（0=不折叠）
  categoryInitialShowCount?: number   // 折叠时默认显示数量
  widgetVisibility?: WidgetVisibility
  menuVisibility?: MenuVisibility  // 菜单项可见性配置
  wallpaper?: WallpaperSettings    // 壁纸设置
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

  // 解析 wallpaper JSON
  let wallpaper: WallpaperSettings = {
    enabled: false,
    source: 'upload',
    imageData: '',
    imageUrl: '',
    blur: 0,
    overlay: 30,
  }
  
  if (raw.wallpaper) {
    try {
      const parsed = JSON.parse(raw.wallpaper)
      wallpaper = { ...wallpaper, ...parsed }
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
    weatherCity: raw.weatherCity || '',
    footerText: raw.footerText || '',
    // 分类折叠：默认 0（不折叠）
    categoryCollapseThreshold: raw.categoryCollapseThreshold ? parseInt(raw.categoryCollapseThreshold, 10) : 0,
    categoryInitialShowCount: raw.categoryInitialShowCount ? parseInt(raw.categoryInitialShowCount, 10) : 8,
    widgetVisibility,
    menuVisibility,
    wallpaper,
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
    weatherCity: settings.weatherCity ?? '',
    footerText: settings.footerText ?? '',
    categoryCollapseThreshold: String(settings.categoryCollapseThreshold ?? 0),
    categoryInitialShowCount: String(settings.categoryInitialShowCount ?? 8),
    widgetVisibility: settings.widgetVisibility ? JSON.stringify(settings.widgetVisibility) : undefined,
    menuVisibility: settings.menuVisibility ? JSON.stringify(settings.menuVisibility) : undefined,
    wallpaper: settings.wallpaper ? JSON.stringify(settings.wallpaper) : undefined,
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
  tags: fetchTags,
  tagStats: fetchTagStats,
  renameTag,
  deleteTag,
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

export interface ImportResponse extends SuccessResponse {
  enriching?: number
}

export interface EnrichStatus {
  running: boolean
  total: number
  completed: number
  failed: number
  current: string
}

export async function importData(data: ExportData['data']): Promise<ImportResponse> {
  return request<ImportResponse>('/api/import', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export async function getEnrichStatus(): Promise<EnrichStatus> {
  return request<EnrichStatus>('/api/import/enrich-status', {
    requireAuth: true,
  })
}

export type EnrichMode = 'icon' | 'metadata' | 'all'

export async function enrichBatch(ids: string[], mode: EnrichMode = 'icon'): Promise<ImportResponse> {
  return request<ImportResponse>('/api/import/enrich-batch', {
    method: 'POST',
    body: JSON.stringify({ ids, mode }),
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
  getEnrichStatus,
  enrichBatch,
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
  internalUrl?: string
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
    internalUrl?: string
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

export interface HealthCheckProgress {
  current: number
  total: number
}

export async function checkBookmarksHealth(
  bookmarkIds?: string[],
  onProgress?: (progress: HealthCheckProgress) => void
): Promise<HealthCheckResponse> {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(`${API_BASE}/api/health-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ bookmarkIds }),
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('admin_authenticated')
      localStorage.removeItem('admin_login_time')
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_username')
      localStorage.removeItem('admin_require_password_change')
    }
    throw new ApiError(res.status, getHttpErrorMessage(res.status))
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('ReadableStream not supported')

  const decoder = new TextDecoder()
  let buffer = ''
  let finalResult: HealthCheckResponse | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const data = JSON.parse(line.slice(6))
        if (data.type === 'start') {
          onProgress?.({ current: 0, total: data.total })
        } else if (data.type === 'progress') {
          onProgress?.({ current: data.current, total: data.total })
        } else if (data.type === 'done') {
          finalResult = { results: data.results, summary: data.summary }
        } else if (data.type === 'error') {
          throw new Error(data.error)
        }
      } catch (e) {
        if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e
      }
    }
  }

  if (!finalResult) throw new Error('Health check returned no results')
  return finalResult
}

export const healthCheckApi = {
  check: checkBookmarksHealth,
}

// 重新导出类型供外部使用
export type { Bookmark, Category } from '../types/bookmark'
