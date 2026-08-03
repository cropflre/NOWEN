import { describe, expect, it } from 'vitest'
import { Bookmark } from '../../types/bookmark'
import {
  buildTagStats,
  buildTagUrl,
  filterBookmarksByTag,
  getTagFromSearch,
} from '../bookmark-filter'

const bookmarks: Bookmark[] = [
  {
    id: '1',
    url: 'https://example.com/one',
    title: 'One',
    tags: ['Docker', 'NAS', 'Docker'],
    orderIndex: 0,
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: '2',
    url: 'https://example.com/two',
    title: 'Two',
    tags: ['Docker', 'AI'],
    orderIndex: 1,
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: '3',
    url: 'https://example.com/three',
    title: 'Three',
    orderIndex: 2,
    createdAt: 1,
    updatedAt: 1,
  },
]

describe('bookmark tag filtering', () => {
  it('filters bookmarks by one exact tag and keeps all bookmarks without a filter', () => {
    expect(filterBookmarksByTag(bookmarks, 'Docker').map((bookmark) => bookmark.id)).toEqual(['1', '2'])
    expect(filterBookmarksByTag(bookmarks, null)).toBe(bookmarks)
  })

  it('counts each tag once per bookmark and sorts by usage', () => {
    expect(buildTagStats(bookmarks)).toEqual([
      { name: 'Docker', count: 2 },
      { name: 'AI', count: 1 },
      { name: 'NAS', count: 1 },
    ])
  })

  it('reads and writes a shareable tag query without dropping other parameters or hashes', () => {
    expect(getTagFromSearch('?tag=Docker')).toBe('Docker')
    expect(buildTagUrl('https://nowen.example/?view=grid#bookmarks', 'Docker')).toBe('/?view=grid&tag=Docker#bookmarks')
    expect(buildTagUrl('https://nowen.example/?view=grid&tag=Docker#bookmarks', null)).toBe('/?view=grid#bookmarks')
  })
})
