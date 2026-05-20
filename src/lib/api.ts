// API 基础地址 - 前端与后端同源，通过 nginx 反向代理转发 /api/ 请求
const API_BASE = ''

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
  visibility?: 'public' | 'private'
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
  visibility?: 'public' | 'private'
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
      // 401 未授权 - 仅在需要认证的请求中清除登录状态
      // 公开接口的 401 不应影响已有的登录态
      if (res.status === 401 && requireAuth) {
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
    
    // 🔑 认证请求成功 → 刷新前端登录时间（与后端续期机制同步）
    if (requireAuth && localStorage.getItem('admin_token')) {
      localStorage.setItem('admin_login_time', Date.now().toString())
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
  // 自动携带 Token（如果已登录），以支持私人模式下获取书签
  const token = getToken()
  return request<Bookmark[]>('/api/bookmarks', {
    ...(token ? { requireAuth: true } : {}),
  })
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
  
  // 自动携带 Token（如果已登录），以支持私人模式下获取书签
  const token = getToken()
  return request<PaginatedResponse<Bookmark>>(endpoint, {
    ...(token ? { requireAuth: true } : {}),
  })
}

export async function createBookmark(data: CreateBookmarkParams): Promise<Bookmark> {
  return request<Bookmark>('/api/bookmarks', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export async function updateBookmark(id: string, data: UpdateBookmarkParams): Promise<Bookmark> {
  return request<Bookmark>(`/api/bookmarks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export async function deleteBookmark(id: string): Promise<void> {
  return request<void>(`/api/bookmarks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

export async function reorderBookmarks(items: ReorderItem[]): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/bookmarks/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
    requireAuth: true,
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
    requireAuth: true,
  })
}

// 删除标签
export async function deleteTag(name: string): Promise<{ success: boolean; updatedCount: number }> {
  return request(`/api/bookmarks/tags/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

// ========== 分类 API ==========

export async function fetchCategories(): Promise<Category[]> {
  // 自动携带 Token（如果已登录），以支持私人模式下获取分类
  const token = getToken()
  return request<Category[]>('/api/categories', {
    ...(token ? { requireAuth: true } : {}),
  })
}

export async function createCategory(data: CreateCategoryParams): Promise<Category> {
  return request<Category>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export async function updateCategory(id: string, data: UpdateCategoryParams): Promise<Category> {
  return request<Category>(`/api/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

export async function deleteCategory(id: string): Promise<void> {
  return request<void>(`/api/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

export async function reorderCategories(items: ReorderItem[]): Promise<SuccessResponse> {
  return request<SuccessResponse>('/api/categories/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
    requireAuth: true,
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
  timeout: number  // 超时时间（秒）
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
    requireAuth: true,
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
  timeout?: number
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
    requireAuth: true,
  })
}

export interface AiBatchTagsStatus {
  running: boolean
  total: number
  completed: number
  failed: number
  current: string
}

export async function aiBatchTags(ids: string[]): Promise<{ success: boolean; processing: number }> {
  return request<{ success: boolean; processing: number }>('/api/ai/batch-tags', {
    method: 'POST',
    body: JSON.stringify({ ids }),
    requireAuth: true,
  })
}

export async function getAiBatchTagsStatus(): Promise<AiBatchTagsStatus> {
  return request<AiBatchTagsStatus>('/api/ai/batch-tags-status', { requireAuth: true })
}

// AI 批量智能分类
export interface AiBatchClassifyStatus {
  running: boolean
  total: number
  completed: number
  failed: number
  current: string
  newCategories: string[]
}

export async function aiBatchClassify(ids: string[]): Promise<{ success: boolean; processing: number }> {
  return request<{ success: boolean; processing: number }>('/api/ai/batch-classify', {
    method: 'POST',
    body: JSON.stringify({ ids }),
    requireAuth: true,
  })
}

export async function getAiBatchClassifyStatus(): Promise<AiBatchClassifyStatus> {
  return request<AiBatchClassifyStatus>('/api/ai/batch-classify-status', { requireAuth: true })
}

// AI 批量智能元数据优化
export interface AiBatchEnrichStatus {
  running: boolean
  total: number
  completed: number
  failed: number
  current: string
}

export async function aiBatchEnrich(ids: string[], lang?: string): Promise<{ success: boolean; processing: number }> {
  return request<{ success: boolean; processing: number }>('/api/ai/batch-enrich', {
    method: 'POST',
    body: JSON.stringify({ ids, lang }),
    requireAuth: true,
  })
}

export async function getAiBatchEnrichStatus(): Promise<AiBatchEnrichStatus> {
  return request<AiBatchEnrichStatus>('/api/ai/batch-enrich-status', { requireAuth: true })
}

// 统一查询所有批量任务状态（用于页面加载时恢复进度）
export interface AllBatchStatus {
  tags: AiBatchTagsStatus
  classify: AiBatchClassifyStatus
  enrich: AiBatchEnrichStatus
}

export async function getAllBatchStatus(): Promise<AllBatchStatus> {
  return request<AllBatchStatus>('/api/ai/batch-status', { requireAuth: true })
}

// AI 生成名言
export interface AiGenerateQuotesResponse {
  quotes: string[]
  error?: string
}

export async function aiGenerateQuotes(params: {
  count?: number
  lang?: string
  theme?: string
  existingQuotes?: string[]
}): Promise<AiGenerateQuotesResponse> {
  return request<AiGenerateQuotesResponse>('/api/ai/generate-quotes', {
    method: 'POST',
    body: JSON.stringify(params),
    requireAuth: true,
    timeout: 60000,
  })
}

export const aiApi = {
  status: getAiStatus,
  categorize: aiCategorize,
  getConfig: getAiConfig,
  saveConfig: saveAiConfig,
  testConnection: testAiConnection,
  chat: aiChat,
  batchTags: aiBatchTags,
  batchTagsStatus: getAiBatchTagsStatus,
  batchClassify: aiBatchClassify,
  batchClassifyStatus: getAiBatchClassifyStatus,
  batchEnrich: aiBatchEnrich,
  batchEnrichStatus: getAiBatchEnrichStatus,
  generateQuotes: aiGenerateQuotes,
  allBatchStatus: getAllBatchStatus,
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
  const token = localStorage.getItem('admin_token')
  const requirePasswordChange = localStorage.getItem('admin_require_password_change') === 'true'
  
  if (authenticated === 'true' && loginTime && token) {
    // 前端宽松校验：7天内有效（实际以后端 Token 过期为准）
    // 后端会在使用时自动续期，所以只要用户活跃，基本不会过期
    const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7天
    const isValid = Date.now() - parseInt(loginTime) < TOKEN_MAX_AGE
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
  // 每个组件的访问模式：public=所有人可见，private=仅登录用户可见
  systemMonitorAccess?: 'public' | 'private'
  hardwareIdentityAccess?: 'public' | 'private'
  vitalSignsAccess?: 'public' | 'private'
  networkTelemetryAccess?: 'public' | 'private'
  processMatrixAccess?: 'public' | 'private'
  dockMiniMonitorAccess?: 'public' | 'private'
  mobileTickerAccess?: 'public' | 'private'
  aiAssistantAccess?: 'public' | 'private'
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

// 搜索引擎配置
export interface SearchEngineConfig {
  id: string
  name: string
  url: string      // 搜索URL模板，{query} 会被替换为搜索词
  shortcut: string  // 快捷键前缀
  builtin?: boolean // 是否为预置搜索引擎（不可删除）
}

// 搜索引擎设置
export interface SearchEngineSettings {
  defaultEngineId?: string           // 默认搜索引擎 ID
  customEngines?: SearchEngineConfig[] // 用户自定义的搜索引擎列表
}

/** nowen-note 同步配置（前端持有的部分；apiToken 永不返回明文，仅 hasToken+预览） */
export interface NowenNoteSettings {
  /** nowen-note 站点 URL，例如 https://note.example.com */
  baseUrl?: string
  /** Personal API Token（仅在用户填入时随 PATCH 上传；GET 时永远不返回） */
  apiToken?: string
  /** 后端 GET 时返回的 token 预览（如 nkn_xx…ab） */
  apiTokenPreview?: string
  /** 后端 GET 时返回是否已配置 token */
  hasToken?: boolean
  /** Token 名称（一键连接时自动生成，便于在 nowen-note 那边吊销时识别） */
  tokenName?: string
  /** Token 在 nowen-note 那边的 ID，用于断开时远端吊销 */
  tokenId?: string
  /** 默认目标笔记本 ID（不填则自动定位/创建"灵感收件箱"） */
  defaultNotebookId?: string
  /** 同步模式：手动 / 自动单向 / 完全双向 */
  syncMode?: 'manual' | 'auto' | 'bidirectional'
}

export interface SiteSettings {
  siteTitle?: string
  siteFavicon?: string
  enableBeamAnimation?: boolean
  enableLiteMode?: boolean // 精简模式开关 - 禅 (Zen)
  enableWeather?: boolean  // 天气显示开关
  enableLunar?: boolean    // 农历显示开关
  enableAutoAi?: boolean   // AI 自动触发开关（添加书签时自动调用 AI 分类/标签）
  weatherCity?: string     // 手动设置的天气城市名
  disableGeolocation?: boolean  // 强制禁用定位获取
  footerText?: string      // 底部备案信息
  categoryCollapseThreshold?: number  // 分类书签折叠阈值（0=不折叠）
  categoryInitialShowCount?: number   // 折叠时默认显示数量
  widgetVisibility?: WidgetVisibility
  menuVisibility?: MenuVisibility  // 菜单项可见性配置
  wallpaper?: WallpaperSettings    // 壁纸设置
  cardViewMode?: 'compact' | 'standard' | 'comfortable'  // 书签卡片视图模式
  widgetSizeMode?: 'S' | 'M' | 'L'  // 监控 Widget 尺寸预设（S=迷你摘要, M=用户自控, L=全展开）
  enableAiEnrichOnImport?: boolean  // 导入时启用 AI 刮削元数据/标题/图标
  accessMode?: 'public' | 'private'  // 访问模式：public=公开访问，private=私人模式（需登录）
  defaultBookmarkVisibility?: 'public' | 'private'  // 新书签默认可见性
  searchEngine?: SearchEngineSettings  // 搜索引擎设置
  enableQuickNotes?: boolean           // 灵感速记开关
  enableIntranetDownload?: boolean     // 内网下载开关（右键菜单中的内网链接下载）
  enableSidebarNav?: boolean           // 快速定位侧边栏开关
  nowenNote?: NowenNoteSettings        // nowen-note 同步配置
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
    systemMonitorAccess: 'public',
    hardwareIdentityAccess: 'public',
    vitalSignsAccess: 'public',
    networkTelemetryAccess: 'public',
    processMatrixAccess: 'public',
    dockMiniMonitorAccess: 'public',
    mobileTickerAccess: 'public',
    aiAssistantAccess: 'public',
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
    // AI 自动触发：默认开启（保持向后兼容，原有行为不变）
    enableAutoAi: raw.enableAutoAi === undefined ? true : raw.enableAutoAi === 'true' || raw.enableAutoAi === '1',
    weatherCity: raw.weatherCity || '',
    disableGeolocation: raw.disableGeolocation === 'true' || raw.disableGeolocation === '1',
    footerText: raw.footerText || '',
    // 分类折叠：默认 0（不折叠）
    categoryCollapseThreshold: raw.categoryCollapseThreshold ? parseInt(raw.categoryCollapseThreshold, 10) : 0,
    categoryInitialShowCount: raw.categoryInitialShowCount ? parseInt(raw.categoryInitialShowCount, 10) : 8,
    widgetVisibility,
    menuVisibility,
    wallpaper,
    cardViewMode: (raw.cardViewMode as SiteSettings['cardViewMode']) || 'standard',
    widgetSizeMode: (['S', 'M', 'L'].includes(raw.widgetSizeMode) ? raw.widgetSizeMode : 'M') as SiteSettings['widgetSizeMode'],
    enableAiEnrichOnImport: raw.enableAiEnrichOnImport === 'true' || raw.enableAiEnrichOnImport === '1',
    accessMode: (raw.accessMode === 'private' ? 'private' : 'public') as SiteSettings['accessMode'],
    defaultBookmarkVisibility: (raw.defaultBookmarkVisibility === 'private' ? 'private' : 'public') as SiteSettings['defaultBookmarkVisibility'],
    searchEngine: raw.searchEngine ? (() => {
      try {
        return JSON.parse(raw.searchEngine) as SearchEngineSettings
      } catch {
        return { defaultEngineId: 'google', customEngines: [] }
      }
    })() : { defaultEngineId: 'google', customEngines: [] },
    // 灵感速记：默认开启
    enableQuickNotes: raw.enableQuickNotes === undefined ? true : raw.enableQuickNotes === 'true' || raw.enableQuickNotes === '1',
    // 快速定位侧边栏：默认开启
    enableSidebarNav: raw.enableSidebarNav === undefined ? true : raw.enableSidebarNav === 'true' || raw.enableSidebarNav === '1',
    // nowen-note 同步配置（apiToken 永远不会从后端返回，前端用 hasToken 判断已配置）
    nowenNote: raw.nowenNote ? (() => {
      try {
        const parsed = JSON.parse(raw.nowenNote)
        return {
          baseUrl: parsed.baseUrl || '',
          apiTokenPreview: parsed.apiTokenPreview || '',
          hasToken: !!parsed.hasToken,
          defaultNotebookId: parsed.defaultNotebookId || '',
          syncMode: (parsed.syncMode === 'manual' || parsed.syncMode === 'bidirectional')
            ? parsed.syncMode
            : 'auto',
        } as NowenNoteSettings
      } catch {
        return { baseUrl: '', hasToken: false, syncMode: 'auto' } as NowenNoteSettings
      }
    })() : { baseUrl: '', hasToken: false, syncMode: 'auto' } as NowenNoteSettings,
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
    enableAutoAi: settings.enableAutoAi === false ? 'false' : 'true',
    weatherCity: settings.weatherCity ?? '',
    disableGeolocation: settings.disableGeolocation ? 'true' : 'false',
    footerText: settings.footerText ?? '',
    categoryCollapseThreshold: String(settings.categoryCollapseThreshold ?? 0),
    categoryInitialShowCount: String(settings.categoryInitialShowCount ?? 8),
    widgetVisibility: settings.widgetVisibility ? JSON.stringify(settings.widgetVisibility) : undefined,
    menuVisibility: settings.menuVisibility ? JSON.stringify(settings.menuVisibility) : undefined,
    wallpaper: settings.wallpaper ? JSON.stringify(settings.wallpaper) : undefined,
    cardViewMode: settings.cardViewMode || 'standard',
    widgetSizeMode: settings.widgetSizeMode || 'M',
    enableAiEnrichOnImport: settings.enableAiEnrichOnImport ? 'true' : 'false',
    accessMode: settings.accessMode || 'public',
    defaultBookmarkVisibility: settings.defaultBookmarkVisibility || 'public',
    searchEngine: settings.searchEngine ? JSON.stringify(settings.searchEngine) : undefined,
    enableQuickNotes: settings.enableQuickNotes === false ? 'false' : 'true',
    enableSidebarNav: settings.enableSidebarNav === false ? 'false' : 'true',
    // nowen-note：apiToken 仅在用户实际填入时上传；空字符串/undefined 都不上传，避免误清空
    nowenNote: settings.nowenNote ? JSON.stringify({
      baseUrl: settings.nowenNote.baseUrl || '',
      ...(settings.nowenNote.apiToken ? { apiToken: settings.nowenNote.apiToken } : {}),
      defaultNotebookId: settings.nowenNote.defaultNotebookId || '',
      syncMode: settings.nowenNote.syncMode || 'auto',
    }) : undefined,
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

// ========== 灵感速记 API ==========

/** 同步状态：本地 / 同步中 / 已同步 / 冲突 */
export type NoteSyncStatus = 'local' | 'syncing' | 'synced' | 'conflict'

export interface QuickNote {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  /** 标签数组（与 nowen-note 标签系统打通） */
  tags?: string[]
  /** nowen-note 中对应笔记的 ID（已同步则有值） */
  remoteId?: string | null
  /** 目标笔记本 ID，默认进"灵感收件箱" */
  notebookId?: string | null
  /** 同步状态 */
  syncStatus?: NoteSyncStatus
  /** 远端最后一次更新时间（用于冲突检测） */
  remoteUpdatedAt?: string | null
}

export interface CreateNoteInput {
  content: string
  tags?: string[]
  notebookId?: string | null
}

export interface UpdateNoteInput {
  content?: string
  tags?: string[]
  notebookId?: string | null
}

export async function fetchNotes(): Promise<QuickNote[]> {
  return request<QuickNote[]>('/api/notes')
}

export async function createNote(input: string | CreateNoteInput): Promise<QuickNote> {
  const body = typeof input === 'string' ? { content: input } : input
  return request<QuickNote>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(body),
    requireAuth: true,
  })
}

export async function updateNote(id: string, input: string | UpdateNoteInput): Promise<QuickNote> {
  const body = typeof input === 'string' ? { content: input } : input
  return request<QuickNote>(`/api/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    requireAuth: true,
  })
}

export async function deleteNote(id: string): Promise<SuccessResponse> {
  return request<SuccessResponse>(`/api/notes/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/** push 错误结构（冲突时携带远端快照供 UI 比对） */
export interface PushNoteErrorPayload {
  status: number
  note?: QuickNote
  syncStatus?: 'local' | 'syncing' | 'synced' | 'conflict'
  remoteSnapshot?: { title: string; contentText: string; updatedAt: string } | null
}

/** 手动触发：将一条速记推送到 nowen-note，可指定 forceMode 解决冲突 */
export async function pushNoteToRemote(
  id: string,
  forceMode?: 'force-push' | 'force-pull',
): Promise<QuickNote> {
  // 后端返回 409 (conflict) 时，body 里仍带 note；这里把异常拆出来，使前端能拿到最新本地数据
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/notes/${id}/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(forceMode ? { forceMode } : {}),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({} as any))
    const err: any = new Error(data.error || `推送失败 (${res.status})`)
    err.status = res.status
    err.note = data.note
    err.syncStatus = data.syncStatus
    err.remoteSnapshot = data.remoteSnapshot || null
    throw err
  }
  return res.json()
}

/** 同步状态汇总（不需要登录即可查看是否已配置） */
export interface NoteSyncStatusSummary {
  configured: boolean
  syncMode: 'manual' | 'auto' | 'bidirectional'
  baseUrl: string | null
  counts: { synced: number; syncing: number; local: number; conflict: number; total: number }
}
export async function fetchNoteSyncStatus(): Promise<NoteSyncStatusSummary> {
  return request<NoteSyncStatusSummary>('/api/notes/sync-status')
}

/** 拉取一条速记的远端快照（用于冲突对比 UI） */
export interface RemoteNoteSnapshot {
  title: string
  contentText: string
  updatedAt: string
  tags: string[]
}
export async function fetchRemoteSnapshot(id: string): Promise<RemoteNoteSnapshot> {
  return request<RemoteNoteSnapshot>(`/api/notes/${id}/remote`, { requireAuth: true })
}

/** 双向同步：把远端"灵感收件箱"拉回本地 */
export interface PullRemoteResult {
  ok: boolean
  pulled: number
  created: number
  updated: number
  skipped: number
  error?: string
}
export async function pullRemoteNotes(): Promise<PullRemoteResult> {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/notes/sync-pull`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  return res.json().catch(() => ({ ok: false, error: '解析响应失败' } as PullRemoteResult))
}

/** AI 流式动作类型（与 nowen-note ai.ts 中 AIAction 对齐） */
export type AIAction =
  | 'continue'
  | 'rewrite'
  | 'polish'
  | 'shorten'
  | 'expand'
  | 'translate_en'
  | 'translate_zh'
  | 'summarize'
  | 'explain'
  | 'fix_grammar'
  | 'title'
  | 'tags'
  | 'format_markdown'
  | 'format_code'
  | 'custom'

/**
 * 流式 AI 写作助手：返回一个 AsyncGenerator，每次 yield 一个 token 片段。
 * 用法：
 *   for await (const chunk of streamAIChat({ action, text })) updateUI(chunk)
 *
 * 协议来自 nowen-note：data: {"t":"片段"}\n\n  …  data: [DONE]\n\n
 */
export async function* streamAIChat(payload: {
  action: AIAction
  text: string
  customPrompt?: string
  context?: string
}): AsyncGenerator<string, void, void> {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/notes/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).error || `AI 请求失败 (${res.status})`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    // SSE：以 \n\n 分隔事件
    const events = buffer.split('\n\n')
    buffer = events.pop() || ''
    for (const evt of events) {
      // 提取 data: 行
      const dataLine = evt
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.startsWith('data:'))
      if (!dataLine) continue
      const data = dataLine.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        if (json && typeof json.t === 'string') yield json.t as string
      } catch {
        // 忽略解析失败
      }
    }
  }
}

/** 测试 nowen-note 连通性 */
export interface NowenNoteTestResult {
  ok: boolean
  notebooksCount?: number
  error?: string
  status?: number
}
export async function testNowenNoteConnection(
  baseUrl?: string,
  apiToken?: string,
): Promise<NowenNoteTestResult> {
  const body: Record<string, string> = {}
  if (baseUrl) body.baseUrl = baseUrl
  if (apiToken) body.apiToken = apiToken
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/settings/nowen-note/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({} as any))
  // 服务端 502/400 也带 ok:false 字段
  return data as NowenNoteTestResult
}

/** 一键连接 nowen-note 的请求/响应类型 */
export interface NowenNoteSetupParams {
  baseUrl: string
  username: string
  password: string
  /** 自定义 Token 名（不传则后端用时间戳生成） */
  tokenName?: string
}
export interface NowenNoteSetupResult {
  ok: boolean
  /** Token 预览，如 nkn_xx…ab（成功时返回） */
  tokenPreview?: string
  tokenName?: string
  tokenId?: string
  baseUrl?: string
  /** 失败信息（人类可读） */
  error?: string
  /**
   * 失败码，便于前端做 UI 引导：
   *   - REQUIRES_2FA: 提示走"手填 Token"路径
   *   - AUTH_FAILED: 高亮密码框
   *   - ACCOUNT_LOCKED / RATE_LIMITED: 显示重试倒计时
   *   - NETWORK_ERROR / TIMEOUT: 高亮 URL
   */
  code?: string
}
/**
 * 一键连接 nowen-note：用账号密码自动登录并创建永不过期的 API Token。
 * 后端流程：登录 → 创建 Token → 持久化 → 立即丢弃密码（不会落盘）。
 */
export async function setupNowenNoteWithCredentials(
  params: NowenNoteSetupParams,
): Promise<NowenNoteSetupResult> {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/settings/nowen-note/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  })
  const data = await res.json().catch(() => ({} as any))
  // 后端 4xx/5xx 都会带 ok:false + error + code
  return data as NowenNoteSetupResult
}

/** 断开 nowen-note 连接（best-effort 远端吊销 Token，本地一定清空敏感字段） */
export async function disconnectNowenNote(): Promise<{
  ok: boolean
  remoteRevoked?: boolean
  remoteError?: string
  alreadyDisconnected?: boolean
  error?: string
}> {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/settings/nowen-note/disconnect`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const data = await res.json().catch(() => ({} as any))
  return data
}

export const notesApi = {
  list: fetchNotes,
  create: createNote,
  update: updateNote,
  delete: deleteNote,
  push: pushNoteToRemote,
  pullRemote: pullRemoteNotes,
  remoteSnapshot: fetchRemoteSnapshot,
  syncStatus: fetchNoteSyncStatus,
  testRemote: testNowenNoteConnection,
  aiStream: streamAIChat,
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

export async function importData(data: ExportData['data'], enableAiEnrich?: boolean): Promise<ImportResponse> {
  return request<ImportResponse>('/api/import', {
    method: 'POST',
    body: JSON.stringify({ ...data, enableAiEnrich: enableAiEnrich || false }),
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
  showQuotes: boolean
}

export interface QuotesUpdateResponse {
  success: boolean
  count: number
}

export async function fetchQuotes(): Promise<QuotesData> {
  return request<QuotesData>('/api/quotes')
}

export async function updateQuotes(quotes: string[], useDefaultQuotes?: boolean, showQuotes?: boolean): Promise<QuotesUpdateResponse> {
  return request<QuotesUpdateResponse>('/api/quotes', {
    method: 'PUT',
    body: JSON.stringify({ quotes, useDefaultQuotes, showQuotes }),
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

// ========== 云备份 API ==========

export interface BackupConfig {
  url: string
  username: string
  password: string
  path: string
  autoBackup: boolean
  cronExpression: string
  maxBackups: number
}

export interface BackupFile {
  filename: string
  size: number
  lastmod: string
}

export interface BackupStatus {
  enabled: boolean
  cronExpression: string
  running: boolean
  lastBackupTime: string | null
  lastError: string | null
}

export async function getBackupConfig(): Promise<BackupConfig> {
  return request<BackupConfig>('/api/backup/config', { requireAuth: true })
}

export async function saveBackupConfig(config: Partial<BackupConfig>): Promise<{ success: boolean; message: string }> {
  return request('/api/backup/config', {
    method: 'POST',
    body: JSON.stringify(config),
    requireAuth: true,
  })
}

export async function testBackupConnection(config?: Partial<BackupConfig>): Promise<{ success: boolean; message: string }> {
  return request('/api/backup/test', {
    method: 'POST',
    body: JSON.stringify(config || {}),
    requireAuth: true,
  })
}

export async function backupNow(): Promise<{ success: boolean; filename: string; size: number }> {
  return request('/api/backup/now', {
    method: 'POST',
    requireAuth: true,
    timeout: 60000,
  })
}

export async function listBackups(): Promise<{ backups: BackupFile[] }> {
  return request('/api/backup/list', { requireAuth: true })
}

export async function restoreBackup(filename: string): Promise<{ success: boolean; message: string }> {
  return request('/api/backup/restore', {
    method: 'POST',
    body: JSON.stringify({ filename }),
    requireAuth: true,
    timeout: 60000,
  })
}

export async function deleteRemoteBackup(filename: string): Promise<{ success: boolean; message: string }> {
  return request(`/api/backup/file/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

export async function getBackupStatus(): Promise<BackupStatus> {
  return request<BackupStatus>('/api/backup/status', { requireAuth: true })
}

export function downloadLocalBackup(): void {
  const token = localStorage.getItem('admin_token')
  const url = `${API_BASE}/api/backup/local/download`
  const a = document.createElement('a')
  fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob)
      a.href = blobUrl
      a.download = `nowen-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      a.click()
      URL.revokeObjectURL(blobUrl)
    })
}

export function downloadDatabaseFile(): void {
  const token = localStorage.getItem('admin_token')
  const url = `${API_BASE}/api/backup/local/download-db`
  fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then(res => {
      if (!res.ok) throw new Error('下载失败')
      return res.blob()
    })
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `zen-garden-${new Date().toISOString().replace(/[:.]/g, '-')}.db`
      a.click()
      URL.revokeObjectURL(blobUrl)
    })
}

export async function uploadDatabaseFile(file: File): Promise<{ success: boolean; message: string; size: number }> {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(`${API_BASE}/api/backup/local/upload-db`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: file,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '上传失败')
  return data
}

export const backupApi = {
  getConfig: getBackupConfig,
  saveConfig: saveBackupConfig,
  testConnection: testBackupConnection,
  backupNow,
  list: listBackups,
  restore: restoreBackup,
  deleteFile: deleteRemoteBackup,
  status: getBackupStatus,
  downloadLocal: downloadLocalBackup,
  downloadDb: downloadDatabaseFile,
  uploadDb: uploadDatabaseFile,
} as const

export const healthCheckApi = {
  check: checkBookmarksHealth,
}

// ========== 日志 API ==========

export interface LogEntry {
  id: string
  level: 'info' | 'warn' | 'error'
  type: 'operation' | 'api_error' | 'system'
  message: string
  detail?: string
  method?: string
  path?: string
  statusCode?: number
  ip?: string
  userAgent?: string
  username?: string
  createdAt: string
}

export interface LogsResponse {
  logs: LogEntry[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  stats: {
    info: number
    warn: number
    error: number
  }
}

export async function fetchLogs(params: {
  page?: number
  pageSize?: number
  level?: string
  type?: string
  search?: string
} = {}): Promise<LogsResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.level) searchParams.set('level', params.level)
  if (params.type) searchParams.set('type', params.type)
  if (params.search) searchParams.set('search', params.search)
  const qs = searchParams.toString()
  return request<LogsResponse>(`/api/logs${qs ? `?${qs}` : ''}`, { requireAuth: true })
}

export async function clearLogs(before?: string): Promise<{ success: boolean; message: string }> {
  const qs = before ? `?before=${encodeURIComponent(before)}` : ''
  return request<{ success: boolean; message: string }>(`/api/logs${qs}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

export const logsApi = {
  list: fetchLogs,
  clear: clearLogs,
}

// 重新导出类型供外部使用
export type { Bookmark, Category } from '../types/bookmark'
