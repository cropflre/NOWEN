import { Router, Request, Response } from 'express'
import { getDatabase, saveDatabase, generateId, hashPassword } from '../db.js'
import { queryAll, queryOne, booleanize } from '../utils/index.js'
import { authMiddleware } from '../middleware/index.js'
import { validateBody, importDataSchema } from '../schemas.js'

const router = Router()

// 导出所有数据
router.get('/export', authMiddleware, (req: Request, res: Response) => {
  try {
    const bookmarks = queryAll(`
      SELECT * FROM bookmarks 
      ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC
    `).map(booleanize)
    
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
router.post('/import', authMiddleware, validateBody(importDataSchema), (req: Request, res: Response) => {
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
        INSERT INTO bookmarks (id, url, title, description, favicon, ogImage, icon, iconUrl, category, tags, orderIndex, isPinned, isReadLater, isRead, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bookmark.id || generateId(),
        bookmark.url,
        bookmark.title,
        bookmark.description || null,
        bookmark.favicon || null,
        bookmark.ogImage || null,
        bookmark.icon || null,
        bookmark.iconUrl || null,
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
        // 如果值是对象，需要 JSON 序列化
        const stringValue = typeof value === 'object' && value !== null 
          ? JSON.stringify(value) 
          : String(value ?? '')
        
        const existing = queryOne('SELECT * FROM settings WHERE key = ?', [key])
        if (existing) {
          db.run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [stringValue, now, key])
        } else {
          db.run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', [key, stringValue, now])
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
router.post('/factory-reset', authMiddleware, async (req: Request, res: Response) => {
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

export default router
