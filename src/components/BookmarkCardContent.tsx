import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Pin, BookMarked, Edit2, Trash2 } from "lucide-react";
import { Bookmark } from "../types/bookmark";
import { cn, getIconComponent } from "../lib/utils";

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
            (() => {
              const IconComp = getIconComponent(bookmark.icon);
              return (
                <IconComp
                  className={isLarge ? "w-7 h-7" : "w-6 h-6"}
                  style={{ color: "var(--color-primary)" }}
                />
              );
            })()
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
      <div className="flex-1">
        <h3
          className={cn(
            "font-medium mb-2",
            isLarge ? "text-xl line-clamp-2" : "text-lg line-clamp-1"
          )}
          style={{ color: "var(--color-text-primary)" }}
        >
          {bookmark.title}
        </h3>
        {bookmark.description && (
          <p
            className={cn(
              "mb-4",
              isLarge ? "text-base line-clamp-3" : "text-sm line-clamp-2"
            )}
            style={{ color: "var(--color-text-muted)" }}
          >
            {bookmark.description}
          </p>
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
