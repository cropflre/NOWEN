import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import bcrypt from 'bcryptjs';

// 数据库路径：优先使用环境变量，否则使用 /app/server/data（Docker）或当前目录下的 data
const getDbPath = () => {
  // 优先使用环境变量指定的路径
  if (process.env.DB_PATH) {
    return process.env.DB_PATH
  }
  
  // Docker 环境下使用绝对路径
  if (process.env.NODE_ENV === 'production') {
    return '/app/server/data/zen-garden.db'
  }
  
  // 开发环境使用相对路径
  return path.join(process.cwd(), 'server', 'data', 'zen-garden.db')
}

const dbPath = getDbPath()
console.log(`📂 Database path: ${dbPath}`)

/** 获取数据库文件路径 */
export function getDatabasePath(): string {
  return dbPath
}

// bcrypt 加密轮数
const BCRYPT_ROUNDS = 12

// 确保目录存在
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let db: SqlJsDatabase
let autoSaveTimer: ReturnType<typeof setInterval> | null = null
let isDirty = false  // 标记内存数据是否有未保存的变更

export async function initDatabase() {
  const SQL = await initSqlJs()
  
  // 安全备份路径（与 start.sh 中的 SAFE_BACKUP_DIR 保持一致）
  const safeBackupDir = process.env.NODE_ENV === 'production' ? '/app/.data-backup' : path.join(process.cwd(), '.data-backup')
  const safeDbFile = path.join(safeBackupDir, 'zen-garden.db.safe')
  
  // 检查数据库文件是否存在
  let isNewDatabase = !fs.existsSync(dbPath)
  
  // 🔑 如果主数据库不存在，尝试从安全备份恢复（Node.js 层面的二次保障）
  if (isNewDatabase && fs.existsSync(safeDbFile)) {
    console.log('🔄 Main database missing, attempting recovery from safe backup...')
    try {
      fs.copyFileSync(safeDbFile, dbPath)
      isNewDatabase = false
      console.log('✅ Database recovered from safe backup (Node.js layer)')
    } catch (err) {
      console.error('❌ Safe backup recovery failed:', err)
    }
  }
  
  // 加载已有数据库或创建新的
  if (!isNewDatabase) {
    console.log('📖 Loading existing database...')
    const buffer = fs.readFileSync(dbPath)
    
    // 🔑 完整性校验：检查 SQLite 文件头魔数
    if (buffer.length < 16 || buffer.toString('utf8', 0, 15) !== 'SQLite format 3') {
      console.error('❌ Database file corrupted (invalid SQLite header)!')
      // 尝试从安全备份恢复
      if (fs.existsSync(safeDbFile)) {
        console.log('🔄 Attempting recovery from safe backup...')
        const safeBuffer = fs.readFileSync(safeDbFile)
        if (safeBuffer.length >= 16 && safeBuffer.toString('utf8', 0, 15) === 'SQLite format 3') {
          fs.copyFileSync(safeDbFile, dbPath)
          db = new SQL.Database(safeBuffer)
          console.log('✅ Recovered from safe backup after corruption')
        } else {
          console.log('⚠️ Safe backup also corrupted, creating new database')
          db = new SQL.Database()
          isNewDatabase = true
        }
      } else {
        console.log('⚠️ No safe backup available, creating new database')
        db = new SQL.Database()
        isNewDatabase = true
      }
    } else {
      db = new SQL.Database(buffer)
    }
  } else {
    console.log('🆕 Creating new database...')
    console.log('')
    console.log('╔═══════════════════════════════════════════════════════╗')
    console.log('║  ⚠️  首次运行 / First Run Detected                  ║')
    console.log('║                                                       ║')
    console.log('║  正在创建全新数据库。如果这是更新后的首次启动且       ║')
    console.log('║  你之前有数据，说明数据卷未正确挂载！                 ║')
    console.log('║                                                       ║')
    console.log('║  Creating new database. If you had existing data      ║')
    console.log('║  before this update, your volume is NOT mounted!      ║')
    console.log('║                                                       ║')
    console.log('║  请检查 docker-compose.yml 中的 volumes 配置          ║')
    console.log('║  Check volumes config in docker-compose.yml           ║')
    console.log('╚═══════════════════════════════════════════════════════╝')
    console.log('')
    db = new SQL.Database()
  }
  
  // 初始化表
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      favicon TEXT,
      ogImage TEXT,
      icon TEXT,
      category TEXT,
      tags TEXT,
      orderIndex INTEGER DEFAULT 0,
      isPinned INTEGER DEFAULT 0,
      isReadLater INTEGER DEFAULT 0,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // 数据库迁移：添加 icon 字段（如果不存在）
  try {
    db.run('ALTER TABLE bookmarks ADD COLUMN icon TEXT')
  } catch (e) {
    // 字段已存在，忽略错误
  }
  
  // 数据库迁移：添加 iconUrl 字段（如果不存在）
  try {
    db.run('ALTER TABLE bookmarks ADD COLUMN iconUrl TEXT')
  } catch (e) {
    // 字段已存在，忽略错误
  }

  // 数据库迁移：添加 internalUrl 字段（如果不存在）
  try {
    db.run('ALTER TABLE bookmarks ADD COLUMN internalUrl TEXT')
  } catch (e) {
    // 字段已存在，忽略错误
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      orderIndex INTEGER DEFAULT 0
    )
  `)
  
  // 管理员表
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      isDefaultPassword INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // 站点设置表
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 名言表
  db.run(`
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      orderIndex INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Token 持久化表
  db.run(`
    CREATE TABLE IF NOT EXISTS tokens (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      username TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 访问统计表
  db.run(`
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      bookmarkId TEXT NOT NULL,
      visitedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      ip TEXT,
      userAgent TEXT,
      referer TEXT
    )
  `)

  // 为 visits 表创建索引以提高查询性能
  db.run(`CREATE INDEX IF NOT EXISTS idx_visits_bookmarkId ON visits(bookmarkId)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_visits_visitedAt ON visits(visitedAt)`)

  // 系统日志表
  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      level TEXT NOT NULL DEFAULT 'info',
      type TEXT NOT NULL DEFAULT 'operation',
      message TEXT NOT NULL,
      detail TEXT,
      method TEXT,
      path TEXT,
      statusCode INTEGER,
      ip TEXT,
      userAgent TEXT,
      username TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_createdAt ON logs(createdAt)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type)`)

  // 数据库迁移：为 bookmarks 表添加 visitCount 字段
  try {
    db.run('ALTER TABLE bookmarks ADD COLUMN visitCount INTEGER DEFAULT 0')
  } catch (e) {
    // 字段已存在，忽略错误
  }

  // 清理过期的 Token
  db.run('DELETE FROM tokens WHERE expiresAt < ?', [Date.now()])
  
  // 只在新数据库时初始化默认数据
  if (isNewDatabase) {
    console.log('📝 Initializing default data...')
    
    // 初始化默认设置
    const defaultSettings = [
      { key: 'siteTitle', value: 'NOWEN' },
      { key: 'siteFavicon', value: '' },
      { key: 'useDefaultQuotes', value: 'true' },
    ]
    
    for (const setting of defaultSettings) {
      db.run(
        `INSERT OR IGNORE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)`,
        [setting.key, setting.value, new Date().toISOString()]
      )
    }
    
    // 初始化默认分类
    const defaultCategories = [
      { id: 'dev', name: '开发', icon: 'code', color: '#667eea', orderIndex: 0 },
      { id: 'productivity', name: '效率', icon: 'zap', color: '#f093fb', orderIndex: 1 },
      { id: 'design', name: '设计', icon: 'palette', color: '#f5576c', orderIndex: 2 },
      { id: 'reading', name: '阅读', icon: 'book', color: '#43e97b', orderIndex: 3 },
      { id: 'media', name: '媒体', icon: 'play', color: '#fa709a', orderIndex: 4 },
    ]
    
    for (const cat of defaultCategories) {
      db.run(
        `INSERT OR IGNORE INTO categories (id, name, icon, color, orderIndex) VALUES (?, ?, ?, ?, ?)`,
        [cat.id, cat.name, cat.icon, cat.color, cat.orderIndex]
      )
    }
    
    // 初始化默认管理员（密码: admin123）
    const defaultPassword = await hashPassword('admin123')
    db.run(
      `INSERT OR IGNORE INTO admins (id, username, password, isDefaultPassword, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin_default', 'admin', defaultPassword, 1, new Date().toISOString(), new Date().toISOString()]
    )
    
    console.log('✅ Default data initialized')
  } else {
    // 已有数据库，检查是否需要补充必要的默认设置（不覆盖已有数据）
    const defaultSettings = [
      { key: 'siteTitle', value: 'NOWEN' },
      { key: 'siteFavicon', value: '' },
      { key: 'useDefaultQuotes', value: 'true' },
    ]
    
    for (const setting of defaultSettings) {
      db.run(
        `INSERT OR IGNORE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)`,
        [setting.key, setting.value, new Date().toISOString()]
      )
    }
    
    // 确保至少有一个管理员账户
    const existingAdmin = db.exec('SELECT COUNT(*) as count FROM admins')
    if (existingAdmin.length === 0 || existingAdmin[0].values[0][0] === 0) {
      console.log('⚠️ No admin found, creating default admin...')
      const defaultPassword = await hashPassword('admin123')
      db.run(
        `INSERT OR IGNORE INTO admins (id, username, password, isDefaultPassword, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
        ['admin_default', 'admin', defaultPassword, 1, new Date().toISOString(), new Date().toISOString()]
      )
    }
  }
  
  saveDatabase()
  
  // 🔑 打印数据统计，帮助用户判断数据是否正常
  try {
    const bookmarkCount = db.exec('SELECT COUNT(*) FROM bookmarks')
    const categoryCount = db.exec('SELECT COUNT(*) FROM categories')
    const quoteCount = db.exec('SELECT COUNT(*) FROM quotes')
    const bCount = bookmarkCount[0]?.values[0]?.[0] ?? 0
    const cCount = categoryCount[0]?.values[0]?.[0] ?? 0
    const qCount = quoteCount[0]?.values[0]?.[0] ?? 0
    console.log(`📊 Data loaded: ${bCount} bookmarks, ${cCount} categories, ${qCount} quotes`)
    if (Number(bCount) === 0 && !isNewDatabase) {
      console.log('⚠️  WARNING: 0 bookmarks in existing database — data may have been lost!')
    }
  } catch {
    // 统计失败不影响启动
  }
  
  // 🔑 启动定时自动保存（每 30 秒检查一次，有变更才写盘）
  startAutoSave()
  
  // 🔑 注册进程退出时保存数据库
  registerShutdownHooks()
  
  return db
}

export function getDatabase() {
  return db
}

export function saveDatabase() {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
    isDirty = false
    
    // 🔑 同步到安全备份位置（静默失败，不影响主流程）
    try {
      const safeBackupDir = process.env.NODE_ENV === 'production' ? '/app/.data-backup' : path.join(process.cwd(), '.data-backup')
      const safeDbFile = path.join(safeBackupDir, 'zen-garden.db.safe')
      if (!fs.existsSync(safeBackupDir)) {
        fs.mkdirSync(safeBackupDir, { recursive: true })
      }
      fs.writeFileSync(safeDbFile, buffer)
    } catch {
      // 安全备份失败不影响主流程
    }
  }
}

/** 标记数据已变更，需要保存。在每次写操作后调用 */
export function markDirty() {
  isDirty = true
}

/** 启动定时自动保存（每 30 秒），防止意外丢失数据 */
function startAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
  autoSaveTimer = setInterval(() => {
    if (isDirty && db) {
      try {
        saveDatabase()
        console.log('💾 Auto-saved database')
      } catch (err) {
        console.error('❌ Auto-save failed:', err)
      }
    }
  }, 30000) // 每 30 秒
}

/** 注册进程退出钩子，确保退出前保存数据 */
function registerShutdownHooks() {
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}, saving database before exit...`)
    try {
      if (db) {
        saveDatabase()
        console.log('✅ Database saved successfully')
      }
    } catch (err) {
      console.error('❌ Failed to save database on shutdown:', err)
    }
    process.exit(0)
  }

  // 只注册一次
  process.once('SIGINT', () => gracefulShutdown('SIGINT'))
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'))
  
  // 未捕获的异常也尝试保存
  process.once('uncaughtException', (err) => {
    console.error('💥 Uncaught exception:', err)
    try {
      if (db) {
        saveDatabase()
        console.log('✅ Emergency database save completed')
      }
    } catch (saveErr) {
      console.error('❌ Emergency save failed:', saveErr)
    }
    process.exit(1)
  })
}

// 生成唯一 ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

// 密码哈希 (使用 bcrypt)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

// 验证密码 (使用 bcrypt)
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // 兼容旧的 SHA256 哈希格式
  if (hash.length === 64 && /^[a-f0-9]+$/i.test(hash)) {
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex')
    return sha256Hash === hash
  }
  // 使用 bcrypt 验证
  return bcrypt.compare(password, hash)
}
