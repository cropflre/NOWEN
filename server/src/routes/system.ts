/**
 * System Stats Route - 系统感知接口
 * 提供 CPU、内存、磁盘、运行时间等关键 Vibe 指标
 * 
 * Docker 环境下通过挂载宿主机目录读取真实系统状态：
 * - /host: 宿主机根目录
 * - /host/proc: 宿主机 proc 文件系统
 * - /host/sys: 宿主机 sys 文件系统
 * 
 * 接口：
 * - GET /stats     - 简化指标（兼容旧版）
 * - GET /static    - 冷数据（硬件信息，启动时请求一次）
 * - GET /dynamic   - 热数据（实时状态，2-3秒刷新）
 */
import { Router } from 'express'
import si from 'systeminformation'

const router = Router()

// ============================================
// 工具函数
// ============================================

/**
 * 深度清洗对象：移除 null、undefined、空字符串
 * 扁平化处理，确保前端拿到干净数据
 */
function cleanObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj
      .map(item => cleanObject(item))
      .filter(item => item !== null && item !== undefined && item !== '') as T
  }
  
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const cleanedValue = cleanObject(value)
      // 保留 0 和 false，但过滤 null、undefined、空字符串
      if (cleanedValue !== null && cleanedValue !== undefined && cleanedValue !== '') {
        cleaned[key] = cleanedValue
      }
    }
    return cleaned as T
  }
  
  return obj
}

/**
 * 格式化字节为人类可读格式
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/**
 * 格式化运行时间为 "X天X小时X分钟"
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}分钟`)

  return parts.join('')
}

// ============================================
// 初始化
// ============================================

const initSystemInfo = () => {
  if (process.env.PROC_PATH) {
    console.log(`[SystemInfo] Using PROC_PATH: ${process.env.PROC_PATH}`)
  }
  if (process.env.SYS_PATH) {
    console.log(`[SystemInfo] Using SYS_PATH: ${process.env.SYS_PATH}`)
  }
  if (process.env.SI_FILESYSTEM_DISK_PREFIX) {
    console.log(`[SystemInfo] Using SI_FILESYSTEM_DISK_PREFIX: ${process.env.SI_FILESYSTEM_DISK_PREFIX}`)
  }
}

initSystemInfo()

// ============================================
// 缓存机制
// ============================================

interface CacheEntry<T> {
  data: T | null
  timestamp: number
}

// 冷数据缓存 - 长期有效（1小时）
let staticCache: CacheEntry<StaticSystemInfo> = { data: null, timestamp: 0 }
const STATIC_CACHE_TTL = 3600000 // 1小时

// 热数据缓存 - 短期有效（2秒）
let dynamicCache: CacheEntry<DynamicSystemInfo> = { data: null, timestamp: 0 }
const DYNAMIC_CACHE_TTL = 2000 // 2秒

// 简化指标缓存（兼容旧版）
let statsCache: CacheEntry<SystemStats> = { data: null, timestamp: 0 }
const STATS_CACHE_TTL = 5000 // 5秒

// ============================================
// 类型定义
// ============================================

interface SystemStats {
  cpuLoad: number
  memUsage: number
  diskUsage: number
  diskTotal: number
  diskFree: number
  uptime: string
  timestamp: number
}

interface StaticSystemInfo {
  cpu: {
    brand: string
    manufacturer: string
    speed: number
    speedMax: number
    cores: number
    physicalCores: number
    processors: number
    cache: {
      l1d: number
      l1i: number
      l2: number
      l3: number
    }
  }
  system: {
    manufacturer: string
    model: string
    version: string
    serial: string
    uuid: string
  }
  bios: {
    vendor: string
    version: string
    releaseDate: string
  }
  memory: {
    total: string
    slots: Array<{
      bank: string
      type: string
      size: string
      clockSpeed: number
      manufacturer: string
      partNum: string
    }>
  }
  disks: Array<{
    name: string
    type: string
    size: string
    vendor: string
    interfaceType: string
    serialNum: string
    smartStatus: string
  }>
  graphics: {
    controllers: Array<{
      vendor: string
      model: string
      vram: string
      bus: string
    }>
    displays: Array<{
      vendor: string
      model: string
      resolution: string
      currentResX: number
      currentResY: number
      connection: string
    }>
  }
  os: {
    platform: string
    distro: string
    release: string
    codename: string
    kernel: string
    arch: string
    hostname: string
  }
  timestamp: number
}

interface DynamicSystemInfo {
  cpu: {
    load: number
    loadUser: number
    loadSystem: number
    loadIdle: number
    temperature: number | null
    temperatureMax: number | null
    cores: Array<{
      load: number
      temperature: number | null
    }>
  }
  memory: {
    total: number
    used: number
    free: number
    available: number
    usagePercent: number
    swapTotal: number
    swapUsed: number
    swapFree: number
  }
  network: Array<{
    iface: string
    operstate: string
    ip4: string
    ip6: string
    rx_bytes: number
    tx_bytes: number
    rx_sec: number
    tx_sec: number
    rxFormatted: string
    txFormatted: string
    rxSpeedFormatted: string
    txSpeedFormatted: string
  }>
  filesystem: Array<{
    fs: string
    type: string
    mount: string
    size: number
    used: number
    available: number
    usePercent: number
    sizeFormatted: string
    usedFormatted: string
    availableFormatted: string
  }>
  docker: {
    running: number
    paused: number
    stopped: number
    containers: number
  } | null
  uptime: string
  timestamp: number
}

// ============================================
// GET /api/system/stats - 简化指标（兼容旧版）
// ============================================
router.get('/stats', async (_req, res) => {
  try {
    const now = Date.now()

    if (statsCache.data && now - statsCache.timestamp < STATS_CACHE_TTL) {
      return res.json({
        success: true,
        data: statsCache.data,
        cached: true,
      })
    }

    const [cpuLoad, mem, disk, time] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.time(),
    ])

    const diskPrefix = process.env.SI_FILESYSTEM_DISK_PREFIX || ''
    const targetDisk = disk.find((d) => d.mount === `${diskPrefix}/`) 
      || disk.find((d) => d.mount === '/') 
      || disk.reduce((max, d) => d.size > max.size ? d : max, disk[0])

    const diskTotalGB = targetDisk ? Math.round(targetDisk.size / (1024 * 1024 * 1024)) : 0
    const diskFreeGB = targetDisk ? Math.round((targetDisk.size - targetDisk.used) / (1024 * 1024 * 1024)) : 0

    const stats: SystemStats = {
      cpuLoad: Math.round(cpuLoad.currentLoad * 10) / 10,
      memUsage: Math.round((mem.used / mem.total) * 1000) / 10,
      diskUsage: targetDisk ? Math.round(targetDisk.use * 10) / 10 : 0,
      diskTotal: diskTotalGB,
      diskFree: diskFreeGB,
      uptime: formatUptime(time.uptime),
      timestamp: now,
    }

    statsCache = { data: stats, timestamp: now }

    res.json({
      success: true,
      data: stats,
      cached: false,
    })
  } catch (error) {
    console.error('Failed to get system stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system statistics',
    })
  }
})

// ============================================
// GET /api/system/static - 冷数据（硬件信息）
// 应用启动时请求一次，长期缓存
// ============================================
router.get('/static', async (_req, res) => {
  try {
    const now = Date.now()

    // 检查缓存
    if (staticCache.data && now - staticCache.timestamp < STATIC_CACHE_TTL) {
      return res.json({
        success: true,
        data: staticCache.data,
        cached: true,
      })
    }

    console.log('[SystemInfo] Fetching static hardware info...')

    // 并发获取所有硬件信息
    const [cpu, system, bios, memLayout, diskLayout, graphics, osInfo] = await Promise.all([
      si.cpu(),
      si.system(),
      si.bios(),
      si.memLayout(),
      si.diskLayout(),
      si.graphics(),
      si.osInfo(),
    ])

    // 计算内存总量
    const totalMemory = memLayout.reduce((sum, slot) => sum + (slot.size || 0), 0)

    const staticInfo: StaticSystemInfo = {
      cpu: {
        brand: cpu.brand,
        manufacturer: cpu.manufacturer,
        speed: cpu.speed,
        speedMax: cpu.speedMax,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        processors: cpu.processors,
        cache: {
          l1d: cpu.cache?.l1d || 0,
          l1i: cpu.cache?.l1i || 0,
          l2: cpu.cache?.l2 || 0,
          l3: cpu.cache?.l3 || 0,
        },
      },
      system: {
        manufacturer: system.manufacturer,
        model: system.model,
        version: system.version,
        serial: system.serial,
        uuid: system.uuid,
      },
      bios: {
        vendor: bios.vendor,
        version: bios.version,
        releaseDate: bios.releaseDate,
      },
      memory: {
        total: formatBytes(totalMemory),
        slots: memLayout.map(slot => ({
          bank: slot.bank,
          type: slot.type,
          size: formatBytes(slot.size || 0),
          clockSpeed: slot.clockSpeed || 0,
          manufacturer: slot.manufacturer,
          partNum: slot.partNum,
        })),
      },
      disks: diskLayout.map(disk => ({
        name: disk.name,
        type: disk.type,
        size: formatBytes(disk.size),
        vendor: disk.vendor,
        interfaceType: disk.interfaceType,
        serialNum: disk.serialNum,
        smartStatus: disk.smartStatus,
      })),
      graphics: {
        controllers: graphics.controllers.map(ctrl => ({
          vendor: ctrl.vendor,
          model: ctrl.model,
          vram: formatBytes(ctrl.vram || 0),
          bus: ctrl.bus,
        })),
        displays: graphics.displays.map(disp => ({
          vendor: disp.vendor,
          model: disp.model,
          resolution: `${disp.resolutionX}x${disp.resolutionY}`,
          currentResX: disp.currentResX,
          currentResY: disp.currentResY,
          connection: disp.connection,
        })),
      },
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        codename: osInfo.codename,
        kernel: osInfo.kernel,
        arch: osInfo.arch,
        hostname: osInfo.hostname,
      },
      timestamp: now,
    }

    // 清洗数据，移除空值
    const cleanedData = cleanObject(staticInfo)

    // 更新缓存
    staticCache = { data: cleanedData, timestamp: now }

    console.log('[SystemInfo] Static hardware info cached')

    res.json({
      success: true,
      data: cleanedData,
      cached: false,
    })
  } catch (error) {
    console.error('Failed to get static system info:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve hardware information',
    })
  }
})

// ============================================
// GET /api/system/dynamic - 热数据（实时状态）
// 心跳接口，2-3秒刷新一次
// ============================================
router.get('/dynamic', async (_req, res) => {
  try {
    const now = Date.now()

    // 检查缓存
    if (dynamicCache.data && now - dynamicCache.timestamp < DYNAMIC_CACHE_TTL) {
      return res.json({
        success: true,
        data: dynamicCache.data,
        cached: true,
      })
    }

    // 并发获取所有实时数据
    const [load, temp, mem, network, fs, docker, time] = await Promise.all([
      si.currentLoad(),
      si.cpuTemperature().catch(() => ({ main: null, max: null, cores: [] })),
      si.mem(),
      si.networkStats(),
      si.fsSize(),
      si.dockerInfo().catch(() => null),
      si.time(),
    ])

    // 过滤掉虚拟网络接口
    const physicalNetworks = network.filter(n => 
      !n.iface.startsWith('lo') && 
      !n.iface.startsWith('docker') &&
      !n.iface.startsWith('br-') &&
      !n.iface.startsWith('veth')
    )

    // 获取网络接口详细信息（包括 IP 地址）
    const networkInterfaces = await si.networkInterfaces()
    const interfaceMap = new Map<string, { ip4: string; ip6: string }>()
    for (const iface of networkInterfaces) {
      if (iface.ip4 || iface.ip6) {
        interfaceMap.set(iface.iface, {
          ip4: iface.ip4 || '',
          ip6: iface.ip6 || ''
        })
      }
    }

    // 过滤掉临时/虚拟文件系统
    const physicalFS = fs.filter(f => 
      !f.fs.startsWith('tmpfs') &&
      !f.fs.startsWith('overlay') &&
      !f.fs.startsWith('shm') &&
      f.size > 0
    )

    const dynamicInfo: DynamicSystemInfo = {
      cpu: {
        load: Math.round(load.currentLoad * 10) / 10,
        loadUser: Math.round(load.currentLoadUser * 10) / 10,
        loadSystem: Math.round(load.currentLoadSystem * 10) / 10,
        loadIdle: Math.round(load.currentLoadIdle * 10) / 10,
        temperature: temp.main !== null ? Math.round(temp.main * 10) / 10 : null,
        temperatureMax: temp.max !== null ? Math.round(temp.max * 10) / 10 : null,
        cores: load.cpus.map((cpu, i) => ({
          load: Math.round(cpu.load * 10) / 10,
          temperature: temp.cores && temp.cores[i] !== undefined 
            ? Math.round(temp.cores[i] * 10) / 10 
            : null,
        })),
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        available: mem.available,
        usagePercent: Math.round((mem.used / mem.total) * 1000) / 10,
        swapTotal: mem.swaptotal,
        swapUsed: mem.swapused,
        swapFree: mem.swapfree,
      },
      network: physicalNetworks.map(n => {
        const ifaceInfo = interfaceMap.get(n.iface)
        return {
          iface: n.iface,
          operstate: n.operstate,
          ip4: ifaceInfo?.ip4 || '',
          ip6: ifaceInfo?.ip6 || '',
          rx_bytes: n.rx_bytes,
          tx_bytes: n.tx_bytes,
          rx_sec: Math.round(n.rx_sec || 0),
          tx_sec: Math.round(n.tx_sec || 0),
          rxFormatted: formatBytes(n.rx_bytes),
          txFormatted: formatBytes(n.tx_bytes),
          rxSpeedFormatted: `${formatBytes(n.rx_sec || 0)}/s`,
          txSpeedFormatted: `${formatBytes(n.tx_sec || 0)}/s`,
        }
      }),
      filesystem: physicalFS.map(f => ({
        fs: f.fs,
        type: f.type,
        mount: f.mount,
        size: f.size,
        used: f.used,
        available: f.available,
        usePercent: Math.round(f.use * 10) / 10,
        sizeFormatted: formatBytes(f.size),
        usedFormatted: formatBytes(f.used),
        availableFormatted: formatBytes(f.available),
      })),
      docker: docker ? {
        running: docker.containersRunning || 0,
        paused: docker.containersPaused || 0,
        stopped: docker.containersStopped || 0,
        containers: docker.containers || 0,
      } : null,
      uptime: formatUptime(time.uptime),
      timestamp: now,
    }

    // 清洗数据
    const cleanedData = cleanObject(dynamicInfo)

    // 更新缓存
    dynamicCache = { data: cleanedData, timestamp: now }

    res.json({
      success: true,
      data: cleanedData,
      cached: false,
    })
  } catch (error) {
    console.error('Failed to get dynamic system info:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system status',
    })
  }
})

// ============================================
// GET /api/system/docker - Docker 容器列表
// 返回所有容器的详细信息
// ============================================

interface DockerContainer {
  id: string
  name: string
  image: string
  state: string
  status: string
  started: number
}

// Docker 容器缓存
let dockerContainersCache: CacheEntry<DockerContainer[]> = { data: null, timestamp: 0 }
const DOCKER_CACHE_TTL = 5000 // 5秒

router.get('/docker', async (_req, res) => {
  try {
    const now = Date.now()

    // 检查缓存
    if (dockerContainersCache.data && now - dockerContainersCache.timestamp < DOCKER_CACHE_TTL) {
      return res.json({
        success: true,
        data: dockerContainersCache.data,
        cached: true,
      })
    }

    // 获取 Docker 容器列表
    const containers = await si.dockerContainers('all').catch(() => [])

    const containerList: DockerContainer[] = containers.map(c => ({
      id: c.id?.substring(0, 12) || 'unknown',
      name: c.name?.replace(/^\//, '') || 'unnamed',
      image: c.image || 'unknown',
      state: c.state || 'unknown',
      status: c.status || '',
      started: c.started || 0,
    }))

    // 更新缓存
    dockerContainersCache = { data: containerList, timestamp: now }

    res.json({
      success: true,
      data: containerList,
      cached: false,
    })
  } catch (error) {
    console.error('Failed to get docker containers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve docker containers',
      data: [],
    })
  }
})

export default router
