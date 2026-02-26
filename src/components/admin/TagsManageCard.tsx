import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tag,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  Merge,
  RefreshCw,
  Hash,
} from 'lucide-react'
import { bookmarkApi, TagStat } from '../../lib/api'
import { cn } from '../../lib/utils'

interface TagsManageCardProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void
}

// 标签颜色生成（与 TagInput 保持一致）
function getTagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 65%, 55%)`
}

export function TagsManageCard({ onShowToast }: TagsManageCardProps) {
  const { t } = useTranslation()

  const [tags, setTags] = useState<TagStat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // 编辑状态
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // 合并状态
  const [mergingTag, setMergingTag] = useState<string | null>(null)
  const [mergeTarget, setMergeTarget] = useState('')

  // 删除确认
  const [deletingTag, setDeletingTag] = useState<string | null>(null)

  // 操作中
  const [processing, setProcessing] = useState(false)

  const loadTags = useCallback(async () => {
    try {
      setLoading(true)
      const data = await bookmarkApi.tagStats()
      setTags(data)
    } catch {
      onShowToast('error', t('admin.tags.load_error'))
    } finally {
      setLoading(false)
    }
  }, [onShowToast, t])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalUsage = tags.reduce((sum, t) => sum + t.count, 0)

  // 重命名标签
  const handleRename = async (oldName: string) => {
    const newName = editValue.trim()
    if (!newName || newName === oldName) {
      setEditingTag(null)
      return
    }
    try {
      setProcessing(true)
      const result = await bookmarkApi.renameTag(oldName, newName)
      onShowToast('success', t('admin.tags.renamed', { old: oldName, new: newName, count: result.updatedCount }))
      setEditingTag(null)
      await loadTags()
    } catch {
      onShowToast('error', t('admin.tags.rename_error'))
    } finally {
      setProcessing(false)
    }
  }

  // 合并标签
  const handleMerge = async (sourceTag: string) => {
    const target = mergeTarget.trim()
    if (!target || target === sourceTag) {
      setMergingTag(null)
      return
    }
    try {
      setProcessing(true)
      const result = await bookmarkApi.renameTag(sourceTag, target)
      onShowToast('success', t('admin.tags.merged', { source: sourceTag, target, count: result.updatedCount }))
      setMergingTag(null)
      setMergeTarget('')
      await loadTags()
    } catch {
      onShowToast('error', t('admin.tags.merge_error'))
    } finally {
      setProcessing(false)
    }
  }

  // 删除标签
  const handleDelete = async (tagName: string) => {
    try {
      setProcessing(true)
      const result = await bookmarkApi.deleteTag(tagName)
      onShowToast('success', t('admin.tags.deleted', { name: tagName, count: result.updatedCount }))
      setDeletingTag(null)
      await loadTags()
    } catch {
      onShowToast('error', t('admin.tags.delete_error'))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div
          className="rounded-2xl p-4 backdrop-blur-sm"
          style={{
            background: 'var(--color-glass-bg)',
            border: '1px solid var(--color-glass-border)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {t('admin.tags.total_tags')}
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {tags.length}
          </p>
        </div>
        <div
          className="rounded-2xl p-4 backdrop-blur-sm"
          style={{
            background: 'var(--color-glass-bg)',
            border: '1px solid var(--color-glass-border)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Hash className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {t('admin.tags.total_usage')}
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {totalUsage}
          </p>
        </div>
        <div
          className="rounded-2xl p-4 backdrop-blur-sm col-span-2 sm:col-span-1"
          style={{
            background: 'var(--color-glass-bg)',
            border: '1px solid var(--color-glass-border)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {t('admin.tags.avg_usage')}
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {tags.length > 0 ? (totalUsage / tags.length).toFixed(1) : 0}
          </p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--color-text-muted)' }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('admin.tags.search')}
          className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-glass-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* 标签列表 */}
      <div
        className="rounded-2xl overflow-hidden backdrop-blur-sm"
        style={{
          background: 'var(--color-glass-bg)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
            <span className="ml-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t('admin.tags.loading')}
            </span>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Tag className="w-10 h-10 mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {searchQuery ? t('admin.tags.no_results') : t('admin.tags.empty')}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-glass-border)' }}>
            {/* 表头 */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              <div className="col-span-5 sm:col-span-6">{t('admin.tags.col_name')}</div>
              <div className="col-span-3 sm:col-span-2 text-center">{t('admin.tags.col_count')}</div>
              <div className="col-span-4 text-right">{t('admin.tags.col_actions')}</div>
            </div>

            <AnimatePresence>
              {filteredTags.map((tag) => (
                <motion.div
                  key={tag.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  {/* 标签名 */}
                  <div className="col-span-5 sm:col-span-6">
                    {editingTag === tag.name ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(tag.name)
                            if (e.key === 'Escape') setEditingTag(null)
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 rounded-lg text-sm outline-none min-w-0"
                          style={{
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-primary)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                        <button
                          onClick={() => handleRename(tag.name)}
                          disabled={processing}
                          className="p-1 rounded-md hover:bg-green-500/20 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5 text-green-500" />
                        </button>
                        <button
                          onClick={() => setEditingTag(null)}
                          className="p-1 rounded-md hover:bg-red-500/20 transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    ) : mergingTag === tag.name ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>→</span>
                        <input
                          type="text"
                          value={mergeTarget}
                          onChange={(e) => setMergeTarget(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleMerge(tag.name)
                            if (e.key === 'Escape') { setMergingTag(null); setMergeTarget('') }
                          }}
                          autoFocus
                          placeholder={t('admin.tags.merge_placeholder')}
                          className="flex-1 px-2 py-1 rounded-lg text-sm outline-none min-w-0"
                          style={{
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-accent)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                        <button
                          onClick={() => handleMerge(tag.name)}
                          disabled={processing}
                          className="p-1 rounded-md hover:bg-green-500/20 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5 text-green-500" />
                        </button>
                        <button
                          onClick={() => { setMergingTag(null); setMergeTarget('') }}
                          className="p-1 rounded-md hover:bg-red-500/20 transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: `${getTagColor(tag.name)}15`,
                            color: getTagColor(tag.name),
                            border: `1px solid ${getTagColor(tag.name)}30`,
                          }}
                        >
                          <Tag className="w-3 h-3" />
                          {tag.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 使用次数 */}
                  <div className="col-span-3 sm:col-span-2 text-center">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {tag.count}
                    </span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="col-span-4 flex items-center justify-end gap-1">
                    {editingTag !== tag.name && mergingTag !== tag.name && deletingTag !== tag.name && (
                      <>
                        <button
                          onClick={() => {
                            setEditingTag(tag.name)
                            setEditValue(tag.name)
                            setMergingTag(null)
                            setDeletingTag(null)
                          }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-blue-500/10"
                          title={t('admin.tags.rename')}
                        >
                          <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                        </button>
                        <button
                          onClick={() => {
                            setMergingTag(tag.name)
                            setMergeTarget('')
                            setEditingTag(null)
                            setDeletingTag(null)
                          }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-orange-500/10"
                          title={t('admin.tags.merge')}
                        >
                          <Merge className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingTag(tag.name)
                            setEditingTag(null)
                            setMergingTag(null)
                          }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                        </button>
                      </>
                    )}

                    {/* 删除确认 */}
                    {deletingTag === tag.name && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {t('admin.tags.delete_confirm')}
                        </span>
                        <button
                          onClick={() => handleDelete(tag.name)}
                          disabled={processing}
                          className="px-2 py-1 rounded-md text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                        >
                          {t('common.confirm')}
                        </button>
                        <button
                          onClick={() => setDeletingTag(null)}
                          className="px-2 py-1 rounded-md text-xs transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      {!loading && tags.length > 0 && (
        <div
          className="flex items-start gap-2 p-4 rounded-xl text-xs"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-muted)',
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{t('admin.tags.hint')}</p>
        </div>
      )}
    </div>
  )
}
