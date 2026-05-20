/**
 * ConflictResolverModal · 冲突解决对比 Modal
 * ---------------------------------------------------------------------------
 * 当一条速记的 syncStatus === 'conflict' 时打开此 modal，并排展示：
 *
 *   ┌─ 本地版本 ─────┐  ┌─ 远端版本 ─────┐
 *   │ 5min ago       │  │ 1min ago        │
 *   │ ...本地内容    │  │ ...远端内容     │
 *   └────────────────┘  └─────────────────┘
 *
 * 三个动作：
 *   - 用本地：force-push 覆盖远端
 *   - 用远端：force-pull 覆盖本地
 *   - 合并并编辑：把"本地\n\n---\n\n远端"塞进编辑器，让用户人工合并
 *
 * 视觉风格沿用 Bento + 玻璃质感，与 NoteCard / SiteSettingsCard 同源。
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, X, ArrowDownToLine, ArrowUpToLine, GitMerge, Loader2 } from 'lucide-react'
import type { QuickNote, RemoteNoteSnapshot } from '../../../lib/api'

interface ConflictResolverModalProps {
  open: boolean
  note: QuickNote | null
  /** 由父级提前 fetch 好的远端快照（loading 时为 null） */
  remoteSnapshot: RemoteNoteSnapshot | null
  loading?: boolean
  onClose: () => void
  /** 用本地覆盖远端 */
  onUseLocal: () => Promise<void> | void
  /** 用远端覆盖本地 */
  onUseRemote: () => Promise<void> | void
  /** 合并并进入编辑：父级把合并后的文本写进 editContent 并 startEdit */
  onMergeEdit: (mergedText: string) => void
  /** 时间格式化器（与 QuickNotes.formatTime 共享） */
  formatTime?: (dateStr: string) => string
}

export function ConflictResolverModal({
  open,
  note,
  remoteSnapshot,
  loading,
  onClose,
  onUseLocal,
  onUseRemote,
  onMergeEdit,
  formatTime,
}: ConflictResolverModalProps) {
  const { t } = useTranslation()
  const [actioning, setActioning] = useState<null | 'local' | 'remote' | 'merge'>(null)

  // 关闭时重置 actioning 状态
  useEffect(() => {
    if (!open) setActioning(null)
  }, [open])

  // ESC 关闭
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && actioning === null) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, actioning])

  const handleUseLocal = async () => {
    setActioning('local')
    try { await onUseLocal() } finally { setActioning(null) }
  }
  const handleUseRemote = async () => {
    setActioning('remote')
    try { await onUseRemote() } finally { setActioning(null) }
  }
  const handleMerge = () => {
    if (!note) return
    setActioning('merge')
    const local = note.content || ''
    const remote = remoteSnapshot?.contentText || ''
    const sep = '\n\n---\n\n'
    onMergeEdit(`${local}${sep}${remote}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && note && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full max-w-3xl rounded-2xl backdrop-blur-2xl border overflow-hidden shadow-2xl"
            style={{
              background: 'var(--color-glass)',
              borderColor: 'rgba(249, 115, 22, 0.35)',
              boxShadow: '0 0 0 1px rgba(249, 115, 22, 0.2), 0 24px 64px -24px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部条 */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b"
              style={{ borderColor: 'var(--color-glass-border)' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(249, 115, 22, 0.15)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(249, 115, 22)' }} />
              </div>
              <div className="flex-1">
                <div
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t('quickNotes.sync.conflictTitle', { defaultValue: '检测到内容冲突' })}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {t('quickNotes.sync.conflictSubtitle', {
                    defaultValue: '本地和远端都有过修改，请选择保留哪一份',
                  })}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 对比双栏 */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-x" style={{ borderColor: 'var(--color-glass-border)' }}>
              {/* 本地 */}
              <div className="p-5 flex flex-col min-h-[280px]">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  >
                    {t('quickNotes.sync.local', { defaultValue: '本地' })}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {formatTime ? formatTime(note.updatedAt) : note.updatedAt}
                  </span>
                </div>
                <pre
                  className="flex-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed font-mono overflow-auto rounded-lg p-3 max-h-[40vh]"
                  style={{
                    background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-glass-border)',
                  }}
                >
                  {note.content}
                </pre>
              </div>

              {/* 远端 */}
              <div className="p-5 flex flex-col min-h-[280px]">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono"
                    style={{
                      background: 'rgba(34, 197, 94, 0.12)',
                      color: 'rgb(34, 197, 94)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    {t('quickNotes.sync.remote', { defaultValue: 'nowen-note' })}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {remoteSnapshot
                      ? (formatTime ? formatTime(remoteSnapshot.updatedAt) : remoteSnapshot.updatedAt)
                      : '—'}
                  </span>
                </div>
                {loading ? (
                  <div className="flex-1 flex items-center justify-center text-xs gap-2"
                    style={{ color: 'var(--color-text-muted)' }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.loading', { defaultValue: '加载中…' })}
                  </div>
                ) : remoteSnapshot ? (
                  <pre
                    className="flex-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed font-mono overflow-auto rounded-lg p-3 max-h-[40vh]"
                    style={{
                      background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  >
                    {remoteSnapshot.contentText || '(空)'}
                  </pre>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs"
                    style={{ color: 'var(--color-text-muted)' }}>
                    {t('quickNotes.sync.fetchRemoteFailed', { defaultValue: '获取远端内容失败' })}
                  </div>
                )}
              </div>
            </div>

            {/* 操作栏 */}
            <div
              className="flex flex-wrap items-center gap-2 px-5 py-4 border-t justify-end"
              style={{ borderColor: 'var(--color-glass-border)' }}
            >
              <button
                onClick={handleMerge}
                disabled={actioning !== null || loading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg font-medium transition-all disabled:opacity-50"
                style={{
                  background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                <GitMerge className="w-3.5 h-3.5" />
                {t('quickNotes.sync.mergeEdit', { defaultValue: '合并并编辑' })}
              </button>
              <button
                onClick={handleUseRemote}
                disabled={actioning !== null || loading || !remoteSnapshot}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg font-medium transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: 'rgb(34, 197, 94)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                {actioning === 'remote' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                )}
                {t('quickNotes.sync.useRemote', { defaultValue: '用远端' })}
              </button>
              <button
                onClick={handleUseLocal}
                disabled={actioning !== null}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg font-medium transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: 'rgb(249, 115, 22)',
                  border: '1px solid rgba(249, 115, 22, 0.35)',
                }}
              >
                {actioning === 'local' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowUpToLine className="w-3.5 h-3.5" />
                )}
                {t('quickNotes.sync.useLocal', { defaultValue: '用本地' })}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
