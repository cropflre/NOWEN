import { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * React 错误边界组件
 * 捕获子组件树中的 JavaScript 错误，记录错误并显示备用 UI
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({ errorInfo })
    
    // 调用自定义错误处理器
    this.props.onError?.(error, errorInfo)
    
    // 可以在这里添加错误上报逻辑
    // reportError(error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
          </div>

          <motion.div
            className="relative w-full max-w-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]">
              {/* Icon */}
              <motion.div
                className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </motion.div>

              {/* Title */}
              <h1 className="text-2xl font-medium text-white mb-3">
                哎呀，出错了
              </h1>
              <p className="text-white/50 mb-6 text-sm leading-relaxed">
                应用程序遇到了意外错误。<br />
                请尝试刷新页面或返回首页。
              </p>

              {/* Error Details (Collapsible) */}
              {this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-white/40 hover:text-white/60 text-sm flex items-center gap-2 justify-center">
                    <Bug className="w-4 h-4" />
                    查看错误详情
                  </summary>
                  <div className="mt-3 p-4 rounded-xl bg-black/30 border border-white/5 overflow-auto max-h-40">
                    <p className="text-red-400 text-xs font-mono break-all">
                      {this.state.error.message}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-white/30 text-xs whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack?.slice(0, 500)}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={this.handleReload}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-nebula-purple to-nebula-pink text-white text-sm font-medium flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className="w-4 h-4" />
                  刷新页面
                </motion.button>
                <motion.button
                  onClick={this.handleGoHome}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium flex items-center gap-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Home className="w-4 h-4" />
                  返回首页
                </motion.button>
              </div>

              {/* Retry Button */}
              <button
                onClick={this.handleReset}
                className="mt-4 text-white/30 hover:text-white/50 text-xs transition-colors"
              >
                或者尝试重新加载组件
              </button>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 轻量级错误边界 - 用于局部组件
 */
interface MinimalErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface MinimalErrorBoundaryState {
  hasError: boolean
}

export class MinimalErrorBoundary extends Component<MinimalErrorBoundaryProps, MinimalErrorBoundaryState> {
  public state: MinimalErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(): Partial<MinimalErrorBoundaryState> {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MinimalErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-red-400 text-sm">组件加载失败</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-xs text-white/40 hover:text-white/60"
          >
            点击重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
