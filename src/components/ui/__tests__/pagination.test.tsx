/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildPaginationTokens, Pagination } from '../pagination'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en',
      resolvedLanguage: 'en',
    },
  }),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('buildPaginationTokens', () => {
  it('returns every page for short ranges', () => {
    expect(buildPaginationTokens(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps the current page centered for long ranges', () => {
    expect(buildPaginationTokens(6, 12)).toEqual([
      1,
      'ellipsis-start',
      5,
      6,
      7,
      'ellipsis-end',
      12,
    ])
  })

  it('expands the leading and trailing ranges near their boundaries', () => {
    expect(buildPaginationTokens(2, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 10])
    expect(buildPaginationTokens(9, 10)).toEqual([1, 'ellipsis-start', 6, 7, 8, 9, 10])
  })
})

describe('Pagination', () => {
  it('shows the visible item range and changes pages', () => {
    const onPageChange = vi.fn()

    render(
      <Pagination
        page={2}
        pageSize={10}
        total={95}
        onPageChange={onPageChange}
      />,
    )

    expect(screen.getByText('11–20 of 95')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('changes page size and keeps the active page accessible', () => {
    const onPageSizeChange = vi.fn()

    render(
      <Pagination
        page={3}
        pageSize={10}
        total={80}
        onPageChange={() => undefined}
        onPageSizeChange={onPageSizeChange}
      />,
    )

    expect(screen.getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBe('page')

    fireEvent.change(screen.getByRole('combobox', { name: 'Per page' }), {
      target: { value: '20' },
    })
    expect(onPageSizeChange).toHaveBeenCalledWith(20)
  })

  it('keeps the page-size selector visible after choosing a size that fits every item', () => {
    render(
      <Pagination
        page={1}
        pageSize={50}
        total={25}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Per page' })).toBeTruthy()
    expect(screen.getByText('1–25 of 25')).toBeTruthy()
  })

  it('does not render when every item fits the smallest available page', () => {
    const { container } = render(
      <Pagination
        page={1}
        pageSize={10}
        total={10}
        onPageChange={() => undefined}
      />,
    )

    expect(container.firstChild).toBeNull()
  })
})
