import { useState, useCallback, useMemo } from 'react'
import { PaginationParams, PaginatedResponse } from '../lib/api'

interface UsePaginationOptions<T> {
  fetchFn: (params: PaginationParams) => Promise<PaginatedResponse<T>>
  initialPageSize?: number
  initialParams?: Omit<PaginationParams, 'page' | 'pageSize'>
}

interface UsePaginationReturn<T> {
  // 数据
  items: T[]
  allItems: T[]  // 累计加载的所有项（用于无限滚动）
  isLoading: boolean
  error: string | null
  
  // 分页信息
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  
  // 操作方法
  loadPage: (page: number) => Promise<void>
  loadMore: () => Promise<void>  // 加载更多（无限滚动）
  refresh: () => Promise<void>
  setParams: (params: Omit<PaginationParams, 'page' | 'pageSize'>) => void
  setPageSize: (size: number) => void
  reset: () => void
}

export function usePagination<T>({
  fetchFn,
  initialPageSize = 20,
  initialParams = {},
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [items, setItems] = useState<T[]>([])
  const [allItems, setAllItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [params, setParamsState] = useState<Omit<PaginationParams, 'page' | 'pageSize'>>(initialParams)

  const loadPage = useCallback(async (targetPage: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchFn({
        ...params,
        page: targetPage,
        pageSize,
      })
      
      setItems(response.items)
      setPage(response.pagination.page)
      setTotal(response.pagination.total)
      setTotalPages(response.pagination.totalPages)
      setHasMore(response.pagination.hasMore)
      
      // 如果是第一页，重置累计数据
      if (targetPage === 1) {
        setAllItems(response.items)
      }
    } catch (err: any) {
      setError(err.message || '加载数据失败')
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn, params, pageSize])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const nextPage = page + 1
      const response = await fetchFn({
        ...params,
        page: nextPage,
        pageSize,
      })
      
      setItems(response.items)
      setAllItems(prev => [...prev, ...response.items])
      setPage(response.pagination.page)
      setTotal(response.pagination.total)
      setTotalPages(response.pagination.totalPages)
      setHasMore(response.pagination.hasMore)
    } catch (err: any) {
      setError(err.message || '加载更多失败')
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn, params, pageSize, page, isLoading, hasMore])

  const refresh = useCallback(async () => {
    await loadPage(1)
  }, [loadPage])

  const setParams = useCallback((newParams: Omit<PaginationParams, 'page' | 'pageSize'>) => {
    setParamsState(newParams)
    setPage(1)
    setAllItems([])
  }, [])

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPage(1)
    setAllItems([])
  }, [])

  const reset = useCallback(() => {
    setItems([])
    setAllItems([])
    setPage(1)
    setTotal(0)
    setTotalPages(0)
    setHasMore(false)
    setError(null)
    setParamsState(initialParams)
  }, [initialParams])

  const pagination = useMemo(() => ({
    page,
    pageSize,
    total,
    totalPages,
    hasMore,
  }), [page, pageSize, total, totalPages, hasMore])

  return {
    items,
    allItems,
    isLoading,
    error,
    pagination,
    loadPage,
    loadMore,
    refresh,
    setParams,
    setPageSize,
    reset,
  }
}
