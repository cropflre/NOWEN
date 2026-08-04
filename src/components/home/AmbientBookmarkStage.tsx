import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock3, Layers3, Lock, Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Bookmark, Category } from '../../types/bookmark';
import { IconRenderer } from '../IconRenderer';
import { SpotlightCard } from '../ui/spotlight-card';
import { visitsApi } from '../../lib/api';
import {
  getCollectionFromSearch,
  writeCollectionToLocation,
} from '../../lib/bookmark-filter';
import { getBookmarkUrl } from '../../hooks/useNetworkEnv';
import '../../styles/ambient-bookmark-stage.css';

export const AMBIENT_SPARSE_BOOKMARK_LIMIT = 12;

export type AmbientCollectionId = 'all' | 'pinned' | 'read-later' | string;

type CardViewMode = 'compact' | 'standard' | 'comfortable';

interface AmbientBookmarkStageProps {
  bookmarks: Bookmark[];
  categories: Category[];
  activeCollection: AmbientCollectionId;
  cardViewMode: CardViewMode;
  isInternal: boolean;
  isLiteMode?: boolean;
  activeTag?: string | null;
  onSelectCollection: (collectionId: AmbientCollectionId) => void;
  onContextMenu: (event: MouseEvent, bookmark: Bookmark) => void;
  onTagSelect: (tag: string) => void;
}

interface CollectionItem {
  id: AmbientCollectionId;
  name: string;
  count: number;
  icon?: string;
  color?: string;
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function getBookmarkInitial(bookmark: Bookmark) {
  const source = bookmark.title.trim() || safeHostname(bookmark.url);
  const firstCharacter = Array.from(source)[0];
  return firstCharacter?.toUpperCase() || '↗';
}

function getIdentityGradient(bookmark: Bookmark) {
  const palettes = [
    ['#818cf8', '#67e8f9'],
    ['#a78bfa', '#f9a8d4'],
    ['#60a5fa', '#5eead4'],
    ['#c084fc', '#93c5fd'],
    ['#fb7185', '#fbbf24'],
    ['#34d399', '#60a5fa'],
  ];
  const palette = palettes[hashString(bookmark.url || bookmark.title) % palettes.length];
  return `linear-gradient(145deg, ${palette[0]}, ${palette[1]})`;
}

function BookmarkIdentity({
  bookmark,
  size,
}: {
  bookmark: Bookmark;
  size: 'sm' | 'md' | 'lg';
}) {
  const primaryImage = bookmark.iconUrl || (!bookmark.icon ? bookmark.favicon : undefined);
  const fallbackImage = bookmark.iconUrl && bookmark.favicon ? bookmark.favicon : undefined;
  const [imageSource, setImageSource] = useState<string | undefined>(primaryImage);
  const dimensionClass = size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
  const imageClass = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';

  if (bookmark.icon && !bookmark.iconUrl) {
    return (
      <span
        className={`ambient-bookmark-mark ${dimensionClass}`}
        style={{ background: getIdentityGradient(bookmark) }}
        aria-hidden="true"
      >
        <IconRenderer icon={bookmark.icon} className={imageClass} />
      </span>
    );
  }

  if (imageSource) {
    return (
      <span className={`ambient-bookmark-mark ambient-bookmark-mark--image ${dimensionClass}`}>
        <img
          src={imageSource}
          alt=""
          className={`${imageClass} object-contain`}
          loading="lazy"
          onError={() => {
            if (fallbackImage && imageSource !== fallbackImage) {
              setImageSource(fallbackImage);
            } else {
              setImageSource(undefined);
            }
          }}
        />
      </span>
    );
  }

  return (
    <span
      className={`ambient-bookmark-mark ambient-bookmark-mark--initial ${dimensionClass}`}
      style={{ background: getIdentityGradient(bookmark) }}
      aria-hidden="true"
    >
      {getBookmarkInitial(bookmark)}
    </span>
  );
}

function AmbientBookmarkCard({
  bookmark,
  category,
  mode,
  index,
  isInternal,
  isLiteMode,
  onContextMenu,
  onTagSelect,
}: {
  bookmark: Bookmark;
  category?: Category;
  mode: CardViewMode;
  index: number;
  isInternal: boolean;
  isLiteMode?: boolean;
  onContextMenu: (event: MouseEvent, bookmark: Bookmark) => void;
  onTagSelect: (tag: string) => void;
}) {
  const hostname = safeHostname(bookmark.url);
  const visibleTags = bookmark.tags?.slice(0, mode === 'comfortable' ? 2 : 1) ?? [];
  const identitySize = mode === 'compact' ? 'md' : mode === 'comfortable' ? 'lg' : 'md';

  const openBookmark = () => {
    visitsApi.track(bookmark.id).catch(console.error);
    window.open(getBookmarkUrl(bookmark, isInternal), '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.article
      layout
      className={`ambient-bookmark-card ambient-bookmark-card--${mode}`}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ delay: Math.min(index * 0.045, 0.3), duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      <SpotlightCard
        className="ambient-bookmark-card__surface h-full"
        size={mode === 'compact' ? 'sm' : mode === 'comfortable' ? 'lg' : 'md'}
        lightweight={Boolean(isLiteMode)}
        spotlightColor={category?.color ? `${category.color}22` : 'rgba(129, 140, 248, 0.16)'}
        ariaLabel={`${bookmark.title} · ${hostname}`}
        onClick={openBookmark}
        onContextMenu={(event) => onContextMenu(event, bookmark)}
      >
        {bookmark.visibility === 'private' && (
          <span className="ambient-bookmark-card__private" title="私人书签">
            <Lock className="h-3 w-3" />
          </span>
        )}

        {mode === 'comfortable' && (
          <div
            className="ambient-bookmark-card__visual"
            style={bookmark.ogImage
              ? { backgroundImage: `linear-gradient(180deg, transparent 20%, rgba(10, 12, 20, 0.38)), url(${bookmark.ogImage})` }
              : { background: getIdentityGradient(bookmark) }}
          >
            {!bookmark.ogImage && (
              <span className="ambient-bookmark-card__visual-letter">{getBookmarkInitial(bookmark)}</span>
            )}
            <span className="ambient-bookmark-card__visual-domain">{hostname}</span>
          </div>
        )}

        <div className="ambient-bookmark-card__body">
          <BookmarkIdentity bookmark={bookmark} size={identitySize} />

          <div className="ambient-bookmark-card__copy">
            <h3>{bookmark.title}</h3>
            {mode !== 'compact' && <p>{bookmark.description || hostname}</p>}
            {mode === 'compact' && <span className="ambient-bookmark-card__domain">{hostname}</span>}
          </div>

          {mode !== 'compact' && visibleTags.length > 0 && (
            <div className="ambient-bookmark-card__tags">
              {visibleTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onTagSelect(tag);
                  }}
                >
                  #{tag}
                </button>
              ))}
              {(bookmark.tags?.length ?? 0) > visibleTags.length && (
                <span>+{(bookmark.tags?.length ?? 0) - visibleTags.length}</span>
              )}
            </div>
          )}
        </div>
      </SpotlightCard>
    </motion.article>
  );
}

export function AmbientBookmarkStage({
  bookmarks,
  categories,
  activeCollection,
  cardViewMode,
  isInternal,
  isLiteMode,
  activeTag,
  onSelectCollection,
  onContextMenu,
  onTagSelect,
}: AmbientBookmarkStageProps) {
  const { t } = useTranslation();
  const tabRefs = useRef(new Map<AmbientCollectionId, HTMLButtonElement>());
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const collectionStats = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    let pinnedCount = 0;
    let readLaterCount = 0;

    bookmarks.forEach((bookmark) => {
      if (bookmark.isPinned) pinnedCount += 1;
      if (bookmark.isReadLater && !bookmark.isRead) readLaterCount += 1;
      if (bookmark.category) {
        categoryCounts.set(bookmark.category, (categoryCounts.get(bookmark.category) || 0) + 1);
      }
    });

    return { categoryCounts, pinnedCount, readLaterCount };
  }, [bookmarks]);

  const collections = useMemo<CollectionItem[]>(() => {
    const categoryItems = categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        count: collectionStats.categoryCounts.get(category.id) || 0,
        icon: category.icon,
        color: category.color,
      }))
      .filter((category) => category.count > 0);

    return [
      {
        id: 'all',
        name: t('bookmark.all', '全部'),
        count: bookmarks.length,
      },
      ...(collectionStats.pinnedCount > 0
        ? [{ id: 'pinned' as const, name: t('sidebar.pinned', '常用'), count: collectionStats.pinnedCount, icon: 'Pin', color: '#eab308' }]
        : []),
      ...(collectionStats.readLaterCount > 0
        ? [{ id: 'read-later' as const, name: t('readLater.title', '稍后阅读'), count: collectionStats.readLaterCount, icon: 'Clock3', color: '#38bdf8' }]
        : []),
      ...categoryItems,
    ];
  }, [bookmarks.length, categories, collectionStats, t]);

  const collectionIds = useMemo(
    () => new Set(collections.map((collection) => collection.id)),
    [collections],
  );

  const resolvedCollection = collectionIds.has(activeCollection)
    ? activeCollection
    : 'all';

  const displayedBookmarks = useMemo(() => {
    const filtered = resolvedCollection === 'all'
      ? bookmarks
      : resolvedCollection === 'pinned'
        ? bookmarks.filter((bookmark) => bookmark.isPinned)
        : resolvedCollection === 'read-later'
          ? bookmarks.filter((bookmark) => bookmark.isReadLater && !bookmark.isRead)
          : bookmarks.filter((bookmark) => bookmark.category === resolvedCollection);

    return [...filtered].sort((first, second) => {
      if (first.isPinned && !second.isPinned) return -1;
      if (!first.isPinned && second.isPinned) return 1;
      return first.orderIndex - second.orderIndex;
    });
  }, [bookmarks, resolvedCollection]);

  const restoreCollectionFromLocation = useCallback(() => {
    if (typeof window === 'undefined' || activeTag) return;

    const requestedCollection = getCollectionFromSearch(window.location.search);
    const nextCollection = collectionIds.has(requestedCollection)
      ? requestedCollection
      : 'all';

    if (requestedCollection !== nextCollection) {
      writeCollectionToLocation(nextCollection, 'replace');
    }
    if (nextCollection !== activeCollection) {
      onSelectCollection(nextCollection);
    }
  }, [activeCollection, activeTag, collectionIds, onSelectCollection]);

  useEffect(() => {
    restoreCollectionFromLocation();
    window.addEventListener('popstate', restoreCollectionFromLocation);
    return () => window.removeEventListener('popstate', restoreCollectionFromLocation);
  }, [restoreCollectionFromLocation]);

  useEffect(() => {
    if (activeCollection !== resolvedCollection) {
      writeCollectionToLocation(resolvedCollection, 'replace');
    }
  }, [activeCollection, resolvedCollection]);

  const selectCollection = useCallback((collectionId: AmbientCollectionId) => {
    if (collectionId === resolvedCollection && !activeTag) return;
    writeCollectionToLocation(collectionId, 'push');
    onSelectCollection(collectionId);
  }, [activeTag, onSelectCollection, resolvedCollection]);

  const handleCollectionKeyDown = useCallback((
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    const lastIndex = collections.length - 1;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const nextCollection = collections[nextIndex];
    tabRefs.current.get(nextCollection.id)?.focus();
    selectCollection(nextCollection.id);
  }, [collections, selectCollection]);

  const resultLabel = t(
    'bookmark.collection_result_count',
    `${displayedBookmarks.length} 个书签`,
  );

  return (
    <motion.section
      className="ambient-bookmark-stage"
      data-ambient-sparse-stage="true"
      data-pinned-count={collectionStats.pinnedCount}
      data-read-later-count={collectionStats.readLaterCount}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ambient-bookmark-stage__toolbar" aria-label={t('bookmark.category_filter', '分类筛选')}>
        <div className="ambient-bookmark-stage__eyebrow">
          <Layers3 className="h-4 w-4" />
          <span>{activeTag ? `#${activeTag}` : t('bookmark.my_space', '我的空间')}</span>
        </div>

        <div
          className="ambient-bookmark-stage__collections"
          role="tablist"
          aria-label={t('bookmark.category_filter', '分类筛选')}
        >
          {collections.map((collection, index) => {
            const isActive = collection.id === resolvedCollection;
            return (
              <button
                key={collection.id}
                ref={(element) => {
                  if (element) tabRefs.current.set(collection.id, element);
                  else tabRefs.current.delete(collection.id);
                }}
                type="button"
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls="ambient-bookmark-collection-panel"
                className={isActive ? 'is-active' : undefined}
                onClick={() => selectCollection(collection.id)}
                onKeyDown={(event) => handleCollectionKeyDown(event, index)}
                style={collection.color ? { '--collection-accent': collection.color } as CSSProperties : undefined}
              >
                {collection.id === 'pinned' ? (
                  <Pin className="h-3.5 w-3.5" />
                ) : collection.id === 'read-later' ? (
                  <Clock3 className="h-3.5 w-3.5" />
                ) : collection.icon ? (
                  <IconRenderer icon={collection.icon} className="h-3.5 w-3.5" />
                ) : null}
                <span>{collection.name}</span>
                <small>{collection.count}</small>
              </button>
            );
          })}
        </div>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {resultLabel}
      </p>

      <div
        id="ambient-bookmark-collection-panel"
        role="tabpanel"
        className={`ambient-bookmark-stage__grid ambient-bookmark-stage__grid--${cardViewMode}`}
      >
        <AnimatePresence mode="popLayout">
          {displayedBookmarks.map((bookmark, index) => (
            <AmbientBookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              category={bookmark.category ? categoryMap.get(bookmark.category) : undefined}
              mode={cardViewMode}
              index={index}
              isInternal={isInternal}
              isLiteMode={isLiteMode}
              onContextMenu={onContextMenu}
              onTagSelect={onTagSelect}
            />
          ))}
        </AnimatePresence>
      </div>

      {displayedBookmarks.length === 0 && (
        <div className="ambient-bookmark-stage__empty">
          <span>{t('bookmark.no_collection_items', '这个分类还没有书签')}</span>
          <button type="button" onClick={() => selectCollection('all')}>
            {t('bookmark.show_all', '查看全部')}
          </button>
        </div>
      )}
    </motion.section>
  );
}

export default AmbientBookmarkStage;
