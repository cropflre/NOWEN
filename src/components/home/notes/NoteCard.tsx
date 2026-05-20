import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit3,
  Trash2,
  Check,
  X,
  Send,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { QuickNote } from '../../../lib/api'
import { MiniMarkdown, extractTitle, extractTags } from './MiniMarkdown'
import { SyncBadge } from './SyncBadge'

interface NoteCardProps {
  note: QuickNote
  isLoggedIn: boolean
  /** nowen-note 是否已配置 */
  remoteConfigured: boolean
  isEditing: boolean
  editContent: string
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onChangeEdit: (content: string) => void
  onDelete: () => void
  onPush?: () => void
  /** 冲突状态下点击"解决冲突"发起的回调，由上层拉起冲突对比 modal */
  onResolveConflict?: () => void
  onConfigure?: () => void
  onTagClick?: (tag: string) => void
  /** 卡片删除确认状态 */
  isDeleting: boolean
  /** 时间格式化器 */
  formatTime: (dateStr: string) => string
}

export function NoteCard({
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
}: NoteCardProps) {
  const { t } = useTranslation()
  const [showActions, setShowActions] = useState(false)
  const editRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus()
      const len = editRef.current.value.length
      editRef.current.setSelectionRange(len, len)
      // 自动撑高
      editRef.current.style.height = 'auto'
      editRef.current.style.height = Math.min(editRef.current.scrollHeight, 320) + 'px'
    }
  }, [isEditing])

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onSaveEdit()
    }
    if (e.key === 'Escape') {
      onCancelEdit()
    }
  }

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 320) + 'px'
  }

  // 计算内容标题与标签
  const title = extractTitle(note.content, t('quickNotes.title'))
  const tags = note.tags && note.tags.length > 0 ? note.tags : extractTags(note.content)

  // 远端 URL（占位，后端推送后会回填到 remoteId）
  const remoteUrl = note.remoteId ? `#nowen-note/${note.remoteId}` : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="group relative h-full rounded-2xl backdrop-blur-xl border overflow-hidden flex flex-col"
      style={{
        background: 'var(--color-glass)',
        borderColor: isEditing ? 'var(--color-accent)' : 'var(--color-glass-border)',
        boxShadow: isEditing
          ? '0 0 0 1px var(--color-accent), 0 8px 32px -12px color-mix(in srgb, var(--color-accent) 40%, transparent)'
          : undefined,
      }}
    >
      {/* 顶部彩条：根据同步状态点缀 */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-60"
        style={{
          background:
            note.syncStatus === 'synced'
              ? 'linear-gradient(90deg, transparent, #22c55e, transparent)'
              : note.syncStatus === 'syncing'
              ? 'linear-gradient(90deg, transparent, #3b82f6, transparent)'
              : note.syncStatus === 'conflict'
              ? 'linear-gradient(90deg, transparent, #f97316, transparent)'
              : 'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
        }}
      />

      {isEditing ? (
        <div className="flex flex-col h-full p-3">
          <textarea
            ref={editRef}
            value={editContent}
            onChange={(e) => {
              onChangeEdit(e.target.value)
              autoResize(e.target)
            }}
            onKeyDown={handleEditKeyDown}
            className="flex-1 w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed font-mono"
            style={{
              color: 'var(--color-text-primary)',
              minHeight: '120px',
            }}
          />
          <div
            className="flex items-center justify-between mt-2 pt-2"
            style={{ borderTop: '1px solid var(--color-glass-border)' }}
          >
            <span
              className="text-[10px] flex items-center gap-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Sparkles className="w-3 h-3" />
              {t('quickNotes.autoSave')}
            </span>
            <div className="flex items-center gap-1">
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
        </div>
      ) : (
        <>
          {/* 卡片主体内容 */}
          <div className="flex-1 px-3 pt-3 pb-1.5 min-h-0">
            {/* 标题（自动取首行） */}
            <h3
              className="text-[13px] font-semibold leading-snug line-clamp-1 mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {title}
            </h3>

            {/* Markdown 预览（限制更短，超出渐隐） */}
            <div
              className="text-[12px] leading-relaxed relative max-h-[88px] overflow-hidden"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <MiniMarkdown
                content={note.content}
                maxLines={4}
                onTagClick={onTagClick}
              />
              {/* 底部渐隐遮罩 */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-6"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent, var(--color-glass) 90%)',
                }}
              />
            </div>
          </div>

          {/* 卡片底部：标签 + 时间 + 同步徽标 + 操作 */}
          <div className="px-3 pb-2 pt-1.5 flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              {/* 时间 */}
              <span
                className="text-[10px] whitespace-nowrap"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {formatTime(note.updatedAt)}
              </span>
              {/* 标签 hint */}
              {tags.length > 0 && (
                <span
                  className="text-[10px] truncate max-w-[120px]"
                  style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}
                >
                  · {tags.slice(0, 2).map((t) => `#${t}`).join(' ')}
                  {tags.length > 2 && ` +${tags.length - 2}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {/* 冲突醒目提示按钮 */}
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
                  {t('quickNotes.sync.resolve', { defaultValue: '解决' })}
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

              {/* 悬浮操作按钮 */}
              {isLoggedIn && (
                <AnimatePresence>
                  {showActions && (
                    <motion.div
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 4 }}
                      transition={{ duration: 0.15 }}
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
        </>
      )}
    </motion.div>
  )
}
