/**
 * System Stats Route - 系统感知接口
 * 提供 CPU、内存、磁盘、运行时间等关键 Vibe 指标
 */
import { Router } from 'express'
import si from 'systeminformation'

const router = Router()

// 格式化运行时间为 "X天X小时X分钟"
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

// 缓存机制 - 避免频繁调用系统接口
let statsCache: {
  data: SystemStats | null
  timestamp: number
} = {
  data: null,
  timestamp: 0,
}

const CACHE_TTL = 5000 // 5秒缓存

interface SystemStats {
  cpuLoad: number      // CPU 负载百分比
  memUsage: number     // 内存使用百分比
  diskUsage: number    // 磁盘使用百分比
  uptime: string       // 格式化的运行时间
  timestamp: number    // 数据采集时间戳
}

/**
 * GET /api/system/stats
 * 获取系统关键指标
 */
router.get('/stats', async (_req, res) => {
  try {
    const now = Date.now()

    // 检查缓存是否有效
    if (statsCache.data && now - statsCache.timestamp < CACHE_TTL) {
      return res.json({
        success: true,
        data: statsCache.data,
        cached: true,
      })
    }

    // 并行获取所有系统信息（提高响应速度）
    const [cpuLoad, mem, disk, time] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.time(),
    ])

    // 找到根目录挂载点的磁盘使用情况
    const rootDisk = disk.find((d) => d.mount === '/') || disk[0]

    const stats: SystemStats = {
      cpuLoad: Math.round(cpuLoad.currentLoad * 10) / 10,
      memUsage: Math.round((mem.used / mem.total) * 1000) / 10,
      diskUsage: rootDisk ? Math.round(rootDisk.use * 10) / 10 : 0,
      uptime: formatUptime(time.uptime),
      timestamp: now,
    }

    // 更新缓存
    statsCache = {
      data: stats,
      timestamp: now,
    }

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

export default router
