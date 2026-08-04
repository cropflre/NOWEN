import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './hooks/useTheme'
import { installDevelopmentApiOverrides } from './lib/dev-api-overrides'
import { setupGlobalErrorHandlers } from './lib/error-handling'
import './index.css'
import './lib/i18n' // 激活 i18n 多语言支持

installDevelopmentApiOverrides({
  disableDockerMonitor:
    import.meta.env.DEV && import.meta.env.VITE_DOCKER_MONITOR_ENABLED === 'false',
})

// 设置全局错误监听
setupGlobalErrorHandlers()

ReactDOM.createRoot(document.getElementById('root')!)?.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
