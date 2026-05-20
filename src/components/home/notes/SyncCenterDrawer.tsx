/**
 * SyncCenterDrawer · 灵感云·同步中心抽屉
 * ---------------------------------------------------------------------------
 * 设计意图：
 *   把 nowen-note 同步从"散落在每张卡片右下角徽标"升级为一个集中的控制面板。
 *   入口位于 SidebarNav 末尾的「灵感云」模块项，从右侧滑出。
 *
 * 内容结构（自上而下）：
 *   1. 连接状态卡：远端 URL / 同步模式 / 设置入口 / 远端外链
 *   2. 状态总览：☁synced / ⚡local / ⚠conflict 三色徽标 + 一键全部推送
 *   3. 待同步队列：仅本地的 note，逐条「↗ 推送」
 *   4. 冲突待解决：列表 + 「🔧 解决」按钮触发 onResolveConflict
 *   5. 底部联动：「↗ 切换到灵感雨」联动入口
 *
 * 未配置态（remoteConfigured=false）：
 *   显示空态引导卡，提供"前往设置"和"了解 nowen-note"双按钮。
 *
 * 视觉：复用 IdeaRainDrawer 的玻璃面板骨架（同源），保持产品语言一致。
 */
import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  X,
  Cloud,
  CloudOff,
  Zap,
  AlertTriangle,
  ExternalLink,
  Settings2,
  ArrowUpRight,
  Wrench,
  Info,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import type { QuickNote } from '../../../lib/api'
import { extractTitle } from './MiniMarkdown'

interface SyncCenterDrawerProps {
  open: boolean
  notes: QuickNote[]
  pushingIds: Set<string>
  remoteConfigured: boolean
  remoteBaseUrl?: string | null
  syncMode?: 'manual' | 'auto' | 'bidirectional'
  /** 推送指定笔记到 nowen-note */
  onPush: (id: string) => void | Promise<void>
  /** 触发冲突解决面板 */
  onResolveConflict?: (note: QuickNote) => void
  /** 打开站点设置（用于未配置 / 修改配置） */
  onOpenSettings?: () => void
  /** 打开"灵感雨"抽屉（与本抽屉互斥） */
  onOpenIdeaRain?: () => void
  onClose: () => void
}

export function SyncCenterDrawer({
  open,
  notes,
  pushingIds,
  remoteConfigured,
  remoteBaseUrl,
  syncMode = 'auto',
  onPush,
  onResolveConflict,
  onOpenSettings,
  onOpenIdeaRain,
  onClose,
}: SyncCenterDrawerProps) {
  const { t } = useTranslation()
  const [pushingAll, setPushingAll] = useState(false)

  const { synced, localNotes, conflictNotes, syncingCount } = useMemo(() => {
    const localList: QuickNote[] = []
    const conflictList: QuickNote[] = []
    let s = 0
    let sc = 0
    notes.forEach((n) => {
      if (n.syncStatus === 'synced') s++
      else if (n.syncStatus === 'conflict') conflictList.push(n)
      else if (n.syncStatus === 'syncing') sc++
      else localList.push(n)
    })
    // 按时间倒序
    localList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    conflictList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    return { synced: s, localNotes: localList, conflictNotes: conflictList, syncingCount: sc }
  }, [notes])

  const handlePushAll = async () => {
    if (localNotes.length === 0) return
    setPushingAll(true)
    try {
      // 串行推送，避免并发对远端造成压力
      for (const n of localNotes) {
        try {
          await onPush(n.id)
        } catch {
          // 单条失败不阻断
        }
      }
    } finally {
      setPushingAll(false)
    }
  }

  const syncModeLabel = (() => {
    if (syncMode === 'manual') return t('quickNotes.cloud.modeManual', { defaultValue: '手动同步' })
    if (syncMode === 'bidirectional') return t('quickNotes.cloud.modeBi', { defaultValue: '双向同步' })
    return t('quickNotes.cloud.modeAuto', { defaultValue: '自动单向 · 30s 推送' })
  })()

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
                <Cloud className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t('quickNotes.cloud.title', { defaultValue: '灵感云 · 同步中心' })}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {remoteConfigured
                    ? t('quickNotes.cloud.subtitle', {
                        synced,
                        local: localNotes.length,
                        conflict: conflictNotes.length,
                        defaultValue:
                          '已同步 {{synced}} · 待推送 {{local}} · 冲突 {{conflict}}',
                      })
                    : t('quickNotes.cloud.subtitleEmpty', { defaultValue: '尚未连接 nowen-note' })}
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
              {!remoteConfigured ? (
                <UnconfiguredEmpty
                  onOpenSettings={onOpenSettings}
                  t={t}
                />
              ) : (
                <>
                  {/* 1. 连接状态卡 */}
                  <ConnectionCard
                    remoteBaseUrl={remoteBaseUrl || undefined}
                    syncModeLabel={syncModeLabel}
                    onOpenSettings={onOpenSettings}
                    t={t}
                  />

                  {/* 2. 状态总览 */}
                  <StatusOverview
                    synced={synced}
                    local={localNotes.length}
                    conflict={conflictNotes.length}
                    syncing={syncingCount}
                    canPushAll={localNotes.length > 0 && !pushingAll}
                    pushingAll={pushingAll}
                    onPushAll={handlePushAll}
                    t={t}
                  />

                  {/* 3. 待同步队列 */}
                  {localNotes.length > 0 && (
                    <Section
                      title={t('quickNotes.cloud.pendingTitle', {
                        count: localNotes.length,
                        defaultValue: '待同步 ({{count}})',
                      })}
                      tone="warn"
                    >
                      <ul className="space-y-1.5">
                        {localNotes.slice(0, 20).map((n) => (
                          <QueueItem
                            key={n.id}
                            note={n}
                            pushing={pushingIds.has(n.id)}
                            onPush={() => onPush(n.id)}
                            t={t}
                          />
                        ))}
                        {localNotes.length > 20 && (
                          <li
                            className="text-[11px] text-center pt-1"
                            style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}
                          >
                            {t('quickNotes.cloud.moreItems', {
                              count: localNotes.length - 20,
                              defaultValue: '还有 {{count}} 条…',
                            })}
                          </li>
                        )}
                      </ul>
                    </Section>
                  )}

                  {/* 4. 冲突待解决 */}
                  {conflictNotes.length > 0 && (
                    <Section
                      title={t('quickNotes.cloud.conflictTitle', {
                        count: conflictNotes.length,
                        defaultValue: '冲突待解决 ({{count}})',
                      })}
                      tone="danger"
                    >
                      <ul className="space-y-1.5">
                        {conflictNotes.map((n) => (
                          <ConflictItem
                            key={n.id}
                            note={n}
                            onResolve={() => onResolveConflict?.(n)}
                            t={t}
                          />
                        ))}
                      </ul>
                    </Section>
                  )}

                  {/* 全部已同步：成就感空态 */}
                  {localNotes.length === 0 && conflictNotes.length === 0 && synced > 0 && (
                    <div
                      className="mt-4 rounded-xl p-4 flex items-center gap-3"
                      style={{
                        background: 'color-mix(in srgb, #22c55e 10%, transparent)',
                        border: '1px solid color-mix(in srgb, #22c55e 30%, transparent)',
                        color: '#22c55e',
                      }}
                    >
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <div className="text-xs">
                        <div className="font-semibold">
                          {t('quickNotes.cloud.allSynced', {
                            defaultValue: '一切都已云端就位',
                          })}
                        </div>
                        <div className="opacity-80 mt-0.5">
                          {t('quickNotes.cloud.allSyncedHint', {
                            count: synced,
                            defaultValue: '{{count}} 条灵感已安全归档',
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 完全空：从未有过笔记 */}
                  {notes.length === 0 && (
                    <div
                      className="mt-4 rounded-xl p-6 flex flex-col items-center gap-2"
                      style={{
                        border: '1px dashed var(--color-glass-border)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <Sparkles className="w-7 h-7 opacity-40" />
                      <div className="text-xs">
                        {t('quickNotes.cloud.noNotes', { defaultValue: '还没有灵感被记录' })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 底部联动栏 */}
            {remoteConfigured && (
              <div
                className="px-5 py-3 border-t flex items-center gap-2"
                style={{ borderColor: 'var(--color-glass-border)' }}
              >
                {onOpenIdeaRain && (
                  <button
                    onClick={() => {
                      onClose()
                      // 让出一个动画帧，避免两个抽屉重叠
                      setTimeout(() => onOpenIdeaRain(), 220)
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg font-medium transition-all"
                    style={{
                      background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                      color: 'var(--color-accent)',
                      border: '1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)',
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('quickNotes.cloud.openIdeaRain', { defaultValue: '切换到灵感雨' })}
                  </button>
                )}
                {remoteBaseUrl && (
                  <a
                    href={remoteBaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg font-medium transition-all hover:bg-white/5"
                    style={{
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t('quickNotes.cloud.openRemote', { defaultValue: '打开 nowen-note' })}
                  </a>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/** ============================================================ */
/** 子组件们 */
/** ============================================================ */

function ConnectionCard({
  remoteBaseUrl,
  syncModeLabel,
  onOpenSettings,
  t,
}: {
  remoteBaseUrl?: string
  syncModeLabel: string
  onOpenSettings?: () => void
  t: (k: string, opts?: any) => string
}) {
  return (
    <div
      className="rounded-xl p-3.5 mb-4"
      style={{
        background: 'var(--color-bg-tertiary, rgba(255,255,255,0.03))',
        border: '1px solid var(--color-glass-border)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}
        />
        <span
          className="text-[12px] font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {t('quickNotes.cloud.connected', { defaultValue: '已连接 nowen-note' })}
        </span>
      </div>
      {remoteBaseUrl && (
        <div
          className="text-[11px] truncate font-mono mb-1.5"
          style={{ color: 'var(--color-text-muted)' }}
          title={remoteBaseUrl}
        >
          {remoteBaseUrl}
        </div>
      )}
      <div
        className="text-[11px] mb-3"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {t('quickNotes.cloud.modeLabel', { defaultValue: '模式' })} · {syncModeLabel}
      </div>
      <div className="flex items-center gap-2">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition-all hover:bg-white/10"
            style={{
              color: 'var(--color-text-secondary)',
              background: 'var(--color-bg-secondary, rgba(255,255,255,0.04))',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            <Settings2 className="w-3 h-3" />
            {t('quickNotes.cloud.settings', { defaultValue: '设置' })}
          </button>
        )}
      </div>
    </div>
  )
}

function StatusOverview({
  synced,
  local,
  conflict,
  syncing,
  canPushAll,
  pushingAll,
  onPushAll,
  t,
}: {
  synced: number
  local: number
  conflict: number
  syncing: number
  canPushAll: boolean
  pushingAll: boolean
  onPushAll: () => void
  t: (k: string, opts?: any) => string
}) {
  return (
    <div
      className="rounded-xl p-3.5 mb-4"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 6%, transparent), transparent)',
        border: '1px solid var(--color-glass-border)',
      }}
    >
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat icon={Cloud} value={synced} label={t('quickNotes.sync.synced')} color="#22c55e" />
        <Stat icon={Zap} value={local} label={t('quickNotes.sync.local')} color="#a1a1aa" />
        <Stat
          icon={AlertTriangle}
          value={conflict}
          label={t('quickNotes.sync.conflict')}
          color="#f97316"
        />
      </div>
      {syncing > 0 && (
        <div
          className="text-[10.5px] mb-2"
          style={{ color: '#3b82f6' }}
        >
          {t('quickNotes.cloud.syncingHint', {
            count: syncing,
            defaultValue: '正在推送 {{count}} 条…',
          })}
        </div>
      )}
      <button
        onClick={onPushAll}
        disabled={!canPushAll}
        className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: canPushAll
            ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
            : 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
          color: canPushAll ? 'var(--color-accent)' : 'var(--color-text-muted)',
          border: canPushAll
            ? '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)'
            : '1px solid var(--color-glass-border)',
          cursor: canPushAll ? 'pointer' : 'not-allowed',
          opacity: pushingAll ? 0.7 : 1,
        }}
      >
        <ArrowUpRight className="w-3.5 h-3.5" />
        {pushingAll
          ? t('quickNotes.cloud.pushingAll', { defaultValue: '正在推送全部…' })
          : t('quickNotes.cloud.pushAll', { defaultValue: '一键全部推送' })}
      </button>
    </div>
  )
}

function Stat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType
  value: number
  label: string
  color: string
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-2 rounded-lg"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
      }}
    >
      <Icon className="w-3.5 h-3.5 mb-1" style={{ color }} />
      <div className="text-[15px] font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
      <div
        className="text-[10px] mt-0.5"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </div>
    </div>
  )
}

function Section({
  title,
  tone,
  children,
}: {
  title: string
  tone: 'warn' | 'danger'
  children: React.ReactNode
}) {
  const accent = tone === 'danger' ? '#f97316' : '#a1a1aa'
  return (
    <section className="mb-4 last:mb-0">
      <div
        className="flex items-center gap-1.5 mb-2 text-[11px] uppercase tracking-wider font-semibold"
        style={{ color: accent }}
      >
        <span
          className="inline-block w-1 h-3 rounded-sm"
          style={{ background: accent }}
        />
        {title}
      </div>
      {children}
    </section>
  )
}

function QueueItem({
  note,
  pushing,
  onPush,
  t,
}: {
  note: QuickNote
  pushing: boolean
  onPush: () => void
  t: (k: string, opts?: any) => string
}) {
  const title = extractTitle(
    note.content,
    t('quickNotes.title', { defaultValue: '灵感速记' }),
  )
  return (
    <li
      className="flex items-center gap-2 px-2.5 py-2 rounded-lg group"
      style={{
        background: 'var(--color-bg-tertiary, rgba(255,255,255,0.03))',
        border: '1px solid var(--color-glass-border)',
      }}
    >
      <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#a1a1aa' }} />
      <span
        className="flex-1 truncate text-[12px]"
        style={{ color: 'var(--color-text-primary)' }}
        title={title}
      >
        {title}
      </span>
      <button
        onClick={onPush}
        disabled={pushing}
        className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[10.5px] font-medium transition-all flex-shrink-0"
        style={{
          color: 'var(--color-accent)',
          background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
          opacity: pushing ? 0.6 : 1,
          cursor: pushing ? 'wait' : 'pointer',
        }}
      >
        <ArrowUpRight className="w-3 h-3" />
        {pushing
          ? t('quickNotes.cloud.pushing', { defaultValue: '推送中' })
          : t('quickNotes.cloud.push', { defaultValue: '推送' })}
      </button>
    </li>
  )
}

function ConflictItem({
  note,
  onResolve,
  t,
}: {
  note: QuickNote
  onResolve: () => void
  t: (k: string, opts?: any) => string
}) {
  const title = extractTitle(
    note.content,
    t('quickNotes.title', { defaultValue: '灵感速记' }),
  )
  return (
    <li
      className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
      style={{
        background: 'color-mix(in srgb, #f97316 8%, transparent)',
        border: '1px solid color-mix(in srgb, #f97316 30%, transparent)',
      }}
    >
      <AlertTriangle
        className="w-3.5 h-3.5 flex-shrink-0"
        style={{ color: '#f97316' }}
      />
      <span
        className="flex-1 truncate text-[12px]"
        style={{ color: 'var(--color-text-primary)' }}
        title={title}
      >
        {title}
      </span>
      <button
        onClick={onResolve}
        className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[10.5px] font-medium transition-all flex-shrink-0"
        style={{
          color: '#f97316',
          background: 'color-mix(in srgb, #f97316 16%, transparent)',
          border: '1px solid color-mix(in srgb, #f97316 35%, transparent)',
        }}
      >
        <Wrench className="w-3 h-3" />
        {t('quickNotes.cloud.resolve', { defaultValue: '解决' })}
      </button>
    </li>
  )
}

function UnconfiguredEmpty({
  onOpenSettings,
  t,
}: {
  onOpenSettings?: () => void
  t: (k: string, opts?: any) => string
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-12">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        <CloudOff className="w-7 h-7" style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <div
        className="text-sm font-semibold mb-1.5"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {t('quickNotes.cloud.notConfiguredTitle', {
          defaultValue: '还没有连接 nowen-note',
        })}
      </div>
      <div
        className="text-[12px] max-w-[260px] leading-relaxed mb-5"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {t('quickNotes.cloud.notConfiguredHint', {
          defaultValue: '连接后，所有灵感会在 30 秒内自动云端归档，并可跨端访问与 AI 整理。',
        })}
      </div>
      <div className="flex flex-col gap-2 w-full max-w-[220px]">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 18%, transparent)',
              color: 'var(--color-accent)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)',
            }}
          >
            <Settings2 className="w-3.5 h-3.5" />
            {t('quickNotes.cloud.gotoSettings', { defaultValue: '前往设置' })}
          </button>
        )}
        <a
          href="https://github.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-all hover:bg-white/5"
          style={{
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-glass-border)',
          }}
        >
          <Info className="w-3.5 h-3.5" />
          {t('quickNotes.cloud.learnMore', { defaultValue: '了解 nowen-note' })}
        </a>
      </div>
    </div>
  )
}
