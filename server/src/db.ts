import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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
