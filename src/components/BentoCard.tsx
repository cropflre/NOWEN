import { motion } from 'framer-motion'
import { 
  ExternalLink, 
  Pin, 
  MoreHorizontal,
  Trash2,
  Edit2,
  BookMarked,
  GripVertical
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bookmark } from '../types/bookmark'
import { cn } from '../lib/utils'

interface BentoCardProps {
  bookmark: Bookmark
  size?: 'small' | 'medium' | 'large'
  isNew?: boolean
  isEditMode?: boolean
  onEdit?: (bookmark: Bookmark) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string) => void
  onToggleReadLater?: (id: string) => void
  onClick?: () => void
}

export function BentoCard({
  bookmark,
  size = 'medium',
  isNew,
  isEditMode,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleReadLater,
  onClick
}: BentoCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { t } = useTranslation()

  // 从 URL 提取域名和首字母
  const domain = new URL(bookmark.url).hostname.replace('www.', '')
  const initial = bookmark.title.charAt(0).toUpperCase()

  // 根据 favicon 生成 glow 颜色 (简化版，实际可以用 color-thief)
  const glowColor = bookmark.favicon ? 'rgba(102, 126, 234, 0.3)' : 'transparent'

  const handleClick = () => {
    if (!isEditMode) {
      window.open(bookmark.url, '_blank')
    }
    onClick?.()
  }

  // 小卡片 - 仅图标
  if (size === 'small') {
    return (
      <motion.div
        className={cn(
          "mini-card group",
          isNew && "pulse-new"
        )}
        style={{ '--glow-color': glowColor } as React.CSSProperties}
        onClick={handleClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title={bookmark.title}
      >
        {bookmark.favicon && !imageError ? (
          <img
            src={bookmark.favicon}
            alt=""
            className="w-7 h-7 object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <span 
            className="text-lg font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            {initial}
          </span>
        )}
        
        {/* Hover 时显示标题 */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="px-2 py-1 rounded-lg bg-black/90 text-white text-xs whitespace-nowrap">
            {bookmark.title}
          </div>
        </div>

        {/* 置顶标记 */}
        {bookmark.isPinned && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400" />
        )}
      </motion.div>
    )
  }

  // 中/大卡片
  return (
    <motion.div
      className={cn(
        "bento-card card-glow dynamic-glow group relative",
        size === 'large' ? 'col-span-2' : 'col-span-1',
        isNew && "pulse-new",
        isEditMode && "cursor-grab"
      )}
      style={{ '--glow-color': glowColor } as React.CSSProperties}
      layout
      onClick={handleClick}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className={cn(
        "p-5 h-full flex flex-col",
        size === 'large' && "p-6"
      )}>
        {/* 顶部 - 图标和操作 */}
        <div className="flex items-start justify-between mb-4">
          {/* 图标容器 */}
          <div className="relative">
            <div className={cn(
              "rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5",
              size === 'large' ? 'w-14 h-14' : 'w-11 h-11'
            )}>
              {bookmark.favicon && !imageError ? (
                <img
                  src={bookmark.favicon}
                  alt=""
                  className={cn(
                    "object-contain",
                    size === 'large' ? 'w-8 h-8' : 'w-6 h-6'
                  )}
                  onError={() => setImageError(true)}
                />
              ) : (
                <span 
                  className={cn(
                    "font-semibold",
                    size === 'large' ? 'text-xl' : 'text-base'
                  )}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {initial}
                </span>
              )}
            </div>
            
            {/* 置顶标记 */}
            {bookmark.isPinned && (
              <div className="absolute -top-1 -right-1">
                <Pin className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              </div>
            )}
          </div>

          {/* 操作菜单 */}
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: showMenu || isEditMode ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          >
            {isEditMode && (
              <div className="p-1.5 text-white/30 cursor-grab">
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTogglePin?.(bookmark.id)
              }}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                bookmark.isPinned 
                  ? "bg-yellow-500/20 text-yellow-400" 
                  : "hover:bg-white/10 text-white/40"
              )}
              title={bookmark.isPinned ? t('bookmark.unpin') : t('bookmark.pin')}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleReadLater?.(bookmark.id)
              }}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                bookmark.isReadLater 
                  ? "bg-orange-500/20 text-orange-400" 
                  : "hover:bg-white/10 text-white/40"
              )}
              title={bookmark.isReadLater ? t('bookmark.remove_read_later') : t('bookmark.read_later')}
            >
              <BookMarked className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(bookmark)
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"
              title={t('bookmark.edit')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(bookmark.id)
              }}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
              title={t('bookmark.delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          <h3 
            className={cn(
              "font-medium mb-1.5 line-clamp-1 group-hover:text-white transition-colors",
              size === 'large' ? 'text-lg' : 'text-base'
            )}
            style={{ color: 'var(--text-primary)' }}
          >
            {bookmark.title}
          </h3>
          
          {bookmark.description && (
            <p 
              className={cn(
                "text-sm leading-relaxed",
                size === 'large' ? 'line-clamp-2' : 'line-clamp-1'
              )}
              style={{ color: 'var(--text-muted)' }}
            >
              {bookmark.description}
            </p>
          )}
        </div>

        {/* 底部 - 域名 */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <span 
            className="text-xs truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {domain}
          </span>
          <ExternalLink 
            className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
