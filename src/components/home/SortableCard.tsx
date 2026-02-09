import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 1,
    scale: isDragging ? 1.05 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    filter: isDragging ? 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.25))' : 'none',
    height: '100%', // 确保撑满 Grid 单元格高度
  };

  return (
    <div ref={setNodeRef} style={style} className={className} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default SortableCard;
