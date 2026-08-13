import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';

// 排序位置只在真实拖拽期间通过 transform 表达。分页、筛选、监控数据刷新等
// 普通 React 更新不再触发 dnd-kit 的默认布局测量与过渡。
const animateLayoutChanges: AnimateLayoutChanges = () => false;

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

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? transition || undefined : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
    cursor: isDragging ? 'grabbing' : 'grab',
    position: 'relative',
    height: '100%',
    touchAction: 'manipulation',
    contain: isDragging ? undefined : 'layout paint style',
  };

  return (
    <div ref={setNodeRef} style={style} className={className} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default SortableCard;
