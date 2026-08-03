import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock3, FolderTree, LayoutList, Pin, Tags, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Category } from '../../types/bookmark'
import {
  getCollectionFromSearch,
  writeCollectionToLocation,
} from '../../lib/bookmark-filter'
import type { BookmarkCollectionId, TagStat } from '../../lib/bookmark-filter'
import { IconRenderer } from '../IconRenderer'

interface CategoryNavigationItem extends Category {
  count: number
}

interface MobileContentNavigationProps {
  categories: CategoryNavigationItem[]
  tags: TagStat[]
  pinnedCount: number
  totalBookmarks: number
  activeTag: string | null
  matchedCount: number
  onSelectTag: (tag: string | null) => void
  onSelectCategory: (categoryId: string) => void
}

type NavigationTab = 'categories' | 'tags'

const COPY = {
  zh: {
    navigation: '内容导航',
    categories: '分类',
    tags: '标签',
    pinned: '常用',
    readLater: '稍后阅读',
    allTags: '全部标签',
    popularTags: '常用标签',
    moreTags: '更多标签',
    allBookmarks: '全部书签',
    selected: '当前筛选',
    emptyTags: '还没有可选择的标签',
    close: '关闭内容导航',
    open: '打开分类和标签导航',
  },
  en: {
    navigation: 'Content navigation',
    categories: 'Categories',
    tags: 'Tags',
    pinned: 'Pinned',
    readLater: 'Read later',
    allTags: 'All tags',
    popularTags: 'Popular tags',
    moreTags: 'More tags',
    allBookmarks: 'All bookmarks',
    selected: 'Active filter',
    emptyTags: 'No tags are available yet',
    close: 'Close content navigation',
    open: 'Open category and tag navigation',
  },
  ja: {
    navigation: 'コンテンツナビ',
    categories: 'カテゴリー',
    tags: 'タグ',
    pinned: 'よく使う項目',
    readLater: 'あとで読む',
    allTags: 'すべてのタグ',
    popularTags: 'よく使うタグ',
    moreTags: 'その他のタグ',
    allBookmarks: 'すべてのブックマーク',
    selected: '現在の絞り込み',
    emptyTags: '選択できるタグがありません',
    close: 'ナビゲーションを閉じる',
    open: 'カテゴリーとタグを開く',
  },
  ko: {
    navigation: '콘텐츠 탐색',
    categories: '카테고리',
    tags: '태그',
    pinned: '자주 사용',
    readLater: '나중에 읽기',
    allTags: '모든 태그',
    popularTags: '자주 쓰는 태그',
    moreTags: '더 많은 태그',
    allBookmarks: '모든 북마크',
    selected: '현재 필터',
    emptyTags: '선택할 태그가 없습니다',
    close: '콘텐츠 탐색 닫기',
    open: '카테고리 및 태그 열기',
  },
} as const

const TAG_COLORS = [
  { bg: 'rgba(59,130,246,0.14)', text: 'rgb(96,165,250)', border: 'rgba(59,130,246,0.28)' },
  { bg: 'rgba(16,185,129,0.14)', text: 'rgb(52,211,153)', border: 'rgba(16,185,129,0.28)' },
  { bg: 'rgba(245,158,11,0.14)', text: 'rgb(251,191,36)', border: 'rgba(245,158,11,0.28)' },
  { bg: 'rgba(239,68,68,0.14)', text: 'rgb(248,113,113)', border: 'rgba(239,68,68,0.28)' },
  { bg: 'rgba(139,92,246,0.14)', text: 'rgb(167,139,250)', border: 'rgba(139,92,246,0.28)' },
  { bg: 'rgba(236,72,153,0.14)', text: 'rgb(244,114,182)', border: 'rgba(236,72,153,0.28)' },
]

function getTagColor(name: string) {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = ((hash << 5) - hash + name.charCodeAt(index)) | 0
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export function MobileContentNavigation({
  categories,
  tags,
  pinnedCount,
  totalBookmarks,
  activeTag,
  matchedCount,
  onSelectTag,
  onSelectCategory,
}: MobileContentNavigationProps) {
  const { i18n } = useTranslation()
  const language = i18n.language.split('-')[0] as keyof typeof COPY
  const copy = COPY[language] || COPY.en
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<NavigationTab>(activeTag ? 'tags' : 'categories')
  const [activeCollection, setActiveCollection] = useState<BookmarkCollectionId>(() =>
    typeof window === 'undefined' ? 'all' : getCollectionFromSearch(window.location.search),
  )
  const [collectionFilterMode, setCollectionFilterMode] = useState(false)
  const [readLaterCount, setReadLaterCount] = useState(0)

  const popularTags = useMemo(() => tags.slice(0, 12), [tags])
  const remainingTags = useMemo(() => tags.slice(12), [tags])

  const activeCollectionLabel = useMemo(() => {
    if (activeCollection === 'pinned') return copy.pinned
    if (activeCollection === 'read-later') return copy.readLater
    if (activeCollection === 'all') return copy.allBookmarks
    return categories.find((category) => category.id === activeCollection)?.name || copy.allBookmarks
  }, [activeCollection, categories, copy])

  const activeCollectionCount = useMemo(() => {
    if (activeCollection === 'pinned') return pinnedCount
    if (activeCollection === 'read-later') return readLaterCount
    if (activeCollection === 'all') return totalBookmarks
    return categories.find((category) => category.id === activeCollection)?.count || 0
  }, [activeCollection, categories, pinnedCount, readLaterCount, totalBookmarks])

  useEffect(() => {
    if (activeTag) {
      setActiveTab('tags')
      setActiveCollection('all')
    }
  }, [activeTag])

  useEffect(() => {
    const syncCollectionState = () => {
      const stage = document.querySelector<HTMLElement>('[data-ambient-sparse-stage="true"]')
      setCollectionFilterMode(Boolean(stage))
      setReadLaterCount(Number(stage?.dataset.readLaterCount || 0))
      setActiveCollection(activeTag ? 'all' : getCollectionFromSearch(window.location.search))
    }

    syncCollectionState()
    window.addEventListener('popstate', syncCollectionState)
    return () => window.removeEventListener('popstate', syncCollectionState)
  }, [activeTag, categories.length, open, totalBookmarks])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const handlePopState = () => setOpen(false)

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [open])

  if (
    categories.length === 0 &&
    tags.length === 0 &&
    pinnedCount === 0 &&
    readLaterCount === 0
  ) return null

  const selectTag = (tag: string | null) => {
    const previousCollection = activeCollection
    setOpen(false)
    setActiveCollection('all')
    onSelectTag(tag)

    if (tag === null && collectionFilterMode && previousCollection !== 'all') {
      Promise.resolve().then(() => writeCollectionToLocation('all', 'push'))
    }
  }

  const selectCategory = (categoryId: BookmarkCollectionId) => {
    const hadActiveTag = Boolean(activeTag)
    setOpen(false)
    setActiveCollection(categoryId)
    onSelectCategory(categoryId)

    if (collectionFilterMode) {
      Promise.resolve().then(() => {
        writeCollectionToLocation(categoryId, hadActiveTag ? 'replace' : 'push')
      })
    }
  }

  const renderTag = (tag: TagStat) => {
    const selected = activeTag === tag.name
    const color = getTagColor(tag.name)

    return (
      <button
        key={tag.name}
        type="button"
        onClick={() => selectTag(selected ? null : tag.name)}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-transform active:scale-[0.98]"
        style={{
          background: selected ? color.bg : 'var(--color-bg-tertiary)',
          border: `1px solid ${selected ? color.border : 'var(--color-glass-border)'}`,
        }}
      >
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: color.bg, color: color.text }}
        >
          <Tags className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium" style={{ color: selected ? color.text : 'var(--color-text-primary)' }}>
          #{tag.name}
        </span>
        <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{tag.count}</span>
        {selected && <Check className="h-4 w-4 flex-shrink-0" style={{ color: color.text }} />}
      </button>
    )
  }

  const renderCollectionCheck = (selected: boolean) => selected
    ? <Check className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
    : null

  const collectionButtonStyle = (selected: boolean) => ({
    background: selected ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)',
    border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
  })

  const badgeValue = activeTag
    ? matchedCount
    : collectionFilterMode && activeCollection !== 'all'
      ? activeCollectionCount
      : tags.length

  return (
    <>
      <motion.button
        type="button"
        aria-label={copy.open}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="fixed left-2 top-[56%] z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-xl lg:hidden"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
          color: activeTag || activeCollection !== 'all' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        }}
        whileTap={{ scale: 0.9 }}
      >
        <LayoutList className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white" style={{ background: 'var(--color-primary)' }}>
          {badgeValue > 99 ? '99+' : badgeValue}
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              type="button"
              aria-label={copy.close}
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={copy.navigation}
              className="absolute bottom-0 left-0 top-0 flex flex-col overflow-hidden rounded-r-3xl"
              style={{
                width: 'min(82vw, 320px)',
                paddingTop: 'max(16px, env(safe-area-inset-top))',
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                background: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-glass-border)',
                boxShadow: '20px 0 60px rgba(0,0,0,0.35)',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            >
              <div className="flex items-center gap-3 px-5 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  <LayoutList className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{copy.navigation}</h2>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {activeTag
                      ? `${copy.selected}：#${activeTag}`
                      : collectionFilterMode && activeCollection !== 'all'
                        ? `${copy.selected}：${activeCollectionLabel}`
                        : `${totalBookmarks} ${copy.allBookmarks}`}
                  </p>
                </div>
                <button type="button" aria-label={copy.close} onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-tertiary)' }}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mx-5 mb-4 grid grid-cols-2 rounded-xl p-1" style={{ background: 'var(--color-bg-tertiary)' }}>
                <button type="button" onClick={() => setActiveTab('categories')} className="flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors" style={{ background: activeTab === 'categories' ? 'var(--color-glass)' : 'transparent', color: activeTab === 'categories' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  <FolderTree className="h-4 w-4" /> {copy.categories}
                </button>
                <button type="button" onClick={() => setActiveTab('tags')} className="flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors" style={{ background: activeTab === 'tags' ? 'var(--color-glass)' : 'transparent', color: activeTab === 'tags' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  <Tags className="h-4 w-4" /> {copy.tags}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
                {activeTab === 'categories' ? (
                  <div className="space-y-2">
                    {collectionFilterMode && (
                      <button
                        type="button"
                        aria-pressed={activeCollection === 'all'}
                        onClick={() => selectCategory('all')}
                        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left"
                        style={collectionButtonStyle(activeCollection === 'all')}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}><LayoutList className="h-4 w-4" /></span>
                        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{copy.allBookmarks}</span>
                        <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{totalBookmarks}</span>
                        {renderCollectionCheck(activeCollection === 'all')}
                      </button>
                    )}

                    {pinnedCount > 0 && (
                      <button
                        type="button"
                        aria-pressed={collectionFilterMode && activeCollection === 'pinned'}
                        onClick={() => selectCategory('pinned')}
                        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left"
                        style={collectionButtonStyle(collectionFilterMode && activeCollection === 'pinned')}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-400"><Pin className="h-4 w-4" /></span>
                        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{copy.pinned}</span>
                        <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{pinnedCount}</span>
                        {renderCollectionCheck(collectionFilterMode && activeCollection === 'pinned')}
                      </button>
                    )}

                    {collectionFilterMode && readLaterCount > 0 && (
                      <button
                        type="button"
                        aria-pressed={activeCollection === 'read-later'}
                        onClick={() => selectCategory('read-later')}
                        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left"
                        style={collectionButtonStyle(activeCollection === 'read-later')}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400"><Clock3 className="h-4 w-4" /></span>
                        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{copy.readLater}</span>
                        <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{readLaterCount}</span>
                        {renderCollectionCheck(activeCollection === 'read-later')}
                      </button>
                    )}

                    {categories.map((category) => {
                      const selected = collectionFilterMode && activeCollection === category.id
                      return (
                        <button
                          key={category.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => selectCategory(category.id)}
                          className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left"
                          style={collectionButtonStyle(selected)}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: category.color || 'var(--color-primary)', background: `${category.color || '#667eea'}18` }}>
                            <IconRenderer icon={category.icon} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{category.name}</span>
                          <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{category.count}</span>
                          {renderCollectionCheck(selected)}
                        </button>
                      )
                    })}
                  </div>
                ) : tags.length > 0 ? (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p className="px-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{copy.allTags}</p>
                      <button type="button" onClick={() => selectTag(null)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left" style={{ background: activeTag === null && activeCollection === 'all' ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)', border: `1px solid ${activeTag === null && activeCollection === 'all' ? 'var(--color-primary)' : 'var(--color-glass-border)'}` }}>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}><LayoutList className="h-4 w-4" /></span>
                        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{copy.allBookmarks}</span>
                        <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{totalBookmarks}</span>
                        {activeTag === null && activeCollection === 'all' && <Check className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="px-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{copy.popularTags}</p>
                      {popularTags.map(renderTag)}
                    </div>

                    {remainingTags.length > 0 && (
                      <div className="space-y-2">
                        <p className="px-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{copy.moreTags}</p>
                        {remainingTags.map(renderTag)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <Tags className="h-9 w-9" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{copy.emptyTags}</p>
                  </div>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
