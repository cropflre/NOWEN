import { Request, Response, NextFunction } from 'express'
import { getDatabase, saveDatabase, generateId } from '../db.js'

// ========== Token 管理函数 (持久化到数据库) ==========

export function getTokenFromDb(token: string): { userId: string; username: string; expiresAt: number } | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT userId, username, expiresAt FROM tokens WHERE token = ?')
  stmt.bind([token])
  if (stmt.step()) {
    const result = stmt.getAsObject() as { userId: string; username: string; expiresAt: number }
    stmt.free()
    return result
  }
  stmt.free()
  return null
}

export function saveTokenToDb(token: string, userId: string, username: string, expiresAt: number): void {
  const db = getDatabase()
  db.run(
    'INSERT INTO tokens (token, userId, username, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)',
    [token, userId, username, expiresAt, new Date().toISOString()]
  )
  saveDatabase()
}

export function deleteTokenFromDb(token: string): void {
  const db = getDatabase()
  db.run('DELETE FROM tokens WHERE token = ?', [token])
  saveDatabase()
}

export function cleanExpiredTokens(): void {
  const db = getDatabase()
  db.run('DELETE FROM tokens WHERE expiresAt < ?', [Date.now()])
  saveDatabase()
}

// 生成新 Token
export function generateToken(): string {
  return generateId() + generateId()
}

// ========== 认证中间件 ==========

// Token 验证中间件（必须登录）
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' })
  }
  
  const token = authHeader.substring(7)
  const tokenData = getTokenFromDb(token)
  
  if (!tokenData) {
    return res.status(401).json({ error: '无效的 Token' })
  }
  
  if (Date.now() > tokenData.expiresAt) {
    deleteTokenFromDb(token)
    return res.status(401).json({ error: 'Token 已过期' })
  }
  
  // 将用户信息附加到请求对象
  ;(req as any).user = { id: tokenData.userId, username: tokenData.username }
  next()
}

// 可选的认证中间件（不强制要求登录）
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const tokenData = getTokenFromDb(token)
    
    if (tokenData && Date.now() <= tokenData.expiresAt) {
      ;(req as any).user = { id: tokenData.userId, username: tokenData.username }
    }
  }
  
  next()
}

// 定期清理过期 Token (每小时)
setInterval(cleanExpiredTokens, 60 * 60 * 1000)
