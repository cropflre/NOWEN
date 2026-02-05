import express from 'express'
import cors from 'cors'
import { initDatabase } from './db.js'
import { generalLimiter } from './middleware/index.js'
import {
  bookmarksRouter,
  categoriesRouter,
  adminRouter,
  settingsRouter,
  metadataRouter,
  quotesRouter,
  dataRouter,
  systemRouter,
} from './routes/index.js'

const app = express()

// ========== 环境配置 ==========
const NODE_ENV = process.env.NODE_ENV || 'development'
const isDev = NODE_ENV === 'development'
const PORT = parseInt(process.env.PORT || '3001', 10)

// 启动日志
console.log(`
========================================
  NOWEN Server
  Environment: ${NODE_ENV}
  Port: ${PORT}
  Debug Mode: ${isDev ? 'ON' : 'OFF'}
========================================
`)

// ========== 中间件配置 ==========

// CORS 配置 - 允许所有来源访问
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}))

// JSON 解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// 全局请求频率限制
app.use(generalLimiter)

// ========== 路由挂载 ==========
app.use('/api/bookmarks', bookmarksRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/admin', adminRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/metadata', metadataRouter)
app.use('/api/quotes', quotesRouter)
app.use('/api/system', systemRouter)
app.use('/api', dataRouter)  // /api/export, /api/import, /api/factory-reset

// ========== 启动服务 ==========
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Server running at http://0.0.0.0:${PORT}`)
    if (isDev) {
      console.log(`📝 API Docs: http://localhost:${PORT}/api`)
      console.log(`🔧 Dev Mode: Hot reload enabled`)
    }
  })
}).catch((err) => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})
