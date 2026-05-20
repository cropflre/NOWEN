import { useState, useEffect, useCallback, useRef } from 'react'
import { notesApi, QuickNote, RemoteNoteSnapshot } from '../lib/api'

interface UseQuickNotesOptions {
  /** 同步模式来自站点设置，决定是否自动推送 / 双向拉取 */
  syncMode?: 'manual' | 'auto' | 'bidirectional'
  /** 是否已配置 nowen-note；未配置时所有自动同步都跳过 */
  remoteConfigured?: boolean
  /** 是否启用：默认 true。设为 false 时跳过初始化拉取与所有副作用，
   *  用于"占位 fallback"（已在 Provider 中获得共享实例时避免重复请求）。 */
  enabled?: boolean
}

interface UseQuickNotesReturn {
  notes: QuickNote[]
  loading: boolean
  creating: boolean
  editingId: string | null
  editContent: string
  /** 正在推送的 note id 集合 */
  pushingIds: Set<string>
  addNote: (content: string) => Promise<void>
  startEdit: (note: QuickNote) => void
  cancelEdit: () => void
  saveEdit: () => Promise<void>
  deleteNote: (id: string) => Promise<void>
  setEditContent: (content: string) => void
  refresh: () => Promise<void>
  /** 手动推送一条速记到 nowen-note。返回是否成功（冲突/失败返回 false 但本地状态会更新）。 */
  pushNote: (
    id: string,
    forceMode?: 'force-push' | 'force-pull',
  ) => Promise<{ ok: boolean; error?: string; status?: number }>
  /** 拉取一条速记的远端快照（冲突对比 UI 使用） */
  fetchRemoteSnapshot: (id: string) => Promise<RemoteNoteSnapshot | null>
  /** 全量从远端拉取（双向同步用） */
  pullRemote: () => Promise<void>
}

// ============================================================================
// useQuickNotes
// ============================================================================
//
// 自动同步策略（syncMode === 'auto' 或 'bidirectional'）：
//   - 创建一条新速记后：延迟 30 秒推送（窗口期内若再次编辑则重置计时）
//   - 编辑保存后：同样延迟 30 秒推送
//   - 删除：本地立即删除，远端不主动删除（用户在 nowen-note 端可手动删）
//
// 双向同步策略（syncMode === 'bidirectional'）：
//   - 在以上基础上，每 60 秒拉一次远端"灵感收件箱"，把新增/更新合并到本地
//
// 设计取舍：
//   - 防抖延时 30s 而非每次 1s，是为避免连续编辑时频繁 push（每次推送都会触发
//     nowen-note 索引、广播 WS，成本不小）
//   - 用 Map<noteId, timer> 维护每个速记自己的延时，互不干扰
//   - 组件卸载时把所有挂起 timer 都清掉，避免泄漏
// ============================================================================

const AUTO_PUSH_DELAY_MS = 30_000
const BIDIRECTIONAL_PULL_INTERVAL_MS = 60_000

export function useQuickNotes(options: UseQuickNotesOptions = {}): UseQuickNotesReturn {
  const { syncMode = 'auto', remoteConfigured = false, enabled = true } = options

  const [notes, setNotes] = useState<QuickNote[]>([])
  const [loading, setLoading] = useState(enabled)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [pushingIds, setPushingIds] = useState<Set<string>>(new Set())

  // 自动保存定时器（编辑中防抖）
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedContentRef = useRef('')

  // 自动推送定时器（按 noteId 隔离）
  const autoPushTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // 双向拉取定时器
  const pullTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 配置最新值放 ref，避免每次配置变更都重建 callback
  const optionsRef = useRef({ syncMode, remoteConfigured })
  optionsRef.current = { syncMode, remoteConfigured }

  // 加载灵感速记
  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const data = await notesApi.list()
      setNotes(data)
    } catch (err) {
      console.error('加载灵感速记失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    if (!enabled) return
    refresh()
  }, [refresh, enabled])

  // ---------------- 自动推送：核心 schedulePush ----------------
  // 把 pushNote 定义提前，因为 schedulePush 依赖它
  // 但 pushNote 内部又会用 schedulePush 重置定时器（不需要——push 之后不再 schedule）
  // 所以单纯用 ref 保证最新引用即可。

  const pushNoteRef = useRef<
    (id: string, forceMode?: 'force-push' | 'force-pull') => Promise<{ ok: boolean; error?: string; status?: number }>
  >(async () => ({ ok: false }))

  const schedulePush = useCallback((id: string) => {
    const { syncMode: mode, remoteConfigured: configured } = optionsRef.current
    if (!configured) return
    if (mode === 'manual') return

    const timers = autoPushTimersRef.current
    const old = timers.get(id)
    if (old) clearTimeout(old)
    const t = setTimeout(() => {
      timers.delete(id)
      // 触发推送（失败会被内部捕获）
      pushNoteRef.current(id).catch(() => {})
    }, AUTO_PUSH_DELAY_MS)
    timers.set(id, t)
  }, [])

  // 自动保存编辑中的内容（1.5秒防抖）
  useEffect(() => {
    if (!editingId || !editContent.trim() || editContent === lastSavedContentRef.current) {
      return
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const updated = await notesApi.update(editingId, editContent.trim())
        lastSavedContentRef.current = editContent
        setNotes(prev => prev.map(n => n.id === editingId ? updated : n))
        // 编辑保存后调度自动推送
        schedulePush(editingId)
      } catch (err) {
        console.error('自动保存失败:', err)
      }
    }, 1500)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [editingId, editContent, schedulePush])

  // 创建灵感速记
  // 行为：
  //   - 已配置远端 + 非 manual 模式 → 立即推送（fire-and-forget，不阻塞 UI）
  //   - 其他情况 → 走 schedulePush 延迟兜底
  const addNote = useCallback(async (content: string) => {
    if (!content.trim()) return
    try {
      setCreating(true)
      const note = await notesApi.create(content.trim())
      setNotes(prev => [note, ...prev])

      const { syncMode: mode, remoteConfigured: configured } = optionsRef.current
      if (configured && mode !== 'manual') {
        // 立即推送：UI 已显示新卡片，徽标会经过 syncing → synced 自然过渡
        pushNoteRef.current(note.id).catch(() => {})
      } else {
        schedulePush(note.id)
      }
    } catch (err) {
      console.error('创建灵感速记失败:', err)
      throw err
    } finally {
      setCreating(false)
    }
  }, [schedulePush])

  // 开始编辑
  const startEdit = useCallback((note: QuickNote) => {
    setEditingId(note.id)
    setEditContent(note.content)
    lastSavedContentRef.current = note.content
  }, [])

  // 取消编辑
  const cancelEdit = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    setEditingId(null)
    setEditContent('')
    lastSavedContentRef.current = ''
  }, [])

  // 手动保存编辑
  const saveEdit = useCallback(async () => {
    if (!editingId || !editContent.trim()) return
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    try {
      const updated = await notesApi.update(editingId, editContent.trim())
      setNotes(prev => prev.map(n => n.id === editingId ? updated : n))
      lastSavedContentRef.current = editContent
      const savedId = editingId
      setEditingId(null)
      setEditContent('')
      // 手动保存也调度自动推送
      schedulePush(savedId)
    } catch (err) {
      console.error('保存灵感速记失败:', err)
      throw err
    }
  }, [editingId, editContent, schedulePush])

  // 删除灵感速记
  const deleteNote = useCallback(async (id: string) => {
    try {
      // 删除前先清掉这条的自动推送定时器
      const t = autoPushTimersRef.current.get(id)
      if (t) {
        clearTimeout(t)
        autoPushTimersRef.current.delete(id)
      }
      await notesApi.delete(id)
      setNotes(prev => prev.filter(n => n.id !== id))
      if (editingId === id) {
        cancelEdit()
      }
    } catch (err) {
      console.error('删除灵感速记失败:', err)
      throw err
    }
  }, [editingId, cancelEdit])

  // 推送到 nowen-note：先乐观更新本地为 syncing，再调 API；
  // 成功 → 用后端返回的最新对象覆盖；失败/冲突 → 用错误对象里的 note 覆盖（拿到最新 syncStatus）
  const pushNote = useCallback(
    async (id: string, forceMode?: 'force-push' | 'force-pull') => {
      // 取消还没触发的自动推送 timer，避免和手动推送打架
      const oldTimer = autoPushTimersRef.current.get(id)
      if (oldTimer) {
        clearTimeout(oldTimer)
        autoPushTimersRef.current.delete(id)
      }

      setPushingIds(prev => {
        const next = new Set(prev)
        next.add(id)
        return next
      })
      // 乐观更新：本地 syncStatus → syncing
      setNotes(prev => prev.map(n => (n.id === id ? { ...n, syncStatus: 'syncing' } : n)))
      try {
        const updated = await notesApi.push(id, forceMode)
        setNotes(prev => prev.map(n => (n.id === id ? updated : n)))
        return { ok: true }
      } catch (err: any) {
        // 后端返回 409/502 时附带 note 字段（含最新 syncStatus），优先使用它
        if (err?.note) {
          const remoteNote = err.note as QuickNote
          setNotes(prev => prev.map(n => (n.id === id ? remoteNote : n)))
        } else {
          // 没有 note 就回退到 local
          setNotes(prev =>
            prev.map(n => (n.id === id ? { ...n, syncStatus: 'local' as const } : n)),
          )
        }
        console.error('推送灵感速记失败:', err)
        return { ok: false, error: err?.message || '推送失败', status: err?.status }
      } finally {
        setPushingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [],
  )
  // 同步到 ref 供 schedulePush 使用
  pushNoteRef.current = pushNote

  // 拉取一条远端快照（冲突对比 UI 调用）
  const fetchRemoteSnapshot = useCallback(async (id: string): Promise<RemoteNoteSnapshot | null> => {
    try {
      return await notesApi.remoteSnapshot(id)
    } catch (err) {
      console.error('拉取远端快照失败:', err)
      return null
    }
  }, [])

  // 全量从远端拉取（双向模式定时调用 + 用户手动刷新）
  const pullRemote = useCallback(async () => {
    if (!optionsRef.current.remoteConfigured) return
    try {
      const result = await notesApi.pullRemote()
      if (result.ok && (result.created > 0 || result.updated > 0)) {
        // 有变化才重新拉本地列表
        const data = await notesApi.list()
        setNotes(data)
      }
    } catch (err) {
      console.error('双向同步拉取失败:', err)
    }
  }, [])

  // 双向模式定时拉取
  useEffect(() => {
    if (pullTimerRef.current) {
      clearInterval(pullTimerRef.current)
      pullTimerRef.current = null
    }
    if (syncMode === 'bidirectional' && remoteConfigured) {
      // 进入双向模式立即拉一次（但不阻塞首屏）
      void pullRemote()
      pullTimerRef.current = setInterval(() => {
        void pullRemote()
      }, BIDIRECTIONAL_PULL_INTERVAL_MS)
    }
    return () => {
      if (pullTimerRef.current) clearInterval(pullTimerRef.current)
      pullTimerRef.current = null
    }
  }, [syncMode, remoteConfigured, pullRemote])

  // 卸载清理：所有自动推送 timer
  useEffect(() => {
    return () => {
      const timers = autoPushTimersRef.current
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  return {
    notes,
    loading,
    creating,
    editingId,
    editContent,
    pushingIds,
    addNote,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteNote,
    setEditContent,
    refresh,
    pushNote,
    fetchRemoteSnapshot,
    pullRemote,
  }
}
