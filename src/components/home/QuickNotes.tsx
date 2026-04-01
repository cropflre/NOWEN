import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Lightbulb,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useQuickNotes } from '../../hooks/useQuickNotes'

interface QuickNotesProps {
  isLoggedIn?: boolean
}

export function QuickNotes({ isLoggedIn = false }: QuickNotesProps) {
  const { t } = useTranslation()
  const {
    notes,
    loading,
    creating,
    editingId,
    editContent,
    addNote,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteNote,
    setEditContent,
  } = useQuickNotes()

  const [inputValue, setInputValue] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)

  // 聚焦编辑区域
  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus()
      editRef.current.setSelectionRange(editRef.current.value.length, editRef.current.value.length)
    }
  }, [editingId])

  // 提交新灵感
  const handleSubmit = async () => {
    if (!inputValue.trim() || creating) return
    try {
      await addNote(inputValue)
      setInputValue('')
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }
    } catch {
      // hook 内已处理错误
    }
  }

  // 键盘快捷键：Ctrl/Cmd+Enter 提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  // 编辑区键盘快捷键
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    }
    if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  // 自动调整 textarea 高度
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  // 删除确认
  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      try {
        await deleteNote(id)
      } catch {
        // hook 内已处理错误
      }
      setDeletingId(null)
    } else {
      setDeletingId(id)
      // 3秒后自动取消确认状态
      setTimeout(() => setDeletingId(prev => prev === id ? null : prev), 3000)
    }
  }

  // 格式化时间
  const formatTime = (dateStr: string) => {
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
  }

  if (loading && notes.length === 0) {
    return null // 首次加载时不显示空容器
  }

  // 非登录状态且无笔记时不显示
  if (!isLoggedIn && notes.length === 0) {
    return null
  }

  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
    >
      {/* 标题栏 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Lightbulb className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <Sparkles className="w-3 h-3 absolute -top-1 -right-1" style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
        </div>
        <h2
          className="text-lg font-medium tracking-wide"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {t('quickNotes.title')}
        </h2>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {notes.length}
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* 输入区域 — 仅登录时显示 */}
            {isLoggedIn && (
              <div
                className="relative rounded-xl p-4 mb-4 backdrop-blur-xl border"
                style={{
                  background: 'var(--color-glass)',
                  borderColor: 'var(--color-glass-border)',
                }}
              >
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    autoResize(e.target)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t('quickNotes.placeholder')}
                  rows={2}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed"
                  style={{
                    color: 'var(--color-text-primary)',
                    minHeight: '48px',
                    maxHeight: '200px',
                  }}
                />
                <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('quickNotes.shortcut')}
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() || creating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: inputValue.trim() ? 'var(--color-accent)' : 'var(--color-glass)',
                      color: inputValue.trim() ? '#fff' : 'var(--color-text-muted)',
                    }}
                  >
                    {creating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    {t('quickNotes.add')}
                  </button>
                </div>
              </div>
            )}

            {/* 灵感列表 */}
            {notes.length > 0 ? (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {notes.map((note) => (
                    <motion.div
                      key={note.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group relative rounded-xl p-4 backdrop-blur-xl border transition-all duration-200"
                      style={{
                        background: 'var(--color-glass)',
                        borderColor: editingId === note.id ? 'var(--color-accent)' : 'var(--color-glass-border)',
                        boxShadow: editingId === note.id ? '0 0 0 1px var(--color-accent)' : 'none',
                      }}
                    >
                      {editingId === note.id ? (
                        /* 编辑模式 */
                        <div>
                          <textarea
                            ref={editRef}
                            value={editContent}
                            onChange={(e) => {
                              setEditContent(e.target.value)
                              autoResize(e.target)
                            }}
                            onKeyDown={handleEditKeyDown}
                            className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed"
                            style={{
                              color: 'var(--color-text-primary)',
                              minHeight: '48px',
                              maxHeight: '200px',
                            }}
                          />
                          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {t('quickNotes.autoSave')}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={saveEdit}
                                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                style={{ color: 'var(--color-accent)' }}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* 查看模式 */
                        <div>
                          <p
                            className="text-sm leading-relaxed whitespace-pre-wrap break-words"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {note.content}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {formatTime(note.updatedAt)}
                            </span>
                            {isLoggedIn && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => startEdit(note)}
                                  className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                  style={{ color: 'var(--color-text-muted)' }}
                                  title={t('quickNotes.edit')}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(note.id)}
                                  className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                  style={{ color: deletingId === note.id ? '#ef4444' : 'var(--color-text-muted)' }}
                                  title={deletingId === note.id ? t('quickNotes.confirmDelete') : t('quickNotes.delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              !isLoggedIn && (
                <div
                  className="text-center py-8 text-sm"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {t('quickNotes.empty')}
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
