import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, Plus, Edit3 } from 'lucide-react'
import { HeroCard } from './HeroCard'
import { BentoCard } from './BentoCard'
import { Bookmark, Category } from '../types/bookmark'
import { cn } from '../lib/utils'

interface BentoGridProps {
  bookmarks: Bookmark[]
  categories: Category[]
  isLoading: boolean
  newlyAddedId: string | null
  isEditMode: boolean
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  onToggleReadLater: (id: string) => void
  onMarkAsRead: (id: string) => void
  onReorder: (bookmarks: Bookmark[]) => void
  onAddNew: () => void
}

// 可排序的卡片包装器
function SortableBentoCard({ bookmark, ...props }: { bookmark: Bookmark } & Omit<React.ComponentProps<typeof BentoCard>, 'bookmark'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BentoCard bookmark={bookmark} {...props} />
    </div>
  )
}

export function BentoGrid({
  bookmarks,
  categories,
  isLoading,
  newlyAddedId,
  isEditMode,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleReadLater,
  onMarkAsRead,
  onReorder,
  onAddNew,
}: BentoGridProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // 获取稍后阅读的第一个书签作为 Hero
  const readLaterBookmarks = bookmarks.filter(b => b.isReadLater && !b.isRead)
  const heroBookmark = readLaterBookmarks[0] || null

  // 按分类分组书签
  const pinnedBookmarks = bookmarks.filter(b => b.isPinned && !b.isReadLater)
  // 所有非稍后阅读的书签（包括置顶的）
  const allBookmarks = bookmarks.filter(b => !b.isReadLater)
  
  // 高频书签 (置顶的) - 显示所有置顶书签
  const frequentBookmarks = pinnedBookmarks
  
  // 快捷访问 (小图标) - 非置顶的前12个
  const quickAccessBookmarks = allBookmarks.filter(b => !b.isPinned).slice(0, 12)

  // 按分类分组书签（包含置顶书签，置顶优先排序）
  const bookmarksByCategory = categories.reduce((acc, category) => {
    const categoryBookmarks = allBookmarks.filter(b => b.category === category.id)
    // 置顶的排在前面
    acc[category.id] = categoryBookmarks.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return a.orderIndex - b.orderIndex
    })
    return acc
  }, {} as Record<string, Bookmark[]>)

  const uncategorizedBookmarks = allBookmarks.filter(b => !b.category)

  // 处理拖拽结束
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = bookmarks.findIndex(b => b.id === active.id)
    const newIndex = bookmarks.findIndex(b => b.id === over.id)
    
    const reordered = arrayMove(bookmarks, oldIndex, newIndex)
    onReorder(reordered)
  }, [bookmarks, onReorder])

  // 骨架屏
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Hero 骨架 */}
        <div className="hero-card h-[200px] animate-pulse">
          <div className="flex h-full p-8">
            <div className="hidden md:block w-1/3 bg-white/5 rounded-2xl" />
            <div className="flex-1 md:pl-8 space-y-4">
              <div className="h-6 w-24 bg-white/5 rounded-full" />
              <div className="h-10 w-3/4 bg-white/5 rounded-xl" />
              <div className="h-4 w-full bg-white/5 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Grid 骨架 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bento-card h-40 animate-pulse">
              <div className="p-5 space-y-4">
                <div className="w-11 h-11 bg-white/5 rounded-2xl" />
                <div className="h-5 w-3/4 bg-white/5 rounded-lg" />
                <div className="h-3 w-full bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-12">
        {/* Hero Card - 稍后阅读 */}
        <section>
          <HeroCard 
            bookmark={heroBookmark} 
            onMarkRead={onMarkAsRead}
          />
        </section>

        {/* 高频访问 - 大卡片 */}
        {frequentBookmarks.length > 0 && (
          <section className="relative">
            {/* 背景装饰字 */}
            <div className="section-title-bg">Pinned</div>
            
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-xl font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                常用
              </h2>
            </div>

            <SortableContext items={frequentBookmarks.map(b => b.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {frequentBookmarks.map((bookmark, index) => (
                  <SortableBentoCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    size={index === 0 ? 'large' : 'medium'}
                    isNew={bookmark.id === newlyAddedId}
                    isEditMode={isEditMode}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onTogglePin={onTogglePin}
                    onToggleReadLater={onToggleReadLater}
                  />
                ))}
              </div>
            </SortableContext>
          </section>
        )}

        {/* 快捷访问 - 小图标 */}
        {quickAccessBookmarks.length > 0 && (
          <section className="relative">
            <div className="section-title-bg">Quick</div>
            
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-xl font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                快捷访问
              </h2>
              <button
                onClick={onAddNew}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">添加</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {quickAccessBookmarks.map((bookmark) => (
                <BentoCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  size="small"
                  isNew={bookmark.id === newlyAddedId}
                  isEditMode={isEditMode}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onTogglePin={onTogglePin}
                  onToggleReadLater={onToggleReadLater}
                />
              ))}
              
              {/* 添加按钮 */}
              <motion.button
                className="mini-card border-dashed border-2 border-white/10 hover:border-white/20"
                onClick={onAddNew}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </motion.button>
            </div>
          </section>
        )}

        {/* 分类书签 */}
        {categories.map((category) => {
          const categoryBookmarks = bookmarksByCategory[category.id] || []
          if (categoryBookmarks.length === 0) return null

          const isExpanded = expandedCategory === category.id
          const displayBookmarks = isExpanded ? categoryBookmarks : categoryBookmarks.slice(0, 4)

          return (
            <section key={category.id} className="relative">
              <div className="section-title-bg">{category.name}</div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h2 
                    className="text-xl font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {category.name}
                  </h2>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {categoryBookmarks.length}
                  </span>
                </div>
                
                {categoryBookmarks.length > 4 && (
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="text-sm">{isExpanded ? '收起' : '查看全部'}</span>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                  </button>
                )}
              </div>

              <SortableContext items={displayBookmarks.map(b => b.id)} strategy={rectSortingStrategy}>
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                  layout
                >
                  <AnimatePresence>
                    {displayBookmarks.map((bookmark) => (
                      <SortableBentoCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        size="medium"
                        isNew={bookmark.id === newlyAddedId}
                        isEditMode={isEditMode}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onTogglePin={onTogglePin}
                        onToggleReadLater={onToggleReadLater}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </SortableContext>
            </section>
          )
        })}

        {/* 未分类书签 */}
        {uncategorizedBookmarks.length > 0 && (
          <section className="relative">
            <div className="section-title-bg">Others</div>
            
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-xl font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                其他
              </h2>
            </div>

            <SortableContext items={uncategorizedBookmarks.map(b => b.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {uncategorizedBookmarks.map((bookmark) => (
                  <SortableBentoCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    size="medium"
                    isNew={bookmark.id === newlyAddedId}
                    isEditMode={isEditMode}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onTogglePin={onTogglePin}
                    onToggleReadLater={onToggleReadLater}
                  />
                ))}
              </div>
            </SortableContext>
          </section>
        )}

        {/* 空状态 */}
        {bookmarks.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Edit3 className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 
              className="text-2xl font-serif mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              开始你的数字花园
            </h3>
            <p 
              className="mb-8 max-w-md mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              按 ⌘K 打开命令面板，粘贴链接即可添加你的第一个书签
            </p>
            <motion.button
              onClick={onAddNew}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[var(--gradient-1)] to-[var(--gradient-2)] text-white font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              添加第一个书签
            </motion.button>
          </motion.div>
        )}
      </div>
    </DndContext>
  )
}
