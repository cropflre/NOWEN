import { useState, useEffect } from 'react'
import { isNightTime } from '../lib/utils'

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    // 首先检查本地存储
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    // 然后检查系统偏好
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    // 最后根据时间判断
    return isNightTime(new Date().getHours())
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.classList.remove('light-mode')
    } else {
      root.classList.remove('dark')
      root.classList.add('light-mode')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('theme')
      if (!stored) {
        setIsDark(e.matches)
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const toggleTheme = () => setIsDark(prev => !prev)
  const setTheme = (dark: boolean) => setIsDark(dark)

  return { isDark, toggleTheme, setTheme }
}
