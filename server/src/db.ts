import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'data', 'zen-garden.db')

// 确保目录存在
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let db: SqlJsDatabase

export async function initDatabase() {
  const SQL = await initSqlJs()
  
  // 加载已有数据库或创建新的
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
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
  
  // 初始化默认设置
  const defaultSettings = [
    { key: 'siteTitle', value: 'Nebula Portal' },
    { key: 'siteFavicon', value: '' },
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
  const defaultPassword = hashPassword('admin123')
  db.run(
    `INSERT OR IGNORE INTO admins (id, username, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
    ['admin_default', 'admin', defaultPassword, new Date().toISOString(), new Date().toISOString()]
  )
  
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

// 密码哈希
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// 验证密码
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}
