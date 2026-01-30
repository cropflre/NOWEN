import { useState, useEffect, useCallback } from 'react'
import { Bookmark, Category, initialBookmarks, initialCategories } from '../types/bookmark'
import { generateId } from '../lib/utils'

const STORAGE_KEY = 'digital-zen-garden'

interface StoreState {
  bookmarks: Bookmark[]
  categories: Category[]
}

export function useBookmarkStore() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)

  // 加载数据
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data: StoreState = JSON.parse(stored)
        setBookmarks(data.bookmarks || [])
        setCategories(data.categories || initialCategories)
      } catch {
        setBookmarks(initialBookmarks)
        setCategories(initialCategories)
      }
    } else {
      setBookmarks(initialBookmarks)
      setCategories(initialCategories)
    }
    setIsLoading(false)
  }, [])

  // 保存数据
  const saveToStorage = useCallback((newBookmarks: Bookmark[], newCategories: Category[]) => {
    const data: StoreState = { bookmarks: newBookmarks, categories: newCategories }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [])

  // 添加书签
  const addBookmark = useCallback((bookmark: Omit<Bookmark, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId()
    const newBookmark: Bookmark = {
      ...bookmark,
      id,
      orderIndex: bookmarks.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const newBookmarks = [...bookmarks, newBookmark]
    setBookmarks(newBookmarks)
    saveToStorage(newBookmarks, categories)
    
    // 标记新添加的书签
    setNewlyAddedId(id)
    setTimeout(() => setNewlyAddedId(null), 2000)
    
    return newBookmark
  }, [bookmarks, categories, saveToStorage])

  // 更新书签
  const updateBookmark = useCallback((id: string, updates: Partial<Bookmark>) => {
    const newBookmarks = bookmarks.map(b => 
      b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b
    )
    setBookmarks(newBookmarks)
    saveToStorage(newBookmarks, categories)
  }, [bookmarks, categories, saveToStorage])

  // 删除书签
  const deleteBookmark = useCallback((id: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== id)
    setBookmarks(newBookmarks)
    saveToStorage(newBookmarks, categories)
  }, [bookmarks, categories, saveToStorage])

  // 重排序书签
  const reorderBookmarks = useCallback((reorderedBookmarks: Bookmark[]) => {
    const updated = reorderedBookmarks.map((b, index) => ({
      ...b,
      orderIndex: index,
      updatedAt: Date.now(),
    }))
    setBookmarks(updated)
    saveToStorage(updated, categories)
  }, [categories, saveToStorage])

  // 切换置顶
  const togglePin = useCallback((id: string) => {
    const newBookmarks = bookmarks.map(b =>
      b.id === id ? { ...b, isPinned: !b.isPinned, updatedAt: Date.now() } : b
    )
    setBookmarks(newBookmarks)
    saveToStorage(newBookmarks, categories)
  }, [bookmarks, categories, saveToStorage])

  // 切换稍后阅读
  const toggleReadLater = useCallback((id: string) => {
    const newBookmarks = bookmarks.map(b =>
      b.id === id ? { 
        ...b, 
        isReadLater: !b.isReadLater, 
        isRead: !b.isReadLater ? false : b.isRead, // 添加到稍后读时重置已读状态
        updatedAt: Date.now() 
      } : b
    )
    setBookmarks(newBookmarks)
    saveToStorage(newBookmarks, categories)
  }, [bookmarks, categories, saveToStorage])

  // 标记已读/未读
  const toggleRead = useCallback((id: string) => {
    const newBookmarks = bookmarks.map(b =>
      b.id === id ? { ...b, isRead: !b.isRead, updatedAt: Date.now() } : b
    )
    setBookmarks(newBookmarks)
    saveToStorage(newBookmarks, categories)
  }, [bookmarks, categories, saveToStorage])

  // 添加分类
  const addCategory = useCallback((category: Omit<Category, 'id' | 'orderIndex'>) => {
    const newCategory: Category = {
      ...category,
      id: generateId(),
      orderIndex: categories.length,
    }
    const newCategories = [...categories, newCategory]
    setCategories(newCategories)
    saveToStorage(bookmarks, newCategories)
    return newCategory
  }, [bookmarks, categories, saveToStorage])

  // 更新分类
  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    const newCategories = categories.map(c =>
      c.id === id ? { ...c, ...updates } : c
    )
    setCategories(newCategories)
    saveToStorage(bookmarks, newCategories)
  }, [bookmarks, categories, saveToStorage])

  // 删除分类
  const deleteCategory = useCallback((id: string) => {
    const newCategories = categories.filter(c => c.id !== id)
    // 将该分类下的书签设为未分类
    const newBookmarks = bookmarks.map(b =>
      b.category === id ? { ...b, category: undefined, updatedAt: Date.now() } : b
    )
    setCategories(newCategories)
    setBookmarks(newBookmarks)
    saveToStorage(newBookmarks, newCategories)
  }, [bookmarks, categories, saveToStorage])

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

  return {
    bookmarks: sortedBookmarks,
    categories,
    isLoading,
    newlyAddedId,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    togglePin,
    toggleReadLater,
    toggleRead,
    addCategory,
    updateCategory,
    deleteCategory,
    bookmarksByCategory,
    uncategorizedBookmarks,
    readLaterBookmarks,
  }
}
