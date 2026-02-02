import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, Github, Plus, ArrowRight, Command } from 'lucide-react'
import { Bookmark } from '../types/bookmark'
import { cn, getIconComponent } from '../lib/utils'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  bookmarks: Bookmark[]
  onAddBookmark: (url: string) => void
}

type CommandType = 'search' | 'google' | 'github' | 'add' | 'bookmark'

interface CommandItem {
  id: string
  type: CommandType
  title: string
  description?: string
  icon: React.ReactNode
  action: () => void
}

export function CommandPalette({
  isOpen,
  onClose,
  bookmarks,
  onAddBookmark,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // 解析命令
  const commands = useMemo((): CommandItem[] => {
    const items: CommandItem[] = []
    const trimmedQuery = query.trim().toLowerCase()

    // 快捷命令
    if (trimmedQuery.startsWith('g ')) {
      const searchTerm = query.slice(2).trim()
      if (searchTerm) {
        items.push({
          id: 'google',
          type: 'google',
          title: `在 Google 搜索 "${searchTerm}"`,
          icon: <Globe className="w-5 h-5" />,
          action: () => {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`, '_blank')
            onClose()
          },
        })
      }
    } else if (trimmedQuery.startsWith('gh ')) {
      const searchTerm = query.slice(3).trim()
      if (searchTerm) {
        items.push({
          id: 'github',
          type: 'github',
          title: `在 GitHub 搜索 "${searchTerm}"`,
          icon: <Github className="w-5 h-5" />,
          action: () => {
            window.open(`https://github.com/search?q=${encodeURIComponent(searchTerm)}`, '_blank')
            onClose()
          },
        })
      }
    } else if (trimmedQuery.startsWith('http://') || trimmedQuery.startsWith('https://')) {
      // URL 添加
      items.push({
        id: 'add-url',
        type: 'add',
        title: `添加书签: ${query}`,
        description: '将此 URL 添加到书签',
        icon: <Plus className="w-5 h-5" />,
        action: () => {
          onAddBookmark(query.trim())
          setQuery('')
          onClose()
        },
      })
    } else {
      // 搜索书签
      const filtered = bookmarks.filter(b =>
        b.title.toLowerCase().includes(trimmedQuery) ||
        b.url.toLowerCase().includes(trimmedQuery) ||
        b.description?.toLowerCase().includes(trimmedQuery)
      )

      filtered.slice(0, 8).forEach(bookmark => {
        const iconElement = bookmark.iconUrl ? (
          <img src={bookmark.iconUrl} alt="" className="w-5 h-5 rounded object-contain" />
        ) : bookmark.icon ? (
          (() => {
            const IconComp = getIconComponent(bookmark.icon)
            return <IconComp className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          })()
        ) : bookmark.favicon ? (
          <img src={bookmark.favicon} alt="" className="w-5 h-5 rounded" />
        ) : (
          <Globe className="w-5 h-5" />
        )
        
        items.push({
          id: bookmark.id,
          type: 'bookmark',
          title: bookmark.title,
          description: new URL(bookmark.url).hostname,
          icon: iconElement,
          action: () => {
            window.open(bookmark.url, '_blank')
            onClose()
          },
        })
      })

      // 默认搜索选项
      if (trimmedQuery && trimmedQuery.length > 1) {
        items.push({
          id: 'google-search',
          type: 'google',
          title: `在 Google 搜索 "${query}"`,
          icon: <Globe className="w-5 h-5 opacity-50" />,
          action: () => {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank')
            onClose()
          },
        })
      }
    }

    return items
  }, [query, bookmarks, onAddBookmark, onClose])

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, commands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (commands[selectedIndex]) {
            commands[selectedIndex].action()
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
  }, [isOpen, commands, selectedIndex, onClose])

  // 打开时聚焦
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 command-backdrop bg-black/50"
            onClick={onClose}
          />

          {/* 命令面板 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed top-[20%] left-1/2 -translate-x-1/2 z-50',
              'w-full max-w-xl',
              'rounded-2xl glass shadow-2xl',
              'overflow-hidden'
            )}
          >
            {/* 搜索输入框 */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
              <Search className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索书签，或输入 URL 添加..."
                className={cn(
                  'flex-1 bg-transparent border-none outline-none',
                  'text-base placeholder:text-white/30'
                )}
                style={{ color: 'var(--text-primary)' }}
              />
              <kbd 
                className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs rounded-lg glass"
                style={{ color: 'var(--text-muted)' }}
              >
                ESC
              </kbd>
            </div>

            {/* 命令提示 */}
            {!query && (
              <div className="px-5 py-3 border-b border-white/5">
                <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded glass">g</kbd>
                    <span>Google 搜索</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded glass">gh</kbd>
                    <span>GitHub 搜索</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded glass">https://...</kbd>
                    <span>添加书签</span>
                  </span>
                </div>
              </div>
            )}

            {/* 搜索结果 */}
            <div className="max-h-[400px] overflow-y-auto">
              {commands.length > 0 ? (
                <div className="py-2">
                  {commands.map((item, index) => (
                    <motion.button
                      key={item.id}
                      className={cn(
                        'w-full px-5 py-3 flex items-center gap-4',
                        'text-left transition-colors',
                        selectedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'
                      )}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div 
                        className="flex-shrink-0"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {item.title}
                        </div>
                        {item.description && (
                          <div 
                            className="text-sm truncate"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                      {selectedIndex === index && (
                        <ArrowRight 
                          className="w-4 h-4 flex-shrink-0" 
                          style={{ color: 'var(--text-muted)' }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              ) : query ? (
                <div 
                  className="px-5 py-8 text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>未找到匹配的书签</p>
                </div>
              ) : (
                <div 
                  className="px-5 py-8 text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Command className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>输入关键词搜索书签</p>
                </div>
              )}
            </div>

            {/* 底部快捷键提示 */}
            <div 
              className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded glass">↑↓</kbd>
                  <span>选择</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded glass">↵</kbd>
                  <span>打开</span>
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
