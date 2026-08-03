import { useMemo, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUpDown,
  Clock3,
  ExternalLink,
  Folder,
  Grid2X2,
  LibraryBig,
  List,
  Lock,
  Pin,
  Plus,
  Search,
  Tags,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Bookmark, Category } from '../types/bookmark'
import type { BookmarkCollectionId } from '../lib/bookmark-filter'
import { buildTagStats } from '../lib/bookmark-filter'
import { getBookmarkUrl } from '../hooks/useNetworkEnv'
import { visitsApi } from '../lib/api'
import { IconRenderer } from '../components/IconRenderer'
import { SpotlightCard } from '../components/ui/spotlight-card'
import '../styles/bookmark-library.css'

type LibraryView = 'grid' | 'list'
type SortMode = 'custom' | 'title' | 'updated'

interface BookmarkLibraryProps {
  bookmarks: Bookmark[]
  categories: Category[]
  activeTag: string | null
  activeCollection: BookmarkCollectionId
  isInternal: boolean
  isLoggedIn: boolean
  onBack: () => void
  onOpenSearch: () => void
  onAddBookmark: () => void
  onSelectTag: (tag: string | null) => void
  onSelectCollection: (collection: BookmarkCollectionId) => void
  onContextMenu: (event: MouseEvent, bookmark: Bookmark) => void
}

interface CollectionCount {
  pinned: number
  readLater: number
  categories: Map<string, number>
}

const LIBRARY_VIEW_KEY = 'nowen-library-view-v1'
const LIBRARY_SORT_KEY = 'nowen-library-sort-v1'

function readStoredValue<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const value = window.localStorage.getItem(key) as T | null
    return value && allowed.includes(value) ? value : fallback
  } catch {
    return fallback
  }
}

function writeStoredValue(key: string, value: string) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Persistence is optional. The in-memory state still works.
  }
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

function identityGradient(bookmark: Bookmark) {
  const palettes = [
    ['#818cf8', '#67e8f9'],
    ['#a78bfa', '#f9a8d4'],
    ['#60a5fa', '#5eead4'],
    ['#c084fc', '#93c5fd'],
    ['#fb7185', '#fbbf24'],
    ['#34d399', '#60a5fa'],
  ]
  const palette = palettes[hashString(bookmark.url || bookmark.title) % palettes.length]
  return `linear-gradient(145deg, ${palette[0]}, ${palette[1]})`
}

function bookmarkInitial(bookmark: Bookmark) {
  const source = bookmark.title.trim() || safeHostname(bookmark.url)
  return Array.from(source)[0]?.toUpperCase() || '↗'
}

function BookmarkMark({ bookmark }: { bookmark: Bookmark }) {
  const primaryImage = bookmark.iconUrl || (!bookmark.icon ? bookmark.favicon : undefined)
  const fallbackImage = bookmark.iconUrl && bookmark.favicon ? bookmark.favicon : undefined
  const [imageSource, setImageSource] = useState(primaryImage)

  if (bookmark.icon && !bookmark.iconUrl) {
    return (
      <span className="bookmark-library__mark" style={{ background: identityGradient(bookmark) }} aria-hidden="true">
        <IconRenderer icon={bookmark.icon} className="h-5 w-5" />
      </span>
    )
  }

  if (imageSource) {
    return (
      <span className="bookmark-library__mark bookmark-library__mark--image" aria-hidden="true">
        <img
          src={imageSource}
          alt=""
          loading="lazy"
          onError={() => {
            if (fallbackImage && imageSource !== fallbackImage) {
              setImageSource(fallbackImage)
            } else {
              setImageSource(undefined)
            }
          }}
        />
      </span>
    )
  }

  return (
    <span
      className="bookmark-library__mark bookmark-library__mark--initial"
      style={{ background: identityGradient(bookmark) }}
      aria-hidden="true"
    >
      {bookmarkInitial(bookmark)}
    </span>
  )
}

function LibraryBookmarkCard({
  bookmark,
  category,
  view,
  isInternal,
  onContextMenu,
  onSelectTag,
}: {
  bookmark: Bookmark
  category?: Category
  view: LibraryView
  isInternal: boolean
  onContextMenu: (event: MouseEvent, bookmark: Bookmark) => void
  onSelectTag: (tag: string | null) => void
}) {
  const hostname = safeHostname(bookmark.url)
  const visibleTags = bookmark.tags?.slice(0, view === 'grid' ? 2 : 3) ?? []

  const openBookmark = () => {
    visitsApi.track(bookmark.id).catch(console.error)
    window.open(getBookmarkUrl(bookmark, isInternal), '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.article layout className={`bookmark-library-card bookmark-library-card--${view}`}>
      <SpotlightCard
        className="bookmark-library-card__surface h-full"
        size={view === 'grid' ? 'md' : 'sm'}
        spotlightColor={category?.color ? `${category.color}20` : 'rgba(129, 140, 248, 0.14)'}
        onClick={openBookmark}
        onContextMenu={(event) => onContextMenu(event, bookmark)}
        ariaLabel={`打开书签：${bookmark.title}`}
      >
        <div className="bookmark-library-card__content">
          <BookmarkMark bookmark={bookmark} />

          <div className="bookmark-library-card__copy">
            <div className="bookmark-library-card__title-row">
              <h3>{bookmark.title}</h3>
              {bookmark.visibility === 'private' && (
                <span className="bookmark-library-card__private" title="私人书签">
                  <Lock className="h-3 w-3" />
                </span>
              )}
            </div>
            <p>{bookmark.description || hostname}</p>
            <span className="bookmark-library-card__domain">{hostname}</span>
          </div>

          {category && (
            <span
              className="bookmark-library-card__category"
              style={{ '--library-category-color': category.color || '#818cf8' } as CSSProperties}
            >
              <IconRenderer icon={category.icon} className="h-3.5 w-3.5" />
              {category.name}
            </span>
          )}

          <ExternalLink className="bookmark-library-card__external h-4 w-4" aria-hidden="true" />
        </div>

        {visibleTags.length > 0 && (
          <div className="bookmark-library-card__tags">
            {visibleTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onSelectTag(tag)
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
      </SpotlightCard>
    </motion.article>
  )
}

export function BookmarkLibrary({
  bookmarks,
  categories,
  activeTag,
  activeCollection,
  isInternal,
  isLoggedIn,
  onBack,
  onOpenSearch,
  onAddBookmark,
  onSelectTag,
  onSelectCollection,
  onContextMenu,
}: BookmarkLibraryProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [view, setView] = useState<LibraryView>(() =>
    readStoredValue(LIBRARY_VIEW_KEY, ['grid', 'list'] as const, 'grid'),
  )
  const [sortMode, setSortMode] = useState<SortMode>(() =>
    readStoredValue(LIBRARY_SORT_KEY, ['custom', 'title', 'updated'] as const, 'custom'),
  )

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  const counts = useMemo<CollectionCount>(() => {
    const categoryCounts = new Map<string, number>()
    let pinned = 0
    let readLater = 0

    bookmarks.forEach((bookmark) => {
      if (bookmark.isPinned) pinned += 1
      if (bookmark.isReadLater && !bookmark.isRead) readLater += 1
      if (bookmark.category) {
        categoryCounts.set(bookmark.category, (categoryCounts.get(bookmark.category) || 0) + 1)
      }
    })

    return { pinned, readLater, categories: categoryCounts }
  }, [bookmarks])

  const tagStats = useMemo(() => buildTagStats(bookmarks), [bookmarks])

  const filteredBookmarks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    const filtered = bookmarks.filter((bookmark) => {
      const matchesCollection = activeCollection === 'all'
        || (activeCollection === 'pinned' && bookmark.isPinned)
        || (activeCollection === 'read-later' && bookmark.isReadLater && !bookmark.isRead)
        || bookmark.category === activeCollection

      if (!matchesCollection) return false
      if (activeTag && !bookmark.tags?.some((tag) => tag.trim() === activeTag)) return false
      if (!normalizedQuery) return true

      const categoryName = bookmark.category ? categoryMap.get(bookmark.category)?.name || '' : ''
      const haystack = [
        bookmark.title,
        bookmark.description || '',
        bookmark.url,
        safeHostname(bookmark.url),
        categoryName,
        ...(bookmark.tags || []),
      ].join(' ').toLocaleLowerCase()

      return haystack.includes(normalizedQuery)
    })

    return [...filtered].sort((left, right) => {
      if (sortMode === 'title') return left.title.localeCompare(right.title, 'zh-CN')
      if (sortMode === 'updated') return right.updatedAt - left.updatedAt
      if (left.isPinned && !right.isPinned) return -1
      if (!left.isPinned && right.isPinned) return 1
      return left.orderIndex - right.orderIndex
    })
  }, [activeCollection, activeTag, bookmarks, categoryMap, query, sortMode])

  const activeCollectionLabel = useMemo(() => {
    if (activeCollection === 'pinned') return t('sidebar.pinned', '常用')
    if (activeCollection === 'read-later') return t('readLater.title', '稍后阅读')
    if (activeCollection === 'all') return t('bookmark.all', '全部书签')
    return categoryMap.get(activeCollection)?.name || t('bookmark.all', '全部书签')
  }, [activeCollection, categoryMap, t])

  const updateView = (nextView: LibraryView) => {
    setView(nextView)
    writeStoredValue(LIBRARY_VIEW_KEY, nextView)
  }

  const updateSort = (nextSort: SortMode) => {
    setSortMode(nextSort)
    writeStoredValue(LIBRARY_SORT_KEY, nextSort)
  }

  const selectCollection = (collection: BookmarkCollectionId) => {
    onSelectCollection(collection)
    setQuery('')
  }

  const selectTag = (tag: string | null) => {
    onSelectTag(tag)
    setQuery('')
  }

  const clearFilters = () => {
    setQuery('')
    if (activeTag) {
      onSelectTag(null)
    } else if (activeCollection !== 'all') {
      onSelectCollection('all')
    }
  }

  return (
    <motion.section
      className="bookmark-library"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="bookmark-library__header">
        <div className="bookmark-library__title-block">
          <button type="button" className="bookmark-library__back" onClick={onBack} aria-label="返回首页">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="bookmark-library__title-icon"><LibraryBig className="h-5 w-5" /></span>
          <div>
            <h1>{t('library.title', '书签库')}</h1>
            <p>{t('library.subtitle', '浏览、筛选并管理你的全部数字资源')}</p>
          </div>
        </div>

        <div className="bookmark-library__header-actions">
          <button type="button" onClick={onOpenSearch} className="bookmark-library__quiet-action">
            <Search className="h-4 w-4" />
            <span>{t('dock.search', '搜索')}</span>
          </button>
          {isLoggedIn && (
            <button type="button" onClick={onAddBookmark} className="bookmark-library__primary-action">
              <Plus className="h-4 w-4" />
              <span>{t('dock.add', '添加书签')}</span>
            </button>
          )}
        </div>
      </header>

      <div className="bookmark-library__mobile-collections" aria-label="书签集合">
        <button type="button" className={activeCollection === 'all' ? 'is-active' : undefined} onClick={() => selectCollection('all')}>
          {t('bookmark.all', '全部')} <small>{bookmarks.length}</small>
        </button>
        {counts.pinned > 0 && (
          <button type="button" className={activeCollection === 'pinned' ? 'is-active' : undefined} onClick={() => selectCollection('pinned')}>
            {t('sidebar.pinned', '常用')} <small>{counts.pinned}</small>
          </button>
        )}
        {counts.readLater > 0 && (
          <button type="button" className={activeCollection === 'read-later' ? 'is-active' : undefined} onClick={() => selectCollection('read-later')}>
            {t('readLater.title', '稍后阅读')} <small>{counts.readLater}</small>
          </button>
        )}
        {categories.filter((category) => (counts.categories.get(category.id) || 0) > 0).map((category) => (
          <button key={category.id} type="button" className={activeCollection === category.id ? 'is-active' : undefined} onClick={() => selectCollection(category.id)}>
            {category.name} <small>{counts.categories.get(category.id)}</small>
          </button>
        ))}
      </div>

      <div className="bookmark-library__layout">
        <aside className="bookmark-library__sidebar">
          <nav aria-label="书签集合">
            <p className="bookmark-library__section-label">{t('library.collections', '集合')}</p>
            <button type="button" className={activeCollection === 'all' ? 'is-active' : undefined} onClick={() => selectCollection('all')}>
              <LibraryBig className="h-4 w-4" />
              <span>{t('bookmark.all', '全部书签')}</span>
              <small>{bookmarks.length}</small>
            </button>
            {counts.pinned > 0 && (
              <button type="button" className={activeCollection === 'pinned' ? 'is-active' : undefined} onClick={() => selectCollection('pinned')}>
                <Pin className="h-4 w-4" />
                <span>{t('sidebar.pinned', '常用')}</span>
                <small>{counts.pinned}</small>
              </button>
            )}
            {counts.readLater > 0 && (
              <button type="button" className={activeCollection === 'read-later' ? 'is-active' : undefined} onClick={() => selectCollection('read-later')}>
                <Clock3 className="h-4 w-4" />
                <span>{t('readLater.title', '稍后阅读')}</span>
                <small>{counts.readLater}</small>
              </button>
            )}
          </nav>

          <nav aria-label="书签分类">
            <p className="bookmark-library__section-label">{t('bookmark.categories', '分类')}</p>
            {categories.filter((category) => (counts.categories.get(category.id) || 0) > 0).map((category) => (
              <button key={category.id} type="button" className={activeCollection === category.id ? 'is-active' : undefined} onClick={() => selectCollection(category.id)}>
                <span className="bookmark-library__category-dot" style={{ background: category.color || '#818cf8' }} />
                <IconRenderer icon={category.icon} className="h-4 w-4" />
                <span>{category.name}</span>
                <small>{counts.categories.get(category.id)}</small>
              </button>
            ))}
          </nav>

          {tagStats.length > 0 && (
            <nav aria-label="书签标签" className="bookmark-library__tag-nav">
              <p className="bookmark-library__section-label">{t('bookmark.tags', '常用标签')}</p>
              <div>
                {tagStats.slice(0, 12).map((tag) => (
                  <button
                    key={tag.name}
                    type="button"
                    className={activeTag === tag.name ? 'is-active' : undefined}
                    onClick={() => selectTag(activeTag === tag.name ? null : tag.name)}
                  >
                    #{tag.name}<small>{tag.count}</small>
                  </button>
                ))}
              </div>
            </nav>
          )}
        </aside>

        <main className="bookmark-library__content">
          <div className="bookmark-library__toolbar">
            <label className="bookmark-library__search">
              <Search className="h-4 w-4" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('library.searchPlaceholder', '搜索标题、网址、分类或标签')}
                aria-label={t('library.searchPlaceholder', '搜索标题、网址、分类或标签')}
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="清除搜索">
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>

            <label className="bookmark-library__select">
              <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
              <select value={sortMode} onChange={(event) => updateSort(event.target.value as SortMode)} aria-label="书签排序">
                <option value="custom">{t('library.sortCustom', '自定义顺序')}</option>
                <option value="title">{t('library.sortTitle', '按名称')}</option>
                <option value="updated">{t('library.sortUpdated', '最近更新')}</option>
              </select>
            </label>

            <div className="bookmark-library__view-toggle" role="group" aria-label="书签视图">
              <button type="button" aria-pressed={view === 'grid'} className={view === 'grid' ? 'is-active' : undefined} onClick={() => updateView('grid')} title="网格视图">
                <Grid2X2 className="h-4 w-4" />
              </button>
              <button type="button" aria-pressed={view === 'list'} className={view === 'list' ? 'is-active' : undefined} onClick={() => updateView('list')} title="列表视图">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="bookmark-library__summary">
            <div>
              <span className="bookmark-library__summary-icon">
                {activeTag ? <Tags className="h-4 w-4" /> : activeCollection === 'pinned' ? <Pin className="h-4 w-4" /> : activeCollection === 'read-later' ? <Clock3 className="h-4 w-4" /> : activeCollection === 'all' ? <LibraryBig className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
              </span>
              <div>
                <h2>{activeTag ? `#${activeTag}` : activeCollectionLabel}</h2>
                <p>{filteredBookmarks.length} {t('mobileNavigation.results', '个结果')}</p>
              </div>
            </div>
            {(activeTag || activeCollection !== 'all' || query) && (
              <button
                type="button"
                onClick={clearFilters}
              >
                {t('library.clearFilters', '清除筛选')}
              </button>
            )}
          </div>

          {filteredBookmarks.length > 0 ? (
            <div className={`bookmark-library__results bookmark-library__results--${view}`}>
              {filteredBookmarks.map((bookmark) => (
                <LibraryBookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  category={bookmark.category ? categoryMap.get(bookmark.category) : undefined}
                  view={view}
                  isInternal={isInternal}
                  onContextMenu={onContextMenu}
                  onSelectTag={selectTag}
                />
              ))}
            </div>
          ) : (
            <div className="bookmark-library__empty">
              <span><Search className="h-6 w-6" /></span>
              <h3>{t('library.emptyTitle', '没有找到匹配的书签')}</h3>
              <p>{t('library.emptyDescription', '尝试更换分类、标签或搜索关键词')}</p>
              <button
                type="button"
                onClick={clearFilters}
              >
                {t('library.showAll', '查看全部书签')}
              </button>
            </div>
          )}
        </main>
      </div>
    </motion.section>
  )
}

export default BookmarkLibrary
