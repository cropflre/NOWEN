import { Bookmark } from '../types/bookmark'

export interface TagStat {
  name: string
  count: number
}

export function normalizeTag(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function getTagFromSearch(search: string): string | null {
  return normalizeTag(new URLSearchParams(search).get('tag'))
}

export function buildTagUrl(href: string, tag: string | null): string {
  const url = new URL(href)
  const normalizedTag = normalizeTag(tag)

  if (normalizedTag) {
    url.searchParams.set('tag', normalizedTag)
  } else {
    url.searchParams.delete('tag')
  }

  return `${url.pathname}${url.search}${url.hash}`
}

export function writeTagToLocation(
  tag: string | null,
  mode: 'push' | 'replace' = 'push',
): void {
  if (typeof window === 'undefined') return

  const nextUrl = buildTagUrl(window.location.href, tag)
  const state = { ...window.history.state, nowenTag: normalizeTag(tag) }

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
