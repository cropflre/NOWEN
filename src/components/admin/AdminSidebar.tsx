import { motion } from 'framer-motion'
import { 
  Bookmark, 
  FolderOpen, 
  Settings, 
  LogOut, 
  ChevronLeft,
  Sparkles
} from 'lucide-react'
import { cn } from '../../lib/utils'

type TabType = 'bookmarks' | 'categories' | 'settings'

interface AdminSidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onBack: () => void
  onLogout: () => void
  bookmarkCount: number
  categoryCount: number
}

const navItems = [
  { id: 'bookmarks' as TabType, label: '书签管理', icon: Bookmark },
  { id: 'categories' as TabType, label: '分类管理', icon: FolderOpen },
  { id: 'settings' as TabType, label: '系统设置', icon: Settings },
]

export function AdminSidebar({
  activeTab,
  onTabChange,
  onBack,
  onLogout,
  bookmarkCount,
  categoryCount,
}: AdminSidebarProps) {
  const getCount = (id: TabType) => {
    if (id === 'bookmarks') return bookmarkCount
    if (id === 'categories') return categoryCount
    return null
  }

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-64 h-screen flex flex-col bg-white/[0.02] backdrop-blur-xl border-r border-white/[0.06]"
    >
      {/* Logo Area */}
      <div className="p-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 opacity-30 blur-lg -z-10" />
          </div>
          <div>
            <h1 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              控制台
            </h1>
            <p className="text-xs text-white/30">Nebula Portal</p>
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
                'relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                isActive 
                  ? 'text-white' 
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'
              )}
            >
              {/* Active Background */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              {/* Active Glow */}
              {isActive && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-xl -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              <item.icon className={cn(
                'w-5 h-5 relative z-10 transition-colors',
                isActive ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/60'
              )} />
              
              <span className="relative z-10 font-medium text-sm">{item.label}</span>
              
              {count !== null && (
                <span className={cn(
                  'relative z-10 ml-auto text-xs px-2 py-0.5 rounded-full transition-colors',
                  isActive 
                    ? 'bg-white/10 text-white/70' 
                    : 'bg-white/5 text-white/30'
                )}>
                  {count}
                </span>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/[0.06] space-y-2">
        <motion.button
          onClick={onBack}
          whileHover={{ x: -4 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-all"
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
