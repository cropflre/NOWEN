import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { setupGlobalErrorHandlers } from './lib/error-handling'
import './index.css'

// 设置全局错误监听
setupGlobalErrorHandlers()

ReactDOM.createRoot(document.getElementById('root')!)?.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
