import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Bookmark,
  FolderOpen,
  Quote,
  ImageIcon,
  BarChart3,
  HeartPulse,
  Settings,
  ChevronRight,
  Globe,
  Search,
  GripVertical,
  Import,
  Shield,
  Palette,
  Image,
  Monitor,
  Database,
  Zap,
  Layers,
  MousePointerClick,
  ScanSearch,
  Copy,
  Trash2,
  ArrowUpDown,
  Sun,
  Moon,
  Languages,
  FileText,
  Wallpaper,
  CloudDownload,
  CloudUpload,
  RotateCcw,
  UserCog,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  LayoutDashboard,
  Bot,
  Tags,
  Wand2,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface DocSection {
  id: string
  icon: LucideIcon
  titleKey: string
  features: {
    icon: LucideIcon
    titleKey: string
    descKey: string
  }[]
}

export function DocsCard() {
  const { t } = useTranslation()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const sections: DocSection[] = [
    {
      id: 'bookmarks',
      icon: Bookmark,
      titleKey: 'admin.docs.sections.bookmarks.title',
      features: [
        { icon: Bookmark, titleKey: 'admin.docs.sections.bookmarks.add_title', descKey: 'admin.docs.sections.bookmarks.add_desc' },
        { icon: Search, titleKey: 'admin.docs.sections.bookmarks.search_title', descKey: 'admin.docs.sections.bookmarks.search_desc' },
        { icon: ArrowUpDown, titleKey: 'admin.docs.sections.bookmarks.sort_title', descKey: 'admin.docs.sections.bookmarks.sort_desc' },
        { icon: Layers, titleKey: 'admin.docs.sections.bookmarks.batch_title', descKey: 'admin.docs.sections.bookmarks.batch_desc' },
        { icon: CloudDownload, titleKey: 'admin.docs.sections.bookmarks.enrich_title', descKey: 'admin.docs.sections.bookmarks.enrich_desc' },
        { icon: ScanSearch, titleKey: 'admin.docs.sections.bookmarks.detect_title', descKey: 'admin.docs.sections.bookmarks.detect_desc' },
        { icon: Globe, titleKey: 'admin.docs.sections.bookmarks.internal_title', descKey: 'admin.docs.sections.bookmarks.internal_desc' },
        { icon: MousePointerClick, titleKey: 'admin.docs.sections.bookmarks.context_title', descKey: 'admin.docs.sections.bookmarks.context_desc' },
      ],
    },
    {
      id: 'categories',
      icon: FolderOpen,
      titleKey: 'admin.docs.sections.categories.title',
      features: [
        { icon: FolderOpen, titleKey: 'admin.docs.sections.categories.manage_title', descKey: 'admin.docs.sections.categories.manage_desc' },
        { icon: GripVertical, titleKey: 'admin.docs.sections.categories.drag_title', descKey: 'admin.docs.sections.categories.drag_desc' },
        { icon: Palette, titleKey: 'admin.docs.sections.categories.style_title', descKey: 'admin.docs.sections.categories.style_desc' },
        { icon: EyeOff, titleKey: 'admin.docs.sections.categories.collapse_title', descKey: 'admin.docs.sections.categories.collapse_desc' },
      ],
    },
    {
      id: 'quotes',
      icon: Quote,
      titleKey: 'admin.docs.sections.quotes.title',
      features: [
        { icon: Quote, titleKey: 'admin.docs.sections.quotes.manage_title', descKey: 'admin.docs.sections.quotes.manage_desc' },
        { icon: Sparkles, titleKey: 'admin.docs.sections.quotes.default_title', descKey: 'admin.docs.sections.quotes.default_desc' },
      ],
    },
    {
      id: 'icons',
      icon: ImageIcon,
      titleKey: 'admin.docs.sections.icons.title',
      features: [
        { icon: ImageIcon, titleKey: 'admin.docs.sections.icons.custom_title', descKey: 'admin.docs.sections.icons.custom_desc' },
        { icon: Search, titleKey: 'admin.docs.sections.icons.iconify_title', descKey: 'admin.docs.sections.icons.iconify_desc' },
      ],
    },
    {
      id: 'analytics',
      icon: BarChart3,
      titleKey: 'admin.docs.sections.analytics.title',
      features: [
        { icon: BarChart3, titleKey: 'admin.docs.sections.analytics.visit_title', descKey: 'admin.docs.sections.analytics.visit_desc' },
        { icon: Zap, titleKey: 'admin.docs.sections.analytics.top_title', descKey: 'admin.docs.sections.analytics.top_desc' },
      ],
    },
    {
      id: 'health-check',
      icon: HeartPulse,
      titleKey: 'admin.docs.sections.health.title',
      features: [
        { icon: HeartPulse, titleKey: 'admin.docs.sections.health.check_title', descKey: 'admin.docs.sections.health.check_desc' },
        { icon: Trash2, titleKey: 'admin.docs.sections.health.dead_title', descKey: 'admin.docs.sections.health.dead_desc' },
      ],
    },
    {
      id: 'ai',
      icon: Bot,
      titleKey: 'admin.docs.sections.ai.title',
      features: [
        { icon: Tags, titleKey: 'admin.docs.sections.ai.tags_title', descKey: 'admin.docs.sections.ai.tags_desc' },
        { icon: FolderOpen, titleKey: 'admin.docs.sections.ai.classify_title', descKey: 'admin.docs.sections.ai.classify_desc' },
        { icon: Wand2, titleKey: 'admin.docs.sections.ai.enrich_title', descKey: 'admin.docs.sections.ai.enrich_desc' },
        { icon: MessageSquare, titleKey: 'admin.docs.sections.ai.chat_title', descKey: 'admin.docs.sections.ai.chat_desc' },
        { icon: Settings, titleKey: 'admin.docs.sections.ai.config_title', descKey: 'admin.docs.sections.ai.config_desc' },
      ],
    },
    {
      id: 'frontend',
      icon: Globe,
      titleKey: 'admin.docs.sections.frontend.title',
      features: [
        { icon: Search, titleKey: 'admin.docs.sections.frontend.search_title', descKey: 'admin.docs.sections.frontend.search_desc' },
        { icon: GripVertical, titleKey: 'admin.docs.sections.frontend.drag_title', descKey: 'admin.docs.sections.frontend.drag_desc' },
        { icon: Monitor, titleKey: 'admin.docs.sections.frontend.monitor_title', descKey: 'admin.docs.sections.frontend.monitor_desc' },
        { icon: Sun, titleKey: 'admin.docs.sections.frontend.theme_title', descKey: 'admin.docs.sections.frontend.theme_desc' },
        { icon: Languages, titleKey: 'admin.docs.sections.frontend.i18n_title', descKey: 'admin.docs.sections.frontend.i18n_desc' },
        { icon: FileText, titleKey: 'admin.docs.sections.frontend.readlater_title', descKey: 'admin.docs.sections.frontend.readlater_desc' },
        { icon: Smartphone, titleKey: 'admin.docs.sections.frontend.mobile_dock_title', descKey: 'admin.docs.sections.frontend.mobile_dock_desc' },
        { icon: LayoutDashboard, titleKey: 'admin.docs.sections.frontend.desktop_dock_title', descKey: 'admin.docs.sections.frontend.desktop_dock_desc' },
      ],
    },
    {
      id: 'settings',
      icon: Settings,
      titleKey: 'admin.docs.sections.settings.title',
      features: [
        { icon: Globe, titleKey: 'admin.docs.sections.settings.site_title', descKey: 'admin.docs.sections.settings.site_desc' },
        { icon: Palette, titleKey: 'admin.docs.sections.settings.theme_title', descKey: 'admin.docs.sections.settings.theme_desc' },
        { icon: Wallpaper, titleKey: 'admin.docs.sections.settings.wallpaper_title', descKey: 'admin.docs.sections.settings.wallpaper_desc' },
        { icon: Eye, titleKey: 'admin.docs.sections.settings.widget_title', descKey: 'admin.docs.sections.settings.widget_desc' },
        { icon: Lock, titleKey: 'admin.docs.sections.settings.security_title', descKey: 'admin.docs.sections.settings.security_desc' },
        { icon: Database, titleKey: 'admin.docs.sections.settings.data_title', descKey: 'admin.docs.sections.settings.data_desc' },
      ],
    },
  ]

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
          <BookOpen className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{t('admin.docs.title')}</h3>
          <p className="text-sm text-gray-500 dark:text-white/50">{t('admin.docs.description')}</p>
        </div>
      </div>

      {/* 功能概览 */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        {sections.slice(0, 9).map((section) => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={cn(
                'p-3 rounded-xl text-left transition-all',
                'border border-gray-200 dark:border-white/10',
                'hover:border-indigo-300 dark:hover:border-indigo-500/30',
                expandedSection === section.id
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30'
                  : 'bg-gray-50 dark:bg-white/5'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 mb-1.5',
                expandedSection === section.id
                  ? 'text-indigo-500 dark:text-indigo-400'
                  : 'text-gray-400 dark:text-white/40'
              )} />
              <p className={cn(
                'text-xs font-medium',
                expandedSection === section.id
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-white/60'
              )}>
                {t(section.titleKey)}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">
                {section.features.length} {t('admin.docs.feature_count')}
              </p>
            </button>
          )
        })}
      </div>

      {/* 展开的功能详情 */}
      <AnimatePresence mode="wait">
        {expandedSection && (
          <motion.div
            key={expandedSection}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 space-y-3">
              {sections.find(s => s.id === expandedSection)?.features.map((feature, index) => {
                const FeatureIcon = feature.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex gap-3 p-3 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5"
                  >
                    <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 h-fit flex-shrink-0">
                      <FeatureIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {t(feature.titleKey)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                        {t(feature.descKey)}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 全部功能列表 */}
      {!expandedSection && (
        <div className="space-y-4">
          {sections.map((section) => {
            const SectionIcon = section.icon
            return (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <SectionIcon className="w-4 h-4 text-gray-400 dark:text-white/40 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                    <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                      {t(section.titleKey)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-white/30">
                      {section.features.length} {t('admin.docs.feature_count')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/20 group-hover:text-gray-500 dark:group-hover:text-white/50 transition-colors" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* 技术栈 */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
        <p className="text-xs font-medium text-gray-500 dark:text-white/40 mb-3">{t('admin.docs.tech_stack')}</p>
        <div className="flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'dnd-kit', 'i18next', 'Express', 'SQLite', 'Docker'].map(tech => (
            <span
              key={tech}
              className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* 快捷提示 */}
      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">{t('admin.docs.tips_title')}</p>
        <ul className="text-xs text-amber-600 dark:text-amber-400/70 space-y-1">
          <li>• {t('admin.docs.tip_1')}</li>
          <li>• {t('admin.docs.tip_2')}</li>
          <li>• {t('admin.docs.tip_3')}</li>
          <li>• {t('admin.docs.tip_4')}</li>
        </ul>
      </div>
    </div>
  )
}

export default DocsCard
