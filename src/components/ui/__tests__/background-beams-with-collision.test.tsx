/** @vitest-environment jsdom */

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BackgroundBeamsWithCollision } from '../background-beams-with-collision'

afterEach(cleanup)

describe('BackgroundBeamsWithCollision', () => {
  it('renders eight full-width beams on desktop', () => {
    const { getByTestId, getAllByTestId } = render(
      <BackgroundBeamsWithCollision isDark isMobile={false} />,
    )

    expect(getByTestId('background-beams').getAttribute('data-beam-count')).toBe('8')
    expect(getAllByTestId('beam-streak')).toHaveLength(8)
  })

  it('keeps three visible beams on mobile', () => {
    const { getByTestId, getAllByTestId } = render(
      <BackgroundBeamsWithCollision isDark={false} isMobile />,
    )

    expect(getByTestId('background-beams').getAttribute('data-beam-count')).toBe('3')
    expect(getAllByTestId('beam-streak')).toHaveLength(3)
  })

  it('uses the restored animation profile even when the legacy reducedMotion prop is present', () => {
    const { getByTestId } = render(
      <BackgroundBeamsWithCollision reducedMotion />,
    )

    expect(getByTestId('background-beams').getAttribute('data-animation-profile')).toBe('restored')
  })
})
