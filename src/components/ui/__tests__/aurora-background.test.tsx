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

  it('renders the restored visible beam layer when wallpaper mode is disabled', () => {
    const { getByTestId } = render(
      <AuroraBackground showBeams>
        <span>page content</span>
      </AuroraBackground>,
    )

    expect(getByTestId('aurora-background').getAttribute('data-transparent')).toBe('false')
    expect(getByTestId('aurora-background').getAttribute('data-animation-profile')).toBe('restored')
    expect(getByTestId('aurora-decorations')).toBeTruthy()
    expect(getByTestId('background-beams')).toBeTruthy()
    expect(Number(getByTestId('aurora-beam-layer').style.opacity)).toBeGreaterThanOrEqual(0.8)
    expect(getByTestId('aurora-beam-layer').className).toContain('z-[2]')
  })
})
