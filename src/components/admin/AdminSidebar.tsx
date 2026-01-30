import { motion } from 'framer-motion'
import { 
  Bookmark, 
  FolderOpen, 
  Settings, 
  LogOut, 
  ChevronLeft,
  Sparkles,
  Quote
} from 'lucide-react'
import { cn } from '../../lib/utils'

type TabType = 'bookmarks' | 'categories' | 'quotes' | 'settings'

interface AdminSidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onBack: () => void
  onLogout: () => void
  bookmarkCount: number
  categoryCount: number
  quoteCount?: number
}

const navItems = [
  { id: 'bookmarks' as TabType, label: '书签管理', icon: Bookmark },
  { id: 'categories' as TabType, label: '分类管理', icon: FolderOpen },
  { id: 'quotes' as TabType, label: '名言管理', icon: Quote },
  { id: 'settings' as TabType, label: '系统设置', icon: Settings },
]

export function AdminSidebar({
  activeTab,
  onTabChange,
  onBack,
  onLogout,
  bookmarkCount,
  categoryCount,
  quoteCount,
}: AdminSidebarProps) {
  const getCount = (id: TabType) => {
    if (id === 'bookmarks') return bookmarkCount
    if (id === 'categories') return categoryCount
    if (id === 'quotes') return quoteCount ?? null
    return null
  }

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-64 h-screen flex flex-col backdrop-blur-xl transition-colors duration-500"
      style={{
        background: 'var(--color-glass)',
        borderRight: '1px solid var(--color-glass-border)',
      }}
    >
      {/* Logo Area */}
      <div className="p-6" style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))` }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div 
              className="absolute -inset-1 rounded-xl opacity-30 blur-lg -z-10"
              style={{ background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))` }}
            />
          </div>
          <div>
            <h1 
              className="text-lg font-semibold bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, var(--color-text-primary), var(--color-text-muted))` }}
            >
              控制台
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Nebula Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item, index) => {
          const isActive = activeTab === item.id
          const count = getCount(item.id)
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group'
              )}
              style={{ 
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              }}
            >
              {/* Active Background */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `linear-gradient(to right, color-mix(in srgb, var(--color-primary) 20%, transparent), color-mix(in srgb, var(--color-accent) 20%, transparent))`,
                    border: '1px solid var(--color-glass-border)',
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              {/* Active Glow */}
              {isActive && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute inset-0 rounded-xl blur-xl -z-10"
                  style={{
                    background: `linear-gradient(to right, color-mix(in srgb, var(--color-primary) 10%, transparent), color-mix(in srgb, var(--color-accent) 10%, transparent))`,
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              <item.icon 
                className="w-5 h-5 relative z-10 transition-colors"
                style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
              />
              
              <span className="relative z-10 font-medium text-sm">{item.label}</span>
              
              {count !== null && (
                <span 
                  className="relative z-10 ml-auto text-xs px-2 py-0.5 rounded-full transition-colors"
                  style={{
                    background: isActive ? 'var(--color-glass-hover)' : 'var(--color-bg-tertiary)',
                    color: isActive ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                  }}
                >
                  {count}
                </span>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-2" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
        <motion.button
          onClick={onBack}
          whileHover={{ x: -4 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-glass-hover)] transition-all"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">返回前台</span>
        </motion.button>
        
        <motion.button
          onClick={() => {
            if (confirm('确定退出登录吗？')) {
              onLogout()
            }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">退出登录</span>
        </motion.button>
      </div>
    </motion.aside>
  )
}
