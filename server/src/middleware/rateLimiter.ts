import { Request, Response, NextFunction } from 'express'

// ========== 请求频率限制 (Rate Limiter) ==========

interface RateLimitRecord {
  count: number
  resetTime: number
}

// 存储每个 IP 的请求记录
const rateLimitStore = new Map<string, RateLimitRecord>()

// 清理过期的限制记录（每5分钟）
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}, 5 * 60 * 1000)

// 创建限流中间件
export function createRateLimiter(options: {
  windowMs: number      // 时间窗口（毫秒）
  maxRequests: number   // 时间窗口内最大请求数
  message?: string      // 超限时的错误消息
}) {
  const { windowMs, maxRequests, message = '请求过于频繁，请稍后再试' } = options

  return (req: Request, res: Response, next: NextFunction) => {
    // 获取客户端 IP
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const key = `${ip}:${req.path}`
    const now = Date.now()

    let record = rateLimitStore.get(key)

    if (!record || now > record.resetTime) {
      // 新记录或已过期，重置
      record = { count: 1, resetTime: now + windowMs }
      rateLimitStore.set(key, record)
    } else {
      // 增加计数
      record.count++
    }

    // 设置响应头
    res.setHeader('X-RateLimit-Limit', maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString())
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString())

    if (record.count > maxRequests) {
      return res.status(429).json({ 
        error: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      })
    }

    next()
  }
}

// 预设的限流器
export const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 分钟
  maxRequests: 300,
  message: '请求过于频繁，请稍后再试'
})

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  maxRequests: 20,
  message: '登录尝试次数过多，请15分钟后再试'
})

export const metadataLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 分钟
  maxRequests: 30,
  message: '元数据抓取请求过于频繁，请稍后再试'
})
