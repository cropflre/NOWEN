import { Router } from 'express'
import { generateId } from '../db.js'
import { queryAll, queryOne, run } from '../utils/index.js'
import { authMiddleware } from '../middleware/index.js'
import { validateBody, updateQuotesSchema } from '../schemas.js'

const router = Router()

// 获取所有名言（包含设置）
router.get('/', (req, res) => {
  try {
    const quotes = queryAll('SELECT * FROM quotes ORDER BY orderIndex ASC')
    const useDefaultSetting = queryOne('SELECT value FROM settings WHERE key = ?', ['useDefaultQuotes'])
    const useDefaultQuotes = useDefaultSetting?.value !== 'false'
    
    res.json({
      quotes: quotes.map((q: any) => q.content),
      useDefaultQuotes
    })
  } catch (error) {
    console.error('获取名言失败:', error)
    res.status(500).json({ error: '获取名言失败' })
  }
})

// 更新名言列表（需要认证）
router.put('/', authMiddleware, validateBody(updateQuotesSchema), (req, res) => {
  try {
    const { quotes, useDefaultQuotes } = req.body
    
    // 更新 useDefaultQuotes 设置
    if (typeof useDefaultQuotes === 'boolean') {
      run(
        'INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)',
        ['useDefaultQuotes', useDefaultQuotes.toString(), new Date().toISOString()]
      )
    }
    
    // 清空现有名言
    run('DELETE FROM quotes')
    
    // 插入新名言
    const now = new Date().toISOString()
    quotes.forEach((content: string, index: number) => {
      const id = generateId()
      run(
        'INSERT INTO quotes (id, content, orderIndex, createdAt) VALUES (?, ?, ?, ?)',
        [id, content, index, now]
      )
    })
    
    res.json({ success: true, count: quotes.length })
  } catch (error) {
    console.error('更新名言失败:', error)
    res.status(500).json({ error: '更新名言失败' })
  }
})

export default router
