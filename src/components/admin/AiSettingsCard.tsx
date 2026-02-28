import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Zap,
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { aiApi } from '../../lib/api'

interface AiSettingsCardProps {
  onSave?: () => void
}

interface AiProvider {
  id: string
  name: string
  desc: string
  gradient: string
  defaultModel: string
  needsApiKey: boolean
  needsApiBase: boolean
  placeholder: {
    apiKey: string
    apiBase: string
    model: string
  }
}

const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    desc: 'GPT-4o / GPT-4o-mini',
    gradient: 'from-emerald-500 to-teal-600',
    defaultModel: 'gpt-4o-mini',
    needsApiKey: true,
    needsApiBase: false,
    placeholder: {
      apiKey: 'sk-...',
      apiBase: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    },
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    desc: 'gemini-2.0-flash / gemini-2.5-flash-preview-05-20 / gemini-2.5-pro-preview-05-06',
    gradient: 'from-blue-500 to-indigo-600',
    defaultModel: 'gemini-2.0-flash',
    needsApiKey: true,
    needsApiBase: false,
    placeholder: {
      apiKey: 'AIza...',
      apiBase: '',
      model: 'gemini-2.0-flash',
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    desc: 'DeepSeek-V3 / DeepSeek-R1',
    gradient: 'from-sky-500 to-blue-600',
    defaultModel: 'deepseek-chat',
    needsApiKey: true,
    needsApiBase: false,
    placeholder: {
      apiKey: 'sk-...',
      apiBase: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
    },
  },
  {
    id: 'qwen',
    name: '通义千问',
    desc: 'Qwen-Turbo / Qwen-Plus / Qwen-Max',
    gradient: 'from-orange-500 to-amber-600',
    defaultModel: 'qwen-turbo',
    needsApiKey: true,
    needsApiBase: false,
    placeholder: {
      apiKey: 'sk-...',
      apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-turbo',
    },
  },
  {
    id: 'doubao',
    name: '豆包（火山引擎）',
    desc: 'Doubao-1.5-lite / Doubao-1.5-pro',
    gradient: 'from-rose-500 to-pink-600',
    defaultModel: 'doubao-1-5-lite-32k-250115',
    needsApiKey: true,
    needsApiBase: false,
    placeholder: {
      apiKey: 'bff2f5f8-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      apiBase: 'https://ark.cn-beijing.volces.com/api/v3',
      model: 'doubao-1-5-lite-32k-250115',
    },
  },
  {
    id: 'custom',
    name: 'Custom / Ollama',
    desc: 'OpenAI 兼容接口',
    gradient: 'from-purple-500 to-violet-600',
    defaultModel: '',
    needsApiKey: false,
    needsApiBase: true,
    placeholder: {
      apiKey: '(可选)',
      apiBase: 'http://localhost:11434/v1',
      model: 'qwen2.5:7b',
    },
  },
]

export function AiSettingsCard({ onSave }: AiSettingsCardProps) {
  const { t } = useTranslation()

  // 表单状态
  const [provider, setProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiBase, setApiBase] = useState('')
  const [model, setModel] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showProviderDropdown, setShowProviderDropdown] = useState(false)

  // 操作状态
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; model?: string } | null>(null)

  // 加载现有配置
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setIsLoading(true)
      const config = await aiApi.getConfig()
      setProvider(config.provider || '')
      setApiKey(config.apiKey || '')
      setApiBase(config.apiBase || '')
      setModel(config.model || '')
    } catch {
      // 如果没有配置，保持空
    } finally {
      setIsLoading(false)
    }
  }

  const currentProvider = AI_PROVIDERS.find(p => p.id === provider)

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      await aiApi.saveConfig({
        provider,
        apiKey: apiKey.startsWith('••••••') ? apiKey : apiKey,
        apiBase,
        model,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      onSave?.()
    } catch (err: any) {
      setSaveError(err?.message || t('admin.settings.ai.save_error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const result = await aiApi.testConnection()
      setTestResult(result)
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || t('admin.settings.ai.test_error') })
    } finally {
      setIsTesting(false)
    }
  }

  const handleClear = () => {
    setProvider('')
    setApiKey('')
    setApiBase('')
    setModel('')
    setTestResult(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative group"
    >
      <div
        className="relative rounded-2xl backdrop-blur-xl p-6"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-600/20 border border-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <div className="absolute -inset-2 rounded-xl bg-purple-500/20 blur-xl opacity-50 -z-10 dark:block hidden" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {t('admin.settings.ai.title')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {t('admin.settings.ai.subtitle')}
              </p>
            </div>
          </div>

          {/* 状态指示 */}
          <div
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5',
            )}
            style={{
              background: provider ? 'rgba(16,185,129,0.1)' : 'var(--color-bg-tertiary)',
              border: provider ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--color-glass-border)',
              color: provider ? 'rgb(16,185,129)' : 'var(--color-text-muted)',
            }}
          >
            <div className={cn('w-2 h-2 rounded-full', provider ? 'bg-emerald-500' : 'bg-gray-400')} />
            {provider ? t('admin.settings.ai.configured') : t('admin.settings.ai.not_configured')}
          </div>
        </div>

        {/* Provider 选择 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {t('admin.settings.ai.provider')}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-glass-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <div className="flex items-center gap-3">
                  {currentProvider ? (
                    <>
                      <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', currentProvider.gradient)}>
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{currentProvider.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{currentProvider.desc}</div>
                      </div>
                    </>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.ai.select_provider')}</span>
                  )}
                </div>
                <ChevronDown className={cn('w-4 h-4 transition-transform', showProviderDropdown && 'rotate-180')} style={{ color: 'var(--color-text-muted)' }} />
              </button>

              <AnimatePresence>
                {showProviderDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl overflow-hidden shadow-xl"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-glass-border)',
                    }}
                  >
                    {AI_PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProvider(p.id)
                          setShowProviderDropdown(false)
                          if (!model) setModel(p.defaultModel)
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 transition-all',
                          'hover:bg-[var(--color-glass-hover)]',
                          provider === p.id && 'bg-[var(--color-glass)]'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', p.gradient)}>
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.name}</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.desc}</div>
                        </div>
                        {provider === p.id && <Check className="w-4 h-4 text-emerald-500" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 配置字段（provider 选中后显示） */}
          <AnimatePresence>
            {provider && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {/* API Key */}
                {(currentProvider?.needsApiKey || provider !== 'custom') && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      API Key {provider === 'custom' && <span style={{ color: 'var(--color-text-muted)' }}>({t('admin.settings.ai.optional')})</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={currentProvider?.placeholder.apiKey}
                        className="w-full px-4 py-3 pr-10 rounded-xl text-sm transition-all outline-none"
                        style={{
                          background: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-glass-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[var(--color-glass-hover)] transition"
                      >
                        {showApiKey ? (
                          <EyeOff className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                        ) : (
                          <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* API Base URL */}
                {(currentProvider?.needsApiBase || provider === 'custom') && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      API Base URL {provider !== 'custom' && <span style={{ color: 'var(--color-text-muted)' }}>({t('admin.settings.ai.optional')})</span>}
                    </label>
                    <input
                      type="text"
                      value={apiBase}
                      onChange={(e) => setApiBase(e.target.value)}
                      placeholder={currentProvider?.placeholder.apiBase}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                )}

                {/* 也让 openai / 国内 Provider 可以配置 API Base（兼容代理/中转） */}
                {(['openai', 'deepseek', 'qwen', 'doubao', 'gemini'].includes(provider)) && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      API Base URL <span style={{ color: 'var(--color-text-muted)' }}>({t('admin.settings.ai.optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={apiBase}
                      onChange={(e) => setApiBase(e.target.value)}
                      placeholder={currentProvider?.placeholder.apiBase || 'https://api.openai.com/v1'}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t('admin.settings.ai.api_base_hint')}
                    </p>
                  </div>
                )}

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('admin.settings.ai.model')}
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={currentProvider?.placeholder.model || 'gpt-4o-mini'}
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>

                {/* 测试结果 */}
                <AnimatePresence>
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm',
                      )}
                      style={{
                        background: testResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: testResult.success ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                        color: testResult.success ? 'rgb(16,185,129)' : 'rgb(239,68,68)',
                      }}
                    >
                      {testResult.success ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                      <div>
                        <span>{testResult.message}</span>
                        {testResult.model && <span className="ml-2 opacity-70">({testResult.model})</span>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 保存错误 */}
                <AnimatePresence>
                  {saveError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: 'rgb(239,68,68)',
                      }}
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {saveError}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
          <motion.button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            style={{
              background: saveSuccess
                ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.2) 100%)'
                : 'linear-gradient(135deg, rgba(147,51,234,0.2) 0%, rgba(6,182,212,0.2) 100%)',
              border: saveSuccess ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(147,51,234,0.3)',
              color: saveSuccess ? 'rgb(16,185,129)' : 'var(--color-text-primary)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSaving ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            ) : saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveSuccess ? t('admin.settings.ai.saved') : t('admin.settings.ai.save')}
          </motion.button>

          {provider && (
            <motion.button
              onClick={handleTest}
              disabled={isTesting}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-glass-border)',
                color: 'var(--color-text-secondary)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isTesting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {t('admin.settings.ai.test')}
            </motion.button>
          )}

          {provider && (
            <motion.button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ml-auto"
              style={{
                color: 'var(--color-text-muted)',
              }}
              whileHover={{ scale: 1.02, color: 'rgb(239,68,68)' }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-4 h-4" />
              {t('admin.settings.ai.clear')}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
