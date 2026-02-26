import { Router } from 'express'
import { z } from 'zod'
import { validateBody } from '../schemas.js'
import { aiCategorize, aiChat, aiTestConnection, isAiConfigured, getAiFullStatus } from '../services/ai.js'
import { queryAll, queryOne, run } from '../utils/index.js'
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
