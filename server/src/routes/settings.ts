import { Router, Request, Response } from 'express'
import { queryAll, queryOne, run } from '../utils/index.js'
import { authMiddleware } from '../middleware/index.js'
import { validateBody, updateSettingsSchema } from '../schemas.js'

const router = Router()

// 获取站点设置
router.get('/', (req, res) => {
  try {
    const settings = queryAll('SELECT * FROM settings')
    const result: Record<string, string> = {}
    settings.forEach((s: any) => {
      result[s.key] = s.value
    })
    res.json(result)
  } catch (error) {
    console.error('获取设置失败:', error)
    res.status(500).json({ error: '获取设置失败' })
  }
})

// 更新站点设置（需要认证）
router.patch('/', authMiddleware, validateBody(updateSettingsSchema), (req: Request, res: Response) => {
  try {
    const updates = req.body
    const now = new Date().toISOString()
    
    for (const [key, value] of Object.entries(updates)) {
      const existing = queryOne('SELECT * FROM settings WHERE key = ?', [key])
      if (existing) {
        run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [value, now, key])
      } else {
        run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', [key, value, now])
      }
    }
    
    // 返回更新后的所有设置
    const settings = queryAll('SELECT * FROM settings')
    const result: Record<string, string> = {}
    settings.forEach((s: any) => {
      result[s.key] = s.value
    })
    res.json(result)
  } catch (error) {
    console.error('更新设置失败:', error)
    res.status(500).json({ error: '更新设置失败' })
  }
})

export default router
