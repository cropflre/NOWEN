import React from 'react';
import { DragOverlay, type DropAnimation, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { ExternalLink } from 'lucide-react';
import { SpotlightCard } from '../ui/spotlight-card';
import { Bookmark } from '../../types/bookmark';
import { IconRenderer } from '../IconRenderer';

interface BookmarkDragOverlayProps {
  activeBookmark: Bookmark | null | undefined;
  cardViewMode?: 'compact' | 'standard' | 'comfortable';
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

export function BookmarkDragOverlay({ activeBookmark, cardViewMode = 'standard' }: BookmarkDragOverlayProps) {
  const isCompact = cardViewMode === 'compact';
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
          <SpotlightCard className="h-full cursor-grabbing" size={isCompact ? 'sm' : 'md'} spotlightColor="rgba(99, 102, 241, 0.2)">
            <div className={`flex ${isCompact ? 'flex-row items-center gap-3' : 'flex-col'} h-full`}>
              <div
                className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center ${isCompact ? '' : 'mb-4'} flex-shrink-0`}
                style={{ background: 'var(--color-bg-tertiary)' }}
              >
                {activeBookmark.iconUrl ? (
                  <img src={activeBookmark.iconUrl} alt="" className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} object-contain`} />
                ) : activeBookmark.icon ? (
                  <IconRenderer icon={activeBookmark.icon} className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: 'var(--color-primary)' }} />
                ) : activeBookmark.favicon ? (
                  <img src={activeBookmark.favicon} alt="" className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
                ) : (
                  <ExternalLink className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: 'var(--color-text-muted)' }} />
                )}
              </div>
              <div className={isCompact ? 'flex-1 min-w-0' : ''}>
                <h3
                  className={`font-medium line-clamp-1 ${isCompact ? 'text-sm' : 'mb-1'}`}
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {activeBookmark.title}
                </h3>
                <p className={`${isCompact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2 flex-1'}`} style={{ color: 'var(--color-text-muted)' }}>
                  {activeBookmark.description || (() => { try { return new URL(activeBookmark.url).hostname } catch { return activeBookmark.url } })()}
                </p>
              </div>
            </div>
          </SpotlightCard>
        </div>
      ) : null}
    </DragOverlay>
  );
}

export default BookmarkDragOverlay;
