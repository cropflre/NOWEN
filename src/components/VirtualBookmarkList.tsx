import { useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ExternalLink,
  Pin,
  BookMarked,
  Trash2,
  Edit2,
  Check,
  Sparkles,
} from 'lucide-react'
import { Bookmark, Category } from '../types/bookmark'
import { cn } from '../lib/utils'
import { IconRenderer } from './IconRenderer'
import { useNetworkEnv, getBookmarkUrl } from '../hooks/useNetworkEnv'

interface VirtualBookmarkListProps {
  bookmarks: Bookmark[]
  categories: Category[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onTogglePin: (id: string) => void
  onToggleReadLater: (id: string) => void
  onUpdateBookmark: (id: string, updates: Partial<Bookmark>) => void
  onEditBookmark: (bookmark: Bookmark) => void
  onDeleteBookmark: (id: string) => void
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void
}

// 每行高度
const ROW_HEIGHT = 68

export function VirtualBookmarkList({
  bookmarks,
  categories,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onTogglePin,
  onToggleReadLater,
  onUpdateBookmark,
  onEditBookmark,
  onDeleteBookmark,
  showToast,
}: VirtualBookmarkListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { isInternal } = useNetworkEnv()

  const virtualizer = useVirtualizer({
    count: bookmarks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5, // 预渲染上下各5行
  })

  const virtualItems = virtualizer.getVirtualItems()

  const renderBookmarkRow = useCallback((bookmark: Bookmark, index: number) => {
    return (
      <div
        className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_auto_auto] gap-4 px-5 py-4 items-center transition-colors group hover:bg-[var(--color-glass-hover)]"
        style={{
          borderBottom: '1px solid var(--color-border-light)',
        }}
      >
        {/* Checkbox */}
        <button
          onClick={() => onToggleSelect(bookmark.id)}
          className={cn(
            'w-5 h-5 rounded border flex items-center justify-center transition-all',
            selectedIds.has(bookmark.id) ? 'text-white' : ''
          )}
          style={{
            background: selectedIds.has(bookmark.id) ? 'var(--color-primary)' : 'transparent',
            borderColor: selectedIds.has(bookmark.id) ? 'var(--color-primary)' : 'var(--color-border)',
          }}
        >
          {selectedIds.has(bookmark.id) && <Check className="w-3 h-3" />}
        </button>

        {/* Bookmark Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            {bookmark.iconUrl ? (
              <img src={bookmark.iconUrl} alt="" className="w-5 h-5 rounded object-contain" loading="lazy" />
            ) : bookmark.icon ? (
              <IconRenderer icon={bookmark.icon} className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            ) : bookmark.favicon ? (
              <img src={bookmark.favicon} alt="" className="w-5 h-5 rounded" loading="lazy" />
            ) : (
              <ExternalLink className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
              {bookmark.title}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
              {(() => {
                try {
                  return new URL(bookmark.url).hostname
                } catch {
                  return bookmark.url
                }
              })()}
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="hidden sm:block">
          <select
            value={bookmark.category || ''}
            onChange={e => onUpdateBookmark(bookmark.id, { 
              category: e.target.value || undefined 
            })}
            className="appearance-none px-3 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer transition-colors"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-glass-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <option value="" style={{ background: 'var(--color-bg-secondary)' }}>未分类</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id} style={{ background: 'var(--color-bg-secondary)' }}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTogglePin(bookmark.id)}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              bookmark.isPinned 
                ? 'bg-yellow-500/20 text-yellow-400' 
                : 'hover:bg-[var(--color-glass-hover)]'
            )}
            style={{ color: bookmark.isPinned ? undefined : 'var(--color-text-muted)' }}
            title="置顶"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleReadLater(bookmark.id)}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              bookmark.isReadLater 
                ? 'bg-orange-500/20 text-orange-400' 
                : 'hover:bg-[var(--color-glass-hover)]'
            )}
            style={{ color: bookmark.isReadLater ? undefined : 'var(--color-text-muted)' }}
            title="稍后阅读"
          >
            <BookMarked className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => window.open(getBookmarkUrl(bookmark, isInternal), '_blank')}
            className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
            style={{ color: 'var(--color-text-muted)' }}
            title="打开链接"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEditBookmark(bookmark)}
            className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
            style={{ color: 'var(--color-text-muted)' }}
            title="编辑"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm('确定删除这个书签？')) {
                onDeleteBookmark(bookmark.id)
                showToast('success', '书签已删除')
              }
            }}
            className="p-1.5 rounded-lg hover:text-red-400 hover:bg-red-500/10 transition-all"
            style={{ color: 'var(--color-text-muted)' }}
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }, [categories, selectedIds, onToggleSelect, onTogglePin, onToggleReadLater, onUpdateBookmark, onEditBookmark, onDeleteBookmark, showToast])

  // 空状态
  if (bookmarks.length === 0) {
    return (
      <div 
        className="rounded-2xl overflow-hidden backdrop-blur-sm"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        <div className="px-4 py-16 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <p style={{ color: 'var(--color-text-muted)' }}>暂无书签</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="rounded-2xl overflow-hidden backdrop-blur-sm"
      style={{
        background: 'var(--color-glass)',
        border: '1px solid var(--color-glass-border)',
      }}
    >
      {/* Table Header */}
      <div 
        className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_auto_auto] gap-4 px-5 py-4 text-sm font-medium"
        style={{
          background: 'var(--color-bg-tertiary)',
          borderBottom: '1px solid var(--color-glass-border)',
          color: 'var(--color-text-muted)',
        }}
      >
        <button
          onClick={onSelectAll}
          className={cn(
            'w-5 h-5 rounded border flex items-center justify-center transition-all',
            selectedIds.size === bookmarks.length && bookmarks.length > 0
              ? 'text-white'
              : ''
          )}
          style={{
            background: selectedIds.size === bookmarks.length && bookmarks.length > 0 
              ? 'var(--color-primary)' 
              : 'transparent',
            borderColor: selectedIds.size === bookmarks.length && bookmarks.length > 0 
              ? 'var(--color-primary)' 
              : 'var(--color-border)',
          }}
        >
          {selectedIds.size === bookmarks.length && bookmarks.length > 0 && (
            <Check className="w-3 h-3" />
          )}
        </button>
        <span>书签</span>
        <span className="hidden sm:block">分类</span>
        <span>状态</span>
        <span>操作</span>
      </div>

      {/* Virtual Scrolling Container */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          height: Math.min(bookmarks.length * ROW_HEIGHT, 500), // 最大高度500px
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const bookmark = bookmarks[virtualRow.index]
            return (
              <div
                key={bookmark.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {renderBookmarkRow(bookmark, virtualRow.index)}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer with count */}
      <div 
        className="px-5 py-3 text-xs text-center"
        style={{
          background: 'var(--color-bg-tertiary)',
          borderTop: '1px solid var(--color-glass-border)',
          color: 'var(--color-text-muted)',
        }}
      >
        共 {bookmarks.length} 个书签
        {bookmarks.length > 50 && ' (已启用虚拟滚动优化)'}
      </div>
    </div>
  )
}
