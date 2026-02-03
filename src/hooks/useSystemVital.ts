/**
 * useSystemVital - 系统感知神经
 * 将复杂的原始数据转化成 UI 易读的 "Vibe Status"
 * 这是所有监控组件的"灵魂"
 */
import useSWR from 'swr'

// ============================================
// 类型定义
// ============================================

export interface DiskInfo {
  mount: string       // 挂载点
  used: number        // 已用百分比
  total: string       // 总容量
  free: string        // 可用空间
}

export interface SystemVitalData {
  // 核心指标
  cpu: number           // CPU 使用率 %
  mem: number           // 内存使用率 %
  temp: number          // CPU 温度 °C
  
  // 网络流量
  net: {
    up: string          // 上行速度 (格式化后)
    down: string        // 下行速度 (格式化后)
    upRaw: number       // 上行原始值 bytes/s
    downRaw: number     // 下行原始值 bytes/s
  }
  
  // 存储（主磁盘，向后兼容）
  disk: {
    used: number        // 已用百分比
    total: string       // 总容量
    free: string        // 可用空间
  }
  
  // 多硬盘数据
  disks: DiskInfo[]
  
  // 容器状态
  containers: {
    running: number
    total: number
  }
  
  // 系统运行时间
  uptime: string
  
  // 综合健康状态
  status: 'healthy' | 'warning' | 'critical'
  
  // 加载状态
  isLoading: boolean
  error: Error | null
}

interface PulseApiResponse {
  success: boolean
  data: {
    cpu: {
      usage: number
      temperature: number
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
    disks?: Array<{
      mount: string
      usedPercent: number
      total: string
      used: string
      free: string
    }>
    containers?: {
      running: number
      total: number
    }
    uptime: string
  }
}

// ============================================
// 格式化工具
// ============================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B/s'
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function calculateStatus(cpu: number, mem: number, temp: number): 'healthy' | 'warning' | 'critical' {
  // 临界条件
  if (cpu > 90 || mem > 95 || temp > 85) return 'critical'
  if (cpu > 70 || mem > 80 || temp > 70) return 'warning'
  return 'healthy'
}

// ============================================
// API Fetcher
// ============================================

const fetcher = async (url: string): Promise<PulseApiResponse['data']> => {
  const res = await fetch(url)
  const json: PulseApiResponse = await res.json()
  if (!json.success) {
    throw new Error('API request failed')
  }
  return json.data
}

// ============================================
// Hook 主体
// ============================================

export function useSystemVital(refreshInterval = 3000): SystemVitalData {
  const { data, error, isLoading } = useSWR<PulseApiResponse['data']>(
    '/api/system/pulse',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  )

  // 默认值（加载中或错误时使用）
  const defaultData: SystemVitalData = {
    cpu: 0,
    mem: 0,
    temp: 0,
    net: {
      up: '0 B/s',
      down: '0 B/s',
      upRaw: 0,
      downRaw: 0,
    },
    disk: {
      used: 0,
      total: '0 GB',
      free: '0 GB',
    },
    disks: [],
    containers: {
      running: 0,
      total: 0,
    },
    uptime: '--',
    status: 'healthy',
    isLoading,
    error: error || null,
  }

  if (!data) return defaultData

  // 转换 API 数据为 Vibe Status
  const cpu = Math.round(data.cpu?.usage || 0)
  const mem = Math.round(data.memory?.usedPercent || 0)
  const temp = Math.round(data.cpu?.temperature || 0)

  return {
    cpu,
    mem,
    temp,
    net: {
      up: data.network?.tx_formatted || formatBytes(data.network?.tx_sec || 0),
      down: data.network?.rx_formatted || formatBytes(data.network?.rx_sec || 0),
      upRaw: data.network?.tx_sec || 0,
      downRaw: data.network?.rx_sec || 0,
    },
    disk: {
      used: Math.round(data.disk?.usedPercent || 0),
      total: data.disk?.total || '0 GB',
      free: data.disk?.free || '0 GB',
    },
    disks: (data.disks || []).map(d => ({
      mount: d.mount,
      used: Math.round(d.usedPercent || 0),
      total: d.total || '0 GB',
      free: d.free || '0 GB',
    })),
    containers: {
      running: data.containers?.running || 0,
      total: data.containers?.total || 0,
    },
    uptime: data.uptime || '--',
    status: calculateStatus(cpu, mem, temp),
    isLoading: false,
    error: null,
  }
}

export default useSystemVital
