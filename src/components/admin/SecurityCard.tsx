import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  Zap,
  Info,
  User,
  Pencil
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { isDemoMode } from '../../lib/api'

interface SecurityCardProps {
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>
  onChangeUsername: (newUsername: string, password: string) => Promise<void>
  isChanging: boolean
  isChangingUsername: boolean
  success: boolean
  usernameSuccess: boolean
  error: string
  usernameError: string
  currentUsername: string
  onClearError: () => void
  onClearSuccess: () => void
  onClearUsernameError: () => void
  onClearUsernameSuccess: () => void
}

export function SecurityCard({
  onChangePassword,
  onChangeUsername,
  isChanging,
  isChangingUsername,
  success,
  usernameSuccess,
  error,
  usernameError,
  currentUsername,
  onClearError,
  onClearSuccess,
  onClearUsernameError,
  onClearUsernameSuccess,
}: SecurityCardProps) {
  const { t } = useTranslation()
  const isDemo = isDemoMode()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isUsernameExpanded, setIsUsernameExpanded] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [localError, setLocalError] = useState('')
  // 修改用户名
  const [newUsername, setNewUsername] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [showUsernamePwd, setShowUsernamePwd] = useState(false)
  const [localUsernameError, setLocalUsernameError] = useState('')

  // Password Strength Calculator
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: '' }
    
    let score = 0
    
    // Length check
    if (newPassword.length >= 6) score += 1
    if (newPassword.length >= 10) score += 1
    if (newPassword.length >= 14) score += 1
    
    // Character variety
    if (/[a-z]/.test(newPassword)) score += 1
    if (/[A-Z]/.test(newPassword)) score += 1
    if (/[0-9]/.test(newPassword)) score += 1
    if (/[^a-zA-Z0-9]/.test(newPassword)) score += 1
    
    // Normalize to 0-100
    const normalizedScore = Math.min((score / 7) * 100, 100)
    
    let label = ''
    let color = ''
    
    if (normalizedScore < 30) {
      label = t('admin.settings.security.strength_weak')
      color = 'from-red-500 to-red-600'
    } else if (normalizedScore < 60) {
      label = t('admin.settings.security.strength_medium')
      color = 'from-yellow-500 to-orange-500'
    } else if (normalizedScore < 80) {
      label = t('admin.settings.security.strength_strong')
      color = 'from-blue-500 to-cyan-500'
    } else {
      label = t('admin.settings.security.strength_very_strong')
      color = 'from-green-500 to-emerald-500'
    }
    
    return { score: normalizedScore, label, color }
  }, [newPassword, t])

  const handleSubmit = async () => {
    setLocalError('')
    onClearError()
    onClearSuccess()
    
    if (newPassword.length < 6) {
      setLocalError(t('admin.settings.security.min_length_error'))
      return
    }
    
    if (newPassword !== confirmPassword) {
      setLocalError(t('admin.settings.security.mismatch_error'))
      return
    }
    
    try {
      await onChangePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      // Error handled by parent
    }
  }

  const handleUsernameSubmit = async () => {
    setLocalUsernameError('')
    onClearUsernameError()
    onClearUsernameSuccess()
    
    if (newUsername.length < 2) {
      setLocalUsernameError(t('admin.settings.security.username_min_error'))
      return
    }
    
    if (!/^[a-zA-Z0-9_\-]+$/.test(newUsername)) {
      setLocalUsernameError(t('admin.settings.security.username_format_error'))
      return
    }
    
    if (newUsername === currentUsername) {
      setLocalUsernameError(t('admin.settings.security.username_same_error'))
      return
    }
    
    try {
      await onChangeUsername(newUsername, usernamePassword)
      setNewUsername('')
      setUsernamePassword('')
    } catch (err) {
      // Error handled by parent
    }
  }

  const displayUsernameError = usernameError || localUsernameError

  const displayError = error || localError

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative group"
    >
      {/* Card Container */}
      <div 
        className="relative overflow-hidden rounded-2xl backdrop-blur-xl"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {/* Animated Border Gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-transparent to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:block hidden" />
        
        {/* Header - Always Visible */}
        <div className="relative w-full p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <div className="absolute -inset-2 rounded-xl bg-purple-500/20 blur-xl opacity-50 -z-10 dark:block hidden" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('admin.settings.security.title')}</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.security.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Divider */}
          <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, var(--color-glass-border), transparent)' }} />

          {/* Demo Mode Warning */}
          {isDemo && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>演示模式下禁止修改 / Changes disabled in demo mode</span>
            </div>
          )}

          {/* ======== 修改用户名区域 ======== */}
          <div 
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--color-glass-border)' }}
          >
            <button
              onClick={() => setIsUsernameExpanded(!isUsernameExpanded)}
              className="relative w-full px-4 py-3 flex items-center justify-between text-left transition-colors duration-200 hover:opacity-80"
              style={{ background: 'var(--color-bg-tertiary)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('admin.settings.security.change_username')}
                  </span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-glass)', color: 'var(--color-text-muted)' }}>
                    {currentUsername}
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isUsernameExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </motion.div>
            </button>

            <AnimatePresence>
              {isUsernameExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                    {/* New Username */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        <Pencil className="w-4 h-4" />
                        {t('admin.settings.security.new_username')}
                      </label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={e => {
                          setNewUsername(e.target.value)
                          setLocalUsernameError('')
                          onClearUsernameError()
                        }}
                        disabled={isDemo}
                        placeholder={t('admin.settings.security.new_username_placeholder')}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--color-glass-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {t('admin.settings.security.username_hint')}
                      </p>
                    </div>

                    {/* Password for Verification */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        <Lock className="w-4 h-4" />
                        {t('admin.settings.security.verify_password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showUsernamePwd ? 'text' : 'password'}
                          value={usernamePassword}
                          onChange={e => {
                            setUsernamePassword(e.target.value)
                            setLocalUsernameError('')
                            onClearUsernameError()
                          }}
                          disabled={isDemo}
                          placeholder={t('admin.settings.security.verify_password_placeholder')}
                          className="w-full px-4 py-3 pr-12 rounded-xl focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-glass-border)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowUsernamePwd(!showUsernamePwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {showUsernamePwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Username Error */}
                    <AnimatePresence>
                      {displayUsernameError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                        >
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {displayUsernameError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Username Success */}
                    <AnimatePresence>
                      {usernameSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400"
                        >
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          {t('admin.settings.security.username_changed')}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Username */}
                    <motion.button
                      onClick={handleUsernameSubmit}
                      disabled={isDemo || isChangingUsername || !newUsername || !usernamePassword}
                      whileHover={{ scale: isChangingUsername ? 1 : 1.02 }}
                      whileTap={{ scale: isChangingUsername ? 1 : 0.98 }}
                      className={cn(
                        'relative w-full py-3 rounded-xl font-medium overflow-hidden',
                        'bg-gradient-to-r from-blue-600 to-cyan-600',
                        'text-white shadow-lg shadow-blue-500/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'transition-all duration-300'
                      )}
                    >
                      <span className="relative z-10">
                        {isChangingUsername ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            {t('admin.settings.security.username_changing')}
                          </span>
                        ) : t('admin.settings.security.confirm_change_username')}
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ======== 修改密码区域 ======== */}
          <div 
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--color-glass-border)' }}
          >
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative w-full px-4 py-3 flex items-center justify-between text-left transition-colors duration-200 hover:opacity-80"
              style={{ background: 'var(--color-bg-tertiary)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {t('admin.settings.security.change_password')}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </motion.div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <Lock className="w-4 h-4" />
                    {t('admin.settings.security.current_password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => {
                        setCurrentPassword(e.target.value)
                        setLocalError('')
                        onClearError()
                      }}
                      disabled={isDemo}
                      placeholder={t('admin.settings.security.current_placeholder')}
                      className="w-full px-4 py-3 pr-12 rounded-xl focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {showCurrentPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <Lock className="w-4 h-4" />
                    {t('admin.settings.security.new_password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => {
                        setNewPassword(e.target.value)
                        setLocalError('')
                        onClearError()
                      }}
                      disabled={isDemo}
                      placeholder={t('admin.settings.security.new_placeholder')}
                      className="w-full px-4 py-3 pr-12 rounded-xl focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {showNewPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('admin.settings.security.strength')}</span>
                        <div className="flex items-center gap-1.5">
                          <Zap className={cn(
                            'w-3.5 h-3.5 transition-colors',
                            passwordStrength.score >= 80 ? 'text-green-400' : ''
                          )} style={{ color: passwordStrength.score >= 80 ? undefined : 'var(--color-text-muted)' }} />
                          <span className={cn(
                            'text-xs font-medium',
                            passwordStrength.score < 30 ? 'text-red-400' :
                            passwordStrength.score < 60 ? 'text-yellow-400' :
                            passwordStrength.score < 80 ? 'text-blue-400' : 'text-green-400'
                          )}>
                            {passwordStrength.label}
                          </span>
                        </div>
                      </div>
                      
                      {/* Animated Progress Bar */}
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength.score}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={cn(
                            'h-full rounded-full bg-gradient-to-r',
                            passwordStrength.color
                          )}
                        >
                          {/* Shimmer Effect - Speed varies with strength */}
                          <motion.div
                            className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{
                              duration: Math.max(0.5, 2 - (passwordStrength.score / 50)),
                              repeat: Infinity,
                              ease: 'linear'
                            }}
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <Lock className="w-4 h-4" />
                    {t('admin.settings.security.confirm_password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value)
                        setLocalError('')
                        onClearError()
                      }}
                      disabled={isDemo}
                      placeholder={t('admin.settings.security.confirm_placeholder')}
                      className={cn(
                        'w-full px-4 py-3 pr-12 rounded-xl focus:outline-none transition-all duration-300',
                        confirmPassword && newPassword !== confirmPassword && 'border-red-500/50'
                      )}
                      style={{
                        background: 'var(--color-bg-tertiary)',
                        border: confirmPassword && newPassword !== confirmPassword 
                          ? '1px solid rgba(239, 68, 68, 0.5)' 
                          : '1px solid var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {showConfirmPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Match Indicator */}
                  {confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        'flex items-center gap-2 text-xs',
                        newPassword === confirmPassword ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {newPassword === confirmPassword ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          {t('admin.settings.security.password_match')}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          {t('admin.settings.security.password_mismatch')}
                        </>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {displayError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {displayError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Message */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400"
                    >
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      {t('admin.settings.security.changed')}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={isDemo || isChanging || !currentPassword || !newPassword || !confirmPassword}
                  whileHover={{ scale: isChanging ? 1 : 1.02 }}
                  whileTap={{ scale: isChanging ? 1 : 0.98 }}
                  className={cn(
                    'relative w-full py-3 rounded-xl font-medium overflow-hidden',
                    'bg-gradient-to-r from-purple-600 to-pink-600',
                    'text-white shadow-lg shadow-purple-500/20',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all duration-300'
                  )}
                >
                  <span className="relative z-10">
                    {isChanging ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        {t('admin.settings.security.changing')}
                      </span>
                    ) : t('admin.settings.security.confirm_change_password')}
                  </span>
                </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
