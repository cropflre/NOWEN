import { getDatabase, saveDatabase } from '../db.js'

// ========== 数据库辅助函数 ==========

// 查询多条记录
export function queryAll(sql: string, params: any[] = []) {
  const db = getDatabase()
  const stmt = db.prepare(sql)
  if (params.length > 0) {
    stmt.bind(params)
  }
  const results: any[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

// 查询单条记录
export function queryOne(sql: string, params: any[] = []) {
  const results = queryAll(sql, params)
  return results[0] || null
}

// 执行 SQL（增删改）
export function run(sql: string, params: any[] = []) {
  const db = getDatabase()
  db.run(sql, params)
  saveDatabase()
}

// 将布尔字段转换
export function booleanize(bookmark: any) {
  return {
    ...bookmark,
    isPinned: Boolean(bookmark.isPinned),
    isReadLater: Boolean(bookmark.isReadLater),
    isRead: Boolean(bookmark.isRead),
  }
}
