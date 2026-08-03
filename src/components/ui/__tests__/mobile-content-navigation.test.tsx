/** @vitest-environment jsdom */

import React from 'react'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  matchedCount: 3,
  onSelectTag: vi.fn(),
  onSelectCategory: vi.fn(),
}

beforeEach(() => {
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  cleanup()
  document.querySelector('[data-ambient-sparse-stage="true"]')?.remove()
  vi.clearAllMocks()
})

function addSparseStage() {
  const stage = document.createElement('section')
  stage.dataset.ambientSparseStage = 'true'
  stage.dataset.pinnedCount = '1'
  stage.dataset.readLaterCount = '1'
  document.body.appendChild(stage)
}

describe('MobileContentNavigation', () => {
  it('shows sparse collections and persists a read-later selection', async () => {
    addSparseStage()
    const onSelectCategory = vi.fn()
    const { getByRole } = render(
      <MobileContentNavigation {...baseProps} onSelectCategory={onSelectCategory} />,
    )

    fireEvent.click(getByRole('button', { name: '打开分类和标签导航' }))
    fireEvent.click(getByRole('button', { name: /稍后阅读.*1/ }))

    expect(onSelectCategory).toHaveBeenCalledWith('read-later')
    await waitFor(() => {
      expect(window.location.search).toBe('?collection=read-later')
    })
  })

  it('clears a collection when the mobile user chooses all bookmarks', async () => {
    addSparseStage()
    window.history.replaceState({}, '', '/?collection=dev')
    const onSelectTag = vi.fn()
    const { getAllByRole, getByRole } = render(
      <MobileContentNavigation {...baseProps} onSelectTag={onSelectTag} />,
    )

    fireEvent.click(getByRole('button', { name: '打开分类和标签导航' }))
    fireEvent.click(getByRole('button', { name: '标签' }))
    const allBookmarksButtons = getAllByRole('button', { name: /全部书签.*3/ })
    fireEvent.click(allBookmarksButtons[allBookmarksButtons.length - 1])

    expect(onSelectTag).toHaveBeenCalledWith(null)
    await waitFor(() => {
      expect(window.location.search).toBe('')
    })
  })

  it('keeps sparse-only collection controls hidden in the dense bookshelf mode', () => {
    const { getByRole, queryByRole } = render(
      <MobileContentNavigation {...baseProps} />,
    )

    fireEvent.click(getByRole('button', { name: '打开分类和标签导航' }))
    expect(queryByRole('button', { name: /稍后阅读/ })).toBeNull()
    expect(queryByRole('button', { name: /全部书签.*3/ })).toBeNull()
    expect(getByRole('button', { name: /开发.*2/ })).toBeTruthy()
  })
})
