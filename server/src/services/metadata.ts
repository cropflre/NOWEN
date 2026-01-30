import * as cheerio from 'cheerio'

interface Metadata {
  title: string
  description: string
  favicon: string
  ogImage?: string
}

export async function parseMetadata(url: string): Promise<Metadata> {
  const urlObj = new URL(url)
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`
  
  // 默认值
  const defaultMetadata: Metadata = {
    title: urlObj.hostname.replace('www.', ''),
    description: '',
    favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`,
  }
  
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    })
    
    clearTimeout(timeout)
    
    if (!response.ok) {
      console.warn(`HTTP ${response.status} for ${url}`)
      return defaultMetadata
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // 提取标题 (优先级: og:title > twitter:title > title)
    const title = 
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().trim() ||
      defaultMetadata.title
    
    // 提取描述 (优先级: og:description > description > twitter:description)
    const description = 
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      ''
    
    // 提取图标 (优先级: apple-touch-icon > icon > shortcut icon > favicon.ico)
    let favicon = ''
    
    // Apple Touch Icon (通常是高清的)
    const appleIcon = $('link[rel="apple-touch-icon"]').attr('href') ||
                      $('link[rel="apple-touch-icon-precomposed"]').attr('href')
    
    // 标准 Icon
    const standardIcon = $('link[rel="icon"]').attr('href') ||
                         $('link[rel="shortcut icon"]').attr('href')
    
    // 优先使用 Apple Touch Icon
    const iconPath = appleIcon || standardIcon
    
    if (iconPath) {
      if (iconPath.startsWith('http')) {
        favicon = iconPath
      } else if (iconPath.startsWith('//')) {
        favicon = `${urlObj.protocol}${iconPath}`
      } else if (iconPath.startsWith('/')) {
        favicon = `${baseUrl}${iconPath}`
      } else {
        favicon = `${baseUrl}/${iconPath}`
      }
    }
    
    // 如果没有找到图标，使用 Google Favicon 服务
    if (!favicon) {
      favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    }
    
    // 提取 OG Image
    const ogImage = 
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      undefined
    
    // 处理相对路径的 ogImage
    let fullOgImage = ogImage
    if (ogImage && !ogImage.startsWith('http')) {
      if (ogImage.startsWith('//')) {
        fullOgImage = `${urlObj.protocol}${ogImage}`
      } else if (ogImage.startsWith('/')) {
        fullOgImage = `${baseUrl}${ogImage}`
      } else {
        fullOgImage = `${baseUrl}/${ogImage}`
      }
    }
    
    return {
      title: cleanText(title),
      description: cleanText(description).slice(0, 200),
      favicon,
      ogImage: fullOgImage,
    }
  } catch (error) {
    console.error(`抓取 ${url} 失败:`, error)
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
