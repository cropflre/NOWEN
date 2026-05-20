import React, { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Loader2,
  Maximize2,
  Minimize2,
  Hash,
  Sparkles,
  CornerDownLeft,
  Wand2,
  Languages,
  Scissors,
  Type,
  FileText,
  Tags as TagsIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AIAction } from '../../../lib/api'

interface NoteComposerProps {
  onSubmit: (content: string) => Promise<void>
  creating: boolean
  /** 是否启用 AI（nowen-note 配置好才启用） */
  aiEnabled?: boolean
  /**
   * 流式 AI：父级用 notesApi.aiStream 包一层提供，每次拿到新 token 调用 onToken。
   * 设计：返回 Promise<full string>，方便 NoteComposer 在结束后把整段替换进 textarea。
   */
  onAiAction?: (
    action: AIAction,
    text: string,
    onToken: (chunk: string) => void,
  ) => Promise<string>
}

/** 斜杠菜单项 */
interface SlashItem {
  action: AIAction
  icon: React.ComponentType<{ className?: string }>
  label: string
  hint: string
  /** 替换文本范围：whole=替换全部，append=追加到末尾，prepend=放到开头 */
  mode: 'replace' | 'append' | 'prepend'
}

/**
 * NoteComposer · 灵感输入器
 *  - 默认：单行轻量
 *  - Shift+Enter / 点 ⤢：展开富文本态
 *  - 行首 `/`：弹出 AI 斜杠命令菜单（润色/翻译/总结/续写/取标题/补标签）
 */
export function NoteComposer({
  onSubmit,
  creating,
  aiEnabled = false,
  onAiAction,
}: NoteComposerProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [aiBusy, setAiBusy] = useState<AIAction | null>(null)
  const [streamPreview, setStreamPreview] = useState('')
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashIndex, setSlashIndex] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const slashItems = useMemo<SlashItem[]>(
    () => [
      { action: 'polish', icon: Wand2, label: t('quickNotes.ai.polish', { defaultValue: '润色' }), hint: t('quickNotes.ai.polishHint', { defaultValue: '让语言更流畅' }), mode: 'replace' },
      { action: 'fix_grammar', icon: Type, label: t('quickNotes.ai.fixGrammar', { defaultValue: '修正语法' }), hint: t('quickNotes.ai.fixGrammarHint', { defaultValue: '保留原意修复语法' }), mode: 'replace' },
      { action: 'summarize', icon: FileText, label: t('quickNotes.ai.summarize', { defaultValue: '总结' }), hint: t('quickNotes.ai.summarizeHint', { defaultValue: '提取核心要点' }), mode: 'replace' },
      { action: 'shorten', icon: Scissors, label: t('quickNotes.ai.shorten', { defaultValue: '精简' }), hint: t('quickNotes.ai.shortenHint', { defaultValue: '压缩冗余表达' }), mode: 'replace' },
      { action: 'continue', icon: Plus, label: t('quickNotes.ai.continue', { defaultValue: '续写' }), hint: t('quickNotes.ai.continueHint', { defaultValue: '在末尾补充内容' }), mode: 'append' },
      { action: 'translate_en', icon: Languages, label: t('quickNotes.ai.translateEn', { defaultValue: '译为英文' }), hint: t('quickNotes.ai.translateEnHint', { defaultValue: 'Translate to English' }), mode: 'replace' },
      { action: 'translate_zh', icon: Languages, label: t('quickNotes.ai.translateZh', { defaultValue: '译为中文' }), hint: t('quickNotes.ai.translateZhHint', { defaultValue: 'Translate to Chinese' }), mode: 'replace' },
      { action: 'tags', icon: TagsIcon, label: t('quickNotes.ai.tags', { defaultValue: '生成标签' }), hint: t('quickNotes.ai.tagsHint', { defaultValue: '抽取 3-5 个标签' }), mode: 'append' },
    ],
    [t],
  )

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [expanded])

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, expanded ? 320 : 96) + 'px'
  }

  /** 检测光标所在行是否以 `/` 开头来决定是否打开斜杠菜单 */
  const updateSlashState = (text: string, caretPos: number) => {
    if (!aiEnabled || !onAiAction) {
      setSlashOpen(false)
      return
    }
    // 取光标前的当前行
    const before = text.slice(0, caretPos)
    const lineStart = before.lastIndexOf('\n') + 1
    const line = before.slice(lineStart)
    if (line === '/' || /^\/\w*$/.test(line)) {
      setSlashOpen(true)
      setSlashIndex(0)
    } else {
      setSlashOpen(false)
    }
  }

  const handleSubmit = async () => {
    const content = value.trim()
    if (!content || creating) return
    try {
      await onSubmit(content)
      setValue('')
      if (inputRef.current) inputRef.current.style.height = 'auto'
      setExpanded(false)
      setSlashOpen(false)
    } catch {
      // 上层处理
    }
  }

  /** 执行某个 AI 动作（流式），结果写回 textarea */
  const runAiAction = async (item: SlashItem) => {
    if (!onAiAction) return
    // 把斜杠所在行删掉（如果是因为 / 触发），并把光标位置后的内容当作待处理文本
    const ta = inputRef.current
    let baseText = value
    if (ta && slashOpen) {
      const caret = ta.selectionStart || 0
      const before = baseText.slice(0, caret)
      const after = baseText.slice(caret)
      const lineStart = before.lastIndexOf('\n') + 1
      // 删掉 /xxx 这部分
      baseText = before.slice(0, lineStart) + after
      setValue(baseText)
    }
    setSlashOpen(false)
    if (!baseText.trim()) return
    setAiBusy(item.action)
    setStreamPreview('')
    try {
      let accumulated = ''
      const result = await onAiAction(item.action, baseText.trim(), (chunk) => {
        accumulated += chunk
        setStreamPreview(accumulated)
      })
      const final = result || accumulated
      // 根据 mode 应用结果
      if (item.mode === 'replace') {
        setValue(final.trim())
      } else if (item.mode === 'append') {
        const sep = baseText.endsWith('\n') ? '' : '\n\n'
        setValue(baseText + sep + final.trim())
      } else {
        setValue(final.trim() + '\n\n' + baseText)
      }
      // 撑高
      requestAnimationFrame(() => {
        if (inputRef.current) autoResize(inputRef.current)
      })
    } catch (err) {
      console.error('[AI] action failed:', err)
    } finally {
      setAiBusy(null)
      setStreamPreview('')
      setExpanded(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 斜杠菜单激活时优先处理上下选择 / 回车确认 / Esc 关闭
    if (slashOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashIndex((i) => (i + 1) % slashItems.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashIndex((i) => (i - 1 + slashItems.length) % slashItems.length)
        return
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        runAiAction(slashItems[slashIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setSlashOpen(false)
        return
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    // Shift + Enter 切换展开
    if (e.shiftKey && e.key === 'Enter' && !expanded) {
      e.preventDefault()
      setExpanded(true)
    }
  }

  return (
    <motion.div
      layout
      className="relative z-30 rounded-2xl backdrop-blur-xl border overflow-visible transition-colors"
      style={{
        background: 'var(--color-glass)',
        // 默认：玻璃描边；展开/聚焦：用低饱和的强调色 30%，避免实色厚边
        borderColor: expanded
          ? 'color-mix(in srgb, var(--color-accent) 30%, transparent)'
          : 'var(--color-glass-border)',
        // 仅展开时给一层非常轻的外发光，不再叠加 1px 实色描边
        boxShadow: expanded
          ? '0 8px 32px -16px color-mix(in srgb, var(--color-accent) 28%, transparent)'
          : undefined,
      }}
    >
      {/* 顶部光带（呼吸） */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[2px] pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
          opacity: expanded ? 0.5 : 0.2,
        }}
        animate={{ opacity: expanded ? [0.25, 0.55, 0.25] : 0.2 }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />

      <div className="p-4">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              autoResize(e.target)
              updateSlashState(e.target.value, e.target.selectionStart || 0)
            }}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              const ta = e.target as HTMLTextAreaElement
              updateSlashState(ta.value, ta.selectionStart || 0)
            }}
            onFocus={() => {
              if (value.includes('\n')) setExpanded(true)
            }}
            placeholder={
              expanded ? t('quickNotes.placeholder') : t('quickNotes.placeholderShort')
            }
            rows={expanded ? 4 : 1}
            className={`w-full bg-transparent border-none outline-none resize-none leading-relaxed transition-all ${
              expanded ? 'text-sm' : 'text-[15px]'
            }`}
            style={{
              color: 'var(--color-text-primary)',
              minHeight: expanded ? '100px' : '24px',
              maxHeight: expanded ? '320px' : '96px',
            }}
          />

          {/* 斜杠菜单：浮在 textarea 下方 */}
          <AnimatePresence>
            {slashOpen && aiEnabled && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 mt-1 left-0 right-0 sm:right-auto sm:min-w-[260px] rounded-xl backdrop-blur-2xl border overflow-hidden shadow-2xl"
                style={{
                  background: 'var(--color-glass)',
                  borderColor: 'var(--color-glass-border)',
                  boxShadow: '0 16px 48px -16px rgba(0,0,0,0.45)',
                }}
              >
                <div
                  className="px-3 py-1.5 text-[10px] uppercase tracking-wider"
                  style={{
                    color: 'var(--color-text-muted)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  {t('quickNotes.ai.menuTitle', { defaultValue: 'AI 命令 · ↑↓ 选择 · Enter 执行' })}
                </div>
                <ul className="max-h-[260px] overflow-y-auto">
                  {slashItems.map((item, idx) => {
                    const Icon = item.icon
                    const active = idx === slashIndex
                    return (
                      <li key={item.action}>
                        <button
                          type="button"
                          onMouseEnter={() => setSlashIndex(idx)}
                          onClick={() => runAiAction(item)}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors"
                          style={{
                            background: active
                              ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)'
                              : 'transparent',
                            color: active ? 'var(--color-accent)' : 'var(--color-text-primary)',
                          }}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="flex-1 text-sm">{item.label}</span>
                          <span
                            className="text-[10px] truncate hidden sm:inline"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {item.hint}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 流式预览（AI 正在生成时显示在 textarea 下方） */}
        {aiBusy && streamPreview && (
          <div
            className="mt-2 px-3 py-2 rounded-lg text-[12px] font-mono whitespace-pre-wrap"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
              border: '1px dashed color-mix(in srgb, var(--color-accent) 30%, transparent)',
              color: 'var(--color-text-primary)',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          >
            <div className="flex items-center gap-1.5 text-[10px] mb-1" style={{ color: 'var(--color-accent)' }}>
              <Sparkles className="w-3 h-3 animate-pulse" />
              {t('quickNotes.ai.streaming', { defaultValue: 'AI 正在生成…' })}
            </div>
            {streamPreview}
          </div>
        )}

        {/* 操作栏 */}
        <div
          className="flex items-center justify-between mt-2 pt-2 gap-2"
          style={{ borderTop: '1px solid var(--color-glass-border)' }}
        >
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-md transition-colors hover:bg-white/10"
              style={{ color: 'var(--color-text-muted)' }}
              title={
                expanded
                  ? t('quickNotes.actions.collapse')
                  : t('quickNotes.actions.expand')
              }
            >
              {expanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => {
                setValue((v) => (v.endsWith(' ') || v === '' ? v + '#' : v + ' #'))
                setExpanded(true)
                inputRef.current?.focus()
              }}
              className="p-1.5 rounded-md transition-colors hover:bg-white/10"
              style={{ color: 'var(--color-text-muted)' }}
              title={t('quickNotes.actions.addTag')}
            >
              <Hash className="w-3.5 h-3.5" />
            </button>

            {aiEnabled && (
              <button
                onClick={() => {
                  // 等同输入 / 触发斜杠菜单
                  setExpanded(true)
                  setSlashOpen(true)
                  setSlashIndex(0)
                  setTimeout(() => inputRef.current?.focus(), 50)
                }}
                disabled={aiBusy !== null}
                className="px-2 py-1 rounded-md text-xs transition-all hover:bg-white/10 flex items-center gap-1 disabled:opacity-40"
                style={{ color: 'var(--color-accent)' }}
                title={t('quickNotes.ai.menuTitle', { defaultValue: 'AI 命令' })}
              >
                {aiBusy ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>{t('quickNotes.ai.button', { defaultValue: 'AI' })}</span>
              </button>
            )}

            <span
              className="text-[10px] hidden sm:inline-flex items-center gap-1 ml-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <CornerDownLeft className="w-3 h-3" />
              {t('quickNotes.shortcut')}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!value.trim() || creating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              background: value.trim() ? 'var(--color-accent)' : 'var(--color-glass)',
              color: value.trim() ? '#fff' : 'var(--color-text-muted)',
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
    </motion.div>
  )
}
