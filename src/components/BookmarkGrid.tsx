import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useState } from 'react'
import { SortableBookmarkCard } from './SortableBookmarkCard'
import { BookmarkCard, BookmarkCardSkeleton } from './BookmarkCard'
import { Bookmark, Category } from '../types/bookmark'
import { Folder, Clock } from 'lucide-react'
import { cn, getIconComponent } from '../lib/utils'

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  categories: Category[]
  isLoading?: boolean
  newlyAddedId?: string | null
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
  onToggleReadLater?: (id: string) => void
  onMarkAsRead?: (id: string) => void
  onReorder?: (bookmarks: Bookmark[]) => void
}

export function BookmarkGrid({
  bookmarks,
  categories,
  isLoading = false,
  newlyAddedId,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleReadLater,
  onMarkAsRead,
  onReorder,
}: BookmarkGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 按分类分组书签
  const groupedBookmarks = useMemo(() => {
    const groups: Record<string, Bookmark[]> = {}
    
    categories.forEach(cat => {
      groups[cat.id] = []
    })
    groups['uncategorized'] = []

    bookmarks.forEach(bookmark => {
      const catId = bookmark.category || 'uncategorized'
      if (!groups[catId]) groups[catId] = []
      groups[catId].push(bookmark)
    })

    return groups
  }, [bookmarks, categories])

  // 稍后阅读书签
  const readLaterBookmarks = useMemo(() => {
    return bookmarks.filter(b => b.isReadLater && !b.isRead)
  }, [bookmarks])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = bookmarks.findIndex(b => b.id === active.id)
      const newIndex = bookmarks.findIndex(b => b.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(bookmarks, oldIndex, newIndex)
        onReorder?.(newOrder)
      }
    }
  }

  const activeBookmark = activeId 
    ? bookmarks.find(b => b.id === activeId) 
    : null

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <BookmarkCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const renderBookmarkCard = (bookmark: Bookmark) => (
    <SortableBookmarkCard
      key={bookmark.id}
      bookmark={bookmark}
      onEdit={onEdit}
      onDelete={onDelete}
      onTogglePin={onTogglePin}
      onToggleReadLater={onToggleReadLater}
      onMarkAsRead={onMarkAsRead}
      isNew={bookmark.id === newlyAddedId}
    />
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-10">
        {/* 稍后阅读区域 */}
        {readLaterBookmarks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div 
                className="p-2 rounded-lg glass"
                style={{ color: '#f97316' }}
              >
                <Clock className="w-4 h-4" />
              </div>
              <h2 
                className="text-lg font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                稍后阅读
              </h2>
              <span 
                className="text-sm px-2 py-0.5 rounded-full glass"
                style={{ color: 'var(--text-muted)' }}
              >
                {readLaterBookmarks.length}
              </span>
            </div>

            <SortableContext
              items={readLaterBookmarks.map(b => b.id)}
              strategy={rectSortingStrategy}
            >
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence mode="popLayout">
                  {readLaterBookmarks.map(renderBookmarkCard)}
                </AnimatePresence>
              </motion.div>
            </SortableContext>
          </motion.section>
        )}

        {/* 分类区域 */}
        {categories.map(category => {
          const categoryBookmarks = (groupedBookmarks[category.id] || [])
            .filter(b => !b.isReadLater || b.isRead) // 排除未读的稍后阅读
          if (categoryBookmarks.length === 0) return null

          return (
            <motion.section
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* 分类标题 */}
              <div className="flex items-center gap-3 mb-5">
                <div 
                  className={cn(
                    'p-2 rounded-lg glass'
                  )}
                  style={{ color: category.color }}
                >
                  {(() => {
                    const IconComp = getIconComponent(category.icon)
                    return <IconComp className="w-4 h-4" />
                  })()}
                </div>
                <h2 
                  className="text-lg font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {category.name}
                </h2>
                <span 
                  className="text-sm px-2 py-0.5 rounded-full glass"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {categoryBookmarks.length}
                </span>
              </div>

              {/* 书签网格 */}
              <SortableContext
                items={categoryBookmarks.map(b => b.id)}
                strategy={rectSortingStrategy}
              >
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  <AnimatePresence mode="popLayout">
                    {categoryBookmarks.map(renderBookmarkCard)}
                  </AnimatePresence>
                </motion.div>
              </SortableContext>
            </motion.section>
          )
        })}

        {/* 未分类书签 */}
        {groupedBookmarks['uncategorized']?.filter(b => !b.isReadLater || b.isRead).length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg glass" style={{ color: 'var(--text-muted)' }}>
                <Folder className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                未分类
              </h2>
              <span 
                className="text-sm px-2 py-0.5 rounded-full glass"
                style={{ color: 'var(--text-muted)' }}
              >
                {groupedBookmarks['uncategorized'].filter(b => !b.isReadLater || b.isRead).length}
              </span>
            </div>

            <SortableContext
              items={groupedBookmarks['uncategorized'].filter(b => !b.isReadLater || b.isRead).map(b => b.id)}
              strategy={rectSortingStrategy}
            >
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence mode="popLayout">
                  {groupedBookmarks['uncategorized']
                    .filter(b => !b.isReadLater || b.isRead)
                    .map(renderBookmarkCard)}
                </AnimatePresence>
              </motion.div>
            </SortableContext>
          </motion.section>
        )}
      </div>

      {/* 拖拽覆盖层 */}
      <DragOverlay>
        {activeBookmark && (
          <BookmarkCard
            bookmark={activeBookmark}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
