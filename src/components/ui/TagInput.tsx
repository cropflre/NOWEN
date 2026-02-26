import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag } from 'lucide-react'
import { cn } from '../../lib/utils'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  maxTags?: number
  className?: string
}

export function TagInput({
  tags,
  onChange,
  suggestions = [],
  placeholder = '输入标签后按 Enter...',
  maxTags = 10,
  className,
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 过滤建议：排除已选 + 匹配输入
  const filteredSuggestions = suggestions.filter(
    s => !tags.includes(s) && (input ? s.toLowerCase().includes(input.toLowerCase()) : true)
  ).slice(0, 8)

  // 点击外部关闭建议
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return
    onChange([...tags, trimmed])
    setInput('')
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        addTag(filteredSuggestions[selectedIndex])
      } else if (input.trim()) {
        addTag(input)
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    } else if (e.key === ',' || e.key === '，') {
      e.preventDefault()
      if (input.trim()) addTag(input)
    }
  }

  // Tag 颜色生成（基于哈希）
  const getTagColor = (tag: string) => {
    const colors = [
      { bg: 'rgba(147,51,234,0.15)', border: 'rgba(147,51,234,0.3)', text: 'rgb(168,85,247)' },
      { bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)', text: 'rgb(34,211,238)' },
      { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: 'rgb(52,211,153)' },
      { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: 'rgb(251,191,36)' },
      { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)', text: 'rgb(244,114,182)' },
      { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', text: 'rgb(129,140,248)' },
    ]
    let hash = 0
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm transition-all cursor-text min-h-[44px]"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-glass-border)',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <Tag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />

        <AnimatePresence mode="popLayout">
          {tags.map(tag => {
            const color = getTagColor(tag)
            return (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                style={{
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                  color: color.text,
                }}
              >
                #{tag}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTag(tag)
                  }}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            )
          })}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => {
            setInput(e.target.value)
            setShowSuggestions(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={tags.length >= maxTags}
          className="flex-1 min-w-[80px] bg-transparent outline-none text-sm"
          style={{ color: 'var(--color-text-primary)' }}
        />
      </div>

      {/* 建议下拉 */}
      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            {filteredSuggestions.map((s, i) => {
              const color = getTagColor(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    addTag(s)
                    setShowSuggestions(false)
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors',
                    i === selectedIndex ? 'bg-[var(--color-glass-hover)]' : 'hover:bg-[var(--color-glass-hover)]',
                  )}
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span
                    className="px-1.5 py-0.5 rounded text-xs"
                    style={{ background: color.bg, color: color.text }}
                  >
                    #{s}
                  </span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
