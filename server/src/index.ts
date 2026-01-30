import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { initDatabase, getDatabase, saveDatabase, generateId, hashPassword, verifyPassword } from './db.js'
import { parseMetadata } from './services/metadata.js'

const app = express()
const PORT = process.env.PORT || 3001

// 存储有效的 token（实际项目应该使用 Redis 或数据库）
const validTokens = new Map<string, { userId: string; username: string; expiresAt: number }>()

app.use(cors())
app.use(express.json())

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

// 初始化数据库并启动服务器
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🪴 Zen Garden Server running at http://localhost:${PORT}`)
  })
}).catch(console.error)
