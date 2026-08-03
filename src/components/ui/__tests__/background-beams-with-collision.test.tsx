/** @vitest-environment jsdom */

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BackgroundBeamsWithCollision } from '../background-beams-with-collision'

afterEach(cleanup)

describe('BackgroundBeamsWithCollision', () => {
  it('renders six balanced beams on desktop', () => {
    const { getByTestId } = render(
      <BackgroundBeamsWithCollision isDark isMobile={false} />,
    )

    expect(getByTestId('background-beams').getAttribute('data-beam-count')).toBe('6')
  })

  it('keeps two low-load beams on mobile', () => {
    const { getByTestId } = render(
      <BackgroundBeamsWithCollision isDark={false} isMobile />,
    )

    expect(getByTestId('background-beams').getAttribute('data-beam-count')).toBe('2')
  })

  it('renders no animated layer when reduced motion is requested', () => {
    const { queryByTestId } = render(
      <BackgroundBeamsWithCollision reducedMotion />,
    )

    expect(queryByTestId('background-beams')).toBeNull()
  })
})
