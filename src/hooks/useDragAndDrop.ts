import { useState, useCallback, useRef } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Bookmark } from '../types/bookmark';

interface UseDragAndDropOptions {
  bookmarks: Bookmark[];
  reorderBookmarks: (newOrder: Bookmark[]) => void;
}

// DndContext measuring 配置：优化网格拖拽测量频率
export const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

export function useDragAndDrop({ bookmarks, reorderBookmarks }: UseDragAndDropOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeBookmark = activeId ? bookmarks.find(b => b.id === activeId) : null;

  // 拖拽传感器配置（桌面 Pointer + 移动端 Touch + 键盘无障碍）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  // 拖拽结束
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = bookmarks.findIndex(b => b.id === active.id);
      const newIndex = bookmarks.findIndex(b => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(bookmarks, oldIndex, newIndex);
        reorderBookmarks(newOrder);

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([5, 30, 5]);
        }
      }
    }
  }, [bookmarks, reorderBookmarks]);

  // 拖拽取消
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  return {
    activeId,
    activeBookmark,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    measuringConfig,
  };
}
