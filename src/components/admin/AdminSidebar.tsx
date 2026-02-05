import { useState, useRef, MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bookmark, 
  FolderOpen, 
  Settings, 
  LogOut, 
  ChevronLeft,
  Sparkles,
  Quote,
  Menu,
  X,
  ImageIcon
} from 'lucide-react'
import { MobileFloatingDock } from '../ui/mobile-floating-dock'

type TabType = 'bookmarks' | 'categories' | 'quotes' | 'icons' | 'settings'

interface AdminSidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onBack: () => void
  onLogout: () => void
  bookmarkCount: number
  categoryCount: number
  quoteCount?: number
  iconCount?: number
}

const navItems = [
  { id: 'bookmarks' as TabType, labelKey: 'admin.nav.bookmarks', fullLabelKey: 'admin.nav.bookmarks_full', icon: Bookmark },
  { id: 'categories' as TabType, labelKey: 'admin.nav.categories', fullLabelKey: 'admin.nav.categories_full', icon: FolderOpen },
  { id: 'quotes' as TabType, labelKey: 'admin.nav.quotes', fullLabelKey: 'admin.nav.quotes_full', icon: Quote },
  { id: 'icons' as TabType, labelKey: 'admin.nav.icons', fullLabelKey: 'admin.nav.icons_full', icon: ImageIcon },
  { id: 'settings' as TabType, labelKey: 'admin.nav.settings', fullLabelKey: 'admin.nav.settings_full', icon: Settings },
]

// 液态动画配置 - 如同在蜂蜜中滑动
const LIQUID_SPRING = {
  // 胶囊滑动 - 极强阻尼，像穿过蜂蜜
  capsule: { type: 'spring' as const, stiffness: 180, damping: 35 },
  // 磁吸吸引 - 柔和跟随
  magneticAttract: { type: 'spring' as const, stiffness: 200, damping: 25 },
  // 磁吸离开 - 依依不舍的回弹
  magneticRelease: { type: 'spring' as const, stiffness: 120, damping: 12, mass: 1.2 },
  // 呼吸动画 - 缓慢深沉
  breath: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
  // 入场动画 - 从容不迫
  enter: { type: 'spring' as const, stiffness: 200, damping: 28 },
}

// A11y: 文字阴影样式 - 提升对比度符合 WCAG AA 标准
// 在透明背景上，使用微妙的 drop-shadow 确保文字可读性
const a11yTextShadow = {
  // 主要文字：轻微黑色阴影
  primary: { textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 0 8px rgba(0,0,0,0.3)' },
  // 次要文字：更轻的阴影
  secondary: { textShadow: '0 1px 2px rgba(0,0,0,0.4)' },
  // 图标阴影
  icon: { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' },
}

// 磁吸效果 Hook - 计算鼠标相对于元素中心的偏移
function useMagneticEffect(strength: number = 3) {
  const ref = useRef<HTMLButtonElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    // 计算鼠标到中心的距离比例
    const deltaX = (e.clientX - centerX) / (rect.width / 2)
    const deltaY = (e.clientY - centerY) / (rect.height / 2)
    
    setOffset({
      x: deltaX * strength,
      y: deltaY * strength,
    })
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    // 不立即归零，让动画系统处理"依依不舍"的回弹
    setOffset({ x: 0, y: 0 })
    setIsHovering(false)
  }

  return { ref, offset, isHovering, handleMouseMove, handleMouseLeave }
}

// 导航项组件 - 带磁吸效果
interface NavItemProps {
  item: typeof navItems[0]
  isActive: boolean
  count: number | null
  onClick: () => void
  index: number
  t: (key: string) => string
}

function NavItem({ item, isActive, count, onClick, index, t }: NavItemProps) {
  const { ref, offset, isHovering, handleMouseMove, handleMouseLeave } = useMagneticEffect(3)

  // 根据是否悬停选择不同的弹簧配置
  const magneticTransition = isHovering 
    ? LIQUID_SPRING.magneticAttract 
    : LIQUID_SPRING.magneticRelease

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, ...LIQUID_SPRING.enter }}
      className="relative w-full flex items-center gap-3 px-4 py-3 rounded-xl group"
    >
      {/* 发光胶囊 - 选中态 (Glowing Capsule) - 液态滑动 */}
      {/* initial={false} 防止页面刷新/路由切换时的闪烁 */}
      {isActive && (
        <motion.div
          layoutId="glowingCapsule"
          initial={false}
          className="absolute inset-0 rounded-xl overflow-hidden"
          transition={LIQUID_SPRING.capsule}
        >
          {/* 胶囊主体 - 深邃玻璃 */}
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-sm" />
          
          {/* 胶囊边框 - 幽灵边框 */}
          <div className="absolute inset-0 rounded-xl border border-white/[0.08]" />
          
          {/* 顶部发光线 - 呼吸 */}
          <motion.div 
            className="absolute top-0 left-1/4 right-1/4 h-[1px]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,242,254,0.4), transparent)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={LIQUID_SPRING.breath}
          />
          
          {/* 左侧能量条 - 深呼吸 */}
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 rounded-full"
            style={{
              background: 'linear-gradient(180deg, rgba(0,242,254,0.7), rgba(102,126,234,0.5))',
              boxShadow: '0 0 10px rgba(0,242,254,0.4), 0 0 20px rgba(0,242,254,0.15)',
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
              height: ['28px', '32px', '28px'],
            }}
            transition={LIQUID_SPRING.breath}
          />
          
          {/* 背景发光 - 呼吸 */}
          <motion.div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 20% 50%, rgba(0,242,254,0.25), transparent)',
            }}
            animate={{
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={LIQUID_SPRING.breath}
          />
        </motion.div>
      )}

      {/* 图标 - 带磁吸效果，依依不舍的回弹 */}
      {/* A11y: 添加 drop-shadow 提升对比度 */}
      <motion.div
        animate={{
          x: isActive ? 0 : offset.x,
          y: isActive ? 0 : offset.y,
          color: isActive ? 'rgba(0,242,254,0.9)' : 'rgba(255,255,255,0.6)',
        }}
        transition={magneticTransition}
        className="relative z-10"
        style={a11yTextShadow.icon}
      >
        <item.icon className="w-5 h-5" />
      </motion.div>
      
      {/* 文字 - 带磁吸效果，依依不舍的回弹 */}
      {/* A11y: 添加 text-shadow 提升对比度 */}
      <motion.span 
        animate={{
          x: isActive ? 0 : offset.x,
          y: isActive ? 0 : offset.y,
          color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
        }}
        transition={magneticTransition}
        className="relative z-10 font-medium text-sm"
        style={a11yTextShadow.primary}
      >
        {t(item.fullLabelKey)}
      </motion.span>
      
      {/* 计数徽章 - 轻微磁吸 */}
      {count !== null && (
        <motion.span 
          animate={{
            x: isActive ? 0 : offset.x * 0.3,
            background: isActive ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.08)',
            color: isActive ? 'rgba(0,242,254,0.95)' : 'rgba(255,255,255,0.5)',
          }}
          transition={magneticTransition}
          className="relative z-10 ml-auto text-xs px-2 py-0.5 rounded-full border border-white/[0.08]"
          style={a11yTextShadow.secondary}
        >
          {count}
        </motion.span>
      )}
    </motion.button>
  )
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  onBack,
  onLogout,
  bookmarkCount,
  categoryCount,
  quoteCount,
  iconCount,
}: AdminSidebarProps) {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getCount = (id: TabType) => {
    if (id === 'bookmarks') return bookmarkCount
    if (id === 'categories') return categoryCount
    if (id === 'quotes') return quoteCount ?? null
    if (id === 'icons') return iconCount ?? null
    return null
  }

  const handleTabChange = (tab: TabType) => {
    onTabChange(tab)
    setMobileMenuOpen(false)
  }

  return (
    <>
      {/* Desktop Sidebar - 悬浮能量带 */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={LIQUID_SPRING.enter}
        className="hidden md:flex w-64 h-screen flex-col relative"
      >
        {/* 能量带背景 - 让极光透过 */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
        
        {/* 整体呼吸光晕 - 环绕整个侧边栏 */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 120% 80% at 50% 30%, rgba(0,242,254,0.04), transparent 50%)',
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={LIQUID_SPRING.breath}
        />
        
        {/* 右侧边缘发光线 - 呼吸 */}
        <motion.div 
          className="absolute right-0 top-[10%] bottom-[10%] w-[1px]"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(0,242,254,0.2), rgba(102,126,234,0.15), transparent)',
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={LIQUID_SPRING.breath}
        />
        
        {/* 顶部发光装饰 - 呼吸 */}
        <motion.div 
          className="absolute top-0 left-[20%] right-[20%] h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,242,254,0.3), transparent)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={LIQUID_SPRING.breath}
        />

        {/* Logo Area */}
        <div className="relative p-6 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            {/* Logo 光环 */}
            <div className="relative">
              <motion.div 
                className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(0,242,254,0.2), rgba(102,126,234,0.15))',
                  border: '1px solid rgba(0,242,254,0.2)',
                }}
              >
                <Sparkles className="w-5 h-5 text-nebula-cyan/80" style={a11yTextShadow.icon} />
              </motion.div>
              {/* Logo 发光 - 深呼吸 */}
              <motion.div 
                className="absolute -inset-3 rounded-xl blur-xl -z-10"
                style={{ 
                  background: 'radial-gradient(circle, rgba(0,242,254,0.25), transparent)',
                }}
                animate={{
                  opacity: [0.2, 0.45, 0.2],
                  scale: [0.9, 1.05, 0.9],
                }}
                transition={LIQUID_SPRING.breath}
              />
            </div>
            <div>
              <h1 
                className="text-lg font-semibold text-white/90"
                style={a11yTextShadow.primary}
              >
                {t('admin.console')}
              </h1>
              <p 
                className="text-xs text-white/50"
                style={a11yTextShadow.secondary}
              >
                NOWEN
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - 能量带导航 */}
        <nav className="relative flex-1 p-4 space-y-1">
          {navItems.map((item, index) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              count={getCount(item.id)}
              onClick={() => onTabChange(item.id)}
              index={index}
              t={t}
            />
          ))}
        </nav>

        {/* Bottom Actions - 底部操作区 */}
        <div className="relative p-4 space-y-1 border-t border-white/[0.04]">
          <motion.button
            onClick={onBack}
            whileHover={{ x: -4 }}
            transition={LIQUID_SPRING.magneticRelease}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white/80 hover:bg-white/[0.02] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" style={a11yTextShadow.icon} />
            <span className="text-sm font-medium" style={a11yTextShadow.secondary}>{t('admin.back_to_home')}</span>
          </motion.button>
          
          <motion.button
            onClick={() => {
              if (confirm(t('admin.logout_confirm'))) {
                onLogout()
              }
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={LIQUID_SPRING.magneticRelease}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
          >
            <LogOut className="w-5 h-5" style={a11yTextShadow.icon} />
            <span className="text-sm font-medium" style={a11yTextShadow.secondary}>{t('admin.logout')}</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Mobile Header - 移动端顶栏 */}
      <div 
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-xl border-b border-white/[0.04]"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0,242,254,0.2), rgba(102,126,234,0.15))',
              border: '1px solid rgba(0,242,254,0.2)',
            }}
          >
            <Sparkles className="w-4 h-4 text-nebula-cyan/80" style={a11yTextShadow.icon} />
          </div>
          <span 
            className="font-semibold text-white/90"
            style={a11yTextShadow.primary}
          >
            {t('admin.console')}
          </span>
        </div>
        
        <motion.button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg text-white/70 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
          aria-label={mobileMenuOpen ? t('common.close') : t('common.edit')}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={LIQUID_SPRING.capsule}
              className="md:hidden fixed top-14 left-4 right-4 z-40 p-4 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/[0.06] overflow-hidden"
            >
              {/* 顶部装饰光 - 呼吸 */}
              <motion.div 
                className="absolute top-0 left-1/4 right-1/4 h-[1px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(0,242,254,0.3), transparent)',
                }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={LIQUID_SPRING.breath}
              />
              
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id
                  const count = getCount(item.id)
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      whileTap={{ scale: 0.98 }}
                      className="relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobileGlowingCapsule"
                          initial={false}
                          className="absolute inset-0 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                          transition={LIQUID_SPRING.capsule}
                        />
                      )}
                      <item.icon 
                        className="w-5 h-5 relative z-10"
                        style={{ 
                          color: isActive ? 'rgba(0,242,254,0.9)' : 'rgba(255,255,255,0.6)',
                          ...a11yTextShadow.icon,
                        }}
                      />
                      <span 
                        className="font-medium text-sm relative z-10"
                        style={{ 
                          color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
                          ...a11yTextShadow.primary,
                        }}
                      >
                        {t(item.fullLabelKey)}
                      </span>
                      {count !== null && (
                        <span 
                          className="ml-auto text-xs px-2 py-0.5 rounded-full relative z-10"
                          style={{
                            background: isActive ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.08)',
                            color: isActive ? 'rgba(0,242,254,0.95)' : 'rgba(255,255,255,0.5)',
                            ...a11yTextShadow.secondary,
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </nav>

              <div className="mt-4 pt-4 space-y-1 border-t border-white/[0.04]">
                <motion.button
                  onClick={() => {
                    onBack()
                    setMobileMenuOpen(false)
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white/80 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" style={a11yTextShadow.icon} />
                  <span className="text-sm font-medium" style={a11yTextShadow.secondary}>{t('admin.back_to_home')}</span>
                </motion.button>
                
                <motion.button
                  onClick={() => {
                    if (confirm(t('admin.logout_confirm'))) {
                      onLogout()
                    }
                    setMobileMenuOpen(false)
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" style={a11yTextShadow.icon} />
                  <span className="text-sm font-medium" style={a11yTextShadow.secondary}>{t('admin.logout')}</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========================================
         VIBE CODING: Mobile Floating Dock
         替换原本死板的底部栏，改为可展开悬浮坞
         放置在右下角拇指热区，节省屏幕空间
         ======================================== */}
      <MobileFloatingDock
        className="md:hidden"
        items={navItems.map(item => ({
          id: item.id,
          label: t(item.fullLabelKey),
          icon: item.icon,
          onClick: () => onTabChange(item.id),
          isActive: activeTab === item.id,
        }))}
      />
    </>
  )
}
