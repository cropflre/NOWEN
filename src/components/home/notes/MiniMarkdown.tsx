import React from 'react'

/**
 * MiniMarkdown · 零依赖、轻量级 Markdown 渲染器
 * 支持子集（仅用于灵感卡片预览，不追求完整规范）：
 *   - 标题 # / ## / ###
 *   - 加粗 **text**
 *   - 斜体 *text*
 *   - 行内代码 `code`
 *   - 代码块 ```lang ... ```
 *   - 无序列表 - / *
 *   - 链接 [text](url)
 *   - #标签 高亮
 *   - 换行保留
 */

interface MiniMarkdownProps {
  content: string
  /** 行数限制（默认不限制；卡片预览传 3） */
  maxLines?: number
  /** 标签点击 */
  onTagClick?: (tag: string) => void
  className?: string
}

// 转义 HTML 特殊字符
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 渲染单行的内联格式
function renderInline(line: string, onTagClick?: (tag: string) => void): React.ReactNode[] {
  const tokens: React.ReactNode[] = []
  let cursor = 0
  let key = 0

  // 综合正则：代码 / 加粗 / 斜体 / 链接 / 标签
  const regex = /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))|(#([\p{L}\p{N}_-]+))/gu

  let match: RegExpExecArray | null
  while ((match = regex.exec(line)) !== null) {
    if (match.index > cursor) {
      tokens.push(line.slice(cursor, match.index))
    }
    if (match[1]) {
      // 行内代码
      tokens.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded text-[0.85em] font-mono"
          style={{
            background: 'var(--color-bg-tertiary, rgba(255,255,255,0.08))',
            color: 'var(--color-accent)',
          }}
        >
          {match[2]}
        </code>
      )
    } else if (match[3]) {
      // 加粗
      tokens.push(<strong key={key++} className="font-semibold">{match[4]}</strong>)
    } else if (match[5]) {
      // 斜体
      tokens.push(<em key={key++} className="italic">{match[6]}</em>)
    } else if (match[7]) {
      // 链接
      tokens.push(
        <a
          key={key++}
          href={match[9]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:decoration-solid"
          style={{ color: 'var(--color-accent)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {match[8]}
        </a>
      )
    } else if (match[10]) {
      // 标签
      const tag = match[11]
      tokens.push(
        <span
          key={key++}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            onTagClick?.(tag)
          }}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[0.8em] mx-0.5 transition-colors cursor-pointer hover:opacity-100"
          style={{
            background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
            color: 'var(--color-accent)',
            opacity: 0.85,
          }}
        >
          #{tag}
        </span>
      )
    }
    cursor = match.index + match[0].length
  }
  if (cursor < line.length) {
    tokens.push(line.slice(cursor))
  }
  return tokens
}

export function MiniMarkdown({ content, maxLines, onTagClick, className }: MiniMarkdownProps) {
  // 先用代码块占位符提取
  const blocks: { type: 'code'; lang: string; body: string }[] = []
  const placeholderText = content.replace(/```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g, (_m, lang, body) => {
    const i = blocks.length
    blocks.push({ type: 'code', lang: lang || '', body: body.replace(/\n$/, '') })
    return `\u0000CODEBLOCK_${i}\u0000`
  })

  const lines = placeholderText.split('\n')
  const truncated = typeof maxLines === 'number' ? lines.slice(0, maxLines) : lines
  const elements: React.ReactNode[] = []
  let listBuffer: React.ReactNode[] = []
  let lkey = 0

  const flushList = () => {
    if (listBuffer.length === 0) return
    elements.push(
      <ul key={`ul-${lkey++}`} className="list-disc list-inside space-y-0.5 my-1">
        {listBuffer}
      </ul>
    )
    listBuffer = []
  }

  truncated.forEach((rawLine, i) => {
    // 代码块占位符
    const cbMatch = rawLine.match(/^\u0000CODEBLOCK_(\d+)\u0000$/)
    if (cbMatch) {
      flushList()
      const block = blocks[Number(cbMatch[1])]
      if (block) {
        elements.push(
          <pre
            key={`cb-${i}`}
            className="my-1.5 p-2 rounded-md text-[0.8em] font-mono overflow-x-auto"
            style={{
              background: 'var(--color-bg-tertiary, rgba(0,0,0,0.25))',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            <code dangerouslySetInnerHTML={{ __html: escapeHtml(block.body) }} />
          </pre>
        )
      }
      return
    }

    // 标题
    const h = rawLine.match(/^(#{1,3})\s+(.+)$/)
    if (h) {
      flushList()
      const level = h[1].length
      const sizeClass = level === 1 ? 'text-base font-semibold' : level === 2 ? 'text-sm font-semibold' : 'text-sm font-medium'
      elements.push(
        <div key={`h-${i}`} className={`${sizeClass} mb-1 mt-1`}>
          {renderInline(h[2], onTagClick)}
        </div>
      )
      return
    }

    // 列表项
    const li = rawLine.match(/^\s*[-*]\s+(.+)$/)
    if (li) {
      listBuffer.push(<li key={`li-${i}`}>{renderInline(li[1], onTagClick)}</li>)
      return
    }

    // 空行
    if (rawLine.trim() === '') {
      flushList()
      elements.push(<div key={`br-${i}`} className="h-1.5" />)
      return
    }

    // 普通段落
    flushList()
    elements.push(
      <div key={`p-${i}`} className="leading-relaxed">
        {renderInline(rawLine, onTagClick)}
      </div>
    )
  })
  flushList()

  return (
    <div
      className={className}
      style={{ wordBreak: 'break-word' }}
    >
      {elements}
    </div>
  )
}

/**
 * 从 Markdown 中提取首行作为标题
 */
export function extractTitle(content: string, fallback = ''): string {
  const firstNonEmpty = content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  if (!firstNonEmpty) return fallback
  // 去掉 markdown 前缀
  return firstNonEmpty.replace(/^#{1,3}\s+/, '').replace(/[*`_]/g, '').slice(0, 60)
}

/**
 * 从 Markdown 中提取所有 #tag
 */
export function extractTags(content: string): string[] {
  const set = new Set<string>()
  const re = /(?:^|\s)#([\p{L}\p{N}_-]+)/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    set.add(m[1])
  }
  return Array.from(set)
}
