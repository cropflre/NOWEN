import { useState, useEffect } from 'react'

/**
 * 判断一个 hostname 是否属于内网地址
 * - localhost / 127.x
 * - 10.x.x.x
 * - 172.16.x.x ~ 172.31.x.x
 * - 192.168.x.x
 * - 任何 .local / .lan / .internal 后缀的域名
 */
function isInternalHost(hostname: string): boolean {
  // localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
    return true
  }
  
  // IPv4 内网段
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number)
    // 10.0.0.0/8
    if (a === 10) return true
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true
  }
  
  // 内网域名后缀
  const internalSuffixes = ['.local', '.lan', '.internal', '.corp', '.home']
  if (internalSuffixes.some(suffix => hostname.endsWith(suffix))) {
    return true
  }
  
  return false
}

/**
 * 检测当前网络环境（内网/外网）
 * 基于当前页面所在 host 进行判断：
 * - 如果页面部署在内网 IP/域名上 → 内网环境
 * - 如果页面部署在公网域名上 → 外网环境
 */
export function useNetworkEnv() {
  const [isInternal, setIsInternal] = useState(() => {
    return isInternalHost(window.location.hostname)
  })

  useEffect(() => {
    setIsInternal(isInternalHost(window.location.hostname))
  }, [])

  return { isInternal }
}

/**
 * 根据网络环境获取书签的实际访问 URL
 * 优先级：
 * - 内网环境 + 有内网链接 → 使用内网链接
 * - 其他情况 → 使用外网链接
 */
export function getBookmarkUrl(
  bookmark: { url: string; internalUrl?: string },
  isInternal: boolean
): string {
  if (isInternal && bookmark.internalUrl) {
    return bookmark.internalUrl
  }
  return bookmark.url
}
