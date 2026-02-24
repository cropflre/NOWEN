/**
 * 浏览器 HTML 书签文件解析器
 * 
 * 支持所有主流浏览器导出的 Netscape Bookmark File Format：
 * - Google Chrome
 * - Microsoft Edge
 * - Mozilla Firefox
 * - Safari
 * - Opera / Brave / Vivaldi 等 Chromium 内核浏览器
 */

import { Bookmark, Category } from '../types/bookmark'
import { SiteSettings } from './api'

interface ParsedBookmark {
  url: string
  title: string
  icon?: string       // DATA URI favicon
  addDate?: number    // 添加时间戳 (秒)
  folder: string[]    // 所属文件夹路径
}

interface BrowserBookmarkResult {
  bookmarks: Bookmark[]
  categories: Category[]
  settings: SiteSettings
  stats: {
    totalLinks: number
    totalFolders: number
    skippedEmpty: number
  }
}

// 分类配色
const CATEGORY_COLORS = [
  '#667eea', '#f093fb', '#f5576c', '#43e97b', '#fa709a',
  '#4facfe', '#00f2fe', '#a18cd1', '#fbc2eb', '#fccb90',
  '#e0c3fc', '#8fd3f4', '#84fab0', '#fad0c4', '#a6c0fe',
]

/**
 * 检测是否为浏览器书签 HTML 文件
 */
export function isBrowserBookmarkHTML(content: string): boolean {
  const upper = content.substring(0, 500).toUpperCase()
  return upper.includes('<!DOCTYPE NETSCAPE-BOOKMARK-FILE') ||
    (upper.includes('<DL>') && upper.includes('<DT>') && upper.includes('HREF='))
}

/**
 * 解析浏览器书签 HTML 文件
 */
export function parseBrowserBookmarks(html: string): BrowserBookmarkResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const allLinks: ParsedBookmark[] = []
  const folderSet = new Set<string>()

  // 递归解析 <DL> 列表
  function parseDL(dl: Element, folderPath: string[]) {
    const children = dl.children
    let currentFolder: string | null = null

    for (let i = 0; i < children.length; i++) {
      const child = children[i]

      if (child.tagName === 'DT') {
        // <DT> 内可能是 <H3> (文件夹) 或 <A> (链接)
        const h3 = child.querySelector(':scope > H3')
        const a = child.querySelector(':scope > A')

        if (h3) {
          // 这是一个文件夹
          currentFolder = h3.textContent?.trim() || ''
          if (currentFolder) {
            const newPath = [...folderPath, currentFolder]
            folderSet.add(currentFolder)

            // 查找紧跟的 <DL> (文件夹内容)
            const nextDL = child.querySelector(':scope > DL')
            if (nextDL) {
              parseDL(nextDL, newPath)
            }
          }
        } else if (a) {
          // 这是一个书签链接
          const url = a.getAttribute('HREF') || a.getAttribute('href') || ''
          if (!url || url.startsWith('javascript:') || url.startsWith('place:')) {
            continue
          }

          const title = a.textContent?.trim() || url
          const icon = a.getAttribute('ICON') || a.getAttribute('icon') || undefined
          const addDateStr = a.getAttribute('ADD_DATE') || a.getAttribute('add_date')
          const addDate = addDateStr ? parseInt(addDateStr, 10) : undefined

          allLinks.push({
            url,
            title,
            icon,
            addDate,
            folder: folderPath,
          })
        }
      }
    }
  }

  // 找到第一个 <DL> 开始解析
  const rootDL = doc.querySelector('DL')
  if (rootDL) {
    parseDL(rootDL, [])
  }

  // 构建分类（使用第一级文件夹作为分类）
  const now = Date.now()
  const categoryMap = new Map<string, string>() // folder name -> category id
  const categories: Category[] = []
  let colorIdx = 0

  // 排除常见的浏览器内置文件夹
  const SKIP_FOLDERS = new Set([
    '书签栏', 'Bookmarks bar', 'Bookmarks Bar', 'Bookmarks Toolbar',
    '其他书签', 'Other bookmarks', 'Other Bookmarks',
    '移动设备书签', 'Mobile bookmarks', 'Mobile Bookmarks',
    'Favorites bar', 'Favorites Bar', '收藏夹栏',
    'toolbar_____', 'unfiled_____', 'menu________', 'mobile______',
  ])

  for (const folderName of folderSet) {
    if (SKIP_FOLDERS.has(folderName)) continue

    const id = `browser-${folderName.replace(/\s+/g, '-').toLowerCase()}-${now}`
    categoryMap.set(folderName, id)
    categories.push({
      id,
      name: folderName,
      color: CATEGORY_COLORS[colorIdx % CATEGORY_COLORS.length],
      orderIndex: colorIdx,
    })
    colorIdx++
  }

  // 构建书签
  let skippedEmpty = 0
  const bookmarks: Bookmark[] = allLinks.map((link, index) => {
    // 使用第一个非内置的文件夹作为分类
    let categoryId: string | undefined
    for (const f of link.folder) {
      if (!SKIP_FOLDERS.has(f) && categoryMap.has(f)) {
        categoryId = categoryMap.get(f)
        break
      }
    }

    // 处理 favicon：DATA URI 格式直接使用
    let favicon: string | undefined
    if (link.icon && link.icon.startsWith('data:')) {
      favicon = link.icon
    }

    const createdAt = link.addDate
      ? link.addDate * 1000
      : now + index

    return {
      id: `browser-${index}-${now}`,
      url: link.url,
      title: link.title,
      favicon,
      category: categoryId,
      orderIndex: index,
      createdAt,
      updatedAt: createdAt,
    } as Bookmark
  })

  return {
    bookmarks,
    categories,
    settings: {} as SiteSettings,
    stats: {
      totalLinks: allLinks.length,
      totalFolders: folderSet.size,
      skippedEmpty,
    },
  }
}
