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
import { exec } from 'child_process'
import { promisify } from 'util'
import si from 'systeminformation'

const execAsync = promisify(exec)

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

    // 过滤文件系统：排除纯虚拟类型，但保留 overlay 根分区（Docker 容器内的主文件系统）
    const physicalFS = fs.filter(f => {
      const fsLower = f.fs.toLowerCase()
      // 始终排除的虚拟文件系统
      if (fsLower.startsWith('tmpfs') || fsLower.startsWith('shm') || 
          fsLower.startsWith('devtmpfs') || fsLower.startsWith('nsfs') ||
          fsLower.startsWith('cgroup') || fsLower.startsWith('proc') || 
          fsLower.startsWith('sysfs')) {
        return false
      }
      // overlay：如果挂载在 / 且有实际大小，保留（这是 Docker 容器根文件系统）
      if (fsLower === 'overlay' && f.mount !== '/' ) {
        return false
      }
      return f.size > 0
    })

    // Docker 信息：si.dockerInfo 失败时尝试 CLI fallback
    let dockerData: DynamicSystemInfo['docker'] = null
    if (docker) {
      dockerData = {
        running: docker.containersRunning || 0,
        paused: docker.containersPaused || 0,
        stopped: docker.containersStopped || 0,
        containers: docker.containers || 0,
      }
    } else {
      // CLI fallback：通过 docker 命令获取容器统计
      try {
        const { stdout } = await execAsync('docker ps -a --format "{{.State}}"', { timeout: 5000 })
        if (stdout.trim()) {
          const states = stdout.trim().split('\n')
          const running = states.filter(s => s === 'running').length
          const paused = states.filter(s => s === 'paused').length
          dockerData = {
            running,
            paused,
            stopped: states.length - running - paused,
            containers: states.length,
          }
        }
      } catch {
        // Docker 不可用，保持 null
      }
    }

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
      docker: dockerData,
      uptime: formatUptime(time.uptime),
      timestamp: now,
    }

    // 清洗数据（保留 docker 字段即使为 null，前端需要判断）
    const cleanedData = cleanObject(dynamicInfo)
    // 确保 docker 字段始终存在（cleanObject 会移除 null 值）
    if (!('docker' in cleanedData)) {
      (cleanedData as any).docker = null
    }

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
// GET /api/system/pulse - 心跳脉搏接口（精简版）
// 专为 SystemMonitor 组件优化的轻量级实时数据
// ============================================

interface DiskInfo {
  mount: string
  usedPercent: number
  total: string
  used: string
  free: string
}

interface PulseData {
  cpu: {
    usage: number
    temperature: number | null
  }
  memory: {
    usedPercent: number
    total: string
    used: string
    free: string
  }
  network: {
    rx_sec: number
    tx_sec: number
    rx_formatted: string
    tx_formatted: string
  }
  disk: {
    usedPercent: number
    total: string
    used: string
    free: string
  }
  disks: DiskInfo[]  // 多硬盘数据
  containers: {
    running: number
    total: number
  } | null
  uptime: string
  timestamp: number
}

// Pulse 缓存 - 2秒有效
let pulseCache: CacheEntry<PulseData> = { data: null, timestamp: 0 }
const PULSE_CACHE_TTL = 2000

router.get('/pulse', async (_req, res) => {
  try {
    const now = Date.now()

    // 检查缓存
    if (pulseCache.data && now - pulseCache.timestamp < PULSE_CACHE_TTL) {
      return res.json({
        success: true,
        data: pulseCache.data,
        cached: true,
      })
    }

    // 并发获取核心数据
    const [load, temp, mem, network, fs, docker, time] = await Promise.all([
      si.currentLoad(),
      si.cpuTemperature().catch(() => ({ main: null })),
      si.mem(),
      si.networkStats(),
      si.fsSize(),
      si.dockerInfo().catch(() => null),
      si.time(),
    ])

    // 获取主磁盘
    const diskPrefix = process.env.SI_FILESYSTEM_DISK_PREFIX || ''
    const targetDisk = fs.find((d) => d.mount === `${diskPrefix}/`) 
      || fs.find((d) => d.mount === '/') 
      || fs.reduce((max, d) => d.size > max.size ? d : max, fs[0])

    // 过滤出物理磁盘（适配 NAS 多硬盘环境）
    // 在 Docker 环境下，宿主机挂载点会带有 /host 前缀
    // 支持：Synology, QNAP, 绿联 UGREEN, 飞牛 fnOS, 群晖, 威联通等
    const physicalDisks = fs.filter(f => {
      const mount = f.mount
      const fsType = f.fs.toLowerCase()
      const fsDevice = f.fs // 原始设备名（如 /dev/sda1）
      
      // 排除虚拟文件系统（overlay 挂载在 / 时保留 —— Docker 容器根文件系统）
      const isOverlayRoot = fsType === 'overlay' && mount === '/'
      if (!isOverlayRoot && (
          fsType.startsWith('tmpfs') ||
          fsType.startsWith('overlay') ||
          fsType.startsWith('shm') ||
          fsType.startsWith('devtmpfs') ||
          fsType.startsWith('udev') ||
          fsType.startsWith('squashfs') ||
          fsType.startsWith('nsfs') ||
          fsType.startsWith('cgroup') ||
          fsType.startsWith('proc') ||
          fsType.startsWith('sysfs') ||
          fsType.startsWith('aufs') ||
          fsType.startsWith('rootfs'))) {
        return false
      }
      
      // 排除系统目录
      const excludeMounts = [
        '/snap', '/boot', '/sys', '/run', '/dev', '/proc', '/etc',
        '/host/snap', '/host/boot', '/host/sys', '/host/run', '/host/dev', '/host/proc', '/host/etc',
        '/var/lib/docker', '/host/var/lib/docker'  // Docker 存储目录
      ]
      if (excludeMounts.some(ex => mount.startsWith(ex))) {
        return false
      }
      
      // 排除太小的分区（< 1GB），但保留根分区
      const isRoot = mount === '/' || mount === '/host' || mount === '/host/'
      if (f.size < 1024 * 1024 * 1024 && !isRoot) {
        return false
      }
      
      // 保留以下类型的挂载点：
      // 1. 根目录 / 或 /host
      // 2. NAS 卷挂载点（各品牌）
      // 3. Docker 环境下的宿主机挂载
      const validMountPatterns = [
        /^\/$/,                          // 根目录
        /^\/host$/,                      // Docker 宿主机根目录
        /^\/host\/$/,                    // Docker 宿主机根目录（带斜杠）
        /^\/volume\d*/i,                 // Synology NAS 卷：/volume1, /volume2, /Volume0
        /^\/host\/volume\d*/i,           // Docker 下的 Synology 卷
        /^\/vol\d*/i,                    // 绿联 UGREEN: /vol1, /Vol0
        /^\/host\/vol\d*/i,              // Docker 下的绿联卷
        /^\/UGREEN/i,                    // 绿联数据目录
        /^\/host\/UGREEN/i,              // Docker 下的绿联目录
        /^\/mnt\//,                      // 通用挂载点
        /^\/host\/mnt\//,                // Docker 下的挂载点
        /^\/media\//,                    // 媒体挂载
        /^\/host\/media\//,              // Docker 下的媒体挂载
        /^\/data/i,                      // 数据目录
        /^\/host\/data/i,                // Docker 下的数据目录
        /^\/storage/i,                   // 存储目录
        /^\/host\/storage/i,             // Docker 下的存储目录
        /^\/share/i,                     // QNAP 共享目录
        /^\/host\/share/i,               // Docker 下的共享目录
        /^\/sata/i,                      // 飞牛 fnOS / 某些 NAS 的 SATA 挂载点
        /^\/host\/sata/i,                // Docker 下的 SATA 挂载
        /^\/disk/i,                      // 通用磁盘挂载点
        /^\/host\/disk/i,                // Docker 下的磁盘挂载
        /^\/pool/i,                      // ZFS/存储池
        /^\/host\/pool/i,                // Docker 下的存储池
        /^\/tank/i,                      // ZFS tank
        /^\/host\/tank/i,                // Docker 下的 ZFS
        /^\/array/i,                     // 阵列挂载
        /^\/host\/array/i,               // Docker 下的阵列
        /^\/nas/i,                       // NAS 通用目录
        /^\/host\/nas/i,                 // Docker 下的 NAS 目录
        /^\/home$/,                      // 用户主目录（可能在单独分区）
        /^\/host\/home$/,                // Docker 下的用户目录
        /^[A-Za-z]:[\\\/]/,              // Windows 盘符
      ]
      
      // 额外检查：如果是真实块设备（/dev/sd*, /dev/nvme*, /dev/md*）挂载的大分区，保留
      const isRealBlockDevice = /^\/(dev\/)?(sd[a-z]|nvme\d|md\d|vd[a-z]|hd[a-z]|xvd[a-z])/.test(fsDevice)
      
      return validMountPatterns.some(pattern => pattern.test(mount)) || (isRealBlockDevice && f.size > 10 * 1024 * 1024 * 1024)
    })
    
    // 去重：如果同时存在 / 和 /host，优先保留 /host（Docker 宿主机）
    const deduplicatedDisks = physicalDisks.reduce((acc, disk) => {
      // 检查是否已存在相同大小的磁盘（可能是同一物理盘的不同挂载）
      const exists = acc.find(d => 
        Math.abs(d.size - disk.size) < 1024 * 1024 * 100 && // 容量差异 < 100MB
        Math.abs(d.used - disk.used) < 1024 * 1024 * 100    // 使用量差异 < 100MB
      )
      if (!exists) {
        acc.push(disk)
      } else if (disk.mount.startsWith('/host') && !exists.mount.startsWith('/host')) {
        // 优先使用 /host 前缀的挂载点
        const idx = acc.indexOf(exists)
        acc[idx] = disk
      }
      return acc
    }, [] as typeof physicalDisks)
    
    // 按挂载点排序：根目录优先，然后按名称排序
    deduplicatedDisks.sort((a, b) => {
      const aIsRoot = a.mount === '/' || a.mount === '/host' || a.mount === '/host/'
      const bIsRoot = b.mount === '/' || b.mount === '/host' || b.mount === '/host/'
      if (aIsRoot && !bIsRoot) return -1
      if (!aIsRoot && bIsRoot) return 1
      return a.mount.localeCompare(b.mount)
    })

    // 获取主网络接口（过滤虚拟接口）
    const physicalNetwork = network.find(n => 
      !n.iface.startsWith('lo') && 
      !n.iface.startsWith('docker') &&
      !n.iface.startsWith('br-') &&
      !n.iface.startsWith('veth') &&
      n.operstate === 'up'
    ) || network[0]

    // 计算网络聚合速度
    const totalRxSec = network
      .filter(n => !n.iface.startsWith('lo') && !n.iface.startsWith('docker'))
      .reduce((sum, n) => sum + (n.rx_sec || 0), 0)
    const totalTxSec = network
      .filter(n => !n.iface.startsWith('lo') && !n.iface.startsWith('docker'))
      .reduce((sum, n) => sum + (n.tx_sec || 0), 0)

    const pulseData: PulseData = {
      cpu: {
        usage: Math.round(load.currentLoad * 10) / 10,
        temperature: temp.main !== null ? Math.round(temp.main) : null,
      },
      memory: {
        usedPercent: Math.round((mem.used / mem.total) * 1000) / 10,
        total: formatBytes(mem.total),
        used: formatBytes(mem.used),
        free: formatBytes(mem.available),
      },
      network: {
        rx_sec: Math.round(totalRxSec),
        tx_sec: Math.round(totalTxSec),
        rx_formatted: `${formatBytes(totalRxSec)}/s`,
        tx_formatted: `${formatBytes(totalTxSec)}/s`,
      },
      disk: {
        usedPercent: targetDisk ? Math.round(targetDisk.use * 10) / 10 : 0,
        total: targetDisk ? formatBytes(targetDisk.size) : '0 B',
        used: targetDisk ? formatBytes(targetDisk.used) : '0 B',
        free: targetDisk ? formatBytes(targetDisk.available) : '0 B',
      },
      disks: deduplicatedDisks.map(d => ({
        mount: d.mount,
        usedPercent: Math.round(d.use * 10) / 10,
        total: formatBytes(d.size),
        used: formatBytes(d.used),
        free: formatBytes(d.available),
      })),
      containers: docker ? {
        running: docker.containersRunning || 0,
        total: docker.containers || 0,
      } : null,
      uptime: formatUptime(time.uptime),
      timestamp: now,
    }

    // Docker CLI fallback：如果 si.dockerInfo 失败，尝试 CLI
    if (!pulseData.containers) {
      try {
        const { stdout } = await execAsync('docker ps -a --format "{{.State}}"', { timeout: 5000 })
        if (stdout.trim()) {
          const states = stdout.trim().split('\n')
          pulseData.containers = {
            running: states.filter(s => s === 'running').length,
            total: states.length,
          }
        }
      } catch {
        // Docker 不可用
      }
    }

    // 如果 disks 为空（没有宿主机挂载），用 targetDisk（容器根分区）作为 fallback
    if (pulseData.disks.length === 0 && targetDisk) {
      pulseData.disks = [{
        mount: targetDisk.mount || '/',
        usedPercent: Math.round(targetDisk.use * 10) / 10,
        total: formatBytes(targetDisk.size),
        used: formatBytes(targetDisk.used),
        free: formatBytes(targetDisk.available),
      }]
    }

    // 更新缓存
    pulseCache = { data: pulseData, timestamp: now }

    res.json({
      success: true,
      data: pulseData,
      cached: false,
    })
  } catch (error) {
    console.error('Failed to get pulse data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pulse data',
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

/**
 * 通过 docker CLI 获取容器列表（作为 systeminformation 的 fallback）
 * 适配绿联/飞牛 OS 等 NAS 系统的嵌套 Docker 场景
 */
async function getDockerContainersViaCli(): Promise<DockerContainer[]> {
  try {
    // 使用 docker ps -a 获取所有容器（JSON 格式）
    const { stdout } = await execAsync(
      'docker ps -a --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.State}}|{{.Status}}|{{.CreatedAt}}"',
      { timeout: 10000 }
    )
    
    if (!stdout.trim()) {
      return []
    }
    
    const containers: DockerContainer[] = stdout.trim().split('\n').map(line => {
      const [id, name, image, state, status, createdAt] = line.split('|')
      return {
        id: id?.substring(0, 12) || 'unknown',
        name: name?.replace(/^\//, '') || 'unnamed',
        image: image || 'unknown',
        state: state || 'unknown',
        status: status || '',
        started: createdAt ? new Date(createdAt).getTime() : 0,
      }
    })
    
    return containers
  } catch (err) {
    console.error('[Docker CLI] Failed to get containers:', err)
    return []
  }
}

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

    // 尝试通过 systeminformation 获取容器列表（true = 包含所有容器，含已停止的）
    let containers = await si.dockerContainers(true).catch(() => [])
    
    // 如果 systeminformation 返回空，尝试通过 docker CLI 获取
    // 这对于绿联/飞牛 OS 等 NAS 系统的嵌套 Docker 场景更可靠
    if (containers.length === 0) {
      console.log('[Docker] systeminformation returned empty, trying docker CLI fallback...')
      const cliContainers = await getDockerContainersViaCli()
      if (cliContainers.length > 0) {
        console.log(`[Docker] CLI fallback found ${cliContainers.length} containers`)
        // 更新缓存
        dockerContainersCache = { data: cliContainers, timestamp: now }
        return res.json({
          success: true,
          data: cliContainers,
          cached: false,
          source: 'cli',
        })
      }
    }

    const containerList: DockerContainer[] = containers.map(c => ({
      id: c.id?.substring(0, 12) || 'unknown',
      name: c.name?.replace(/^\//, '') || 'unnamed',
      image: c.image || 'unknown',
      state: c.state || 'unknown',
      status: (c as any).status || '',
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

// ============================================
// Docker 容器控制：启动 / 停止 / 重启
// ============================================

router.post('/docker/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params

    // 只允许特定操作
    const allowedActions = ['start', 'stop', 'restart']
    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Invalid action: ${action}. Allowed: ${allowedActions.join(', ')}`,
      })
    }

    // 安全校验：ID 只允许十六进制字符（Docker 短 ID 格式）
    if (!/^[a-f0-9]{6,12}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid container ID format',
      })
    }

    // 执行 docker 命令
    await execAsync(`docker ${action} ${id}`, { timeout: 30000 })

    // 清除缓存，让下次请求获取最新状态
    dockerContainersCache = { data: null, timestamp: 0 }

    res.json({
      success: true,
      message: `Container ${id} ${action} successful`,
    })
  } catch (error: any) {
    console.error(`Docker ${req.params.action} failed:`, error)
    res.status(500).json({
      success: false,
      error: error?.message || `Failed to ${req.params.action} container`,
    })
  }
})

// ============================================
// GET /api/system/debug - 调试接口
// 用于排查 NAS 环境下的系统信息读取问题
// ============================================

router.get('/debug', async (_req, res) => {
  try {
    // 获取原始文件系统数据（不过滤）
    const rawFs = await si.fsSize()
    
    // 获取 Docker 信息
    const dockerInfo = await si.dockerInfo().catch(() => null)
    const dockerContainers = await si.dockerContainers(true).catch(() => [])
    
    // 尝试 CLI 方式获取 Docker
    let cliDockerInfo = null
    try {
      const { stdout: dockerVersion } = await execAsync('docker --version', { timeout: 5000 })
      const { stdout: dockerPs } = await execAsync('docker ps -a --format "{{.ID}}|{{.Names}}|{{.State}}"', { timeout: 5000 })
      cliDockerInfo = {
        version: dockerVersion.trim(),
        containers: dockerPs.trim().split('\n').filter(Boolean).map(line => {
          const [id, name, state] = line.split('|')
          return { id, name, state }
        })
      }
    } catch (e: any) {
      cliDockerInfo = { error: e.message }
    }
    
    // 环境变量
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      SI_FILESYSTEM_DISK_PREFIX: process.env.SI_FILESYSTEM_DISK_PREFIX,
      PROC_PATH: process.env.PROC_PATH,
      SYS_PATH: process.env.SYS_PATH,
      FS_PATH: process.env.FS_PATH,
    }

    res.json({
      success: true,
      data: {
        environment: envVars,
        rawFilesystems: rawFs.map(f => ({
          fs: f.fs,
          type: f.type,
          mount: f.mount,
          size: formatBytes(f.size),
          used: formatBytes(f.used),
          use: f.use,
        })),
        docker: {
          systeminformation: {
            info: dockerInfo,
            containers: dockerContainers.length,
          },
          cli: cliDockerInfo,
        },
        timestamp: Date.now(),
      },
    })
  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

export default router
