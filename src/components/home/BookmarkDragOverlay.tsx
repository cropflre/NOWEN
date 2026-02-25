import React from 'react';
import { DragOverlay, type DropAnimation, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { ExternalLink } from 'lucide-react';
import { SpotlightCard } from '../ui/spotlight-card';
import { Bookmark } from '../../types/bookmark';
import { IconRenderer } from '../IconRenderer';

interface BookmarkDragOverlayProps {
  activeBookmark: Bookmark | null | undefined;
}

// 自然的放下动画
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
  duration: 250,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
};

export function BookmarkDragOverlay({ activeBookmark }: BookmarkDragOverlayProps) {
  return (
    <DragOverlay dropAnimation={dropAnimation} zIndex={100}>
      {activeBookmark ? (
        <div
          style={{
            transform: 'scale(1.04)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.12)',
            borderRadius: '12px',
            opacity: 0.95,
          }}
        >
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
                {activeBookmark.description || (() => { try { return new URL(activeBookmark.url).hostname } catch { return activeBookmark.url } })()}
              </p>
            </div>
          </SpotlightCard>
        </div>
      ) : null}
    </DragOverlay>
  );
}

export default BookmarkDragOverlay;
