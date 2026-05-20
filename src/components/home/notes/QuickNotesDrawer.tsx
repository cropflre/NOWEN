/**
 * QuickNotesDrawer · 灵感速记抽屉
 * ---------------------------------------------------------------------------
 * 设计意图：
 *   把首页的 QuickNotes 主体彻底从首页移除，改为通过 dock 菜单触发右侧抽屉。
 *   首页因此释放整块空间，让书签导航回归主体定位。
 *
 * 入口：dock 上的 Lightbulb 按钮（id="notes"）
 *
 * 视觉风格：
 *   - 玻璃质感面板（与 IdeaRainDrawer / SyncCenterDrawer 同源）
 *   - 抽屉宽度比"灵感雨"更宽（max-w-3xl），因为承载完整 Bento 卡片网格
 *   - 顶部条：Lightbulb + 标题 + 关闭
 *   - 内容区：渲染 <QuickNotes embedded /> 主体
 */
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X, Lightbulb, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { QuickNotes } from '../QuickNotes'

interface QuickNotesDrawerProps {
  open: boolean
  onClose: () => void
  isLoggedIn?: boolean
  remoteConfigured?: boolean
  remoteBaseUrl?: string
  syncMode?: 'manual' | 'auto' | 'bidirectional'
  onOpenSettings?: () => void
}

export function QuickNotesDrawer({
  open,
  onClose,
  isLoggedIn = false,
  remoteConfigured = false,
  remoteBaseUrl,
  syncMode = 'auto',
  onOpenSettings,
}: QuickNotesDrawerProps) {
  const { t } = useTranslation()

  // ESC 关闭
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
            className="fixed inset-0 z-[170]"
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
            className="fixed top-0 right-0 bottom-0 z-[171] w-full sm:max-w-3xl flex flex-col backdrop-blur-2xl border-l overflow-hidden"
            style={{
              background: 'var(--color-glass)',
              borderColor: 'var(--color-glass-border)',
            }}
          >
            {/* 顶部条 */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: 'var(--color-glass-border)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                style={{
                  background:
                    'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 28%, transparent), color-mix(in srgb, var(--color-accent) 8%, transparent))',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
                }}
              >
                <Lightbulb className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                <Sparkles
                  className="w-2.5 h-2.5 absolute top-1 right-1"
                  style={{ color: 'var(--color-accent)', opacity: 0.7 }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t('quickNotes.title', { defaultValue: '灵感速记' })}
                </div>
                <div
                  className="text-[11px] truncate"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {t('quickNotes.drawerSubtitle', {
                    defaultValue: '记录此刻的灵感 · 自动同步至 nowen-note',
                  })}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10 flex-shrink-0"
                style={{ color: 'var(--color-text-muted)' }}
                title="Esc"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 内容区：嵌入 QuickNotes 主体（embedded 模式） */}
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              <QuickNotes
                embedded
                isLoggedIn={isLoggedIn}
                remoteConfigured={remoteConfigured}
                remoteBaseUrl={remoteBaseUrl}
                syncMode={syncMode}
                onOpenSettings={onOpenSettings}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
