interface DevelopmentApiOverridesOptions {
  disableDockerMonitor: boolean
}

const DOCKER_LIST_PATH = '/api/system/docker'
let installed = false

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) return init.method.toUpperCase()
  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.method.toUpperCase()
  }
  return 'GET'
}

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

function isDockerListRequest(input: RequestInfo | URL, init?: RequestInit) {
  if (getRequestMethod(input, init) !== 'GET') return false

  try {
    const url = new URL(getRequestUrl(input), window.location.origin)
    return url.pathname === DOCKER_LIST_PATH
  } catch {
    return false
  }
}

/**
 * Local Windows development commonly runs without Docker Desktop. In that
 * environment the process-matrix widget used to poll the Docker endpoint every
 * five seconds, causing the server to execute a missing `docker` CLI command
 * and print a full error stack repeatedly.
 *
 * Keep production/NAS behavior untouched. The development launcher explicitly
 * opts into this override only when Docker monitoring is disabled.
 */
export function installDevelopmentApiOverrides({
  disableDockerMonitor,
}: DevelopmentApiOverridesOptions) {
  if (!disableDockerMonitor || installed || typeof window === 'undefined') return

  const originalFetch = window.fetch.bind(window)

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (isDockerListRequest(input, init)) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: [],
            cached: true,
            source: 'development-disabled',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
    }

    return originalFetch(input, init)
  }) as typeof window.fetch

  installed = true
}

export function resetDevelopmentApiOverridesForTests() {
  installed = false
}
