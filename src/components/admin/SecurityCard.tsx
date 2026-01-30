import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  Zap
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface SecurityCardProps {
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>
  isChanging: boolean
  success: boolean
  error: string
  onClearError: () => void
  onClearSuccess: () => void
}

export function SecurityCard({
  onChangePassword,
  isChanging,
  success,
  error,
  onClearError,
  onClearSuccess,
}: SecurityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [localError, setLocalError] = useState('')

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
      label = '弱'
      color = 'from-red-500 to-red-600'
    } else if (normalizedScore < 60) {
      label = '中等'
      color = 'from-yellow-500 to-orange-500'
    } else if (normalizedScore < 80) {
      label = '较强'
      color = 'from-blue-500 to-cyan-500'
    } else {
      label = '非常强'
      color = 'from-green-500 to-emerald-500'
    }
    
    return { score: normalizedScore, label, color }
  }, [newPassword])

  const handleSubmit = async () => {
    setLocalError('')
    onClearError()
    onClearSuccess()
    
    if (newPassword.length < 6) {
      setLocalError('新密码长度至少 6 位')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setLocalError('两次输入的新密码不一致')
      return
    }
    
    try {
      await onChangePassword(currentPassword, newPassword)
      // Clear form on success
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      // Error handled by parent
    }
  }

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
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative w-full p-6 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <div className="absolute -inset-2 rounded-xl bg-purple-500/20 blur-xl opacity-50 -z-10 dark:block hidden" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>安全设置</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>管理您的账户密码</p>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-bg-tertiary)' }}
          >
            <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          </motion.div>
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-5">
                {/* Divider */}
                <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, var(--color-glass-border), transparent)' }} />

                {/* Current Password */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <Lock className="w-4 h-4" />
                    当前密码
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
                      placeholder="请输入当前密码"
                      className="w-full px-4 py-3 pr-12 rounded-xl focus:outline-none transition-all duration-300"
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
                    新密码
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
                      placeholder="请输入新密码（至少6位）"
                      className="w-full px-4 py-3 pr-12 rounded-xl focus:outline-none transition-all duration-300"
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
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>密码强度</span>
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
                    确认新密码
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
                      placeholder="请再次输入新密码"
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
                          密码匹配
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          密码不匹配
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
                      密码修改成功
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={isChanging || !currentPassword || !newPassword || !confirmPassword}
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
                        修改中...
                      </span>
                    ) : '确认修改'}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
