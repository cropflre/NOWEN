import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../hooks/usePagination'
import type { PaginatedResponse } from '../lib/api'

// Mock 数据
const createMockResponse = (page: number, totalPages: number = 3): PaginatedResponse<{ id: string; name: string }> => ({
  items: Array.from({ length: 5 }, (_, i) => ({
    id: `item-${page}-${i}`,
    name: `Item ${page}-${i}`,
  })),
  pagination: {
    page,
    pageSize: 5,
    total: 15,
    totalPages,
    hasMore: page < totalPages,
  },
})

describe('usePagination', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确初始化状态', () => {
    const { result } = renderHook(() =>
      usePagination({
        fetchFn: mockFetch,
        initialPageSize: 10,
      })
    )

    expect(result.current.items).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.pagination.page).toBe(1)
    expect(result.current.pagination.pageSize).toBe(10)
  })

  it('应该正确加载第一页', async () => {
    const mockResponse = createMockResponse(1)
    mockFetch.mockResolvedValue(mockResponse)

    const { result } = renderHook(() =>
      usePagination({
        fetchFn: mockFetch,
        initialPageSize: 5,
      })
    )

    await act(async () => {
      await result.current.loadPage(1)
    })

    expect(result.current.items).toEqual(mockResponse.items)
    expect(result.current.pagination.page).toBe(1)
    expect(result.current.pagination.total).toBe(15)
    expect(result.current.pagination.hasMore).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith({ page: 1, pageSize: 5 })
  })

  it('应该正确加载更多数据', async () => {
    const mockResponse1 = createMockResponse(1)
    const mockResponse2 = createMockResponse(2)
    mockFetch
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2)

    const { result } = renderHook(() =>
      usePagination({
        fetchFn: mockFetch,
        initialPageSize: 5,
      })
    )

    await act(async () => {
      await result.current.loadPage(1)
    })

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.pagination.page).toBe(2)
    expect(result.current.allItems.length).toBe(10) // 两页共10条
  })

  it('应该在没有更多数据时不加载', async () => {
    const mockResponse = createMockResponse(3, 3) // 最后一页
    mockFetch.mockResolvedValue(mockResponse)

    const { result } = renderHook(() =>
      usePagination({
        fetchFn: mockFetch,
      })
    )

    await act(async () => {
      await result.current.loadPage(3)
    })

    const callCount = mockFetch.mock.calls.length

    await act(async () => {
      await result.current.loadMore()
    })

    // loadMore 应该不会调用 fetchFn
    expect(mockFetch).toHaveBeenCalledTimes(callCount)
  })

  it('应该正确处理错误', async () => {
    mockFetch.mockRejectedValue(new Error('加载失败'))

    const { result } = renderHook(() =>
      usePagination({
        fetchFn: mockFetch,
      })
    )

    await act(async () => {
      await result.current.loadPage(1)
    })

    expect(result.current.error).toBe('加载失败')
    expect(result.current.items).toEqual([])
  })

  it('应该正确刷新数据', async () => {
    const mockResponse = createMockResponse(1)
    mockFetch.mockResolvedValue(mockResponse)

    const { result } = renderHook(() =>
      usePagination({
        fetchFn: mockFetch,
      })
    )

    await act(async () => {
      await result.current.refresh()
    })

    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
  })

  it('应该正确重置状态', async () => {
    const mockResponse = createMockResponse(1)
    mockFetch.mockResolvedValue(mockResponse)

    const { result } = renderHook(() =>
      usePagination({
        fetchFn: mockFetch,
      })
    )

    await act(async () => {
      await result.current.loadPage(1)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.items).toEqual([])
    expect(result.current.pagination.page).toBe(1)
    expect(result.current.pagination.total).toBe(0)
  })

  it('应该正确设置参数', async () => {
    const mockResponse = createMockResponse(1)
    mockFetch.mockResolvedValue(mockResponse)

    const { result } = renderHook(() =>
      usePagination({
        fetchFn: mockFetch,
      })
    )

    act(() => {
      result.current.setParams({ search: 'test', category: 'cat1' })
    })

    await act(async () => {
      await result.current.loadPage(1)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test',
        category: 'cat1',
        page: 1,
      })
    )
  })

  it('应该正确设置每页大小', async () => {
    const mockResponse = createMockResponse(1)
    mockFetch.mockResolvedValue(mockResponse)

    const { result } = renderHook(() =>
      usePagination({
        fetchFn: mockFetch,
        initialPageSize: 10,
      })
    )

    act(() => {
      result.current.setPageSize(20)
    })

    await act(async () => {
      await result.current.loadPage(1)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 20 })
    )
  })
})
