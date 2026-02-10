import { useState, useEffect, useCallback, useRef } from 'react'
import { Bookmark, Category, CustomIcon } from '../types/bookmark'
import * as api from '../lib/api'

// 自定义图标本地存储 Key
const CUSTOM_ICONS_KEY = 'zen-garden-custom-icons'

export function useBookmarkStore() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // 使用 ref 保存最新的 bookmarks，避免 useCallback 依赖问题
  const bookmarksRef = useRef(bookmarks)
  bookmarksRef.current = bookmarks

  // 加载自定义图标
  const loadCustomIcons = useCallback(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_ICONS_KEY)
      if (stored) {
        setCustomIcons(JSON.parse(stored))
      }
    } catch (err) {
      console.error('加载自定义图标失败:', err)
    }
  }, [])

  // 保存自定义图标到本地存储
  const saveCustomIcons = useCallback((icons: CustomIcon[]) => {
    try {
      localStorage.setItem(CUSTOM_ICONS_KEY, JSON.stringify(icons))
    } catch (err) {
      console.error('保存自定义图标失败:', err)
    }
  }, [])

  // 加载数据函数
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [bookmarksData, categoriesData] = await Promise.all([
        api.fetchBookmarks(),
        api.fetchCategories(),
      ])
      setBookmarks(bookmarksData)
      setCategories(categoriesData)
      setError(null)
    } catch (err) {
      console.error('加载数据失败:', err)
      setError('加载数据失败，请确保后端服务已启动')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始加载数据
  useEffect(() => {
    loadData()
    loadCustomIcons()
  }, [loadData, loadCustomIcons])

  // 刷新数据（导入后调用）
  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  // 添加书签
  const addBookmark = useCallback(async (bookmark: Omit<Bookmark, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBookmark = await api.createBookmark({
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description,
        favicon: bookmark.favicon,
        icon: bookmark.icon,
        iconUrl: bookmark.iconUrl,
        ogImage: bookmark.ogImage,
        category: bookmark.category,
        tags: bookmark.tags,
        isReadLater: bookmark.isReadLater,
      })
      
      setBookmarks(prev => [...prev, newBookmark])
      
      // 标记新添加的书签
      setNewlyAddedId(newBookmark.id)
      setTimeout(() => setNewlyAddedId(null), 2000)
      
      return newBookmark
    } catch (err) {
      console.error('添加书签失败:', err)
      throw err
    }
  }, [])

  // 更新书签
  const updateBookmark = useCallback(async (id: string, updates: Partial<Bookmark>) => {
    try {
      const updated = await api.updateBookmark(id, updates)
      setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      console.error('更新书签失败:', err)
      throw err
    }
  }, [])

  // 删除书签
  const deleteBookmark = useCallback(async (id: string) => {
    try {
      await api.deleteBookmark(id)
      setBookmarks(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      console.error('删除书签失败:', err)
      throw err
    }
  }, [])

  // 重排序书签
  const reorderBookmarks = useCallback(async (reorderedBookmarks: Bookmark[]) => {
    try {
      const items = reorderedBookmarks.map((b, index) => ({
        id: b.id,
        orderIndex: index,
      }))
      await api.reorderBookmarks(items)
      setBookmarks(reorderedBookmarks.map((b, index) => ({ ...b, orderIndex: index })))
    } catch (err) {
      console.error('重排序失败:', err)
      throw err
    }
  }, [])

  // 切换置顶
  const togglePin = useCallback(async (id: string) => {
    const bookmark = bookmarksRef.current.find(b => b.id === id)
    if (!bookmark) return
    
    const newIsPinned = !bookmark.isPinned
    
    // 乐观更新 UI
    setBookmarks(prev => prev.map(b => 
      b.id === id ? { ...b, isPinned: newIsPinned } : b
    ))
    
    try {
      const updated = await api.updateBookmark(id, { isPinned: newIsPinned })
      setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      // 回滚
      setBookmarks(prev => prev.map(b => 
        b.id === id ? bookmark : b
      ))
      console.error('切换置顶失败:', err)
      throw err
    }
  }, [])

  // 切换稍后阅读
  const toggleReadLater = useCallback(async (id: string) => {
    const bookmark = bookmarksRef.current.find(b => b.id === id)
    if (!bookmark) return
    
    const newIsReadLater = !bookmark.isReadLater
    
    // 乐观更新 UI
    setBookmarks(prev => prev.map(b => 
      b.id === id 
        ? { ...b, isReadLater: newIsReadLater, isRead: newIsReadLater ? false : b.isRead }
        : b
    ))
    
    try {
      const updated = await api.updateBookmark(id, { 
        isReadLater: newIsReadLater,
        isRead: newIsReadLater ? false : bookmark.isRead,
      })
      // 用服务器返回的数据更新
      setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      // 回滚
      setBookmarks(prev => prev.map(b => 
        b.id === id ? bookmark : b
      ))
      console.error('切换稍后阅读失败:', err)
      throw err
    }
  }, [])

  // 标记已读/未读
  const toggleRead = useCallback(async (id: string) => {
    const bookmark = bookmarksRef.current.find(b => b.id === id)
    if (!bookmark) return
    
    const newIsRead = !bookmark.isRead
    
    // 乐观更新 UI
    setBookmarks(prev => prev.map(b => 
      b.id === id ? { ...b, isRead: newIsRead } : b
    ))
    
    try {
      const updated = await api.updateBookmark(id, { isRead: newIsRead })
      setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      // 回滚
      setBookmarks(prev => prev.map(b => 
        b.id === id ? bookmark : b
      ))
      console.error('切换已读失败:', err)
      throw err
    }
  }, [])

  // 添加分类
  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'orderIndex'>) => {
    try {
      const newCategory = await api.createCategory({
        name: category.name,
        icon: category.icon,
        color: category.color,
      })
      setCategories(prev => [...prev, newCategory])
      return newCategory
    } catch (err) {
      console.error('添加分类失败:', err)
      throw err
    }
  }, [])

  // 追加分类到本地状态（不调用API，用于已通过API创建的分类）
  const appendCategory = useCallback((category: Category) => {
    setCategories(prev => {
      // 避免重复添加
      if (prev.some(c => c.id === category.id)) {
        return prev
      }
      return [...prev, category]
    })
  }, [])

  // 更新分类
  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      const updated = await api.updateCategory(id, updates)
      setCategories(prev => prev.map(c => c.id === id ? updated : c))
    } catch (err) {
      console.error('更新分类失败:', err)
      throw err
    }
  }, [])

  // 删除分类
  const deleteCategory = useCallback(async (id: string) => {
    try {
      await api.deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      // 将该分类下的书签设为未分类
      setBookmarks(prev => prev.map(b => 
        b.category === id ? { ...b, category: undefined } : b
      ))
    } catch (err) {
      console.error('删除分类失败:', err)
      throw err
    }
  }, [])

  // 重排序分类
  const reorderCategories = useCallback(async (reorderedCategories: Category[]) => {
    try {
      const items = reorderedCategories.map((c, index) => ({
        id: c.id,
        orderIndex: index,
      }))
      await api.reorderCategories(items)
      setCategories(reorderedCategories.map((c, index) => ({ ...c, orderIndex: index })))
    } catch (err) {
      console.error('重排序分类失败:', err)
      throw err
    }
  }, [])

  // 获取排序后的书签
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    // 置顶优先
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return a.orderIndex - b.orderIndex
  })

  // 按分类分组
  const bookmarksByCategory = categories.reduce((acc, category) => {
    acc[category.id] = sortedBookmarks.filter(b => b.category === category.id)
    return acc
  }, {} as Record<string, Bookmark[]>)

  // 未分类的书签
  const uncategorizedBookmarks = sortedBookmarks.filter(b => !b.category)

  // 稍后阅读的书签
  const readLaterBookmarks = sortedBookmarks.filter(b => b.isReadLater && !b.isRead)

  // 添加自定义图标
  const addCustomIcon = useCallback((icon: Omit<CustomIcon, 'id' | 'createdAt'>) => {
    const newIcon: CustomIcon = {
      id: `custom-${Date.now()}`,
      name: icon.name,
      url: icon.url,
      createdAt: Date.now(),
    }
    setCustomIcons(prev => {
      const updated = [...prev, newIcon]
      saveCustomIcons(updated)
      return updated
    })
    return newIcon
  }, [saveCustomIcons])

  // 删除自定义图标
  const deleteCustomIcon = useCallback((id: string) => {
    setCustomIcons(prev => {
      const updated = prev.filter(icon => icon.id !== id)
      saveCustomIcons(updated)
      return updated
    })
  }, [saveCustomIcons])

  // 更新自定义图标
  const updateCustomIcon = useCallback((id: string, updates: Partial<CustomIcon>) => {
    setCustomIcons(prev => {
      const updated = prev.map(icon => 
        icon.id === id ? { ...icon, ...updates } : icon
      )
      saveCustomIcons(updated)
      return updated
    })
  }, [saveCustomIcons])

  return {
    bookmarks: sortedBookmarks,
    categories,
    customIcons,
    isLoading,
    error,
    newlyAddedId,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    togglePin,
    toggleReadLater,
    toggleRead,
    addCategory,
    appendCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addCustomIcon,
    deleteCustomIcon,
    updateCustomIcon,
    bookmarksByCategory,
    uncategorizedBookmarks,
    readLaterBookmarks,
    refreshData,
  }
}
