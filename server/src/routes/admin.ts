import { Router, Request, Response } from 'express'
import { hashPassword, verifyPassword } from '../db.js'
import { queryOne, run } from '../utils/index.js'
import { 
  authMiddleware, 
  authLimiter, 
  saveTokenToDb, 
  deleteTokenFromDb, 
  generateToken 
} from '../middleware/index.js'
import { validateBody, loginSchema, changePasswordSchema, changeUsernameSchema } from '../schemas.js'

const router = Router()

// 登录接口
router.post('/login', authLimiter, validateBody(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body
    
    const admin = queryOne('SELECT * FROM admins WHERE username = ?', [username])
    
    if (!admin) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    const isValidPassword = await verifyPassword(password, admin.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    // 生成 Token（7天有效期，活跃使用时自动续期）
    const token = generateToken()
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天有效期
    
    // 存储 Token 到数据库
    saveTokenToDb(token, admin.id, admin.username, expiresAt)
    
    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
      },
      requirePasswordChange: admin.isDefaultPassword === 1
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ error: '登录失败' })
  }
})

// 修改密码
router.post('/change-password', authMiddleware, validateBody(changePasswordSchema), async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = (req as any).user
    
    const admin = queryOne('SELECT * FROM admins WHERE username = ?', [user.username])
    
    if (!admin) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    const isValidPassword = await verifyPassword(currentPassword, admin.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: '当前密码错误' })
    }
    
    const newHash = await hashPassword(newPassword)
    const now = new Date().toISOString()
    
    // 修改密码同时清除默认密码标记
    run('UPDATE admins SET password = ?, isDefaultPassword = 0, updatedAt = ? WHERE username = ?', [newHash, now, user.username])
    
    res.json({ success: true, message: '密码修改成功' })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({ error: '修改密码失败' })
  }
})

// 修改用户名
router.post('/change-username', authMiddleware, validateBody(changeUsernameSchema), async (req: Request, res: Response) => {
  try {
    const { newUsername, password } = req.body
    const user = (req as any).user
    
    const admin = queryOne('SELECT * FROM admins WHERE username = ?', [user.username])
    
    if (!admin) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    // 验证密码
    const isValidPassword = await verifyPassword(password, admin.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: '密码错误' })
    }
    
    // 检查新用户名是否已存在
    const existing = queryOne('SELECT id FROM admins WHERE username = ? AND id != ?', [newUsername, admin.id])
    if (existing) {
      return res.status(409).json({ error: '用户名已被占用' })
    }
    
    const now = new Date().toISOString()
    
    // 更新用户名
    run('UPDATE admins SET username = ?, updatedAt = ? WHERE id = ?', [newUsername, now, admin.id])
    
    // 更新 tokens 表中的用户名
    run('UPDATE tokens SET username = ? WHERE userId = ?', [newUsername, admin.id])
    
    res.json({ success: true, message: '用户名修改成功', username: newUsername })
  } catch (error) {
    console.error('修改用户名失败:', error)
    res.status(500).json({ error: '修改用户名失败' })
  }
})

// 验证 Token 有效性
router.get('/verify', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user
  res.json({ valid: true, user })
})

// 退出登录
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    deleteTokenFromDb(token)
  }
  res.json({ success: true })
})

export default router
