import { Router } from 'express'
import { z } from 'zod'
import { validateBody } from '../schemas.js'
import { aiCategorize, aiChat, aiTestConnection, isAiConfigured, getAiFullStatus } from '../services/ai.js'
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
