import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  X,
} from 'lucide-react'
import { Bookmark, Category, CustomIcon } from '../types/bookmark'
import { cn, presetIcons } from '../lib/utils'
import { adminChangePassword, fetchSettings, updateSettings, SiteSettings, WidgetVisibility, importData, fetchQuotes, updateQuotes } from '../lib/api'
import { AdminSidebar } from '../components/admin/AdminSidebar'
import { QuotesCard } from '../components/admin/QuotesCard'
import { SettingsPanel } from '../components/admin/SettingsPanel'
import { AnalyticsCard } from '../components/admin/AnalyticsCard'
import { HealthCheckCard } from '../components/admin/HealthCheckCard'
import { IconRenderer } from '../components/IconRenderer'
import { IconifyPicker } from '../components/IconifyPicker'
import { ToastProvider, useToast } from '../components/admin/Toast'
import { useTheme, ThemeId } from '../hooks/useTheme.tsx'
import { useNetworkEnv, getBookmarkUrl } from '../hooks/useNetworkEnv'
import { AdminProvider, useAdmin, useBookmarkActions, useCategoryActions, useIconActions } from '../contexts/AdminContext'
import { VirtualBookmarkList } from '../components/VirtualBookmarkList'
import { IconManager } from '../components/IconManager'

// 虚拟滚动阈值：超过此数量启用虚拟滚动
const VIRTUAL_SCROLL_THRESHOLD = 50

// Props 简化为仅外部必需的回调
export interface AdminProps {
  bookmarks: Bookmark[]
  categories: Category[]
  customIcons: CustomIcon[]
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
  onReorderCategories: (categories: Category[]) => void
  onAddCustomIcon: (icon: Omit<CustomIcon, 'id' | 'createdAt'>) => void
  onDeleteCustomIcon: (id: string) => void
  onRefreshData?: () => void
  onQuotesUpdate?: (quotes: string[], useDefault: boolean) => void
  onSettingsChange?: (settings: SiteSettings) => void
}

// 可拖拽的分类项组件
interface SortableCategoryItemProps {
  category: Category
  bookmarkCount: number
  onEdit: () => void
  onDelete: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

function SortableCategoryItem({ category, bookmarkCount, onEdit, onDelete, t }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--color-glass)',
        border: '1px solid var(--color-glass-border)',
      }}
      className={cn(
        "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl transition-all group",
        isDragging ? "opacity-50 shadow-lg" : "hover:bg-[var(--color-glass-hover)]"
      )}
      {...attributes}
    >
      {/* Drag Handle */}
      <div 
        {...listeners}
        style={{ color: 'var(--color-text-muted)' }} 
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Icon with Color */}
      <div 
        className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ 
          backgroundColor: (category.color || '#3b82f6') + '20',
          color: category.color || '#3b82f6',
        }}
      >
        <IconRenderer icon={category.icon} className="w-4 h-4" />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm md:text-base truncate block" style={{ color: 'var(--color-text-primary)' }}>{category.name}</span>
        <span className="text-xs md:text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('admin.bookmark.bookmark_count', { count: bookmarkCount })}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
          style={{ color: 'var(--color-text-muted)' }}
          title={t('admin.bookmark.edit')}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:text-red-400 hover:bg-red-500/10 transition-all"
          style={{ color: 'var(--color-text-muted)' }}
          title={t('admin.bookmark.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// 预设颜色
const presetColors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#6366f1', '#a855f7',
]

function AdminContent() {
  const { t } = useTranslation()
  const { isInternal } = useNetworkEnv()
  // 从 Context 获取数据和操作
  const { 
    bookmarks, 
    categories,
    customIcons,
    username, 
    onBack, 
    onLogout,
    refreshData,
    updateQuotes: onQuotesUpdate,
    updateSettings: onSettingsChange,
  } = useAdmin()
  
  const { 
    addBookmark: onAddBookmark, 
    editBookmark: onEditBookmark, 
    deleteBookmark: onDeleteBookmark,
    togglePin: onTogglePin,
    toggleReadLater: onToggleReadLater,
    updateBookmark: onUpdateBookmark,
  } = useBookmarkActions()
  
  const {
    addCategory: onAddCategory,
    updateCategory: onUpdateCategory,
    deleteCategory: onDeleteCategory,
    reorderCategories: onReorderCategories,
  } = useCategoryActions()

  const {
    addCustomIcon: onAddCustomIcon,
    deleteCustomIcon: onDeleteCustomIcon,
  } = useIconActions()

  const { showToast } = useToast()
  const { themeId, isDark, setTheme, toggleDarkMode, autoMode, setAutoMode } = useTheme()
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'categories' | 'quotes' | 'icons' | 'analytics' | 'health-check' | 'settings'>('bookmarks')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6')
  const [newCategoryIcon, setNewCategoryIcon] = useState('folder')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [adminIconTab, setAdminIconTab] = useState<'preset' | 'iconify'>('preset')

  // 分类拖拽排序
  const categorySensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleCategoryDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(categories, oldIndex, newIndex)
      onReorderCategories(reordered)
      showToast('success', t('admin.category.reordered'))
    }
  }, [categories, onReorderCategories, showToast, t])
  
  // 密码修改状态
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // 站点设置状态
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteTitle: 'NOWEN',
    siteFavicon: '',
    enableBeamAnimation: true,
    widgetVisibility: {
      systemMonitor: true,
      hardwareIdentity: true,
      vitalSigns: true,
      networkTelemetry: true,
      processMatrix: true,
      dockMiniMonitor: true,
      mobileTicker: true,
    },
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  // 仪表设置状态
  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({
    systemMonitor: false,
    hardwareIdentity: false,
    vitalSigns: false,
    networkTelemetry: false,
    processMatrix: false,
    dockMiniMonitor: false,
    mobileTicker: false,
  })
  const [isSavingWidgetSettings, setIsSavingWidgetSettings] = useState(false)
  const [widgetSettingsSuccess, setWidgetSettingsSuccess] = useState(false)
  const [widgetSettingsError, setWidgetSettingsError] = useState('')

  // 名言状态
  const [quotes, setQuotes] = useState<string[]>([])
  const [useDefaultQuotes, setUseDefaultQuotes] = useState(true)

  // 加载站点设置和名言
  useEffect(() => {
    fetchSettings().then(settings => {
      setSiteSettings(settings)
      // 同步仪表显示设置
      if (settings.widgetVisibility) {
        setWidgetVisibility(settings.widgetVisibility)
      }
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
      console.error('Failed to update quotes:', error)
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
    if (confirm(t('admin.bookmark.batch_delete_confirm', { count: selectedIds.size }))) {
      selectedIds.forEach(id => onDeleteBookmark(id))
      setSelectedIds(new Set())
      showToast('success', t('admin.bookmark.deleted_count', { count: selectedIds.size }))
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
      showToast('success', t('admin.category.updated'))
    } else {
      onAddCategory({ 
        name: newCategoryName, 
        color: newCategoryColor,
        icon: newCategoryIcon,
      })
      showToast('success', t('admin.category.created'))
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
      showToast('success', t('admin.settings.security.changed'))
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
      showToast('success', t('admin.settings.site.saved'))
      
      // 通知父组件更新设置（实时生效）
      onSettingsChange(updated)
      
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
      setSettingsError(err.message || t('admin.settings.data.export_error'))
      showToast('error', t('admin.settings.data.export_error'))
    } finally {
      setIsSavingSettings(false)
    }
  }

  // 保存仪表设置
  const handleSaveWidgetSettings = async () => {
    setWidgetSettingsError('')
    setWidgetSettingsSuccess(false)
    setIsSavingWidgetSettings(true)
    
    try {
      const updatedSettings = {
        ...siteSettings,
        widgetVisibility,
      }
      const updated = await updateSettings(updatedSettings)
      setSiteSettings(updated)
      if (updated.widgetVisibility) {
        setWidgetVisibility(updated.widgetVisibility)
      }
      setWidgetSettingsSuccess(true)
      showToast('success', t('admin.settings.widget.saved'))
      
      // 通知父组件更新设置（实时生效）
      onSettingsChange(updated)
      
      setTimeout(() => setWidgetSettingsSuccess(false), 3000)
    } catch (err: any) {
      setWidgetSettingsError(err.message || t('admin.settings.data.export_error'))
      showToast('error', t('admin.settings.data.export_error'))
    } finally {
      setIsSavingWidgetSettings(false)
    }
  }

  // Tab titles for header
  const tabTitles = {
    bookmarks: t('admin.nav.bookmarks_full'),
    categories: t('admin.nav.categories_full'),
    quotes: t('admin.nav.quotes_full'),
    icons: t('admin.nav.icons_full'),
    analytics: t('admin.nav.analytics_full'),
    'health-check': t('admin.nav.health_check_full'),
    settings: t('admin.nav.settings_full'),
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
        iconCount={customIcons.length}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-14 pb-20 md:pt-0 md:pb-0">
        {/* Background Gradient */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{ background: 'var(--color-bg-gradient)' }}
        />
        
        <div className="relative p-4 md:p-8">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10"
          >
            <div>
              <h1 
                className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: `linear-gradient(to right, var(--color-text-primary), var(--color-text-muted))` 
                }}
              >
                {tabTitles[activeTab]}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {activeTab === 'bookmarks' && t('admin.stats.total_bookmarks', { count: bookmarks.length })}
                {activeTab === 'categories' && t('admin.stats.total_categories', { count: categories.length })}
                {activeTab === 'quotes' && t('admin.stats.total_quotes', { count: quotes.length })}
                {activeTab === 'icons' && t('admin.stats.total_icons', { count: customIcons.length })}
                {activeTab === 'analytics' && t('admin.stats.view_analytics')}
                {activeTab === 'health-check' && t('admin.stats.check_health')}
                {activeTab === 'settings' && t('admin.stats.manage_config')}
              </p>
            </div>

            {activeTab === 'bookmarks' && (
              <motion.button
                onClick={onAddBookmark}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-white font-medium shadow-lg text-sm md:text-base w-full sm:w-auto justify-center"
                style={{ 
                  background: `linear-gradient(to right, var(--color-primary), var(--color-accent))`,
                  boxShadow: '0 4px 20px var(--color-glow)',
                }}
              >
                <Plus className="w-4 h-4" />
                {t('admin.bookmark.add')}
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
                      placeholder={t('admin.bookmark.search')}
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
                      <option value="all" style={{ background: 'var(--color-bg-secondary)' }}>{t('admin.bookmark.all_categories')}</option>
                      <option value="uncategorized" style={{ background: 'var(--color-bg-secondary)' }}>{t('admin.bookmark.uncategorized')}</option>
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
                        {t('admin.bookmark.selected')} <span style={{ color: 'var(--color-primary)' }} className="font-medium">{selectedIds.size}</span> {t('admin.bookmark.items')}
                      </span>
                      <div className="flex-1" />
                      <motion.button
                        onClick={deleteSelected}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('admin.bookmark.batch_delete')}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Table - 根据数量选择渲染方式 */}
                {filteredBookmarks.length > VIRTUAL_SCROLL_THRESHOLD ? (
                  // 使用虚拟滚动优化大量数据
                  <VirtualBookmarkList
                    bookmarks={filteredBookmarks}
                    categories={categories}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onSelectAll={selectAll}
                    onTogglePin={onTogglePin}
                    onToggleReadLater={onToggleReadLater}
                    onUpdateBookmark={onUpdateBookmark}
                    onEditBookmark={onEditBookmark}
                    onDeleteBookmark={onDeleteBookmark}
                    showToast={showToast}
                  />
                ) : (
                  // 普通渲染（带动画）
                  <div 
                    className="rounded-2xl overflow-hidden backdrop-blur-sm"
                    style={{
                      background: 'var(--color-glass)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  >
                    {/* Table Header - 桌面端显示 */}
                    <div 
                      className="hidden sm:grid grid-cols-[auto_2fr_1fr_auto_auto] gap-4 px-5 py-4 text-sm font-medium"
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
                      <span>{t('admin.bookmark.table.bookmark')}</span>
                      <span>{t('admin.bookmark.table.category')}</span>
                      <span>{t('admin.bookmark.table.status')}</span>
                      <span>{t('admin.bookmark.table.actions')}</span>
                    </div>

                    {/* 移动端全选按钮 */}
                    <div 
                      className="sm:hidden flex items-center justify-between px-4 py-3"
                      style={{
                        background: 'var(--color-bg-tertiary)',
                        borderBottom: '1px solid var(--color-glass-border)',
                      }}
                    >
                      <button
                        onClick={selectAll}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <div
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
                        </div>
                        {t('admin.bookmark.select_all')}
                      </button>
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {filteredBookmarks.length} {t('admin.bookmark.items')}
                      </span>
                    </div>

                    {/* Table Body */}
                    <div style={{ borderColor: 'var(--color-border-light)' }} className="divide-y divide-[var(--color-border-light)]">
                      {filteredBookmarks.length === 0 ? (
                        <div className="px-4 py-16 text-center">
                          <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
                          <p style={{ color: 'var(--color-text-muted)' }}>
                            {searchQuery || filterCategory !== 'all' ? t('admin.bookmark.no_match') : t('admin.bookmark.empty')}
                          </p>
                        </div>
                      ) : (
                        filteredBookmarks.map((bookmark, index) => (
                          <motion.div
                            key={bookmark.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className="transition-colors group hover:bg-[var(--color-glass-hover)]"
                          >
                            {/* 桌面端布局 */}
                            <div className="hidden sm:grid grid-cols-[auto_2fr_1fr_auto_auto] gap-4 px-5 py-4 items-center">
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
                                  {bookmark.iconUrl ? (
                                    <img src={bookmark.iconUrl} alt="" className="w-5 h-5 rounded object-contain" />
                                  ) : bookmark.icon ? (
                                    <IconRenderer icon={bookmark.icon} className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                                  ) : bookmark.favicon ? (
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
                                    {(() => {
                                      try {
                                        return new URL(bookmark.url).hostname
                                      } catch {
                                        return bookmark.url
                                      }
                                    })()}
                                  </div>
                                </div>
                              </div>

                              {/* Category */}
                              <div>
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
                                  <option value="" style={{ background: 'var(--color-bg-secondary)' }}>{t('admin.bookmark.uncategorized')}</option>
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
                                  title={t('admin.bookmark.pinned')}
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
                                  title={t('bookmark.read_later')}
                                >
                                  <BookMarked className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => window.open(getBookmarkUrl(bookmark, isInternal), '_blank')}
                                  className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
                                  style={{ color: 'var(--color-text-muted)' }}
                                  title={t('admin.bookmark.open_link')}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onEditBookmark(bookmark)}
                                  className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
                                  style={{ color: 'var(--color-text-muted)' }}
                                  title={t('admin.bookmark.edit')}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(t('admin.bookmark.delete_confirm'))) {
                                      onDeleteBookmark(bookmark.id)
                                      showToast('success', t('admin.bookmark.deleted'))
                                    }
                                  }}
                                  className="p-1.5 rounded-lg hover:text-red-400 hover:bg-red-500/10 transition-all"
                                  style={{ color: 'var(--color-text-muted)' }}
                                  title={t('admin.bookmark.delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* 移动端卡片布局 */}
                            <div className="sm:hidden p-4">
                              <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <button
                                  onClick={() => toggleSelect(bookmark.id)}
                                  className={cn(
                                    'w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 mt-1',
                                    selectedIds.has(bookmark.id) ? 'text-white' : ''
                                  )}
                                  style={{
                                    background: selectedIds.has(bookmark.id) ? 'var(--color-primary)' : 'transparent',
                                    borderColor: selectedIds.has(bookmark.id) ? 'var(--color-primary)' : 'var(--color-border)',
                                  }}
                                >
                                  {selectedIds.has(bookmark.id) && <Check className="w-3 h-3" />}
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div 
                                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                      style={{
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-glass-border)',
                                      }}
                                    >
                                      {bookmark.iconUrl ? (
                                        <img src={bookmark.iconUrl} alt="" className="w-4 h-4 rounded object-contain" />
                                      ) : bookmark.icon ? (
                                        <IconRenderer icon={bookmark.icon} className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                                      ) : bookmark.favicon ? (
                                        <img src={bookmark.favicon} alt="" className="w-4 h-4 rounded" />
                                      ) : (
                                        <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                        {bookmark.title}
                                      </div>
                                      <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                                        {(() => {
                                          try {
                                            return new URL(bookmark.url).hostname
                                          } catch {
                                            return bookmark.url
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  </div>

                                  {/* 分类和状态 */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <select
                                      value={bookmark.category || ''}
                                      onChange={e => onUpdateBookmark(bookmark.id, { 
                                        category: e.target.value || undefined 
                                      })}
                                      className="appearance-none px-2 py-1 rounded text-xs focus:outline-none cursor-pointer flex-1"
                                      style={{
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-glass-border)',
                                        color: 'var(--color-text-secondary)',
                                      }}
                                    >
                                      <option value="" style={{ background: 'var(--color-bg-secondary)' }}>{t('admin.bookmark.uncategorized')}</option>
                                    {categories.map(cat => (
                                      <option key={cat.id} value={cat.id} style={{ background: 'var(--color-bg-secondary)' }}>{cat.name}</option>
                                    ))}
                                  </select>

                                    {bookmark.isPinned && (
                                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">{t('admin.bookmark.pinned')}</span>
                                    )}
                                    {bookmark.isReadLater && (
                                      <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400">{t('admin.bookmark.read_later_short')}</span>
                                    )}
                                  </div>

                                  {/* 操作按钮 */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => onTogglePin(bookmark.id)}
                                      className={cn(
                                        'p-2 rounded-lg transition-all',
                                        bookmark.isPinned 
                                          ? 'bg-yellow-500/20 text-yellow-400' 
                                          : 'bg-[var(--color-bg-tertiary)]'
                                      )}
                                      style={{ color: bookmark.isPinned ? undefined : 'var(--color-text-muted)' }}
                                    >
                                      <Pin className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => onToggleReadLater(bookmark.id)}
                                      className={cn(
                                        'p-2 rounded-lg transition-all',
                                        bookmark.isReadLater 
                                          ? 'bg-orange-500/20 text-orange-400' 
                                          : 'bg-[var(--color-bg-tertiary)]'
                                      )}
                                      style={{ color: bookmark.isReadLater ? undefined : 'var(--color-text-muted)' }}
                                    >
                                      <BookMarked className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => window.open(getBookmarkUrl(bookmark, isInternal), '_blank')}
                                      className="p-2 rounded-lg bg-[var(--color-bg-tertiary)] transition-all"
                                      style={{ color: 'var(--color-text-muted)' }}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => onEditBookmark(bookmark)}
                                      className="p-2 rounded-lg bg-[var(--color-bg-tertiary)] transition-all"
                                      style={{ color: 'var(--color-text-muted)' }}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(t('admin.bookmark.delete_confirm'))) {
                                          onDeleteBookmark(bookmark.id)
                                          showToast('success', t('admin.bookmark.deleted'))
                                        }
                                      }}
                                      className="p-2 rounded-lg bg-[var(--color-bg-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                                      style={{ color: 'var(--color-text-muted)' }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}
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
                    {t('admin.category.add')}
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
                            {editingCategory ? t('admin.category.edit') : t('admin.category.add')}
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
                                return <IconRenderer icon={newCategoryIcon} className="w-6 h-6" />
                              })()}
                            </button>

                            <div className="flex-1">
                              <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                                {t('admin.category.name')}
                              </label>
                              <input
                                type="text"
                                placeholder={t('admin.category.name_placeholder')}
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
                                  {/* Tab 切换 */}
                                  <div className="flex gap-1 mb-3 p-1 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
                                    <button
                                      onClick={() => setAdminIconTab('preset')}
                                      className="flex-1 px-3 py-1.5 rounded-md text-xs transition-colors"
                                      style={{
                                        background: adminIconTab === 'preset' ? 'var(--color-bg-tertiary)' : 'transparent',
                                        color: adminIconTab === 'preset' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                      }}
                                    >
                                      {t('bookmark.modal.preset_icons')}
                                    </button>
                                    <button
                                      onClick={() => setAdminIconTab('iconify')}
                                      className="flex-1 px-3 py-1.5 rounded-md text-xs transition-colors"
                                      style={{
                                        background: adminIconTab === 'iconify' ? 'var(--color-bg-tertiary)' : 'transparent',
                                        color: adminIconTab === 'iconify' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                      }}
                                    >
                                      {t('bookmark.modal.iconify_icons')}
                                    </button>
                                  </div>

                                  {adminIconTab === 'preset' && (
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
                                  )}

                                  {adminIconTab === 'iconify' && (
                                    <IconifyPicker
                                      selectedIcon={newCategoryIcon}
                                      color={newCategoryColor}
                                      onSelect={(iconName) => {
                                        setNewCategoryIcon(iconName)
                                        setShowIconPicker(false)
                                      }}
                                    />
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* 颜色选择 */}
                          <div>
                            <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                              {t('admin.category.select_color')}
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
                            {t('common.cancel')}
                          </motion.button>
                          <motion.button
                            onClick={handleSaveCategory}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-2.5 rounded-xl text-white font-medium transition-colors"
                            style={{ background: 'var(--color-primary)' }}
                          >
                            {editingCategory ? t('admin.category.save_changes') : t('admin.category.create')}
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Categories List - 支持拖拽排序 */}
                <DndContext
                  sensors={categorySensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleCategoryDragEnd}
                >
                  <div className="space-y-2">
                    {categories.length === 0 ? (
                      <div 
                        className="text-center py-12 md:py-16 rounded-2xl"
                        style={{
                          background: 'var(--color-glass)',
                          border: '1px solid var(--color-glass-border)',
                        }}
                      >
                        <FolderPlus className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
                        <p style={{ color: 'var(--color-text-muted)' }}>{t('admin.category.empty')}</p>
                      </div>
                    ) : (
                      <SortableContext
                        items={categories.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {categories.map((category) => {
                          const count = bookmarks.filter(b => b.category === category.id).length
                          return (
                            <SortableCategoryItem
                              key={category.id}
                              category={category}
                              bookmarkCount={count}
                              onEdit={() => startEditCategory(category)}
                              onDelete={() => {
                                if (confirm(t('admin.category.delete_confirm', { name: category.name }))) {
                                  onDeleteCategory(category.id)
                                  showToast('success', t('admin.category.deleted'))
                                }
                              }}
                              t={t}
                            />
                          )
                        })}
                      </SortableContext>
                    )}
                  </div>
                </DndContext>

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
                      <span style={{ color: 'var(--color-text-secondary)' }}>{t('admin.bookmark.uncategorized')}</span>
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {t('admin.bookmark.bookmark_count', { count: bookmarks.filter(b => !b.category).length })}
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

            {/* Icons Tab */}
            {activeTab === 'icons' && (
              <motion.div
                key="icons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl"
              >
                <IconManager
                  isOpen={true}
                  onClose={() => {}}
                  customIcons={customIcons}
                  onAddIcon={onAddCustomIcon}
                  onDeleteIcon={onDeleteCustomIcon}
                  embedded
                />
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl"
              >
                <AnalyticsCard onShowToast={showToast} />
              </motion.div>
            )}

            {/* Health Check Tab */}
            {activeTab === 'health-check' && (
              <motion.div
                key="health-check"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl"
              >
                <HealthCheckCard onShowToast={showToast} onDeleteBookmark={onDeleteBookmark} />
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl"
              >
                <SettingsPanel
                  // 站点设置
                  siteSettings={siteSettings}
                  onSiteSettingsChange={setSiteSettings}
                  onSaveSiteSettings={handleSaveSettings}
                  isSavingSiteSettings={isSavingSettings}
                  siteSettingsSuccess={settingsSuccess}
                  siteSettingsError={settingsError}
                  // 主题设置
                  themeId={themeId}
                  isDark={isDark}
                  autoMode={autoMode}
                  onThemeChange={(id: ThemeId, origin) => {
                    setTheme(id, origin)
                    showToast('success', t('admin.settings.theme.theme_switched'))
                  }}
                  onAutoModeChange={setAutoMode}
                  onToggleDarkMode={toggleDarkMode}
                  // 仪表设置
                  widgetVisibility={widgetVisibility}
                  onWidgetVisibilityChange={setWidgetVisibility}
                  onSaveWidgetSettings={handleSaveWidgetSettings}
                  isSavingWidgetSettings={isSavingWidgetSettings}
                  widgetSettingsSuccess={widgetSettingsSuccess}
                  widgetSettingsError={widgetSettingsError}
                  // 安全设置
                  onChangePassword={handleChangePassword}
                  isChangingPassword={isChangingPassword}
                  passwordSuccess={passwordSuccess}
                  passwordError={passwordError}
                  onClearPasswordError={() => setPasswordError('')}
                  onClearPasswordSuccess={() => setPasswordSuccess(false)}
                  // 数据管理
                  bookmarks={bookmarks}
                  categories={categories}
                  onImport={async (data) => {
                    await importData(data)
                    await refreshData()
                    showToast('success', t('admin.settings.data.import_success', { bookmarks: data.bookmarks?.length || 0, categories: data.categories?.length || 0 }))
                    // 导入成功后跳转到首页
                    setTimeout(() => {
                      onBack()
                    }, 1000)
                  }}
                  onFactoryReset={() => {
                    showToast('success', t('admin.settings.data.reset_success'))
                    refreshData()
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

// 导出带 Provider 的组件
export function Admin(props: AdminProps) {
  return (
    <AdminProvider
      bookmarks={props.bookmarks}
      categories={props.categories}
      customIcons={props.customIcons}
      username={props.username}
      onBack={props.onBack}
      onLogout={props.onLogout}
      onAddBookmark={props.onAddBookmark}
      onEditBookmark={props.onEditBookmark}
      onDeleteBookmark={props.onDeleteBookmark}
      onTogglePin={props.onTogglePin}
      onToggleReadLater={props.onToggleReadLater}
      onUpdateBookmark={props.onUpdateBookmark}
      onAddCategory={props.onAddCategory}
      onUpdateCategory={props.onUpdateCategory}
      onDeleteCategory={props.onDeleteCategory}
      onReorderCategories={props.onReorderCategories}
      onAddCustomIcon={props.onAddCustomIcon}
      onDeleteCustomIcon={props.onDeleteCustomIcon}
      onRefreshData={props.onRefreshData}
      onQuotesUpdate={props.onQuotesUpdate}
      onSettingsChange={props.onSettingsChange}
    >
      <ToastProvider>
        <AdminContent />
      </ToastProvider>
    </AdminProvider>
  )
}