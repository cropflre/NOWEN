import { useState, useEffect, useCallback, useRef } from 'react'
import { notesApi, QuickNote } from '../lib/api'

interface UseQuickNotesReturn {
  notes: QuickNote[]
  loading: boolean
  creating: boolean
  editingId: string | null
  editContent: string
  addNote: (content: string) => Promise<void>
  startEdit: (note: QuickNote) => void
  cancelEdit: () => void
  saveEdit: () => Promise<void>
  deleteNote: (id: string) => Promise<void>
  setEditContent: (content: string) => void
  refresh: () => Promise<void>
}

export function useQuickNotes(): UseQuickNotesReturn {
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // 自动保存定时器
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedContentRef = useRef('')

  // 加载灵感速记
  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const data = await notesApi.list()
      setNotes(data)
    } catch (err) {
      console.error('加载灵感速记失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    refresh()
  }, [refresh])

  // 自动保存编辑中的内容（1.5秒防抖）
  useEffect(() => {
    if (!editingId || !editContent.trim() || editContent === lastSavedContentRef.current) {
      return
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const updated = await notesApi.update(editingId, editContent.trim())
        lastSavedContentRef.current = editContent
        setNotes(prev => prev.map(n => n.id === editingId ? updated : n))
      } catch (err) {
        console.error('自动保存失败:', err)
      }
    }, 1500)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [editingId, editContent])

  // 创建灵感速记
  const addNote = useCallback(async (content: string) => {
    if (!content.trim()) return
    try {
      setCreating(true)
      const note = await notesApi.create(content.trim())
      setNotes(prev => [note, ...prev])
    } catch (err) {
      console.error('创建灵感速记失败:', err)
      throw err
    } finally {
      setCreating(false)
    }
  }, [])

  // 开始编辑
  const startEdit = useCallback((note: QuickNote) => {
    setEditingId(note.id)
    setEditContent(note.content)
    lastSavedContentRef.current = note.content
  }, [])

  // 取消编辑
  const cancelEdit = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    setEditingId(null)
    setEditContent('')
    lastSavedContentRef.current = ''
  }, [])

  // 手动保存编辑
  const saveEdit = useCallback(async () => {
    if (!editingId || !editContent.trim()) return
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    try {
      const updated = await notesApi.update(editingId, editContent.trim())
      setNotes(prev => prev.map(n => n.id === editingId ? updated : n))
      lastSavedContentRef.current = editContent
      setEditingId(null)
      setEditContent('')
    } catch (err) {
      console.error('保存灵感速记失败:', err)
      throw err
    }
  }, [editingId, editContent])

  // 删除灵感速记
  const deleteNote = useCallback(async (id: string) => {
    try {
      await notesApi.delete(id)
      setNotes(prev => prev.filter(n => n.id !== id))
      if (editingId === id) {
        cancelEdit()
      }
    } catch (err) {
      console.error('删除灵感速记失败:', err)
      throw err
    }
  }, [editingId, cancelEdit])

  return {
    notes,
    loading,
    creating,
    editingId,
    editContent,
    addNote,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteNote,
    setEditContent,
    refresh,
  }
}
