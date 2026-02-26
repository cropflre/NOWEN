import { Router } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import { validateBody } from '../schemas.js'
import { aiCategorize, aiEnrichMetadata, aiChat, aiTestConnection, isAiConfigured, getAiFullStatus } from '../services/ai.js'
import { queryAll, queryOne, run } from '../utils/index.js'
import { getDatabase, saveDatabase } from '../db.js'
import { authMiddleware } from '../middleware/index.js'

const router = Router()

// ========== Schema ==========

const categorizeSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  lang: z.string().max(10).optional(),
})

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  lang: z.string().max(10).optional(),
})

const configSchema = z.object({
  provider: z.enum(['openai', 'gemini', 'deepseek', 'qwen', 'doubao', 'custom', '']),
  apiKey: z.string().max(500).optional(),
  apiBase: z.string().max(500).optional(),
  model: z.string().max(100).optional(),
})

// ========== 公开端点 ==========

// GET /api/ai/status - 检查 AI 配置状态（前端用于决定是否显示 AI 功能）
router.get('/status', (_req, res) => {
  res.json(getAiFullStatus())
})

// POST /api/ai/categorize - AI 智能分类
router.post('/categorize', validateBody(categorizeSchema), async (req, res) => {
  if (!isAiConfigured()) {
    return res.status(503).json({
      error: 'AI 服务未配置。请在后台设置中配置 AI 参数。',
    })
  }

  try {
    const { url, title, description, lang } = req.body

    const categories = queryAll('SELECT name FROM categories ORDER BY orderIndex ASC')
    const existingCategories = categories.map((c: any) => c.name)

    const result = await aiCategorize({
      url,
      title,
      description: description || undefined,
      existingCategories,
      lang,
    })

    let categoryId: string | null = null
    if (!result.isNewCategory) {
      const matched = queryAll('SELECT id FROM categories WHERE name = ?', [result.category])
      if (matched.length > 0) {
        categoryId = (matched[0] as any).id
      }
    }

    res.json({ ...result, categoryId })
  } catch (error: any) {
    console.error('AI 分类失败:', error?.message || error)
    res.status(500).json({ error: error?.message || 'AI 分类服务暂时不可用' })
  }
})

// POST /api/ai/chat - AI 智能助理对话
router.post('/chat', validateBody(chatSchema), async (req, res) => {
  if (!isAiConfigured()) {
    return res.status(503).json({
      error: 'AI 服务未配置。请在后台设置中配置 AI 参数。',
    })
  }

  try {
    const { message, lang } = req.body
    const result = await aiChat({ message, lang })
    res.json(result)
  } catch (error: any) {
    console.error('AI 对话失败:', error?.message || error)
    res.status(500).json({ error: error?.message || 'AI 对话服务暂时不可用' })
  }
})

// ========== 需认证端点 ==========

// POST /api/ai/batch-tags - 批量 AI 智能标签（异步处理）
const batchTagsStatus = {
  running: false,
  total: 0,
  completed: 0,
  failed: 0,
  current: '',
}

router.post('/batch-tags', authMiddleware, async (req, res) => {
  if (!isAiConfigured()) {
    return res.status(503).json({ error: 'AI 服务未配置。请在后台设置中配置 AI 参数。' })
  }

  const { ids } = req.body as { ids: string[] }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请提供书签 ID 列表' })
  }

  if (batchTagsStatus.running) {
    return res.status(409).json({ error: '已有 AI 标签任务进行中，请稍后再试' })
  }

  // 过滤出有效书签
  const targetBookmarks = ids
    .map(id => queryOne('SELECT id, url, title, description, tags FROM bookmarks WHERE id = ?', [id]) as any)
    .filter(Boolean)

  if (targetBookmarks.length === 0) {
    return res.json({ success: true, processing: 0 })
  }

  // 异步处理
  batchTagsStatus.running = true
  batchTagsStatus.total = targetBookmarks.length
  batchTagsStatus.completed = 0
  batchTagsStatus.failed = 0
  batchTagsStatus.current = ''

  const categories = queryAll('SELECT name FROM categories ORDER BY orderIndex ASC')
  const existingCategories = categories.map((c: any) => c.name)

  // 异步启动，不阻塞响应
  ;(async () => {
    const CONCURRENCY = 2
    let index = 0

    async function processNext() {
      while (index < targetBookmarks.length) {
        const i = index++
        const bm = targetBookmarks[i]
        batchTagsStatus.current = bm.title || bm.url

        try {
          const result = await aiCategorize({
            url: bm.url,
            title: bm.title,
            description: bm.description || undefined,
            existingCategories,
          })

          if (result.tags && result.tags.length > 0) {
            // 合并已有标签和新标签（tags 在数据库中以逗号分隔存储）
            let existingTags: string[] = []
            if (bm.tags) {
              // 兼容旧的 JSON 格式和逗号分隔格式
              try {
                const parsed = JSON.parse(bm.tags)
                existingTags = Array.isArray(parsed) ? parsed : []
              } catch {
                existingTags = bm.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
              }
            }
            const merged = [...new Set([...existingTags, ...result.tags])]

            const db = getDatabase()
            db.run(
              'UPDATE bookmarks SET tags = ?, updatedAt = ? WHERE id = ?',
              [merged.filter(Boolean).join(','), new Date().toISOString(), bm.id]
            )

            // 同时更新描述（如果原来没有且 AI 有建议）
            if (!bm.description && result.summary) {
              db.run(
                'UPDATE bookmarks SET description = ? WHERE id = ?',
                [result.summary, bm.id]
              )
            }
          }

          batchTagsStatus.completed++
        } catch (err: any) {
          console.warn(`AI 标签失败 [${bm.id}]:`, err?.message || err)
          batchTagsStatus.completed++
          batchTagsStatus.failed++
        }
      }
    }

    const workers = Array.from(
      { length: Math.min(CONCURRENCY, targetBookmarks.length) },
      () => processNext()
    )
    await Promise.all(workers)

    try { saveDatabase() } catch {}
    console.log(`✅ AI 批量标签完成: ${batchTagsStatus.completed - batchTagsStatus.failed}/${batchTagsStatus.total} 成功`)
    batchTagsStatus.running = false
  })().catch(err => {
    console.error('AI 批量标签异常:', err)
    batchTagsStatus.running = false
  })

  res.json({ success: true, processing: targetBookmarks.length })
})

// GET /api/ai/batch-tags-status - 查询批量 AI 标签进度
router.get('/batch-tags-status', authMiddleware, (_req, res) => {
  res.json(batchTagsStatus)
})

// POST /api/ai/batch-classify - 批量 AI 智能分类（异步处理）
const batchClassifyStatus = {
  running: false,
  total: 0,
  completed: 0,
  failed: 0,
  current: '',
  newCategories: [] as string[],
}

router.post('/batch-classify', authMiddleware, async (req, res) => {
  if (!isAiConfigured()) {
    return res.status(503).json({ error: 'AI 服务未配置。请在后台设置中配置 AI 参数。' })
  }

  const { ids } = req.body as { ids: string[] }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请提供书签 ID 列表' })
  }

  if (batchClassifyStatus.running) {
    return res.status(409).json({ error: '已有 AI 分类任务进行中，请稍后再试' })
  }

  const targetBookmarks = ids
    .map(id => queryOne('SELECT id, url, title, description, tags, category FROM bookmarks WHERE id = ?', [id]) as any)
    .filter(Boolean)

  if (targetBookmarks.length === 0) {
    return res.json({ success: true, processing: 0 })
  }

  batchClassifyStatus.running = true
  batchClassifyStatus.total = targetBookmarks.length
  batchClassifyStatus.completed = 0
  batchClassifyStatus.failed = 0
  batchClassifyStatus.current = ''
  batchClassifyStatus.newCategories = []

  const categories = queryAll('SELECT id, name FROM categories ORDER BY orderIndex ASC')
  const existingCategories = categories.map((c: any) => c.name)
  const categoryMap = new Map<string, string>(categories.map((c: any) => [c.name, c.id]))

  ;(async () => {
    const CONCURRENCY = 2
    let index = 0
    const db = getDatabase()

    async function processNext() {
      while (index < targetBookmarks.length) {
        const i = index++
        const bm = targetBookmarks[i]
        batchClassifyStatus.current = bm.title || bm.url

        try {
          const result = await aiCategorize({
            url: bm.url,
            title: bm.title,
            description: bm.description || undefined,
            existingCategories: [...existingCategories, ...batchClassifyStatus.newCategories],
          })

          let categoryId: string | null = null
          const now = new Date().toISOString()

          if (result.isNewCategory) {
            // 检查是否在本批次中已创建
            if (categoryMap.has(result.category)) {
              categoryId = categoryMap.get(result.category)!
            } else {
              // 创建新分类
              const newId = crypto.randomUUID()
              const maxOrder = queryOne('SELECT MAX(orderIndex) as m FROM categories') as any
              const orderIndex = (maxOrder?.m ?? -1) + 1
              db.run(
                'INSERT INTO categories (id, name, orderIndex) VALUES (?, ?, ?)',
                [newId, result.category, orderIndex]
              )
              categoryId = newId
              categoryMap.set(result.category, newId)
              existingCategories.push(result.category)
              batchClassifyStatus.newCategories.push(result.category)
            }
          } else {
            categoryId = categoryMap.get(result.category) || null
          }

          if (categoryId) {
            db.run(
              'UPDATE bookmarks SET category = ?, updatedAt = ? WHERE id = ?',
              [categoryId, now, bm.id]
            )
          }

          // 同时更新标签和描述（与 batch-tags 一致）
          if (result.tags && result.tags.length > 0) {
            let existingTags: string[] = []
            if (bm.tags) {
              try {
                const parsed = JSON.parse(bm.tags)
                existingTags = Array.isArray(parsed) ? parsed : []
              } catch {
                existingTags = bm.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
              }
            }
            const merged = [...new Set([...existingTags, ...result.tags])]
            db.run(
              'UPDATE bookmarks SET tags = ?, updatedAt = ? WHERE id = ?',
              [merged.filter(Boolean).join(','), now, bm.id]
            )
          }

          if (!bm.description && result.summary) {
            db.run('UPDATE bookmarks SET description = ? WHERE id = ?', [result.summary, bm.id])
          }

          batchClassifyStatus.completed++
        } catch (err: any) {
          console.warn(`AI 分类失败 [${bm.id}]:`, err?.message || err)
          batchClassifyStatus.completed++
          batchClassifyStatus.failed++
        }
      }
    }

    const workers = Array.from(
      { length: Math.min(CONCURRENCY, targetBookmarks.length) },
      () => processNext()
    )
    await Promise.all(workers)

    try { saveDatabase() } catch {}
    console.log(`✅ AI 批量分类完成: ${batchClassifyStatus.completed - batchClassifyStatus.failed}/${batchClassifyStatus.total} 成功, 新增分类: ${batchClassifyStatus.newCategories.length}`)
    batchClassifyStatus.running = false
  })().catch(err => {
    console.error('AI 批量分类异常:', err)
    batchClassifyStatus.running = false
  })

  res.json({ success: true, processing: targetBookmarks.length })
})

// GET /api/ai/batch-classify-status - 查询批量 AI 分类进度
router.get('/batch-classify-status', authMiddleware, (_req, res) => {
  res.json(batchClassifyStatus)
})

// POST /api/ai/batch-enrich - 批量 AI 智能元数据优化（异步处理）
const batchEnrichStatus = {
  running: false,
  total: 0,
  completed: 0,
  failed: 0,
  current: '',
}

router.post('/batch-enrich', authMiddleware, async (req, res) => {
  if (!isAiConfigured()) {
    return res.status(503).json({ error: 'AI 服务未配置。请在后台设置中配置 AI 参数。' })
  }

  const { ids, lang } = req.body as { ids: string[]; lang?: string }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请提供书签 ID 列表' })
  }

  if (batchEnrichStatus.running) {
    return res.status(409).json({ error: '已有 AI 元数据任务进行中，请稍后再试' })
  }

  const targetBookmarks = ids
    .map(id => queryOne('SELECT id, url, title, description, icon, tags FROM bookmarks WHERE id = ?', [id]) as any)
    .filter(Boolean)

  if (targetBookmarks.length === 0) {
    return res.json({ success: true, processing: 0 })
  }

  batchEnrichStatus.running = true
  batchEnrichStatus.total = targetBookmarks.length
  batchEnrichStatus.completed = 0
  batchEnrichStatus.failed = 0
  batchEnrichStatus.current = ''

  ;(async () => {
    const CONCURRENCY = 2
    let index = 0
    const db = getDatabase()

    async function processNext() {
      while (index < targetBookmarks.length) {
        const i = index++
        const bm = targetBookmarks[i]
        batchEnrichStatus.current = bm.title || bm.url

        try {
          const result = await aiEnrichMetadata({
            url: bm.url,
            title: bm.title,
            description: bm.description || undefined,
            lang,
          })

          const now = new Date().toISOString()
          const updates: string[] = []
          const values: any[] = []

          if (result.title && result.title !== bm.title) {
            updates.push('title = ?')
            values.push(result.title)
          }

          if (result.description) {
            updates.push('description = ?')
            values.push(result.description)
          }

          if (result.iconName && result.iconName.includes(':')) {
            updates.push('icon = ?')
            values.push(result.iconName)
          }

          // 合并标签
          if (result.tags && result.tags.length > 0) {
            let existingTags: string[] = []
            if (bm.tags) {
              try {
                const parsed = JSON.parse(bm.tags)
                existingTags = Array.isArray(parsed) ? parsed : []
              } catch {
                existingTags = bm.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
              }
            }
            const merged = [...new Set([...existingTags, ...result.tags])]
            updates.push('tags = ?')
            values.push(merged.filter(Boolean).join(','))
          }

          if (updates.length > 0) {
            updates.push('updatedAt = ?')
            values.push(now, bm.id)
            db.run(
              `UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`,
              values
            )
          }

          batchEnrichStatus.completed++
        } catch (err: any) {
          console.warn(`AI 元数据优化失败 [${bm.id}]:`, err?.message || err)
          batchEnrichStatus.completed++
          batchEnrichStatus.failed++
        }
      }
    }

    const workers = Array.from(
      { length: Math.min(CONCURRENCY, targetBookmarks.length) },
      () => processNext()
    )
    await Promise.all(workers)

    try { saveDatabase() } catch {}
    console.log(`✅ AI 批量元数据优化完成: ${batchEnrichStatus.completed - batchEnrichStatus.failed}/${batchEnrichStatus.total} 成功`)
    batchEnrichStatus.running = false
  })().catch(err => {
    console.error('AI 批量元数据优化异常:', err)
    batchEnrichStatus.running = false
  })

  res.json({ success: true, processing: targetBookmarks.length })
})

// GET /api/ai/batch-enrich-status - 查询批量 AI 元数据优化进度
router.get('/batch-enrich-status', authMiddleware, (_req, res) => {
  res.json(batchEnrichStatus)
})

// GET /api/ai/config - 获取 AI 配置（隐藏 API Key）
router.get('/config', authMiddleware, (_req, res) => {
  try {
    const rows = queryAll("SELECT key, value FROM settings WHERE key LIKE 'ai_%'")
    const config: Record<string, string> = {}
    rows.forEach((r: any) => { config[r.key] = r.value })

    res.json({
      provider: config['ai_provider'] || '',
      apiKey: config['ai_apiKey'] ? '••••••' + (config['ai_apiKey'].slice(-4) || '') : '',
      apiBase: config['ai_apiBase'] || '',
      model: config['ai_model'] || '',
    })
  } catch (error: any) {
    res.status(500).json({ error: '获取 AI 配置失败' })
  }
})

// PUT /api/ai/config - 保存 AI 配置
router.put('/config', authMiddleware, validateBody(configSchema), (req, res) => {
  try {
    const { provider, apiKey, apiBase, model } = req.body
    const now = new Date().toISOString()

    const fields = [
      { key: 'ai_provider', value: provider || '' },
      { key: 'ai_apiBase', value: apiBase || '' },
      { key: 'ai_model', value: model || '' },
    ]

    // 只有在前端传了非掩码的 apiKey 时才更新
    if (apiKey && !apiKey.startsWith('••••••')) {
      fields.push({ key: 'ai_apiKey', value: apiKey })
    }

    for (const { key, value } of fields) {
      const existing = queryOne('SELECT * FROM settings WHERE key = ?', [key])
      if (existing) {
        run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [value, now, key])
      } else {
        run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', [key, value, now])
      }
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('保存 AI 配置失败:', error)
    res.status(500).json({ error: '保存 AI 配置失败' })
  }
})

// POST /api/ai/test - 测试 AI 连接
router.post('/test', authMiddleware, async (_req, res) => {
  try {
    const result = await aiTestConnection()
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || '测试失败' })
  }
})

export default router
