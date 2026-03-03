import { useState, useEffect, useCallback } from 'react'

/**
 * 轻量级 Hash 路由
 * 
 * 路由映射：
 *   (空)/#/             → 首页
 *   /#/admin-login      → 后台登录
 *   /#/admin             → 后台（默认 bookmarks 标签）
 *   /#/admin/bookmarks   → 后台-书签管理
 *   /#/admin/settings    → 后台-设置
 *   /#/admin/...         → 后台-其他标签
 */

export type PageType = 'home' | 'admin' | 'admin-login' | 'force-password-change'

export type AdminTabType = 
  | 'bookmarks' | 'categories' | 'tags' | 'quotes' | 'icons'
  | 'analytics' | 'health-check' | 'logs' | 'backup' | 'docs' | 'settings'

const VALID_ADMIN_TABS: AdminTabType[] = [
  'bookmarks', 'categories', 'tags', 'quotes', 'icons',
  'analytics', 'health-check', 'logs', 'backup', 'docs', 'settings',
]

interface HashRoute {
  page: PageType
  adminTab: AdminTabType
}

/** 解析当前 hash 为路由信息 */
function parseHash(hash: string): HashRoute {
  const path = hash.replace(/^#\/?/, '').replace(/\/$/, '') // 去掉 # 和首尾 /

  if (!path || path === '/') {
    return { page: 'home', adminTab: 'bookmarks' }
  }

  if (path === 'admin-login') {
    return { page: 'admin-login', adminTab: 'bookmarks' }
  }

  if (path === 'admin' || path.startsWith('admin/')) {
    const tabStr = path.replace(/^admin\/?/, '')
    const tab = VALID_ADMIN_TABS.includes(tabStr as AdminTabType)
      ? (tabStr as AdminTabType)
      : 'bookmarks'
    return { page: 'admin', adminTab: tab }
  }

  return { page: 'home', adminTab: 'bookmarks' }
}

/** 根据路由信息生成 hash 字符串 */
function buildHash(page: PageType, adminTab?: AdminTabType): string {
  switch (page) {
    case 'home':
      return ''
    case 'admin-login':
      return '#/admin-login'
    case 'force-password-change':
      return '#/admin-login' // URL 不暴露此状态
    case 'admin': {
      const tab = adminTab || 'bookmarks'
      return tab === 'bookmarks' ? '#/admin' : `#/admin/${tab}`
    }
    default:
      return ''
  }
}

export function useHashRouter() {
  const [route, setRoute] = useState<HashRoute>(() => parseHash(window.location.hash))

  // 监听浏览器前进/后退
  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // 导航：更新 hash（会触发 hashchange → 更新 state）
  const navigateTo = useCallback((page: PageType, adminTab?: AdminTabType) => {
    const newHash = buildHash(page, adminTab)
    if (window.location.hash !== newHash) {
      window.location.hash = newHash
    }
    // 如果 hash 相同但 route 不同（如 force-password-change），直接更新 state
    setRoute({ page, adminTab: adminTab || route.adminTab })
  }, [route.adminTab])

  // 设置后台标签页
  const setAdminTab = useCallback((tab: AdminTabType) => {
    const newHash = buildHash('admin', tab)
    if (window.location.hash !== newHash) {
      window.location.hash = newHash
    }
    setRoute(prev => ({ ...prev, adminTab: tab }))
  }, [])

  return {
    page: route.page,
    adminTab: route.adminTab,
    navigateTo,
    setAdminTab,
  }
}
