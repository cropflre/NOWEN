import React from 'react';
import { motion } from 'framer-motion';
import { DragOverlay } from '@dnd-kit/core';
import { ExternalLink } from 'lucide-react';
import { SpotlightCard } from '../ui/spotlight-card';
import { Bookmark } from '../../types/bookmark';
import { IconRenderer } from '../IconRenderer';

interface BookmarkDragOverlayProps {
  activeBookmark: Bookmark | null | undefined;
}

export function BookmarkDragOverlay({ activeBookmark }: BookmarkDragOverlayProps) {
  if (!activeBookmark) return null;

  return (
    <DragOverlay>
      <div className="opacity-80 scale-105 shadow-2xl">
        <SpotlightCard className="h-full cursor-grabbing" spotlightColor="rgba(99, 102, 241, 0.2)">
          <div className="flex flex-col h-full">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'var(--color-bg-tertiary)' }}
            >
              {activeBookmark.iconUrl ? (
                <img src={activeBookmark.iconUrl} alt="" className="w-5 h-5 object-contain" />
              ) : activeBookmark.icon ? (
                <IconRenderer icon={activeBookmark.icon} className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              ) : activeBookmark.favicon ? (
                <img src={activeBookmark.favicon} alt="" className="w-5 h-5" />
              ) : (
                <ExternalLink className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
              )}
            </div>
            <h3
              className="font-medium line-clamp-1 mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {activeBookmark.title}
            </h3>
            <p className="text-sm line-clamp-2 flex-1" style={{ color: 'var(--color-text-muted)' }}>
              {activeBookmark.description || new URL(activeBookmark.url).hostname}
            </p>
          </div>
        </SpotlightCard>
      </div>
    </DragOverlay>
  );
}

export default BookmarkDragOverlay;
