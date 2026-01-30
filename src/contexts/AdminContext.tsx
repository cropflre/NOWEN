import { createContext, useContext, ReactNode, useCallback, useState } from 'react'
import { Bookmark, Category } from '../types/bookmark'

// ========== Context 类型定义 ==========

export interface AdminContextValue {
  // 数据
  bookmarks: Bookmark[]
  categories: Category[]
  username: string
  
  // 导航操作
  onBack: () => void
  onLogout: () => void
  
  // 书签操作
  addBookmark: () => void
  editBookmark: (bookmark: Bookmark) => void
  deleteBookmark: (id: string) => void
  togglePin: (id: string) => void
  toggleReadLater: (id: string) => void
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void
  
  // 分类操作
  addCategory: (category: Omit<Category, 'id' | 'orderIndex'>) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  
  // 其他操作
  refreshData: () => void
  updateQuotes: (quotes: string[], useDefault: boolean) => void
  
  // 模态框状态
  isAddModalOpen: boolean
  setIsAddModalOpen: (open: boolean) => void
  editingBookmark: Bookmark | null
  setEditingBookmark: (bookmark: Bookmark | null) => void
}

// ========== Context 创建 ==========

const AdminContext = createContext<AdminContextValue | null>(null)

// ========== Provider Props ==========

export interface AdminProviderProps {
  children: ReactNode
  // 数据
  bookmarks: Bookmark[]
  categories: Category[]
  username: string
  // 导航
  onBack: () => void
  onLogout: () => void
  // 书签回调
  onAddBookmark: () => void
  onEditBookmark: (bookmark: Bookmark) => void
  onDeleteBookmark: (id: string) => void
  onTogglePin: (id: string) => void
  onToggleReadLater: (id: string) => void
  onUpdateBookmark: (id: string, updates: Partial<Bookmark>) => void
  // 分类回调
  onAddCategory: (category: Omit<Category, 'id' | 'orderIndex'>) => void
  onUpdateCategory: (id: string, updates: Partial<Category>) => void
  onDeleteCategory: (id: string) => void
  // 其他回调
  onRefreshData?: () => void
  onQuotesUpdate?: (quotes: string[], useDefault: boolean) => void
}

// ========== Provider 组件 ==========

export function AdminProvider({
  children,
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
}: AdminProviderProps) {
  // 模态框状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)

  // 包装回调函数，添加额外逻辑
  const handleAddBookmark = useCallback(() => {
    setEditingBookmark(null)
    setIsAddModalOpen(true)
    onAddBookmark()
  }, [onAddBookmark])

  const handleEditBookmark = useCallback((bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setIsAddModalOpen(true)
    onEditBookmark(bookmark)
  }, [onEditBookmark])

  const handleRefreshData = useCallback(() => {
    onRefreshData?.()
  }, [onRefreshData])

  const handleUpdateQuotes = useCallback((quotes: string[], useDefault: boolean) => {
    onQuotesUpdate?.(quotes, useDefault)
  }, [onQuotesUpdate])

  const value: AdminContextValue = {
    // 数据
    bookmarks,
    categories,
    username,
    
    // 导航
    onBack,
    onLogout,
    
    // 书签操作
    addBookmark: handleAddBookmark,
    editBookmark: handleEditBookmark,
    deleteBookmark: onDeleteBookmark,
    togglePin: onTogglePin,
    toggleReadLater: onToggleReadLater,
    updateBookmark: onUpdateBookmark,
    
    // 分类操作
    addCategory: onAddCategory,
    updateCategory: onUpdateCategory,
    deleteCategory: onDeleteCategory,
    
    // 其他操作
    refreshData: handleRefreshData,
    updateQuotes: handleUpdateQuotes,
    
    // 模态框状态
    isAddModalOpen,
    setIsAddModalOpen,
    editingBookmark,
    setEditingBookmark,
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

// ========== Hook ==========

/**
 * 使用 Admin Context
 * @throws 如果在 AdminProvider 外部使用会抛出错误
 */
export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext)
  
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  
  return context
}

/**
 * 获取书签相关操作
 */
export function useBookmarkActions() {
  const {
    addBookmark,
    editBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
    updateBookmark,
  } = useAdmin()

  return {
    addBookmark,
    editBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
    updateBookmark,
  }
}

/**
 * 获取分类相关操作
 */
export function useCategoryActions() {
  const {
    addCategory,
    updateCategory,
    deleteCategory,
  } = useAdmin()

  return {
    addCategory,
    updateCategory,
    deleteCategory,
  }
}

/**
 * 获取数据
 */
export function useAdminData() {
  const { bookmarks, categories, username } = useAdmin()
  return { bookmarks, categories, username }
}
