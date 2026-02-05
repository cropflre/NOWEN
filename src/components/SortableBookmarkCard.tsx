import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BookmarkCard } from './BookmarkCard'
import { Bookmark } from '../types/bookmark'

interface SortableBookmarkCardProps {
  bookmark: Bookmark
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
  onToggleReadLater?: (id: string) => void
  onMarkAsRead?: (id: string) => void
  isNew?: boolean
}

export function SortableBookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleReadLater,
  onMarkAsRead,
  isNew,
}: SortableBookmarkCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id })

  // VIBE CODING: 拖拽时的"悬浮感" - 卡片上浮、变亮、提升层级
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    // 拖拽时：不仅变透明，还要稍微放大，并提升层级
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 1,
    // 拖拽时稍微放大，增加"抓起"的感觉
    scale: isDragging ? 1.05 : 1,
    // 光标样式
    cursor: isDragging ? 'grabbing' : 'grab',
    // 拖拽时添加阴影，增强悬浮感
    filter: isDragging ? 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.25))' : 'none',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BookmarkCard
        bookmark={bookmark}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePin={onTogglePin}
        onToggleReadLater={onToggleReadLater}
        onMarkAsRead={onMarkAsRead}
        isDragging={isDragging}
        isNew={isNew}
      />
    </div>
  )
}
