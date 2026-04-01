import { Router, Request, Response } from 'express'
import { queryAll, queryOne, run } from '../utils/index.js'
import { authMiddleware } from '../middleware/index.js'
import { validateBody, createNoteSchema, updateNoteSchema } from '../schemas.js'
import { generateId, markDirty } from '../db.js'

const router = Router()

// 获取所有灵感速记（按更新时间倒序）
router.get('/', (req: Request, res: Response) => {
  try {
    const notes = queryAll('SELECT * FROM quick_notes ORDER BY updatedAt DESC')
    res.json(notes)
  } catch (error) {
    console.error('获取灵感速记失败:', error)
    res.status(500).json({ error: '获取灵感速记失败' })
  }
})

// 创建灵感速记（需要认证）
router.post('/', authMiddleware, validateBody(createNoteSchema), (req: Request, res: Response) => {
  try {
    const { content } = req.body
    const id = generateId()
    const now = new Date().toISOString()

    run(
      'INSERT INTO quick_notes (id, content, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [id, content, now, now]
    )
    markDirty()

    const note = queryOne('SELECT * FROM quick_notes WHERE id = ?', [id])
    res.status(201).json(note)
  } catch (error) {
    console.error('创建灵感速记失败:', error)
    res.status(500).json({ error: '创建灵感速记失败' })
  }
})

// 更新灵感速记（需要认证）
router.patch('/:id', authMiddleware, validateBody(updateNoteSchema), (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { content } = req.body
    const now = new Date().toISOString()

    const existing = queryOne('SELECT * FROM quick_notes WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: '灵感速记不存在' })
    }

    run(
      'UPDATE quick_notes SET content = ?, updatedAt = ? WHERE id = ?',
      [content, now, id]
    )
    markDirty()

    const note = queryOne('SELECT * FROM quick_notes WHERE id = ?', [id])
    res.json(note)
  } catch (error) {
    console.error('更新灵感速记失败:', error)
    res.status(500).json({ error: '更新灵感速记失败' })
  }
})

// 删除灵感速记（需要认证）
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existing = queryOne('SELECT * FROM quick_notes WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: '灵感速记不存在' })
    }

    run('DELETE FROM quick_notes WHERE id = ?', [id])
    markDirty()

    res.json({ success: true })
  } catch (error) {
    console.error('删除灵感速记失败:', error)
    res.status(500).json({ error: '删除灵感速记失败' })
  }
})

export default router
