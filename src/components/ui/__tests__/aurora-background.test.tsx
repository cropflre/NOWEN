/** @vitest-environment jsdom */

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuroraBackground } from '../aurora-background'

vi.mock('../background-beams-with-collision', () => ({
  BackgroundBeamsWithCollision: () => <div data-testid="background-beams" />,
}))

afterEach(() => {
  cleanup()
  document.documentElement.classList.remove('dark')
  vi.restoreAllMocks()
})

describe('AuroraBackground wallpaper mode', () => {
  it('keeps content but removes every decorative background layer when transparent', () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <AuroraBackground transparent showBeams showRadialGradient>
        <span>page content</span>
      </AuroraBackground>,
    )

    expect(getByText('page content')).toBeTruthy()
    expect(getByTestId('aurora-background').getAttribute('data-transparent')).toBe('true')
    expect(queryByTestId('aurora-decorations')).toBeNull()
    expect(queryByTestId('background-beams')).toBeNull()
  })

  it('renders the visible compositor beam layer when wallpaper mode is disabled', () => {
    const { getByTestId } = render(
      <AuroraBackground showBeams>
        <span>page content</span>
      </AuroraBackground>,
    )

    expect(getByTestId('aurora-background').getAttribute('data-transparent')).toBe('false')
    expect(getByTestId('aurora-background').getAttribute('data-animation-profile')).toBe('compositor')
    expect(getByTestId('aurora-decorations')).toBeTruthy()
    expect(getByTestId('background-beams')).toBeTruthy()
    expect(Number(getByTestId('aurora-beam-layer').style.opacity)).toBeGreaterThanOrEqual(0.8)
    expect(getByTestId('aurora-beam-layer').className).toContain('z-[2]')
  })

  it('moves only the pointer glow element instead of invalidating the page root', () => {
    let scheduledFrame: FrameRequestCallback | null = null
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      scheduledFrame = callback
      return 1
    })

    const { container, getByTestId } = render(
      <AuroraBackground>
        <span>page content</span>
      </AuroraBackground>,
    )

    const root = getByTestId('aurora-background')
    const glow = container.querySelector<HTMLElement>('.nowen-pointer-glow')
    expect(glow).toBeTruthy()

    window.dispatchEvent(new MouseEvent('pointermove', {
      bubbles: true,
      clientX: 240,
      clientY: 160,
    }))
    scheduledFrame?.(0)

    expect(glow?.style.transform).toContain('translate3d(240px, 160px, 0)')
    expect(root.style.getPropertyValue('--mouse-x-px')).toBe('')
    expect(root.style.getPropertyValue('--mouse-y-px')).toBe('')
  })
})
