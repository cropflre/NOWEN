import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Home, 
  Bookmark as BookmarkIcon, 
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
  Command,
  LayoutDashboard
} from 'lucide-react'
import { AuroraBackground } from './components/ui/aurora-background'
import { Card3D, CardItem } from './components/ui/3d-card'
import { BentoGrid, BentoGridItem } from './components/ui/bento-grid'
import { SpotlightCard } from './components/ui/spotlight-card'
import { FloatingDock } from './components/ui/floating-dock'
import { SpotlightSearch } from './components/ui/spotlight-search'
import { Typewriter } from './components/ui/typewriter'
import { Meteors, Sparkles } from './components/ui/effects'
import { BorderBeam, BreathingDot } from './components/ui/advanced-effects'
import { AddBookmarkModal } from './components/AddBookmarkModal'
import { ContextMenu, useBookmarkContextMenu } from './components/ContextMenu'
import { Admin } from './pages/Admin'
import { AdminLogin } from './components/AdminLogin'
import { useBookmarkStore } from './hooks/useBookmarkStore'
import { useTheme } from './hooks/useTheme'
import { useTime } from './hooks/useTime'
import { Bookmark } from './types/bookmark'
import { cn } from './lib/utils'
import { checkAuthStatus, clearAuthStatus, fetchSettings, SiteSettings } from './lib/api'

// Dock 导航项
const dockItems = [
  { id: 'home', title: '首页', icon: <Home className="w-5 h-5" /> },
  { id: 'search', title: '搜索', icon: <Search className="w-5 h-5" /> },
  { id: 'add', title: '添加', icon: <Plus className="w-5 h-5" /> },
  { id: 'admin', title: '管理', icon: <LayoutDashboard className="w-5 h-5" /> },
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
  const [currentPage, setCurrentPage] = useState<'home' | 'admin' | 'admin-login'>('home')
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [pendingUrl, setPendingUrl] = useState('')
  const [adminUsername, setAdminUsername] = useState<string>('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteTitle: 'Nebula Portal',
    siteFavicon: '',
  })
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    bookmark: Bookmark | null
  }>({ isOpen: false, position: { x: 0, y: 0 }, bookmark: null })
  
  const { getMenuItems } = useBookmarkContextMenu()

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
    addCategory,
    updateCategory,
    deleteCategory,
    refreshData,
  } = useBookmarkStore()

  useTheme()

  // 初始化时检查登录状态和加载站点设置
  useEffect(() => {
    const { isValid, username } = checkAuthStatus()
    if (isValid && username) {
      setIsLoggedIn(true)
      setAdminUsername(username)
    }
    
    // 加载站点设置
    fetchSettings().then(settings => {
      setSiteSettings(settings)
      // 应用站点标题
      if (settings.siteTitle) {
        document.title = settings.siteTitle
      }
      // 应用站点图标
      if (settings.siteFavicon) {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
        if (link) {
          link.href = settings.siteFavicon
        } else {
          const newLink = document.createElement('link')
          newLink.rel = 'icon'
          newLink.href = settings.siteFavicon
          document.head.appendChild(newLink)
        }
      }
    }).catch(console.error)
  }, [])

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

  // 检查是否已登录后台
  const checkAdminAuth = () => {
    const { isValid, username } = checkAuthStatus()
    if (isValid && username) {
      setAdminUsername(username)
      return true
    }
    return false
  }

  // Dock 点击处理
  const handleDockClick = (id: string) => {
    switch (id) {
      case 'home':
        setCurrentPage('home')
        break
      case 'search':
        setIsSpotlightOpen(true)
        break
      case 'add':
        setIsAddModalOpen(true)
        break
      case 'admin':
        // 检查登录状态
        if (checkAdminAuth()) {
          setCurrentPage('admin')
        } else {
          setCurrentPage('admin-login')
        }
        break
    }
  }

  // 后台登录成功
  const handleAdminLogin = (username: string) => {
    setAdminUsername(username)
    setIsLoggedIn(true)
    setCurrentPage('admin')
  }

  // 后台退出登录
  const handleAdminLogout = () => {
    clearAuthStatus()
    setAdminUsername('')
    setIsLoggedIn(false)
    setCurrentPage('home')
  }

  // 右键菜单处理
  const handleContextMenu = useCallback((e: React.MouseEvent, bookmark: Bookmark) => {
    if (!isLoggedIn) return // 未登录不显示右键菜单
    
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      bookmark,
    })
  }, [isLoggedIn])

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }, [])

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

  // 后台登录页面
  if (currentPage === 'admin-login') {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
        onBack={() => setCurrentPage('home')}
      />
    )
  }

  // 后台管理页面
  if (currentPage === 'admin') {
    return (
      <>
        <Admin
          bookmarks={bookmarks}
          categories={categories}
          username={adminUsername}
          onBack={() => setCurrentPage('home')}
          onLogout={handleAdminLogout}
          onAddBookmark={() => setIsAddModalOpen(true)}
          onEditBookmark={(bookmark) => {
            setEditingBookmark(bookmark)
            setIsAddModalOpen(true)
          }}
          onDeleteBookmark={deleteBookmark}
          onTogglePin={togglePin}
          onToggleReadLater={toggleReadLater}
          onUpdateBookmark={updateBookmark}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onRefreshData={refreshData}
        />
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
      </>
    )
  }

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
              <div className="text-7xl sm:text-8xl lg:text-9xl font-semibold tracking-tighter text-white/90 font-mono">
                {formattedTime}
              </div>
              <div className="text-base tracking-[0.2em] uppercase text-white/30 mt-3">{formattedDate}</div>
            </motion.div>

            {/* Greeting with Typewriter */}
            <motion.h1
              className="text-2xl sm:text-3xl lg:text-4xl font-serif font-medium text-white/80 mb-8 tracking-wide"
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

            {/* Search Hint - 带 Border Beam */}
            <motion.div
              className="relative inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button
                onClick={() => setIsSpotlightOpen(true)}
                className="relative inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all duration-300 group overflow-hidden"
              >
                <BorderBeam 
                  size={80} 
                  duration={10} 
                  colorFrom="rgba(102, 126, 234, 0.6)" 
                  colorTo="rgba(0, 242, 254, 0.6)" 
                />
                <Search className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                <span className="text-white/40 group-hover:text-white/60 tracking-wide">搜索或输入命令...</span>
                <kbd className="px-2 py-1 rounded bg-white/5 text-xs text-white/30 flex items-center gap-1 ml-2">
                  <Command className="w-3 h-3" /> K
                </kbd>
              </button>
            </motion.div>
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

          {/* Pinned Bookmarks - Bento Grid 非对称布局 */}
          {pinnedBookmarks.length > 0 && (
            <motion.section
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <Pin className="w-5 h-5 text-yellow-400" />
                  <BreathingDot color="#eab308" size="sm" className="absolute -top-1 -right-1" />
                </div>
                <h2 className="text-xl font-medium text-white tracking-wide">常用</h2>
                <span className="text-sm text-white/30">{pinnedBookmarks.length}</span>
              </div>

              <BentoGrid>
                {pinnedBookmarks.slice(0, 6).map((bookmark, index) => {
                  // 非对称布局：第一个占 2 列 2 行，其他 1 列
                  const colSpan = index === 0 ? 2 : 1
                  const rowSpan = index === 0 ? 2 : 1
                  
                  return (
                    <BentoGridItem
                      key={bookmark.id}
                      colSpan={colSpan as 1 | 2}
                      rowSpan={rowSpan as 1 | 2}
                      spotlightColor="rgba(234, 179, 8, 0.15)"
                      onClick={() => window.open(bookmark.url, '_blank')}
                      onContextMenu={(e) => handleContextMenu(e, bookmark)}
                      delay={index * 0.05}
                    >
                      <BookmarkCardContent
                        bookmark={bookmark}
                        isLarge={index === 0}
                        isNew={bookmark.id === newlyAddedId}
                        isLoggedIn={isLoggedIn}
                        onTogglePin={() => togglePin(bookmark.id)}
                        onToggleReadLater={() => toggleReadLater(bookmark.id)}
                        onEdit={() => {
                          setEditingBookmark(bookmark)
                          setIsAddModalOpen(true)
                        }}
                        onDelete={() => handleDelete(bookmark.id)}
                      />
                    </BentoGridItem>
                  )
                })}
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
                className="mb-12 relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + catIndex * 0.1 }}
              >
                {/* 背景装饰文字 */}
                <div 
                  className="absolute -top-8 left-0 text-[120px] font-bold text-white/[0.02] pointer-events-none select-none leading-none"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {category.name}
                </div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm"
                    style={{ backgroundColor: `${category.color}15`, color: category.color }}
                  >
                    {categoryIcons[category.id] || <BookmarkIcon className="w-4 h-4" />}
                  </div>
                  <h2 className="text-xl font-medium text-white tracking-wide">{category.name}</h2>
                  <span className="text-sm text-white/30">{categoryBookmarks.length}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
                  {categoryBookmarks.map((bookmark, index) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SpotlightCard
                        className="h-full cursor-pointer"
                        spotlightColor={`${category.color}20`}
                        onClick={() => window.open(bookmark.url, '_blank')}
                        onContextMenu={(e) => handleContextMenu(e, bookmark)}
                      >
                        <div className="flex flex-col h-full">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                            {bookmark.favicon ? (
                              <img src={bookmark.favicon} alt="" className="w-5 h-5" />
                            ) : (
                              <ExternalLink className="w-5 h-5 text-white/30" />
                            )}
                          </div>

                          <h3 className="font-medium text-white line-clamp-1 mb-1">
                            {bookmark.title}
                          </h3>
                          <p className="text-sm text-white/40 line-clamp-2 flex-1">
                            {bookmark.description || new URL(bookmark.url).hostname}
                          </p>
                        </div>
                      </SpotlightCard>
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

      {/* Context Menu */}
      {contextMenu.bookmark && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          onClose={closeContextMenu}
          items={getMenuItems(contextMenu.bookmark, {
            onEdit: () => {
              setEditingBookmark(contextMenu.bookmark)
              setIsAddModalOpen(true)
            },
            onDelete: () => handleDelete(contextMenu.bookmark!.id),
            onTogglePin: () => togglePin(contextMenu.bookmark!.id),
            onToggleReadLater: () => toggleReadLater(contextMenu.bookmark!.id),
          })}
        />
      )}
    </AuroraBackground>
  )
}

// 书签卡片内容组件
function BookmarkCardContent({
  bookmark,
  isLarge,
  isNew,
  isLoggedIn,
  onTogglePin,
  onToggleReadLater,
  onEdit,
  onDelete,
}: {
  bookmark: Bookmark
  isLarge?: boolean
  isNew?: boolean
  isLoggedIn?: boolean
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
        <div className={cn(
          'rounded-xl bg-white/5 flex items-center justify-center',
          isLarge ? 'w-14 h-14' : 'w-12 h-12'
        )}>
          {bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className={isLarge ? 'w-7 h-7' : 'w-6 h-6'} />
          ) : (
            <ExternalLink className={cn('text-white/30', isLarge ? 'w-7 h-7' : 'w-6 h-6')} />
          )}
        </div>

        {/* Actions - 只有登录后才显示 */}
        <AnimatePresence>
          {showActions && isLoggedIn && (
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
        <h3 className={cn(
          'font-medium text-white mb-2',
          isLarge ? 'text-xl line-clamp-2' : 'text-lg line-clamp-1'
        )}>
          {bookmark.title}
        </h3>
        {bookmark.description && (
          <p className={cn(
            'text-white/40 mb-4',
            isLarge ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'
          )}>
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
