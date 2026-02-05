import { useState, useCallback } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Bookmark } from '../types/bookmark';

interface UseDragAndDropOptions {
  bookmarks: Bookmark[];
  reorderBookmarks: (newOrder: Bookmark[]) => void;
}

export function useDragAndDrop({ bookmarks, reorderBookmarks }: UseDragAndDropOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeBookmark = activeId ? bookmarks.find(b => b.id === activeId) : null;

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 拖动 8px 后激活
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // VIBE CODING: 触觉反馈
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

        // VIBE CODING: 落地触觉反馈
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([5, 30, 5]);
        }
      }
    }
  }, [bookmarks, reorderBookmarks]);

  return {
    activeId,
    activeBookmark,
    sensors,
    handleDragStart,
    handleDragEnd,
  };
}
