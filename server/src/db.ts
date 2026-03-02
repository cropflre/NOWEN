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

export async function initDatabase() {
  const SQL = await initSqlJs()
  
  // 检查数据库文件是否存在
  const isNewDatabase = !fs.existsSync(dbPath)
  
  // 加载已有数据库或创建新的
  if (!isNewDatabase) {
    console.log('📖 Loading existing database...')
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    console.log('🆕 Creating new database...')
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
  }
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
