import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Pin, BookMarked, Edit2, Trash2 } from "lucide-react";
import { Bookmark } from "../types/bookmark";
import { cn } from "../lib/utils";
import { IconRenderer } from "./IconRenderer";

// 标签颜色
const TAG_COLORS = [
  { bg: 'rgba(59,130,246,0.12)',  text: 'rgb(96,165,250)',  border: 'rgba(59,130,246,0.25)' },
  { bg: 'rgba(16,185,129,0.12)',  text: 'rgb(52,211,153)',  border: 'rgba(16,185,129,0.25)' },
  { bg: 'rgba(245,158,11,0.12)',  text: 'rgb(251,191,36)',  border: 'rgba(245,158,11,0.25)' },
  { bg: 'rgba(239,68,68,0.12)',   text: 'rgb(248,113,113)', border: 'rgba(239,68,68,0.25)' },
  { bg: 'rgba(139,92,246,0.12)',  text: 'rgb(167,139,250)', border: 'rgba(139,92,246,0.25)' },
  { bg: 'rgba(236,72,153,0.12)',  text: 'rgb(244,114,182)', border: 'rgba(236,72,153,0.25)' },
  { bg: 'rgba(6,182,212,0.12)',   text: 'rgb(34,211,238)',  border: 'rgba(6,182,212,0.25)' },
  { bg: 'rgba(132,204,22,0.12)',  text: 'rgb(163,230,53)',  border: 'rgba(132,204,22,0.25)' },
]
function getTagColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export interface BookmarkCardContentProps {
  bookmark: Bookmark;
  isLarge?: boolean;
  isNew?: boolean;
  isLoggedIn?: boolean;
  onTogglePin: () => void;
  onToggleReadLater: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function BookmarkCardContent({
  bookmark,
  isLarge,
  isNew,
  isLoggedIn,
  onTogglePin,
  onToggleReadLater,
  onEdit,
  onDelete,
}: BookmarkCardContentProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="h-full flex flex-col"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "rounded-xl flex items-center justify-center",
            isLarge ? "w-14 h-14" : "w-12 h-12"
          )}
          style={{ background: "var(--color-bg-tertiary)" }}
        >
          {bookmark.iconUrl ? (
            <img
              src={bookmark.iconUrl}
              alt=""
              className={cn(isLarge ? "w-7 h-7" : "w-6 h-6", "object-contain")}
            />
          ) : bookmark.icon ? (
            <IconRenderer
              icon={bookmark.icon}
              className={isLarge ? "w-7 h-7" : "w-6 h-6"}
              style={{ color: "var(--color-primary)" }}
            />
          ) : bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt=""
              className={isLarge ? "w-7 h-7" : "w-6 h-6"}
            />
          ) : (
            <ExternalLink
              className={cn(isLarge ? "w-7 h-7" : "w-6 h-6")}
              style={{ color: "var(--color-text-muted)" }}
            />
          )}
        </div>

        {/* Actions - 只有登录后才显示 */}
        <AnimatePresence>
          {showActions && isLoggedIn && (
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  bookmark.isPinned
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "hover:bg-[var(--color-glass-hover)]"
                )}
                style={{
                  color: bookmark.isPinned
                    ? undefined
                    : "var(--color-text-muted)",
                }}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleReadLater();
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  bookmark.isReadLater
                    ? "bg-orange-500/20 text-orange-400"
                    : "hover:bg-[var(--color-glass-hover)]"
                )}
                style={{
                  color: bookmark.isReadLater
                    ? undefined
                    : "var(--color-text-muted)",
                }}
              >
                <BookMarked className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <h3
          className={cn(
            "font-medium mb-2",
            isLarge ? "text-xl line-clamp-2" : "text-lg line-clamp-1"
          )}
          style={{ color: "var(--color-text-primary)" }}
        >
          {bookmark.title}
        </h3>
        {/* 描述区域 - 固定高度保持对齐 */}
        <p
          className={cn(
            "flex-1",
            isLarge ? "text-base line-clamp-3" : "text-sm line-clamp-2"
          )}
          style={{ 
            color: "var(--color-text-muted)",
            minHeight: isLarge ? '4.5rem' : '2.5rem',
          }}
        >
          {bookmark.description || ''}
        </p>
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {bookmark.tags.slice(0, 3).map(tag => {
              const color = getTagColor(tag)
              return (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded-md text-[10px] leading-tight font-medium truncate max-w-[80px]"
                  style={{
                    background: color.bg,
                    color: color.text,
                    border: `1px solid ${color.border}`,
                  }}
                  title={tag}
                >
                  #{tag}
                </span>
              )
            })}
            {bookmark.tags.length > 3 && (
              <span
                className="px-1.5 py-0.5 rounded-md text-[10px] leading-tight font-medium"
                style={{ 
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-bg-tertiary)',
                }}
              >
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between text-xs pt-4"
        style={{
          color: "var(--color-text-muted)",
          borderTop: "1px solid var(--color-border-light)",
        }}
      >
        <span>{new URL(bookmark.url).hostname}</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </div>

      {/* New Badge */}
      {isNew && (
        <motion.div
          className="absolute top-3 right-3 px-2 py-1 rounded-full bg-nebula-cyan/20 text-nebula-cyan text-xs"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
        >
          NEW
        </motion.div>
      )}
    </div>
  );
}
