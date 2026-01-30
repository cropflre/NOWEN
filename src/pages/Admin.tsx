import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Pin,
  BookMarked,
  Check,
  X,
  FolderOpen,
  Settings,
  GripVertical,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react'
import { useBookmarkStore } from '../hooks/useBookmarkStore'
import { Bookmark, Category } from '../types/bookmark'
import { cn } from '../lib/utils'

interface AdminProps {
  onBack: () => void
}

type TabType = 'bookmarks' | 'categories'

export function Admin({ onBack }: AdminProps) {
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set())
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  const {
    bookmarks,
    categories,
    isLoading,
    deleteBookmark,
    updateBookmark,
    togglePin,
    toggleReadLater,
    toggleRead,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useBookmarkStore()

  // 过滤书签
  const filteredBookmarks = bookmarks.filter((b) => {
    const matchesSearch =
      searchQuery === '' ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategory === 'all' ||
      selectedCategory === 'uncategorized'
        ? !b.category
        : b.category === selectedCategory

    if (selectedCategory === 'all') return matchesSearch
    return matchesSearch && matchesCategory
  })

  // 批量选择
  const toggleSelectAll = () => {
    if (selectedBookmarks.size === filteredBookmarks.length) {
      setSelectedBookmarks(new Set())
    } else {
      setSelectedBookmarks(new Set(filteredBookmarks.map((b) => b.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedBookmarks)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedBookmarks(newSet)
  }

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedBookmarks.size === 0) return
    if (confirm(`确定要删除选中的 ${selectedBookmarks.size} 个书签吗？`)) {
      selectedBookmarks.forEach((id) => deleteBookmark(id))
      setSelectedBookmarks(new Set())
    }
  }

  // 单个删除
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个书签吗？')) {
      deleteBookmark(id)
      selectedBookmarks.delete(id)
      setSelectedBookmarks(new Set(selectedBookmarks))
    }
  }

  // 添加分类
  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory({
        name: newCategoryName.trim(),
        icon: 'folder',
        color: '#667eea',
      })
      setNewCategoryName('')
      setIsAddingCategory(false)
    }
  }

  // 删除分类
  const handleDeleteCategory = (id: string) => {
    if (confirm('确定要删除这个分类吗？相关书签将变为未分类。')) {
      deleteCategory(id)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-medium text-white">后台管理</h1>
          </div>

          {/* Tab 切换 */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                activeTab === 'bookmarks'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/80'
              )}
            >
              <FolderOpen className="w-4 h-4 inline-block mr-2" />
              书签管理
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                activeTab === 'categories'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/80'
              )}
            >
              <Settings className="w-4 h-4 inline-block mr-2" />
              分类管理
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'bookmarks' ? (
            <motion.div
              key="bookmarks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* 工具栏 */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* 搜索框 */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="搜索书签..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                {/* 分类筛选 */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 transition-colors cursor-pointer"
                  >
                    <option value="all">全部分类</option>
                    <option value="uncategorized">未分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>

                {/* 批量操作 */}
                {selectedBookmarks.size > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleBatchDelete}
                    className="px-4 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除选中 ({selectedBookmarks.size})
                  </motion.button>
                )}
              </div>

              {/* 书签表格 */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                {/* 表头 */}
                <div className="grid grid-cols-[40px_1fr_120px_100px_100px] gap-4 px-4 py-3 border-b border-white/10 bg-white/5">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredBookmarks.length > 0 &&
                        selectedBookmarks.size === filteredBookmarks.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-white/20 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="text-sm font-medium text-white/50">书签</div>
                  <div className="text-sm font-medium text-white/50">分类</div>
                  <div className="text-sm font-medium text-white/50">状态</div>
                  <div className="text-sm font-medium text-white/50 text-right">操作</div>
                </div>

                {/* 列表 */}
                <div className="divide-y divide-white/5">
                  {isLoading ? (
                    // 骨架屏
                    Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[40px_1fr_120px_100px_100px] gap-4 px-4 py-4"
                      >
                        <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-white/10 rounded w-48 animate-pulse" />
                            <div className="h-3 bg-white/5 rounded w-64 animate-pulse" />
                          </div>
                        </div>
                        <div className="h-6 bg-white/10 rounded w-16 animate-pulse" />
                        <div className="h-6 bg-white/10 rounded w-12 animate-pulse" />
                        <div className="h-6 bg-white/10 rounded w-20 ml-auto animate-pulse" />
                      </div>
                    ))
                  ) : filteredBookmarks.length === 0 ? (
                    <div className="px-4 py-12 text-center text-white/30">
                      {searchQuery ? '没有找到匹配的书签' : '暂无书签'}
                    </div>
                  ) : (
                    filteredBookmarks.map((bookmark) => (
                      <motion.div
                        key={bookmark.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          'grid grid-cols-[40px_1fr_120px_100px_100px] gap-4 px-4 py-3 items-center hover:bg-white/5 transition-colors',
                          selectedBookmarks.has(bookmark.id) && 'bg-white/5'
                        )}
                      >
                        {/* 选择框 */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedBookmarks.has(bookmark.id)}
                            onChange={() => toggleSelect(bookmark.id)}
                            className="w-4 h-4 rounded border-white/20 bg-transparent cursor-pointer"
                          />
                        </div>

                        {/* 书签信息 */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {bookmark.favicon ? (
                              <img
                                src={bookmark.favicon}
                                alt=""
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <ExternalLink className="w-4 h-4 text-white/30" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-white truncate font-medium">
                              {bookmark.title}
                            </div>
                            <a
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-white/40 hover:text-white/60 truncate block"
                            >
                              {bookmark.url}
                            </a>
                          </div>
                        </div>

                        {/* 分类 */}
                        <div>
                          {bookmark.category ? (
                            <span
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs"
                              style={{
                                backgroundColor: `${
                                  categories.find((c) => c.id === bookmark.category)?.color || '#667eea'
                                }20`,
                                color:
                                  categories.find((c) => c.id === bookmark.category)?.color || '#667eea',
                              }}
                            >
                              {categories.find((c) => c.id === bookmark.category)?.name || bookmark.category}
                            </span>
                          ) : (
                            <span className="text-xs text-white/30">未分类</span>
                          )}
                        </div>

                        {/* 状态标签 */}
                        <div className="flex gap-1">
                          {bookmark.isPinned && (
                            <span className="p-1 rounded bg-yellow-500/20 text-yellow-400">
                              <Pin className="w-3 h-3" />
                            </span>
                          )}
                          {bookmark.isReadLater && (
                            <span className="p-1 rounded bg-orange-500/20 text-orange-400">
                              <BookMarked className="w-3 h-3" />
                            </span>
                          )}
                          {bookmark.isRead && (
                            <span className="p-1 rounded bg-green-500/20 text-green-400">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        {/* 操作 */}
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => togglePin(bookmark.id)}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              bookmark.isPinned
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'hover:bg-white/10 text-white/40 hover:text-white'
                            )}
                            title={bookmark.isPinned ? '取消置顶' : '置顶'}
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleReadLater(bookmark.id)}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              bookmark.isReadLater
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'hover:bg-white/10 text-white/40 hover:text-white'
                            )}
                            title={bookmark.isReadLater ? '取消稍后阅读' : '稍后阅读'}
                          >
                            <BookMarked className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(bookmark.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* 统计 */}
              <div className="mt-4 text-sm text-white/40">
                共 {filteredBookmarks.length} 个书签
                {selectedBookmarks.size > 0 && `，已选中 ${selectedBookmarks.size} 个`}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* 分类管理 */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-white">分类列表</h2>
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新建分类
                </button>
              </div>

              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                {/* 新增分类输入框 */}
                <AnimatePresence>
                  {isAddingCategory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-b border-white/10"
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="输入分类名称..."
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCategory()
                            if (e.key === 'Escape') setIsAddingCategory(false)
                          }}
                        />
                        <button
                          onClick={handleAddCategory}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingCategory(false)
                            setNewCategoryName('')
                          }}
                          className="p-2 bg-white/5 text-white/40 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 分类列表 */}
                <div className="divide-y divide-white/5">
                  {categories.length === 0 ? (
                    <div className="px-4 py-12 text-center text-white/30">暂无分类</div>
                  ) : (
                    categories.map((category) => {
                      const bookmarkCount = bookmarks.filter(
                        (b) => b.category === category.id
                      ).length

                      return (
                        <div
                          key={category.id}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                        >
                          {/* 拖拽手柄 */}
                          <div className="text-white/20 cursor-grab">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* 颜色标识 */}
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: category.color }}
                          />

                          {/* 分类名称 */}
                          <div className="flex-1">
                            <span className="text-white">{category.name}</span>
                            <span className="ml-2 text-xs text-white/30">
                              {bookmarkCount} 个书签
                            </span>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
