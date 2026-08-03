import { Bookmark } from '../types/bookmark'

export interface TagStat {
  name: string
  count: number
}

export type BookmarkCollectionId = 'all' | 'pinned' | 'read-later' | string

export function normalizeTag(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function normalizeCollection(
  value: string | null | undefined,
): BookmarkCollectionId {
  const normalized = value?.trim()
  return normalized || 'all'
}

export function getTagFromSearch(search: string): string | null {
  return normalizeTag(new URLSearchParams(search).get('tag'))
}

export function getCollectionFromSearch(search: string): BookmarkCollectionId {
  return normalizeCollection(new URLSearchParams(search).get('collection'))
}

export function buildTagUrl(href: string, tag: string | null): string {
  const url = new URL(href)
  const normalizedTag = normalizeTag(tag)

  if (normalizedTag) {
    // 进入标签筛选时清除集合；仅清除标签时保留可能刚刚写入的集合。
    url.searchParams.delete('collection')
    url.searchParams.set('tag', normalizedTag)
  } else {
    url.searchParams.delete('tag')
  }

  return `${url.pathname}${url.search}${url.hash}`
}

export function buildCollectionUrl(
  href: string,
  collection: BookmarkCollectionId,
): string {
  const url = new URL(href)
  const normalizedCollection = normalizeCollection(collection)

  // 集合筛选与标签互斥，集合回到 all 时不保留冗余查询参数。
  url.searchParams.delete('tag')

  if (normalizedCollection === 'all') {
    url.searchParams.delete('collection')
  } else {
    url.searchParams.set('collection', normalizedCollection)
  }

  return `${url.pathname}${url.search}${url.hash}`
}

export function writeTagToLocation(
  tag: string | null,
  mode: 'push' | 'replace' = 'push',
): void {
  if (typeof window === 'undefined') return

  const nextUrl = buildTagUrl(window.location.href, tag)
  const nextSearch = new URL(nextUrl, window.location.origin).search
  const state = {
    ...window.history.state,
    nowenTag: normalizeTag(tag),
    nowenCollection: getCollectionFromSearch(nextSearch),
  }

  if (mode === 'replace') {
    window.history.replaceState(state, '', nextUrl)
  } else {
    window.history.pushState(state, '', nextUrl)
  }
}

export function writeCollectionToLocation(
  collection: BookmarkCollectionId,
  mode: 'push' | 'replace' = 'push',
): void {
  if (typeof window === 'undefined') return

  const normalizedCollection = normalizeCollection(collection)
  const nextUrl = buildCollectionUrl(window.location.href, normalizedCollection)
  const state = {
    ...window.history.state,
    nowenTag: null,
    nowenCollection: normalizedCollection,
  }

  if (mode === 'replace') {
    window.history.replaceState(state, '', nextUrl)
  } else {
    window.history.pushState(state, '', nextUrl)
  }
}

export function filterBookmarksByTag(bookmarks: Bookmark[], tag: string | null): Bookmark[] {
  const normalizedTag = normalizeTag(tag)
  if (!normalizedTag) return bookmarks

  return bookmarks.filter((bookmark) =>
    bookmark.tags?.some((bookmarkTag) => bookmarkTag.trim() === normalizedTag),
  )
}

export function buildTagStats(bookmarks: Bookmark[]): TagStat[] {
  const counts = new Map<string, number>()

  bookmarks.forEach((bookmark) => {
    const uniqueTags = new Set(
      (bookmark.tags || [])
        .map((tag) => tag.trim())
        .filter(Boolean),
    )

    uniqueTags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    })
  })

  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (left, right) => right.count - left.count || left.name.localeCompare(right.name, 'zh-CN'),
  )
}
