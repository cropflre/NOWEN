/** @vitest-environment jsdom */

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Meteors } from '../effects'

afterEach(cleanup)

describe('Meteors', () => {
  it('renders the requested prominent meteor trails', () => {
    const { getByTestId, getAllByTestId } = render(<Meteors number={4} />)

    expect(getByTestId('meteor-layer').getAttribute('data-meteor-count')).toBe('4')
    expect(getAllByTestId('meteor-streak')).toHaveLength(4)
  })

  it('caps meteor density to keep the page readable', () => {
    const { getByTestId, getAllByTestId } = render(<Meteors number={20} />)

    expect(getByTestId('meteor-layer').getAttribute('data-meteor-count')).toBe('6')
    expect(getAllByTestId('meteor-streak')).toHaveLength(6)
  })
})
