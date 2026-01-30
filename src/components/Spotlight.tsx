import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Globe, 
  Github, 
  Plus,
  ArrowRight,
  Command,
  Loader2,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { Bookmark } from '../types/bookmark'
import { cn } from '../lib/utils'

interface SpotlightProps {
  isOpen: boolean
  onClose: () => void
  bookmarks: Bookmark[]
  onAddBookmark: (url: string) => void
  onQuickAdd?: (url: string) => Promise<void>
}

type CommandType = 'search' | 'google' | 'github' | 'add' | 'bookmark'

interface CommandResult {
  id: string
  type: CommandType
  title: string
  subtitle?: string
  icon?: React.ReactNode
  favicon?: string
  action: () => void
}

export function Spotlight({ 
  isOpen, 
  onClose, 
  bookmarks, 
  onAddBookmark,
  onQuickAdd 
}: SpotlightProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 判断是否为 URL
  const isUrl = (str: string) => {
    try {
      new URL(str.startsWith('http') ? str : `https://${str}`)
      return str.includes('.') && !str.includes(' ')
    } catch {
      return false
    }
  }

  // 生成搜索结果
  const getResults = useCallback((): CommandResult[] => {
    const results: CommandResult[] = []
    const q = query.trim()

    if (!q) {
      // 显示最近访问的书签
      const recentBookmarks = bookmarks.slice(0, 5)
      recentBookmarks.forEach(b => {
        results.push({
          id: b.id,
          type: 'bookmark',
          title: b.title,
          subtitle: new URL(b.url).hostname,
          favicon: b.favicon,
          action: () => {
            window.open(b.url, '_blank')
            onClose()
          }
        })
      })
      return results
    }

    // Google 搜索命令
    if (q.startsWith('g ')) {
      const searchTerm = q.slice(2)
      if (searchTerm) {
        results.push({
          id: 'google-search',
          type: 'google',
          title: `搜索 "${searchTerm}"`,
          subtitle: 'Google',
          icon: <Globe className="w-5 h-5 text-blue-400" />,
          action: () => {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`, '_blank')
            onClose()
          }
        })
      }
    }

    // GitHub 搜索命令
    if (q.startsWith('gh ')) {
      const searchTerm = q.slice(3)
      if (searchTerm) {
        results.push({
          id: 'github-search',
          type: 'github',
          title: `搜索 "${searchTerm}"`,
          subtitle: 'GitHub',
          icon: <Github className="w-5 h-5 text-white" />,
          action: () => {
            window.open(`https://github.com/search?q=${encodeURIComponent(searchTerm)}`, '_blank')
            onClose()
          }
        })
      }
    }

    // URL 识别 - 添加书签
    if (isUrl(q)) {
      results.push({
        id: 'add-url',
        type: 'add',
        title: '添加到书签',
        subtitle: q,
        icon: <Plus className="w-5 h-5 text-green-400" />,
        action: () => {
          const url = q.startsWith('http') ? q : `https://${q}`
          onAddBookmark(url)
        }
      })
    }

    // 搜索现有书签
    const matchingBookmarks = bookmarks.filter(b => 
      b.title.toLowerCase().includes(q.toLowerCase()) ||
      b.url.toLowerCase().includes(q.toLowerCase()) ||
      b.description?.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 6)

    matchingBookmarks.forEach(b => {
      results.push({
        id: b.id,
        type: 'bookmark',
        title: b.title,
        subtitle: new URL(b.url).hostname,
        favicon: b.favicon,
        action: () => {
          window.open(b.url, '_blank')
          onClose()
        }
      })
    })

    // 如果没有匹配，提供 Google 搜索
    if (results.length === 0 && q && !q.startsWith('g ') && !q.startsWith('gh ')) {
      results.push({
        id: 'google-fallback',
        type: 'google',
        title: `在 Google 搜索 "${q}"`,
        subtitle: '按 Enter 搜索',
        icon: <Globe className="w-5 h-5 text-blue-400" />,
        action: () => {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank')
          onClose()
        }
      })
    }

    return results
  }, [query, bookmarks, onAddBookmark, onClose])

  const results = getResults()

  // 自动聚焦
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            results[selectedIndex].action()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  // 滚动到选中项
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 - 带缩放效果 */}
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          >
            <motion.div 
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </motion.div>

          {/* Spotlight 主体 */}
          <motion.div
            className="fixed inset-x-4 top-[20%] z-50 mx-auto max-w-2xl"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="overflow-hidden rounded-2xl bg-[#1a1a24]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50">
              {/* 输入区 */}
              <div className="flex items-center gap-4 px-5 border-b border-white/5">
                <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSelectedIndex(0)
                  }}
                  placeholder="搜索书签、输入网址或命令..."
                  className="flex-1 py-5 bg-transparent text-lg text-white placeholder:text-white/30 focus:outline-none"
                />
                {isLoading && (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                )}
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-white/5 text-white/40">
                  ESC
                </kbd>
              </div>

              {/* 提示 */}
              {!query && (
                <div className="px-5 py-3 border-b border-white/5 flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5">g</kbd>
                    <span>Google</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5">gh</kbd>
                    <span>GitHub</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5">URL</kbd>
                    <span>添加书签</span>
                  </span>
                </div>
              )}

              {/* 结果列表 */}
              <div 
                ref={listRef}
                className="max-h-[400px] overflow-y-auto py-2"
              >
                {results.length === 0 && query && (
                  <div className="px-5 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    没有找到匹配的结果
                  </div>
                )}

                {results.map((result, index) => (
                  <motion.button
                    key={result.id}
                    className={cn(
                      "w-full px-5 py-3 flex items-center gap-4 text-left transition-colors",
                      index === selectedIndex ? "bg-white/5" : "hover:bg-white/[0.02]"
                    )}
                    onClick={result.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    {/* 图标 */}
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                      {result.icon ? (
                        result.icon
                      ) : result.favicon ? (
                        <img src={result.favicon} alt="" className="w-5 h-5 object-contain" />
                      ) : (
                        <ExternalLink className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div 
                        className="font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div 
                          className="text-sm truncate mt-0.5"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {result.subtitle}
                        </div>
                      )}
                    </div>

                    {/* 快捷键提示 */}
                    {index === selectedIndex && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>打开</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* 底部状态栏 */}
              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>粘贴链接自动识别</span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-white/5">↑↓</kbd>
                    <span>导航</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-white/5">↵</kbd>
                    <span>确认</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
