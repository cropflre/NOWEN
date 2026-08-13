import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './hooks/useTheme'
import { installDevelopmentApiOverrides } from './lib/dev-api-overrides'
import { setupGlobalErrorHandlers } from './lib/error-handling'
import './index.css'
import './styles/homepage-performance.css'
import './lib/i18n' // 激活 i18n 多语言支持

installDevelopmentApiOverrides({
  disableDockerMonitor:
    import.meta.env.DEV && import.meta.env.VITE_DOCKER_MONITOR_ENABLED === 'false',
})

// 设置全局错误监听
setupGlobalErrorHandlers()

const application = (
  <ErrorBoundary>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ErrorBoundary>
)

// StrictMode 在开发环境会有意重复挂载组件和执行 Effect。对于包含大量实时
// 监控卡片、拖拽节点和动态背景的性能分析页，这会放大布局日志并干扰真实结果。
// 需要检查副作用清理时可显式设置 VITE_REACT_STRICT_MODE=true 重新开启。
const rootContent = import.meta.env.VITE_REACT_STRICT_MODE === 'true'
  ? <React.StrictMode>{application}</React.StrictMode>
  : application

ReactDOM.createRoot(document.getElementById('root')!)?.render(rootContent)
