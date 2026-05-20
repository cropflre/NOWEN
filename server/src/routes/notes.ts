import { Router } from 'express'
import type { Request, Response } from 'express'
import { queryAll, queryOne, run, parseTags, serializeTags } from '../utils/index.js'
import { authMiddleware } from '../middleware/index.js'
import { validateBody, createNoteSchema, updateNoteSchema } from '../schemas.js'
import { generateId, markDirty } from '../db.js'
import {
  loadConfig as loadNowenNoteConfig,
  pushNote as pushNoteToRemote,
  getRemoteNote,
  pullFromRemote,
  streamAI,
} from '../services/nowenNote.js'

const router = Router()

/**
 * 自动同步触发器
 * - 仅在 syncMode === 'auto' | 'bidirectional' 时触发
 * - 异步 fire-and-forget,不阻塞 HTTP 响应
 * - 内部错误捕获,失败时 pushNote 自身已把 syncStatus 置回 'local'
 */
function triggerAutoPushIfNeeded(noteId: string): void {
  try {
    const cfg = loadNowenNoteConfig()
    if (!cfg) return
    const mode = cfg.syncMode || 'auto'
    if (mode !== 'auto' && mode !== 'bidirectional') return
    // 异步推送,不 await
    pushNoteToRemote(noteId)
      .then((result) => {
        markDirty()
        if (!result.success) {
          console.warn('[notes] auto-push failed:', noteId, result.error, 'status=', result.syncStatus)
        }
      })
      .catch((err) => {
        console.warn('[notes] auto-push exception:', noteId, err)
      })
  } catch (err) {
    console.warn('[notes] triggerAutoPushIfNeeded error:', err)
  }
}

/**
 * 把数据库行转换为前端期望的 QuickNote 形态
 * - tags 字符串 → 数组
 * - syncStatus 兜底为 'local'
 */
function shapeNote(row: any): any {
  if (!row) return row
  return {
    ...row,
    tags: parseTags(row.tags),
    syncStatus: row.syncStatus || 'local',
  }
}

// 获取所有灵感速记（按更新时间倒序）
router.get('/', (req: Request, res: Response) => {
  try {
    const notes = queryAll('SELECT * FROM quick_notes ORDER BY updatedAt DESC') as any[]
    res.json(notes.map(shapeNote))
  } catch (error) {
    console.error('获取灵感速记失败:', error)
    res.status(500).json({ error: '获取灵感速记失败' })
  }
})

/**
 * 同步状态汇总（GET /api/notes/sync-status）
 * 返回 { configured, syncMode, baseUrl, counts: { synced, syncing, local, conflict, total } }
 * baseUrl 用于前端跳转，apiToken 永远不下发。
 */
router.get('/sync-status', (req: Request, res: Response) => {
  try {
    const cfg = loadNowenNoteConfig()
    const counts = { synced: 0, syncing: 0, local: 0, conflict: 0, total: 0 }
    const rows = queryAll('SELECT syncStatus FROM quick_notes') as Array<{ syncStatus: string | null }>
    rows.forEach((r) => {
      counts.total += 1
      const s = (r.syncStatus || 'local') as keyof typeof counts
      if (s in counts) (counts as any)[s] += 1
      else counts.local += 1
    })
    res.json({
      configured: !!cfg,
      syncMode: cfg?.syncMode || 'auto',
      baseUrl: cfg?.baseUrl || null,
      counts,
    })
  } catch (error) {
    console.error('获取同步状态失败:', error)
    res.status(500).json({ error: '获取同步状态失败' })
  }
})

// 创建灵感速记（需要认证）
router.post('/', authMiddleware, validateBody(createNoteSchema), (req: Request, res: Response) => {
  try {
    const { content, tags, notebookId } = req.body as { content: string; tags?: string[]; notebookId?: string | null }
    const id = generateId()
    const now = new Date().toISOString()

    run(
      `INSERT INTO quick_notes (id, content, tags, notebookId, syncStatus, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, content, serializeTags(tags), notebookId ?? null, 'local', now, now]
    )
    markDirty()

    const note = queryOne('SELECT * FROM quick_notes WHERE id = ?', [id])

    // 自动同步：syncMode 为 auto / bidirectional 时后台推送（不阻塞响应）
    triggerAutoPushIfNeeded(id)

    res.status(201).json(shapeNote(note))
  } catch (error) {
    console.error('创建灵感速记失败:', error)
    res.status(500).json({ error: '创建灵感速记失败' })
  }
})

// 更新灵感速记（需要认证）
router.patch('/:id', authMiddleware, validateBody(updateNoteSchema), (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { content, tags, notebookId } = req.body as {
      content?: string
      tags?: string[]
      notebookId?: string | null
    }
    const now = new Date().toISOString()

    const existing = queryOne('SELECT * FROM quick_notes WHERE id = ?', [id]) as any
    if (!existing) {
      return res.status(404).json({ error: '灵感速记不存在' })
    }

    // 仅传入的字段才更新（部分更新语义），同时若内容/标签发生变化则状态回退到 'local'
    // 避免 P0 旧数据 syncStatus 为 NULL 的情况
    const fields: string[] = []
    const params: any[] = []

    let contentChanged = false
    if (typeof content === 'string') {
      contentChanged = content !== existing.content
      fields.push('content = ?')
      params.push(content)
    }
    if (tags !== undefined) {
      fields.push('tags = ?')
      params.push(serializeTags(tags))
    }
    if (notebookId !== undefined) {
      fields.push('notebookId = ?')
      params.push(notebookId)
    }

    // 内容有变化且之前是 synced → 退回 local，等待重新推送
    if (contentChanged && existing.syncStatus === 'synced') {
      fields.push('syncStatus = ?')
      params.push('local')
    }

    fields.push('updatedAt = ?')
    params.push(now)
    params.push(id)

    if (fields.length === 1) {
      // 只有 updatedAt，没有其他变更：直接返回现有
      return res.json(shapeNote(existing))
    }

    run(`UPDATE quick_notes SET ${fields.join(', ')} WHERE id = ?`, params)
    markDirty()

    const note = queryOne('SELECT * FROM quick_notes WHERE id = ?', [id])

    // 自动同步：内容/标签变化时,根据 syncMode 异步推送
    if (contentChanged || tags !== undefined) {
      triggerAutoPushIfNeeded(id)
    }

    res.json(shapeNote(note))
  } catch (error) {
    console.error('更新灵感速记失败:', error)
    res.status(500).json({ error: '更新灵感速记失败' })
  }
})

// 删除灵感速记（需要认证）
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existing = queryOne('SELECT * FROM quick_notes WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: '灵感速记不存在' })
    }

    run('DELETE FROM quick_notes WHERE id = ?', [id])
    markDirty()

    res.json({ success: true })
  } catch (error) {
    console.error('删除灵感速记失败:', error)
    res.status(500).json({ error: '删除灵感速记失败' })
  }
})

/**
 * 推送本条速记到 nowen-note（POST /api/notes/:id/push）
 * 成功返回最新 QuickNote；失败返回 502 + 错误信息。冲突返回 409。
 *
 * Body 支持 { forceMode?: 'force-push' | 'force-pull' }：
 *   - force-push：忽略远端版本强行覆盖（解决冲突时"用本地"）
 *   - force-pull：用远端覆盖本地（解决冲突时"用远端"）
 */
router.post('/:id/push', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const existing = queryOne('SELECT * FROM quick_notes WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: '灵感速记不存在' })
    }

    const cfg = loadNowenNoteConfig()
    if (!cfg) {
      return res.status(400).json({
        error: 'nowen-note 未配置',
        code: 'NOWEN_NOTE_NOT_CONFIGURED',
      })
    }

    const forceMode = (req.body?.forceMode === 'force-push' || req.body?.forceMode === 'force-pull')
      ? req.body.forceMode
      : undefined

    const result = await pushNoteToRemote(id, { forceMode })
    markDirty()

    const note = queryOne('SELECT * FROM quick_notes WHERE id = ?', [id])
    if (!result.success) {
      const status = result.syncStatus === 'conflict' ? 409 : 502
      return res.status(status).json({
        error: result.error || '推送失败',
        syncStatus: result.syncStatus,
        note: shapeNote(note),
        remoteSnapshot: result.remoteSnapshot || null,
      })
    }
    res.json(shapeNote(note))
  } catch (error) {
    console.error('推送灵感速记失败:', error)
    res.status(500).json({ error: '推送灵感速记失败' })
  }
})

/**
 * 拉取远端笔记快照（GET /api/notes/:id/remote）
 * 用于冲突对比 UI：返回 { title, contentText, updatedAt } 三段。
 */
router.get('/:id/remote', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const local = queryOne('SELECT remoteId FROM quick_notes WHERE id = ?', [id]) as
      | { remoteId: string | null }
      | undefined
    if (!local) return res.status(404).json({ error: '速记不存在' })
    if (!local.remoteId) return res.status(404).json({ error: '该速记尚未关联远端笔记' })

    const cfg = loadNowenNoteConfig()
    if (!cfg) return res.status(400).json({ error: 'nowen-note 未配置' })

    const remote = await getRemoteNote(cfg, local.remoteId)
    if (!remote) return res.status(404).json({ error: '远端笔记已删除' })

    res.json({
      title: remote.title,
      contentText: remote.contentText || '',
      updatedAt: remote.updatedAt,
      tags: (remote.tags || []).map((t) => t.name),
    })
  } catch (error) {
    console.error('拉取远端笔记失败:', error)
    res.status(500).json({ error: '拉取远端笔记失败' })
  }
})

/**
 * 全量从远端"灵感收件箱"拉取（POST /api/notes/sync-pull）
 * 双向同步开启时由前端定时调用；返回统计 { pulled, created, updated, skipped }。
 */
router.post('/sync-pull', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const cfg = loadNowenNoteConfig()
    if (!cfg) return res.status(400).json({ ok: false, error: 'nowen-note 未配置' })
    const result = await pullFromRemote()
    markDirty()
    if (!result.ok) return res.status(502).json(result)
    res.json(result)
  } catch (error) {
    console.error('拉取远端速记失败:', error)
    res.status(500).json({ ok: false, error: '拉取失败' })
  }
})

/**
 * AI 写作助手代理（POST /api/notes/ai/chat）
 * Body: { action, text, customPrompt?, context? }
 * 流式 SSE 透传 nowen-note /api/ai/chat 的响应。
 *
 * 关键设计：apiToken 在服务端加上，浏览器侧永远拿不到。
 */
router.post('/ai/chat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cfg = loadNowenNoteConfig()
    if (!cfg) return res.status(400).json({ error: 'nowen-note 未配置' })

    const { action, text, customPrompt, context } = req.body || {}
    if (!action || !text) {
      return res.status(400).json({ error: '参数 action 和 text 必填' })
    }

    const upstream = await streamAI({ action, text, customPrompt, context })
    // 这里的 Response 是浏览器/Node 全局的 fetch Response，显式用 globalThis 避免与上面 import 的 express.Response 类型混淆
    if (!(upstream instanceof globalThis.Response)) {
      return res.status(upstream.status || 502).json({ error: upstream.error })
    }
    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '')
      return res.status(upstream.status).json({
        error: `AI 上游错误 ${upstream.status}：${errText.slice(0, 200)}`,
      })
    }

    // 流式透传：保持 SSE 头
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // 防 nginx 缓冲

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()

    // 客户端断开时主动取消 upstream
    req.on('close', () => {
      try { reader.cancel() } catch {}
    })

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) res.write(decoder.decode(value, { stream: true }))
      }
    } catch (err) {
      console.warn('[notes/ai] stream error:', err)
    } finally {
      res.end()
    }
  } catch (error) {
    console.error('AI 代理失败:', error)
    if (!res.headersSent) res.status(500).json({ error: 'AI 代理失败' })
    else res.end()
  }
})

export default router
