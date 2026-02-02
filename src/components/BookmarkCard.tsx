import { useState } from 'react'
import { motion } from 'framer-motion'
import { MoreHorizontal, Pin, Edit3, Trash2, ExternalLink, BookOpen, CheckCircle2 } from 'lucide-react'
import { Bookmark } from '../types/bookmark'
import { cn } from '../lib/utils'
import { getIconComponent } from '../lib/icons'

interface BookmarkCardProps {
  bookmark: Bookmark
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
  onToggleReadLater?: (id: string) => void
  onMarkAsRead?: (id: string) => void
  isDragging?: boolean
  isNew?: boolean
}

export function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleReadLater,
  onMarkAsRead,
  isDragging = false,
  isNew = false,
}: BookmarkCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleClick = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(8px)' }}
      animate={{ 
        opacity: isDragging ? 0.5 : 1, 
        scale: isDragging ? 1.05 : 1,
        y: 0,
        filter: 'blur(0px)',
      }}
      exit={{ opacity: 0, scale: 0.95, y: -15, filter: 'blur(8px)' }}
      // 1. 物理层：克制的浮起，保持重量感
      whileHover={{ 
        y: -4,         // 轻微浮起，不是跳跃
        scale: 1.01,   // 几乎不缩放，克制
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        layout: { duration: 0.3 }
      }}
      // 2. 视觉层：使用 vibe-card 全局能量类
      className={cn(
        'vibe-card vibe-card--glow group cursor-pointer',
        isDragging && 'shadow-2xl ring-2 ring-[var(--color-glow)]/30'
      )}
      onClick={handleClick}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* 3. 唤醒层：扫描光效 (Shimmer) - 像扫描指纹 */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0 overflow-hidden rounded-[inherit]">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent -translate-x-full group-hover:translate-x-full transition-transform ease-out"
          style={{ transitionDuration: '1.2s' }}
        />
      </div>

      {/* 新卡片高亮光环 */}
      {isNew && (
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ 
            opacity: [1, 0.5, 1, 0],
            scale: [1, 1.02, 1, 1],
          }}
          transition={{ duration: 2.5, times: [0, 0.3, 0.6, 1] }}
          className="absolute inset-0 rounded-2xl ring-2 ring-[var(--gradient-1)] ring-offset-2 ring-offset-transparent pointer-events-none"
          style={{
            boxShadow: '0 0 20px var(--gradient-1), inset 0 0 20px rgba(255,255,255,0.1)',
          }}
        />
      )}

      {/* 稍后阅读标记 - 右上角红点/书签带 */}
      {bookmark.isReadLater && !bookmark.isRead && (
        <div className="absolute top-0 right-4 z-10">
          <div className="w-6 h-8 bg-gradient-to-b from-orange-400 to-pink-500 rounded-b-sm shadow-lg flex items-end justify-center pb-1">
            <BookOpen className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {/* 已读标记 */}
      {bookmark.isRead && (
        <div className="absolute top-3 right-3 z-10">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        </div>
      )}

      {/* 置顶标识 */}
      {bookmark.isPinned && (
        <div className="absolute top-3 left-3 z-10">
          <Pin className="w-3.5 h-3.5 fill-current" style={{ color: 'var(--gradient-1)' }} />
        </div>
      )}

      {/* 操作菜单 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: showMenu ? 1 : 0,
          scale: showMenu ? 1 : 0.8,
        }}
        className={cn(
          "absolute top-3 z-20",
          bookmark.isReadLater ? "right-12" : "right-3"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <motion.button
            className={cn(
              'p-1.5 rounded-lg glass',
              'hover:bg-white/20 transition-colors'
            )}
            style={{ color: 'var(--text-secondary)' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>

          {/* 下拉菜单 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: showMenu ? 1 : 0, y: showMenu ? 0 : -10 }}
            className={cn(
              'absolute right-0 top-full mt-1 py-1 min-w-[140px]',
              'rounded-xl glass shadow-xl',
              'border border-white/10',
              showMenu ? 'pointer-events-auto' : 'pointer-events-none'
            )}
          >
            <button
              onClick={() => onTogglePin?.(bookmark.id)}
              className={cn(
                'w-full px-3 py-2 flex items-center gap-2',
                'text-sm text-left hover:bg-white/10 transition-colors'
              )}
              style={{ color: 'var(--text-secondary)' }}
            >
              <Pin className="w-4 h-4" />
              {bookmark.isPinned ? '取消置顶' : '置顶'}
            </button>
            
            <button
              onClick={() => onToggleReadLater?.(bookmark.id)}
              className={cn(
                'w-full px-3 py-2 flex items-center gap-2',
                'text-sm text-left hover:bg-white/10 transition-colors'
              )}
              style={{ color: 'var(--text-secondary)' }}
            >
              <BookOpen className="w-4 h-4" />
              {bookmark.isReadLater ? '移出稍后读' : '稍后阅读'}
            </button>

            {bookmark.isReadLater && (
              <button
                onClick={() => onMarkAsRead?.(bookmark.id)}
                className={cn(
                  'w-full px-3 py-2 flex items-center gap-2',
                  'text-sm text-left hover:bg-white/10 transition-colors'
                )}
                style={{ color: bookmark.isRead ? 'var(--text-muted)' : 'var(--text-secondary)' }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {bookmark.isRead ? '标记未读' : '标记已读'}
              </button>
            )}

            <button
              onClick={() => onEdit?.(bookmark)}
              className={cn(
                'w-full px-3 py-2 flex items-center gap-2',
                'text-sm text-left hover:bg-white/10 transition-colors'
              )}
              style={{ color: 'var(--text-secondary)' }}
            >
              <Edit3 className="w-4 h-4" />
              编辑
            </button>
            
            <div className="my-1 border-t border-white/5" />
            
            <button
              onClick={() => onDelete?.(bookmark.id)}
              className={cn(
                'w-full px-3 py-2 flex items-center gap-2',
                'text-sm text-left hover:bg-white/10 transition-colors text-red-400'
              )}
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* 4. 内容层：z-10 保证在光效之上 */}
      <div className="relative z-10 p-5">
        <div className="flex items-start gap-4">
          {/* Favicon/Icon - 图标微动：Hover 时轻轻摇晃，像是在对焦 */}
          <motion.div 
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-xl',
              'flex items-center justify-center',
              'bg-white/10 p-1.5'
            )}
            whileHover={{ 
              rotate: [0, -5, 5, -3, 0], 
              transition: { duration: 0.5, ease: 'easeInOut' } 
            }}
          >
            {bookmark.iconUrl ? (
              <img
                src={bookmark.iconUrl}
                alt=""
                className="w-full h-full object-contain rounded-lg"
                onError={() => setImageError(true)}
              />
            ) : bookmark.icon ? (
              (() => {
                const IconComp = getIconComponent(bookmark.icon)
                return <IconComp className="w-7 h-7" style={{ color: 'var(--gradient-1)' }} />
              })()
            ) : bookmark.favicon && !imageError ? (
              <img
                src={bookmark.favicon}
                alt=""
                className="w-full h-full object-contain rounded-lg"
                onError={() => setImageError(true)}
              />
            ) : (
              <span 
                className="text-xl font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                {bookmark.title.charAt(0).toUpperCase()}
              </span>
            )}
          </motion.div>

          {/* 文本内容 */}
          <div className="flex-1 min-w-0">
            <h3 
              className="font-medium text-base truncate flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {bookmark.title}
              <ExternalLink 
                className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" 
              />
            </h3>
            {bookmark.description && (
              <p 
                className="mt-1 text-sm card-desc"
                style={{ color: 'var(--text-muted)' }}
              >
                {bookmark.description}
              </p>
            )}
            <p 
              className="mt-2 text-xs truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              {new URL(bookmark.url).hostname}
            </p>
          </div>
        </div>
      </div>

      {/* 悬停时的边框增强光效 */}
      <div className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        {/* 顶部高光线 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        {/* 底部能量反光 */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--color-glow)]/10 to-transparent rounded-b-[inherit]" />
      </div>
    </motion.div>
  )
}

// 骨架屏组件
export function BookmarkCardSkeleton() {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-3/4 rounded skeleton" />
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-3 w-1/3 rounded skeleton" />
        </div>
      </div>
    </div>
  )
}
