import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Lightbulb,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Settings2,
  Cloud,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  X,
} from 'lucide-react'
import { useQuickNotes } from '../../hooks/useQuickNotes'
import { useQuickNotesContext } from '../../hooks/QuickNotesContext'
import { useCloudDrawer } from '../../hooks/CloudDrawerContext'
import { NoteCard } from './notes/NoteCard'
import { NoteListItem } from './notes/NoteListItem'
import { NoteComposer } from './notes/NoteComposer'
import { ConflictResolverModal } from './notes/ConflictResolverModal'
import { IdeaRainDrawer } from './notes/IdeaRainDrawer'
import { notesApi, type AIAction, type RemoteNoteSnapshot, type QuickNote } from '../../lib/api'

interface QuickNotesProps {
  isLoggedIn?: boolean
  /** nowen-note 远端是否已配置 */
  remoteConfigured?: boolean
  /** nowen-note 站点 URL */
  remoteBaseUrl?: string
  /** 同步模式（来自站点设置） */
  syncMode?: 'manual' | 'auto' | 'bidirectional'
  /** 打开站点设置（用于"配置 nowen-note"） */
  onOpenSettings?: () => void
  /** 嵌入模式：在抽屉内渲染时启用，不显示折叠态、移除外边距 */
  embedded?: boolean
}

type FilterKey = 'all' | 'today' | 'week' | 'synced' | 'local'

/** localStorage key：记忆用户上一次的展开态 */
const LS_KEY_EXPANDED = 'nowen.quicknotes.expanded'
const LS_KEY_VIEW = 'nowen.quicknotes.view'
type ViewMode = 'card' | 'list'

export function QuickNotes({
  isLoggedIn = false,
  remoteConfigured = false,
  remoteBaseUrl,
  syncMode = 'auto',
  onOpenSettings,
  embedded = false,
}: QuickNotesProps) {
  const { t } = useTranslation()
  // 始终从 Provider 取共享实例；App 顶层负责包裹 <QuickNotesProvider/>。
  const ctxValue = useQuickNotesContext()
  const fallback = useQuickNotes({
    syncMode,
    remoteConfigured,
    enabled: !ctxValue,
  })
  const {
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
    pushNote,
    fetchRemoteSnapshot,
  } = ctxValue ?? fallback

  // 折叠态：从 localStorage 读取上次状态（默认折叠，节省首屏空间）
  // 嵌入模式（抽屉内）：永远展开
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (embedded) return true
    if (typeof window === 'undefined') return false
    const saved = window.localStorage.getItem(LS_KEY_EXPANDED)
    return saved === '1'
  })
  const [userToggled, setUserToggled] = useState(false)

  // 视图模式：卡片 / 列表（持久化到 localStorage）
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'card'
    const saved = window.localStorage.getItem(LS_KEY_VIEW)
    return saved === 'list' ? 'list' : 'card'
  })
  const handleToggleView = useCallback((next: ViewMode) => {
    setViewMode(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LS_KEY_VIEW, next)
    }
  }, [])

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  // 日期范围筛选（YYYY-MM-DD；为 null 时表示该端开放）
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({
    from: null,
    to: null,
  })
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const datePopoverRef = useRef<HTMLDivElement>(null)
  // 灵感雨抽屉
  const cloudDrawerCtx = useCloudDrawer()
  const [localDrawerOpen, setLocalDrawerOpen] = useState(false)
  const drawerOpen = cloudDrawerCtx.isRainOpen || localDrawerOpen
  const setDrawerOpen = (v: boolean) => {
    if (v) cloudDrawerCtx.openRain()
    else cloudDrawerCtx.closeRain()
    setLocalDrawerOpen(v)
  }
  const [conflictNote, setConflictNote] = useState<QuickNote | null>(null)
  const [conflictSnapshot, setConflictSnapshot] = useState<RemoteNoteSnapshot | null>(null)
  const [conflictLoading, setConflictLoading] = useState(false)

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [highlightId, setHighlightId] = useState<string | null>(null)

  // 同步状态汇总
  const syncCounts = useMemo(() => {
    let synced = 0
    let local = 0
    let conflict = 0
    notes.forEach((n) => {
      if (n.syncStatus === 'synced') synced++
      else if (n.syncStatus === 'conflict') conflict++
      else local++
    })
    return { synced, local, conflict }
  }, [notes])

  // 智能默认：有冲突时自动展开（首次访问或用户未手动操作时）
  useEffect(() => {
    if (userToggled) return
    if (syncCounts.conflict > 0 && !isExpanded) {
      setIsExpanded(true)
    }
  }, [syncCounts.conflict, userToggled, isExpanded])

  // 日期 popover：外部点击 / Esc 关闭
  useEffect(() => {
    if (!datePopoverOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (!datePopoverRef.current) return
      if (!datePopoverRef.current.contains(e.target as Node)) {
        setDatePopoverOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDatePopoverOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [datePopoverOpen])

  // 持久化展开态
  const handleToggleExpand = useCallback(() => {
    setUserToggled(true)
    setIsExpanded((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LS_KEY_EXPANDED, next ? '1' : '0')
      }
      return next
    })
  }, [])

  // 删除确认（双击删除）
  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      try {
        await deleteNote(id)
      } catch {
        /* 上层处理 */
      }
      setDeletingId(null)
    } else {
      setDeletingId(id)
      setTimeout(() => setDeletingId((prev) => (prev === id ? null : prev)), 3000)
    }
  }

  // 时间格式化
  const formatTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)
    if (diffMin < 1) return t('quickNotes.justNow')
    if (diffMin < 60) return t('quickNotes.minutesAgo', { count: diffMin })
    if (diffHour < 24) return t('quickNotes.hoursAgo', { count: diffHour })
    if (diffDay < 7) return t('quickNotes.daysAgo', { count: diffDay })
    return date.toLocaleDateString()
  }, [t])

  // 高频标签
  const allTags = useMemo(() => {
    const map = new Map<string, number>()
    notes.forEach((n) => {
      const tags = n.tags && n.tags.length > 0
        ? n.tags
        : Array.from(new Set((n.content.match(/(?:^|\s)#([\p{L}\p{N}_-]+)/gu) || []).map((s) => s.trim().slice(1))))
      tags.forEach((tg) => map.set(tg, (map.get(tg) || 0) + 1))
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [notes])

  // 过滤
  const filteredNotes = useMemo(() => {
    const now = Date.now()
    // 日期范围转毫秒（含 from 当日 00:00、to 当日 23:59:59.999）
    const fromTs = dateRange.from ? new Date(dateRange.from + 'T00:00:00').getTime() : null
    const toTs = dateRange.to ? new Date(dateRange.to + 'T23:59:59.999').getTime() : null
    return notes.filter((n) => {
      if (activeTag) {
        const tags = n.tags && n.tags.length > 0
          ? n.tags
          : Array.from(new Set((n.content.match(/(?:^|\s)#([\p{L}\p{N}_-]+)/gu) || []).map((s) => s.trim().slice(1))))
        if (!tags.includes(activeTag)) return false
      }
      // 日期范围（基于 createdAt，更符合"什么时候记下的"直觉）
      if (fromTs !== null || toTs !== null) {
        const created = new Date(n.createdAt).getTime()
        if (fromTs !== null && created < fromTs) return false
        if (toTs !== null && created > toTs) return false
      }
      switch (filter) {
        case 'today':
          return now - new Date(n.updatedAt).getTime() < 86400000
        case 'week':
          return now - new Date(n.updatedAt).getTime() < 7 * 86400000
        case 'synced':
          return n.syncStatus === 'synced'
        case 'local':
          return !n.syncStatus || n.syncStatus === 'local'
        default:
          return true
      }
    })
  }, [notes, filter, activeTag, dateRange])

  // 首次加载且无数据：不渲染
  if (loading && notes.length === 0) return null
  if (!isLoggedIn && notes.length === 0) return null

  // 推送
  const handlePushNote = async (id: string) => {
    const result = await pushNote(id)
    if (!result.ok && result.status === 409) {
      const note = notes.find((n) => n.id === id)
      if (note) handleOpenConflict(note)
    } else if (!result.ok) {
      console.warn('[QuickNotes] push failed:', result.error, 'status=', result.status)
    }
  }

  const handleConfigureRemote = () => {
    onOpenSettings?.()
  }

  // 冲突
  const handleOpenConflict = async (note: QuickNote) => {
    setConflictNote(note)
    setConflictSnapshot(null)
    setConflictLoading(true)
    try {
      const snap = await fetchRemoteSnapshot(note.id)
      setConflictSnapshot(snap)
    } finally {
      setConflictLoading(false)
    }
  }
  const handleCloseConflict = () => {
    setConflictNote(null)
    setConflictSnapshot(null)
  }
  const handleUseLocal = async () => {
    if (!conflictNote) return
    await pushNote(conflictNote.id, 'force-push')
    handleCloseConflict()
  }
  const handleUseRemote = async () => {
    if (!conflictNote) return
    await pushNote(conflictNote.id, 'force-pull')
    handleCloseConflict()
  }
  const handleMergeEdit = (mergedText: string) => {
    if (!conflictNote) return
    startEdit(conflictNote)
    setEditContent(mergedText)
  }

  // AI 流式
  const handleAiAction = async (
    action: AIAction,
    text: string,
    onToken: (chunk: string) => void,
  ): Promise<string> => {
    let acc = ''
    for await (const chunk of notesApi.aiStream({ action, text })) {
      acc += chunk
      onToken(chunk)
    }
    return acc
  }

  // 跳转到指定卡片
  const handleJumpToNote = (id: string) => {
    if (!isExpanded) {
      // 灵感雨跳转回主区，强制展开
      setIsExpanded(true)
      setUserToggled(true)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LS_KEY_EXPANDED, '1')
      }
    }
    // 等待展开动画
    setTimeout(() => {
      const el = cardRefs.current.get(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlightId(id)
        setTimeout(() => setHighlightId((prev) => (prev === id ? null : prev)), 1800)
      }
    }, isExpanded ? 0 : 320)
  }

  // ============ 折叠态：单行胶囊 ============
  // 内嵌"伪输入框"——点击后展开真正的 Composer
  const CollapsedBar = (
    <motion.div
      layout
      className="flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-xl border"
      style={{
        background: 'var(--color-glass)',
        borderColor: 'var(--color-glass-border)',
      }}
    >
      {/* 标题图标 */}
      <div className="relative flex-shrink-0">
        <Lightbulb className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
        <Sparkles
          className="w-2.5 h-2.5 absolute -top-1 -right-1"
          style={{ color: 'var(--color-accent)', opacity: 0.6 }}
        />
      </div>

      <h2
        className="text-sm font-medium tracking-wide whitespace-nowrap hidden sm:inline"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {t('quickNotes.title')}
      </h2>
      <span
        className="text-xs tabular-nums whitespace-nowrap"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {notes.length}
      </span>

      {/* 内嵌伪输入框 —— 占据中间剩余空间 */}
      {isLoggedIn && (
        <button
          onClick={handleToggleExpand}
          className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-[13px] transition-all hover:bg-white/5"
          style={{
            background: 'var(--color-bg-tertiary, rgba(255,255,255,0.03))',
            color: 'var(--color-text-muted)',
            border: '1px solid transparent',
          }}
          title={t('quickNotes.collapsed.expandHint')}
        >
          <Plus className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
          <span className="truncate">{t('quickNotes.collapsed.inlinePlaceholder')}</span>
        </button>
      )}

      {/* 同步状态汇总（紧凑：仅图标） */}
      {remoteConfigured && notes.length > 0 && (
        <div
          className="hidden sm:flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md flex-shrink-0"
          style={{ color: 'var(--color-text-muted)' }}
          title={`☁ ${syncCounts.synced} · ⚡ ${syncCounts.local}${syncCounts.conflict > 0 ? ` · ⚠ ${syncCounts.conflict}` : ''}`}
        >
          {syncCounts.synced > 0 && (
            <span style={{ color: '#22c55e' }}>☁{syncCounts.synced}</span>
          )}
          {syncCounts.local > 0 && (
            <span style={{ color: 'var(--color-text-muted)' }}>⚡{syncCounts.local}</span>
          )}
          {syncCounts.conflict > 0 && (
            <span style={{ color: '#f97316' }}>⚠{syncCounts.conflict}</span>
          )}
        </div>
      )}

      {/* 灵感雨 */}
      {notes.length > 0 && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 rounded-md transition-all hover:bg-white/10 flex-shrink-0"
          style={{ color: 'var(--color-accent)' }}
          title={t('quickNotes.idearain.button')}
        >
          <Cloud className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 在 nowen-note 中打开 */}
      {remoteConfigured && remoteBaseUrl && (
        <a
          href={remoteBaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex p-1.5 rounded-md transition-all hover:bg-white/10 flex-shrink-0"
          style={{ color: 'var(--color-accent)' }}
          title={t('quickNotes.sync.openInRemote')}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      {/* 未配置引导 */}
      {!remoteConfigured && isLoggedIn && (
        <button
          onClick={handleConfigureRemote}
          className="p-1.5 rounded-md transition-all hover:bg-white/10 flex-shrink-0"
          style={{ color: 'var(--color-text-muted)' }}
          title={t('quickNotes.sync.configure')}
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 展开按钮 */}
      <button
        onClick={handleToggleExpand}
        className="p-1.5 rounded-md transition-colors hover:bg-white/10 flex-shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
        title={t('quickNotes.collapsed.expandHint')}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </motion.div>
  )

  // ============ 展开态工具条 ============
  const ExpandedToolbar = (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      {/* 标题区（embedded 抽屉模式下由抽屉外壳提供，避免重复） */}
      {!embedded && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <Lightbulb className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            <Sparkles
              className="w-2.5 h-2.5 absolute -top-1 -right-1"
              style={{ color: 'var(--color-accent)', opacity: 0.6 }}
            />
          </div>
          <h2
            className="text-sm font-medium tracking-wide"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('quickNotes.title')}
          </h2>
          <span
            className="text-xs tabular-nums"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {notes.length}
          </span>
        </div>
      )}

      {/* 筛选 Tab —— 嵌入工具条 */}
      {notes.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {(['all', 'today', 'week', 'synced', 'local'] as FilterKey[]).map((key) => {
            if ((key === 'synced' || key === 'local') && !remoteConfigured) return null
            const isActive = filter === key
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-2 py-0.5 rounded-md text-[11px] transition-all whitespace-nowrap"
                style={{
                  background: isActive
                    ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
                  border: isActive
                    ? '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)'
                    : '1px solid transparent',
                }}
              >
                {t(`quickNotes.filter.${key}`)}
              </button>
            )
          })}
        </div>
      )}

      {/* 日期范围筛选 */}
      {notes.length > 0 && (() => {
        const hasRange = !!(dateRange.from || dateRange.to)
        // 紧凑日期文案：M/D
        const fmt = (d: string | null) => {
          if (!d) return '…'
          const [, m, day] = d.split('-')
          return `${parseInt(m, 10)}/${parseInt(day, 10)}`
        }
        const label = hasRange
          ? dateRange.from && dateRange.to && dateRange.from === dateRange.to
            ? fmt(dateRange.from)
            : `${fmt(dateRange.from)}–${fmt(dateRange.to)}`
          : t('quickNotes.filter.date', { defaultValue: '日期' })
        return (
          <div className="relative" ref={datePopoverRef}>
            <button
              onClick={() => setDatePopoverOpen((v) => !v)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-all whitespace-nowrap"
              style={{
                background: hasRange
                  ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
                  : 'transparent',
                color: hasRange ? 'var(--color-accent)' : 'var(--color-text-muted)',
                border: hasRange
                  ? '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)'
                  : '1px solid transparent',
              }}
              title={t('quickNotes.filter.dateHint', { defaultValue: '按日期筛选' })}
            >
              <Calendar className="w-3 h-3" />
              <span>{label}</span>
              {hasRange && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDateRange({ from: null, to: null })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      setDateRange({ from: null, to: null })
                    }
                  }}
                  className="inline-flex items-center justify-center w-3 h-3 rounded-sm hover:bg-white/15 cursor-pointer"
                  title={t('quickNotes.filter.dateClear', { defaultValue: '清除日期' })}
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              )}
            </button>

            <AnimatePresence>
              {datePopoverOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 mt-1 left-0 w-[260px] rounded-xl backdrop-blur-2xl border overflow-hidden shadow-2xl"
                  style={{
                    background: 'var(--color-glass)',
                    borderColor: 'var(--color-glass-border)',
                    boxShadow: '0 16px 48px -16px rgba(0,0,0,0.45)',
                  }}
                >
                  {/* 快捷预设 */}
                  <div
                    className="px-3 py-1.5 text-[10px] uppercase tracking-wider"
                    style={{
                      color: 'var(--color-text-muted)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {t('quickNotes.filter.datePresets', { defaultValue: '快捷范围' })}
                  </div>
                  <div className="px-2 pt-2 pb-1 flex flex-wrap gap-1">
                    {([
                      { key: 'today', days: 0 },
                      { key: 'yesterday', days: 1 },
                      { key: 'last7', days: 7 },
                      { key: 'last30', days: 30 },
                    ] as const).map((p) => (
                      <button
                        key={p.key}
                        onClick={() => {
                          const now = new Date()
                          const toIso = (d: Date) =>
                            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                          if (p.key === 'today') {
                            const t0 = toIso(now)
                            setDateRange({ from: t0, to: t0 })
                          } else if (p.key === 'yesterday') {
                            const y = new Date(now)
                            y.setDate(y.getDate() - 1)
                            const ys = toIso(y)
                            setDateRange({ from: ys, to: ys })
                          } else {
                            const past = new Date(now)
                            past.setDate(past.getDate() - p.days)
                            setDateRange({ from: toIso(past), to: toIso(now) })
                          }
                          setDatePopoverOpen(false)
                        }}
                        className="px-2 py-0.5 rounded-md text-[11px] transition-all hover:bg-white/10"
                        style={{
                          color: 'var(--color-text-secondary, var(--color-text-primary))',
                          border: '1px solid var(--color-glass-border)',
                          background: 'transparent',
                        }}
                      >
                        {t(`quickNotes.filter.preset.${p.key}`, {
                          defaultValue:
                            p.key === 'today'
                              ? '今天'
                              : p.key === 'yesterday'
                              ? '昨天'
                              : p.key === 'last7'
                              ? '近 7 天'
                              : '近 30 天',
                        })}
                      </button>
                    ))}
                  </div>

                  {/* 自定义范围 */}
                  <div
                    className="px-3 py-2 mt-1 border-t"
                    style={{ borderColor: 'var(--color-glass-border)' }}
                  >
                    <div
                      className="text-[10px] uppercase tracking-wider mb-1.5"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {t('quickNotes.filter.dateCustom', { defaultValue: '自定义范围' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={dateRange.from ?? ''}
                        max={dateRange.to ?? undefined}
                        onChange={(e) =>
                          setDateRange((r) => ({ ...r, from: e.target.value || null }))
                        }
                        className="flex-1 min-w-0 px-1.5 py-1 rounded-md text-[11px] outline-none"
                        style={{
                          background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-glass-border)',
                          colorScheme: 'dark',
                        }}
                      />
                      <span
                        className="text-[11px]"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        –
                      </span>
                      <input
                        type="date"
                        value={dateRange.to ?? ''}
                        min={dateRange.from ?? undefined}
                        onChange={(e) =>
                          setDateRange((r) => ({ ...r, to: e.target.value || null }))
                        }
                        className="flex-1 min-w-0 px-1.5 py-1 rounded-md text-[11px] outline-none"
                        style={{
                          background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-glass-border)',
                          colorScheme: 'dark',
                        }}
                      />
                    </div>
                  </div>

                  {/* 底部操作 */}
                  <div
                    className="flex items-center justify-between px-3 py-2 border-t"
                    style={{ borderColor: 'var(--color-glass-border)' }}
                  >
                    <button
                      onClick={() => {
                        setDateRange({ from: null, to: null })
                      }}
                      disabled={!hasRange}
                      className="text-[11px] transition-colors disabled:opacity-40"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {t('quickNotes.filter.dateClear', { defaultValue: '清除' })}
                    </button>
                    <button
                      onClick={() => setDatePopoverOpen(false)}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all"
                      style={{
                        background: 'var(--color-accent)',
                        color: '#fff',
                      }}
                    >
                      {t('quickNotes.filter.dateDone', { defaultValue: '完成' })}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })()}

      {/* 视图切换器：卡片 / 列表 */}
      {notes.length > 0 && (
        <div
          className="flex items-center rounded-md p-0.5"
          style={{
            background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
            border: '1px solid var(--color-glass-border)',
          }}
        >
          {(['card', 'list'] as const).map((mode) => {
            const isActive = viewMode === mode
            const Icon = mode === 'card' ? LayoutGrid : List
            return (
              <button
                key={mode}
                onClick={() => handleToggleView(mode)}
                className="p-1 rounded-[4px] transition-all"
                style={{
                  background: isActive
                    ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
                }}
                title={t(
                  mode === 'card'
                    ? 'quickNotes.view.card'
                    : 'quickNotes.view.list',
                  { defaultValue: mode === 'card' ? '卡片视图' : '列表视图' }
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            )
          })}
        </div>
      )}

      <div className="ml-auto flex items-center gap-1">
        {/* 同步状态汇总 */}
        {remoteConfigured && notes.length > 0 && (
          <div
            className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded-md text-[11px]"
            style={{
              background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
              color: 'var(--color-text-muted)',
            }}
          >
            {syncCounts.synced > 0 && (
              <span style={{ color: '#22c55e' }}>☁ {syncCounts.synced}</span>
            )}
            {syncCounts.local > 0 && (
              <span>⚡ {syncCounts.local}</span>
            )}
            {syncCounts.conflict > 0 && (
              <span style={{ color: '#f97316' }}>⚠ {syncCounts.conflict}</span>
            )}
          </div>
        )}

        {notes.length > 0 && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-all hover:bg-white/10"
            style={{
              color: 'var(--color-accent)',
              background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
            }}
            title={t('quickNotes.idearain.button')}
          >
            <Cloud className="w-3 h-3" />
            <span className="hidden sm:inline">{t('quickNotes.idearain.button')}</span>
          </button>
        )}

        {remoteConfigured && remoteBaseUrl && (
          <a
            href={remoteBaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-all hover:bg-white/10"
            style={{
              color: 'var(--color-accent)',
              background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
            }}
            title={t('quickNotes.sync.openInRemote')}
          >
            <ExternalLink className="w-3 h-3" />
            <span>nowen-note</span>
          </a>
        )}

        {!remoteConfigured && isLoggedIn && (
          <button
            onClick={handleConfigureRemote}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-all hover:bg-white/10"
            style={{
              color: 'var(--color-text-muted)',
              background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
            }}
            title={t('quickNotes.sync.configure')}
          >
            <Settings2 className="w-3 h-3" />
            <span className="hidden sm:inline">{t('quickNotes.sync.configure')}</span>
          </button>
        )}

        {/* 折叠按钮（embedded 模式下不显示，抽屉自带 X） */}
        {!embedded && (
          <button
            onClick={handleToggleExpand}
            className="p-1 rounded-md transition-colors hover:bg-white/10"
            style={{ color: 'var(--color-text-muted)' }}
            title={t('quickNotes.collapsed.collapseHint')}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )

  // 标签云（独立行，仅展开态有标签时显示）
  const TagCloud = allTags.length > 0 && (
    <div className="flex items-center gap-1 mb-3 flex-wrap">
      {allTags.map(([tag, count]) => {
        const isActive = activeTag === tag
        return (
          <button
            key={tag}
            onClick={() => setActiveTag(isActive ? null : tag)}
            className="px-1.5 py-0.5 rounded-md text-[10px] transition-all"
            style={{
              background: isActive
                ? 'color-mix(in srgb, var(--color-accent) 22%, transparent)'
                : 'transparent',
              color: isActive
                ? 'var(--color-accent)'
                : 'var(--color-text-muted)',
              opacity: isActive ? 1 : 0.75,
            }}
          >
            #{tag}
            <span className="ml-1 opacity-60">{count}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <motion.section
      className={embedded ? '' : 'mb-6'}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: embedded ? 0 : 0.8, duration: embedded ? 0.2 : 0.5 }}
    >
      <AnimatePresence initial={false} mode="wait">
        {!isExpanded && !embedded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {CollapsedBar}
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {ExpandedToolbar}

            {/* 输入器 */}
            {isLoggedIn && (
              <div className="mb-3">
                <NoteComposer
                  onSubmit={addNote}
                  creating={creating}
                  aiEnabled={remoteConfigured}
                  onAiAction={handleAiAction}
                />
              </div>
            )}

            {TagCloud}

            {/* Bento 网格（embedded 模式下 1-2 列以适配抽屉宽度，否则 4 列） */}
            {filteredNotes.length > 0 ? (
              <motion.div
                layout
                className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-1.5'
                    : embedded
                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 auto-rows-[minmax(140px,auto)]'
                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 auto-rows-[minmax(140px,auto)]'
                }
              >
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map((note) => {
                    const displayNote = pushingIds.has(note.id)
                      ? { ...note, syncStatus: 'syncing' as const }
                      : note
                    const commonProps = {
                      note: displayNote,
                      isLoggedIn,
                      remoteConfigured,
                      isEditing: editingId === note.id,
                      editContent,
                      onStartEdit: () => startEdit(note),
                      onCancelEdit: cancelEdit,
                      onSaveEdit: saveEdit,
                      onChangeEdit: setEditContent,
                      onDelete: () => handleDelete(note.id),
                      onPush: () => handlePushNote(note.id),
                      onResolveConflict: () => handleOpenConflict(note),
                      onConfigure: handleConfigureRemote,
                      onTagClick: (tag: string) =>
                        setActiveTag((prev) => (prev === tag ? null : tag)),
                      isDeleting: deletingId === note.id,
                      formatTime,
                    }
                    return (
                      <div
                        key={note.id}
                        ref={(el) => {
                          if (el) cardRefs.current.set(note.id, el)
                          else cardRefs.current.delete(note.id)
                        }}
                        style={{
                          transition: 'box-shadow 0.4s ease',
                          boxShadow:
                            highlightId === note.id
                              ? '0 0 0 2px var(--color-accent), 0 12px 32px -8px color-mix(in srgb, var(--color-accent) 40%, transparent)'
                              : undefined,
                          borderRadius:
                            viewMode === 'list' ? '0.75rem' : '1rem',
                        }}
                      >
                        {viewMode === 'list' ? (
                          <NoteListItem {...commonProps} />
                        ) : (
                          <NoteCard {...commonProps} />
                        )}
                      </div>
                    )
                  })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div
                className="text-center py-8 rounded-2xl border border-dashed"
                style={{
                  borderColor: 'var(--color-glass-border)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Lightbulb
                  className="w-6 h-6 mx-auto mb-2"
                  style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}
                />
                <div className="text-sm">
                  {notes.length === 0
                    ? t('quickNotes.empty')
                    : `${t('quickNotes.empty')} · ${t(`quickNotes.filter.${filter}`)}`}
                </div>
                <div className="text-xs mt-1 opacity-70">
                  {t('quickNotes.emptyHint')}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 冲突解决 modal */}
      <ConflictResolverModal
        open={!!conflictNote}
        note={conflictNote}
        remoteSnapshot={conflictSnapshot}
        loading={conflictLoading}
        onClose={handleCloseConflict}
        onUseLocal={handleUseLocal}
        onUseRemote={handleUseRemote}
        onMergeEdit={handleMergeEdit}
        formatTime={formatTime}
      />

      {/* 灵感雨抽屉 */}
      <IdeaRainDrawer
        open={drawerOpen}
        notes={notes}
        remoteBaseUrl={remoteBaseUrl}
        onClose={() => setDrawerOpen(false)}
        onJumpToNote={handleJumpToNote}
      />
    </motion.section>
  )
}
