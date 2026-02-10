import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles,
  Archive
} from 'lucide-react'
import { Bookmark } from '../types/bookmark'
import { cn } from '../lib/utils'
import { visitsApi } from '../lib/api'

interface HeroCardProps {
  bookmark: Bookmark | null
  onArchive?: (id: string) => void
  onMarkRead?: (id: string) => void
}

export function HeroCard({ bookmark, onArchive, onMarkRead }: HeroCardProps) {
  if (!bookmark) {
    return (
      <motion.div
        className="hero-card p-8 flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h3 
            className="text-xl font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            全部已读
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            今日无待办，享受此刻的宁静
          </p>
        </div>
      </motion.div>
    )
  }

  const domain = new URL(bookmark.url).hostname.replace('www.', '')

  return (
    <motion.div
      className="hero-card group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      onClick={() => {
        visitsApi.track(bookmark.id).catch(console.error)
        window.open(bookmark.url, '_blank')
      }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex h-full min-h-[200px]">
        {/* 左侧 - 图片区域 */}
        {bookmark.ogImage && (
          <div className="hidden md:block w-1/3 relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${bookmark.ogImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0f]/80" />
          </div>
        )}
        
        {/* 右侧 - 内容区域 */}
        <div className={cn(
          "flex-1 p-8 flex flex-col justify-between relative z-10",
          !bookmark.ogImage && "p-10"
        )}>
          <div>
            {/* 标签 */}
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 text-xs font-medium">
                <BookOpen className="w-3 h-3" />
                稍后阅读
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {domain}
              </span>
            </div>

            {/* 标题 */}
            <h2 
              className="text-2xl md:text-3xl font-serif font-medium leading-tight mb-3 line-clamp-2 group-hover:text-white transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              {bookmark.title}
            </h2>

            {/* 描述 */}
            {bookmark.description && (
              <p 
                className="line-clamp-2 text-base leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {bookmark.description}
              </p>
            )}
          </div>

          {/* 底部操作 */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Clock className="w-4 h-4" />
              <span>添加于 {new Date(bookmark.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkRead?.(bookmark.id)
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">已读</span>
              </motion.button>
              
              <motion.button
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--gradient-1)] to-[var(--gradient-2)] text-white flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  visitsApi.track(bookmark.id).catch(console.error)
                  window.open(bookmark.url, '_blank')
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-sm font-medium">阅读</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* 装饰光效 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
    </motion.div>
  )
}
