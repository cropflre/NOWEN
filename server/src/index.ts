import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { initDatabase, getDatabase, saveDatabase, generateId, hashPassword, verifyPassword } from './db.js'
import { parseMetadata } from './services/metadata.js'

const app = express()
const PORT = process.env.PORT || 3001

// 存储有效的 token（实际项目应该使用 Redis 或数据库）
const validTokens = new Map<string, { userId: string; username: string; expiresAt: number }>()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Token 验证中间件
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' })
  }
  
  const token = authHeader.substring(7)
  const tokenData = validTokens.get(token)
  
  if (!tokenData) {
    return res.status(401).json({ error: '无效的 Token' })
  }
  
  if (Date.now() > tokenData.expiresAt) {
    validTokens.delete(token)
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
    const tokenData = validTokens.get(token)
    
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

app.post('/api/bookmarks', (req, res) => {
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

app.patch('/api/bookmarks/:id', (req, res) => {
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

app.delete('/api/bookmarks/:id', (req, res) => {
  try {
    const { id } = req.params
    run('DELETE FROM bookmarks WHERE id = ?', [id])
    res.status(204).send()
  } catch (error) {
    console.error('删除书签失败:', error)
    res.status(500).json({ error: '删除书签失败' })
  }
})

app.patch('/api/bookmarks/reorder', (req, res) => {
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

app.post('/api/metadata', async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url) {
      return res.status(400).json({ error: 'URL 不能为空' })
    }
    
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

app.post('/api/categories', (req, res) => {
  try {
    const { name, icon, color } = req.body
    
    const maxOrder = queryOne('SELECT MAX(orderIndex) as max FROM categories')
    const newOrderIndex = (maxOrder?.max ?? -1) + 1
    
    const id = generateId()
    
    run(`
      INSERT INTO categories (id, name, icon, color, orderIndex)
      VALUES (?, ?, ?, ?, ?)
    `, [id, name, icon, color, newOrderIndex])
    
    const category = queryOne('SELECT * FROM categories WHERE id = ?', [id])
    res.status(201).json(category)
  } catch (error) {
    console.error('创建分类失败:', error)
    res.status(500).json({ error: '创建分类失败' })
  }
})

app.patch('/api/categories/:id', (req, res) => {
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

app.delete('/api/categories/:id', (req, res) => {
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

app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }
    
    const admin = queryOne('SELECT * FROM admins WHERE username = ?', [username])
    
    if (!admin) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    if (!verifyPassword(password, admin.password)) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    // 生成 Token
    const token = generateId() + generateId()
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24小时有效期
    
    // 存储 Token
    validTokens.set(token, {
      userId: admin.id,
      username: admin.username,
      expiresAt,
    })
    
    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ error: '登录失败' })
  }
})

app.post('/api/admin/change-password', authMiddleware, (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = (req as any).user
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '参数不完整' })
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度至少6位' })
    }
    
    const admin = queryOne('SELECT * FROM admins WHERE username = ?', [user.username])
    
    if (!admin) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    if (!verifyPassword(currentPassword, admin.password)) {
      return res.status(401).json({ error: '当前密码错误' })
    }
    
    const newHash = hashPassword(newPassword)
    const now = new Date().toISOString()
    
    run('UPDATE admins SET password = ?, updatedAt = ? WHERE username = ?', [newHash, now, user.username])
    
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
    validTokens.delete(token)
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
app.patch('/api/settings', authMiddleware, (req: Request, res: Response) => {
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
app.post('/api/import', authMiddleware, (req: Request, res: Response) => {
  try {
    const { bookmarks, categories, settings } = req.body
    
    if (!bookmarks || !Array.isArray(bookmarks)) {
      return res.status(400).json({ error: '无效的导入数据' })
    }
    
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
app.put('/api/quotes', authMiddleware, (req: Request, res: Response) => {
  try {
    const { quotes, useDefaultQuotes } = req.body
    
    if (!quotes || !Array.isArray(quotes)) {
      return res.status(400).json({ error: '无效的名言数据' })
    }
    
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

// 初始化数据库并启动服务器
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🪴 Zen Garden Server running at http://localhost:${PORT}`)
  })
}).catch(console.error)
