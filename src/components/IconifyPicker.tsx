import { useState, useCallback, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Search, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../lib/utils'
import { searchIconifyIcons, popularIconSets, getIconSetIcons, type IconifySearchResult } from '../lib/icons'

interface IconifyPickerProps {
  onSelect: (iconName: string) => void
  selectedIcon?: string
  color?: string
}

export function IconifyPicker({ onSelect, selectedIcon, color }: IconifyPickerProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<IconifySearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeSet, setActiveSet] = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    setActiveSet(null)
    const icons = await searchIconifyIcons(q, 80)
    setResults(icons)
    setLoading(false)
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(value), 350)
  }

  const handleSetClick = async (prefix: string) => {
    if (activeSet === prefix) {
      setActiveSet(null)
      setResults([])
      return
    }
    setActiveSet(prefix)
    setLoading(true)
    setQuery('')
    const icons = await getIconSetIcons(prefix, 80)
    setResults(icons)
    setLoading(false)
  }

  const activeColor = color || 'var(--color-primary)'

  return (
    <div className="space-y-2">
      {/* 搜索输入框 */}
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={t('bookmark.modal.iconify_search_placeholder')}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--color-text-primary)' }}
        />
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />}
      </div>

      {/* 搜索结果 / 热门图标集 */}
      {results.length > 0 ? (
        <div className="grid grid-cols-8 gap-1 max-h-[180px] overflow-y-auto">
          {results.map((icon) => (
            <button
              key={icon.name}
              type="button"
              onClick={() => onSelect(icon.name)}
              className={cn(
                'p-2 rounded-lg transition-all hover:scale-110 flex items-center justify-center'
              )}
              style={{
                background: selectedIcon === icon.name ? activeColor + '20' : 'transparent',
                boxShadow: selectedIcon === icon.name ? `inset 0 0 0 1.5px ${activeColor}` : 'none',
              }}
              title={icon.name}
            >
              <Icon
                icon={icon.name}
                className="w-5 h-5"
                style={{ color: selectedIcon === icon.name ? activeColor : 'var(--color-text-secondary)' }}
              />
            </button>
          ))}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-6" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">{t('bookmark.modal.iconify_loading')}</span>
        </div>
      ) : query.trim() ? (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('bookmark.modal.iconify_no_results')}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('bookmark.modal.iconify_popular')}
          </p>
          <div className="grid grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto">
            {popularIconSets.map((set) => (
              <button
                key={set.prefix}
                type="button"
                onClick={() => handleSetClick(set.prefix)}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
                  activeSet === set.prefix ? 'ring-1' : ''
                )}
                style={{
                  background: activeSet === set.prefix ? activeColor + '10' : 'var(--color-bg-tertiary)',
                  ringColor: activeSet === set.prefix ? activeColor : 'transparent',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <div className="flex gap-0.5 flex-shrink-0">
                  {set.sample.slice(0, 3).map((s) => (
                    <Icon key={s} icon={`${set.prefix}:${s}`} className="w-3.5 h-3.5" />
                  ))}
                </div>
                <span className="text-xs truncate">{set.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
