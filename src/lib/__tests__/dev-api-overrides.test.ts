import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  installDevelopmentApiOverrides,
  resetDevelopmentApiOverridesForTests,
} from '../dev-api-overrides'

const originalFetch = window.fetch

beforeEach(() => {
  resetDevelopmentApiOverridesForTests()
})

afterEach(() => {
  window.fetch = originalFetch
  resetDevelopmentApiOverridesForTests()
  vi.restoreAllMocks()
})

describe('installDevelopmentApiOverrides', () => {
  it('returns an empty Docker list without contacting the API when disabled', async () => {
    const fallbackFetch = vi.fn<typeof window.fetch>()
    window.fetch = fallbackFetch

    installDevelopmentApiOverrides({ disableDockerMonitor: true })

    const response = await window.fetch('/api/system/docker')
    const payload = await response.json()

    expect(fallbackFetch).not.toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(payload).toEqual({
      success: true,
      data: [],
      cached: true,
      source: 'development-disabled',
    })
  })

  it('keeps non-Docker requests on the original fetch implementation', async () => {
    const expectedResponse = new Response(JSON.stringify({ success: true }))
    const fallbackFetch = vi.fn<typeof window.fetch>().mockResolvedValue(expectedResponse)
    window.fetch = fallbackFetch

    installDevelopmentApiOverrides({ disableDockerMonitor: true })

    const response = await window.fetch('/api/system/static')

    expect(response).toBe(expectedResponse)
    expect(fallbackFetch).toHaveBeenCalledWith('/api/system/static', undefined)
  })

  it('does not install the override when Docker monitoring is enabled', async () => {
    const expectedResponse = new Response(JSON.stringify({ success: true, data: ['docker'] }))
    const fallbackFetch = vi.fn<typeof window.fetch>().mockResolvedValue(expectedResponse)
    window.fetch = fallbackFetch

    installDevelopmentApiOverrides({ disableDockerMonitor: false })

    const response = await window.fetch('/api/system/docker')

    expect(response).toBe(expectedResponse)
    expect(fallbackFetch).toHaveBeenCalledWith('/api/system/docker')
  })

  it('does not intercept Docker mutation requests', async () => {
    const expectedResponse = new Response(JSON.stringify({ success: true }))
    const fallbackFetch = vi.fn<typeof window.fetch>().mockResolvedValue(expectedResponse)
    window.fetch = fallbackFetch

    installDevelopmentApiOverrides({ disableDockerMonitor: true })

    const response = await window.fetch('/api/system/docker/example/start', {
      method: 'POST',
    })

    expect(response).toBe(expectedResponse)
    expect(fallbackFetch).toHaveBeenCalledWith('/api/system/docker/example/start', {
      method: 'POST',
    })
  })
})
