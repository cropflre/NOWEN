import {
  ApiError,
  ValidationError,
  NetworkError,
  getHttpErrorMessage,
  getErrorMessage,
  shouldRetry,
  withRetry,
} from '../lib/error-handling'

describe('ApiError', () => {
  it('应该正确创建 ApiError', () => {
    const error = new ApiError('测试错误', 400)
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('测试错误')
    expect(error.statusCode).toBe(400)
  })

  it('应该正确判断网络错误', () => {
    const networkError = new ApiError('网络错误', 0)
    const normalError = new ApiError('普通错误', 400)
    
    expect(networkError.isNetworkError).toBe(true)
    expect(normalError.isNetworkError).toBe(false)
  })

  it('应该正确判断认证错误', () => {
    const authError401 = new ApiError('未授权', 401)
    const authError403 = new ApiError('禁止访问', 403)
    const normalError = new ApiError('普通错误', 400)
    
    expect(authError401.isAuthError).toBe(true)
    expect(authError403.isAuthError).toBe(true)
    expect(normalError.isAuthError).toBe(false)
  })

  it('应该正确判断验证错误', () => {
    const validationError = new ApiError('验证失败', 400, [
      { field: 'email', message: '邮箱格式错误' }
    ])
    const normalError = new ApiError('普通错误', 400)
    
    expect(validationError.isValidationError).toBe(true)
    expect(normalError.isValidationError).toBe(false)
  })

  it('应该正确判断限流错误', () => {
    const rateLimitError = new ApiError('请求过多', 429)
    const normalError = new ApiError('普通错误', 400)
    
    expect(rateLimitError.isRateLimitError).toBe(true)
    expect(normalError.isRateLimitError).toBe(false)
  })

  it('应该正确判断服务器错误', () => {
    const serverError500 = new ApiError('内部错误', 500)
    const serverError502 = new ApiError('网关错误', 502)
    const clientError = new ApiError('客户端错误', 400)
    
    expect(serverError500.isServerError).toBe(true)
    expect(serverError502.isServerError).toBe(true)
    expect(clientError.isServerError).toBe(false)
  })
})

describe('ValidationError', () => {
  it('应该正确创建 ValidationError', () => {
    const error = new ValidationError('邮箱格式错误', 'email')
    expect(error.name).toBe('ValidationError')
    expect(error.message).toBe('邮箱格式错误')
    expect(error.field).toBe('email')
  })
})

describe('NetworkError', () => {
  it('应该正确创建 NetworkError', () => {
    const error = new NetworkError()
    expect(error.name).toBe('NetworkError')
    expect(error.message).toBe('网络连接失败，请检查网络设置')
  })

  it('应该接受自定义消息', () => {
    const error = new NetworkError('自定义网络错误')
    expect(error.message).toBe('自定义网络错误')
  })
})

describe('getHttpErrorMessage', () => {
  it('应该返回预定义的错误消息', () => {
    expect(getHttpErrorMessage(400)).toBe('请求参数错误')
    expect(getHttpErrorMessage(401)).toBe('登录已过期，请重新登录')
    expect(getHttpErrorMessage(403)).toBe('没有权限执行此操作')
    expect(getHttpErrorMessage(404)).toBe('请求的资源不存在')
    expect(getHttpErrorMessage(429)).toBe('请求过于频繁，请稍后再试')
    expect(getHttpErrorMessage(500)).toBe('服务器内部错误')
  })

  it('应该返回带状态码的默认消息', () => {
    expect(getHttpErrorMessage(418)).toBe('请求失败 (418)')
  })
})

describe('getErrorMessage', () => {
  it('应该处理 ApiError', () => {
    const error = new ApiError('API错误', 400)
    expect(getErrorMessage(error)).toBe('API错误')
  })

  it('应该处理网络类 ApiError', () => {
    const error = new ApiError('', 0)
    expect(getErrorMessage(error)).toBe('网络连接失败，请检查网络设置')
  })

  it('应该处理限流 ApiError', () => {
    const error = new ApiError('', 429)
    expect(getErrorMessage(error)).toBe('请求过于频繁，请稍后再试')
  })

  it('应该处理 NetworkError', () => {
    const error = new NetworkError('网络断开')
    expect(getErrorMessage(error)).toBe('网络断开')
  })

  it('应该处理 ValidationError', () => {
    const error = new ValidationError('字段验证失败', 'field')
    expect(getErrorMessage(error)).toBe('字段验证失败')
  })

  it('应该处理普通 Error', () => {
    const error = new Error('普通错误')
    expect(getErrorMessage(error)).toBe('普通错误')
  })

  it('应该处理未知错误', () => {
    expect(getErrorMessage('字符串错误')).toBe('发生未知错误')
    expect(getErrorMessage(123)).toBe('发生未知错误')
    expect(getErrorMessage(null)).toBe('发生未知错误')
  })
})

describe('shouldRetry', () => {
  it('应该对网络错误返回 true', () => {
    const error = new ApiError('网络错误', 0)
    expect(shouldRetry(error)).toBe(true)
  })

  it('应该对服务器错误返回 true', () => {
    expect(shouldRetry(new ApiError('服务器错误', 500))).toBe(true)
    expect(shouldRetry(new ApiError('网关错误', 502))).toBe(true)
    expect(shouldRetry(new ApiError('服务不可用', 503))).toBe(true)
  })

  it('应该对客户端错误返回 false', () => {
    expect(shouldRetry(new ApiError('请求错误', 400))).toBe(false)
    expect(shouldRetry(new ApiError('未授权', 401))).toBe(false)
    expect(shouldRetry(new ApiError('未找到', 404))).toBe(false)
  })

  it('应该对 NetworkError 返回 true', () => {
    expect(shouldRetry(new NetworkError())).toBe(true)
  })
})

describe('withRetry', () => {
  it('应该成功执行不失败的函数', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    
    const result = await withRetry(fn, { delay: 0 })
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('应该重试可重试的错误', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ApiError('服务器错误', 500))
      .mockRejectedValueOnce(new ApiError('服务器错误', 500))
      .mockResolvedValue('success')
    
    const result = await withRetry(fn, { maxRetries: 3, delay: 0, backoff: false })
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('应该在最大重试次数后抛出错误', async () => {
    const error = new ApiError('服务器错误', 500)
    const fn = vi.fn().mockRejectedValue(error)
    
    await expect(withRetry(fn, { maxRetries: 2, delay: 0, backoff: false })).rejects.toThrow('服务器错误')
    expect(fn).toHaveBeenCalledTimes(3) // 初始 + 2次重试
  })

  it('应该对不可重试的错误立即抛出', async () => {
    const error = new ApiError('请求错误', 400)
    const fn = vi.fn().mockRejectedValue(error)
    
    await expect(withRetry(fn, { maxRetries: 3, delay: 0 })).rejects.toThrow('请求错误')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
