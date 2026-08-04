/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BentoGrid, BentoGridItem } from '../bento-grid'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('BentoGrid system workspace', () => {
  it('separates monitoring modules from pinned bookmark shortcuts', () => {
    render(
      <BentoGrid>
        <BentoGridItem key="system-monitor">
          <span>CPU monitor</span>
        </BentoGridItem>
        <BentoGridItem key="network-telemetry">
          <span>Network monitor</span>
        </BentoGridItem>
        <BentoGridItem key="bookmark-bbc">
          <span>BBC bookmark</span>
        </BentoGridItem>
      </BentoGrid>,
    )

    expect(screen.getByTestId('system-workspace-stack')).toBeTruthy()
    expect(screen.getByText('系统工作台')).toBeTruthy()
    expect(screen.getByText('常用入口')).toBeTruthy()
    expect(screen.getByText('BBC bookmark')).toBeTruthy()
    expect(screen.queryByText('CPU monitor')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /展开详情/ }))

    expect(screen.getByText('CPU monitor')).toBeTruthy()
    expect(screen.getByText('Network monitor')).toBeTruthy()
    expect(document.querySelector('[data-workspace-role="system-monitor"]')).toBeTruthy()
    expect(document.querySelector('[data-workspace-role="network-telemetry"]')).toBeTruthy()
  })

  it('persists the detail-panel preference', () => {
    const { unmount } = render(
      <BentoGrid>
        <BentoGridItem key="process-matrix">
          <span>Service monitor</span>
        </BentoGridItem>
      </BentoGrid>,
    )

    fireEvent.click(screen.getByRole('button', { name: /展开详情/ }))
    expect(localStorage.getItem('nowen-system-workspace-collapsed-v1')).toBe('false')
    unmount()

    render(
      <BentoGrid>
        <BentoGridItem key="process-matrix">
          <span>Service monitor</span>
        </BentoGridItem>
      </BentoGrid>,
    )

    expect(screen.getByText('Service monitor')).toBeTruthy()
    expect(screen.getByRole('button', { name: /收起详情/ })).toBeTruthy()
  })

  it('keeps the original grid when no monitoring widgets are present', () => {
    const { container } = render(
      <BentoGrid className="bookmark-grid">
        <BentoGridItem key="bookmark-one">
          <span>Bookmark one</span>
        </BentoGridItem>
      </BentoGrid>,
    )

    expect(screen.queryByText('系统工作台')).toBeNull()
    expect(container.querySelector('.bookmark-grid')).toBeTruthy()
    expect(screen.getByText('Bookmark one')).toBeTruthy()
  })
})
