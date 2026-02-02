import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, Globe, Github, Plus, ArrowRight, Command } from 'lucide-react'
import { Bookmark } from '../types/bookmark'
import { cn, getIconComponent } from '../lib/utils'
import { popUpVariant } from '../lib/animation'

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

// 抽离列表项组件，使用 memo 避免不必要的重渲染
interface CommandItemRowProps {
  item: CommandItem
  isSelected: boolean
  onSelect: () => void
  onClick: () => void
}

const CommandItemRow = memo(function CommandItemRow({ 
  item, 
  isSelected, 
  onSelect, 
  onClick 
}: CommandItemRowProps) {
  return (
    <motion.button
      initial={false}
      animate={{
        x: isSelected ? 4 : 0,
        backgroundColor: isSelected ? 'rgba(255,255,255,0.02)' : 'transparent',
      }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full h-full px-5 py-3 flex items-center gap-4 text-left relative"
      onClick={onClick}
      onMouseEnter={onSelect}
    >
      {/* Glow Bar - 选中时显示，柔和发光 */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-full"
            style={{
              background: 'linear-gradient(180deg, rgba(0,242,254,0.6), rgba(102,126,234,0.4))',
              boxShadow: '0 0 8px rgba(0,242,254,0.3)',
            }}
          />
        )}
      </AnimatePresence>

      {/* 图标 */}
      <motion.div 
        className="flex-shrink-0"
        animate={{
          color: isSelected ? 'rgba(0,242,254,0.8)' : 'rgba(255,255,255,0.5)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {item.icon}
      </motion.div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <motion.div 
          className="font-medium truncate"
          animate={{
            color: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {item.title}
        </motion.div>
        {item.description && (
          <div className="text-sm truncate text-white/30">
            {item.description}
          </div>
        )}
      </div>

      {/* 箭头指示器 */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 0.6, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <ArrowRight className="w-4 h-4 flex-shrink-0 text-nebula-cyan/60" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
})

export function CommandPalette({
  isOpen,
  onClose,
  bookmarks,
  onAddBookmark,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  // 解析命令 - 移除限制，让虚拟列表处理大量数据
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
      // 搜索书签 - 不再限制数量，让虚拟列表处理
      const filtered = bookmarks.filter(b =>
        b.title.toLowerCase().includes(trimmedQuery) ||
        b.url.toLowerCase().includes(trimmedQuery) ||
        b.description?.toLowerCase().includes(trimmedQuery)
      )

      filtered.forEach(bookmark => {
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

  // 虚拟列表配置 - 每项高度约 56px
  const ITEM_HEIGHT = 56
  const rowVirtualizer = useVirtualizer({
    count: commands.length,
    getScrollElement: () => listContainerRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5, // 预渲染5项，保证滚动流畅
  })

  // 当选中项变化时，滚动到可见区域
  useEffect(() => {
    if (commands.length > 0) {
      rowVirtualizer.scrollToIndex(selectedIndex, { align: 'auto' })
    }
  }, [selectedIndex, rowVirtualizer, commands.length])

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
          {/* 背景遮罩 - 深邃磨砂感 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* HUD 命令面板 - 移动端适配 + 浮出协议 */}
          <motion.div
            variants={popUpVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              // 桌面端: 固定在顶部 20%
              // 移动端: 使用 dvh 适配键盘弹出，距顶部 10dvh 确保不被遮挡
              'fixed left-1/2 -translate-x-1/2 z-50',
              'top-[10dvh] sm:top-[20%]',
              // 响应式宽度：移动端留边距，桌面端 max-w-xl
              'w-[calc(100%-2rem)] sm:w-full max-w-xl',
              'mx-4 sm:mx-0'
            )}
          >
            {/* 外层容器 - 静谧流光边框 */}
            <div className="relative rounded-2xl p-[1px] overflow-hidden">
              {/* 底层静态边框 - 极低透明度 */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-20"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,242,254,0.3), rgba(102,126,234,0.2))',
                }}
              />
              
              {/* 流动能量液体 - 缓慢、若隐若现 */}
              <div
                className="absolute w-32 h-32 rounded-full blur-xl opacity-15"
                style={{
                  background: 'radial-gradient(circle, #00f2fe 0%, transparent 60%)',
                  offsetPath: 'rect(0 100% 100% 0 round 16px)',
                  animation: 'border-beam 20s linear infinite',
                }}
              />
              <div
                className="absolute w-24 h-24 rounded-full blur-xl opacity-10"
                style={{
                  background: 'radial-gradient(circle, #667eea 0%, transparent 60%)',
                  offsetPath: 'rect(0 100% 100% 0 round 16px)',
                  animation: 'border-beam 20s linear infinite',
                  animationDelay: '-10s',
                }}
              />

              {/* 主内容容器 - 深邃磨砂质感 */}
              <div className="relative rounded-2xl bg-black/80 backdrop-blur-xl overflow-hidden">
                {/* 内部微光边框 */}
                <div className="absolute inset-0 rounded-2xl border border-white/[0.06]" />
                
                {/* 顶部发光装饰线 - 柔和 */}
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] opacity-40"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(0,242,254,0.5), rgba(102,126,234,0.4), transparent)',
                  }}
                />

                {/* 搜索输入区域 */}
                <div className="relative">
                  {/* 聚光灯效果 - 柔和静谧 */}
                  <div 
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse 50% 30% at 50% 0%, rgba(0, 242, 254, 0.12), transparent 50%)',
                    }}
                  />
                  
                  {/* 输入框容器 */}
                  <div className="relative flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                    <motion.div
                      animate={{ 
                        opacity: [0.4, 0.7, 0.4],
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <Search className="w-5 h-5 text-nebula-cyan/70" />
                    </motion.div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="搜索书签，或输入 URL 添加..."
                      className={cn(
                        'flex-1 bg-transparent border-none outline-none',
                        'text-base text-white placeholder:text-white/25'
                      )}
                    />
                    <kbd 
                      className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40"
                    >
                      ESC
                    </kbd>
                  </div>
                </div>

                {/* 命令提示 */}
                <AnimatePresence>
                  {!query && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="px-5 py-3 border-b border-white/5 overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1.5">
                          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-nebula-cyan">g</kbd>
                          <span>Google 搜索</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-nebula-purple">gh</kbd>
                          <span>GitHub 搜索</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-nebula-pink">https://...</kbd>
                          <span>添加书签</span>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 搜索结果列表 - 使用虚拟列表优化性能 */}
                {/* 动态高度：移动端最大 50dvh，桌面端 400px */}
                <div 
                  ref={listContainerRef}
                  className="max-h-[50dvh] sm:max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
                >
                  {commands.length > 0 ? (
                    <div 
                      className="py-2 relative"
                      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                    >
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const item = commands[virtualRow.index]
                        const isSelected = selectedIndex === virtualRow.index
                        return (
                          <div
                            key={item.id}
                            data-index={virtualRow.index}
                            className="absolute top-0 left-0 w-full"
                            style={{
                              height: `${virtualRow.size}px`,
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <CommandItemRow 
                              item={item}
                              isSelected={isSelected}
                              onSelect={() => setSelectedIndex(virtualRow.index)}
                              onClick={item.action}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : query ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="px-5 py-8 text-center text-white/40"
                    >
                      <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>未找到匹配的书签</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="px-5 py-8 text-center text-white/40"
                    >
                      <Command className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>输入关键词搜索书签</p>
                    </motion.div>
                  )}
                </div>

                {/* 底部快捷键提示 */}
                <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-white/30">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">↑↓</kbd>
                      <span>选择</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">↵</kbd>
                      <span>打开</span>
                    </span>
                  </div>
                  
                  {/* 装饰性状态指示器 - 静谧呼吸 */}
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-1.5 h-1.5 rounded-full bg-nebula-cyan/50"
                    />
                    <span className="text-white/20">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
