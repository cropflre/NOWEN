/**
 * NowenNoteSettingsCard · nowen-note 同步配置（独立页签）
 * ---------------------------------------------------------------------------
 * 双路径连接设计（方案 B 主推 + 方案 C 兜底）：
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ 未连接态：                                    │
 *   │   ▸ 主路径："一键连接"（URL + 邮箱 + 密码）    │
 *   │   ▸ 高级路径（折叠）：手动填 nkn_ Token       │
 *   ├──────────────────────────────────────────────┤
 *   │ 已连接态：                                    │
 *   │   ▸ 显示连接状态、Token 名/预览、最近同步     │
 *   │   ▸ 同步模式 / 默认笔记本配置                 │
 *   │   ▸ [断开连接] 按钮（远端吊销 Token + 本地清空）│
 *   └──────────────────────────────────────────────┘
 *
 * 安全：密码只在内存中存在数秒（提交后立即从 state 清空），永不落地。
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cloud,
  Key,
  Link2,
  RefreshCcw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  ExternalLink,
  ShieldCheck,
  User,
  Lock,
  Zap,
  Unlink,
  ChevronDown,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  testNowenNoteConnection,
  setupNowenNoteWithCredentials,
  disconnectNowenNote,
  type NowenNoteSettings,
  type SiteSettings,
} from '../../lib/api'

interface NowenNoteSettingsCardProps {
  settings: SiteSettings
  onChange: (s: SiteSettings) => void
  /** 保存配置（同步模式/默认笔记本等非敏感字段） */
  onSave: () => Promise<void>
  /** 重新拉取设置（连接/断开成功后用） */
  onReload?: () => Promise<void>
  isSaving: boolean
  success: boolean
  error: string
}

export function NowenNoteSettingsCard({
  settings,
  onChange,
  onSave,
  onReload,
  isSaving,
  success,
  error,
}: NowenNoteSettingsCardProps) {
  const { t } = useTranslation()
  const cfg: NowenNoteSettings =
    settings.nowenNote || { baseUrl: '', hasToken: false, syncMode: 'auto' }

  // ===== 一键连接表单状态 =====
  const [setupBaseUrl, setSetupBaseUrl] = useState(cfg.baseUrl || '')
  const [setupUsername, setSetupUsername] = useState('')
  const [setupPassword, setSetupPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [setupResult, setSetupResult] = useState<{
    ok: boolean
    message: string
    code?: string
  } | null>(null)

  // ===== 高级路径（手填 Token）状态 =====
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [tokenDraft, setTokenDraft] = useState('')
  const [advBaseUrl, setAdvBaseUrl] = useState(cfg.baseUrl || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  // ===== 断开状态 =====
  const [disconnecting, setDisconnecting] = useState(false)
  const [disconnectResult, setDisconnectResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  )

  const isConnected = !!(cfg.hasToken && cfg.baseUrl)

  /** 局部更新非敏感字段（同步模式/默认笔记本） */
  const update = (patch: Partial<NowenNoteSettings>) => {
    onChange({
      ...settings,
      nowenNote: { ...cfg, ...patch },
    })
  }

  /** 一键连接 */
  const handleSetup = async () => {
    if (!setupBaseUrl.trim() || !setupUsername.trim() || !setupPassword) {
      setSetupResult({
        ok: false,
        message: t('admin.settings.site.nowenNote.setup.missingFields', {
          defaultValue: '请填写完整的服务地址、用户名和密码',
        }),
      })
      return
    }
    setConnecting(true)
    setSetupResult(null)
    try {
      const res = await setupNowenNoteWithCredentials({
        baseUrl: setupBaseUrl.trim(),
        username: setupUsername.trim(),
        password: setupPassword,
      })
      if (res.ok) {
        setSetupResult({
          ok: true,
          message: t('admin.settings.site.nowenNote.setup.success', {
            defaultValue: '连接成功！已自动创建专属访问令牌',
          }),
        })
        // 立即清空密码（最小化在内存中的存活时间）
        setSetupPassword('')
        setSetupUsername('')
        // 触发上层重新拉取设置（apiTokenPreview / hasToken 会刷新）
        if (onReload) {
          await onReload()
        }
      } else {
        setSetupResult({
          ok: false,
          message:
            res.error ||
            t('admin.settings.site.nowenNote.setup.fail', {
              defaultValue: '连接失败',
            }),
          code: res.code,
        })
      }
    } catch (e: any) {
      setSetupResult({
        ok: false,
        message:
          e?.message ||
          t('admin.settings.site.nowenNote.setup.fail', { defaultValue: '连接失败' }),
      })
    } finally {
      setConnecting(false)
    }
  }

  /** 断开连接 */
  const handleDisconnect = async () => {
    if (
      !window.confirm(
        t('admin.settings.site.nowenNote.disconnect.confirm', {
          defaultValue: '确定要断开 nowen-note 连接吗？远端的访问令牌将被吊销。',
        }),
      )
    ) {
      return
    }
    setDisconnecting(true)
    setDisconnectResult(null)
    try {
      const res = await disconnectNowenNote()
      if (res.ok) {
        setDisconnectResult({
          ok: true,
          message: res.remoteRevoked
            ? t('admin.settings.site.nowenNote.disconnect.success', {
                defaultValue: '已断开连接，远端令牌已吊销',
              })
            : t('admin.settings.site.nowenNote.disconnect.successLocal', {
                defaultValue: '已在本地断开（远端吊销失败，请手动到 nowen-note 删除）',
              }),
        })
        if (onReload) {
          await onReload()
        }
      } else {
        setDisconnectResult({
          ok: false,
          message:
            res.error ||
            t('admin.settings.site.nowenNote.disconnect.fail', {
              defaultValue: '断开失败',
            }),
        })
      }
    } catch (e: any) {
      setDisconnectResult({
        ok: false,
        message:
          e?.message ||
          t('admin.settings.site.nowenNote.disconnect.fail', { defaultValue: '断开失败' }),
      })
    } finally {
      setDisconnecting(false)
    }
  }

  /** 高级：手填 Token 测试连通性 */
  const handleTestAdvanced = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const baseUrl = advBaseUrl.trim() || cfg.baseUrl?.trim()
      const apiToken = tokenDraft.trim()
      const result = await testNowenNoteConnection(baseUrl, apiToken)
      if (result.ok) {
        setTestResult({
          ok: true,
          message: t('admin.settings.site.nowenNote.testOk', {
            count: result.notebooksCount ?? 0,
          }),
        })
      } else {
        setTestResult({
          ok: false,
          message: result.error || t('admin.settings.site.nowenNote.testFail'),
        })
      }
    } catch (e: any) {
      setTestResult({
        ok: false,
        message: e?.message || t('admin.settings.site.nowenNote.testFail'),
      })
    } finally {
      setTesting(false)
    }
  }

  /** 同步基本字段（manual token / advanced baseUrl）到 settings 走标准 PATCH */
  const handleApplyAdvanced = () => {
    update({
      baseUrl: advBaseUrl.trim() || cfg.baseUrl,
      apiToken: tokenDraft.trim() || undefined,
    })
  }

  // ===== 渲染：顶部封面（保持原视觉） =====
  const Header = (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, #8b5cf6 18%, transparent), color-mix(in srgb, #06b6d4 12%, transparent))',
        border: '1px solid color-mix(in srgb, #8b5cf6 25%, transparent)',
      }}
    >
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      <div className="relative flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(99,102,241,0.3))',
            border: '1px solid rgba(139,92,246,0.5)',
            boxShadow: '0 0 20px rgba(139,92,246,0.25)',
          }}
        >
          <Cloud className="w-6 h-6" style={{ color: '#c4b5fd' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('admin.settings.site.nowenNote.title')}
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {t('admin.settings.site.nowenNote.subtitle')}
          </p>
        </div>
        {isConnected ? (
          <span
            className="px-2.5 py-1 text-[11px] rounded-full inline-flex items-center gap-1 flex-shrink-0"
            style={{
              background: 'rgba(34, 197, 94, 0.18)',
              color: 'rgb(34, 197, 94)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
            }}
          >
            <ShieldCheck className="w-3 h-3" />
            {t('admin.settings.site.nowenNote.configured')}
          </span>
        ) : (
          <span
            className="px-2.5 py-1 text-[11px] rounded-full flex-shrink-0"
            style={{
              background: 'var(--color-bg-tertiary, rgba(255,255,255,0.06))',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            {t('admin.settings.site.nowenNote.notConfigured')}
          </span>
        )}
      </div>
    </motion.div>
  )

  // ===== 未连接态：一键连接面板 =====
  const SetupPanel = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="rounded-2xl p-6"
      style={{
        background: 'var(--color-glass)',
        border: '1px solid var(--color-glass-border)',
      }}
    >
      {/* 一键连接标题 */}
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <Zap className="w-4 h-4" style={{ color: 'rgb(167, 139, 250)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {t('admin.settings.site.nowenNote.setup.title', {
              defaultValue: '一键连接',
            })}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {t('admin.settings.site.nowenNote.setup.subtitle', {
              defaultValue:
                '填入您的 nowen-note 账号，我们会自动为您创建一个专属访问令牌。密码不会被保存。',
            })}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* URL */}
        <div>
          <label
            className="flex items-center gap-1.5 text-xs mb-1.5 font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Link2 className="w-3 h-3" />
            {t('admin.settings.site.nowenNote.baseUrl')}
          </label>
          <input
            type="text"
            value={setupBaseUrl}
            onChange={(e) => setSetupBaseUrl(e.target.value)}
            placeholder="https://note.example.com"
            disabled={connecting}
            className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
            style={{
              background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-glass-border)',
            }}
          />
        </div>

        {/* 用户名 */}
        <div>
          <label
            className="flex items-center gap-1.5 text-xs mb-1.5 font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <User className="w-3 h-3" />
            {t('admin.settings.site.nowenNote.setup.username', {
              defaultValue: '用户名 / 邮箱',
            })}
          </label>
          <input
            type="text"
            value={setupUsername}
            onChange={(e) => setSetupUsername(e.target.value)}
            placeholder={t('admin.settings.site.nowenNote.setup.usernamePlaceholder', {
              defaultValue: '您在 nowen-note 的登录名',
            })}
            disabled={connecting}
            autoComplete="username"
            className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
            style={{
              background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-glass-border)',
            }}
          />
        </div>

        {/* 密码 */}
        <div>
          <label
            className="flex items-center gap-1.5 text-xs mb-1.5 font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Lock className="w-3 h-3" />
            {t('admin.settings.site.nowenNote.setup.password', {
              defaultValue: '密码',
            })}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={setupPassword}
              onChange={(e) => setSetupPassword(e.target.value)}
              placeholder={t('admin.settings.site.nowenNote.setup.passwordPlaceholder', {
                defaultValue: '密码仅用于一次性换取令牌，不会保存',
              })}
              disabled={connecting}
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !connecting) handleSetup()
              }}
              className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg outline-none transition-all focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
              style={{
                background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-glass-border)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/5 transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {showPassword ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
            <Sparkles className="w-3 h-3" style={{ color: 'rgb(167, 139, 250)' }} />
            {t('admin.settings.site.nowenNote.setup.passwordHint', {
              defaultValue: '密码仅在内存中存在数秒——成功后立即丢弃，绝不落地保存。',
            })}
          </p>
        </div>

        {/* 一键连接按钮 + 反馈 */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSetup}
            disabled={connecting || !setupBaseUrl.trim() || !setupUsername.trim() || !setupPassword}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                'linear-gradient(135deg, rgb(139, 92, 246), rgb(99, 102, 241))',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(139,92,246,0.35)',
            }}
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('admin.settings.site.nowenNote.setup.connecting', {
                  defaultValue: '正在连接…',
                })}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                {t('admin.settings.site.nowenNote.setup.action', {
                  defaultValue: '一键连接',
                })}
              </>
            )}
          </button>

          <AnimatePresence>
            {setupResult && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 p-3 rounded-lg text-xs flex items-start gap-2"
                style={{
                  background: setupResult.ok
                    ? 'rgba(34, 197, 94, 0.08)'
                    : 'rgba(239, 68, 68, 0.08)',
                  border: setupResult.ok
                    ? '1px solid rgba(34, 197, 94, 0.25)'
                    : '1px solid rgba(239, 68, 68, 0.25)',
                  color: setupResult.ok ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                }}
              >
                {setupResult.ok ? (
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 leading-relaxed">
                  {setupResult.message}
                  {/* 2FA 用户提示走高级路径 */}
                  {setupResult.code === 'REQUIRES_2FA' && (
                    <button
                      type="button"
                      onClick={() => setAdvancedOpen(true)}
                      className="ml-1 underline hover:opacity-80"
                    >
                      {t('admin.settings.site.nowenNote.setup.use2faHint', {
                        defaultValue: '点此切换到手动填 Token →',
                      })}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 高级路径折叠区 */}
      <div
        className="mt-6 pt-5 border-t"
        style={{ borderColor: 'var(--color-glass-border)' }}
      >
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="w-full flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Key className="w-3 h-3" />
            {t('admin.settings.site.nowenNote.advanced.title', {
              defaultValue: '高级：手动填入 API Token',
            })}
          </span>
          <ChevronDown
            className="w-3.5 h-3.5 transition-transform"
            style={{
              transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        <AnimatePresence>
          {advancedOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                <p
                  className="text-[11px] leading-relaxed px-3 py-2 rounded-lg"
                  style={{
                    background: 'rgba(139, 92, 246, 0.06)',
                    color: 'var(--color-text-muted)',
                    border: '1px dashed rgba(139, 92, 246, 0.25)',
                  }}
                >
                  {t('admin.settings.site.nowenNote.advanced.hint', {
                    defaultValue:
                      '适用于：开启了二次验证的账号 / 想用现有的 Token / 需要更精细的 scope 控制。请到 nowen-note 的"个人访问令牌"页面创建一个 Token。',
                  })}
                </p>

                {/* URL（高级） */}
                <div>
                  <label
                    className="flex items-center gap-1.5 text-xs mb-1.5 font-medium"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Link2 className="w-3 h-3" />
                    {t('admin.settings.site.nowenNote.baseUrl')}
                  </label>
                  <input
                    type="text"
                    value={advBaseUrl}
                    onChange={(e) => setAdvBaseUrl(e.target.value)}
                    placeholder="https://note.example.com"
                    className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all focus:ring-2 focus:ring-violet-500/30"
                    style={{
                      background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  />
                </div>

                {/* Token（高级） */}
                <div>
                  <label
                    className="flex items-center gap-1.5 text-xs mb-1.5 font-medium"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Key className="w-3 h-3" />
                    {t('admin.settings.site.nowenNote.apiToken')}
                  </label>
                  <input
                    type="password"
                    value={tokenDraft}
                    onChange={(e) => setTokenDraft(e.target.value)}
                    placeholder="nkn_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all font-mono focus:ring-2 focus:ring-violet-500/30"
                    style={{
                      background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  />
                </div>

                {/* 高级操作按钮 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTestAdvanced}
                    disabled={testing || !tokenDraft.trim() || !advBaseUrl.trim()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg font-medium transition-all disabled:opacity-50"
                    style={{
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: 'rgb(167, 139, 250)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    {testing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCcw className="w-3.5 h-3.5" />
                    )}
                    {t('admin.settings.site.nowenNote.test')}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      handleApplyAdvanced()
                      await onSave()
                      if (onReload) await onReload()
                      setTokenDraft('')
                    }}
                    disabled={isSaving || !tokenDraft.trim() || !advBaseUrl.trim()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg font-medium transition-all disabled:opacity-50"
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: 'rgb(34, 197, 94)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {t('admin.settings.site.nowenNote.advanced.save', {
                      defaultValue: '保存 Token',
                    })}
                  </button>

                  <AnimatePresence>
                    {testResult && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs inline-flex items-center gap-1"
                        style={{
                          color: testResult.ok ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                        }}
                      >
                        {testResult.ok ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {testResult.message}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )

  // ===== 已连接态：状态展示 + 同步配置 =====
  const ConnectedPanel = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="space-y-4"
    >
      {/* 连接状态卡 */}
      <div
        className="rounded-2xl p-5"
        style={{
          background:
            'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
          border: '1px solid rgba(34,197,94,0.25)',
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(34,197,94,0.18)',
              border: '1px solid rgba(34,197,94,0.4)',
            }}
          >
            <ShieldCheck className="w-5 h-5" style={{ color: 'rgb(34,197,94)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
              {t('admin.settings.site.nowenNote.connected.title', {
                defaultValue: '已成功连接到 nowen-note',
              })}
            </h3>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
              {cfg.baseUrl}
            </p>
          </div>
          <a
            href={cfg.baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all hover:bg-white/5 flex-shrink-0"
            style={{
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('admin.settings.site.nowenNote.openRemote', {
              defaultValue: '打开',
            })}
          </a>
        </div>

        {/* Token 信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className="px-3 py-2.5 rounded-lg"
            style={{
              background: 'var(--color-bg-tertiary, rgba(255,255,255,0.03))',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            <div className="text-[10px] mb-1" style={{ color: 'var(--color-text-muted)' }}>
              {t('admin.settings.site.nowenNote.connected.tokenPreview', {
                defaultValue: '访问令牌',
              })}
            </div>
            <div className="font-mono text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>
              {cfg.apiTokenPreview || '—'}
            </div>
          </div>
          <div
            className="px-3 py-2.5 rounded-lg"
            style={{
              background: 'var(--color-bg-tertiary, rgba(255,255,255,0.03))',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            <div className="text-[10px] mb-1" style={{ color: 'var(--color-text-muted)' }}>
              {t('admin.settings.site.nowenNote.connected.tokenName', {
                defaultValue: '令牌名称',
              })}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>
              {cfg.tokenName || t('admin.settings.site.nowenNote.connected.tokenNameLegacy', {
                defaultValue: '（未命名）',
              })}
            </div>
          </div>
        </div>

        {/* 断开按钮 + 反馈 */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg font-medium transition-all disabled:opacity-50"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'rgb(239, 68, 68)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            {disconnecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Unlink className="w-3.5 h-3.5" />
            )}
            {t('admin.settings.site.nowenNote.disconnect.action', {
              defaultValue: '断开连接',
            })}
          </button>

          <AnimatePresence>
            {disconnectResult && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs inline-flex items-center gap-1"
                style={{
                  color: disconnectResult.ok ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                }}
              >
                {disconnectResult.ok ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {disconnectResult.message}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 同步配置卡（同步模式 + 默认笔记本） */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {t('admin.settings.site.nowenNote.connected.syncConfig', {
            defaultValue: '同步配置',
          })}
        </h3>

        <div className="space-y-5">
          {/* 同步模式 */}
          <div>
            <label
              className="flex items-center gap-1.5 text-xs mb-1.5 font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <RefreshCcw className="w-3 h-3" />
              {t('admin.settings.site.nowenNote.syncMode')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['manual', 'auto', 'bidirectional'] as const).map((mode) => {
                const active = (cfg.syncMode || 'auto') === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => update({ syncMode: mode })}
                    className="px-3 py-2.5 text-xs rounded-lg transition-all text-left"
                    style={{
                      background: active
                        ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
                        : 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
                      color: active
                        ? 'var(--color-accent)'
                        : 'var(--color-text-primary)',
                      border: active
                        ? '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)'
                        : '1px solid var(--color-glass-border)',
                    }}
                  >
                    <div className="font-medium">
                      {t(`admin.settings.site.nowenNote.mode.${mode}`)}
                    </div>
                    <div className="text-[10px] mt-0.5 opacity-70 leading-relaxed">
                      {t(`admin.settings.site.nowenNote.modeHint.${mode}`)}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 默认笔记本 */}
          <div>
            <label
              className="flex items-center gap-1.5 text-xs mb-1.5 font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t('admin.settings.site.nowenNote.defaultNotebook')}
            </label>
            <input
              type="text"
              value={cfg.defaultNotebookId || ''}
              onChange={(e) => update({ defaultNotebookId: e.target.value })}
              placeholder={t('admin.settings.site.nowenNote.defaultNotebookPlaceholder')}
              className="w-full px-3 py-2.5 text-sm rounded-lg outline-none font-mono focus:ring-2 focus:ring-violet-500/30"
              style={{
                background: 'var(--color-bg-tertiary, rgba(255,255,255,0.04))',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-glass-border)',
              }}
            />
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {t('admin.settings.site.nowenNote.defaultNotebookHint')}
            </p>
          </div>
        </div>

        {/* 保存配置按钮 */}
        <div
          className="flex items-center justify-between gap-3 mt-6 pt-5 border-t"
          style={{ borderColor: 'var(--color-glass-border)' }}
        >
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              {success && (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs inline-flex items-center gap-1"
                  style={{ color: 'rgb(34, 197, 94)' }}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t('admin.settings.site.save_success', { defaultValue: '已保存' })}
                </motion.div>
              )}
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs inline-flex items-center gap-1 truncate"
                  style={{ color: 'rgb(239, 68, 68)' }}
                  title={error}
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                'linear-gradient(135deg, rgb(139, 92, 246), rgb(99, 102, 241))',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(139,92,246,0.35)',
            }}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving
              ? t('common.saving', { defaultValue: '保存中...' })
              : t('common.save', { defaultValue: '保存配置' })}
          </button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {Header}
      {isConnected ? ConnectedPanel : SetupPanel}
    </div>
  )
}
