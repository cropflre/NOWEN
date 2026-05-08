import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Info,
  Github,
  Globe,
  Heart,
  Sparkles,
  Coffee,
  Star,
  Send,
  Container,
  X,
} from 'lucide-react'

/**
 * 后台「关于」模块
 * - 项目说明、技术栈
 * - 仓库 / 镜像 / 反馈链接
 * - 微信打赏二维码（点击放大）
 */
export function AboutCard() {
  const { t } = useTranslation()
  const [showQrcode, setShowQrcode] = useState(false)

  const techStack = [
    'React 18', 'TypeScript', 'Vite', 'Tailwind CSS',
    'Framer Motion', 'dnd-kit', 'i18next',
    'Express', 'SQLite', 'Docker',
  ]

  const features = [
    { icon: Sparkles, key: 'feature_modern' },
    { icon: Globe, key: 'feature_i18n' },
    { icon: Container, key: 'feature_docker' },
    { icon: Heart, key: 'feature_oss' },
  ]

  const links = [
    {
      icon: Github,
      labelKey: 'admin.about.link_github',
      href: 'https://github.com/cropflre/NOWEN',
      color: 'from-gray-500/20 to-slate-500/20',
      iconColor: 'text-gray-700 dark:text-gray-300',
    },
    {
      icon: Container,
      labelKey: 'admin.about.link_docker',
      href: 'https://hub.docker.com/r/cropflre/nowen',
      color: 'from-sky-500/20 to-blue-500/20',
      iconColor: 'text-sky-600 dark:text-sky-400',
    },
    {
      icon: Send,
      labelKey: 'admin.about.link_issue',
      href: 'https://github.com/cropflre/NOWEN/issues',
      color: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      icon: Star,
      labelKey: 'admin.about.link_star',
      href: 'https://github.com/cropflre/NOWEN',
      color: 'from-yellow-500/20 to-amber-500/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  ]

  const version = (import.meta as any).env?.VITE_APP_VERSION || 'v1.x'

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20">
          <Info className="w-5 h-5 text-pink-500 dark:text-pink-400" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{t('admin.about.title')}</h3>
          <p className="text-sm text-gray-500 dark:text-white/50">{t('admin.about.subtitle')}</p>
        </div>
      </div>

      {/* 项目卡片 - 顶部 hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 p-6"
      >
        {/* 背景装饰 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">NOWEN</h2>
              <span className="text-base font-medium text-gray-600 dark:text-white/60">
                {t('admin.about.cn_name')}
              </span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-white/60 dark:bg-white/10 text-gray-600 dark:text-white/70 border border-gray-200 dark:border-white/10">
                {version}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-white/70 mt-1.5 leading-relaxed">
              {t('admin.about.description')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 核心特性 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {features.map((feat, i) => {
          const Icon = feat.icon
          return (
            <motion.div
              key={feat.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
            >
              <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mb-1.5" />
              <p className="text-xs font-medium text-gray-700 dark:text-white/80">
                {t(`admin.about.${feat.key}`)}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* 链接区 */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-white/40 mb-3">
          {t('admin.about.links_title')}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <a
                key={link.labelKey}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:bg-white dark:hover:bg-white/[0.08] transition-all"
              >
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${link.color}`}>
                  <Icon className={`w-5 h-5 ${link.iconColor}`} />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-white/80 text-center">
                  {t(link.labelKey)}
                </span>
              </a>
            )
          })}
        </div>
      </div>

      {/* 技术栈 */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
        <p className="text-xs font-medium text-gray-500 dark:text-white/40 mb-3">
          {t('admin.about.tech_stack')}
        </p>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* 打赏区 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl border border-pink-200 dark:border-pink-500/20 bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 dark:from-pink-500/10 dark:via-rose-500/10 dark:to-orange-500/5 p-6"
      >
        {/* 背景装饰 */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex-shrink-0">
              <Coffee className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                {t('admin.about.donate_title')}
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              </h4>
              <p className="text-sm text-gray-600 dark:text-white/70 mt-1 leading-relaxed">
                {t('admin.about.donate_desc')}
              </p>
            </div>
          </div>

          {/* 二维码 */}
          <button
            onClick={() => setShowQrcode(true)}
            className="flex-shrink-0 group"
            aria-label={t('admin.about.donate_view_qr')}
          >
            <div className="relative p-2 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 transition-transform group-hover:scale-105 shadow-sm">
              <img
                src="/sponsor/weixin.jpg"
                alt={t('admin.about.donate_qr_alt')}
                className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-lg"
                onError={(e) => {
                  // 图片加载失败时优雅降级
                  const img = e.currentTarget
                  img.style.display = 'none'
                  const parent = img.parentElement
                  if (parent && !parent.querySelector('.qr-fallback')) {
                    const fallback = document.createElement('div')
                    fallback.className = 'qr-fallback w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center text-xs text-gray-400 text-center px-2'
                    fallback.innerText = t('admin.about.donate_qr_missing')
                    parent.appendChild(fallback)
                  }
                }}
              />
              <p className="text-[10px] text-center mt-1.5 text-gray-500 dark:text-white/50">
                {t('admin.about.donate_click_to_zoom')}
              </p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* 鸣谢 / 协议 */}
      <div className="text-center text-xs text-gray-400 dark:text-white/30 pt-2 pb-4 space-y-1">
        <p>{t('admin.about.license')}</p>
        <p className="flex items-center justify-center gap-1">
          {t('admin.about.made_with')}
          <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
          {t('admin.about.by_author')}
        </p>
      </div>

      {/* 二维码大图弹窗 */}
      <AnimatePresence>
        {showQrcode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQrcode(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl max-w-sm w-full cursor-default"
            >
              <button
                onClick={() => setShowQrcode(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-4 h-4 text-gray-500 dark:text-white/60" />
              </button>

              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
                  <Coffee className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('admin.about.donate_title')}</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3">
                  <img
                    src="/sponsor/weixin.jpg"
                    alt={t('admin.about.donate_qr_alt')}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-white/60">
                  {t('admin.about.donate_thanks')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AboutCard
