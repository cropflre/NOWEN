/**
 * Tags 工具函数
 * 统一处理 tags 的解析和序列化，兼容旧的 JSON 数组格式和逗号分隔格式
 */

/**
 * 将数据库中的 tags 字符串解析为数组
 * 兼容两种格式：
 * - 旧格式：JSON 数组，如 '["tag1","tag2"]'
 * - 新格式：逗号分隔，如 'tag1,tag2'
 */
export function parseTags(tagsStr: string | null | undefined): string[] {
  if (!tagsStr || typeof tagsStr !== 'string') return []

  const trimmed = tagsStr.trim()
  if (!trimmed) return []

  // 兼容旧的 JSON 数组格式
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((t: any) => String(t).trim()).filter(Boolean)
      }
    } catch {
      // JSON 解析失败，回退到逗号分隔
    }
  }

  return trimmed.split(',').map((t: string) => t.trim()).filter(Boolean)
}

/**
 * 将 tags 数组序列化为逗号分隔的字符串（统一新格式）
 */
export function serializeTags(tags: string[] | string | null | undefined): string | null {
  if (!tags) return null
  if (Array.isArray(tags)) return tags.filter(Boolean).join(',') || null
  return tags
}

/**
 * 合并已有标签和新标签（去重）
 */
export function mergeTags(existingTagsStr: string | null | undefined, newTags: string[]): string {
  const existing = parseTags(existingTagsStr)
  const merged = [...new Set([...existing, ...newTags])]
  return merged.filter(Boolean).join(',')
}

/**
 * 将书签对象的 tags 字段从字符串解析为数组（用于 API 响应）
 */
export function parseBookmarkTags(bookmark: any): any {
  if (bookmark && typeof bookmark.tags === 'string' && bookmark.tags) {
    bookmark.tags = parseTags(bookmark.tags)
  } else if (bookmark) {
    bookmark.tags = bookmark.tags || []
  }
  return bookmark
}
