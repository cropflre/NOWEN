/**
 * CloudDrawerHost · 灵感云抽屉宿主
 * ---------------------------------------------------------------------------
 * 必须挂在 <QuickNotesProvider> 与 <CloudDrawerProvider> 之内。
 * 负责：
 *   1. 从 QuickNotesContext 取 notes / pushingIds / pushNote / fetchRemoteSnapshot
 *   2. 从 CloudDrawerContext 取 isOpen / close
 *   3. 渲染 <SyncCenterDrawer>，并在内部维护一个 ConflictResolverModal，
 *      让用户在云面板里直接解决冲突。
 *
 * 与 <QuickNotes/> 主组件共享同一份 useQuickNotes 状态（通过 Provider），
 * 所以它推送的笔记会立即反映到首页卡片上。
 */
import React, { useState } from 'react'
import { useQuickNotesContext } from '../../../hooks/QuickNotesContext'
import { useCloudDrawer } from '../../../hooks/CloudDrawerContext'
import { SyncCenterDrawer } from './SyncCenterDrawer'
import { ConflictResolverModal } from './ConflictResolverModal'
import type { QuickNote, RemoteNoteSnapshot } from '../../../lib/api'

interface CloudDrawerHostProps {
  remoteConfigured: boolean
  remoteBaseUrl?: string
  syncMode?: 'manual' | 'auto' | 'bidirectional'
  onOpenSettings?: () => void
}

export function CloudDrawerHost({
  remoteConfigured,
  remoteBaseUrl,
  syncMode,
  onOpenSettings,
}: CloudDrawerHostProps) {
  const ctx = useQuickNotesContext()
  const drawer = useCloudDrawer()

  // 抽屉内部的冲突解决子流程
  const [conflictNote, setConflictNote] = useState<QuickNote | null>(null)
  const [conflictSnapshot, setConflictSnapshot] = useState<RemoteNoteSnapshot | null>(null)
  const [conflictLoading, setConflictLoading] = useState(false)

  if (!ctx) return null

  const { notes, pushingIds, pushNote, fetchRemoteSnapshot, startEdit, setEditContent } = ctx

  const handleResolve = async (note: QuickNote) => {
    setConflictNote(note)
    setConflictSnapshot(null)
    setConflictLoading(true)
    try {
      const snap = await fetchRemoteSnapshot(note.id)
      setConflictSnapshot(snap)
    } finally {
      setConflictLoading(false)
    }
  }
  const closeConflict = () => {
    setConflictNote(null)
    setConflictSnapshot(null)
  }
  const useLocal = async () => {
    if (!conflictNote) return
    await pushNote(conflictNote.id, 'force-push')
    closeConflict()
  }
  const useRemote = async () => {
    if (!conflictNote) return
    await pushNote(conflictNote.id, 'force-pull')
    closeConflict()
  }
  const mergeEdit = (mergedText: string) => {
    if (!conflictNote) return
    startEdit(conflictNote)
    setEditContent(mergedText)
    closeConflict()
    // 同时关闭灵感云抽屉，让用户回到首页编辑
    drawer.close()
  }

  // 时间格式化（与 QuickNotes 保持一致）
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)
    if (diffMin < 1) return '刚刚'
    if (diffMin < 60) return `${diffMin} 分钟前`
    if (diffHour < 24) return `${diffHour} 小时前`
    if (diffDay < 7) return `${diffDay} 天前`
    return date.toLocaleDateString()
  }

  return (
    <>
      <SyncCenterDrawer
        open={drawer.isOpen}
        notes={notes}
        pushingIds={pushingIds}
        remoteConfigured={remoteConfigured}
        remoteBaseUrl={remoteBaseUrl}
        syncMode={syncMode}
        onPush={(id) => pushNote(id)}
        onResolveConflict={handleResolve}
        onOpenSettings={onOpenSettings}
        onOpenIdeaRain={() => drawer.openRain()}
        onClose={drawer.close}
      />
      <ConflictResolverModal
        open={!!conflictNote}
        note={conflictNote}
        remoteSnapshot={conflictSnapshot}
        loading={conflictLoading}
        onClose={closeConflict}
        onUseLocal={useLocal}
        onUseRemote={useRemote}
        onMergeEdit={mergeEdit}
        formatTime={formatTime}
      />
    </>
  )
}
