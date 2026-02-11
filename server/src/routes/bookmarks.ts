import { Router, Request, Response } from 'express'
import { generateId } from '../db.js'
import { queryAll, queryOne, run, booleanize } from '../utils/index.js'
import {
  validateBody,
  validateParams,
  validateQuery,
  idParamSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
  reorderBookmarksSchema,
  paginationQuerySchema,
  PaginationQuery,
} from '../schemas.js'

const router = Router()

// 获取所有书签（兼容旧版）
router.get('/', (req, res) => {
  try {
    const bookmarks = queryAll(`
      SELECT * FROM bookmarks 
      ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC
    `)
    
    res.json(bookmarks.map(booleanize))
  } catch (error) {
    console.error('获取书签失败:', error)
    res.status(500).json({ error: '获取书签失败' })
  }
})

// 分页获取书签
router.get('/paginated', validateQuery(paginationQuerySchema), (req, res) => {
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
    
    res.json({
      items: bookmarks.map(booleanize),
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

// 创建书签
router.post('/', validateBody(createBookmarkSchema), (req, res) => {
  try {
    const { url, internalUrl, title, description, favicon, ogImage, icon, iconUrl, category, tags, isReadLater } = req.body
    
    const maxOrder = queryOne('SELECT MAX(orderIndex) as max FROM bookmarks')
    const newOrderIndex = (maxOrder?.max ?? -1) + 1
    
    const id = generateId()
    const now = new Date().toISOString()
    
    run(`
      INSERT INTO bookmarks (id, url, internalUrl, title, description, favicon, ogImage, icon, iconUrl, category, tags, orderIndex, isReadLater, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, url, internalUrl || null, title, description || null, favicon || null, ogImage || null, icon || null, iconUrl || null, category || null, tags || null, newOrderIndex, isReadLater ? 1 : 0, now, now])
    
    const bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ?', [id])
    
    res.status(201).json(booleanize(bookmark))
  } catch (error) {
    console.error('创建书签失败:', error)
    res.status(500).json({ error: '创建书签失败' })
  }
})

// 重排序书签（必须在 /:id 之前定义）
router.patch('/reorder', validateBody(reorderBookmarksSchema), (req, res) => {
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

// 更新书签
router.patch('/:id', validateParams(idParamSchema), validateBody(updateBookmarkSchema), (req, res) => {
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
        url = ?, internalUrl = ?, title = ?, description = ?, favicon = ?, ogImage = ?, icon = ?, iconUrl = ?,
        category = ?, tags = ?, orderIndex = ?, isPinned = ?, 
        isReadLater = ?, isRead = ?, updatedAt = ?
      WHERE id = ?
    `, [
      merged.url, merged.internalUrl || null, merged.title, merged.description, merged.favicon, merged.ogImage, merged.icon, merged.iconUrl,
      merged.category, merged.tags, merged.orderIndex, merged.isPinned ? 1 : 0,
      merged.isReadLater ? 1 : 0, merged.isRead ? 1 : 0, now, id
    ])
    
    const bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ?', [id])
    
    res.json(booleanize(bookmark))
  } catch (error) {
    console.error('更新书签失败:', error)
    res.status(500).json({ error: '更新书签失败' })
  }
})

// 删除书签
router.delete('/:id', validateParams(idParamSchema), (req, res) => {
  try {
    const { id } = req.params
    run('DELETE FROM bookmarks WHERE id = ?', [id])
    res.status(204).send()
  } catch (error) {
    console.error('删除书签失败:', error)
    res.status(500).json({ error: '删除书签失败' })
  }
})

export default router
