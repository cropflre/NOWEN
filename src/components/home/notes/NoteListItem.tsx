/**
 * NoteListItem · 列表模式下的灵感速记单行
 * ---------------------------------------------------------------------------
 * 与 NoteCard 同源数据，但展示密度更高：
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │ [▣]  标题（首行）        Markdown 摘要…  · #标签       12min  ☁ ⋯ │
 *   └─────────────────────────────────────────────────────────────────────┘
 * 单行 ~52px，悬浮显示动作；编辑态切换为多行 textarea。
 */
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit3,
  Trash2,
  Check,
  X,
  Send,
  AlertTriangle,
  StickyNote,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { QuickNote } from '../../../lib/api'
import { extractTitle, extractTags } from './MiniMarkdown'
import { SyncBadge } from './SyncBadge'

interface NoteListItemProps {
  note: QuickNote
  isLoggedIn: boolean
  remoteConfigured: boolean
  isEditing: boolean
  editContent: string
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onChangeEdit: (content: string) => void
  onDelete: () => void
  onPush?: () => void
  onResolveConflict?: () => void
  onConfigure?: () => void
  onTagClick?: (tag: string) => void
  isDeleting: boolean
  formatTime: (dateStr: string) => string
}

export function NoteListItem({
  note,
  isLoggedIn,
  remoteConfigured,
  isEditing,
  editContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onChangeEdit,
  onDelete,
  onPush,
  onResolveConflict,
  onConfigure,
  onTagClick,
  isDeleting,
  formatTime,
}: NoteListItemProps) {
  const { t } = useTranslation()
  const [hover, setHover] = useState(false)
  const editRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus()
      const len = editRef.current.value.length
      editRef.current.setSelectionRange(len, len)
      editRef.current.style.height = 'auto'
      editRef.current.style.height = Math.min(editRef.current.scrollHeight, 320) + 'px'
    }
  }, [isEditing])

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onSaveEdit()
    }
    if (e.key === 'Escape') onCancelEdit()
  }

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 320) + 'px'
  }

  const title = extractTitle(note.content, t('quickNotes.title'))
  const tags = note.tags && note.tags.length > 0 ? note.tags : extractTags(note.content)

  // 取一行预览：首个非空非标题行
  const previewLine = (() => {
    const lines = note.content.split('\n').map((l) => l.trim()).filter(Boolean)
    // 如果第一行就是标题，从第二行起
    return lines.length > 1 ? lines.slice(1).join(' ').slice(0, 120) : ''
  })()

  const remoteUrl = note.remoteId ? `#nowen-note/${note.remoteId}` : null

  // 状态色条
  const accentColor =
    note.syncStatus === 'synced'
      ? '#22c55e'
      : note.syncStatus === 'syncing'
      ? '#3b82f6'
      : note.syncStatus === 'conflict'
      ? '#f97316'
      : 'var(--color-accent)'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative rounded-xl backdrop-blur-md border overflow-hidden"
      style={{
        background: 'var(--color-glass)',
        borderColor: isEditing ? 'var(--color-accent)' : 'var(--color-glass-border)',
        boxShadow: isEditing
          ? '0 0 0 1px var(--color-accent), 0 6px 22px -10px color-mix(in srgb, var(--color-accent) 38%, transparent)'
          : undefined,
      }}
    >
      {/* 左侧色条 */}
      <div
        className="absolute inset-y-0 left-0 w-[3px] opacity-70"
        style={{ background: accentColor }}
      />

      {isEditing ? (
        <div className="flex flex-col p-3 pl-4">
          <textarea
            ref={editRef}
            value={editContent}
            onChange={(e) => {
              onChangeEdit(e.target.value)
              autoResize(e.target)
            }}
            onKeyDown={handleEditKeyDown}
            className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed font-mono"
            style={{ color: 'var(--color-text-primary)', minHeight: '80px' }}
          />
          <div className="flex items-center justify-end gap-1 mt-2">
            <button
              onClick={onCancelEdit}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'var(--color-text-muted)' }}
              title="Esc"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={onSaveEdit}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'var(--color-accent)' }}
              title="Ctrl + Enter"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 pl-4 py-2.5 min-h-[52px]">
          {/* 图标 */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
              color: 'var(--color-accent)',
            }}
          >
            <StickyNote className="w-3.5 h-3.5" />
          </div>

          {/* 主体：标题 + 摘要 */}
          <button
            type="button"
            onClick={onStartEdit}
            className="flex-1 min-w-0 text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="text-[13px] font-semibold truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {title}
              </span>
              {previewLine && (
                <span
                  className="hidden sm:inline text-[12px] truncate min-w-0 flex-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {previewLine}
                </span>
              )}
            </div>

            {/* 标签 + 时间副信息 */}
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] tabular-nums whitespace-nowrap"
                style={{ color: 'var(--color-text-muted)', opacity: 0.8 }}
              >
                {formatTime(note.updatedAt)}
              </span>
              {tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTagClick?.(tag)
                  }}
                  className="text-[10px] px-1.5 py-0 rounded-md transition-colors hover:bg-white/10"
                  style={{
                    color: 'var(--color-accent)',
                    background:
                      'color-mix(in srgb, var(--color-accent) 8%, transparent)',
                  }}
                >
                  #{tag}
                </button>
              ))}
              {tags.length > 3 && (
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}
                >
                  +{tags.length - 3}
                </span>
              )}
            </div>
          </button>

          {/* 右侧：操作 + 同步徽标 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* 冲突按钮 */}
            {note.syncStatus === 'conflict' && onResolveConflict && (
              <button
                onClick={onResolveConflict}
                className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md font-medium transition-all"
                style={{
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: 'rgb(249, 115, 22)',
                  border: '1px solid rgba(249, 115, 22, 0.35)',
                }}
                title={t('quickNotes.sync.resolveConflict', { defaultValue: '解决冲突' })}
              >
                <AlertTriangle className="w-3 h-3" />
              </button>
            )}

            {/* 同步徽标 */}
            <SyncBadge
              status={note.syncStatus}
              configured={remoteConfigured}
              remoteUrl={remoteUrl}
              onPushNow={onPush}
              onConfigure={onConfigure}
            />

            {/* 悬浮动作组 */}
            {isLoggedIn && (
              <AnimatePresence>
                {hover && (
                  <motion.div
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 4 }}
                    transition={{ duration: 0.12 }}
                    className="flex items-center gap-0.5"
                  >
                    {remoteConfigured && note.syncStatus !== 'synced' && (
                      <button
                        onClick={onPush}
                        className="p-1 rounded-md transition-colors hover:bg-white/10"
                        style={{ color: 'var(--color-accent)' }}
                        title={t('quickNotes.sync.pushNow')}
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={onStartEdit}
                      className="p-1 rounded-md transition-colors hover:bg-white/10"
                      style={{ color: 'var(--color-text-muted)' }}
                      title={t('quickNotes.edit')}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={onDelete}
                      className="p-1 rounded-md transition-colors hover:bg-white/10"
                      style={{
                        color: isDeleting ? '#ef4444' : 'var(--color-text-muted)',
                      }}
                      title={
                        isDeleting
                          ? t('quickNotes.confirmDelete')
                          : t('quickNotes.delete')
                      }
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
