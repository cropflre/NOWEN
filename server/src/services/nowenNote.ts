/**
 * nowen-note HTTP Client
 * ---------------------------------------------------------------------------
 * 封装与 nowen-note 知识库的通信，用于将 NOWEN 灵感速记双向同步到 nowen-note。
 *
 * 认证：使用 nowen-note 的 Personal API Token（前缀 nkn_），通过 Authorization
 *      Bearer 头携带。Token 由用户在站点设置中填入。
 *
 * 路由约定（来自 nowen-note backend/src/index.ts）：
 *   - POST   /api/notes        创建笔记
 *   - PUT    /api/notes/:id    更新笔记
 *   - GET    /api/notes/:id    读取笔记（用于冲突检测）
 *   - GET    /api/notebooks    列出笔记本（树形）
 *   - POST   /api/notebooks    创建笔记本（用于自动创建"灵感收件箱"）
 */

import { queryOne, run } from '../utils/index.js'

/** nowen-note 站点配置（从 settings 表读取） */
export interface NowenNoteConfig {
  baseUrl: string
  apiToken: string
  defaultNotebookId?: string | null
  /** 同步模式：manual | auto | bidirectional，默认 auto */
  syncMode?: 'manual' | 'auto' | 'bidirectional'
}

/** nowen-note 笔记本节点（仅取我们需要的字段） */
export interface RemoteNotebook {
  id: string
  name: string
  parentId: string | null
  icon?: string
  color?: string | null
  noteCount?: number
  workspaceId?: string | null
}

/** nowen-note 笔记返回结构（按需取关键字段） */
export interface RemoteNote {
  id: string
  title: string
  content: string
  contentText?: string
  notebookId?: string | null
  workspaceId?: string | null
  tags?: Array<{ id: string; name: string }>
  version?: number
  createdAt: string
  updatedAt: string
}

/**
 * 从 settings 表读取 nowen-note 配置
 * 配置以 JSON 形式存储在 key="nowenNote" 下，避免 settings 表里堆放过多键
 */
export function loadConfig(): NowenNoteConfig | null {
  const row = queryOne('SELECT value FROM settings WHERE key = ?', ['nowenNote']) as
    | { value: string }
    | undefined
  if (!row || !row.value) return null
  try {
    const cfg = JSON.parse(row.value) as Partial<NowenNoteConfig>
    if (!cfg.baseUrl || !cfg.apiToken) return null
    return {
      baseUrl: stripTrailingSlash(cfg.baseUrl),
      apiToken: cfg.apiToken,
      defaultNotebookId: cfg.defaultNotebookId || null,
      syncMode: cfg.syncMode || 'auto',
    }
  } catch {
    return null
  }
}

/** 判断站点是否已配置 nowen-note（前端通过 settings 拿到 baseUrl 即视为已配置，token 不会下发） */
export function isConfigured(): boolean {
  return loadConfig() !== null
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

/** 通用请求封装 */
async function request<T>(
  cfg: NowenNoteConfig,
  path: string,
  init: RequestInit = {},
  timeoutMs = 10000,
): Promise<T> {
  const url = `${cfg.baseUrl}${path}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiToken}`,
      ...((init.headers as Record<string, string>) || {}),
    }
    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new NowenNoteError(
        `nowen-note ${init.method || 'GET'} ${path} 失败 (${res.status}): ${text || res.statusText}`,
        res.status,
      )
    }
    // 204 No Content
    if (res.status === 204) return undefined as unknown as T
    return (await res.json()) as T
  } catch (err: any) {
    if (err instanceof NowenNoteError) throw err
    if (err?.name === 'AbortError') {
      throw new NowenNoteError(`请求 nowen-note 超时（${timeoutMs}ms）`, 0)
    }
    throw new NowenNoteError(`请求 nowen-note 失败：${err?.message || err}`, 0)
  } finally {
    clearTimeout(timer)
  }
}

/** 自定义错误，方便上层根据 status 区分网络/鉴权/业务错误 */
export class NowenNoteError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'NowenNoteError'
    this.status = status
  }
}

// ========== 业务方法 ==========

/** 列出全部笔记本（个人空间） */
export async function listNotebooks(cfg: NowenNoteConfig): Promise<RemoteNotebook[]> {
  return request<RemoteNotebook[]>(cfg, '/api/notebooks?workspaceId=personal', { method: 'GET' })
}

/** 创建笔记本（用于自动创建"灵感收件箱"） */
export async function createNotebook(
  cfg: NowenNoteConfig,
  name: string,
  icon = '💡',
): Promise<RemoteNotebook> {
  return request<RemoteNotebook>(cfg, '/api/notebooks', {
    method: 'POST',
    body: JSON.stringify({ name, icon, parentId: null, workspaceId: null }),
  })
}

/**
 * 确保"灵感收件箱"笔记本存在；返回笔记本 ID。
 * 优先查找名为 INBOX_NAME 的笔记本，找不到则创建。
 */
const INBOX_NAME = '灵感收件箱'
export async function ensureInboxNotebook(cfg: NowenNoteConfig): Promise<string> {
  // 配置里指定了默认笔记本，直接用
  if (cfg.defaultNotebookId) return cfg.defaultNotebookId
  const list = await listNotebooks(cfg)
  const found = list.find((n) => n.name === INBOX_NAME)
  if (found) return found.id
  const created = await createNotebook(cfg, INBOX_NAME, '💡')
  return created.id
}

/** 创建远端笔记 */
export async function createRemoteNote(
  cfg: NowenNoteConfig,
  payload: {
    title: string
    content: string
    contentText: string
    notebookId: string
  },
): Promise<RemoteNote> {
  return request<RemoteNote>(cfg, '/api/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** 更新远端笔记（PUT，需要带 version 用于乐观锁；version 通过预先 GET 获取） */
export async function updateRemoteNote(
  cfg: NowenNoteConfig,
  remoteId: string,
  payload: {
    title?: string
    content?: string
    contentText?: string
    version: number
  },
): Promise<RemoteNote> {
  return request<RemoteNote>(cfg, `/api/notes/${remoteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/** 读取远端笔记（用于冲突检测 / 拿 version） */
export async function getRemoteNote(
  cfg: NowenNoteConfig,
  remoteId: string,
): Promise<RemoteNote | null> {
  try {
    return await request<RemoteNote>(cfg, `/api/notes/${remoteId}`, { method: 'GET' })
  } catch (err) {
    if (err instanceof NowenNoteError && err.status === 404) return null
    throw err
  }
}

/** 连通性测试：调用 GET /api/notebooks 验证 baseUrl + token 是否有效 */
export async function testConnection(
  cfg: NowenNoteConfig,
): Promise<{ ok: true; notebooksCount: number } | { ok: false; error: string; status: number }> {
  try {
    const list = await listNotebooks(cfg)
    return { ok: true, notebooksCount: list.length }
  } catch (err) {
    if (err instanceof NowenNoteError) {
      return { ok: false, error: err.message, status: err.status }
    }
    return { ok: false, error: String(err), status: 0 }
  }
}

// ========== 标签同步 ==========

export interface RemoteTag {
  id: string
  name: string
  color?: string
}

/** 列出全部标签（个人空间） */
export async function listTags(cfg: NowenNoteConfig): Promise<RemoteTag[]> {
  return request<RemoteTag[]>(cfg, '/api/tags?workspaceId=personal', { method: 'GET' })
}

/**
 * 确保标签存在并返回 id；
 * 1) 先在已有标签里按 name 匹配；
 * 2) 没有则 POST 创建（409 时再次 GET 拿最新列表回查，兜底重名）。
 *
 * 维护一个进程内 LRU 缓存以避免每次 push 都打两次 list。
 */
const tagCache: Map<string, { id: string; ts: number }> = new Map()
const TAG_CACHE_TTL_MS = 60_000

export async function ensureTag(cfg: NowenNoteConfig, name: string): Promise<string | null> {
  const key = `${cfg.baseUrl}::${name}`
  const cached = tagCache.get(key)
  if (cached && Date.now() - cached.ts < TAG_CACHE_TTL_MS) return cached.id

  try {
    const list = await listTags(cfg)
    const found = list.find((t) => t.name === name)
    if (found) {
      tagCache.set(key, { id: found.id, ts: Date.now() })
      return found.id
    }
    try {
      const created = await request<RemoteTag>(cfg, '/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      tagCache.set(key, { id: created.id, ts: Date.now() })
      return created.id
    } catch (err) {
      if (err instanceof NowenNoteError && err.status === 409) {
        // 重名冲突：刷新一遍列表，找到那条
        const refreshed = await listTags(cfg)
        const f2 = refreshed.find((t) => t.name === name)
        if (f2) {
          tagCache.set(key, { id: f2.id, ts: Date.now() })
          return f2.id
        }
      }
      // 其他错误：跳过这个标签，不阻塞主流程
      console.warn('[nowen-note] ensureTag failed:', name, err)
      return null
    }
  } catch (err) {
    console.warn('[nowen-note] listTags failed:', err)
    return null
  }
}

/** 把标签绑定到笔记（已绑定时后端返回 200，不报错） */
export async function attachTagToNote(cfg: NowenNoteConfig, noteId: string, tagId: string): Promise<void> {
  try {
    await request(cfg, `/api/tags/note/${noteId}/tag/${tagId}`, { method: 'POST' })
  } catch (err) {
    // 已绑定 / 网络错误都不阻塞主流程
    console.warn('[nowen-note] attachTag failed:', noteId, tagId, err)
  }
}

/** 从笔记移除标签 */
export async function detachTagFromNote(
  cfg: NowenNoteConfig,
  noteId: string,
  tagId: string,
): Promise<void> {
  try {
    await request(cfg, `/api/tags/note/${noteId}/tag/${tagId}`, { method: 'DELETE' })
  } catch (err) {
    console.warn('[nowen-note] detachTag failed:', noteId, tagId, err)
  }
}

/** 同步本地标签数组到远端笔记：新增缺失、移除多余 */
async function syncTagsToRemote(
  cfg: NowenNoteConfig,
  remoteNoteId: string,
  localTags: string[],
  remoteTags: Array<{ id: string; name: string }> = [],
): Promise<void> {
  const cleanLocal = Array.from(new Set(localTags.map((t) => t.trim()).filter(Boolean)))
  const remoteByName = new Map(remoteTags.map((t) => [t.name, t.id]))

  // 需要新增：本地有，远端没有
  for (const name of cleanLocal) {
    if (remoteByName.has(name)) continue
    const tagId = await ensureTag(cfg, name)
    if (tagId) await attachTagToNote(cfg, remoteNoteId, tagId)
  }
  // 需要移除：远端有，本地没有
  const localSet = new Set(cleanLocal)
  for (const rt of remoteTags) {
    if (!localSet.has(rt.name)) {
      await detachTagFromNote(cfg, remoteNoteId, rt.id)
    }
  }
}

// ========== 内容转换：纯文本/Markdown → nowen-note 的 content（Tiptap JSON）格式 ==========
//
// nowen-note 存储 content 为 Tiptap JSON 字符串（编辑器内部格式）。我们这里的速记
// 是 Markdown 风格的纯文本，无法 100% 还原所有富文本元素，但可以保证「可读」：
//
// 策略（最小可用）：
//   - 把 Markdown 文本按段落切分；
//   - 每段包成 { type: 'paragraph', content: [{ type: 'text', text: '...' }] }；
//   - 这样在 nowen-note 中显示为多段文本，标题与代码块至少作为普通文本可读。
//
// 后续 P3 阶段可以替换为 markdown-it / remark-rehype-tiptap 之类的完整渲染管线。

/** 从 Markdown 取首行作为标题（去掉 #/* 等装饰符），过长则截断 */
export function extractTitle(content: string, fallback = '灵感速记'): string {
  const firstNonEmpty = content.split('\n').map((l) => l.trim()).find((l) => l.length > 0)
  if (!firstNonEmpty) return fallback
  // 去掉 markdown 装饰
  const cleaned = firstNonEmpty
    .replace(/^#+\s*/, '')
    .replace(/^[*-]\s+/, '')
    .replace(/^>\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/[*_`~]/g, '')
    .trim()
  return cleaned.slice(0, 80) || fallback
}

/** Markdown 文本 → Tiptap JSON 字符串（最小可用版本） */
export function markdownToTiptapJSON(md: string): string {
  // 用空行切段，单段内允许换行（保留为软回车）
  const blocks = md.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  const doc = {
    type: 'doc',
    content: blocks.length === 0
      ? [{ type: 'paragraph' }]
      : blocks.map((block) => {
          // 简单识别一级标题
          if (/^#\s+/.test(block)) {
            return {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: block.replace(/^#\s+/, '') }],
            }
          }
          if (/^##\s+/.test(block)) {
            return {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: block.replace(/^##\s+/, '') }],
            }
          }
          // 代码块（```...```）
          const codeMatch = block.match(/^```(\w*)\n([\s\S]*?)\n```$/)
          if (codeMatch) {
            return {
              type: 'codeBlock',
              attrs: { language: codeMatch[1] || null },
              content: [{ type: 'text', text: codeMatch[2] }],
            }
          }
          // 普通段落
          return {
            type: 'paragraph',
            content: [{ type: 'text', text: block }],
          }
        }),
  }
  return JSON.stringify(doc)
}

/** Markdown → 纯文本（用于 contentText FTS 索引），简单去掉 markdown 装饰 */
export function markdownToPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

// ========== 同步业务：将本地一条速记推送到 nowen-note ==========

export interface PushResult {
  success: boolean
  remoteId?: string
  syncStatus: 'synced' | 'conflict' | 'local'
  remoteUpdatedAt?: string
  error?: string
  /** 冲突时返回远端笔记快照，给前端做对比 UI */
  remoteSnapshot?: {
    title: string
    contentText: string
    updatedAt: string
  }
}

/** 从 Markdown 文本里提取 #tag（与前端 MiniMarkdown.extractTags 行为一致） */
export function extractInlineTags(content: string): string[] {
  const matches = content.match(/(?:^|\s)#([\u4e00-\u9fa5\w-]+)/g)
  if (!matches) return []
  const tags = matches.map((m) => m.trim().replace(/^#/, ''))
  return Array.from(new Set(tags))
}

/** 合并本地 tags 字段 + 内容里的 #tag */
function resolveLocalTags(rawTags: string | null | undefined, content: string): string[] {
  let arr: string[] = []
  if (rawTags) {
    if (rawTags.startsWith('[')) {
      try { arr = JSON.parse(rawTags) } catch { arr = [] }
    } else {
      arr = rawTags.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }
  const inline = extractInlineTags(content)
  return Array.from(new Set([...arr, ...inline]))
}

/**
 * 推送一条本地灵感速记到 nowen-note。
 *
 * @param noteId 本地速记 id
 * @param options.forceMode
 *   - 'force-push'：忽略远端较新版本，强行用本地内容覆盖
 *   - 'force-pull'：用远端内容覆盖本地（用于"用远端"解决冲突）
 *   - undefined：默认行为，发现冲突时不覆盖，标记 conflict 等用户决策
 *
 * - 若本地无 remoteId：创建新远端笔记；
 * - 若本地有 remoteId：先 GET 远端笔记拿 version，再 PUT 更新；
 * - 若 GET 远端时 404（远端已删除）：降级为创建新笔记；
 * - 若远端 updatedAt 比本地 remoteUpdatedAt 新：标记 conflict（不强制覆盖）。
 *
 * 同步前后会更新 quick_notes.syncStatus，本函数返回最终结果但不抛异常。
 */
export async function pushNote(
  noteId: string,
  options: { forceMode?: 'force-push' | 'force-pull' } = {},
): Promise<PushResult> {
  const cfg = loadConfig()
  if (!cfg) {
    return { success: false, syncStatus: 'local', error: 'nowen-note 未配置' }
  }

  const note = queryOne('SELECT * FROM quick_notes WHERE id = ?', [noteId]) as
    | {
        id: string
        content: string
        tags?: string | null
        notebookId?: string | null
        remoteId?: string | null
        syncStatus?: string | null
        remoteUpdatedAt?: string | null
        updatedAt: string
      }
    | undefined
  if (!note) {
    return { success: false, syncStatus: 'local', error: '速记不存在' }
  }

  // 标记为 syncing
  run('UPDATE quick_notes SET syncStatus = ? WHERE id = ?', ['syncing', noteId])

  try {
    // ===== force-pull：用远端覆盖本地（解决冲突） =====
    if (options.forceMode === 'force-pull') {
      if (!note.remoteId) {
        run('UPDATE quick_notes SET syncStatus = ? WHERE id = ?', ['local', noteId])
        return { success: false, syncStatus: 'local', error: '本地未关联远端笔记，无法用远端覆盖' }
      }
      const existing = await getRemoteNote(cfg, note.remoteId)
      if (!existing) {
        // 远端已删除：本地降级 local，清空 remoteId
        run(
          'UPDATE quick_notes SET remoteId = NULL, syncStatus = ?, remoteUpdatedAt = NULL WHERE id = ?',
          ['local', noteId],
        )
        return { success: false, syncStatus: 'local', error: '远端笔记已删除' }
      }
      // 把远端的 contentText 反向写入本地（最小可用：取 contentText，丢失格式）
      const remoteText = existing.contentText || existing.title || ''
      run(
        'UPDATE quick_notes SET content = ?, syncStatus = ?, remoteUpdatedAt = ?, updatedAt = ? WHERE id = ?',
        [remoteText, 'synced', existing.updatedAt, new Date().toISOString(), noteId],
      )
      return {
        success: true,
        syncStatus: 'synced',
        remoteId: existing.id,
        remoteUpdatedAt: existing.updatedAt,
      }
    }

    const title = extractTitle(note.content)
    const contentText = markdownToPlainText(note.content)
    const tiptapJson = markdownToTiptapJSON(note.content)

    // 解析目标笔记本：本地优先 → 配置默认 → 自动创建"灵感收件箱"
    const targetNotebookId = note.notebookId || (await ensureInboxNotebook(cfg))

    let remote: RemoteNote
    if (note.remoteId) {
      // 先 GET 拿 version
      const existing = await getRemoteNote(cfg, note.remoteId)
      if (!existing) {
        // 远端已被删除：降级为创建
        remote = await createRemoteNote(cfg, {
          title,
          content: tiptapJson,
          contentText,
          notebookId: targetNotebookId,
        })
      } else {
        // 冲突检测：远端 updatedAt 比本地最后一次同步时间晚 → conflict（除非 force-push）
        if (
          options.forceMode !== 'force-push' &&
          note.remoteUpdatedAt &&
          new Date(existing.updatedAt).getTime() > new Date(note.remoteUpdatedAt).getTime()
        ) {
          run('UPDATE quick_notes SET syncStatus = ?, remoteUpdatedAt = ? WHERE id = ?', [
            'conflict',
            existing.updatedAt,
            noteId,
          ])
          return {
            success: false,
            syncStatus: 'conflict',
            remoteId: existing.id,
            remoteUpdatedAt: existing.updatedAt,
            error: '远端版本更新，存在冲突',
            remoteSnapshot: {
              title: existing.title,
              contentText: existing.contentText || '',
              updatedAt: existing.updatedAt,
            },
          }
        }
        remote = await updateRemoteNote(cfg, note.remoteId, {
          title,
          content: tiptapJson,
          contentText,
          version: existing.version || 1,
        })
      }
    } else {
      remote = await createRemoteNote(cfg, {
        title,
        content: tiptapJson,
        contentText,
        notebookId: targetNotebookId,
      })
    }

    // 写回本地
    run(
      'UPDATE quick_notes SET remoteId = ?, notebookId = ?, syncStatus = ?, remoteUpdatedAt = ? WHERE id = ?',
      [remote.id, targetNotebookId, 'synced', remote.updatedAt, noteId],
    )

    // 标签同步：失败不影响主流程
    try {
      const localTags = resolveLocalTags(note.tags, note.content)
      if (localTags.length > 0 || (remote.tags && remote.tags.length > 0)) {
        await syncTagsToRemote(cfg, remote.id, localTags, remote.tags || [])
      }
    } catch (err) {
      console.warn('[nowen-note] sync tags failed:', err)
    }

    return {
      success: true,
      syncStatus: 'synced',
      remoteId: remote.id,
      remoteUpdatedAt: remote.updatedAt,
    }
  } catch (err) {
    // 失败回退为 local 状态（不要卡在 syncing）
    const message = err instanceof NowenNoteError ? err.message : String(err)
    run('UPDATE quick_notes SET syncStatus = ? WHERE id = ?', ['local', noteId])
    return { success: false, syncStatus: 'local', error: message }
  }
}

// ========== AI 写作助手代理（透传到 nowen-note 的 SSE） ==========
//
// nowen-note 的 /api/ai/chat 是 SSE 流式接口，参数 { action, text, customPrompt? }，
// 返回 event=message data={t:"片段"} ... event=done data="[DONE]"。
// 我们做一层"透传"，让 NOWEN 前端可以直接拿到流式 token，无需暴露 token 给浏览器。

export async function streamAI(
  payload: { action: string; text: string; customPrompt?: string; context?: string },
): Promise<Response | { error: string; status: number }> {
  const cfg = loadConfig()
  if (!cfg) return { error: 'nowen-note 未配置', status: 400 }

  try {
    const res = await fetch(`${cfg.baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiToken}`,
      },
      body: JSON.stringify(payload),
    })
    return res
  } catch (err: any) {
    return { error: `AI 请求失败：${err?.message || err}`, status: 0 }
  }
}

// ========== 双向同步：拉取远端"灵感收件箱"并合并到本地 ==========
//
// 实现原理：
//   - 列出 inbox 笔记本下所有笔记（GET /api/notes?notebookId=...）
//   - 对每条远端笔记：
//     a) 本地若已有同 remoteId：比较 updatedAt，远端较新则覆盖（除非本地正在编辑——
//        本期暂不维护"正在编辑"标记，简化为：本地 syncStatus=synced 且远端较新就更新）
//     b) 本地没有：作为新条目插入（remoteId=远端 id, syncStatus=synced）
//   - 远端删除的笔记：本地不主动删除，避免误删（用户在 nowen-note 主动删除应该是有意识的，
//     但同步删除会让人惊讶）。可放到后续阶段加 "remoteDeleted" 状态。

export interface PullResult {
  ok: boolean
  pulled: number
  created: number
  updated: number
  skipped: number
  error?: string
}

export async function pullFromRemote(): Promise<PullResult> {
  const cfg = loadConfig()
  if (!cfg) return { ok: false, pulled: 0, created: 0, updated: 0, skipped: 0, error: '未配置' }

  try {
    const inboxId = await ensureInboxNotebook(cfg)
    // nowen-note 笔记列表 API
    const notes = await request<RemoteNote[]>(
      cfg,
      `/api/notes?notebookId=${encodeURIComponent(inboxId)}`,
      { method: 'GET' },
    )
    let created = 0
    let updated = 0
    let skipped = 0
    for (const remote of notes) {
      const local = queryOne('SELECT * FROM quick_notes WHERE remoteId = ?', [remote.id]) as
        | {
            id: string
            content: string
            syncStatus?: string | null
            remoteUpdatedAt?: string | null
          }
        | undefined

      if (!local) {
        // 新建本地
        const newId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
        const text = remote.contentText || remote.title || ''
        run(
          `INSERT INTO quick_notes (id, content, tags, notebookId, remoteId, syncStatus, remoteUpdatedAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            text,
            remote.tags && remote.tags.length > 0
              ? JSON.stringify(remote.tags.map((t) => t.name))
              : null,
            inboxId,
            remote.id,
            'synced',
            remote.updatedAt,
            remote.createdAt,
            remote.updatedAt,
          ],
        )
        created++
      } else {
        // 远端比本地最后一次同步时间新 → 更新本地（仅当本地是 synced 状态，避免覆盖未保存修改）
        if (
          local.syncStatus === 'synced' &&
          local.remoteUpdatedAt &&
          new Date(remote.updatedAt).getTime() > new Date(local.remoteUpdatedAt).getTime()
        ) {
          const text = remote.contentText || remote.title || ''
          run(
            `UPDATE quick_notes SET content = ?, tags = ?, syncStatus = ?, remoteUpdatedAt = ?, updatedAt = ? WHERE id = ?`,
            [
              text,
              remote.tags && remote.tags.length > 0
                ? JSON.stringify(remote.tags.map((t) => t.name))
                : null,
              'synced',
              remote.updatedAt,
              remote.updatedAt,
              local.id,
            ],
          )
          updated++
        } else if (
          local.syncStatus !== 'synced' &&
          local.remoteUpdatedAt &&
          new Date(remote.updatedAt).getTime() > new Date(local.remoteUpdatedAt).getTime()
        ) {
          // 本地有未同步修改 + 远端也有 → 标 conflict
          run('UPDATE quick_notes SET syncStatus = ? WHERE id = ?', ['conflict', local.id])
          skipped++
        } else {
          skipped++
        }
      }
    }
    return { ok: true, pulled: notes.length, created, updated, skipped }
  } catch (err) {
    const message = err instanceof NowenNoteError ? err.message : String(err)
    return { ok: false, pulled: 0, created: 0, updated: 0, skipped: 0, error: message }
  }
}
