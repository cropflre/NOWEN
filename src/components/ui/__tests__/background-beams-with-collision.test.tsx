/** @vitest-environment jsdom */

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BackgroundBeamsWithCollision } from '../background-beams-with-collision'

afterEach(cleanup)

describe('BackgroundBeamsWithCollision', () => {
  it('renders eight full-width compositor beams on desktop', () => {
    const { getByTestId, getAllByTestId } = render(
      <BackgroundBeamsWithCollision isDark isMobile={false} />,
    )

    expect(getByTestId('background-beams').getAttribute('data-beam-count')).toBe('8')
    expect(getByTestId('background-beams').getAttribute('data-animation-profile')).toBe('compositor')
    expect(getAllByTestId('beam-streak')).toHaveLength(8)
  })

  it('keeps three visible compositor beams on mobile', () => {
    const { getByTestId, getAllByTestId } = render(
      <BackgroundBeamsWithCollision isDark={false} isMobile />,
    )

    expect(getByTestId('background-beams').getAttribute('data-beam-count')).toBe('3')
    expect(getAllByTestId('beam-streak')).toHaveLength(3)
  })

  it('keeps NOWEN animation settings as the source of truth for the legacy reducedMotion prop', () => {
    const { getByTestId } = render(
      <BackgroundBeamsWithCollision reducedMotion />,
    )

    expect(getByTestId('background-beams').getAttribute('data-animation-profile')).toBe('compositor')
  })

  it('can pause every beam without removing the visual layer', () => {
    const { getByTestId, getAllByTestId } = render(
      <BackgroundBeamsWithCollision paused />,
    )

    expect(getByTestId('background-beams').getAttribute('data-paused')).toBe('true')
    expect(getAllByTestId('beam-streak').every((beam) => beam.style.animationPlayState === 'paused')).toBe(true)
  })
})
