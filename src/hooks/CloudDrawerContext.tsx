/**
 * CloudDrawerContext · 灵感云抽屉的开关共享
 * ---------------------------------------------------------------------------
 * 多组件协作：
 *   - SidebarNav 末尾的「灵感云」模块项点击 → 调用 open()
 *   - QuickNotes 头部的「↗ 灵感云」按钮点击 → 调用 open()
 *   - SyncCenterDrawer 通过 isOpen 决定是否渲染
 *   - SyncCenterDrawer 关闭按钮 → 调用 close()
 *
 * 这个 Context 与 QuickNotesContext 解耦，仅承载 UI 抽屉状态，便于复用。
 */
import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react'

interface CloudDrawerValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  /** 灵感雨抽屉的开关（在 QuickNotes 主体中渲染，但其他位置也可触发） */
  isRainOpen: boolean
  openRain: () => void
  closeRain: () => void
}

const CloudDrawerContext = createContext<CloudDrawerValue | null>(null)

export function CloudDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRainOpen, setIsRainOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])
  const openRain = useCallback(() => setIsRainOpen(true), [])
  const closeRain = useCallback(() => setIsRainOpen(false), [])
  return (
    <CloudDrawerContext.Provider
      value={{ isOpen, open, close, toggle, isRainOpen, openRain, closeRain }}
    >
      {children}
    </CloudDrawerContext.Provider>
  )
}

export function useCloudDrawer(): CloudDrawerValue {
  const ctx = useContext(CloudDrawerContext)
  if (!ctx) {
    // 兜底：未在 Provider 中时返回安全 noop（避免崩溃）
    return {
      isOpen: false,
      open: () => {},
      close: () => {},
      toggle: () => {},
      isRainOpen: false,
      openRain: () => {},
      closeRain: () => {},
    }
  }
  return ctx
}
