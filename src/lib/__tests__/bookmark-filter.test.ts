import { describe, expect, it } from 'vitest'
import { Bookmark } from '../../types/bookmark'
import {
  buildCollectionUrl,
  buildTagStats,
  buildTagUrl,
  filterBookmarksByTag,
  getCollectionFromSearch,
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

describe('bookmark filtering', () => {
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

  it('reads and writes a shareable tag query without dropping unrelated parameters or hashes', () => {
    expect(getTagFromSearch('?tag=Docker')).toBe('Docker')
    expect(buildTagUrl('https://nowen.example/?view=grid#bookmarks', 'Docker')).toBe('/?view=grid&tag=Docker#bookmarks')
    expect(buildTagUrl('https://nowen.example/?view=grid&tag=Docker#bookmarks', null)).toBe('/?view=grid#bookmarks')
  })

  it('keeps tag and collection filters mutually exclusive when entering a filter', () => {
    expect(buildTagUrl('https://nowen.example/?collection=dev&view=grid', 'Docker')).toBe('/?view=grid&tag=Docker')
    expect(buildCollectionUrl('https://nowen.example/?tag=Docker&view=grid', 'dev')).toBe('/?view=grid&collection=dev')
    expect(buildCollectionUrl('https://nowen.example/?collection=dev&view=grid', 'all')).toBe('/?view=grid')
  })

  it('preserves a newly selected collection when only clearing the previous tag', () => {
    expect(buildTagUrl('https://nowen.example/?collection=dev&tag=Docker', null)).toBe('/?collection=dev')
  })

  it('restores collection filters and treats an absent collection as all', () => {
    expect(getCollectionFromSearch('?collection=read-later')).toBe('read-later')
    expect(getCollectionFromSearch('?collection=productivity')).toBe('productivity')
    expect(getCollectionFromSearch('?tag=Docker')).toBe('all')
  })
})
