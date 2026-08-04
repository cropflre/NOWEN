import { useState, useCallback } from 'react';
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
  disabled?: boolean;
}

// Dense bookmark pages can contain hundreds of droppable nodes. MeasuringStrategy.Always
// causes dnd-kit to synchronously read every card rect during normal scroll/hover updates.
// Geometry is only needed after an actual drag starts, so keep the expensive measurement
// lifecycle scoped to the drag session.
export const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.WhileDragging,
  },
};

export function useDragAndDrop({ bookmarks, reorderBookmarks, disabled }: UseDragAndDropOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeBookmark = activeId ? bookmarks.find(b => b.id === activeId) : null;

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (disabled) return;
    setActiveId(event.active.id as string);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [disabled]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (disabled) return;

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
  }, [bookmarks, disabled, reorderBookmarks]);

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
