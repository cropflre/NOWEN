/** @vitest-environment jsdom */

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useHashRouter } from '../useHashRouter'

beforeEach(() => {
  window.history.replaceState({}, '', '/')
  window.location.hash = ''
})

afterEach(() => {
  cleanup()
})

describe('useHashRouter library route', () => {
  it('restores a directly opened library hash', () => {
    window.location.hash = '#/library'
    const { result } = renderHook(() => useHashRouter())
    expect(result.current.page).toBe('library')
  })

  it('navigates between the ambient home and the resource library', () => {
    const { result } = renderHook(() => useHashRouter())

    act(() => result.current.navigateTo('library'))
    expect(result.current.page).toBe('library')
    expect(window.location.hash).toBe('#/library')

    act(() => result.current.navigateTo('home'))
    expect(result.current.page).toBe('home')
    expect(window.location.hash).toBe('')
  })

  it('falls back to home for an unknown hash', () => {
    window.location.hash = '#/unknown-page'
    const { result } = renderHook(() => useHashRouter())
    expect(result.current.page).toBe('home')
  })
})
