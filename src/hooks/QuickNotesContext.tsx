/**
 * QuickNotesContext · 灵感速记的全局共享 Provider
 * ---------------------------------------------------------------------------
 * 设计意图：
 *   原先 useQuickNotes 在 <QuickNotes/> 组件内部调用，状态被该组件独占。
 *   随着"灵感云·同步中心"模块进入侧边栏，<SyncCenterDrawer/> 也需要消费
 *   同一份 notes 列表与同步操作；因此把 useQuickNotes 上提到 App 顶层，
 *   通过 Context 在多个消费者之间共享。
 *
 *   - 仅当 <QuickNotesProvider> 存在时，下游通过 useQuickNotesContext() 拿到 hook 返回值；
 *   - 不存在时返回 null，调用方需自行兜底（保持解耦）。
 */
import React, { createContext, useContext, ReactNode } from 'react'
import { useQuickNotes } from './useQuickNotes'

type QuickNotesValue = ReturnType<typeof useQuickNotes>

interface ProviderProps {
  children: ReactNode
  syncMode?: 'manual' | 'auto' | 'bidirectional'
  remoteConfigured?: boolean
}

const QuickNotesContext = createContext<QuickNotesValue | null>(null)

export function QuickNotesProvider({
  children,
  syncMode = 'auto',
  remoteConfigured = false,
}: ProviderProps) {
  const value = useQuickNotes({ syncMode, remoteConfigured })
  return <QuickNotesContext.Provider value={value}>{children}</QuickNotesContext.Provider>
}

/** 在 Provider 之内取共享值；不在则返回 null */
export function useQuickNotesContext(): QuickNotesValue | null {
  return useContext(QuickNotesContext)
}
