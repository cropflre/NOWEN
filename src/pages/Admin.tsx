import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Pin,
  BookMarked,
  Check,
  FolderPlus,
  Palette,
  ChevronDown,
  GripVertical,
  Sparkles,
} from 'lucide-react'
import { Bookmark, Category } from '../types/bookmark'
import { cn } from '../lib/utils'
import { adminChangePassword, fetchSettings, updateSettings, SiteSettings, importData } from '../lib/api'
import { AdminSidebar } from '../components/admin/AdminSidebar'
import { SiteSettingsCard } from '../components/admin/SiteSettingsCard'
import { SecurityCard } from '../components/admin/SecurityCard'
import { DataManagementCard } from '../components/admin/DataManagementCard'
import { ToastProvider, useToast } from '../components/admin/Toast'

interface AdminProps {
  bookmarks: Bookmark[]
  categories: Category[]
  username: string
  onBack: () => void
  onLogout: () => void
  onAddBookmark: () => void
  onEditBookmark: (bookmark: Bookmark) => void
  onDeleteBookmark: (id: string) => void
  onTogglePin: (id: string) => void
  onToggleReadLater: (id: string) => void
  onUpdateBookmark: (id: string, updates: Partial<Bookmark>) => void
  onAddCategory: (category: Omit<Category, 'id' | 'orderIndex'>) => void
  onUpdateCategory: (id: string, updates: Partial<Category>) => void
  onDeleteCategory: (id: string) => void
  onRefreshData?: () => void
}

// 预设颜色
const presetColors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#6366f1', '#a855f7',
]

function AdminContent({
  bookmarks,
  categories,
  username,
  onBack,
  onLogout,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onTogglePin,
  onToggleReadLater,
  onUpdateBookmark,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onRefreshData,
}: AdminProps) {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'categories' | 'settings'>('bookmarks')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6')
  
  // 密码修改状态
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // 站点设置状态
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteTitle: 'Nebula Portal',
    siteFavicon: '',
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  // 加载站点设置
  useEffect(() => {
    fetchSettings().then(settings => {
      setSiteSettings(settings)
    }).catch(console.error)
  }, [])

  // 筛选书签
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => {
      const matchesSearch = searchQuery === '' || 
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = filterCategory === 'all' || 
        (filterCategory === 'uncategorized' ? !bookmark.category : bookmark.category === filterCategory)
      
      return matchesSearch && matchesCategory
    })
  }, [bookmarks, searchQuery, filterCategory])

  // 选择操作
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === filteredBookmarks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredBookmarks.map(b => b.id)))
    }
  }

  const deleteSelected = () => {
    if (confirm(`确定要删除选中的 ${selectedIds.size} 个书签吗？`)) {
      selectedIds.forEach(id => onDeleteBookmark(id))
      setSelectedIds(new Set())
      showToast('success', `已删除 ${selectedIds.size} 个书签`)
    }
  }

  // 分类表单
  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) return
    
    if (editingCategory) {
      onUpdateCategory(editingCategory.id, { 
        name: newCategoryName, 
        color: newCategoryColor 
      })
      showToast('success', '分类已更新')
    } else {
      onAddCategory({ 
        name: newCategoryName, 
        color: newCategoryColor 
      })
      showToast('success', '分类创建成功')
    }
    
    resetCategoryForm()
  }

  const resetCategoryForm = () => {
    setShowCategoryForm(false)
    setEditingCategory(null)
    setNewCategoryName('')
    setNewCategoryColor('#3b82f6')
  }

  const startEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color)
    setShowCategoryForm(true)
  }

  // 修改密码
  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    setIsChangingPassword(true)
    
    try {
      await adminChangePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      showToast('success', '密码修改成功')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      setPasswordError(err.message || '修改密码失败')
      throw err
    } finally {
      setIsChangingPassword(false)
    }
  }

  // 保存站点设置
  const handleSaveSettings = async () => {
    setSettingsError('')
    setSettingsSuccess(false)
    setIsSavingSettings(true)
    
    try {
      const updated = await updateSettings(siteSettings)
      setSiteSettings(updated)
      setSettingsSuccess(true)
      showToast('success', '站点设置已保存')
      
      // 更新页面标题
      if (updated.siteTitle) {
        document.title = updated.siteTitle
      }
      
      // 更新 favicon
      if (updated.siteFavicon) {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
        if (link) {
          link.href = updated.siteFavicon
        } else {
          const newLink = document.createElement('link')
          newLink.rel = 'icon'
          newLink.href = updated.siteFavicon
          document.head.appendChild(newLink)
        }
      }
      
      setTimeout(() => setSettingsSuccess(false), 3000)
    } catch (err: any) {
      setSettingsError(err.message || '保存设置失败')
      showToast('error', '保存设置失败')
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Tab titles for header
  const tabTitles = {
    bookmarks: '书签管理',
    categories: '分类管理',
    settings: '系统设置',
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={onBack}
        onLogout={onLogout}
        bookmarkCount={bookmarks.length}
        categoryCount={categories.length}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative p-8">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-10"
          >
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
                {tabTitles[activeTab]}
              </h1>
              <p className="text-sm text-white/40 mt-1">
                {activeTab === 'bookmarks' && `共 ${bookmarks.length} 个书签`}
                {activeTab === 'categories' && `共 ${categories.length} 个分类`}
                {activeTab === 'settings' && '管理您的网站配置'}
              </p>
            </div>

            {activeTab === 'bookmarks' && (
              <motion.button
                onClick={onAddBookmark}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                添加书签
              </motion.button>
            )}
          </motion.header>

          {/* Content */}
          <AnimatePresence mode="wait">
            {/* Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <motion.div
                key="bookmarks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      placeholder="搜索书签..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className={cn(
                        'w-full pl-11 pr-4 py-3 rounded-xl',
                        'bg-white/[0.03] border border-white/10',
                        'text-white placeholder:text-white/30',
                        'focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05]',
                        'transition-all duration-300'
                      )}
                    />
                  </div>

                  {/* Filter */}
                  <div className="relative">
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className={cn(
                        'appearance-none pl-4 pr-10 py-3 rounded-xl',
                        'bg-white/[0.03] border border-white/10',
                        'text-white cursor-pointer',
                        'focus:outline-none focus:border-indigo-500/50',
                        'transition-all duration-300'
                      )}
                    >
                      <option value="all" className="bg-[#1a1a24] text-white">全部分类</option>
                      <option value="uncategorized" className="bg-[#1a1a24] text-white">未分类</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-[#1a1a24] text-white">{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  </div>
                </div>

                {/* Batch Actions */}
                <AnimatePresence>
                  {selectedIds.size > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
                    >
                      <span className="text-sm text-white/70">
                        已选择 <span className="text-indigo-400 font-medium">{selectedIds.size}</span> 项
                      </span>
                      <div className="flex-1" />
                      <motion.button
                        onClick={deleteSelected}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        批量删除
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Table */}
                <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02] backdrop-blur-sm">
                  {/* Table Header */}
                  <div className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_auto_auto] gap-4 px-5 py-4 bg-white/[0.03] border-b border-white/[0.08] text-sm text-white/50 font-medium">
                    <button
                      onClick={selectAll}
                      className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center transition-all',
                        selectedIds.size === filteredBookmarks.length && filteredBookmarks.length > 0
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'border-white/20 hover:border-white/40'
                      )}
                    >
                      {selectedIds.size === filteredBookmarks.length && filteredBookmarks.length > 0 && (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                    <span>书签</span>
                    <span className="hidden sm:block">分类</span>
                    <span>状态</span>
                    <span>操作</span>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-white/[0.05]">
                    {filteredBookmarks.length === 0 ? (
                      <div className="px-4 py-16 text-center">
                        <Sparkles className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/30">
                          {searchQuery || filterCategory !== 'all' ? '没有匹配的书签' : '暂无书签'}
                        </p>
                      </div>
                    ) : (
                      filteredBookmarks.map((bookmark, index) => (
                        <motion.div
                          key={bookmark.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_auto_auto] gap-4 px-5 py-4 items-center hover:bg-white/[0.03] transition-colors group"
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleSelect(bookmark.id)}
                            className={cn(
                              'w-5 h-5 rounded border flex items-center justify-center transition-all',
                              selectedIds.has(bookmark.id)
                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                : 'border-white/20 hover:border-white/40'
                            )}
                          >
                            {selectedIds.has(bookmark.id) && <Check className="w-3 h-3" />}
                          </button>

                          {/* Bookmark Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                              {bookmark.favicon ? (
                                <img src={bookmark.favicon} alt="" className="w-5 h-5 rounded" />
                              ) : (
                                <ExternalLink className="w-4 h-4 text-white/30" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-white truncate">
                                {bookmark.title}
                              </div>
                              <div className="text-xs text-white/30 truncate">
                                {new URL(bookmark.url).hostname}
                              </div>
                            </div>
                          </div>

                          {/* Category */}
                          <div className="hidden sm:block">
                            <select
                              value={bookmark.category || ''}
                              onChange={e => onUpdateBookmark(bookmark.id, { 
                                category: e.target.value || undefined 
                              })}
                              className="appearance-none px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-white/70 focus:outline-none cursor-pointer hover:bg-white/[0.08] transition-colors"
                            >
                              <option value="" className="bg-[#1a1a24] text-white">未分类</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id} className="bg-[#1a1a24] text-white">{cat.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onTogglePin(bookmark.id)}
                              className={cn(
                                'p-1.5 rounded-lg transition-all',
                                bookmark.isPinned 
                                  ? 'bg-yellow-500/20 text-yellow-400' 
                                  : 'text-white/20 hover:text-white/50 hover:bg-white/[0.05]'
                              )}
                              title="置顶"
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onToggleReadLater(bookmark.id)}
                              className={cn(
                                'p-1.5 rounded-lg transition-all',
                                bookmark.isReadLater 
                                  ? 'bg-orange-500/20 text-orange-400' 
                                  : 'text-white/20 hover:text-white/50 hover:bg-white/[0.05]'
                              )}
                              title="稍后阅读"
                            >
                              <BookMarked className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => window.open(bookmark.url, '_blank')}
                              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-all"
                              title="打开链接"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditBookmark(bookmark)}
                              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-all"
                              title="编辑"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('确定删除这个书签？')) {
                                  onDeleteBookmark(bookmark.id)
                                  showToast('success', '书签已删除')
                                }
                              }}
                              className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Add Category Button */}
                <div className="mb-6">
                  <motion.button
                    onClick={() => setShowCategoryForm(true)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/70 hover:bg-white/[0.06] hover:text-white transition-all"
                  >
                    <FolderPlus className="w-4 h-4" />
                    新建分类
                  </motion.button>
                </div>

                {/* Category Form */}
                <AnimatePresence>
                  {showCategoryForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 overflow-hidden"
                    >
                      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input
                            type="text"
                            placeholder="分类名称"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            className={cn(
                              'flex-1 px-4 py-3 rounded-xl',
                              'bg-black/20 border border-white/10',
                              'text-white placeholder:text-white/30',
                              'focus:outline-none focus:border-indigo-500/50',
                              'transition-all'
                            )}
                            autoFocus
                          />
                          
                          <div className="flex items-center gap-3">
                            <Palette className="w-4 h-4 text-white/30" />
                            <div className="flex gap-1.5">
                              {presetColors.map(color => (
                                <button
                                  key={color}
                                  onClick={() => setNewCategoryColor(color)}
                                  className={cn(
                                    'w-7 h-7 rounded-full transition-transform',
                                    newCategoryColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0f] scale-110'
                                  )}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <motion.button
                              onClick={handleSaveCategory}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
                            >
                              {editingCategory ? '保存' : '创建'}
                            </motion.button>
                            <motion.button
                              onClick={resetCategoryForm}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="px-5 py-2.5 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                            >
                              取消
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Categories List */}
                <div className="space-y-2">
                  {categories.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                      <FolderPlus className="w-12 h-12 text-white/10 mx-auto mb-4" />
                      <p className="text-white/30">暂无分类，点击上方按钮创建</p>
                    </div>
                  ) : (
                    categories.map((category, index) => {
                      const count = bookmarks.filter(b => b.category === category.id).length
                      return (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-all group"
                        >
                          {/* Drag Handle */}
                          <div className="text-white/20 cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Color Indicator */}
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white/10"
                            style={{ backgroundColor: category.color }}
                          />

                          {/* Name */}
                          <div className="flex-1">
                            <span className="text-white font-medium">{category.name}</span>
                            <span className="ml-3 text-sm text-white/30">{count} 个书签</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditCategory(category)}
                              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`确定删除分类 "${category.name}" 吗？该分类下的书签将变为未分类。`)) {
                                  onDeleteCategory(category.id)
                                  showToast('success', '分类已删除')
                                }
                              }}
                              className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>

                {/* Uncategorized Info */}
                {bookmarks.filter(b => !b.category).length > 0 && (
                  <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-white/20" />
                      <span className="text-white/50">未分类</span>
                      <span className="text-sm text-white/30">
                        {bookmarks.filter(b => !b.category).length} 个书签
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 max-w-5xl"
              >
                {/* First Row: Site Settings + Security */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SiteSettingsCard
                    settings={siteSettings}
                    onChange={setSiteSettings}
                    onSave={handleSaveSettings}
                    isSaving={isSavingSettings}
                    success={settingsSuccess}
                    error={settingsError}
                  />
                  
                  <SecurityCard
                    onChangePassword={handleChangePassword}
                    isChanging={isChangingPassword}
                    success={passwordSuccess}
                    error={passwordError}
                    onClearError={() => setPasswordError('')}
                    onClearSuccess={() => setPasswordSuccess(false)}
                  />
                </div>

                {/* Second Row: Data Management */}
                <DataManagementCard
                  bookmarks={bookmarks}
                  categories={categories}
                  settings={siteSettings}
                  onImport={async (data) => {
                    await importData(data)
                    showToast('success', '数据导入成功，正在刷新...')
                    // 刷新数据
                    if (onRefreshData) {
                      onRefreshData()
                    } else {
                      // 如果没有刷新回调，重新加载页面
                      window.location.reload()
                    }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

// 导出带 ToastProvider 的组件
export function Admin(props: AdminProps) {
  return (
    <ToastProvider>
      <AdminContent {...props} />
    </ToastProvider>
  )
}
