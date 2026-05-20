import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, RefreshCw, Zap, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { NoteSyncStatus } from '../../../lib/api'

interface SyncBadgeProps {
  status: NoteSyncStatus | undefined
  /** 是否配置了 nowen-note */
  configured: boolean
  /** 远端笔记 URL（点击直接打开） */
  remoteUrl?: string | null
  /** 触发立即推送 */
  onPushNow?: () => void
  /** 跳转到设置页 */
  onConfigure?: () => void
  size?: 'sm' | 'md'
}

/**
 * SyncBadge · 同步状态四态徽标
 *  ☁ synced  / ↻ syncing / ⚡ local / ⚠ conflict
 */
export function SyncBadge({
  status,
  configured,
  remoteUrl,
  onPushNow,
  onConfigure,
  size = 'sm',
}: SyncBadgeProps) {
  const { t } = useTranslation()
  const [showTooltip, setShowTooltip] = React.useState(false)

  // 未配置 nowen-note：显示引导
  if (!configured) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          onConfigure?.()
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[10px] transition-opacity hover:opacity-100"
        style={{
          background: 'transparent',
          color: 'var(--color-text-muted)',
          opacity: 0.55,
        }}
      >
        <Cloud className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <Tooltip show={showTooltip} text={t('quickNotes.sync.notConfigured')} />
      </button>
    )
  }

  const effective = status || 'local'

  const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'

  switch (effective) {
    case 'synced':
      return (
        <a
          href={remoteUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[10px] transition-all"
          style={{
            background: 'color-mix(in srgb, #22c55e 15%, transparent)',
            color: '#22c55e',
          }}
        >
          <Cloud className={iconClass} />
          <Tooltip show={showTooltip} text={t('quickNotes.sync.syncedTip')} />
        </a>
      )

    case 'syncing':
      return (
        <span
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[10px]"
          style={{
            background: 'color-mix(in srgb, #3b82f6 15%, transparent)',
            color: '#3b82f6',
          }}
        >
          <RefreshCw className={`${iconClass} animate-spin`} />
          <Tooltip show={showTooltip} text={t('quickNotes.sync.syncingTip')} />
        </span>
      )

    case 'conflict':
      return (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPushNow?.()
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[10px] transition-all hover:scale-105"
          style={{
            background: 'color-mix(in srgb, #f97316 18%, transparent)',
            color: '#f97316',
          }}
        >
          <AlertTriangle className={iconClass} />
          <Tooltip show={showTooltip} text={t('quickNotes.sync.conflictTip')} />
        </button>
      )

    case 'local':
    default:
      return (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPushNow?.()
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[10px] transition-all hover:scale-105"
          style={{
            background: 'var(--color-bg-tertiary, rgba(255,255,255,0.06))',
            color: 'var(--color-text-muted)',
          }}
        >
          <Zap className={iconClass} />
          <Tooltip show={showTooltip} text={t('quickNotes.sync.pushNow')} />
        </button>
      )
  }
}

function Tooltip({ show, text }: { show: boolean; text: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md text-[10px] z-50 pointer-events-none"
          style={{
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
          }}
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
