import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
  spotlightColor?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  lightweight?: boolean
  onClick?: () => void
  onContextMenu?: (event: React.MouseEvent) => void
  openOnMiddleClick?: boolean
  ariaLabel?: string
}

const INTERACTIVE_DESCENDANT_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  '[role="button"]',
  '[contenteditable="true"]',
].join(',')

function isInteractiveDescendant(event: React.MouseEvent<HTMLDivElement>) {
  const target = event.target
  if (!(target instanceof Element) || target === event.currentTarget) return false

  const interactiveElement = target.closest(INTERACTIVE_DESCENDANT_SELECTOR)
  return Boolean(
    interactiveElement &&
    interactiveElement !== event.currentTarget &&
    event.currentTarget.contains(interactiveElement),
  )
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(102, 126, 234, 0.15)',
  size = 'md',
  lightweight = false,
  onClick,
  onContextMenu,
  openOnMiddleClick,
  ariaLabel,
}: SpotlightCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number>(0)
  const rectRef = useRef<DOMRect | null>(null)
  const pendingPointerRef = useRef({ x: 0, y: 0 })
  const trackingActiveRef = useRef(false)
  const [opacity, setOpacity] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const shouldOpenOnMiddleClick = openOnMiddleClick ?? Boolean(onContextMenu)

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!trackingActiveRef.current || !containerRef.current || !rectRef.current) return

    pendingPointerRef.current = { x: event.clientX, y: event.clientY }
    if (rafIdRef.current) return

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = 0
      const container = containerRef.current
      const rect = rectRef.current
      if (!container || !rect) return

      const { x, y } = pendingPointerRef.current
      container.style.setProperty('--spotlight-x', `${x - rect.left}px`)
      container.style.setProperty('--spotlight-y', `${y - rect.top}px`)
    })
  }, [])

  const handleMouseEnter = useCallback(() => {
    const shouldTrack = document.documentElement.classList.contains('dark')
    trackingActiveRef.current = shouldTrack

    if (shouldTrack && containerRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect()
      setOpacity(1)
      setIsHovered(true)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    trackingActiveRef.current = false
    rectRef.current = null
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = 0
    }
    setOpacity(0)
    setIsHovered(false)
  }, [])

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (
      event.button === 1 &&
      shouldOpenOnMiddleClick &&
      onClick &&
      !isInteractiveDescendant(event)
    ) {
      event.preventDefault()
    }
  }, [onClick, shouldOpenOnMiddleClick])

  const handleAuxClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (
      event.button !== 1 ||
      !shouldOpenOnMiddleClick ||
      !onClick ||
      isInteractiveDescendant(event)
    ) {
      return
    }

    event.preventDefault()
    onClick()
    try {
      window.focus()
    } catch {
      // Some embedded browsers do not allow focus restoration.
    }
  }, [onClick, shouldOpenOnMiddleClick])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || event.target !== event.currentTarget) return
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    onClick()
  }, [onClick])

  useEffect(() => () => cancelAnimationFrame(rafIdRef.current), [])

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  }

  const commonStyle = {
    '--spotlight-x': '0px',
    '--spotlight-y': '0px',
    '--spotlight-color': spotlightColor,
    background: 'var(--color-glass)',
    border: '1px solid var(--color-glass-border)',
    boxShadow: 'var(--color-shadow)',
  } as React.CSSProperties

  const interactiveProps = onClick
    ? {
        role: 'link' as const,
        tabIndex: 0,
        'aria-label': ariaLabel,
        onKeyDown: handleKeyDown,
      }
    : {}

  if (lightweight) {
    return (
      <div
        {...interactiveProps}
        data-spotlight-card="true"
        data-spotlight-profile="lightweight"
        data-spotlight-size={size}
        onMouseDown={handleMouseDown}
        onAuxClick={handleAuxClick}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={cn(
          'relative overflow-hidden rounded-2xl',
          'transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          onClick && 'cursor-pointer active:scale-[0.99]',
          sizeClasses[size],
          className,
        )}
        style={{
          ...commonStyle,
          background: 'color-mix(in srgb, var(--color-glass) 94%, var(--color-bg-primary) 6%)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      >
        <div className="relative z-10">{children}</div>
      </div>
    )
  }

  return (
    <motion.div
      {...interactiveProps}
      ref={containerRef}
      data-spotlight-card="true"
      data-spotlight-profile="full"
      data-spotlight-size={size}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onAuxClick={handleAuxClick}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        'relative overflow-hidden rounded-2xl backdrop-blur-xl',
        'transition-all duration-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        onClick && 'cursor-pointer',
        sizeClasses[size],
        className,
      )}
      style={commonStyle}
      whileHover={{
        y: -4,
        boxShadow: 'var(--color-shadow-hover)',
        transition: { duration: 0.3 },
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <div
        className="pointer-events-none absolute -inset-px hidden rounded-2xl transition-opacity duration-300 will-change-transform dark:block"
        style={{
          opacity,
          background: `radial-gradient(600px circle at var(--spotlight-x) var(--spotlight-y), ${spotlightColor}, transparent 40%)`,
        }}
      />

      <div
        className="pointer-events-none absolute -inset-px hidden rounded-2xl transition-opacity duration-300 dark:block"
        style={{
          opacity,
          background: 'radial-gradient(400px circle at var(--spotlight-x) var(--spotlight-y), rgba(255,255,255,0.06), transparent 40%)',
        }}
      />

      {isHovered && (
        <div className="pointer-events-none absolute inset-0 hidden overflow-hidden rounded-2xl dark:block">
          <div
            className="absolute h-20 w-20 animate-border-beam bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm will-change-transform"
            style={{ offsetPath: 'rect(0 100% 100% 0 round 16px)' }}
          />
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

interface StatusCardProps extends SpotlightCardProps {
  status?: 'online' | 'offline' | 'loading'
  statusColor?: string
}

export function StatusCard({ children, status, statusColor, ...props }: StatusCardProps) {
  const color = statusColor ?? {
    online: '#22c55e',
    offline: '#ef4444',
    loading: '#eab308',
  }[status ?? 'online']

  return (
    <SpotlightCard {...props}>
      {status && (
        <div className="absolute right-3 top-3 z-20">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: color }}
            />
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
          </span>
        </div>
      )}
      {children}
    </SpotlightCard>
  )
}
