import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react'

// 主题配色方案 - 专业级设计
export interface ThemeColors {
  // 主色调
  primary: string
  primaryLight: string
  primaryDark: string
  // 强调色
  accent: string
  accentLight: string
  // 背景层 - 多层次
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  bgGradient: string
  // 文字层 - 高对比度
  textPrimary: string
  textSecondary: string
  textMuted: string
  // 边框
  border: string
  borderLight: string
  // 玻璃效果 - 高品质
  glass: string
  glassBorder: string
  glassHover: string
  // 阴影层 - 弥散阴影
  shadow: string
  shadowHover: string
  // 发光效果
  glow: string
  glowSecondary: string
}

// 预设主题 - 按照设计师建议优化
export const themes = {
  // ============ 夜间模式 (Deep Space) ============
  // 星云夜空 - 默认深色
  nebula: {
    id: 'nebula',
    name: '星云夜空',
    icon: '🌌',
    mode: 'dark' as const,
    colors: {
      primary: '#667eea',
      primaryLight: '#818cf8',
      primaryDark: '#4f46e5',
      accent: '#06b6d4',
      accentLight: '#22d3ee',
      // 深邃背景层 - Neutral-950 基底
      bgPrimary: '#0a0a0a',
      bgSecondary: '#0f0f12',
      bgTertiary: '#171720',
      bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(102, 126, 234, 0.15), transparent)',
      // 文字层 - 高可读性
      textPrimary: 'rgba(255, 255, 255, 0.95)',
      textSecondary: 'rgba(255, 255, 255, 0.72)',
      textMuted: 'rgba(255, 255, 255, 0.45)',
      // 边框 - 微妙可见
      border: 'rgba(255, 255, 255, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      // 玻璃效果 - bg-neutral-900/50
      glass: 'rgba(23, 23, 32, 0.5)',
      glassBorder: 'rgba(255, 255, 255, 0.1)',
      glassHover: 'rgba(255, 255, 255, 0.05)',
      // 阴影 - 深色模式无阴影，改用发光
      shadow: 'none',
      shadowHover: 'none',
      // 发光效果 - Cyan/Indigo 流光
      glow: 'rgba(102, 126, 234, 0.5)',
      glowSecondary: 'rgba(6, 182, 212, 0.4)',
    },
  },
  // 极光幻影
  aurora: {
    id: 'aurora',
    name: '极光幻影',
    icon: '🔮',
    mode: 'dark' as const,
    colors: {
      primary: '#a855f7',
      primaryLight: '#c084fc',
      primaryDark: '#9333ea',
      accent: '#f472b6',
      accentLight: '#f9a8d4',
      bgPrimary: '#09090b',
      bgSecondary: '#0c0a14',
      bgTertiary: '#151320',
      bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(168, 85, 247, 0.12), transparent)',
      textPrimary: 'rgba(255, 255, 255, 0.95)',
      textSecondary: 'rgba(255, 255, 255, 0.72)',
      textMuted: 'rgba(255, 255, 255, 0.45)',
      border: 'rgba(168, 85, 247, 0.15)',
      borderLight: 'rgba(168, 85, 247, 0.08)',
      glass: 'rgba(21, 19, 32, 0.5)',
      glassBorder: 'rgba(168, 85, 247, 0.2)',
      glassHover: 'rgba(168, 85, 247, 0.1)',
      shadow: 'none',
      shadowHover: 'none',
      glow: 'rgba(168, 85, 247, 0.5)',
      glowSecondary: 'rgba(244, 114, 182, 0.4)',
    },
  },
  // 深海迷境
  ocean: {
    id: 'ocean',
    name: '深海迷境',
    icon: '🌊',
    mode: 'dark' as const,
    colors: {
      primary: '#0ea5e9',
      primaryLight: '#38bdf8',
      primaryDark: '#0284c7',
      accent: '#2dd4bf',
      accentLight: '#5eead4',
      bgPrimary: '#020617',
      bgSecondary: '#0a1628',
      bgTertiary: '#132035',
      bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14, 165, 233, 0.12), transparent)',
      textPrimary: 'rgba(255, 255, 255, 0.95)',
      textSecondary: 'rgba(255, 255, 255, 0.72)',
      textMuted: 'rgba(255, 255, 255, 0.45)',
      border: 'rgba(14, 165, 233, 0.15)',
      borderLight: 'rgba(14, 165, 233, 0.08)',
      glass: 'rgba(19, 32, 53, 0.5)',
      glassBorder: 'rgba(14, 165, 233, 0.2)',
      glassHover: 'rgba(14, 165, 233, 0.1)',
      shadow: 'none',
      shadowHover: 'none',
      glow: 'rgba(14, 165, 233, 0.5)',
      glowSecondary: 'rgba(45, 212, 191, 0.4)',
    },
  },
  // 暗夜森林
  forest: {
    id: 'forest',
    name: '暗夜森林',
    icon: '🌲',
    mode: 'dark' as const,
    colors: {
      primary: '#22c55e',
      primaryLight: '#4ade80',
      primaryDark: '#16a34a',
      accent: '#a3e635',
      accentLight: '#bef264',
      bgPrimary: '#030806',
      bgSecondary: '#071210',
      bgTertiary: '#0f1f1a',
      bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 197, 94, 0.1), transparent)',
      textPrimary: 'rgba(255, 255, 255, 0.95)',
      textSecondary: 'rgba(255, 255, 255, 0.72)',
      textMuted: 'rgba(255, 255, 255, 0.45)',
      border: 'rgba(34, 197, 94, 0.15)',
      borderLight: 'rgba(34, 197, 94, 0.08)',
      glass: 'rgba(15, 31, 26, 0.5)',
      glassBorder: 'rgba(34, 197, 94, 0.2)',
      glassHover: 'rgba(34, 197, 94, 0.1)',
      shadow: 'none',
      shadowHover: 'none',
      glow: 'rgba(34, 197, 94, 0.5)',
      glowSecondary: 'rgba(163, 230, 53, 0.4)',
    },
  },

  // ============ 日间模式 (Solar Clarity) ============
  // 晴空白昼 - 默认浅色（高品质纸张质感）
  daylight: {
    id: 'daylight',
    name: '晴空白昼',
    icon: '☀️',
    mode: 'light' as const,
    colors: {
      primary: '#3b82f6',
      primaryLight: '#60a5fa',
      primaryDark: '#2563eb',
      accent: '#6366f1',
      accentLight: '#818cf8',
      // 背景层 - Neutral-50 基底 + 淡蓝渐变
      bgPrimary: '#fafafa',
      bgSecondary: '#ffffff',
      bgTertiary: '#f4f4f5',
      bgGradient: 'radial-gradient(ellipse 100% 80% at 0% 0%, rgba(219, 234, 254, 0.5), transparent 50%)',
      // 文字层 - 高对比度 Neutral-900/500
      textPrimary: '#171717',
      textSecondary: '#525252',
      textMuted: '#a3a3a3',
      // 边框 - 极细浅灰
      border: 'rgba(0, 0, 0, 0.08)',
      borderLight: 'rgba(0, 0, 0, 0.04)',
      // 玻璃效果 - 纯白 80% + 超强模糊
      glass: 'rgba(255, 255, 255, 0.85)',
      glassBorder: 'rgba(0, 0, 0, 0.05)',
      glassHover: 'rgba(255, 255, 255, 0.95)',
      // 阴影层 - 多层弥散阴影（关键）
      shadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.04)',
      shadowHover: '0 4px 12px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.08)',
      // 日间无发光
      glow: 'rgba(59, 130, 246, 0.15)',
      glowSecondary: 'rgba(99, 102, 241, 0.1)',
    },
  },
  // 日出暖阳
  sunrise: {
    id: 'sunrise',
    name: '日出暖阳',
    icon: '🌅',
    mode: 'light' as const,
    colors: {
      primary: '#f97316',
      primaryLight: '#fb923c',
      primaryDark: '#ea580c',
      accent: '#f59e0b',
      accentLight: '#fbbf24',
      bgPrimary: '#fffbf7',
      bgSecondary: '#ffffff',
      bgTertiary: '#fef3e2',
      bgGradient: 'radial-gradient(ellipse 100% 80% at 0% 0%, rgba(254, 243, 199, 0.6), transparent 50%)',
      textPrimary: '#1c1917',
      textSecondary: '#57534e',
      textMuted: '#a8a29e',
      border: 'rgba(0, 0, 0, 0.07)',
      borderLight: 'rgba(0, 0, 0, 0.03)',
      glass: 'rgba(255, 255, 255, 0.88)',
      glassBorder: 'rgba(249, 115, 22, 0.1)',
      glassHover: 'rgba(255, 255, 255, 0.95)',
      shadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 30px rgba(249,115,22,0.06)',
      shadowHover: '0 4px 12px rgba(0,0,0,0.05), 0 20px 40px rgba(249,115,22,0.1)',
      glow: 'rgba(249, 115, 22, 0.15)',
      glowSecondary: 'rgba(245, 158, 11, 0.1)',
    },
  },
  // 樱花粉黛
  sakura: {
    id: 'sakura',
    name: '樱花粉黛',
    icon: '🌸',
    mode: 'light' as const,
    colors: {
      primary: '#ec4899',
      primaryLight: '#f472b6',
      primaryDark: '#db2777',
      accent: '#f43f5e',
      accentLight: '#fb7185',
      bgPrimary: '#fdf4f8',
      bgSecondary: '#ffffff',
      bgTertiary: '#fce7f3',
      bgGradient: 'radial-gradient(ellipse 100% 80% at 0% 0%, rgba(252, 231, 243, 0.7), transparent 50%)',
      textPrimary: '#1f1218',
      textSecondary: '#6b4c5a',
      textMuted: '#b08c9e',
      border: 'rgba(0, 0, 0, 0.06)',
      borderLight: 'rgba(0, 0, 0, 0.03)',
      glass: 'rgba(255, 255, 255, 0.88)',
      glassBorder: 'rgba(236, 72, 153, 0.1)',
      glassHover: 'rgba(255, 255, 255, 0.95)',
      shadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 30px rgba(236,72,153,0.05)',
      shadowHover: '0 4px 12px rgba(0,0,0,0.05), 0 20px 40px rgba(236,72,153,0.08)',
      glow: 'rgba(236, 72, 153, 0.15)',
      glowSecondary: 'rgba(244, 63, 94, 0.1)',
    },
  },
  // 薄荷清新
  mint: {
    id: 'mint',
    name: '薄荷清新',
    icon: '🍃',
    mode: 'light' as const,
    colors: {
      primary: '#10b981',
      primaryLight: '#34d399',
      primaryDark: '#059669',
      accent: '#14b8a6',
      accentLight: '#2dd4bf',
      bgPrimary: '#f5fdf9',
      bgSecondary: '#ffffff',
      bgTertiary: '#dcfce7',
      bgGradient: 'radial-gradient(ellipse 100% 80% at 0% 0%, rgba(220, 252, 231, 0.6), transparent 50%)',
      textPrimary: '#0f1f17',
      textSecondary: '#3f5f4f',
      textMuted: '#8fb8a0',
      border: 'rgba(0, 0, 0, 0.06)',
      borderLight: 'rgba(0, 0, 0, 0.03)',
      glass: 'rgba(255, 255, 255, 0.88)',
      glassBorder: 'rgba(16, 185, 129, 0.1)',
      glassHover: 'rgba(255, 255, 255, 0.95)',
      shadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 30px rgba(16,185,129,0.05)',
      shadowHover: '0 4px 12px rgba(0,0,0,0.05), 0 20px 40px rgba(16,185,129,0.08)',
      glow: 'rgba(16, 185, 129, 0.15)',
      glowSecondary: 'rgba(20, 184, 166, 0.1)',
    },
  },
} as const

export type ThemeId = keyof typeof themes
export type Theme = typeof themes[ThemeId]

// 主题切换动画状态
interface ThemeTransition {
  isTransitioning: boolean
  origin: { x: number; y: number } | null
}

// 主题上下文类型
interface ThemeContextType {
  theme: Theme
  themeId: ThemeId
  isDark: boolean
  setTheme: (id: ThemeId, origin?: { x: number; y: number }) => void
  toggleDarkMode: (origin?: { x: number; y: number }) => void
  autoMode: boolean
  setAutoMode: (auto: boolean) => void
  transition: ThemeTransition
}

// 创建上下文
const ThemeContext = createContext<ThemeContextType | null>(null)

// 应用主题到 CSS 变量
function applyTheme(theme: Theme) {
  const root = document.documentElement
  const { colors, mode } = theme

  // 设置 CSS 变量
  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-primary-light', colors.primaryLight)
  root.style.setProperty('--color-primary-dark', colors.primaryDark)
  root.style.setProperty('--color-accent', colors.accent)
  root.style.setProperty('--color-accent-light', colors.accentLight)
  root.style.setProperty('--color-bg-primary', colors.bgPrimary)
  root.style.setProperty('--color-bg-secondary', colors.bgSecondary)
  root.style.setProperty('--color-bg-tertiary', colors.bgTertiary)
  root.style.setProperty('--color-bg-gradient', colors.bgGradient)
  root.style.setProperty('--color-text-primary', colors.textPrimary)
  root.style.setProperty('--color-text-secondary', colors.textSecondary)
  root.style.setProperty('--color-text-muted', colors.textMuted)
  root.style.setProperty('--color-border', colors.border)
  root.style.setProperty('--color-border-light', colors.borderLight)
  root.style.setProperty('--color-glass', colors.glass)
  root.style.setProperty('--color-glass-border', colors.glassBorder)
  root.style.setProperty('--color-glass-hover', colors.glassHover)
  root.style.setProperty('--color-shadow', colors.shadow)
  root.style.setProperty('--color-shadow-hover', colors.shadowHover)
  root.style.setProperty('--color-glow', colors.glow)
  root.style.setProperty('--color-glow-secondary', colors.glowSecondary)

  // 设置主题 class
  if (mode === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }

  // 设置主题 ID
  root.setAttribute('data-theme', theme.id)
}

// 获取系统偏好的主题
function getSystemPreferredMode(): 'dark' | 'light' {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

// 根据时间获取推荐主题
function getTimeBasedTheme(): ThemeId {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 18) {
    return 'daylight'
  }
  return 'nebula'
}

export function useTheme() {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const stored = localStorage.getItem('themeId')
    if (stored && stored in themes) {
      return stored as ThemeId
    }
    const systemMode = getSystemPreferredMode()
    return systemMode === 'dark' ? 'nebula' : 'daylight'
  })

  const [autoMode, setAutoModeState] = useState(() => {
    return localStorage.getItem('themeAutoMode') === 'true'
  })

  const [transition, setTransition] = useState<ThemeTransition>({
    isTransitioning: false,
    origin: null,
  })

  const transitionTimeoutRef = useRef<NodeJS.Timeout>()

  const theme = themes[themeId]
  const isDark = theme.mode === 'dark'

  // 应用主题
  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('themeId', themeId)
  }, [themeId, theme])

  // 自动模式：监听系统偏好变化
  useEffect(() => {
    if (!autoMode) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setThemeId(e.matches ? 'nebula' : 'daylight')
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [autoMode])

  // 自动模式：根据时间切换
  useEffect(() => {
    if (!autoMode) return

    const interval = setInterval(() => {
      const recommendedTheme = getTimeBasedTheme()
      const currentMode = themes[themeId].mode
      const recommendedMode = themes[recommendedTheme].mode
      
      if (currentMode !== recommendedMode) {
        setThemeId(recommendedTheme)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [autoMode, themeId])

  // 带动画的主题切换
  const setTheme = useCallback((id: ThemeId, origin?: { x: number; y: number }) => {
    if (origin) {
      // 触发圆圈扩散动画
      setTransition({ isTransitioning: true, origin })
      
      // 清除之前的定时器
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }

      // 动画结束后重置状态
      transitionTimeoutRef.current = setTimeout(() => {
        setTransition({ isTransitioning: false, origin: null })
      }, 600)
    }

    setThemeId(id)
    setAutoModeState(false)
    localStorage.setItem('themeAutoMode', 'false')
  }, [])

  // 切换深色/浅色模式
  const toggleDarkMode = useCallback((origin?: { x: number; y: number }) => {
    const currentMode = themes[themeId].mode
    const newThemeId = currentMode === 'dark' ? 'daylight' : 'nebula'
    setTheme(newThemeId, origin)
  }, [themeId, setTheme])

  // 设置自动模式
  const setAutoMode = useCallback((auto: boolean) => {
    setAutoModeState(auto)
    localStorage.setItem('themeAutoMode', String(auto))
    if (auto) {
      setThemeId(getTimeBasedTheme())
    }
  }, [])

  // 清理
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  return {
    theme,
    themeId,
    isDark,
    setTheme,
    toggleDarkMode,
    autoMode,
    setAutoMode,
    transition,
  }
}

// 主题 Provider
export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeState = useTheme()
  
  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  )
}

// 使用主题上下文的 Hook
export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }
  return context
}

// 导出主题列表
export const darkThemes = Object.values(themes).filter(t => t.mode === 'dark')
export const lightThemes = Object.values(themes).filter(t => t.mode === 'light')
