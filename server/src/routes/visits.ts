import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { generateId, saveDatabase } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../schemas.js'
import { queryAll, queryOne, run } from '../utils/index.js'

const router = Router()

// ========== Schema 定义 ==========

// 记录访问 Schema
const trackVisitSchema = z.object({
  bookmarkId: z.string().min(1, '书签 ID 不能为空'),
})

// 获取统计查询 Schema
const statsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year', 'all']).default('all'),
})

// 热门书签查询 Schema
const topBookmarksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  period: z.enum(['day', 'week', 'month', 'year', 'all']).default('all'),
})

// 访问趋势查询 Schema
const trendQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
})

// 最近访问查询 Schema
const recentVisitsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ========== 辅助函数 ==========

// 获取时间范围的开始时间
function getPeriodStartDate(period: string): string {
  const now = new Date()
  switch (period) {
    case 'day':
      now.setHours(0, 0, 0, 0)
      break
    case 'week':
      now.setDate(now.getDate() - 7)
      break
    case 'month':
      now.setMonth(now.getMonth() - 1)
      break
    case 'year':
      now.setFullYear(now.getFullYear() - 1)
      break
    default:
      return '1970-01-01T00:00:00.000Z'
  }
  return now.toISOString()
}

// 获取今天的开始时间
function getTodayStart(): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

// 获取指定天数前的日期
function getDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

// ========== API 路由 ==========

/**
 * POST /api/visits/track - 记录访问（公开接口）
 */
router.post('/track', validateBody(trackVisitSchema), (req: Request, res: Response) => {
  try {
    const { bookmarkId } = req.body

    // 检查书签是否存在
    const bookmark = queryOne('SELECT id FROM bookmarks WHERE id = ?', [bookmarkId])
    if (!bookmark) {
      return res.status(404).json({ error: '书签不存在' })
    }

    // 获取客户端信息
    const ip = req.ip || req.headers['x-forwarded-for'] as string || ''
    const userAgent = req.headers['user-agent'] || ''
    const referer = req.headers['referer'] || ''

    // 插入访问记录
    const visitId = generateId()
    run(
      `INSERT INTO visits (id, bookmarkId, visitedAt, ip, userAgent, referer) VALUES (?, ?, ?, ?, ?, ?)`,
      [visitId, bookmarkId, new Date().toISOString(), ip, userAgent, referer]
    )

    // 更新书签的 visitCount
    run('UPDATE bookmarks SET visitCount = visitCount + 1 WHERE id = ?', [bookmarkId])

    res.json({ success: true })
  } catch (error) {
    console.error('Track visit error:', error)
    res.status(500).json({ error: '记录访问失败' })
  }
})

/**
 * GET /api/visits/stats - 获取总体统计概览（需要认证）
 */
router.get('/stats', authMiddleware, (req: Request, res: Response) => {
  try {
    const todayStart = getTodayStart()
    const weekStart = getDaysAgo(7)
    const monthStart = getDaysAgo(30)

    // 总访问量
    const totalResult = queryOne('SELECT COUNT(*) as total FROM visits')
    const totalVisits = totalResult?.total || 0

    // 今日访问量
    const todayResult = queryOne(
      'SELECT COUNT(*) as count FROM visits WHERE visitedAt >= ?',
      [todayStart]
    )
    const todayVisits = todayResult?.count || 0

    // 本周访问量
    const weekResult = queryOne(
      'SELECT COUNT(*) as count FROM visits WHERE visitedAt >= ?',
      [weekStart]
    )
    const weekVisits = weekResult?.count || 0

    // 本月访问量
    const monthResult = queryOne(
      'SELECT COUNT(*) as count FROM visits WHERE visitedAt >= ?',
      [monthStart]
    )
    const monthVisits = monthResult?.count || 0

    // 总书签数
    const bookmarkResult = queryOne('SELECT COUNT(*) as count FROM bookmarks')
    const totalBookmarks = bookmarkResult?.count || 0

    // 被访问过的书签数
    const visitedBookmarkResult = queryOne(
      'SELECT COUNT(DISTINCT bookmarkId) as count FROM visits'
    )
    const visitedBookmarks = visitedBookmarkResult?.count || 0

    res.json({
      totalVisits,
      todayVisits,
      weekVisits,
      monthVisits,
      totalBookmarks,
      visitedBookmarks,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

/**
 * GET /api/visits/top - 获取热门书签排行（需要认证）
 */
router.get('/top', authMiddleware, validateQuery(topBookmarksQuerySchema), (req: Request, res: Response) => {
  try {
    const { limit, period } = (req as any).validatedQuery
    const startDate = getPeriodStartDate(period)

    let bookmarks: any[]

    if (period === 'all') {
      // 使用 bookmarks 表的 visitCount 字段，更高效
      bookmarks = queryAll(
        `SELECT 
          id, url, title, description, favicon, icon, iconUrl,
          category, visitCount
        FROM bookmarks
        WHERE visitCount > 0
        ORDER BY visitCount DESC
        LIMIT ?`,
        [limit]
      )
    } else {
      // 按时间段统计
      bookmarks = queryAll(
        `SELECT 
          b.id, b.url, b.title, b.description, b.favicon, b.icon, b.iconUrl,
          b.category, COUNT(v.id) as visitCount
        FROM bookmarks b
        INNER JOIN visits v ON b.id = v.bookmarkId
        WHERE v.visitedAt >= ?
        GROUP BY b.id
        ORDER BY visitCount DESC
        LIMIT ?`,
        [startDate, limit]
      )
    }

    res.json(bookmarks)
  } catch (error) {
    console.error('Get top bookmarks error:', error)
    res.status(500).json({ error: '获取热门书签失败' })
  }
})

/**
 * GET /api/visits/trend - 获取访问趋势（需要认证）
 */
router.get('/trend', authMiddleware, validateQuery(trendQuerySchema), (req: Request, res: Response) => {
  try {
    const { days } = (req as any).validatedQuery

    // 生成日期列表
    const dates: string[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    // 查询每天的访问量
    const startDate = getDaysAgo(days)
    const results = queryAll(
      `SELECT DATE(visitedAt) as date, COUNT(*) as count 
       FROM visits 
       WHERE visitedAt >= ?
       GROUP BY DATE(visitedAt)
       ORDER BY date ASC`,
      [startDate]
    )

    // 构建日期到访问量的映射
    const countMap: { [key: string]: number } = {}
    results.forEach(row => {
      countMap[row.date] = row.count
    })

    // 填充完整的趋势数据
    const trend = dates.map(date => ({
      date,
      count: countMap[date] || 0,
    }))

    res.json(trend)
  } catch (error) {
    console.error('Get trend error:', error)
    res.status(500).json({ error: '获取访问趋势失败' })
  }
})

/**
 * GET /api/visits/recent - 获取最近访问记录（需要认证）
 */
router.get('/recent', authMiddleware, validateQuery(recentVisitsQuerySchema), (req: Request, res: Response) => {
  try {
    const { limit } = (req as any).validatedQuery

    const results = queryAll(
      `SELECT 
        v.id, v.visitedAt, v.ip, v.userAgent,
        b.id as bookmarkId, b.url, b.title, b.favicon, b.icon, b.iconUrl
       FROM visits v
       INNER JOIN bookmarks b ON v.bookmarkId = b.id
       ORDER BY v.visitedAt DESC
       LIMIT ?`,
      [limit]
    )

    const visits = results.map(item => ({
      id: item.id,
      visitedAt: item.visitedAt,
      ip: item.ip,
      userAgent: item.userAgent,
      bookmark: {
        id: item.bookmarkId,
        url: item.url,
        title: item.title,
        favicon: item.favicon,
        icon: item.icon,
        iconUrl: item.iconUrl,
      },
    }))

    res.json(visits)
  } catch (error) {
    console.error('Get recent visits error:', error)
    res.status(500).json({ error: '获取最近访问记录失败' })
  }
})

/**
 * GET /api/visits/stats/:bookmarkId - 获取单个书签的统计（需要认证）
 */
router.get('/stats/:bookmarkId', authMiddleware, (req: Request, res: Response) => {
  try {
    const { bookmarkId } = req.params

    // 检查书签是否存在
    const bookmark = queryOne(
      'SELECT id, title, visitCount FROM bookmarks WHERE id = ?',
      [bookmarkId]
    )
    if (!bookmark) {
      return res.status(404).json({ error: '书签不存在' })
    }

    const visitCount = bookmark.visitCount || 0

    // 获取最近7天的访问趋势
    const days = 7
    const dates: string[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    const startDate = getDaysAgo(days)
    const trendResults = queryAll(
      `SELECT DATE(visitedAt) as date, COUNT(*) as count 
       FROM visits 
       WHERE bookmarkId = ? AND visitedAt >= ?
       GROUP BY DATE(visitedAt)
       ORDER BY date ASC`,
      [bookmarkId, startDate]
    )

    const countMap: { [key: string]: number } = {}
    trendResults.forEach(row => {
      countMap[row.date] = row.count
    })

    const trend = dates.map(date => countMap[date] || 0)

    // 获取最后访问时间
    const lastVisitResult = queryOne(
      'SELECT visitedAt FROM visits WHERE bookmarkId = ? ORDER BY visitedAt DESC LIMIT 1',
      [bookmarkId]
    )
    const lastVisited = lastVisitResult?.visitedAt || null

    res.json({
      bookmarkId,
      visitCount,
      lastVisited,
      trend,
    })
  } catch (error) {
    console.error('Get bookmark stats error:', error)
    res.status(500).json({ error: '获取书签统计失败' })
  }
})

/**
 * DELETE /api/visits/clear - 清除所有访问记录（需要认证）
 */
router.delete('/clear', authMiddleware, (req: Request, res: Response) => {
  try {
    // 清除所有访问记录
    run('DELETE FROM visits')
    
    // 重置所有书签的访问计数
    run('UPDATE bookmarks SET visitCount = 0')

    res.json({ success: true, message: '访问记录已清除' })
  } catch (error) {
    console.error('Clear visits error:', error)
    res.status(500).json({ error: '清除访问记录失败' })
  }
})

export default router
