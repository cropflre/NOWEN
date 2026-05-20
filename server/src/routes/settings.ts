import { Router, Request, Response } from 'express'
import { queryAll, queryOne, run } from '../utils/index.js'
import { authMiddleware } from '../middleware/index.js'
import { validateBody, updateSettingsSchema } from '../schemas.js'
import { testConnection, NowenNoteConfig } from '../services/nowenNote.js'
import { setupWithCredentials, revokeRemoteToken } from '../services/nowenNoteSetup.js'

const router = Router()

/**
 * 把 settings.nowenNote 字符串 JSON 在响应里安全展开：
 * - 永远不下发 apiToken（仅返回是否已配置 + 预览 4 位）
 * - 下发 baseUrl / defaultNotebookId / syncMode 供前端展示
 */
function safeShapeSettings(rawList: Array<{ key: string; value: string }>): Record<string, any> {
  const result: Record<string, any> = {}
  rawList.forEach((s) => {
    if (s.key === 'nowenNote') {
      try {
        const parsed = s.value ? JSON.parse(s.value) : {}
        const token = typeof parsed.apiToken === 'string' ? parsed.apiToken : ''
        result.nowenNote = JSON.stringify({
          baseUrl: parsed.baseUrl || '',
          // 关键：apiToken 永远不下发，前端只看到是否存在和预览前 4 位
          apiTokenPreview: token ? token.slice(0, 6) + '…' + token.slice(-2) : '',
          hasToken: !!token,
          // 仅展示用，便于用户在 nowen-note 那边吊销时认出是哪条
          tokenName: parsed.tokenName || '',
          tokenId: parsed.tokenId || '',
          defaultNotebookId: parsed.defaultNotebookId || '',
          syncMode: parsed.syncMode || 'auto',
        })
      } catch {
        result.nowenNote = ''
      }
    } else {
      result[s.key] = s.value
    }
  })
  return result
}

// 获取站点设置
router.get('/', (req, res) => {
  try {
    const settings = queryAll('SELECT * FROM settings') as Array<{ key: string; value: string }>
    res.json(safeShapeSettings(settings))
  } catch (error) {
    console.error('获取设置失败:', error)
    res.status(500).json({ error: '获取设置失败' })
  }
})

// 更新站点设置（需要认证）
router.patch('/', authMiddleware, validateBody(updateSettingsSchema), (req: Request, res: Response) => {
  try {
    const updates = req.body
    const now = new Date().toISOString()

    for (const [key, value] of Object.entries(updates)) {
      // nowenNote 特殊处理：合并而非覆盖（避免前端不传 apiToken 时被清空）
      if (key === 'nowenNote') {
        const existing = queryOne('SELECT value FROM settings WHERE key = ?', ['nowenNote']) as
          | { value: string }
          | undefined
        let oldCfg: any = {}
        if (existing?.value) {
          try { oldCfg = JSON.parse(existing.value) } catch { oldCfg = {} }
        }
        let incoming: any = {}
        if (typeof value === 'string') {
          try { incoming = JSON.parse(value) } catch { incoming = {} }
        } else if (typeof value === 'object' && value !== null) {
          incoming = value
        }
        // 关键合并规则：
        //   - apiToken 仅当传入非空字符串时才覆盖（前端不传 → 保留原值）
        //   - 其他字段照常覆盖（即使传空字符串也是用户意图）
        const merged: any = {
          baseUrl: incoming.baseUrl ?? oldCfg.baseUrl ?? '',
          defaultNotebookId: incoming.defaultNotebookId ?? oldCfg.defaultNotebookId ?? '',
          syncMode: incoming.syncMode ?? oldCfg.syncMode ?? 'auto',
          apiToken: typeof incoming.apiToken === 'string' && incoming.apiToken
            ? incoming.apiToken
            : (oldCfg.apiToken || ''),
        }
        const serialized = JSON.stringify(merged)
        if (existing) {
          run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [serialized, now, key])
        } else {
          run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', [key, serialized, now])
        }
        continue
      }

      const existing = queryOne('SELECT * FROM settings WHERE key = ?', [key])
      if (existing) {
        run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [value, now, key])
      } else {
        run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', [key, value, now])
      }
    }

    // 返回更新后的所有设置（apiToken 不下发）
    const settings = queryAll('SELECT * FROM settings') as Array<{ key: string; value: string }>
    res.json(safeShapeSettings(settings))
  } catch (error) {
    console.error('更新设置失败:', error)
    res.status(500).json({ error: '更新设置失败' })
  }
})

/**
 * 测试 nowen-note 连通性（POST /api/settings/nowen-note/test）
 * Body 可选：{ baseUrl, apiToken } —— 不传则使用已存的配置
 * （便于"边填边测"，无需先保存即可验证）
 */
router.post('/nowen-note/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { baseUrl, apiToken } = (req.body || {}) as { baseUrl?: string; apiToken?: string }

    let cfg: NowenNoteConfig
    if (baseUrl && apiToken) {
      cfg = { baseUrl: baseUrl.replace(/\/+$/, ''), apiToken }
    } else {
      // 回退到已存配置
      const row = queryOne('SELECT value FROM settings WHERE key = ?', ['nowenNote']) as
        | { value: string }
        | undefined
      if (!row?.value) {
        return res.status(400).json({ ok: false, error: '尚未配置 nowen-note，请先填入 baseUrl 与 apiToken' })
      }
      try {
        const parsed = JSON.parse(row.value)
        if (!parsed.baseUrl || !parsed.apiToken) {
          return res.status(400).json({ ok: false, error: 'nowen-note 配置不完整' })
        }
        cfg = {
          baseUrl: String(parsed.baseUrl).replace(/\/+$/, ''),
          apiToken: parsed.apiToken,
        }
      } catch {
        return res.status(400).json({ ok: false, error: 'nowen-note 配置解析失败' })
      }
    }

    const result = await testConnection(cfg)
    if (result.ok) {
      return res.json({ ok: true, notebooksCount: result.notebooksCount })
    }
    return res.status(502).json({ ok: false, error: result.error, status: result.status })
  } catch (error) {
    console.error('测试 nowen-note 连通性失败:', error)
    res.status(500).json({ ok: false, error: '测试失败' })
  }
})

/**
 * 一键连接 nowen-note（POST /api/settings/nowen-note/setup）
 *
 * 用户在 NOWEN 设置面板填写：URL + 用户名 + 密码
 * 后端代为完成：登录 → 创建 Personal API Token → 持久化 Token → 丢弃密码
 *
 * Body: { baseUrl: string, username: string, password: string, tokenName?: string }
 *
 * 成功响应：
 *   { ok: true, tokenPreview: "nkn_xxx…ab", tokenName, tokenId }
 *
 * 失败响应（带 code 便于前端做引导）：
 *   { ok: false, error: string, code: 'AUTH_FAILED' | 'REQUIRES_2FA' | ... }
 */
router.post('/nowen-note/setup', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { baseUrl, username, password, tokenName } = (req.body || {}) as {
      baseUrl?: string
      username?: string
      password?: string
      tokenName?: string
    }

    if (!baseUrl || !username || !password) {
      return res.status(400).json({
        ok: false,
        error: '请填写完整的服务地址、用户名和密码',
        code: 'INVALID_PARAMS',
      })
    }

    // 调 service 完成核心流程
    const result = await setupWithCredentials({
      baseUrl,
      username,
      password,
      tokenName,
    })

    // **安全关键**：这里之后无论成功失败都不要再触碰 password 变量；它会随响应处理结束被 GC
    if (!result.ok) {
      // 401/2FA/锁定 → 返回 4xx 给前端做特定 UI；其它 → 502
      const statusMap: Record<string, number> = {
        INVALID_URL: 400,
        INVALID_PARAMS: 400,
        AUTH_FAILED: 401,
        REQUIRES_2FA: 422, // Unprocessable—告诉前端走"手填 Token"路径
        ACCOUNT_DISABLED: 403,
        ACCOUNT_LOCKED: 423,
        RATE_LIMITED: 429,
        TIMEOUT: 504,
        NETWORK_ERROR: 502,
        TOKEN_CREATE_FAILED: 502,
      }
      const status = statusMap[result.code || 'UNKNOWN'] || 500
      return res.status(status).json({
        ok: false,
        error: result.error,
        code: result.code,
      })
    }

    // 持久化：覆盖 settings.nowenNote 中的 apiToken / tokenId / baseUrl
    const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '')
    const existingRow = queryOne('SELECT value FROM settings WHERE key = ?', [
      'nowenNote',
    ]) as { value: string } | undefined

    let oldCfg: any = {}
    if (existingRow?.value) {
      try {
        oldCfg = JSON.parse(existingRow.value)
      } catch {
        oldCfg = {}
      }
    }

    const merged = {
      baseUrl: cleanBaseUrl,
      apiToken: result.apiToken!, // setup 成功必有
      tokenId: result.tokenId || '',
      tokenName: result.tokenName || '',
      // 一键连接默认进自动同步模式
      defaultNotebookId: oldCfg.defaultNotebookId || '',
      syncMode: oldCfg.syncMode || 'auto',
    }
    const serialized = JSON.stringify(merged)
    const now = new Date().toISOString()
    if (existingRow) {
      run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [
        serialized,
        now,
        'nowenNote',
      ])
    } else {
      run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', [
        'nowenNote',
        serialized,
        now,
      ])
    }

    // Token 明文绝不下发——只给前端一个预览
    const token = result.apiToken!
    const tokenPreview = token.slice(0, 6) + '…' + token.slice(-2)

    return res.json({
      ok: true,
      tokenPreview,
      tokenName: result.tokenName,
      tokenId: result.tokenId,
      baseUrl: cleanBaseUrl,
    })
  } catch (error) {
    console.error('一键连接 nowen-note 失败:', error)
    res.status(500).json({ ok: false, error: '一键连接失败' })
  }
})

/**
 * 断开 nowen-note 连接（DELETE /api/settings/nowen-note/disconnect）
 *
 * 行为：
 *   1. best-effort 调远端 DELETE /api/tokens/:id 吊销 Token（失败不阻塞）
 *   2. 清空 settings.nowenNote 中的 apiToken / tokenId（保留 baseUrl 便于用户重连）
 *
 * 这种"软断开"设计：用户重连时只需重新输入密码即可，不用再填 URL。
 */
router.delete('/nowen-note/disconnect', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const row = queryOne('SELECT value FROM settings WHERE key = ?', ['nowenNote']) as
      | { value: string }
      | undefined
    if (!row?.value) {
      return res.json({ ok: true, alreadyDisconnected: true })
    }

    let cfg: any = {}
    try {
      cfg = JSON.parse(row.value)
    } catch {
      cfg = {}
    }

    // best-effort 远端吊销
    let revokeOk = true
    let revokeError: string | undefined
    if (cfg.baseUrl && cfg.apiToken) {
      const r = await revokeRemoteToken(cfg.baseUrl, cfg.apiToken, cfg.tokenId)
      revokeOk = r.ok
      revokeError = r.error
    }

    // 清空敏感字段，保留 baseUrl 便于重连
    const cleared = {
      baseUrl: cfg.baseUrl || '',
      apiToken: '',
      tokenId: '',
      tokenName: '',
      defaultNotebookId: cfg.defaultNotebookId || '',
      syncMode: cfg.syncMode || 'auto',
    }
    const now = new Date().toISOString()
    run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [
      JSON.stringify(cleared),
      now,
      'nowenNote',
    ])

    return res.json({ ok: true, remoteRevoked: revokeOk, remoteError: revokeError })
  } catch (error) {
    console.error('断开 nowen-note 失败:', error)
    res.status(500).json({ ok: false, error: '断开失败' })
  }
})

export default router
