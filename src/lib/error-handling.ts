/**
 * 全局错误处理模块
 * 提供统一的错误类型、错误处理和错误提示
 */

// ========== 自定义错误类型 ==========

/**
 * API 错误 - 用于网络请求失败
 */
export class ApiError extends Error {
  public statusCode: number
  public details?: Array<{ field: string; message: string }>

  constructor(
    message: string,
    statusCode: number = 500,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }

  /**
   * 是否是网络错误
   */
  get isNetworkError(): boolean {
    return this.statusCode === 0
  }

  /**
   * 是否是认证错误
   */
  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403
  }

  /**
   * 是否是验证错误
   */
  get isValidationError(): boolean {
    return this.statusCode === 400 && !!this.details
  }

  /**
   * 是否是限流错误
   */
  get isRateLimitError(): boolean {
    return this.statusCode === 429
  }

  /**
   * 是否是服务器错误
   */
  get isServerError(): boolean {
    return this.statusCode >= 500
  }
}

/**
 * 验证错误 - 用于表单验证
 */
export class ValidationError extends Error {
  public field: string

  constructor(message: string, field: string) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

/**
 * 网络错误 - 用于网络连接问题
 */
export class NetworkError extends Error {
  constructor(message: string = '网络连接失败，请检查网络设置') {
    super(message)
    this.name = 'NetworkError'
  }
}

// ========== 错误处理函数 ==========

/**
 * 解析 API 响应错误
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let message = '请求失败'
  let details: Array<{ field: string; message: string }> | undefined

  try {
    const data = await response.json()
    message = data.error || data.message || message
    details = data.details
  } catch {
    // 如果无法解析 JSON，使用默认消息
    message = getHttpErrorMessage(response.status)
  }

  return new ApiError(message, response.status, details)
}

/**
 * 根据 HTTP 状态码获取错误消息
 */
export function getHttpErrorMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: '请求参数错误',
    401: '登录已过期，请重新登录',
    403: '没有权限执行此操作',
    404: '请求的资源不存在',
    408: '请求超时',
    429: '请求过于频繁，请稍后再试',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂时不可用',
    504: '网关超时',
  }
  return messages[statusCode] || `请求失败 (${statusCode})`
}

/**
 * 处理错误并返回用户友好的消息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return '网络连接失败，请检查网络设置'
    }
    if (error.isRateLimitError) {
      return '请求过于频繁，请稍后再试'
    }
    return error.message
  }

  if (error instanceof NetworkError) {
    return error.message
  }

  if (error instanceof ValidationError) {
    return error.message
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return '网络连接失败，请检查网络设置'
  }

  if (error instanceof Error) {
    return error.message
  }

  return '发生未知错误'
}

/**
 * 判断是否应该重试请求
 */
export function shouldRetry(error: unknown): boolean {
  if (error instanceof ApiError) {
    // 网络错误、服务器错误、网关错误可以重试
    return error.isNetworkError || error.statusCode >= 500
  }

  if (error instanceof NetworkError) {
    return true
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }

  return false
}

// ========== 全局错误监听 ==========

/**
 * 设置全局错误监听器
 */
export function setupGlobalErrorHandlers() {
  // 捕获未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason)
    
    // 可以在这里添加错误上报逻辑
    // reportError(event.reason)
    
    // 阻止默认行为（控制台显示错误）
    // event.preventDefault()
  })

  // 捕获全局 JavaScript 错误
  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error || event.message)
    
    // 可以在这里添加错误上报逻辑
    // reportError(event.error)
  })
}

// ========== 重试机制 ==========

interface RetryOptions {
  maxRetries?: number
  delay?: number
  backoff?: boolean
  shouldRetry?: (error: unknown) => boolean
}

/**
 * 带重试机制的异步函数执行器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    shouldRetry: customShouldRetry = shouldRetry,
  } = options

  let lastError: unknown
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !customShouldRetry(error)) {
        throw error
      }
      
      // 计算延迟时间（指数退避）
      const waitTime = backoff ? delay * Math.pow(2, attempt) : delay
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw lastError
}

// ========== Toast 通知类型 ==========

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  type: ToastType
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Toast 回调（由 UI 组件注册）
let toastCallback: ((options: ToastOptions) => void) | null = null

/**
 * 注册 Toast 显示函数
 */
export function registerToastHandler(handler: (options: ToastOptions) => void) {
  toastCallback = handler
}

/**
 * 显示 Toast 通知
 */
export function showToast(options: ToastOptions) {
  if (toastCallback) {
    toastCallback(options)
  } else {
    // 如果没有注册 Toast 处理器，使用 console
    console.log(`[${options.type.toUpperCase()}] ${options.message}`)
  }
}

/**
 * 显示错误 Toast
 */
export function showErrorToast(error: unknown, fallbackMessage?: string) {
  const message = getErrorMessage(error) || fallbackMessage || '操作失败'
  showToast({ type: 'error', message })
}

/**
 * 显示成功 Toast
 */
export function showSuccessToast(message: string) {
  showToast({ type: 'success', message })
}
