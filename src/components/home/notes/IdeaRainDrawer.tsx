/**
 * IdeaRainDrawer · 灵感雨时间轴抽屉
 * ---------------------------------------------------------------------------
 * 设计意图：
 *   首页之外，给用户一个"按时间脉络回看灵感"的入口。从右侧滑出，全高度面板，
 *   按"今天 / 昨天 / 本周 / 本月 / 更早"分组并显示时间点轴。
 *
 * 入口：QuickNotes 头部右上角的「↗ 灵感雨」按钮（球形悬浮可后续替换）。
 *
 * 视觉风格：
 *   - 玻璃质感面板（与 SiteSettingsCard 同源）
 *   - 时间点采用左侧脉冲圆点 + 垂直连线
 *   - 点击条目：调用 onJumpToNote 把外层卡片高亮 / 滚动到对应卡片
 *
 * 国际化：默认中文 fallback，外层会注入 t()，复用 quickNotes.idearain.*
 */

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X, Cloud, Zap, AlertTriangle, ExternalLink, Sparkles } from 'lucide-react'
import type { QuickNote } from '../../../lib/api'
import { extractTitle } from './MiniMarkdown'

interface IdeaRainDrawerProps {
  open: boolean
  notes: QuickNote[]
  remoteBaseUrl?: string | null
  onClose: () => void
  onJumpToNote?: (id: string) => void
}

/** 把时间分桶 */
function groupByPeriod(notes: QuickNote[], t: (k: string, opts?: any) => string) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfToday - 24 * 3600 * 1000
  const sevenDaysAgo = startOfToday - 7 * 24 * 3600 * 1000
  const thirtyDaysAgo = startOfToday - 30 * 24 * 3600 * 1000

  const buckets: Record<string, QuickNote[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    earlier: [],
  }
  notes.forEach((n) => {
    const ts = new Date(n.updatedAt).getTime()
    if (ts >= startOfToday) buckets.today.push(n)
    else if (ts >= startOfYesterday) buckets.yesterday.push(n)
    else if (ts >= sevenDaysAgo) buckets.thisWeek.push(n)
    else if (ts >= thirtyDaysAgo) buckets.thisMonth.push(n)
    else buckets.earlier.push(n)
  })

  return [
    { id: 'today', label: t('quickNotes.idearain.today', { defaultValue: '今天' }), notes: buckets.today },
    { id: 'yesterday', label: t('quickNotes.idearain.yesterday', { defaultValue: '昨天' }), notes: buckets.yesterday },
    { id: 'thisWeek', label: t('quickNotes.idearain.thisWeek', { defaultValue: '本周更早' }), notes: buckets.thisWeek },
    { id: 'thisMonth', label: t('quickNotes.idearain.thisMonth', { defaultValue: '本月更早' }), notes: buckets.thisMonth },
    { id: 'earlier', label: t('quickNotes.idearain.earlier', { defaultValue: '更早' }), notes: buckets.earlier },
  ].filter((g) => g.notes.length > 0)
}

function formatTimeShort(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function StatusDot({ status }: { status?: QuickNote['syncStatus'] }) {
  if (status === 'synced') {
    return <Cloud className="w-3 h-3" style={{ color: '#22c55e' }} />
  }
  if (status === 'conflict') {
    return <AlertTriangle className="w-3 h-3" style={{ color: '#f97316' }} />
  }
  if (status === 'syncing') {
    return (
      <span
        className="w-2 h-2 rounded-full inline-block"
        style={{ background: '#3b82f6', animation: 'pulse 1.4s ease-in-out infinite' }}
      />
    )
  }
  return <Zap className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
}

export function IdeaRainDrawer({
  open,
  notes,
  remoteBaseUrl,
  onClose,
  onJumpToNote,
}: IdeaRainDrawerProps) {
  const { t } = useTranslation()
  const groups = useMemo(() => groupByPeriod(notes, t), [notes, t])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[180]"
            style={{
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={onClose}
          />
          {/* 抽屉 */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 z-[181] w-full sm:max-w-md flex flex-col backdrop-blur-2xl border-l overflow-hidden"
            style={{
              background: 'var(--color-glass)',
              borderColor: 'var(--color-glass-border)',
            }}
          >
            {/* 顶部条 */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b"
              style={{ borderColor: 'var(--color-glass-border)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 28%, transparent), color-mix(in srgb, var(--color-accent) 8%, transparent))',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
                }}
              >
                <Sparkles className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {t('quickNotes.idearain.title', { defaultValue: '灵感雨' })}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {t('quickNotes.idearain.subtitle', {
                    count: notes.length,
                    defaultValue: '{{count}} 条想法的时间长卷',
                  })}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'var(--color-text-muted)' }}
                title="Esc"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              {groups.length === 0 ? (
                <div
                  className="h-full flex flex-col items-center justify-center gap-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Sparkles className="w-8 h-8 opacity-40" />
                  <div className="text-sm">{t('quickNotes.idearain.empty', { defaultValue: '还没有灵感落下' })}</div>
                </div>
              ) : (
                groups.map((group) => (
                  <section key={group.id} className="mb-6 last:mb-0">
                    <div
                      className="text-[11px] uppercase tracking-wider mb-2 font-semibold"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {group.label} · {group.notes.length}
                    </div>
                    <ul className="relative pl-5">
                      {/* 垂直连线 */}
                      <span
                        className="absolute left-[7px] top-1 bottom-1 w-px"
                        style={{
                          background:
                            'linear-gradient(to bottom, color-mix(in srgb, var(--color-accent) 30%, transparent), transparent)',
                        }}
                      />
                      {group.notes.map((n) => {
                        const title = extractTitle(n.content, t('quickNotes.title', { defaultValue: '灵感速记' }))
                        const date = new Date(n.updatedAt)
                        return (
                          <li key={n.id} className="relative mb-3 last:mb-0">
                            {/* 圆点 */}
                            <span
                              className="absolute -left-5 top-1.5 w-3 h-3 rounded-full"
                              style={{
                                background: 'var(--color-accent)',
                                boxShadow:
                                  '0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent)',
                              }}
                            />
                            <button
                              onClick={() => {
                                onJumpToNote?.(n.id)
                                onClose()
                              }}
                              className="block w-full text-left rounded-lg p-2.5 transition-all hover:translate-x-0.5"
                              style={{
                                background: 'var(--color-bg-tertiary, rgba(255,255,255,0.03))',
                                border: '1px solid var(--color-glass-border)',
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-[11px] font-mono"
                                  style={{ color: 'var(--color-text-muted)' }}
                                >
                                  {formatTimeShort(date)}
                                </span>
                                <StatusDot status={n.syncStatus} />
                                {n.tags && n.tags.length > 0 && (
                                  <span
                                    className="text-[10px] truncate"
                                    style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}
                                  >
                                    {n.tags.slice(0, 2).map((tg) => `#${tg}`).join(' ')}
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-[13px] line-clamp-2 leading-snug"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                {title}
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))
              )}
            </div>

            {/* 底部跳转传送门 */}
            {remoteBaseUrl && (
              <div
                className="px-5 py-3 border-t"
                style={{ borderColor: 'var(--color-glass-border)' }}
              >
                <a
                  href={remoteBaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 text-xs rounded-lg font-medium transition-all"
                  style={{
                    background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    color: 'var(--color-accent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)',
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('quickNotes.idearain.openRemote', { defaultValue: '在 nowen-note 中打开' })}
                </a>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
