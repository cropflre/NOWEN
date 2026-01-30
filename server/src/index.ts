import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { initDatabase, getDatabase, saveDatabase, generateId, hashPassword, verifyPassword } from './db.js'
import { parseMetadata } from './services/metadata.js'
import {
  validateBody,
  validateParams,
  validateQuery,
  idParamSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
  reorderBookmarksSchema,
  createCategorySchema,
  updateCategorySchema,
  loginSchema,
  changePasswordSchema,
  metadataSchema,
  updateSettingsSchema,
  updateQuotesSchema,
  importDataSchema,
  paginationQuerySchema,
  PaginationQuery,
} from './schemas.js'

const app = express()
// 确保端口被解析为数字，默认 3001
const PORT = parseInt(process.env.PORT || '3001', 10)

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
function createRateLimiter(options: {
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

// 不同接口的限流策略
const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 分钟
  maxRequests: 300,       // [修改] 稍微调高一点，避免前端并发请求被误伤
  message: '请求过于频繁，请稍后再试'
})

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  maxRequests: 20,           // [修改] 稍微放宽一点
  message: '登录尝试次数过多，请15分钟后再试'
})

const metadataLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 分钟
  maxRequests: 30,        // 每分钟 30 次元数据抓取
  message: '元数据抓取请求过于频繁，请稍后再试'
})

// ========== [核心修改] CORS 配置 ==========
// 允许所有来源访问，这对 NAS 内网部署最方便
app.use(cors({
  origin: true,       // 允许任何来源（自动反射 Origin 头）
  credentials: true,  // 允许携带 Cookie/认证头
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] // 明确允许的方法
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// 应用全局请求频率限制
app.use(generalLimiter)

// ========== Token 管理函数 (持久化到数据库) ==========

function getTokenFromDb(token: string): { userId: string; username: string; expiresAt: number } | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT userId, username, expiresAt FROM tokens WHERE token = ?')
  stmt.bind([token])
  if (stmt.step()) {
    const result = stmt.getAsObject() as { userId: string; username: string; expiresAt: number }
    stmt.free()
    return result
  }
  stmt.free()
  return null
}

function saveTokenToDb(token: string, userId: string, username: string, expiresAt: number): void {
  const db = getDatabase()
  db.run(
    'INSERT INTO tokens (token, userId, username, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)',
    [token, userId, username, expiresAt, new Date().toISOString()]
  )
  saveDatabase()
}

function deleteTokenFromDb(token: string): void {
  const db = getDatabase()
  db.run('DELETE FROM tokens WHERE token = ?', [token])
  saveDatabase()
}

function cleanExpiredTokens(): void {
  const db = getDatabase()
  db.run('DELETE FROM tokens WHERE expiresAt < ?', [Date.now()])
  saveDatabase()
}

// 定期清理过期 Token (每小时)
setInterval(cleanExpiredTokens, 60 * 60 * 1000)

// Token 验证中间件
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' })
  }
  
  const token = authHeader.substring(7)
  const tokenData = getTokenFromDb(token)
  
  if (!tokenData) {
    return res.status(401).json({ error: '无效的 Token' })
  }
  
  if (Date.now() > tokenData.expiresAt) {
    deleteTokenFromDb(token)
    return res.status(401).json({ error: 'Token 已过期' })
  }
  
  // 将用户信息附加到请求对象
  ;(req as any).user = { id: tokenData.userId, username: tokenData.username }
  next()
}

// 可选的认证中间件（不强制要求登录）
function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const tokenData = getTokenFromDb(token)
    
    if (tokenData && Date.now() <= tokenData.expiresAt) {
      ;(req as any).user = { id: tokenData.userId, username: tokenData.username }
    }
  }
  
  next()
}

// 辅助函数：将 SQLite 结果转换为对象数组
function queryAll(sql: string, params: any[] = []) {
  const db = getDatabase()
  const stmt = db.prepare(sql)
  if (params.length > 0) {
    stmt.bind(params)
  }
  const results: any[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

function queryOne(sql: string, params: any[] = []) {
  const results = queryAll(sql, params)
  return results[0] || null
}

function run(sql: string, params: any[] = []) {
  const db = getDatabase()
  db.run(sql, params)
  saveDatabase()
}

// ========== 书签 API ==========

// 获取所有书签（兼容旧版）
app.get('/api/bookmarks', (req, res) => {
  try {
    const bookmarks = queryAll(`
      SELECT * FROM bookmarks 
      ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC
    `)
    
    const result = bookmarks.map((b: any) => ({
      ...b,
      isPinned: Boolean(b.isPinned),
      isReadLater: Boolean(b.isReadLater),
      isRead: Boolean(b.isRead),
    }))
    
    res.json(result)
  } catch (error) {
    console.error('获取书签失败:', error)
    res.status(500).json({ error: '获取书签失败' })
  }
})

// 分页获取书签
app.get('/api/bookmarks/paginated', validateQuery(paginationQuerySchema), (req, res) => {
  try {
    const query = (req as any).validatedQuery as PaginationQuery
    const { page, pageSize, search, category, isPinned, isReadLater, sortBy, sortOrder } = query
    
    // 构建 WHERE 条件
    const conditions: string[] = []
    const params: any[] = []
    
    if (search) {
      conditions.push('(title LIKE ? OR url LIKE ? OR description LIKE ?)')
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }
    
    if (category) {
      if (category === 'uncategorized') {
        conditions.push('(category IS NULL OR category = "")')
      } else {
        conditions.push('category = ?')
        params.push(category)
      }
    }
    
    if (typeof isPinned === 'boolean') {
      conditions.push('isPinned = ?')
      params.push(isPinned ? 1 : 0)
    }
    
    if (typeof isReadLater === 'boolean') {
      conditions.push('isReadLater = ?')
      params.push(isReadLater ? 1 : 0)
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    
    // 获取总数
    const countResult = queryOne(`SELECT COUNT(*) as total FROM bookmarks ${whereClause}`, params)
    const total = countResult?.total || 0
    
    // 计算分页
    const offset = (page - 1) * pageSize
    const totalPages = Math.ceil(total / pageSize)
    
    // 构建排序 - 始终优先按 isPinned 排序
    let orderClause = 'ORDER BY isPinned DESC'
    if (sortBy === 'orderIndex') {
      orderClause += `, orderIndex ${sortOrder.toUpperCase()}, createdAt DESC`
    } else {
      orderClause += `, ${sortBy} ${sortOrder.toUpperCase()}`
    }
    
    // 查询数据
    const bookmarks = queryAll(`
      SELECT * FROM bookmarks 
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset])
    
    const items = bookmarks.map((b: any) => ({
      ...b,
      isPinned: Boolean(b.isPinned),
      isReadLater: Boolean(b.isReadLater),
      isRead: Boolean(b.isRead),
    }))
    
    res.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore: page < totalPages,
      }
    })
  } catch (error) {
    console.error('分页获取书签失败:', error)
    res.status(500).json({ error: '分页获取书签失败' })
  }
})

app.post('/api/bookmarks', validateBody(createBookmarkSchema), (req, res) => {
  try {
    const { url, title, description, favicon, ogImage, category, tags, isReadLater } = req.body
    
    const maxOrder = queryOne('SELECT MAX(orderIndex) as max FROM bookmarks')
    const newOrderIndex = (maxOrder?.max ?? -1) + 1
    
    const id = generateId()
    const now = new Date().toISOString()
    
    run(`
      INSERT INTO bookmarks (id, url, title, description, favicon, ogImage, category, tags, orderIndex, isReadLater, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, url, title, description || null, favicon || null, ogImage || null, category || null, tags || null, newOrderIndex, isReadLater ? 1 : 0, now, now])
    
    const bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ?', [id])
    
    res.status(201).json({
      ...bookmark,
      isPinned: Boolean(bookmark.isPinned),
      isReadLater: Boolean(bookmark.isReadLater),
      isRead: Boolean(bookmark.isRead),
    })
  } catch (error) {
    console.error('创建书签失败:', error)
    res.status(500).json({ error: '创建书签失败' })
  }
})

app.patch('/api/bookmarks/:id', validateParams(idParamSchema), validateBody(updateBookmarkSchema), (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const now = new Date().toISOString()
    
    // 获取当前书签
    const current = queryOne('SELECT * FROM bookmarks WHERE id = ?', [id])
    if (!current) {
      return res.status(404).json({ error: '书签不存在' })
    }
    
    // 合并更新
    const merged = { ...current, ...updates, updatedAt: now }
    
    run(`
      UPDATE bookmarks SET 
        url = ?, title = ?, description = ?, favicon = ?, ogImage = ?, 
        category = ?, tags = ?, orderIndex = ?, isPinned = ?, 
        isReadLater = ?, isRead = ?, updatedAt = ?
      WHERE id = ?
    `, [
      merged.url, merged.title, merged.description, merged.favicon, merged.ogImage,
      merged.category, merged.tags, merged.orderIndex, merged.isPinned ? 1 : 0,
      merged.isReadLater ? 1 : 0, merged.isRead ? 1 : 0, now, id
    ])
    
    const bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ?', [id])
    
    res.json({
      ...bookmark,
      isPinned: Boolean(bookmark.isPinned),
      isReadLater: Boolean(bookmark.isReadLater),
      isRead: Boolean(bookmark.isRead),
    })
  } catch (error) {
    console.error('更新书签失败:', error)
    res.status(500).json({ error: '更新书签失败' })
  }
})

app.delete('/api/bookmarks/:id', validateParams(idParamSchema), (req, res) => {
  try {
    const { id } = req.params
    run('DELETE FROM bookmarks WHERE id = ?', [id])
    res.status(204).send()
  } catch (error) {
    console.error('删除书签失败:', error)
    res.status(500).json({ error: '删除书签失败' })
  }
})

app.patch('/api/bookmarks/reorder', validateBody(reorderBookmarksSchema), (req, res) => {
  try {
    const { items } = req.body
    
    for (const item of items) {
      run('UPDATE bookmarks SET orderIndex = ? WHERE id = ?', [item.orderIndex, item.id])
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('重排序失败:', error)
    res.status(500).json({ error: '重排序失败' })
  }
})

// ========== 元数据抓取 API ==========

// 元数据抓取使用专门的限流
app.post('/api/metadata', metadataLimiter, validateBody(metadataSchema), async (req, res) => {
  try {
    const { url } = req.body
    
    const metadata = await parseMetadata(url)
    res.json(metadata)
  } catch (error) {
    console.error('抓取元数据失败:', error)
    res.status(500).json({ 
      error: '抓取失败',
      title: '',
      description: '',
      favicon: '',
    })
  }
})

// ========== 分类 API ==========

app.get('/api/categories', (req, res) => {
  try {
    const categories = queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')
    res.json(categories)
  } catch (error) {
    console.error('获取分类失败:', error)
    res.status(500).json({ error: '获取分类失败' })
  }
})

app.post('/api/categories', validateBody(createCategorySchema), (req, res) => {
  try {
    const { name, icon, color } = req.body
    
    const maxOrder = queryOne('SELECT MAX(orderIndex) as max FROM categories')
    const newOrderIndex = (maxOrder?.max ?? -1) + 1
    
    const id = generateId()
    
    run(`
      INSERT INTO categories (id, name, icon, color, orderIndex)
      VALUES (?, ?, ?, ?, ?)
    `, [id, name, icon ?? null, color ?? null, newOrderIndex])
    
    const category = queryOne('SELECT * FROM categories WHERE id = ?', [id])
    res.status(201).json(category)
  } catch (error) {
    console.error('创建分类失败:', error)
    res.status(500).json({ error: '创建分类失败' })
  }
})

app.patch('/api/categories/:id', validateParams(idParamSchema), validateBody(updateCategorySchema), (req, res) => {
  try {
    const { id } = req.params
    const { name, icon, color, orderIndex } = req.body
    
    const current = queryOne('SELECT * FROM categories WHERE id = ?', [id])
    if (!current) {
      return res.status(404).json({ error: '分类不存在' })
    }
    
    const merged = {
      name: name ?? current.name,
      icon: icon ?? current.icon,
      color: color ?? current.color,
      orderIndex: orderIndex ?? current.orderIndex,
    }
    
    run(`
      UPDATE categories SET name = ?, icon = ?, color = ?, orderIndex = ?
      WHERE id = ?
    `, [merged.name, merged.icon, merged.color, merged.orderIndex, id])
    
    const category = queryOne('SELECT * FROM categories WHERE id = ?', [id])
    res.json(category)
  } catch (error) {
    console.error('更新分类失败:', error)
    res.status(500).json({ error: '更新分类失败' })
  }
})

app.delete('/api/categories/:id', validateParams(idParamSchema), (req, res) => {
  try {
    const { id } = req.params
    
    // 将该分类下的书签设为未分类
    run('UPDATE bookmarks SET category = NULL WHERE category = ?', [id])
    
    // 删除分类
    run('DELETE FROM categories WHERE id = ?', [id])
    
    res.status(204).send()
  } catch (error) {
    console.error('删除分类失败:', error)
    res.status(500).json({ error: '删除分类失败' })
  }
})

// ========== 管理员认证 API ==========

// 登录接口使用更严格的限流
app.post('/api/admin/login', authLimiter, validateBody(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body
    
    const admin = queryOne('SELECT * FROM admins WHERE username = ?', [username])
    
    if (!admin) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    const isValidPassword = await verifyPassword(password, admin.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    // 生成 Token
    const token = generateId() + generateId()
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24小时有效期
    
    // 存储 Token 到数据库
    saveTokenToDb(token, admin.id, admin.username, expiresAt)
    
    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
      },
      requirePasswordChange: admin.isDefaultPassword === 1
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ error: '登录失败' })
  }
})

app.post('/api/admin/change-password', authMiddleware, validateBody(changePasswordSchema), async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = (req as any).user
    
    const admin = queryOne('SELECT * FROM admins WHERE username = ?', [user.username])
    
    if (!admin) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    const isValidPassword = await verifyPassword(currentPassword, admin.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: '当前密码错误' })
    }
    
    const newHash = await hashPassword(newPassword)
    const now = new Date().toISOString()
    
    // 修改密码同时清除默认密码标记
    run('UPDATE admins SET password = ?, isDefaultPassword = 0, updatedAt = ? WHERE username = ?', [newHash, now, user.username])
    
    res.json({ success: true, message: '密码修改成功' })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({ error: '修改密码失败' })
  }
})

// 验证 Token 有效性
app.get('/api/admin/verify', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user
  res.json({ valid: true, user })
})

// 退出登录
app.post('/api/admin/logout', authMiddleware, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    deleteTokenFromDb(token)
  }
  res.json({ success: true })
})

// ========== 站点设置 API ==========

// 获取站点设置
app.get('/api/settings', (req, res) => {
  try {
    const settings = queryAll('SELECT * FROM settings')
    const result: Record<string, string> = {}
    settings.forEach((s: any) => {
      result[s.key] = s.value
    })
    res.json(result)
  } catch (error) {
    console.error('获取设置失败:', error)
    res.status(500).json({ error: '获取设置失败' })
  }
})

// 更新站点设置（需要认证）
app.patch('/api/settings', authMiddleware, validateBody(updateSettingsSchema), (req: Request, res: Response) => {
  try {
    const updates = req.body
    const now = new Date().toISOString()
    
    for (const [key, value] of Object.entries(updates)) {
      const existing = queryOne('SELECT * FROM settings WHERE key = ?', [key])
      if (existing) {
        run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [value, now, key])
      } else {
        run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', [key, value, now])
      }
    }
    
    // 返回更新后的所有设置
    const settings = queryAll('SELECT * FROM settings')
    const result: Record<string, string> = {}
    settings.forEach((s: any) => {
      result[s.key] = s.value
    })
    res.json(result)
  } catch (error) {
    console.error('更新设置失败:', error)
    res.status(500).json({ error: '更新设置失败' })
  }
})

// ========== 数据导入导出 API ==========

// 导出所有数据
app.get('/api/export', authMiddleware, (req: Request, res: Response) => {
  try {
    const bookmarks = queryAll(`
      SELECT * FROM bookmarks 
      ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC
    `).map((b: any) => ({
      ...b,
      isPinned: Boolean(b.isPinned),
      isReadLater: Boolean(b.isReadLater),
      isRead: Boolean(b.isRead),
    }))
    
    const categories = queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')
    
    const settingsRows = queryAll('SELECT * FROM settings')
    const settings: Record<string, string> = {}
    settingsRows.forEach((s: any) => {
      settings[s.key] = s.value
    })

    const quotes = queryAll('SELECT * FROM quotes ORDER BY orderIndex ASC')
    
    res.json({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        bookmarks,
        categories,
        settings,
        quotes,
      }
    })
  } catch (error) {
    console.error('导出数据失败:', error)
    res.status(500).json({ error: '导出数据失败' })
  }
})

// 导入数据（覆盖现有数据）
app.post('/api/import', authMiddleware, validateBody(importDataSchema), (req: Request, res: Response) => {
  try {
    const { bookmarks, categories, settings } = req.body
    
    const db = getDatabase()
    
    // 清空现有数据
    db.run('DELETE FROM bookmarks')
    db.run('DELETE FROM categories')
    
    // 导入分类
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        db.run(`
          INSERT INTO categories (id, name, icon, color, orderIndex)
          VALUES (?, ?, ?, ?, ?)
        `, [cat.id, cat.name, cat.icon || null, cat.color, cat.orderIndex || 0])
      }
    }
    
    // 导入书签
    for (const bookmark of bookmarks) {
      db.run(`
        INSERT INTO bookmarks (id, url, title, description, favicon, ogImage, category, tags, orderIndex, isPinned, isReadLater, isRead, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bookmark.id || generateId(),
        bookmark.url,
        bookmark.title,
        bookmark.description || null,
        bookmark.favicon || null,
        bookmark.ogImage || null,
        bookmark.category || null,
        bookmark.tags || null,
        bookmark.orderIndex || 0,
        bookmark.isPinned ? 1 : 0,
        bookmark.isReadLater ? 1 : 0,
        bookmark.isRead ? 1 : 0,
        bookmark.createdAt || new Date().toISOString(),
        bookmark.updatedAt || new Date().toISOString(),
      ])
    }
    
    // 导入设置
    if (settings && typeof settings === 'object') {
      const now = new Date().toISOString()
      for (const [key, value] of Object.entries(settings)) {
        const existing = queryOne('SELECT * FROM settings WHERE key = ?', [key])
        if (existing) {
          db.run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [value, now, key])
        } else {
          db.run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', [key, value, now])
        }
      }
    }
    
    saveDatabase()
    
    res.json({ 
      success: true, 
      message: `成功导入 ${bookmarks.length} 个书签和 ${categories?.length || 0} 个分类` 
    })
  } catch (error) {
    console.error('导入数据失败:', error)
    res.status(500).json({ error: '导入数据失败' })
  }
})

// 恢复出厂设置
app.post('/api/factory-reset', authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDatabase()
    
    // 清空所有数据
    db.run('DELETE FROM bookmarks')
    db.run('DELETE FROM categories')
    db.run('DELETE FROM quotes')
    db.run('DELETE FROM settings')
    
    // 重新初始化默认设置
    const defaultSettings = [
      { key: 'siteTitle', value: 'Nebula Portal' },
      { key: 'siteFavicon', value: '' },
      { key: 'useDefaultQuotes', value: 'true' },
    ]
    
    for (const setting of defaultSettings) {
      db.run(
        `INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)`,
        [setting.key, setting.value, new Date().toISOString()]
      )
    }
    
    // 重新初始化默认分类
    const defaultCategories = [
      { id: 'dev', name: '开发', icon: 'code', color: '#667eea', orderIndex: 0 },
      { id: 'productivity', name: '效率', icon: 'zap', color: '#f093fb', orderIndex: 1 },
      { id: 'design', name: '设计', icon: 'palette', color: '#f5576c', orderIndex: 2 },
      { id: 'reading', name: '阅读', icon: 'book', color: '#43e97b', orderIndex: 3 },
      { id: 'media', name: '媒体', icon: 'play', color: '#fa709a', orderIndex: 4 },
    ]
    
    for (const cat of defaultCategories) {
      db.run(
        `INSERT INTO categories (id, name, icon, color, orderIndex) VALUES (?, ?, ?, ?, ?)`,
        [cat.id, cat.name, cat.icon, cat.color, cat.orderIndex]
      )
    }
    
    // 重置管理员密码为默认密码
    const defaultPassword = await hashPassword('admin123')
    db.run(
      'UPDATE admins SET password = ?, isDefaultPassword = 1, updatedAt = ? WHERE username = ?',
      [defaultPassword, new Date().toISOString(), 'admin']
    )
    
    saveDatabase()
    
    res.json({ 
      success: true, 
      message: '已恢复出厂设置，管理员密码已重置为 admin123' 
    })
  } catch (error) {
    console.error('恢复出厂设置失败:', error)
    res.status(500).json({ error: '恢复出厂设置失败' })
  }
})

// ========== 名言 API ==========

// 获取所有名言（包含设置）
app.get('/api/quotes', (req, res) => {
  try {
    const quotes = queryAll('SELECT * FROM quotes ORDER BY orderIndex ASC')
    const useDefaultSetting = queryOne('SELECT value FROM settings WHERE key = ?', ['useDefaultQuotes'])
    const useDefaultQuotes = useDefaultSetting?.value !== 'false'
    
    res.json({
      quotes: quotes.map((q: any) => q.content),
      useDefaultQuotes
    })
  } catch (error) {
    console.error('获取名言失败:', error)
    res.status(500).json({ error: '获取名言失败' })
  }
})

// 更新名言列表（需要认证）
app.put('/api/quotes', authMiddleware, validateBody(updateQuotesSchema), (req: Request, res: Response) => {
  try {
    const { quotes, useDefaultQuotes } = req.body
    
    const db = getDatabase()
    
    // 更新 useDefaultQuotes 设置
    if (typeof useDefaultQuotes === 'boolean') {
      db.run(
        'INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)',
        ['useDefaultQuotes', useDefaultQuotes.toString(), new Date().toISOString()]
      )
    }
    
    // 清空现有名言
    db.run('DELETE FROM quotes')
    
    // 插入新名言
    const now = new Date().toISOString()
    quotes.forEach((content: string, index: number) => {
      const id = generateId()
      db.run(
        'INSERT INTO quotes (id, content, orderIndex, createdAt) VALUES (?, ?, ?, ?)',
        [id, content, index, now]
      )
    })
    
    saveDatabase()
    
    res.json({ success: true, count: quotes.length })
  } catch (error) {
    console.error('更新名言失败:', error)
    res.status(500).json({ error: '更新名言失败' })
  }
})

// ========== [核心修改] 启动监听 ==========
// 使用 0.0.0.0 允许 Docker 外部访问
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🪴 Zen Garden Server running at http://0.0.0.0:${PORT}`)
  })
}).catch(console.error)