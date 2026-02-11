import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, FolderPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Category } from '../types/bookmark'
import { cn, presetIcons } from '../lib/utils'
import { IconRenderer } from './IconRenderer'
import { IconifyPicker } from './IconifyPicker'

// 预设颜色
const presetColors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#6366f1', '#a855f7',
]

interface CategoryEditModalProps {
  isOpen: boolean
  category: Category | null
  onClose: () => void
  onSave: (id: string, updates: Partial<Category>) => void
  onDelete?: (id: string) => void
  onAdd?: (category: Omit<Category, 'id' | 'orderIndex'>) => void
  mode?: 'edit' | 'add'
}

export function CategoryEditModal({
  isOpen,
  category,
  onClose,
  onSave,
  onDelete,
  onAdd,
  mode = 'edit',
}: CategoryEditModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [icon, setIcon] = useState('folder')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [catIconTab, setCatIconTab] = useState<'preset' | 'iconify'>('preset')

  // 当 category 变化时更新表单
  useEffect(() => {
    if (category) {
      setName(category.name)
      setColor(category.color || '#3b82f6')
      setIcon(category.icon || 'folder')
    } else {
      setName('')
      setColor('#3b82f6')
      setIcon('folder')
    }
    setShowIconPicker(false)
    setShowDeleteConfirm(false)
    setCatIconTab('preset')
  }, [category, isOpen])

  const handleSave = () => {
    if (!name.trim()) return
    
    if (mode === 'add' && onAdd) {
      onAdd({ name: name.trim(), color, icon })
    } else if (category) {
      onSave(category.id, { name: name.trim(), color, icon })
    }
    onClose()
  }

  const handleDelete = () => {
    if (category && onDelete) {
      onDelete(category.id)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md rounded-2xl overflow-visible"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--color-glass-border)' }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ 
                    backgroundColor: color + '20',
                    color: color,
                  }}
                >
                  {mode === 'add' ? (
                    <FolderPlus className="w-4 h-4" />
                  ) : (
                    <IconRenderer icon={icon} className="w-4 h-4" />
                  )}
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {mode === 'add' ? '新建分类' : '编辑分类'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-glass-hover)]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* 图标和名称 */}
              <div className="flex gap-4 items-start">
                {/* 图标选择按钮 */}
                <button
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="flex items-center justify-center w-14 h-14 rounded-xl transition-all hover:scale-105 flex-shrink-0"
                  style={{
                    background: color + '20',
                    border: '2px solid ' + color,
                    color: color,
                  }}
                  title="选择图标"
                >
                  <IconRenderer icon={icon} className="w-6 h-6" />
                </button>

                <div className="flex-1">
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    分类名称
                  </label>
                  <input
                    type="text"
                    placeholder="输入分类名称"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && name.trim()) {
                        handleSave()
                      }
                    }}
                  />
                </div>
              </div>

              {/* 图标选择 - 内嵌展开式 */}
              <AnimatePresence>
                {showIconPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div 
                      className="p-4 rounded-xl"
                      style={{
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-glass-border)',
                      }}
                    >
                      {/* Tab 切换 */}
                      <div className="flex gap-1 mb-3 p-1 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
                        <button
                          onClick={() => setCatIconTab('preset')}
                          className="flex-1 px-3 py-1.5 rounded-md text-xs transition-colors"
                          style={{
                            background: catIconTab === 'preset' ? 'var(--color-bg-tertiary)' : 'transparent',
                            color: catIconTab === 'preset' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                          }}
                        >
                          {t('bookmark.modal.preset_icons')}
                        </button>
                        <button
                          onClick={() => setCatIconTab('iconify')}
                          className="flex-1 px-3 py-1.5 rounded-md text-xs transition-colors"
                          style={{
                            background: catIconTab === 'iconify' ? 'var(--color-bg-tertiary)' : 'transparent',
                            color: catIconTab === 'iconify' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                          }}
                        >
                          {t('bookmark.modal.iconify_icons')}
                        </button>
                      </div>

                      {catIconTab === 'preset' && (
                        <div className="grid grid-cols-11 gap-1">
                          {presetIcons.map(({ name: iconName, icon: IconComp }) => (
                            <button
                              key={iconName}
                              onClick={() => {
                                setIcon(iconName)
                                setShowIconPicker(false)
                              }}
                              className={cn(
                                'p-2 rounded-lg transition-all hover:scale-110',
                                icon === iconName 
                                  ? 'ring-2' 
                                  : 'hover:bg-[var(--color-glass-hover)]'
                              )}
                              style={{
                                background: icon === iconName ? color + '20' : 'transparent',
                                color: icon === iconName ? color : 'var(--color-text-secondary)',
                                ringColor: color,
                              }}
                              title={iconName}
                            >
                              <IconComp className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      )}

                      {catIconTab === 'iconify' && (
                        <IconifyPicker
                          selectedIcon={icon}
                          color={color}
                          onSelect={(iconName) => {
                            setIcon(iconName)
                            setShowIconPicker(false)
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 颜色选择 */}
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  选择颜色
                </label>
                <div className="flex gap-2 flex-wrap">
                  {presetColors.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-transform',
                        color === c && 'ring-2 ring-offset-2 scale-110'
                      )}
                      style={{ 
                        backgroundColor: c,
                        ringColor: 'var(--color-text-primary)',
                        ringOffsetColor: 'var(--color-bg-secondary)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div 
              className="flex items-center justify-between px-6 py-4"
              style={{ borderTop: '1px solid var(--color-glass-border)' }}
            >
              {/* 删除按钮（仅编辑模式） */}
              {mode === 'edit' && onDelete && (
                <div className="relative">
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-400">确定删除？</span>
                      <motion.button
                        onClick={handleDelete}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        删除
                      </motion.button>
                      <motion.button
                        onClick={() => setShowDeleteConfirm(false)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                        style={{
                          background: 'var(--color-bg-tertiary)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        取消
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => setShowDeleteConfirm(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                      删除分类
                    </motion.button>
                  )}
                </div>
              )}

              {mode === 'add' && <div />}

              {/* 保存/取消按钮 */}
              <div className="flex gap-3">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 rounded-xl transition-colors"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  取消
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  disabled={!name.trim()}
                  whileHover={{ scale: name.trim() ? 1.02 : 1 }}
                  whileTap={{ scale: name.trim() ? 0.98 : 1 }}
                  className="px-5 py-2.5 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {mode === 'add' ? '创建分类' : '保存更改'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
