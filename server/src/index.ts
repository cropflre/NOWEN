import express from 'express'
import cors from 'cors'
import { initDatabase, getDatabase, saveDatabase, generateId } from './db.js'
import { parseMetadata } from './services/metadata.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

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

// 初始化数据库并启动服务器
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🪴 Zen Garden Server running at http://localhost:${PORT}`)
  })
}).catch(console.error)
