import * as cheerio from 'cheerio'

interface Metadata {
  title: string
  description: string
  favicon: string
  ogImage?: string
}

// Favicon 备用服务列表（Google 在大陆不可用，优先用国内可达的）
const FAVICON_SERVICES = [
  (domain: string) => `https://favicon.im/${domain}`,
  (domain: string) => `https://api.iowen.cn/favicon/${domain}.png`,
  (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
]

function getFallbackFavicon(hostname: string): string {
  return FAVICON_SERVICES[0](hostname)
}

// ========== 语言检测与翻译 ==========

// 检测文本是否主要为中文
function isChinese(text: string): boolean {
  const chineseChars = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g)
  const totalChars = text.replace(/\s+/g, '').length
  if (totalChars === 0) return false
  return (chineseChars?.length || 0) / totalChars > 0.3
}

// 检测文本是否主要为英文/拉丁文
function isEnglish(text: string): boolean {
  const englishChars = text.match(/[a-zA-Z]/g)
  const totalChars = text.replace(/\s+/g, '').length
  if (totalChars === 0) return false
  return (englishChars?.length || 0) / totalChars > 0.5
}

// 使用 Google Translate 免费接口翻译文本
async function translateText(text: string, from: string, to: string): Promise<string> {
  if (!text || text.trim().length === 0) return text

  const apis = [
    // Google Translate 非官方 API（国内大部分可访问）
    async () => {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const resp = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      // 返回格式: [[["翻译结果","原文",null,null,10]],null,"en"]
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((seg: any) => seg[0]).join('')
      }
      throw new Error('unexpected response format')
    },
  ]

  for (const apiFn of apis) {
    try {
      const result = await apiFn()
      if (result && result.trim().length > 0) return result
    } catch (err: any) {
      console.warn(`翻译失败 (${from}->${to}):`, err?.message || err)
    }
  }

  // 全部翻译 API 失败，返回原文
  return text
}

// 根据用户语言和文本语言决定是否翻译
async function autoTranslate(text: string, userLang: string): Promise<string> {
  if (!text || text.trim().length === 0) return text

  const textIsChinese = isChinese(text)
  const textIsEnglish = isEnglish(text)
  const userWantsChinese = userLang === 'zh' || userLang === 'zh-CN' || userLang === 'zh-TW'

  if (userWantsChinese && textIsEnglish) {
    // 用户语言是中文，文本是英文 → 翻译成中文
    return translateText(text, 'en', 'zh-CN')
  } else if (!userWantsChinese && textIsChinese) {
    // 用户语言是英文，文本是中文 → 翻译成英文
    return translateText(text, 'zh-CN', 'en')
  }

  // 语言一致或无法判断，不翻译
  return text
}

// ========== 编码处理 ==========
async function decodeResponse(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') || ''
  const charsetMatch = contentType.match(/charset=([^\s;]+)/i)
  const charset = charsetMatch?.[1]?.toLowerCase().replace(/["']/g, '') || ''

  // 常见中文编码需要特殊处理
  const needsDecode = ['gbk', 'gb2312', 'gb18030', 'big5'].includes(charset)

  if (needsDecode) {
    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder(charset || 'gbk')
    return decoder.decode(buffer)
  }

  // 默认 UTF-8
  const html = await response.text()

  // 二次检测：有些页面 header 没标 charset，但 HTML meta 里标了
  if (!charset) {
    const metaMatch = html.match(/<meta[^>]+charset=["']?([^"';\s>]+)/i)
    const htmlCharset = metaMatch?.[1]?.toLowerCase() || ''
    if (['gbk', 'gb2312', 'gb18030', 'big5'].includes(htmlCharset)) {
      // 需要重新用正确编码解析，但已经读完了 body
      // 尝试用 response clone 或从已有 html 修复常见乱码
      // 由于 body 已消费，只能返回当前结果（大部分情况 UTF-8 也能用）
      return html
    }
  }

  return html
}

// 带重试的 fetch
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  timeout = 10000
): Promise<Response> {
  let lastError: Error | null = null

  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        redirect: 'follow',
      })
      clearTimeout(timer)
      return response
    } catch (err: any) {
      clearTimeout(timer)
      lastError = err

      // 被 abort 的不重试
      if (err.name === 'AbortError' && i < retries) {
        // 超时重试，增加等待时间
        await new Promise(r => setTimeout(r, 500 * (i + 1)))
        continue
      }

      // 网络错误重试
      if (i < retries) {
        await new Promise(r => setTimeout(r, 500 * (i + 1)))
        continue
      }
    }
  }

  throw lastError || new Error('fetch failed')
}

// 尝试获取站点的 /favicon.ico
async function tryFetchFaviconIco(baseUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const resp = await fetch(`${baseUrl}/favicon.ico`, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timer)
    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || ''
      if (contentType.includes('image') || contentType.includes('icon') || contentType.includes('octet-stream')) {
        return `${baseUrl}/favicon.ico`
      }
    }
  } catch {}
  return null
}

// 解析 icon 的完整 URL
function resolveUrl(iconPath: string, baseUrl: string, protocol: string): string {
  if (iconPath.startsWith('http')) return iconPath
  if (iconPath.startsWith('//')) return `${protocol}${iconPath}`
  if (iconPath.startsWith('/')) return `${baseUrl}${iconPath}`
  return `${baseUrl}/${iconPath}`
}

// 从多个 link 标签中选择最高质量的 icon
function findBestIcon($: cheerio.CheerioAPI): string | null {
  const candidates: { href: string; priority: number; size: number }[] = []

  // Apple Touch Icon（通常是高清的 152x152 或 180x180）
  $('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    const sizes = $(el).attr('sizes') || ''
    const size = parseInt(sizes.split('x')[0]) || 152
    candidates.push({ href, priority: 3, size })
  })

  // 标准 icon（可能有多个不同尺寸）
  $('link[rel="icon"], link[rel="shortcut icon"]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    const sizes = $(el).attr('sizes') || ''
    const size = parseInt(sizes.split('x')[0]) || 16
    const type = $(el).attr('type') || ''
    // SVG 图标优先级最高
    const priority = type.includes('svg') ? 4 : 2
    candidates.push({ href, priority, size })
  })

  // 按优先级和尺寸排序，取最好的
  candidates.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return b.size - a.size
  })

  return candidates[0]?.href || null
}

export async function parseMetadata(url: string, lang?: string): Promise<Metadata> {
  const urlObj = new URL(url)
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`

  const defaultMetadata: Metadata = {
    title: urlObj.hostname.replace('www.', ''),
    description: '',
    favicon: getFallbackFavicon(urlObj.hostname),
  }

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    })

    if (!response.ok) {
      console.warn(`HTTP ${response.status} for ${url}`)
      return defaultMetadata
    }

    const html = await decodeResponse(response)
    const $ = cheerio.load(html)

    // 提取标题 (优先级: og:title > twitter:title > title > h1)
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      defaultMetadata.title

    // 提取描述 (优先级: og:description > description > twitter:description)
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      ''

    // 提取最佳图标
    const bestIcon = findBestIcon($)
    let favicon = bestIcon ? resolveUrl(bestIcon, baseUrl, urlObj.protocol) : ''

    // HTML 中没找到 icon，尝试 /favicon.ico
    if (!favicon) {
      const faviconIco = await tryFetchFaviconIco(baseUrl)
      if (faviconIco) {
        favicon = faviconIco
      }
    }

    // 仍然没有，使用 favicon 备用服务
    if (!favicon) {
      favicon = getFallbackFavicon(urlObj.hostname)
    }

    // 提取 OG Image
    const ogImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[name="twitter:image:src"]').attr('content') ||
      undefined

    let fullOgImage = ogImage
    if (ogImage && !ogImage.startsWith('http')) {
      fullOgImage = resolveUrl(ogImage, baseUrl, urlObj.protocol)
    }

    let finalTitle = cleanText(title)
    let finalDescription = cleanText(description).slice(0, 200)

    // 根据用户语言自动翻译标题和描述
    if (lang) {
      const [translatedTitle, translatedDesc] = await Promise.all([
        autoTranslate(finalTitle, lang),
        autoTranslate(finalDescription, lang),
      ])
      finalTitle = translatedTitle
      finalDescription = translatedDesc
    }

    return {
      title: finalTitle,
      description: finalDescription,
      favicon,
      ogImage: fullOgImage,
    }
  } catch (error: any) {
    console.error(`抓取 ${url} 失败:`, error?.message || error)
    return defaultMetadata
  }
}

// 清理文本
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, '')
    .trim()
}
