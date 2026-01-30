import { useEffect, useState, createContext, useContext, useCallback, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

const ToastItem = forwardRef<HTMLDivElement, ToastItemProps>(({ toast, onRemove }, ref) => {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast, onRemove])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }

  const colors = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      icon: 'text-green-400',
      glow: 'shadow-green-500/20',
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: 'text-red-400',
      glow: 'shadow-red-500/20',
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'text-blue-400',
      glow: 'shadow-blue-500/20',
    },
  }

  const Icon = icons[toast.type]
  const colorScheme = colors[toast.type]

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ 
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 1
      }}
      className="pointer-events-auto"
    >
      <div
        className={cn(
          'relative flex items-center gap-3 px-4 py-3 rounded-xl',
          'backdrop-blur-xl border min-w-[280px] max-w-[400px]',
          'shadow-lg',
          colorScheme.bg,
          colorScheme.border,
          colorScheme.glow
        )}
      >
        {/* Glow Effect */}
        <div className={cn(
          'absolute inset-0 rounded-xl opacity-50 -z-10 blur-xl',
          colorScheme.bg
        )} />
        
        {/* Icon */}
        <div className={cn('flex-shrink-0', colorScheme.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        
        {/* Message */}
        <p className="flex-1 text-sm text-white/90 font-medium">
          {toast.message}
        </p>
        
        {/* Close Button */}
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress Bar */}
        {toast.duration && (
          <motion.div
            className={cn(
              'absolute bottom-0 left-0 h-0.5 rounded-full',
              toast.type === 'success' ? 'bg-green-400' :
              toast.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
            )}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          />
        )}
      </div>
    </motion.div>
  )
})

ToastItem.displayName = 'ToastItem'
