import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Home, 
  Bookmark as BookmarkIcon, 
  Settings, 
  Github, 
  Code2, 
  Zap,
  BookOpen,
  Palette,
  Play,
  ExternalLink,
  Pin,
  BookMarked,
  Edit2,
  Trash2,
  Command
} from 'lucide-react'
import { AuroraBackground } from './components/ui/aurora-background'
import { Card3D, CardItem } from './components/ui/3d-card'
import { BentoGrid, BentoGridItem } from './components/ui/bento-grid'
import { FloatingDock } from './components/ui/floating-dock'
import { SpotlightSearch } from './components/ui/spotlight-search'
import { Typewriter } from './components/ui/typewriter'
import { Meteors, Sparkles } from './components/ui/effects'
import { AddBookmarkModal } from './components/AddBookmarkModal'
import { useBookmarkStore } from './hooks/useBookmarkStore'
import { useTheme } from './hooks/useTheme'
import { useTime } from './hooks/useTime'
import { Bookmark, Category } from './types/bookmark'
import { cn } from './lib/utils'

// Dock 导航项
const dockItems = [
  { id: 'home', title: '首页', icon: <Home className="w-5 h-5" /> },
  { id: 'search', title: '搜索', icon: <Search className="w-5 h-5" /> },
  { id: 'add', title: '添加', icon: <Plus className="w-5 h-5" /> },
  { id: 'bookmarks', title: '书签', icon: <BookmarkIcon className="w-5 h-5" /> },
  { id: 'github', title: 'GitHub', icon: <Github className="w-5 h-5" />, href: 'https://github.com' },
]

// 分类图标映射
const categoryIcons: Record<string, React.ReactNode> = {
  dev: <Code2 className="w-5 h-5" />,
  productivity: <Zap className="w-5 h-5" />,
  design: <Palette className="w-5 h-5" />,
  reading: <BookOpen className="w-5 h-5" />,
  media: <Play className="w-5 h-5" />,
}

function App() {
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [pendingUrl, setPendingUrl] = useState('')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const { greeting, formattedTime, formattedDate } = useTime()

  const {
    bookmarks,
    categories,
    isLoading,
    newlyAddedId,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
  } = useBookmarkStore()

  useTheme()

  // 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSpotlightOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setIsAddModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Dock 点击处理
  const handleDockClick = (id: string) => {
    switch (id) {
      case 'search':
        setIsSpotlightOpen(true)
        break
      case 'add':
        setIsAddModalOpen(true)
        break
    }
  }

  // 书签操作
  const handleAddFromSpotlight = useCallback((url: string) => {
    setPendingUrl(url)
    setIsAddModalOpen(true)
    setIsSpotlightOpen(false)
  }, [])

  const handleSaveBookmark = useCallback((data: Omit<Bookmark, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => {
    if (editingBookmark) {
      updateBookmark(editingBookmark.id, data)
    } else {
      addBookmark(data)
    }
    setEditingBookmark(null)
    setPendingUrl('')
  }, [editingBookmark, updateBookmark, addBookmark])

  const handleDelete = useCallback((id: string) => {
    if (confirm('确定要删除这个书签吗？')) {
      deleteBookmark(id)
    }
  }, [deleteBookmark])

  // 分组书签
  const pinnedBookmarks = bookmarks.filter(b => b.isPinned)
  const readLaterBookmarks = bookmarks.filter(b => b.isReadLater && !b.isRead)
  const bookmarksByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = bookmarks.filter(b => b.category === cat.id && !b.isPinned)
    return acc
  }, {} as Record<string, Bookmark[]>)

  return (
    <AuroraBackground>
      {/* Meteors Effect */}
      <Meteors number={15} />

      {/* Main Content */}
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pb-32">
        <div className="max-w-6xl mx-auto">
          
          {/* Hero Section */}
          <motion.section
            className="pt-20 pb-16 text-center relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Time Display */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-7xl sm:text-8xl lg:text-9xl font-light tracking-tight text-white/90 font-mono">
                {formattedTime}
              </div>
              <div className="text-lg text-white/40 mt-2">{formattedDate}</div>
            </motion.div>

            {/* Greeting with Typewriter */}
            <motion.h1
              className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Sparkles>
                <Typewriter
                  words={[
                    `${greeting}`,
                    '探索无限可能',
                    '构建你的宇宙',
                    '数字栖息地',
                  ]}
                  typingSpeed={80}
                  deletingSpeed={40}
                  delayBetweenWords={3000}
                />
              </Sparkles>
            </motion.h1>

            {/* Search Hint */}
            <motion.button
              onClick={() => setIsSpotlightOpen(true)}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Search className="w-4 h-4 text-white/40 group-hover:text-white/60" />
              <span className="text-white/40 group-hover:text-white/60">搜索或输入命令...</span>
              <kbd className="px-2 py-1 rounded bg-white/5 text-xs text-white/30 flex items-center gap-1">
                <Command className="w-3 h-3" /> K
              </kbd>
            </motion.button>
          </motion.section>

          {/* Read Later Hero Card */}
          {readLaterBookmarks.length > 0 && (
            <motion.section
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card3D className="cursor-pointer" glowColor="rgba(251, 146, 60, 0.4)">
                <div 
                  className="p-8 flex flex-col md:flex-row gap-6"
                  onClick={() => window.open(readLaterBookmarks[0].url, '_blank')}
                >
                  {/* Image */}
                  {readLaterBookmarks[0].ogImage && (
                    <CardItem translateZ={30} className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden">
                      <img 
                        src={readLaterBookmarks[0].ogImage} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </CardItem>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <CardItem translateZ={40}>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium mb-4">
                          <BookMarked className="w-3 h-3" />
                          稍后阅读
                        </span>
                      </CardItem>
                      
                      <CardItem translateZ={50}>
                        <h2 className="text-2xl md:text-3xl font-serif font-medium text-white mb-3 line-clamp-2">
                          {readLaterBookmarks[0].title}
                        </h2>
                      </CardItem>
                      
                      {readLaterBookmarks[0].description && (
                        <CardItem translateZ={30}>
                          <p className="text-white/50 line-clamp-2">
                            {readLaterBookmarks[0].description}
                          </p>
                        </CardItem>
                      )}
                    </div>
                    
                    <CardItem translateZ={20} className="mt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/30">
                          {new URL(readLaterBookmarks[0].url).hostname}
                        </span>
                        <span className="flex items-center gap-2 text-sm text-nebula-cyan">
                          开始阅读 <ExternalLink className="w-4 h-4" />
                        </span>
                      </div>
                    </CardItem>
                  </div>
                </div>
              </Card3D>
            </motion.section>
          )}

          {/* Pinned Bookmarks - Bento Grid */}
          {pinnedBookmarks.length > 0 && (
            <motion.section
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Pin className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-medium text-white">常用</h2>
              </div>

              <BentoGrid>
                {pinnedBookmarks.slice(0, 6).map((bookmark, index) => (
                  <BentoGridItem
                    key={bookmark.id}
                    colSpan={index === 0 ? 2 : 1}
                    onClick={() => window.open(bookmark.url, '_blank')}
                  >
                    <BookmarkCardContent
                      bookmark={bookmark}
                      isNew={bookmark.id === newlyAddedId}
                      onTogglePin={() => togglePin(bookmark.id)}
                      onToggleReadLater={() => toggleReadLater(bookmark.id)}
                      onEdit={() => {
                        setEditingBookmark(bookmark)
                        setIsAddModalOpen(true)
                      }}
                      onDelete={() => handleDelete(bookmark.id)}
                    />
                  </BentoGridItem>
                ))}
              </BentoGrid>
            </motion.section>
          )}

          {/* Category Sections */}
          {categories.map((category, catIndex) => {
            const categoryBookmarks = bookmarksByCategory[category.id] || []
            if (categoryBookmarks.length === 0) return null

            return (
              <motion.section
                key={category.id}
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + catIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {categoryIcons[category.id] || <BookmarkIcon className="w-4 h-4" />}
                  </div>
                  <h2 className="text-xl font-medium text-white">{category.name}</h2>
                  <span className="text-sm text-white/30">{categoryBookmarks.length}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryBookmarks.map((bookmark, index) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card3D
                        className="h-full cursor-pointer"
                        glowColor={category.color}
                      >
                        <div 
                          className="p-5 h-full flex flex-col"
                          onClick={() => window.open(bookmark.url, '_blank')}
                        >
                          <CardItem translateZ={30} className="mb-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                              {bookmark.favicon ? (
                                <img src={bookmark.favicon} alt="" className="w-5 h-5" />
                              ) : (
                                <ExternalLink className="w-5 h-5 text-white/30" />
                              )}
                            </div>
                          </CardItem>

                          <CardItem translateZ={40} className="flex-1">
                            <h3 className="font-medium text-white line-clamp-1 mb-1">
                              {bookmark.title}
                            </h3>
                            <p className="text-sm text-white/40 line-clamp-2">
                              {bookmark.description || new URL(bookmark.url).hostname}
                            </p>
                          </CardItem>
                        </div>
                      </Card3D>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )
          })}

          {/* Empty State */}
          {bookmarks.length === 0 && !isLoading && (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-nebula-purple/20 to-nebula-pink/20 flex items-center justify-center">
                <Sparkles>
                  <BookmarkIcon className="w-10 h-10 text-white/40" />
                </Sparkles>
              </div>
              <h3 className="text-2xl font-serif text-white mb-4">
                开启你的星云之旅
              </h3>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                按 <kbd className="px-2 py-1 rounded bg-white/10 text-xs">⌘K</kbd> 打开命令面板，
                粘贴链接即可添加第一个书签
              </p>
              <motion.button
                onClick={() => setIsAddModalOpen(true)}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-nebula-purple to-nebula-pink text-white font-medium shadow-glow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                添加第一个书签
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Dock */}
      <FloatingDock
        items={dockItems.map(item => ({
          ...item,
          onClick: item.href ? undefined : () => handleDockClick(item.id),
        }))}
      />

      {/* Spotlight Search */}
      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        bookmarks={bookmarks}
        onAddBookmark={handleAddFromSpotlight}
      />

      {/* Add Bookmark Modal */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingBookmark(null)
          setPendingUrl('')
        }}
        onAdd={handleSaveBookmark}
        categories={categories}
        initialUrl={pendingUrl}
        editBookmark={editingBookmark}
      />
    </AuroraBackground>
  )
}

// 书签卡片内容组件
function BookmarkCardContent({
  bookmark,
  isNew,
  onTogglePin,
  onToggleReadLater,
  onEdit,
  onDelete,
}: {
  bookmark: Bookmark
  isNew?: boolean
  onTogglePin: () => void
  onToggleReadLater: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div 
      className="h-full flex flex-col"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
          {bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className="w-6 h-6" />
          ) : (
            <ExternalLink className="w-6 h-6 text-white/30" />
          )}
        </div>

        {/* Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePin() }}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  bookmark.isPinned ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-white/10 text-white/40'
                )}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleReadLater() }}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  bookmark.isReadLater ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/10 text-white/40'
                )}
              >
                <BookMarked className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit() }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-lg font-medium text-white mb-2 line-clamp-1">
          {bookmark.title}
        </h3>
        {bookmark.description && (
          <p className="text-sm text-white/40 line-clamp-2 mb-4">
            {bookmark.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-white/30 pt-4 border-t border-white/5">
        <span>{new URL(bookmark.url).hostname}</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </div>

      {/* New Badge */}
      {isNew && (
        <motion.div
          className="absolute top-3 right-3 px-2 py-1 rounded-full bg-nebula-cyan/20 text-nebula-cyan text-xs"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
        >
          NEW
        </motion.div>
      )}
    </div>
  )
}

export default App
