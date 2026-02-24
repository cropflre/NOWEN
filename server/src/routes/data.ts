import { Router, Request, Response } from 'express'
import { getDatabase, saveDatabase, generateId, hashPassword } from '../db.js'
import { queryAll, queryOne, booleanize } from '../utils/index.js'
import { authMiddleware } from '../middleware/index.js'
import { validateBody, importDataSchema } from '../schemas.js'
import { parseMetadata } from '../services/metadata.js'

const router = Router()

// 导入后异步抓取 metadata 的状态管理
let enrichStatus: {
  running: boolean
  total: number
  completed: number
  failed: number
  current: string
} = { running: false, total: 0, completed: 0, failed: 0, current: '' }

// 异步抓取缺少 favicon 的书签 metadata
async function enrichBookmarkMetadata(bookmarkIds: string[]) {
  if (bookmarkIds.length === 0) return

  enrichStatus = { running: true, total: bookmarkIds.length, completed: 0, failed: 0, current: '' }
  
  const CONCURRENCY = 3 // 并发数限制
  let index = 0

  async function processNext() {
    while (index < bookmarkIds.length) {
      const i = index++
      const id = bookmarkIds[i]

      try {
        const bookmark = queryOne('SELECT id, url, title, favicon FROM bookmarks WHERE id = ?', [id]) as any
        if (!bookmark) continue

        enrichStatus.current = bookmark.title || bookmark.url

        const meta = await parseMetadata(bookmark.url)
        const db = getDatabase()
        
        // 更新 favicon 和可能缺失的 ogImage
        const updates: string[] = []
        const values: any[] = []

        if (meta.favicon && !bookmark.favicon) {
          updates.push('favicon = ?')
          values.push(meta.favicon)
        }
        if (meta.ogImage) {
          updates.push('ogImage = ?')
          values.push(meta.ogImage)
        }

        if (updates.length > 0) {
          updates.push('updatedAt = ?')
          values.push(new Date().toISOString())
          values.push(id)
          db.run(`UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`, values)
        }

        enrichStatus.completed++
      } catch (err: any) {
        console.warn(`抓取 metadata 失败 [${id}]:`, err?.message || err)
        enrichStatus.completed++
        enrichStatus.failed++
      }
    }
  }

  // 启动并发任务
  const workers = Array.from({ length: Math.min(CONCURRENCY, bookmarkIds.length) }, () => processNext())
  await Promise.all(workers)

  // 完成后保存数据库
  try {
    saveDatabase()
    console.log(`✅ Metadata 抓取完成: ${enrichStatus.completed - enrichStatus.failed}/${enrichStatus.total} 成功`)
  } catch (err) {
    console.error('保存数据库失败:', err)
  }

  enrichStatus.running = false
}

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
          INSERT OR REPLACE INTO categories (id, name, icon, color, orderIndex)
          VALUES (?, ?, ?, ?, ?)
        `, [cat.id, cat.name, cat.icon || null, cat.color, cat.orderIndex || 0])
      }
    }
    
    // 导入书签
    const insertedIds: string[] = []
    for (const bookmark of bookmarks) {
      const id = bookmark.id || generateId()
      db.run(`
        INSERT OR REPLACE INTO bookmarks (id, url, internalUrl, title, description, favicon, ogImage, icon, iconUrl, category, tags, orderIndex, isPinned, isReadLater, isRead, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        bookmark.url,
        bookmark.internalUrl || null,
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

      // 记录缺少 favicon 的书签 ID
      if (!bookmark.favicon && !bookmark.iconUrl) {
        insertedIds.push(id)
      }
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

    // 异步启动 metadata 抓取（不阻塞响应）
    // 超过 50 条书签时跳过图标抓取，避免大量导入时请求过多
    const shouldEnrich = insertedIds.length > 0 && bookmarks.length <= 50
    if (shouldEnrich) {
      console.log(`🔍 开始异步抓取 ${insertedIds.length} 个书签的 metadata...`)
      enrichBookmarkMetadata(insertedIds).catch(err => {
        console.error('Metadata 抓取任务异常:', err)
      })
    } else if (insertedIds.length > 0) {
      console.log(`⏭️ 导入书签数 ${bookmarks.length} 超过 50，跳过图标抓取`)
    }
    
    res.json({ 
      success: true, 
      message: `成功导入 ${bookmarks.length} 个书签和 ${categories?.length || 0} 个分类`,
      enriching: shouldEnrich ? insertedIds.length : 0,
    })
  } catch (error) {
    console.error('导入数据失败:', error)
    res.status(500).json({ error: '导入数据失败' })
  }
})

// 查询 metadata 抓取进度
router.get('/import/enrich-status', authMiddleware, (req: Request, res: Response) => {
  res.json(enrichStatus)
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
      { key: 'siteTitle', value: 'NOWEN' },
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
