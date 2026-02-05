import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowLeft, Shield, KeyRound, User } from 'lucide-react'
import { BorderBeam } from './ui/advanced-effects'
import { adminLogin } from '../lib/api'

interface AdminLoginProps {
  onLogin: (username: string, requirePasswordChange?: boolean) => void
  onBack: () => void
  isDark?: boolean
}

export function AdminLogin({ onLogin, onBack, isDark = true }: AdminLoginProps) {
  const { t } = useTranslation()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      setError(t('admin.login.empty_error'))
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const result = await adminLogin(username, password)
      // 登录状态已在 adminLogin 函数中自动保存
      onLogin(result.user.username, result.requirePasswordChange)
    } catch (err: any) {
      setError(err.message || t('admin.login.login_error'))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-slate-50 to-blue-50'
    }`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nebula-purple/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nebula-pink/10 rounded-full blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
          </>
        )}
      </div>

      {/* Back Button */}
      <motion.button
        onClick={onBack}
        className={`absolute top-6 left-6 p-2 rounded-xl transition-colors z-10 ${
          isDark 
            ? 'hover:bg-white/5 text-white/60 hover:text-white' 
            : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>

      {/* Login Card */}
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className={`relative p-8 rounded-3xl backdrop-blur-xl overflow-hidden ${
            isDark 
              ? 'bg-white/[0.03] border border-white/[0.08]' 
              : 'bg-white/80 border border-slate-200/60 shadow-xl shadow-slate-200/50'
          }`}
          animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <BorderBeam
            size={100}
            duration={12}
            colorFrom={isDark ? "rgba(102, 126, 234, 0.5)" : "rgba(59, 130, 246, 0.4)"}
            colorTo={isDark ? "rgba(236, 72, 153, 0.5)" : "rgba(147, 51, 234, 0.4)"}
          />

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                isDark 
                  ? 'bg-gradient-to-br from-nebula-purple/20 to-nebula-pink/20' 
                  : 'bg-gradient-to-br from-blue-100 to-purple-100'
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Shield className={`w-10 h-10 ${isDark ? 'text-nebula-purple' : 'text-blue-600'}`} />
            </motion.div>
            
            <motion.h1
              className={`text-2xl font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {t('admin.login.title')}
            </motion.h1>
            <motion.p
              className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {t('admin.login.subtitle')}
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Username Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <label className={`block text-sm mb-2 ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
                  {t('admin.login.username')}
                </label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-white/30' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      setError('')
                    }}
                    placeholder={t('admin.login.username_placeholder')}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-nebula-purple/50' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white'
                    } focus:outline-none`}
                  />
                </div>
              </motion.div>

              {/* Password Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className={`block text-sm mb-2 ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
                  {t('admin.login.password')}
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-white/30' : 'text-slate-400'
                  }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={t('admin.login.password_placeholder')}
                    className={`w-full pl-11 pr-12 py-3.5 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-nebula-purple/50' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white'
                    } focus:outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      isDark ? 'text-white/30 hover:text-white/50' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-red-400 text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl text-white font-medium relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? 'bg-gradient-to-r from-nebula-purple to-nebula-pink' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.99 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  {isLoading ? t('admin.login.logging_in') : t('admin.login.login')}
                </span>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDark 
                    ? 'bg-gradient-to-r from-nebula-pink to-nebula-purple' 
                    : 'bg-gradient-to-r from-purple-500 to-blue-500'
                }`} />
              </motion.button>
            </div>
          </form>

          {/* Hint */}
          <motion.p
            className={`text-center text-xs mt-6 ${isDark ? 'text-white/20' : 'text-slate-400'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {t('admin.login.hint')}
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  )
}
