import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Command, ArrowRight, Globe, Github, Plus, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Bookmark } from '../../types/bookmark'

// 搜索引擎配置
interface SearchEngine {
  id: string
  name: string
  icon: React.ReactNode
  url: string // {query} 会被替换为搜索词
  shortcut: string
}

const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    icon: <Globe className="w-4 h-4 text-blue-400" />,
    url: 'https://www.google.com/search?q={query}',
    shortcut: 'g',
  },
  {
    id: 'bing',
    name: 'Bing',
    icon: <Globe className="w-4 h-4 text-cyan-400" />,
    url: 'https://www.bing.com/search?q={query}',
    shortcut: 'b',
  },
  {
    id: 'baidu',
    name: '百度',
    icon: <Globe className="w-4 h-4 text-blue-500" />,
    url: 'https://www.baidu.com/s?wd={query}',
    shortcut: 'bd',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: <Github className="w-4 h-4" />,
    url: 'https://github.com/search?q={query}',
    shortcut: 'gh',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    icon: <Globe className="w-4 h-4 text-orange-400" />,
    url: 'https://duckduckgo.com/?q={query}',
    shortcut: 'dd',
  },
  {
    id: 'bilibili',
    name: 'Bilibili',
    icon: <Globe className="w-4 h-4 text-pink-400" />,
    url: 'https://search.bilibili.com/all?keyword={query}',
    shortcut: 'bili',
  },
]

const STORAGE_KEY = 'spotlight_default_engine'

interface SpotlightSearchProps {
  isOpen: boolean
  onClose: () => void
  bookmarks: Bookmark[]
  onAddBookmark: (url: string) => void
}

export function SpotlightSearch({
  isOpen,
  onClose,
  bookmarks,
  onAddBookmark,
}: SpotlightSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isVanishing, setIsVanishing] = useState(false)
  const [showEngineSelector, setShowEngineSelector] = useState(false)
  const [defaultEngine, setDefaultEngine] = useState<SearchEngine>(SEARCH_ENGINES[0])
  const inputRef = useRef<HTMLInputElement>(null)
  const engineSelectorRef = useRef<HTMLDivElement>(null)

  // 加载保存的默认搜索引擎
  useEffect(() => {
    const savedEngineId = localStorage.getItem(STORAGE_KEY)
    if (savedEngineId) {
      const engine = SEARCH_ENGINES.find(e => e.id === savedEngineId)
      if (engine) setDefaultEngine(engine)
    }
  }, [])

  // 保存默认搜索引擎
  const handleSelectEngine = (engine: SearchEngine) => {
    setDefaultEngine(engine)
    localStorage.setItem(STORAGE_KEY, engine.id)
    setShowEngineSelector(false)
  }

  // 点击外部关闭引擎选择器
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (engineSelectorRef.current && !engineSelectorRef.current.contains(e.target as Node)) {
        setShowEngineSelector(false)
      }
    }
    if (showEngineSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEngineSelector])

  // 判断是否为 URL
  const isUrl = (str: string) => {
    try {
      new URL(str.startsWith('http') ? str : `https://${str}`)
      return str.includes('.') && !str.includes(' ')
    } catch {
      return false
    }
  }

  // 检测快捷键前缀并获取对应引擎
  const getEngineFromShortcut = (q: string): { engine: SearchEngine; searchTerm: string } | null => {
    for (const engine of SEARCH_ENGINES) {
      if (q.startsWith(engine.shortcut + ' ') && q.length > engine.shortcut.length + 1) {
        return {
          engine,
          searchTerm: q.slice(engine.shortcut.length + 1),
        }
      }
    }
    return null
  }

  // 生成结果
  const getResults = () => {
    const results: any[] = []
    const q = query.trim()

    if (!q) {
      return bookmarks.slice(0, 6).map((b) => ({
        id: b.id,
        type: 'bookmark',
        title: b.title,
        subtitle: new URL(b.url).hostname,
        favicon: b.favicon,
        action: () => {
          window.open(b.url, '_blank')
          onClose()
        },
      }))
    }

    // 检测快捷键搜索
    const shortcutMatch = getEngineFromShortcut(q)
    if (shortcutMatch) {
      const { engine, searchTerm } = shortcutMatch
      results.push({
        id: engine.id,
        type: 'command',
        title: `搜索 "${searchTerm}"`,
        subtitle: engine.name,
        icon: engine.icon,
        action: () => {
          window.open(engine.url.replace('{query}', encodeURIComponent(searchTerm)), '_blank')
          onClose()
        },
      })
    }

    // URL 添加
    if (isUrl(q)) {
      results.push({
        id: 'add',
        type: 'command',
        title: '添加到书签',
        subtitle: q,
        icon: <Plus className="w-5 h-5 text-green-400" />,
        action: () => {
          const url = q.startsWith('http') ? q : `https://${q}`
          onAddBookmark(url)
        },
      })
    }

    // 书签搜索
    const matches = bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q.toLowerCase()) ||
        b.url.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 5)

    matches.forEach((b) => {
      results.push({
        id: b.id,
        type: 'bookmark',
        title: b.title,
        subtitle: new URL(b.url).hostname,
        favicon: b.favicon,
        action: () => {
          window.open(b.url, '_blank')
          onClose()
        },
      })
    })

    // 默认搜索引擎搜索（无快捷键时）
    if (!shortcutMatch && q && !isUrl(q)) {
      results.push({
        id: 'default-search',
        type: 'command',
        title: `在 ${defaultEngine.name} 搜索 "${q}"`,
        subtitle: 'Enter 确认',
        icon: defaultEngine.icon,
        action: () => {
          window.open(defaultEngine.url.replace('{query}', encodeURIComponent(q)), '_blank')
          onClose()
        },
      })
    }

    return results
  }

  const results = getResults()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setShowEngineSelector(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            // 触发消散动画
            setIsVanishing(true)
            setTimeout(() => {
              results[selectedIndex].action()
              setIsVanishing(false)
            }, 300)
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Spotlight Container */}
          <motion.div
            className="fixed inset-x-4 top-[15%] z-50 mx-auto max-w-2xl"
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-[#0d0d14]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-nebula-purple/20">
              {/* Glow Effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-nebula-purple/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-nebula-pink/20 rounded-full blur-3xl" />
              </div>

              {/* Input Area */}
              <div className="relative flex items-center gap-4 px-6 py-5 border-b border-white/5">
                <Search className="w-5 h-5 text-white/40 shrink-0" />
                
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setSelectedIndex(0)
                    }}
                    placeholder="搜索书签、输入网址或命令..."
                    className={cn(
                      'w-full bg-transparent text-lg text-white placeholder:text-white/30',
                      'focus:outline-none',
                      isVanishing && 'vanish-text'
                    )}
                  />
                  
                  {/* Vanish Particles */}
                  {isVanishing && (
                    <VanishParticles text={query} />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 text-xs rounded bg-white/5 text-white/40 border border-white/10">
                    ESC
                  </kbd>
                </div>
              </div>

              {/* Hints */}
              <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between text-xs text-white/30">
                <div className="flex items-center gap-4 flex-wrap">
                  {SEARCH_ENGINES.slice(0, 4).map(engine => (
                    <span key={engine.id} className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5">{engine.shortcut}</kbd> {engine.name}
                    </span>
                  ))}
                  <span className="flex items-center gap-1.5">
                    <Command className="w-3 h-3" /> URL 自动识别
                  </span>
                </div>
                
                {/* 搜索引擎选择器 */}
                <div className="relative" ref={engineSelectorRef}>
                  <button
                    onClick={() => setShowEngineSelector(!showEngineSelector)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {defaultEngine.icon}
                    <span className="text-white/50">{defaultEngine.name}</span>
                    <ChevronDown className={cn(
                      "w-3 h-3 transition-transform",
                      showEngineSelector && "rotate-180"
                    )} />
                  </button>
                  
                  <AnimatePresence>
                    {showEngineSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-44 py-1 rounded-lg bg-[#1a1a24] border border-white/10 shadow-xl z-20 max-h-64 overflow-y-auto"
                      >
                        <div className="px-3 py-1.5 text-[10px] text-white/30 uppercase tracking-wide sticky top-0 bg-[#1a1a24]">
                          默认搜索引擎
                        </div>
                        {SEARCH_ENGINES.map(engine => (
                          <button
                            key={engine.id}
                            onClick={() => handleSelectEngine(engine)}
                            className={cn(
                              "w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-white/5 transition-colors",
                              engine.id === defaultEngine.id && "bg-white/5"
                            )}
                          >
                            {engine.icon}
                            <span className="text-white/70 text-sm">{engine.name}</span>
                            {engine.id === defaultEngine.id && (
                              <span className="ml-auto text-green-400 text-xs">✓</span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto py-2">
                {results.map((result, index) => (
                  <motion.button
                    key={result.id}
                    className={cn(
                      'w-full px-6 py-3 flex items-center gap-4 text-left transition-colors',
                      index === selectedIndex ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                    )}
                    onClick={result.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      {result.icon ? (
                        result.icon
                      ) : result.favicon ? (
                        <img src={result.favicon} alt="" className="w-5 h-5" />
                      ) : (
                        <Globe className="w-5 h-5 text-white/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-white/40 truncate">{result.subtitle}</div>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <ArrowRight className="w-4 h-4 text-white/30" />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-xs text-white/30">
                <span>Nebula Portal</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-white/5">↑↓</kbd> 导航
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-white/5">↵</kbd> 确认
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

// 文字消散粒子效果
function VanishParticles({ text }: { text: string }) {
  const particles = text.split('').map((char, i) => ({
    id: i,
    char,
    x: Math.random() * 100 - 50,
    y: Math.random() * -100 - 20,
    rotation: Math.random() * 360,
    scale: Math.random() * 0.5 + 0.5,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute text-white/60"
          style={{ left: `${(p.id / text.length) * 100}%` }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          animate={{
            opacity: 0,
            x: p.x,
            y: p.y,
            scale: p.scale,
            rotate: p.rotation,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {p.char}
        </motion.span>
      ))}
    </div>
  )
}
