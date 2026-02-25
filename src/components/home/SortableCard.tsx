import React from 'react';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';

// 自定义 layoutChange 动画：拖拽时不触发 layout 动画，避免跳脱
const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) return false;
  return defaultAnimateLayoutChanges(args);
};

// ========== VIBE CODING: 可拖拽卡片包装器 ==========
interface SortableCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function SortableCard({ id, children, className }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, animateLayoutChanges });

  // 只使用 Translate（不含 scale），避免网格卡片抖动
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
    cursor: isDragging ? 'grabbing' : 'grab',
    position: 'relative',
    height: '100%',
    touchAction: 'manipulation',
  };

  return (
    <div ref={setNodeRef} style={style} className={className} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default SortableCard;
