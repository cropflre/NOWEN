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
  Code2,
  Zap,
  BookOpen,
  Play,
  Briefcase,
  Coffee,
  Globe,
  Heart,
  Home,
  Image,
  Link,
  Mail,
  Map,
  MessageCircle,
  Music,
  Settings,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
  Video,
  Wallet,
  Gamepad2,
  Camera,
  Cpu,
  Database,
  FileText,
  Folder,
  Gift,
  Headphones,
  Key,
  Layers,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Bookmark, Category } from '../types/bookmark'
import { cn } from '../lib/utils'
import { adminChangePassword, fetchSettings, updateSettings, SiteSettings, importData, fetchQuotes, updateQuotes } from '../lib/api'
import { AdminSidebar } from '../components/admin/AdminSidebar'
import { SiteSettingsCard } from '../components/admin/SiteSettingsCard'
import { SecurityCard } from '../components/admin/SecurityCard'
import { DataManagementCard } from '../components/admin/DataManagementCard'
import { ThemeCard } from '../components/admin/ThemeCard'
import { QuotesCard } from '../components/admin/QuotesCard'
import { ToastProvider, useToast } from '../components/admin/Toast'
import { useTheme, ThemeId } from '../hooks/useTheme.tsx'

// 预设图标列表
const presetIcons: { name: string; icon: LucideIcon }[] = [
  { name: 'code', icon: Code2 },
  { name: 'zap', icon: Zap },
  { name: 'palette', icon: Palette },
  { name: 'book', icon: BookOpen },
  { name: 'play', icon: Play },
  { name: 'briefcase', icon: Briefcase },
  { name: 'coffee', icon: Coffee },
  { name: 'globe', icon: Globe },
  { name: 'heart', icon: Heart },
  { name: 'home', icon: Home },
  { name: 'image', icon: Image },
  { name: 'link', icon: Link },
  { name: 'mail', icon: Mail },
  { name: 'map', icon: Map },
  { name: 'message', icon: MessageCircle },
  { name: 'music', icon: Music },
  { name: 'settings', icon: Settings },
  { name: 'cart', icon: ShoppingCart },
  { name: 'star', icon: Star },
  { name: 'trending', icon: TrendingUp },
  { name: 'users', icon: Users },
  { name: 'video', icon: Video },
  { name: 'wallet', icon: Wallet },
  { name: 'gamepad', icon: Gamepad2 },
  { name: 'camera', icon: Camera },
  { name: 'cpu', icon: Cpu },
  { name: 'database', icon: Database },
  { name: 'file', icon: FileText },
  { name: 'folder', icon: Folder },
  { name: 'gift', icon: Gift },
  { name: 'headphones', icon: Headphones },
  { name: 'key', icon: Key },
  { name: 'layers', icon: Layers },
]

// 根据图标名称获取图标组件
function getIconByName(name: string | undefined): LucideIcon {
  const found = presetIcons.find(i => i.name === name)
  return found?.icon || Folder
}

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
  onQuotesUpdate?: (quotes: string[], useDefault: boolean) => void
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
  onQuotesUpdate,
}: AdminProps) {
  const { showToast } = useToast()
  const { themeId, isDark, setTheme, toggleDarkMode, autoMode, setAutoMode } = useTheme()
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'categories' | 'quotes' | 'settings'>('bookmarks')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6')
  const [newCategoryIcon, setNewCategoryIcon] = useState('folder')
  const [showIconPicker, setShowIconPicker] = useState(false)
  
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

  // 名言状态
  const [quotes, setQuotes] = useState<string[]>([])
  const [useDefaultQuotes, setUseDefaultQuotes] = useState(true)

  // 加载站点设置和名言
  useEffect(() => {
    fetchSettings().then(settings => {
      setSiteSettings(settings)
    }).catch(console.error)

    fetchQuotes().then(data => {
      setQuotes(data.quotes)
      setUseDefaultQuotes(data.useDefaultQuotes)
    }).catch(console.error)
  }, [])

  // 更新名言
  const handleUpdateQuotes = async (newQuotes: string[], newUseDefault: boolean) => {
    try {
      await updateQuotes(newQuotes, newUseDefault)
      setQuotes(newQuotes)
      setUseDefaultQuotes(newUseDefault)
      // 通知父组件更新名言
      onQuotesUpdate?.(newQuotes, newUseDefault)
    } catch (error) {
      console.error('更新名言失败:', error)
    }
  }

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
        color: newCategoryColor,
        icon: newCategoryIcon,
      })
      showToast('success', '分类已更新')
    } else {
      onAddCategory({ 
        name: newCategoryName, 
        color: newCategoryColor,
        icon: newCategoryIcon,
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
    setNewCategoryIcon('folder')
    setShowIconPicker(false)
  }

  const startEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color || '#3b82f6')
    setNewCategoryIcon(category.icon || 'folder')
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
    quotes: '名言管理',
    settings: '系统设置',
  }

  return (
    <div 
      className="flex h-screen font-sans overflow-hidden transition-colors duration-500"
      style={{ 
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={onBack}
        onLogout={onLogout}
        bookmarkCount={bookmarks.length}
        categoryCount={categories.length}
        quoteCount={quotes.length}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Background Gradient */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{ background: 'var(--color-bg-gradient)' }}
        />
        
        <div className="relative p-8">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-10"
          >
            <div>
              <h1 
                className="text-3xl font-bold bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: `linear-gradient(to right, var(--color-text-primary), var(--color-text-muted))` 
                }}
              >
                {tabTitles[activeTab]}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {activeTab === 'bookmarks' && `共 ${bookmarks.length} 个书签`}
                {activeTab === 'categories' && `共 ${categories.length} 个分类`}
                {activeTab === 'quotes' && `共 ${quotes.length} 条名言`}
                {activeTab === 'settings' && '管理您的网站配置'}
              </p>
            </div>

            {activeTab === 'bookmarks' && (
              <motion.button
                onClick={onAddBookmark}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg"
                style={{ 
                  background: `linear-gradient(to right, var(--color-primary), var(--color-accent))`,
                  boxShadow: '0 4px 20px var(--color-glow)',
                }}
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
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="搜索书签..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl backdrop-blur-sm focus:outline-none transition-all duration-300"
                      style={{
                        background: 'var(--color-glass)',
                        border: '1px solid var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  {/* Filter */}
                  <div className="relative">
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-3 rounded-xl cursor-pointer focus:outline-none transition-all duration-300"
                      style={{
                        background: 'var(--color-glass)',
                        border: '1px solid var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <option value="all" style={{ background: 'var(--color-bg-secondary)' }}>全部分类</option>
                      <option value="uncategorized" style={{ background: 'var(--color-bg-secondary)' }}>未分类</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id} style={{ background: 'var(--color-bg-secondary)' }}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                </div>

                {/* Batch Actions */}
                <AnimatePresence>
                  {selectedIds.size > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-4 mb-4 p-4 rounded-xl"
                      style={{
                        background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
                      }}
                    >
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        已选择 <span style={{ color: 'var(--color-primary)' }} className="font-medium">{selectedIds.size}</span> 项
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
                <div 
                  className="rounded-2xl overflow-hidden backdrop-blur-sm"
                  style={{
                    background: 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                  }}
                >
                  {/* Table Header */}
                  <div 
                    className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_auto_auto] gap-4 px-5 py-4 text-sm font-medium"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      borderBottom: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <button
                      onClick={selectAll}
                      className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center transition-all',
                        selectedIds.size === filteredBookmarks.length && filteredBookmarks.length > 0
                          ? 'text-white'
                          : ''
                      )}
                      style={{
                        background: selectedIds.size === filteredBookmarks.length && filteredBookmarks.length > 0 
                          ? 'var(--color-primary)' 
                          : 'transparent',
                        borderColor: selectedIds.size === filteredBookmarks.length && filteredBookmarks.length > 0 
                          ? 'var(--color-primary)' 
                          : 'var(--color-border)',
                      }}
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
                  <div style={{ borderColor: 'var(--color-border-light)' }} className="divide-y divide-[var(--color-border-light)]">
                    {filteredBookmarks.length === 0 ? (
                      <div className="px-4 py-16 text-center">
                        <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
                        <p style={{ color: 'var(--color-text-muted)' }}>
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
                          className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_auto_auto] gap-4 px-5 py-4 items-center transition-colors group hover:bg-[var(--color-glass-hover)]"
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleSelect(bookmark.id)}
                            className={cn(
                              'w-5 h-5 rounded border flex items-center justify-center transition-all',
                              selectedIds.has(bookmark.id) ? 'text-white' : ''
                            )}
                            style={{
                              background: selectedIds.has(bookmark.id) ? 'var(--color-primary)' : 'transparent',
                              borderColor: selectedIds.has(bookmark.id) ? 'var(--color-primary)' : 'var(--color-border)',
                            }}
                          >
                            {selectedIds.has(bookmark.id) && <Check className="w-3 h-3" />}
                          </button>

                          {/* Bookmark Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div 
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                background: 'var(--color-bg-tertiary)',
                                border: '1px solid var(--color-glass-border)',
                              }}
                            >
                              {bookmark.favicon ? (
                                <img src={bookmark.favicon} alt="" className="w-5 h-5 rounded" />
                              ) : (
                                <ExternalLink className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                {bookmark.title}
                              </div>
                              <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
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
                              className="appearance-none px-3 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer transition-colors"
                              style={{
                                background: 'var(--color-bg-tertiary)',
                                border: '1px solid var(--color-glass-border)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              <option value="" style={{ background: 'var(--color-bg-secondary)' }}>未分类</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id} style={{ background: 'var(--color-bg-secondary)' }}>{cat.name}</option>
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
                                  : 'hover:bg-[var(--color-glass-hover)]'
                              )}
                              style={{ color: bookmark.isPinned ? undefined : 'var(--color-text-muted)' }}
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
                                  : 'hover:bg-[var(--color-glass-hover)]'
                              )}
                              style={{ color: bookmark.isReadLater ? undefined : 'var(--color-text-muted)' }}
                              title="稍后阅读"
                            >
                              <BookMarked className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => window.open(bookmark.url, '_blank')}
                              className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
                              style={{ color: 'var(--color-text-muted)' }}
                              title="打开链接"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditBookmark(bookmark)}
                              className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
                              style={{ color: 'var(--color-text-muted)' }}
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
                              className="p-1.5 rounded-lg hover:text-red-400 hover:bg-red-500/10 transition-all"
                              style={{ color: 'var(--color-text-muted)' }}
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
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
                    style={{
                      background: 'var(--color-glass)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <FolderPlus className="w-4 h-4" />
                    新建分类
                  </motion.button>
                </div>

                {/* Category Modal */}
                <AnimatePresence>
                  {showCategoryForm && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4"
                      style={{ background: 'rgba(0,0,0,0.5)' }}
                      onClick={(e) => {
                        if (e.target === e.currentTarget) resetCategoryForm()
                      }}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-md rounded-2xl overflow-visible"
                        style={{
                          background: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-glass-border)',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div 
                          className="flex items-center justify-between px-6 py-4"
                          style={{ borderBottom: '1px solid var(--color-glass-border)' }}
                        >
                          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {editingCategory ? '编辑分类' : '新建分类'}
                          </h3>
                          <button
                            onClick={resetCategoryForm}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-glass-hover)]"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                          {/* 图标和名称 */}
                          <div className="flex gap-4 items-start">
                            {/* 图标选择按钮 */}
                            <button
                              onClick={() => setShowIconPicker(!showIconPicker)}
                              className="flex items-center justify-center w-14 h-14 rounded-xl transition-all hover:scale-105 flex-shrink-0"
                              style={{
                                background: newCategoryColor + '20',
                                border: '2px solid ' + newCategoryColor,
                                color: newCategoryColor,
                              }}
                              title="选择图标"
                            >
                              {(() => {
                                const IconComponent = getIconByName(newCategoryIcon)
                                return <IconComponent className="w-6 h-6" />
                              })()}
                            </button>

                            <div className="flex-1">
                              <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                                分类名称
                              </label>
                              <input
                                type="text"
                                placeholder="输入分类名称"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
                                style={{
                                  background: 'var(--color-bg-tertiary)',
                                  border: '1px solid var(--color-glass-border)',
                                  color: 'var(--color-text-primary)',
                                }}
                                autoFocus
                              />
                            </div>
                          </div>

                          {/* 图标选择 - 内嵌展开式 */}
                          <AnimatePresence>
                            {showIconPicker && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div 
                                  className="p-4 rounded-xl"
                                  style={{
                                    background: 'var(--color-bg-tertiary)',
                                    border: '1px solid var(--color-glass-border)',
                                  }}
                                >
                                  <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>选择图标</p>
                                  <div className="grid grid-cols-11 gap-1">
                                    {presetIcons.map(({ name, icon: IconComp }) => (
                                      <button
                                        key={name}
                                        onClick={() => {
                                          setNewCategoryIcon(name)
                                          setShowIconPicker(false)
                                        }}
                                        className={cn(
                                          'p-2 rounded-lg transition-all hover:scale-110',
                                          newCategoryIcon === name 
                                            ? 'ring-2' 
                                            : 'hover:bg-[var(--color-glass-hover)]'
                                        )}
                                        style={{
                                          background: newCategoryIcon === name ? newCategoryColor + '20' : 'transparent',
                                          color: newCategoryIcon === name ? newCategoryColor : 'var(--color-text-secondary)',
                                          ringColor: newCategoryColor,
                                        }}
                                        title={name}
                                      >
                                        <IconComp className="w-4 h-4" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* 颜色选择 */}
                          <div>
                            <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                              选择颜色
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {presetColors.map(color => (
                                <button
                                  key={color}
                                  onClick={() => setNewCategoryColor(color)}
                                  className={cn(
                                    'w-8 h-8 rounded-full transition-transform',
                                    newCategoryColor === color && 'ring-2 ring-offset-2 scale-110'
                                  )}
                                  style={{ 
                                    backgroundColor: color,
                                    ringColor: 'var(--color-text-primary)',
                                    ringOffsetColor: 'var(--color-bg-secondary)',
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div 
                          className="flex justify-end gap-3 px-6 py-4"
                          style={{ borderTop: '1px solid var(--color-glass-border)' }}
                        >
                          <motion.button
                            onClick={resetCategoryForm}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-2.5 rounded-xl transition-colors"
                            style={{
                              background: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            取消
                          </motion.button>
                          <motion.button
                            onClick={handleSaveCategory}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-2.5 rounded-xl text-white font-medium transition-colors"
                            style={{ background: 'var(--color-primary)' }}
                          >
                            {editingCategory ? '保存更改' : '创建分类'}
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Categories List */}
                <div className="space-y-2">
                  {categories.length === 0 ? (
                    <div 
                      className="text-center py-16 rounded-2xl"
                      style={{
                        background: 'var(--color-glass)',
                        border: '1px solid var(--color-glass-border)',
                      }}
                    >
                      <FolderPlus className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
                      <p style={{ color: 'var(--color-text-muted)' }}>暂无分类，点击上方按钮创建</p>
                    </div>
                  ) : (
                    categories.map((category, index) => {
                      const count = bookmarks.filter(b => b.category === category.id).length
                      const IconComponent = getIconByName(category.icon)
                      return (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 p-4 rounded-xl transition-all group hover:bg-[var(--color-glass-hover)]"
                          style={{
                            background: 'var(--color-glass)',
                            border: '1px solid var(--color-glass-border)',
                          }}
                        >
                          {/* Drag Handle */}
                          <div style={{ color: 'var(--color-text-muted)' }} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Icon with Color */}
                          <div 
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ 
                              backgroundColor: (category.color || '#3b82f6') + '20',
                              color: category.color || '#3b82f6',
                            }}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>

                          {/* Name */}
                          <div className="flex-1">
                            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{category.name}</span>
                            <span className="ml-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{count} 个书签</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditCategory(category)}
                              className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
                              style={{ color: 'var(--color-text-muted)' }}
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
                              className="p-2 rounded-lg hover:text-red-400 hover:bg-red-500/10 transition-all"
                              style={{ color: 'var(--color-text-muted)' }}
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
                  <div 
                    className="mt-6 p-4 rounded-xl"
                    style={{
                      background: 'var(--color-glass)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ background: 'var(--color-text-muted)', opacity: 0.3 }} />
                      <span style={{ color: 'var(--color-text-secondary)' }}>未分类</span>
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {bookmarks.filter(b => !b.category).length} 个书签
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Quotes Tab */}
            {activeTab === 'quotes' && (
              <motion.div
                key="quotes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl"
              >
                <QuotesCard
                  quotes={quotes}
                  useDefaultQuotes={useDefaultQuotes}
                  onUpdate={handleUpdateQuotes}
                />
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
                {/* First Row: Site Settings + Theme */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SiteSettingsCard
                    settings={siteSettings}
                    onChange={setSiteSettings}
                    onSave={handleSaveSettings}
                    isSaving={isSavingSettings}
                    success={settingsSuccess}
                    error={settingsError}
                  />
                  
                  <ThemeCard
                    currentThemeId={themeId}
                    isDark={isDark}
                    autoMode={autoMode}
                    onThemeChange={(id: ThemeId, origin) => {
                      setTheme(id, origin)
                      showToast('success', '主题已切换')
                    }}
                    onAutoModeChange={setAutoMode}
                    onToggleDarkMode={toggleDarkMode}
                  />
                </div>

                {/* Second Row: Security + Data Management */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SecurityCard
                    onChangePassword={handleChangePassword}
                    isChanging={isChangingPassword}
                    success={passwordSuccess}
                    error={passwordError}
                    onClearError={() => setPasswordError('')}
                    onClearSuccess={() => setPasswordSuccess(false)}
                  />

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
                </div>
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
