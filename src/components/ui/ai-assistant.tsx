import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Send,
  X,
  ExternalLink,
  MessageSquare,
  Bot,
  User,
  Trash2,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { aiApi } from '../../lib/api'
import type { AiChatResponse } from '../../lib/api'

interface AiAssistantProps {
  isOpen: boolean
  onClose: () => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  bookmarks?: AiChatResponse['bookmarks']
  timestamp: number
}

// ==========================================
// 打字机效果组件 — 逐字输出 + 光标闪烁
// ==========================================
function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('')
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    let i = 0
    setDisplayedText('')
    setIsDone(false)
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i))
        i++
      } else {
        clearInterval(timer)
        setIsDone(true)
        onComplete?.()
      }
    }, 25)
    return () => clearInterval(timer)
  }, [text])

  return (
    <span>
      {displayedText}
      {!isDone && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom rounded-full"
          style={{ background: 'rgb(168,85,247)' }}
        />
      )}
    </span>
  )
}

// ==========================================
// 极光呼吸边框装饰线
// ==========================================
function AuroraLine() {
  return (
    <div className="relative h-[2px] w-full overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(147,51,234,0.8), rgba(6,182,212,0.8), rgba(147,51,234,0.8), transparent)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '200% 0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {/* 光晕 */}
      <div className="absolute inset-0 blur-sm" style={{
        background: 'linear-gradient(90deg, transparent, rgba(147,51,234,0.4), rgba(6,182,212,0.4), rgba(147,51,234,0.4), transparent)',
      }} />
    </div>
  )
}

// ==========================================
// 主组件
// ==========================================
export function AiAssistant({ isOpen, onClose }: AiAssistantProps) {
  const { t, i18n } = useTranslation()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)
  const [latestAiMsgId, setLatestAiMsgId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 检查 AI 状态
  useEffect(() => {
    if (isOpen && aiConfigured === null) {
      aiApi.status()
        .then(s => setAiConfigured(s.configured))
        .catch(() => setAiConfigured(false))
    }
  }, [isOpen, aiConfigured])

  // 自动聚焦
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleSend = useCallback(async () => {
    const msg = input.trim()
    if (!msg || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const result = await aiApi.chat({
        message: msg,
        lang: i18n.language,
      })

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.reply || result.error || t('ai_assistant.error'),
        bookmarks: result.bookmarks,
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, assistantMessage])
      setLatestAiMsgId(assistantMessage.id)
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: err?.message || t('ai_assistant.error'),
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errorMessage])
      setLatestAiMsgId(errorMessage.id)
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, i18n.language, t])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearHistory = () => {
    setMessages([])
    setLatestAiMsgId(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 — 暗黑毛玻璃 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* 主面板 */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.92, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[8vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[680px] z-[61] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl"
            style={{
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-glass-border)',
              boxShadow: '0 0 60px rgba(147,51,234,0.08), 0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 极光呼吸顶部装饰线 */}
            <AuroraLine />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, rgba(147,51,234,0.15) 0%, rgba(6,182,212,0.15) 100%)',
                    border: '1px solid rgba(147,51,234,0.2)',
                  }}
                >
                  <Sparkles className="w-4.5 h-4.5" style={{ color: 'rgb(168,85,247)' }} />
                  {/* 微光脉冲 */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(147,51,234,0.1) 0%, rgba(6,182,212,0.1) 100%)',
                    }}
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
                <div>
                  <h3 className="text-sm font-semibold tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
                    NOWEN AI
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('ai_assistant.subtitle')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* 清空对话 */}
                {messages.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleClearHistory}
                    title={t('ai_assistant.clear_history')}
                    className="p-2 rounded-lg transition-colors hover:bg-[var(--color-glass-hover)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  </motion.button>
                )}
                <span className="text-xs px-2 py-0.5 rounded-md" style={{
                  background: 'var(--color-glass)',
                  color: 'var(--color-text-muted)',
                }}>
                  ⌘J
                </span>
                <button onClick={onClose} className="p-2 rounded-lg transition-colors hover:bg-[var(--color-glass-hover)]">
                  <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-[240px] max-h-[55vh]">
              {/* AI 未配置提示 */}
              {aiConfigured === false && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(147,51,234,0.1) 0%, rgba(6,182,212,0.1) 100%)',
                      border: '1px solid rgba(147,51,234,0.15)',
                    }}
                  >
                    <Bot className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
                  </motion.div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('ai_assistant.not_configured')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t('ai_assistant.not_configured_hint')}
                  </p>
                </div>
              )}

              {/* 欢迎状态 */}
              {aiConfigured !== false && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    className="w-18 h-18 rounded-2xl flex items-center justify-center mb-5 relative"
                    style={{
                      width: 72,
                      height: 72,
                      background: 'linear-gradient(135deg, rgba(147,51,234,0.12) 0%, rgba(6,182,212,0.12) 100%)',
                      border: '1px solid rgba(147,51,234,0.2)',
                    }}
                  >
                    <Sparkles className="w-9 h-9" style={{ color: 'rgb(168,85,247)' }} />
                    {/* 脉冲光环 */}
                    <motion.div
                      className="absolute inset-[-4px] rounded-2xl"
                      style={{
                        border: '1px solid rgba(147,51,234,0.15)',
                      }}
                      animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-base font-semibold mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {t('ai_assistant.welcome')}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-xs max-w-sm leading-relaxed"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t('ai_assistant.welcome_hint')}
                  </motion.p>

                  {/* 快捷提问按钮 */}
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {[
                      t('ai_assistant.quick_1'),
                      t('ai_assistant.quick_2'),
                      t('ai_assistant.quick_3'),
                    ].map((q, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + i * 0.08 }}
                        onClick={() => setInput(q)}
                        className="px-3.5 py-2 rounded-xl text-xs transition-all hover:scale-[1.03] active:scale-[0.97]"
                        style={{
                          background: 'var(--color-glass)',
                          border: '1px solid var(--color-glass-border)',
                          color: 'var(--color-text-secondary)',
                        }}
                        whileHover={{
                          borderColor: 'rgba(147,51,234,0.3)',
                          boxShadow: '0 0 12px rgba(147,51,234,0.08)',
                        }}
                      >
                        <MessageSquare className="w-3 h-3 inline mr-1.5 opacity-50" />
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* 消息列表 */}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'flex-row-reverse' : '',
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5',
                  )} style={{
                    background: msg.role === 'assistant'
                      ? 'linear-gradient(135deg, rgba(147,51,234,0.2) 0%, rgba(6,182,212,0.2) 100%)'
                      : 'var(--color-glass)',
                    border: msg.role === 'assistant'
                      ? '1px solid rgba(147,51,234,0.2)'
                      : '1px solid var(--color-glass-border)',
                  }}>
                    {msg.role === 'assistant' ? (
                      <Sparkles className="w-3.5 h-3.5" style={{ color: 'rgb(168,85,247)' }} />
                    ) : (
                      <User className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div className={cn(
                    'flex-1 min-w-0',
                    msg.role === 'user' ? 'text-right' : '',
                  )}>
                    <div
                      className={cn(
                        'inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] text-left',
                        msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm',
                      )}
                      style={{
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, rgba(147,51,234,0.18) 0%, rgba(6,182,212,0.18) 100%)'
                          : 'var(--color-glass)',
                        border: msg.role === 'user'
                          ? '1px solid rgba(147,51,234,0.25)'
                          : '1px solid var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'pre-wrap' as const,
                        wordBreak: 'break-word' as const,
                        boxShadow: msg.role === 'user'
                          ? '0 0 20px rgba(147,51,234,0.06)'
                          : 'none',
                      }}
                    >
                      {/* 最新的 AI 回复使用打字机效果 */}
                      {msg.role === 'assistant' && msg.id === latestAiMsgId ? (
                        <TypewriterText text={msg.content} onComplete={() => setLatestAiMsgId(null)} />
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* 推荐书签卡片 */}
                    {msg.bookmarks && msg.bookmarks.length > 0 && (
                      <div className="mt-2.5 space-y-2">
                        {msg.bookmarks.map((bm, bmIdx) => (
                          <motion.a
                            key={bm.id}
                            href={bm.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: bmIdx * 0.06 }}
                            className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all group"
                            style={{
                              background: 'var(--color-glass)',
                              border: '1px solid var(--color-glass-border)',
                            }}
                            whileHover={{
                              borderColor: 'rgba(147,51,234,0.25)',
                              boxShadow: '0 0 15px rgba(147,51,234,0.06)',
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden" style={{
                              background: 'var(--color-bg-tertiary)',
                            }}>
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${new URL(bm.url).hostname}&sz=32`}
                                alt=""
                                className="w-4 h-4"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                {bm.title}
                              </div>
                              {bm.description && (
                                <div className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                  {bm.description}
                                </div>
                              )}
                              {bm.categoryName && (
                                <div className="text-xs mt-0.5 opacity-60" style={{ color: 'var(--color-text-muted)' }}>
                                  {bm.categoryName}
                                </div>
                              )}
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
                          </motion.a>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* 思考中 — 紫/青脉冲光点 */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5" style={{
                    background: 'linear-gradient(135deg, rgba(147,51,234,0.2) 0%, rgba(6,182,212,0.2) 100%)',
                    border: '1px solid rgba(147,51,234,0.2)',
                  }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" style={{ color: 'rgb(168,85,247)' }} />
                    </motion.div>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-3 rounded-2xl rounded-bl-sm" style={{
                    background: 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                  }}>
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'rgb(168,85,247)', boxShadow: '0 0 8px rgba(168,85,247,0.6)' }}
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'rgb(6,182,212)', boxShadow: '0 0 8px rgba(6,182,212,0.6)' }}
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'rgb(168,85,247)', boxShadow: '0 0 8px rgba(168,85,247,0.6)' }}
                    />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="px-5 py-3.5 relative" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
              {/* 输入框上方渐变光晕线 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px]" style={{
                background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.2), transparent)',
              }} />

              <div className="relative flex items-center gap-2.5">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={aiConfigured === false ? t('ai_assistant.not_configured') : t('ai_assistant.placeholder')}
                    disabled={aiConfigured === false || isLoading}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  {/* 输入框聚焦时的微光边框 */}
                  {input.trim() && (
                    <motion.div
                      layoutId="input-glow"
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{
                        border: '1px solid rgba(147,51,234,0.3)',
                        boxShadow: '0 0 12px rgba(147,51,234,0.06)',
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </div>
                <motion.button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || aiConfigured === false}
                  className={cn(
                    'p-3 rounded-xl transition-all flex-shrink-0',
                    'disabled:opacity-30 disabled:cursor-not-allowed',
                  )}
                  style={{
                    background: input.trim()
                      ? 'linear-gradient(135deg, rgba(147,51,234,0.25) 0%, rgba(6,182,212,0.25) 100%)'
                      : 'var(--color-glass)',
                    border: input.trim()
                      ? '1px solid rgba(147,51,234,0.35)'
                      : '1px solid var(--color-glass-border)',
                  }}
                  whileHover={input.trim() ? { scale: 1.06, boxShadow: '0 0 20px rgba(147,51,234,0.15)' } : {}}
                  whileTap={input.trim() ? { scale: 0.94 } : {}}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-4 h-4" style={{ color: 'rgb(168,85,247)' }} />
                    </motion.div>
                  ) : (
                    <Send className="w-4 h-4" style={{ color: input.trim() ? 'rgb(168,85,247)' : 'var(--color-text-muted)' }} />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
