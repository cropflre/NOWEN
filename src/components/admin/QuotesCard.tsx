import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Quote, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  AlertCircle,
  CheckCircle,
  Search,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface QuotesCardProps {
  quotes: string[]
  useDefaultQuotes: boolean
  onUpdate: (quotes: string[], useDefaultQuotes: boolean) => void
}

export function QuotesCard({ quotes, useDefaultQuotes, onUpdate }: QuotesCardProps) {
  const { t } = useTranslation()
  const [localQuotes, setLocalQuotes] = useState<string[]>(quotes)
  const [localUseDefault, setLocalUseDefault] = useState(useDefaultQuotes)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newQuote, setNewQuote] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setLocalQuotes(quotes)
  }, [quotes])

  useEffect(() => {
    setLocalUseDefault(useDefaultQuotes)
  }, [useDefaultQuotes])

  // 切换默认名言开关
  const handleToggleDefault = () => {
    const newValue = !localUseDefault
    setLocalUseDefault(newValue)
    onUpdate(localQuotes, newValue)
    setSuccess(newValue ? t('admin.quotes.enabled_default') : t('admin.quotes.disabled_default'))
    setTimeout(() => setSuccess(null), 2000)
  }

  // 过滤名言
  const filteredQuotes = localQuotes.filter(q => 
    q.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 添加名言
  const handleAdd = () => {
    if (!newQuote.trim()) {
      setError(t('admin.quotes.empty_error'))
      return
    }
    if (localQuotes.includes(newQuote.trim())) {
      setError(t('admin.quotes.duplicate_error'))
      return
    }
    const updated = [...localQuotes, newQuote.trim()]
    setLocalQuotes(updated)
    onUpdate(updated, localUseDefault)
    setNewQuote('')
    setIsAdding(false)
    setSuccess(t('admin.quotes.added'))
    setTimeout(() => setSuccess(null), 2000)
  }

  // 删除名言
  const handleDelete = (index: number) => {
    const updated = localQuotes.filter((_, i) => i !== index)
    setLocalQuotes(updated)
    onUpdate(updated, localUseDefault)
    setSuccess(t('admin.quotes.deleted'))
    setTimeout(() => setSuccess(null), 2000)
  }

  // 开始编辑
  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditValue(localQuotes[index])
  }

  // 保存编辑
  const saveEdit = () => {
    if (editingIndex === null) return
    if (!editValue.trim()) {
      setError(t('admin.quotes.empty_error'))
      return
    }
    const updated = [...localQuotes]
    updated[editingIndex] = editValue.trim()
    setLocalQuotes(updated)
    onUpdate(updated, localUseDefault)
    setEditingIndex(null)
    setEditValue('')
    setSuccess(t('admin.quotes.updated'))
    setTimeout(() => setSuccess(null), 2000)
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingIndex(null)
    setEditValue('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative group"
    >
      {/* 悬浮渐变边框 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 via-transparent to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:block hidden" />
      
      <div 
        className="relative overflow-hidden rounded-2xl backdrop-blur-xl p-6"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {/* 头部 */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/20 flex items-center justify-center">
                <Quote className="w-6 h-6 text-amber-500" />
              </div>
              <div className="absolute -inset-2 rounded-xl bg-amber-500/20 blur-xl opacity-50 -z-10 dark:block hidden" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {t('admin.quotes.title')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {t('admin.quotes.count', { count: localQuotes.length })}
              </p>
            </div>
          </div>
          
          {/* 添加按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            {t('admin.quotes.add')}
          </motion.button>
        </div>

        {/* 系统默认名言开关 */}
        <div 
          className="flex items-center justify-between p-4 rounded-xl mb-4"
          style={{
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-glass-border)',
          }}
        >
          <div className="flex-1">
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {t('admin.quotes.use_default')}
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {localUseDefault ? t('admin.quotes.default_enabled') : t('admin.quotes.default_disabled')}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleDefault}
            className="flex-shrink-0"
          >
            {localUseDefault ? (
              <ToggleRight className="w-10 h-10 text-amber-500" />
            ) : (
              <ToggleLeft className="w-10 h-10" style={{ color: 'var(--color-text-muted)' }} />
            )}
          </motion.button>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('admin.quotes.search')}
            className="w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none transition-all duration-300"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-glass-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* 添加表单 */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div 
                className="p-4 rounded-xl"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                <textarea
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  placeholder={t('admin.quotes.add_placeholder')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-300 resize-none"
                  style={{
                    background: 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <div className="flex gap-2 mt-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAdd}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium"
                  >
                    {t('admin.quotes.confirm_add')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setIsAdding(false); setNewQuote('') }}
                    className="px-4 py-2 rounded-xl font-medium"
                    style={{
                      background: 'var(--color-glass)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {t('common.cancel')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 名言列表 */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence>
            {filteredQuotes.map((quote, index) => {
              const originalIndex = localQuotes.indexOf(quote)
              return (
                <motion.div
                  key={originalIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="group/item relative p-4 rounded-xl transition-all duration-300"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-glass-border)',
                  }}
                >
                  {editingIndex === originalIndex ? (
                    // 编辑模式
                    <div className="space-y-3">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-300 resize-none"
                        style={{
                          background: 'var(--color-glass)',
                          border: '1px solid var(--color-glass-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={saveEdit}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 text-sm"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {t('admin.quotes.save')}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={cancelEdit}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
                          style={{
                            background: 'var(--color-glass)',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                          {t('common.cancel')}
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    // 显示模式
                    <div className="flex items-start gap-3">
                      <span 
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{
                          background: 'var(--color-glass)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {originalIndex + 1}
                      </span>
                      <p 
                        className="flex-1 text-sm leading-relaxed"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {quote}
                      </p>
                      <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => startEdit(originalIndex)}
                          className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-500 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(originalIndex)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filteredQuotes.length === 0 && (
            <div 
              className="text-center py-8"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {searchTerm ? t('admin.quotes.no_match') : t('admin.quotes.empty')}
            </div>
          )}
        </div>

        {/* 成功/错误提示 */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-500"
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
