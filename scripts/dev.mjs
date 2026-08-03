import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = path.join(rootDir, 'server')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const isWindows = process.platform === 'win32'

function parsePort(value, fallback) {
  const port = Number.parseInt(value ?? '', 10)
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : fallback
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = createServer()

    tester.unref()
    tester.once('error', () => resolve(false))
    tester.listen({ host: '0.0.0.0', port, exclusive: true }, () => {
      tester.close(() => resolve(true))
    })
  })
}

async function findAvailablePort(preferredPort, excludedPorts = new Set()) {
  for (let port = preferredPort; port <= 65535; port += 1) {
    if (excludedPorts.has(port)) continue
    if (await isPortAvailable(port)) return port
  }

  throw new Error(`No available port found from ${preferredPort} to 65535`)
}

function describePort(name, preferredPort, selectedPort) {
  if (preferredPort === selectedPort) {
    console.log(`  ${name}: ${selectedPort}`)
    return
  }

  console.log(`  ${name}: ${preferredPort} is occupied, using ${selectedPort}`)
}

const preferredApiPort = parsePort(
  process.env.NOWEN_API_PORT ?? process.env.PORT,
  3001,
)
const preferredWebPort = parsePort(process.env.NOWEN_WEB_PORT, 5173)

const apiPort = await findAvailablePort(preferredApiPort)
const webPort = await findAvailablePort(preferredWebPort, new Set([apiPort]))
const apiUrl = `http://localhost:${apiPort}`
const webUrl = `http://localhost:${webPort}`

console.log('\n🚀 NOWEN development environment')
describePort('API', preferredApiPort, apiPort)
describePort('Web', preferredWebPort, webPort)
console.log(`\n  Open: ${webUrl}\n`)

const children = new Map()
let shuttingDown = false
let requestedExitCode = 0
let forceExitTimer

function stopProcess(child) {
  if (!child.pid || child.exitCode !== null) return

  if (isWindows) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }

  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    child.kill('SIGTERM')
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return

  shuttingDown = true
  requestedExitCode = exitCode
  console.log('\nStopping NOWEN development services...')

  for (const child of children.values()) {
    stopProcess(child)
  }

  forceExitTimer = setTimeout(() => {
    process.exit(requestedExitCode)
  }, 3000)
  forceExitTimer.unref()
}

function startService(name, args, options) {
  const child = spawn(npmCommand, args, {
    ...options,
    detached: !isWindows,
    shell: isWindows,
    stdio: 'inherit',
  })

  children.set(name, child)

  child.once('error', (error) => {
    console.error(`\n❌ Failed to start ${name}:`, error)
    shutdown(1)
  })

  child.once('exit', (code, signal) => {
    children.delete(name)

    if (!shuttingDown) {
      console.error(
        `\n❌ ${name} stopped unexpectedly (${signal ?? `exit code ${code ?? 1}`})`,
      )
      shutdown(code ?? 1)
      return
    }

    if (children.size === 0) {
      if (forceExitTimer) clearTimeout(forceExitTimer)
      process.exit(requestedExitCode)
    }
  })

  return child
}

startService('API server', ['run', 'dev'], {
  cwd: serverDir,
  env: {
    ...process.env,
    PORT: String(apiPort),
    DB_PATH:
      process.env.DB_PATH ??
      path.join(rootDir, 'server', 'data', 'zen-garden.db'),
  },
})

startService('Web client', ['run', 'dev:web', '--', '--port', String(webPort), '--strictPort'], {
  cwd: rootDir,
  env: {
    ...process.env,
    VITE_API_BASE: apiUrl,
  },
})

process.once('SIGINT', () => shutdown(0))
process.once('SIGTERM', () => shutdown(0))
