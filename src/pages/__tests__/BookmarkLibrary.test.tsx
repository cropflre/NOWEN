/** @vitest-environment jsdom */

import React from 'react'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bookmark, Category } from '../../types/bookmark'
import { BookmarkLibrary } from '../BookmarkLibrary'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback || _key,
  }),
}))

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, tag: string) => ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => {
      const domProps = { ...props }
      delete domProps.initial
      delete domProps.animate
      delete domProps.exit
      delete domProps.transition
      delete domProps.layout
      return React.createElement(tag, domProps, children)
    },
  }),
}))

vi.mock('../../components/ui/spotlight-card', () => ({
  SpotlightCard: ({ children, onClick, onContextMenu, className, ariaLabel }: {
    children: React.ReactNode
    onClick?: () => void
    onContextMenu?: React.MouseEventHandler<HTMLDivElement>
    className?: string
    ariaLabel?: string
  }) => (
    <div
      role={onClick ? 'link' : undefined}
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {children}
    </div>
  ),
}))

vi.mock('../../components/IconRenderer', () => ({
  IconRenderer: () => <span aria-hidden="true" />,
}))

vi.mock('../../lib/api', () => ({
  visitsApi: { track: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('../../hooks/useNetworkEnv', () => ({
  getBookmarkUrl: (bookmark: Bookmark) => bookmark.url,
}))

const categories: Category[] = [
  { id: 'dev', name: '开发', icon: 'Code', color: '#667eea', orderIndex: 0 },
  { id: 'tools', name: '工具', icon: 'Wrench', color: '#38bdf8', orderIndex: 1 },
]

const bookmarks: Bookmark[] = [
  {
    id: 'github',
    url: 'https://github.com',
    title: 'GitHub',
    description: '代码托管平台',
    category: 'dev',
    tags: ['开发', 'Git'],
    isPinned: true,
    orderIndex: 0,
    createdAt: 1,
    updatedAt: 3,
  },
  {
    id: 'docker',
    url: 'https://docker.com',
    title: 'Docker',
    description: '容器工具',
    category: 'tools',
    tags: ['Docker'],
    isReadLater: true,
    isRead: false,
    orderIndex: 1,
    createdAt: 1,
    updatedAt: 2,
  },
  {
    id: 'vite',
    url: 'https://vite.dev',
    title: 'Vite',
    category: 'dev',
    tags: ['开发'],
    orderIndex: 2,
    createdAt: 1,
    updatedAt: 1,
  },
]

const baseProps = {
  bookmarks,
  categories,
  activeTag: null,
  activeCollection: 'all',
  isInternal: false,
  isLoggedIn: true,
  onBack: vi.fn(),
  onOpenSearch: vi.fn(),
  onAddBookmark: vi.fn(),
  onSelectTag: vi.fn(),
  onSelectCollection: vi.fn(),
  onContextMenu: vi.fn(),
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('BookmarkLibrary', () => {
  it('renders the complete library and filters by the selected collection', () => {
    const { getByRole, queryByRole, rerender } = render(
      <BookmarkLibrary {...baseProps} />,
    )

    expect(getByRole('heading', { name: 'GitHub' })).toBeTruthy()
    expect(getByRole('heading', { name: 'Docker' })).toBeTruthy()
    expect(getByRole('heading', { name: 'Vite' })).toBeTruthy()

    rerender(<BookmarkLibrary {...baseProps} activeCollection="pinned" />)
    expect(getByRole('heading', { name: 'GitHub' })).toBeTruthy()
    expect(queryByRole('heading', { name: 'Docker' })).toBeNull()
    expect(queryByRole('heading', { name: 'Vite' })).toBeNull()
  })

  it('searches across titles, descriptions, categories and tags', async () => {
    const { getByRole, queryByRole } = render(<BookmarkLibrary {...baseProps} />)

    fireEvent.change(
      getByRole('textbox', { name: '搜索标题、网址、分类或标签' }),
      { target: { value: '容器' } },
    )
    await waitFor(() => {
      expect(getByRole('heading', { name: 'Docker' })).toBeTruthy()
      expect(queryByRole('heading', { name: 'GitHub' })).toBeNull()
    })

    fireEvent.change(
      getByRole('textbox', { name: '搜索标题、网址、分类或标签' }),
      { target: { value: '开发' } },
    )
    await waitFor(() => {
      expect(getByRole('heading', { name: 'GitHub' })).toBeTruthy()
      expect(getByRole('heading', { name: 'Vite' })).toBeTruthy()
    })
  })

  it('reports collection and tag selections to the single state owner', () => {
    const onSelectCollection = vi.fn()
    const onSelectTag = vi.fn()
    const { getAllByRole, getByRole } = render(
      <BookmarkLibrary
        {...baseProps}
        onSelectCollection={onSelectCollection}
        onSelectTag={onSelectTag}
      />,
    )

    fireEvent.click(getAllByRole('button', { name: /工具.*1/ })[0])
    expect(onSelectCollection).toHaveBeenCalledWith('tools')

    fireEvent.click(getByRole('button', { name: /#Docker.*1/ }))
    expect(onSelectTag).toHaveBeenCalledWith('Docker')
  })

  it('clears only the active top-level filter and avoids duplicate history mutations', () => {
    const onSelectCollection = vi.fn()
    const onSelectTag = vi.fn()
    const { getByRole, rerender } = render(
      <BookmarkLibrary
        {...baseProps}
        activeCollection="dev"
        onSelectCollection={onSelectCollection}
        onSelectTag={onSelectTag}
      />,
    )

    fireEvent.click(getByRole('button', { name: '清除筛选' }))
    expect(onSelectCollection).toHaveBeenCalledWith('all')
    expect(onSelectTag).not.toHaveBeenCalled()

    vi.clearAllMocks()
    rerender(
      <BookmarkLibrary
        {...baseProps}
        activeTag="开发"
        onSelectCollection={onSelectCollection}
        onSelectTag={onSelectTag}
      />,
    )
    fireEvent.click(getByRole('button', { name: '清除筛选' }))
    expect(onSelectTag).toHaveBeenCalledWith(null)
    expect(onSelectCollection).not.toHaveBeenCalled()
  })

  it('persists the preferred list view', async () => {
    const { getByTitle } = render(<BookmarkLibrary {...baseProps} />)
    fireEvent.click(getByTitle('列表视图'))

    await waitFor(() => {
      expect(window.localStorage.getItem('nowen-library-view-v1')).toBe('list')
    })
  })
})
