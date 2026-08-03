/** @vitest-environment jsdom */

import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SpotlightCard } from '../spotlight-card'

function auxiliaryClick(element: Element, button: number) {
  return fireEvent(
    element,
    new MouseEvent('auxclick', {
      bubbles: true,
      cancelable: true,
      button,
    }),
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('SpotlightCard interactions', () => {
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

    auxiliaryClick(card!, 1)

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

  it.each([false, true])(
    'opens from card content even when the sortable ancestor has role=button (lightweight=%s)',
    (lightweight) => {
      const onClick = vi.fn()
      const { getByText } = render(
        <div role="button" aria-label="Sortable bookmark">
          <SpotlightCard
            lightweight={lightweight}
            onClick={onClick}
            onContextMenu={() => undefined}
          >
            <div>
              <span>Bookmark title</span>
              <p>Bookmark description</p>
            </div>
          </SpotlightCard>
        </div>,
      )

      auxiliaryClick(getByText('Bookmark title'), 1)

      expect(onClick).toHaveBeenCalledTimes(1)
    },
  )

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

    auxiliaryClick(getByRole('button', { name: 'Pin bookmark' }), 1)

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

    auxiliaryClick(card!, 2)
    auxiliaryClick(card!, 1)

    expect(onClick).not.toHaveBeenCalled()
  })

  it.each(['Enter', ' '])('opens a focused card with the %s key', (key) => {
    const onClick = vi.fn()
    const { getByRole } = render(
      <SpotlightCard lightweight onClick={onClick} ariaLabel="Open bookmark">
        <span>Bookmark</span>
      </SpotlightCard>,
    )

    const card = getByRole('link', { name: 'Open bookmark' })
    expect(card.getAttribute('tabindex')).toBe('0')

    fireEvent.keyDown(card, { key })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not let a nested button keyboard event trigger the card', () => {
    const onClick = vi.fn()
    const { getByRole } = render(
      <SpotlightCard lightweight onClick={onClick}>
        <button type="button">Pin bookmark</button>
      </SpotlightCard>,
    )

    fireEvent.keyDown(getByRole('button', { name: 'Pin bookmark' }), { key: 'Enter' })
    expect(onClick).not.toHaveBeenCalled()
  })
})
