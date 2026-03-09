import { Router, Request, Response } from 'express'
import { generateId } from '../db.js'
import { queryAll, queryOne, run, runBatch, booleanize, parseBookmarkTags, serializeTags, parseTags } from '../utils/index.js'
import { authMiddleware } from '../middleware/index.js'
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

// 获取所有已使用的标签列表（简版，用于下拉建议）
router.get('/tags', (_req, res) => {
  try {
    const rows = queryAll("SELECT DISTINCT tags FROM bookmarks WHERE tags IS NOT NULL AND tags != ''")
    const tagSet = new Set<string>()
    rows.forEach((r: any) => {
      parseTags(r.tags).forEach((t: string) => tagSet.add(t))
    })
    res.json([...tagSet].sort())
  } catch (error) {
    console.error('获取标签列表失败:', error)
    res.status(500).json({ error: '获取标签列表失败' })
  }
})

// 获取标签列表（带使用计数，用于标签管理）
router.get('/tags/stats', (_req, res) => {
  try {
    const rows = queryAll("SELECT tags FROM bookmarks WHERE tags IS NOT NULL AND tags != ''")
    const tagCountMap = new Map<string, number>()
    rows.forEach((r: any) => {
      parseTags(r.tags).forEach((t: string) => {
        tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1)
      })
    })
    const result = [...tagCountMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    res.json(result)
  } catch (error) {
    console.error('获取标签统计失败:', error)
    res.status(500).json({ error: '获取标签统计失败' })
  }
})

// 重命名标签（也用于合并：将 oldName 改为 newName）
router.patch('/tags/rename', authMiddleware, (req: Request, res: Response) => {
  try {
    const { oldName, newName } = req.body
    if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string') {
      return res.status(400).json({ error: '参数 oldName 和 newName 必填' })
    }
    const trimOld = oldName.trim()
    const trimNew = newName.trim()
    if (!trimOld || !trimNew) {
      return res.status(400).json({ error: '标签名不能为空' })
    }

    // 查找所有包含 oldName 标签的书签
    const rows = queryAll("SELECT id, tags FROM bookmarks WHERE tags IS NOT NULL AND tags != ''")
    let updatedCount = 0
    rows.forEach((r: any) => {
      const tagArr = r.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      const idx = tagArr.indexOf(trimOld)
      if (idx === -1) return
      // 替换为 newName，并去重
      tagArr[idx] = trimNew
      const deduped = [...new Set(tagArr)]
      const newTags = deduped.join(',')
      if (newTags !== r.tags) {
        run('UPDATE bookmarks SET tags = ?, updatedAt = ? WHERE id = ?', [newTags || null, new Date().toISOString(), r.id])
        updatedCount++
      }
    })

    res.json({ success: true, updatedCount })
  } catch (error) {
    console.error('重命名标签失败:', error)
    res.status(500).json({ error: '重命名标签失败' })
  }
})

// 删除标签（从所有书签中移除该标签）
router.delete('/tags/:name', authMiddleware, (req: Request, res: Response) => {
  try {
    const tagName = decodeURIComponent(req.params.name).trim()
    if (!tagName) {
      return res.status(400).json({ error: '标签名不能为空' })
    }

    const rows = queryAll("SELECT id, tags FROM bookmarks WHERE tags IS NOT NULL AND tags != ''")
    let updatedCount = 0
    rows.forEach((r: any) => {
      const tagArr = r.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      const filtered = tagArr.filter((t: string) => t !== tagName)
      if (filtered.length !== tagArr.length) {
        const newTags = filtered.join(',') || null
        run('UPDATE bookmarks SET tags = ?, updatedAt = ? WHERE id = ?', [newTags, new Date().toISOString(), r.id])
        updatedCount++
      }
    })

    res.json({ success: true, updatedCount })
  } catch (error) {
    console.error('删除标签失败:', error)
    res.status(500).json({ error: '删除标签失败' })
  }
})

// 获取所有书签（兼容旧版）
router.get('/', (req, res) => {
  try {
    const bookmarks = queryAll(`
      SELECT * FROM bookmarks 
      ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC
    `)
    
    res.json(bookmarks.map(booleanize).map(parseBookmarkTags))
  } catch (error) {
    console.error('获取书签失败:', error)
    res.status(500).json({ error: '获取书签失败' })
  }
})

// 分页获取书签
router.get('/paginated', validateQuery(paginationQuerySchema), (req, res) => {
  try {
    const query = (req as any).validatedQuery as PaginationQuery
    const { page, pageSize, search, category, tag, isPinned, isReadLater, sortBy, sortOrder } = query
    
    // 构建 WHERE 条件
    const conditions: string[] = []
    const params: any[] = []
    
    if (search) {
      // 分词搜索：按空格拆分关键词，每个关键词都必须在 title/url/description/tags 中匹配
      const keywords = search.trim().split(/\s+/).filter((k: string) => k.length > 0)
      if (keywords.length === 1) {
        conditions.push('(title LIKE ? OR url LIKE ? OR description LIKE ? OR tags LIKE ?)')
        const searchPattern = `%${keywords[0]}%`
        params.push(searchPattern, searchPattern, searchPattern, searchPattern)
      } else {
        // 多关键词 AND 搜索
        const keywordConditions = keywords.map(() =>
          '(title LIKE ? OR url LIKE ? OR description LIKE ? OR tags LIKE ?)'
        )
        conditions.push(`(${keywordConditions.join(' AND ')})`)
        keywords.forEach((kw: string) => {
          const pattern = `%${kw}%`
          params.push(pattern, pattern, pattern, pattern)
        })
      }
    }
    
    if (category) {
      if (category === 'uncategorized') {
        conditions.push('(category IS NULL OR category = "")')
      } else {
        conditions.push('category = ?')
        params.push(category)
      }
    }

    if (tag) {
      // 支持精确匹配单个标签（标签以逗号分隔存储）
      conditions.push("(',' || tags || ',' LIKE ?)")
      params.push(`%,${tag},%`)
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
      items: bookmarks.map(booleanize).map(parseBookmarkTags),
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
router.post('/', authMiddleware, validateBody(createBookmarkSchema), (req, res) => {
  try {
    const { url, internalUrl, title, description, favicon, ogImage, icon, iconUrl, category, tags, isReadLater } = req.body
    
    const maxOrder = queryOne('SELECT MAX(orderIndex) as max FROM bookmarks')
    const newOrderIndex = (maxOrder?.max ?? -1) + 1
    
    const id = generateId()
    const now = new Date().toISOString()
    
    run(`
      INSERT INTO bookmarks (id, url, internalUrl, title, description, favicon, ogImage, icon, iconUrl, category, tags, orderIndex, isReadLater, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, url, internalUrl || null, title, description || null, favicon || null, ogImage || null, icon || null, iconUrl || null, category || null, serializeTags(tags), newOrderIndex, isReadLater ? 1 : 0, now, now])
    
    const bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ?', [id])
    
    res.status(201).json(parseBookmarkTags(booleanize(bookmark)))
  } catch (error) {
    console.error('创建书签失败:', error)
    res.status(500).json({ error: '创建书签失败' })
  }
})

// 重排序书签（必须在 /:id 之前定义）
router.patch('/reorder', authMiddleware, validateBody(reorderBookmarksSchema), (req, res) => {
  try {
    const { items } = req.body
    
    runBatch(items.map((item: { id: string; orderIndex: number }) => ({
      sql: 'UPDATE bookmarks SET orderIndex = ? WHERE id = ?',
      params: [item.orderIndex, item.id],
    })))
    
    res.json({ success: true })
  } catch (error) {
    console.error('重排序失败:', error)
    res.status(500).json({ error: '重排序失败' })
  }
})

// 更新书签
router.patch('/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateBookmarkSchema), (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const now = new Date().toISOString()
    
    // 获取当前书签
    const current = queryOne('SELECT * FROM bookmarks WHERE id = ?', [id])
    if (!current) {
      return res.status(404).json({ error: '书签不存在' })
    }
    
    // 合并更新（tags 需要序列化）
    if (updates.tags !== undefined) {
      updates.tags = serializeTags(updates.tags)
    }
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
    
    res.json(parseBookmarkTags(booleanize(bookmark)))
  } catch (error) {
    console.error('更新书签失败:', error)
    res.status(500).json({ error: '更新书签失败' })
  }
})

// 删除书签
router.delete('/:id', authMiddleware, validateParams(idParamSchema), (req, res) => {
  try {
    const { id } = req.params
    // 级联删除关联的访问记录
    run('DELETE FROM visits WHERE bookmarkId = ?', [id])
    run('DELETE FROM bookmarks WHERE id = ?', [id])
    res.status(204).send()
  } catch (error) {
    console.error('删除书签失败:', error)
    res.status(500).json({ error: '删除书签失败' })
  }
})

export default router
