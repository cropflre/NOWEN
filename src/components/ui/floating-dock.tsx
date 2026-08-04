import { useEffect, useRef, useState } from 'react'
import { ChevronUp, Grip, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DockItemType {
  id: string
  title: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  subItems?: DockItemType[]
  isActive?: boolean
}

interface FloatingDockProps {
  items: DockItemType[]
  leftItems?: DockItemType[]
  className?: string
}

const DOCK_COLLAPSED_KEY = 'desktop-dock-collapsed-v2'

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(DOCK_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

export function FloatingDock({ items, leftItems, className }: FloatingDockProps) {
  const [isDark, setIsDark] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(loadCollapsed)
  const allItems = [...(leftItems ?? []), ...items]

  useEffect(() => {
    const syncTheme = () => setIsDark(document.documentElement.classList.contains('dark'))
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const toggleCollapse = () => {
    setIsCollapsed((previous) => {
      const next = !previous
      try {
        localStorage.setItem(DOCK_COLLAPSED_KEY, String(next))
      } catch {
        // Local persistence is optional; the visual state still works.
      }
      return next
    })
  }

  const surfaceStyle: React.CSSProperties = {
    background: isDark ? 'rgba(17, 19, 28, 0.82)' : 'rgba(255, 255, 255, 0.84)',
    border: '1px solid var(--ambient-control-border, var(--color-glass-border))',
    backdropFilter: 'blur(18px) saturate(135%)',
    WebkitBackdropFilter: 'blur(18px) saturate(135%)',
    boxShadow: isDark
      ? '0 20px 54px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255,255,255,0.05)'
      : '0 20px 54px rgba(63, 76, 116, 0.12), inset 0 1px 0 rgba(255,255,255,0.78)',
  }

  return (
    <div
      data-testid="ambient-desktop-dock"
      className={cn(
        'ambient-desktop-dock fixed bottom-6 left-1/2 z-50 -translate-x-1/2 select-none',
        className,
      )}
      style={{ bottom: 'max(24px, env(safe-area-inset-bottom))' }}
    >
      {isCollapsed ? (
        <button
          type="button"
          aria-label="展开快捷菜单"
          title="展开快捷菜单"
          className="relative grid h-12 w-12 place-items-center rounded-2xl transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 active:scale-95"
          style={{ ...surfaceStyle, color: 'var(--color-text-secondary)' }}
          onClick={toggleCollapse}
        >
          <Grip className="h-4 w-4" />
          <span
            className="absolute inset-x-3 bottom-1.5 h-px rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }}
          />
        </button>
      ) : (
        <div className="flex items-center gap-1 rounded-2xl p-1.5" style={surfaceStyle}>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={toggleCollapse}
            title="收起快捷菜单"
            aria-label="收起快捷菜单"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>

          <div className="mx-0.5 h-6 w-px" style={{ background: 'var(--color-border-light)' }} />

          {allItems.map((item) => (
            <AmbientDockItem key={item.id} item={item} isDark={isDark} />
          ))}
        </div>
      )}
    </div>
  )
}

function AmbientDockItem({ item, isDark }: { item: DockItemType; isDark: boolean }) {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const hasSubmenu = Boolean(item.subItems?.length)

  useEffect(() => {
    if (!isSubmenuOpen) return

    const handleOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsSubmenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isSubmenuOpen])

  const handleClick = () => {
    if (hasSubmenu) {
      setIsSubmenuOpen((previous) => !previous)
      return
    }
    item.onClick?.()
  }

  const sharedButton = (
    <span
      className={cn(
        'relative grid h-10 w-10 place-items-center rounded-xl',
        'transition-[transform,background-color,color] duration-150',
        'group-hover:-translate-y-0.5 group-hover:scale-[1.03]',
        !item.isActive && 'group-hover:bg-black/5 dark:group-hover:bg-white/10',
      )}
      style={{
        color: item.isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        background: item.isActive
          ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
          : 'transparent',
      }}
    >
      <span className="grid h-4.5 w-4.5 place-items-center [&>svg]:h-[18px] [&>svg]:w-[18px]">
        {item.icon}
      </span>
      {item.isActive && (
        <span
          className="absolute inset-x-3 bottom-1 h-0.5 rounded-full"
          style={{ background: 'var(--color-primary)' }}
        />
      )}
    </span>
  )

  return (
    <div ref={wrapperRef} className="group relative">
      {!isSubmenuOpen && (
        <div
          className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-20 -translate-x-1/2 translate-y-1 scale-95 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100"
          style={{
            color: 'var(--color-text-primary)',
            background: isDark ? 'rgba(13, 15, 22, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            border: '1px solid var(--color-glass-border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          }}
        >
          {item.title}
        </div>
      )}

      {item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.title}
        >
          {sharedButton}
        </a>
      ) : (
        <button type="button" onClick={handleClick} aria-label={item.title}>
          {sharedButton}
        </button>
      )}

      {isSubmenuOpen && item.subItems && (
        <div
          className="absolute bottom-[calc(100%+12px)] left-1/2 z-30 min-w-[190px] -translate-x-1/2 rounded-2xl p-2"
          style={{
            background: isDark ? 'rgba(16, 18, 27, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            border: '1px solid var(--ambient-control-border, var(--color-glass-border))',
            boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          }}
        >
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {item.title}
            </span>
            <button
              type="button"
              onClick={() => setIsSubmenuOpen(false)}
              className="grid h-6 w-6 place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="关闭菜单"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {item.subItems.map((subItem) => (
              <button
                key={subItem.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                style={{
                  color: subItem.isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  background: subItem.isActive
                    ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
                    : 'transparent',
                }}
                onClick={() => {
                  subItem.onClick?.()
                  setIsSubmenuOpen(false)
                }}
              >
                <span className="grid h-5 w-5 place-items-center [&>svg]:h-4 [&>svg]:w-4">
                  {subItem.icon}
                </span>
                <span className="flex-1 truncate">{subItem.title}</span>
                {subItem.isActive && (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
