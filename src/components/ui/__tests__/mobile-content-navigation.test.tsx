/** @vitest-environment jsdom */

import React from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobileContentNavigation } from '../mobile-content-navigation'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'zh-CN' },
  }),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
      delete domProps.whileTap
      return React.createElement(tag, domProps, children)
    },
  }),
}))

vi.mock('../../IconRenderer', () => ({
  IconRenderer: () => <span aria-hidden="true" />,
}))

const categories = [
  {
    id: 'dev',
    name: '开发',
    icon: 'Code',
    color: '#667eea',
    orderIndex: 0,
    count: 2,
  },
]

const baseProps = {
  categories,
  tags: [{ name: 'Docker', count: 2 }],
  pinnedCount: 1,
  totalBookmarks: 3,
  activeTag: null,
  activeCollection: 'all',
  readLaterCount: 1,
  collectionFilterMode: true,
  matchedCount: 3,
  onSelectTag: vi.fn(),
  onSelectCategory: vi.fn(),
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('MobileContentNavigation', () => {
  it('shows sparse collections and reports a read-later selection', () => {
    const onSelectCategory = vi.fn()
    const { getByRole } = render(
      <MobileContentNavigation {...baseProps} onSelectCategory={onSelectCategory} />,
    )

    fireEvent.click(getByRole('button', { name: '打开分类和标签导航' }))
    fireEvent.click(getByRole('button', { name: /稍后阅读.*1/ }))

    expect(onSelectCategory).toHaveBeenCalledWith('read-later')
  })

  it('shows the active collection summary and clears it through all bookmarks', () => {
    const onSelectCategory = vi.fn()
    const { getAllByRole, getByRole, getByText } = render(
      <MobileContentNavigation
        {...baseProps}
        activeCollection="dev"
        onSelectCategory={onSelectCategory}
      />,
    )

    fireEvent.click(getByRole('button', { name: '打开分类和标签导航' }))
    expect(getByText('当前筛选：开发')).toBeTruthy()

    const allBookmarksButtons = getAllByRole('button', { name: /全部书签.*3/ })
    fireEvent.click(allBookmarksButtons[0])

    expect(onSelectCategory).toHaveBeenCalledWith('all')
  })

  it('keeps sparse-only collection controls hidden in dense bookshelf mode', () => {
    const { getByRole, queryByRole } = render(
      <MobileContentNavigation {...baseProps} collectionFilterMode={false} />,
    )

    fireEvent.click(getByRole('button', { name: '打开分类和标签导航' }))
    expect(queryByRole('button', { name: /稍后阅读/ })).toBeNull()
    expect(queryByRole('button', { name: /全部书签.*3/ })).toBeNull()
    expect(getByRole('button', { name: /开发.*2/ })).toBeTruthy()
  })

  it('reports tag choices without maintaining a second filter state', () => {
    const onSelectTag = vi.fn()
    const { getByRole } = render(
      <MobileContentNavigation {...baseProps} onSelectTag={onSelectTag} />,
    )

    fireEvent.click(getByRole('button', { name: '打开分类和标签导航' }))
    fireEvent.click(getByRole('button', { name: '标签' }))
    fireEvent.click(getByRole('button', { name: /#Docker.*2/ }))

    expect(onSelectTag).toHaveBeenCalledWith('Docker')
  })
})
