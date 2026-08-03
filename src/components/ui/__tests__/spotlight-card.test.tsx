/** @vitest-environment jsdom */

import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SpotlightCard } from '../spotlight-card'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('SpotlightCard middle click', () => {
  it('runs the bookmark action on middle click and keeps focus on the current page', () => {
    const onClick = vi.fn()
    const focusSpy = vi.spyOn(window, 'focus').mockImplementation(() => undefined)
    const { container } = render(
      <SpotlightCard
        className="test-card"
        onClick={onClick}
        onContextMenu={() => undefined}
      >
        <span>Bookmark</span>
      </SpotlightCard>,
    )

    const card = container.querySelector<HTMLElement>('.test-card')
    expect(card).toBeTruthy()

    fireEvent.auxClick(card!, { button: 1 })

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(focusSpy).toHaveBeenCalledTimes(1)
  })

  it('prevents middle-button auto-scroll before opening the bookmark', () => {
    const { container } = render(
      <SpotlightCard
        className="test-card"
        lightweight
        onClick={() => undefined}
        onContextMenu={() => undefined}
      >
        <span>Bookmark</span>
      </SpotlightCard>,
    )

    const card = container.querySelector<HTMLElement>('.test-card')
    expect(card).toBeTruthy()
    expect(fireEvent.mouseDown(card!, { button: 1 })).toBe(false)
  })

  it('does not open the bookmark when middle-clicking a nested action', () => {
    const onClick = vi.fn()
    const { getByRole } = render(
      <SpotlightCard
        lightweight
        onClick={onClick}
        onContextMenu={() => undefined}
      >
        <button type="button">Pin bookmark</button>
      </SpotlightCard>,
    )

    fireEvent.auxClick(getByRole('button', { name: 'Pin bookmark' }), { button: 1 })

    expect(onClick).not.toHaveBeenCalled()
  })

  it('ignores right-button auxiliary clicks and supports explicit opt-out', () => {
    const onClick = vi.fn()
    const { container } = render(
      <SpotlightCard
        className="test-card"
        lightweight
        onClick={onClick}
        onContextMenu={() => undefined}
        openOnMiddleClick={false}
      >
        <span>Bookmark</span>
      </SpotlightCard>,
    )

    const card = container.querySelector<HTMLElement>('.test-card')
    expect(card).toBeTruthy()

    fireEvent.auxClick(card!, { button: 2 })
    fireEvent.auxClick(card!, { button: 1 })

    expect(onClick).not.toHaveBeenCalled()
  })
})
