import { Router, Request, Response, NextFunction } from 'express'
import { getDatabase, saveDatabase, generateId } from '../db.js'
import { authMiddleware } from '../middleware/index.js'

const router = Router()

// ========== 日志记录工具函数 ==========

export type LogLevel = 'info' | 'warn' | 'error'
export type LogType = 'operation' | 'api_error' | 'system'

export interface LogEntry {
  id: string
  level: LogLevel
  type: LogType
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

/**
 * 写入一条日志到数据库
 */
export function writeLog(entry: {
  level: LogLevel
  type: LogType
  message: string
  detail?: string
  method?: string
  path?: string
  statusCode?: number
  ip?: string
  userAgent?: string
  username?: string
}) {
  try {
    const db = getDatabase()
    if (!db) return
    const id = generateId()
    db.run(
      `INSERT INTO logs (id, level, type, message, detail, method, path, statusCode, ip, userAgent, username, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entry.level,
        entry.type,
        entry.message,
        entry.detail || null,
        entry.method || null,
        entry.path || null,
        entry.statusCode || null,
        entry.ip || null,
        entry.userAgent || null,
        entry.username || null,
        new Date().toISOString(),
      ]
    )
    saveDatabase()
  } catch {
    // 日志写入失败不应阻塞业务
  }
}

// ========== 全局请求日志中间件 ==========

/**
 * Express 中间件：记录 API 错误日志和关键操作日志
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()
  const originalSend = res.send.bind(res)

  res.send = function (body: any) {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode
    const method = req.method
    const path = req.originalUrl || req.url
    const ip = req.ip || req.headers['x-forwarded-for'] as string || ''
    const userAgent = (req.headers['user-agent'] || '').substring(0, 200)
    const username = (req as any).user?.username || null

    // 记录 API 错误（4xx/5xx）
    if (statusCode >= 400) {
      let errorMessage = ''
      try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body
        errorMessage = parsed?.error || parsed?.message || `HTTP ${statusCode}`
      } catch {
        errorMessage = `HTTP ${statusCode}`
      }

      writeLog({
        level: statusCode >= 500 ? 'error' : 'warn',
        type: 'api_error',
        message: `${method} ${path} → ${statusCode}`,
        detail: errorMessage,
        method,
        path,
        statusCode,
        ip,
        userAgent,
        username,
      })
    }

    // 记录关键操作日志（POST/PUT/PATCH/DELETE 且成功）
    if (statusCode < 400 && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // 跳过访问追踪和健康检查等高频接口
      if (!path.includes('/api/visits/track') && !path.includes('/api/health-check/')) {
        const operationMap: Record<string, string> = {
          'POST /api/bookmarks': '添加书签',
          'PATCH /api/bookmarks': '更新书签',
          'DELETE /api/bookmarks': '删除书签',
          'POST /api/categories': '添加分类',
          'PATCH /api/categories': '更新分类',
          'DELETE /api/categories': '删除分类',
          'PATCH /api/categories/reorder': '分类排序',
          'PATCH /api/bookmarks/reorder': '书签排序',
          'POST /api/admin/login': '管理员登录',
          'POST /api/admin/logout': '管理员登出',
          'PATCH /api/admin/password': '修改密码',
          'PATCH /api/admin/username': '修改用户名',
          'PUT /api/settings': '更新站点设置',
          'PUT /api/quotes': '更新名言',
          'POST /api/import': '导入数据',
          'POST /api/factory-reset': '恢复出厂设置',
          'POST /api/ai/categorize': 'AI 智能分类',
          'POST /api/ai/chat': 'AI 对话',
          'POST /api/ai/config': '保存 AI 配置',
          'DELETE /api/visits/clear': '清除访问记录',
          'PATCH /api/bookmarks/tags/rename': '重命名标签',
        }

        // 匹配操作名称
        let opName = ''
        for (const [pattern, name] of Object.entries(operationMap)) {
          const [m, p] = pattern.split(' ')
          if (method === m && path.startsWith(p)) {
            opName = name
            break
          }
        }

        if (opName) {
          writeLog({
            level: 'info',
            type: 'operation',
            message: opName,
            detail: `${method} ${path} (${duration}ms)`,
            method,
            path,
            statusCode,
            ip,
            userAgent,
            username,
          })
        }
      }
    }

    return originalSend(body)
  }

  next()
}

// ========== 日志查询 API ==========

// GET /api/logs - 获取日志列表（分页 + 筛选）
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDatabase()
    const page = parseInt(req.query.page as string) || 1
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 200)
    const level = req.query.level as string    // info | warn | error
    const type = req.query.type as string      // operation | api_error | system
    const search = req.query.search as string  // 关键词搜索

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (level && ['info', 'warn', 'error'].includes(level)) {
      whereClause += ' AND level = ?'
      params.push(level)
    }
    if (type && ['operation', 'api_error', 'system'].includes(type)) {
      whereClause += ' AND type = ?'
      params.push(type)
    }
    if (search) {
      whereClause += ' AND (message LIKE ? OR detail LIKE ? OR path LIKE ? OR username LIKE ?)'
      const kw = `%${search}%`
      params.push(kw, kw, kw, kw)
    }

    // 总数
    const countResult = db.exec(`SELECT COUNT(*) as count FROM logs ${whereClause}`, params)
    const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0

    // 分页查询
    const offset = (page - 1) * pageSize
    const rows = db.exec(
      `SELECT * FROM logs ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    const logs: LogEntry[] = []
    if (rows.length > 0) {
      const columns = rows[0].columns
      for (const row of rows[0].values) {
        const log: any = {}
        columns.forEach((col, i) => {
          log[col] = row[i]
        })
        logs.push(log)
      }
    }

    // 统计各级别数量
    const statsResult = db.exec(`
      SELECT 
        level,
        COUNT(*) as count 
      FROM logs 
      ${type ? 'WHERE type = ?' : ''}
      GROUP BY level
    `, type ? [type] : [])

    const stats: Record<string, number> = { info: 0, warn: 0, error: 0 }
    if (statsResult.length > 0) {
      for (const row of statsResult[0].values) {
        stats[row[0] as string] = row[1] as number
      }
    }

    res.json({
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats,
    })
  } catch (err: any) {
    res.status(500).json({ error: '查询日志失败', message: err.message })
  }
})

// DELETE /api/logs - 清除日志
router.delete('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDatabase()
    const before = req.query.before as string // ISO 日期字符串，清除此日期之前的日志

    if (before) {
      db.run('DELETE FROM logs WHERE createdAt < ?', [before])
    } else {
      db.run('DELETE FROM logs')
    }
    saveDatabase()

    writeLog({
      level: 'info',
      type: 'operation',
      message: before ? '清除历史日志' : '清除全部日志',
      detail: before ? `清除 ${before} 之前的日志` : '清除所有日志记录',
      username: (req as any).user?.username,
      ip: req.ip || '',
    })

    res.json({ success: true, message: '日志已清除' })
  } catch (err: any) {
    res.status(500).json({ error: '清除日志失败', message: err.message })
  }
})

export default router
