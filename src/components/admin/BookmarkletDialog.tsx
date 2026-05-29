import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X, Bookmark, Copy, Check, ExternalLink, Chrome, Smartphone, Info } from 'lucide-react'
import { cn } from '../../lib/utils'

interface BookmarkletDialogProps {
  isOpen: boolean
  onClose: () => void
  siteTitle?: string
}

/**
 * 生成 Bookmarklet 脚本：用户在任意网页点击它会跳到 NOWEN 并自动打开"添加书签"弹窗
 * 使用 location.origin 作为目标，确保部署到任何域名都能用
 */
function buildBookmarklet(origin: string): string {
  // 注意：必须把脚本压缩成单行，且对 #/? 等字符做正确转义
  const script =
    `(function(){var u=encodeURIComponent(location.href);` +
    `var t=encodeURIComponent(document.title||'');` +
    `var w=window.open('${origin}/?action=add&url='+u+'&title='+t,'_blank',` +
    `'width=560,height=720,resizable=yes,scrollbars=yes');` +
    `if(!w){location.href='${origin}/?action=add&url='+u+'&title='+t;}})();`
  return 'javascript:' + script
}

export function BookmarkletDialog({ isOpen, onClose, siteTitle = 'NOWEN' }: BookmarkletDialogProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const bookmarklet = useMemo(() => buildBookmarklet(origin), [origin])
  const linkLabel = `+ ${siteTitle}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookmarklet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 兼容旧浏览器：选中文本提示用户手动复制
      const ta = document.createElement('textarea')
      ta.value = bookmarklet
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
      document.body.removeChild(ta)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.data.bookmarklet_title', '一键收藏到 NOWEN')}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.data.bookmarklet_subtitle', '在任意网页一键将当前页面收藏到本站')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* 拖拽收藏方式 */}
              <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Chrome className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.data.bookmarklet_method_drag', '方法一：拖到收藏栏（推荐）')}
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  {t('admin.settings.data.bookmarklet_method_drag_desc', '把下面这个按钮拖到浏览器的收藏栏（书签栏）。之后在任意网页点击它，就会自动打开 NOWEN 并填好链接和标题。')}
                </p>
                <div className="flex items-center justify-center py-4">
                  {/* 这是一个真实的 a 标签（href 为 javascript: 链接），用户可以拖到收藏栏 */}
                  <a
                    href={bookmarklet}
                    onClick={e => e.preventDefault()}
                    draggable
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg cursor-grab active:cursor-grabbing select-none"
                    style={{
                      background: 'linear-gradient(135deg, rgb(34, 211, 238), rgb(59, 130, 246))',
                    }}
                  >
                    <Bookmark className="w-4 h-4" />
                    {linkLabel}
                  </a>
                </div>
              </div>

              {/* 复制脚本方式 */}
              <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Copy className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.data.bookmarklet_method_copy', '方法二：手动新建书签')}
                  </span>
                </div>
                <ol className="text-xs space-y-1 mb-3 list-decimal list-inside" style={{ color: 'var(--color-text-muted)' }}>
                  <li>{t('admin.settings.data.bookmarklet_step_1', '在浏览器收藏栏新建一个书签')}</li>
                  <li>{t('admin.settings.data.bookmarklet_step_2', '名称随意（如：+ NOWEN）')}</li>
                  <li>{t('admin.settings.data.bookmarklet_step_3', 'URL 粘贴下方代码后保存')}</li>
                </ol>
                <div className="relative">
                  <pre
                    className="text-[11px] p-3 rounded-lg overflow-x-auto leading-relaxed font-mono"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-secondary)',
                      maxHeight: '120px',
                    }}
                  >
                    {bookmarklet}
                  </pre>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      'absolute top-2 right-2 px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1',
                      copied
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    )}
                  >
                    {copied
                      ? (<><Check className="w-3 h-3" /> {t('admin.settings.data.bookmarklet_copied', '已复制')}</>)
                      : (<><Copy className="w-3 h-3" /> {t('admin.settings.data.bookmarklet_copy', '复制')}</>)
                    }
                  </button>
                </div>
              </div>

              {/* 移动端提示 */}
              <div className="rounded-xl p-4 flex gap-3" style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.data.bookmarklet_mobile_title', '移动端使用方式')}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.data.bookmarklet_mobile_desc', 'iOS Safari / Android Chrome 也支持：先把任意网页加入书签 → 编辑该书签 → 把上方代码粘贴进 URL → 之后在任意网页选中地址栏点这个书签即可。')}
                  </p>
                </div>
              </div>

              {/* 跨设备同步说明 */}
              <div className="rounded-xl p-4 flex gap-3" style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.data.bookmarklet_sync_title', '跨浏览器、跨设备自动同步')}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    {t('admin.settings.data.bookmarklet_sync_desc', '所有设备的 NOWEN 共用同一个后端数据库，添加后会在 60 秒内自动出现在其他设备上。无需第三方账号。')}
                  </p>
                </div>
              </div>

              {/* 浏览器扩展提示 */}
              <a
                href="/extension/nowen-bookmark-extension.zip"
                download
                className="block rounded-xl p-4 hover:bg-white/5 transition-colors group"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                    <Chrome className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                      {t('admin.settings.data.extension_title', '下载浏览器扩展（Chrome / Edge / Firefox）')}
                      <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {t('admin.settings.data.extension_desc', '解压后以"已解压的扩展"方式加载，可右键页面快速收藏。')}
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
