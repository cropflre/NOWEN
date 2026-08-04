import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type PaginationToken = number | 'ellipsis-start' | 'ellipsis-end'

export function buildPaginationTokens(currentPage: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 0) return []
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const page = Math.min(Math.max(currentPage, 1), totalPages)
  const tokens: PaginationToken[] = [1]

  let rangeStart = Math.max(2, page - 1)
  let rangeEnd = Math.min(totalPages - 1, page + 1)

  if (page <= 4) {
    rangeStart = 2
    rangeEnd = 5
  } else if (page >= totalPages - 3) {
    rangeStart = totalPages - 4
    rangeEnd = totalPages - 1
  }

  if (rangeStart > 2) tokens.push('ellipsis-start')
  for (let value = rangeStart; value <= rangeEnd; value += 1) tokens.push(value)
  if (rangeEnd < totalPages - 1) tokens.push('ellipsis-end')

  tokens.push(totalPages)
  return tokens
}

type PaginationCopy = {
  navigation: string
  previous: string
  next: string
  page: (page: number) => string
  range: (start: number, end: number, total: number) => string
  perPage: string
  pageStatus: (page: number, totalPages: number) => string
}

const PAGINATION_COPY: Record<string, PaginationCopy> = {
  zh: {
    navigation: '分页导航',
    previous: '上一页',
    next: '下一页',
    page: (page) => `第 ${page} 页`,
    range: (start, end, total) => `第 ${start}–${end} 项，共 ${total} 项`,
    perPage: '每页',
    pageStatus: (page, totalPages) => `${page} / ${totalPages}`,
  },
  en: {
    navigation: 'Pagination',
    previous: 'Previous page',
    next: 'Next page',
    page: (page) => `Page ${page}`,
    range: (start, end, total) => `${start}–${end} of ${total}`,
    perPage: 'Per page',
    pageStatus: (page, totalPages) => `${page} / ${totalPages}`,
  },
  ja: {
    navigation: 'ページナビゲーション',
    previous: '前のページ',
    next: '次のページ',
    page: (page) => `${page} ページ`,
    range: (start, end, total) => `${start}–${end} / 全 ${total} 件`,
    perPage: '表示件数',
    pageStatus: (page, totalPages) => `${page} / ${totalPages}`,
  },
  ko: {
    navigation: '페이지 탐색',
    previous: '이전 페이지',
    next: '다음 페이지',
    page: (page) => `${page}페이지`,
    range: (start, end, total) => `${start}–${end} / 총 ${total}개`,
    perPage: '페이지당',
    pageStatus: (page, totalPages) => `${page} / ${totalPages}`,
  },
}

function resolveCopy(language: string | undefined) {
  const normalized = language?.toLowerCase().split('-')[0] || 'zh'
  return PAGINATION_COPY[normalized] || PAGINATION_COPY.en
}

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className = '',
}: PaginationProps) {
  const { i18n } = useTranslation()
  const copy = resolveCopy(i18n.resolvedLanguage || i18n.language)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)

  if (total <= pageSize) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, total)
  const tokens = buildPaginationTokens(currentPage, totalPages)
  const selectablePageSizes = Array.from(new Set([...pageSizeOptions, pageSize]))
    .filter((value) => value > 0)
    .sort((a, b) => a - b)

  const goToPage = (nextPage: number) => {
    const clampedPage = Math.min(Math.max(nextPage, 1), totalPages)
    if (clampedPage !== currentPage) onPageChange(clampedPage)
  }

  const buttonStyle = {
    background: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-glass-border)',
    color: 'var(--color-text-secondary)',
  }

  return (
    <nav
      aria-label={copy.navigation}
      className={`relative z-10 mt-5 flex flex-col gap-3 rounded-2xl px-3 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-4 ${className}`}
      style={{
        background: 'color-mix(in srgb, var(--color-glass) 82%, transparent)',
        border: '1px solid var(--color-glass-border)',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
          {copy.range(start, end, total)}
        </span>

        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="hidden lg:inline">{copy.perPage}</span>
            <select
              aria-label={copy.perPage}
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-9 cursor-pointer rounded-xl px-2.5 text-xs font-medium outline-none transition-colors focus:ring-2"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-glass-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {selectablePageSizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          aria-label={copy.previous}
          title={copy.previous}
          disabled={currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
          className="flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-xs font-medium transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
          style={buttonStyle}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1 hidden lg:inline">{copy.previous}</span>
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {tokens.map((token) => {
            if (typeof token !== 'number') {
              return (
                <span
                  key={token}
                  aria-hidden="true"
                  className="flex h-9 w-8 items-center justify-center"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              )
            }

            const isActive = token === currentPage
            return (
              <button
                key={token}
                type="button"
                aria-label={copy.page(token)}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => goToPage(token)}
                className="flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-semibold tabular-nums transition-all hover:-translate-y-0.5"
                style={isActive
                  ? {
                      background: 'var(--color-primary)',
                      border: '1px solid color-mix(in srgb, var(--color-primary) 80%, white)',
                      color: '#fff',
                      boxShadow: '0 6px 16px color-mix(in srgb, var(--color-primary) 28%, transparent)',
                    }
                  : buttonStyle}
              >
                {token}
              </button>
            )
          })}
        </div>

        <span
          className="min-w-14 text-center text-xs font-medium tabular-nums sm:hidden"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {copy.pageStatus(currentPage, totalPages)}
        </span>

        <button
          type="button"
          aria-label={copy.next}
          title={copy.next}
          disabled={currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
          className="flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-xs font-medium transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
          style={buttonStyle}
        >
          <span className="mr-1 hidden lg:inline">{copy.next}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
