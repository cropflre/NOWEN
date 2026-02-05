import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { setupGlobalErrorHandlers } from './lib/error-handling'
import './index.css'
import './lib/i18n' // 激活 i18n 多语言支持

// 设置全局错误监听
setupGlobalErrorHandlers()

ReactDOM.createRoot(document.getElementById('root')!)?.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
