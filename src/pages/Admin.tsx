import { useState, useMemo } from 'react'
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
  FolderPlus,
  Palette,
  MoreHorizontal,
  Filter,
  ChevronDown,
  GripVertical,
  LogOut,
  Settings,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle,
} from 'lucide-react'
import { Bookmark, Category } from '../types/bookmark'
import { cn } from '../lib/utils'
import { adminChangePassword } from '../lib/api'

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
}

// 预设颜色
const presetColors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#6366f1', '#a855f7',
]

export function Admin({
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
}: AdminProps) {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'categories' | 'settings'>('bookmarks')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6')
  
  // 修改密码状态
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

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
    } else {
      onAddCategory({ 
        name: newCategoryName, 
        color: newCategoryColor 
      })
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
  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)
    
    // 验证新密码
    if (newPassword.length < 6) {
      setPasswordError('新密码长度至少 6 位')
      return
    }
    
    // 验证确认密码
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致')
      return
    }
    
    setIsChangingPassword(true)
    
    try {
      await adminChangePassword(currentPassword, newPassword)
      
      // 重置表单
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(true)
      
      // 3秒后隐藏成功提示
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      setPasswordError(err.message || '修改密码失败')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={onBack}
                className="p-2 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="text-xl font-medium text-white">后台管理</h1>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                onClick={onAddBookmark}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-nebula-purple to-nebula-pink text-white font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                添加书签
              </motion.button>

              <motion.button
                onClick={() => {
                  if (confirm('确定退出登录吗？')) {
                    onLogout()
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          {(['bookmarks', 'categories', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                activeTab === tab 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              {tab === 'settings' && <Settings className="w-4 h-4" />}
              {tab === 'bookmarks' ? `书签 (${bookmarks.length})` : tab === 'categories' ? `分类 (${categories.length})` : '设置'}
            </button>
          ))}
        </div>

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="搜索书签..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20 cursor-pointer"
                >
                  <option value="all">全部分类</option>
                  <option value="uncategorized">未分类</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Batch Actions */}
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-nebula-purple/10 border border-nebula-purple/20"
              >
                <span className="text-sm text-white/70">
                  已选择 {selectedIds.size} 项
                </span>
                <div className="flex-1" />
                <button
                  onClick={deleteSelected}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  批量删除
                </button>
              </motion.div>
            )}

            {/* Table */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_auto_auto] gap-4 px-4 py-3 bg-white/5 border-b border-white/10 text-sm text-white/50">
                <button
                  onClick={selectAll}
                  className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                    selectedIds.size === filteredBookmarks.length && filteredBookmarks.length > 0
                      ? 'bg-nebula-purple border-nebula-purple text-white'
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
              <div className="divide-y divide-white/5">
                {filteredBookmarks.length === 0 ? (
                  <div className="px-4 py-12 text-center text-white/30">
                    {searchQuery || filterCategory !== 'all' ? '没有匹配的书签' : '暂无书签'}
                  </div>
                ) : (
                  filteredBookmarks.map((bookmark, index) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_auto_auto] gap-4 px-4 py-3 items-center hover:bg-white/5 transition-colors group"
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelect(bookmark.id)}
                        className={cn(
                          'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                          selectedIds.has(bookmark.id)
                            ? 'bg-nebula-purple border-nebula-purple text-white'
                            : 'border-white/20 hover:border-white/40'
                        )}
                      >
                        {selectedIds.has(bookmark.id) && <Check className="w-3 h-3" />}
                      </button>

                      {/* Bookmark Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          {bookmark.favicon ? (
                            <img src={bookmark.favicon} alt="" className="w-4 h-4" />
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
                          className="appearance-none px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 focus:outline-none cursor-pointer"
                        >
                          <option value="">未分类</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onTogglePin(bookmark.id)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            bookmark.isPinned 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'text-white/20 hover:text-white/50 hover:bg-white/5'
                          )}
                          title="置顶"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onToggleReadLater(bookmark.id)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            bookmark.isReadLater 
                              ? 'bg-orange-500/20 text-orange-400' 
                              : 'text-white/20 hover:text-white/50 hover:bg-white/5'
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
                          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                          title="打开链接"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditBookmark(bookmark)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('确定删除这个书签？')) {
                              onDeleteBookmark(bookmark.id)
                            }
                          }}
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Add Category Button */}
            <div className="mb-6">
              <motion.button
                onClick={() => setShowCategoryForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
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
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input
                        type="text"
                        placeholder="分类名称"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                        autoFocus
                      />
                      
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-white/30" />
                        <div className="flex gap-1">
                          {presetColors.map(color => (
                            <button
                              key={color}
                              onClick={() => setNewCategoryColor(color)}
                              className={cn(
                                'w-6 h-6 rounded-full transition-transform',
                                newCategoryColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0f] scale-110'
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCategory}
                          className="px-4 py-2 rounded-xl bg-nebula-purple text-white font-medium hover:bg-nebula-purple/80 transition-colors"
                        >
                          {editingCategory ? '保存' : '创建'}
                        </button>
                        <button
                          onClick={resetCategoryForm}
                          className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Categories List */}
            <div className="space-y-2">
              {categories.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  暂无分类，点击上方按钮创建
                </div>
              ) : (
                categories.map((category, index) => {
                  const count = bookmarks.filter(b => b.category === category.id).length
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors group"
                    >
                      {/* Drag Handle */}
                      <div className="text-white/20 cursor-grab">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Color Indicator */}
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />

                      {/* Name */}
                      <div className="flex-1">
                        <span className="text-white font-medium">{category.name}</span>
                        <span className="ml-2 text-sm text-white/30">{count} 个书签</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditCategory(category)}
                          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除分类 "${category.name}" 吗？该分类下的书签将变为未分类。`)) {
                              onDeleteCategory(category.id)
                            }
                          }}
                          className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg"
          >
            {/* Change Password Section */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-nebula-purple/20 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-nebula-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">修改密码</h3>
                  <p className="text-sm text-white/40">更改后台管理登录密码</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm text-white/50 mb-2">当前密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => {
                        setCurrentPassword(e.target.value)
                        setPasswordError('')
                      }}
                      placeholder="请输入当前密码"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-nebula-purple/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
                    >
                      {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm text-white/50 mb-2">新密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => {
                        setNewPassword(e.target.value)
                        setPasswordError('')
                      }}
                      placeholder="请输入新密码（至少6位）"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-nebula-purple/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm text-white/50 mb-2">确认新密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value)
                        setPasswordError('')
                      }}
                      placeholder="请再次输入新密码"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-nebula-purple/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
                    >
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {passwordError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-red-400 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      {passwordError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Message */}
                <AnimatePresence>
                  {passwordSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-green-400 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      密码修改成功
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-nebula-purple to-nebula-pink text-white font-medium mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isChangingPassword ? 1 : 1.01 }}
                  whileTap={{ scale: isChangingPassword ? 1 : 0.99 }}
                >
                  {isChangingPassword ? '修改中...' : '确认修改'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
