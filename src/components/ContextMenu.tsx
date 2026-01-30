import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Trash2, Pin, BookMarked, ExternalLink, Copy } from 'lucide-react'
import { cn } from '../lib/utils'

interface ContextMenuItem {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
  active?: boolean
  divider?: boolean
}

interface ContextMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  onClose: () => void
  items: ContextMenuItem[]
}

export function ContextMenu({ isOpen, position, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleScroll = () => onClose()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('scroll', handleScroll, true)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // 调整菜单位置，防止超出视口
  const getAdjustedPosition = () => {
    if (!menuRef.current) return position

    const menuRect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = position.x
    let y = position.y

    // 右边界检测
    if (x + menuRect.width > viewportWidth - 10) {
      x = viewportWidth - menuRect.width - 10
    }

    // 底部边界检测
    if (y + menuRect.height > viewportHeight - 10) {
      y = viewportHeight - menuRect.height - 10
    }

    return { x, y }
  }

  const adjustedPosition = isOpen ? getAdjustedPosition() : position

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[100] min-w-[180px] py-2 rounded-xl bg-[#1a1a24]/95 backdrop-blur-xl border border-white/10 shadow-2xl"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
        >
          {items.map((item, index) => (
            <div key={item.id}>
              {item.divider && index > 0 && (
                <div className="my-1.5 mx-3 border-t border-white/10" />
              )}
              <button
                onClick={() => {
                  item.onClick()
                  onClose()
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : item.active
                    ? 'text-nebula-cyan hover:bg-nebula-cyan/10'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <span className={cn(
                  'w-4 h-4',
                  item.active && 'text-nebula-cyan'
                )}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 书签右键菜单的 Hook
export function useBookmarkContextMenu() {
  return {
    getMenuItems: (
      bookmark: { id: string; url: string; isPinned?: boolean; isReadLater?: boolean },
      options: {
        onEdit: () => void
        onDelete: () => void
        onTogglePin: () => void
        onToggleReadLater: () => void
      }
    ): ContextMenuItem[] => [
      {
        id: 'open',
        label: '在新标签页打开',
        icon: <ExternalLink className="w-4 h-4" />,
        onClick: () => window.open(bookmark.url, '_blank'),
      },
      {
        id: 'copy',
        label: '复制链接',
        icon: <Copy className="w-4 h-4" />,
        onClick: () => {
          navigator.clipboard.writeText(bookmark.url)
        },
      },
      {
        id: 'pin',
        label: bookmark.isPinned ? '取消置顶' : '置顶',
        icon: <Pin className="w-4 h-4" />,
        onClick: options.onTogglePin,
        active: bookmark.isPinned,
        divider: true,
      },
      {
        id: 'readLater',
        label: bookmark.isReadLater ? '取消稍后阅读' : '稍后阅读',
        icon: <BookMarked className="w-4 h-4" />,
        onClick: options.onToggleReadLater,
        active: bookmark.isReadLater,
      },
      {
        id: 'edit',
        label: '编辑',
        icon: <Edit2 className="w-4 h-4" />,
        onClick: options.onEdit,
        divider: true,
      },
      {
        id: 'delete',
        label: '删除',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: options.onDelete,
        danger: true,
      },
    ],
  }
}
