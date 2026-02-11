import { Router } from 'express'
import { queryAll } from '../utils/index.js'
import { authMiddleware } from '../middleware/index.js'

const router = Router()

// 所有健康检查接口需要认证
router.use(authMiddleware)

interface HealthCheckResult {
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

// 检查单个 URL 的健康状态
async function checkUrl(url: string): Promise<{
  status: 'ok' | 'error' | 'timeout' | 'redirect'
  statusCode?: number
  responseTime: number
  error?: string
  redirectUrl?: string
}> {
  const start = Date.now()
  
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s 超时
    
    const response = await fetch(url, {
      method: 'HEAD', // 先用 HEAD 请求，更快
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
      },
      redirect: 'manual', // 不自动跟随重定向，手动处理
    })
    
    clearTimeout(timeout)
    const responseTime = Date.now() - start
    
    // 处理重定向
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location') || undefined
      return {
        status: 'redirect',
        statusCode: response.status,
        responseTime,
        redirectUrl,
      }
    }
    
    // HEAD 请求可能被某些服务器拒绝（405），回退到 GET
    if (response.status === 405 || response.status === 403) {
      const controller2 = new AbortController()
      const timeout2 = setTimeout(() => controller2.abort(), 10000)
      
      const getResponse = await fetch(url, {
        method: 'GET',
        signal: controller2.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'manual',
      })
      
      clearTimeout(timeout2)
      const getResponseTime = Date.now() - start
      
      if (getResponse.status >= 300 && getResponse.status < 400) {
        return {
          status: 'redirect',
          statusCode: getResponse.status,
          responseTime: getResponseTime,
          redirectUrl: getResponse.headers.get('location') || undefined,
        }
      }
      
      return {
        status: getResponse.ok ? 'ok' : 'error',
        statusCode: getResponse.status,
        responseTime: getResponseTime,
      }
    }
    
    return {
      status: response.ok ? 'ok' : 'error',
      statusCode: response.status,
      responseTime,
    }
  } catch (error: any) {
    const responseTime = Date.now() - start
    
    if (error.name === 'AbortError') {
      return {
        status: 'timeout',
        responseTime,
        error: '请求超时 (10s)',
      }
    }
    
    return {
      status: 'error',
      responseTime,
      error: error.message || '连接失败',
    }
  }
}

// POST /api/health-check - 批量检查书签健康状态
// body: { bookmarkIds?: string[] } - 为空则检查全部
router.post('/', async (req, res) => {
  try {
    const { bookmarkIds } = req.body || {}
    
    let bookmarks: any[]
    if (bookmarkIds && Array.isArray(bookmarkIds) && bookmarkIds.length > 0) {
      const placeholders = bookmarkIds.map(() => '?').join(',')
      bookmarks = queryAll(
        `SELECT id, url, title, favicon, icon, iconUrl, category FROM bookmarks WHERE id IN (${placeholders})`,
        bookmarkIds
      )
    } else {
      bookmarks = queryAll('SELECT id, url, title, favicon, icon, iconUrl, category FROM bookmarks ORDER BY orderIndex ASC')
    }
    
    // 并发检查，但限制并发数为 5
    const CONCURRENCY = 5
    const results: HealthCheckResult[] = []
    
    for (let i = 0; i < bookmarks.length; i += CONCURRENCY) {
      const batch = bookmarks.slice(i, i + CONCURRENCY)
      const batchResults = await Promise.all(
        batch.map(async (bookmark) => {
          const check = await checkUrl(bookmark.url)
          return {
            bookmarkId: bookmark.id,
            url: bookmark.url,
            title: bookmark.title,
            favicon: bookmark.favicon || undefined,
            icon: bookmark.icon || undefined,
            iconUrl: bookmark.iconUrl || undefined,
            category: bookmark.category || undefined,
            ...check,
          } as HealthCheckResult
        })
      )
      results.push(...batchResults)
    }
    
    // 统计摘要
    const summary = {
      total: results.length,
      ok: results.filter(r => r.status === 'ok').length,
      error: results.filter(r => r.status === 'error').length,
      timeout: results.filter(r => r.status === 'timeout').length,
      redirect: results.filter(r => r.status === 'redirect').length,
      averageResponseTime: results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)
        : 0,
    }
    
    res.json({ results, summary })
  } catch (error) {
    console.error('健康检查失败:', error)
    res.status(500).json({ error: '健康检查失败' })
  }
})

// POST /api/health-check/single - 检查单个 URL
router.post('/single', async (req, res) => {
  try {
    const { url } = req.body
    if (!url) {
      return res.status(400).json({ error: '请提供 URL' })
    }
    
    const result = await checkUrl(url)
    res.json(result)
  } catch (error) {
    console.error('单个检查失败:', error)
    res.status(500).json({ error: '检查失败' })
  }
})

export default router
