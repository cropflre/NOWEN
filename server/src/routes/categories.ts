import { Router } from 'express'
import { generateId } from '../db.js'
import { queryAll, queryOne, run } from '../utils/index.js'
import {
  validateBody,
  validateParams,
  idParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../schemas.js'

const router = Router()

// 获取所有分类
router.get('/', (req, res) => {
  try {
    const categories = queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')
    res.json(categories)
  } catch (error) {
    console.error('获取分类失败:', error)
    res.status(500).json({ error: '获取分类失败' })
  }
})

// 创建分类
router.post('/', validateBody(createCategorySchema), (req, res) => {
  try {
    const { name, icon, color } = req.body
    
    const maxOrder = queryOne('SELECT MAX(orderIndex) as max FROM categories')
    const newOrderIndex = (maxOrder?.max ?? -1) + 1
    
    const id = generateId()
    
    run(`
      INSERT INTO categories (id, name, icon, color, orderIndex)
      VALUES (?, ?, ?, ?, ?)
    `, [id, name, icon ?? null, color ?? null, newOrderIndex])
    
    const category = queryOne('SELECT * FROM categories WHERE id = ?', [id])
    res.status(201).json(category)
  } catch (error) {
    console.error('创建分类失败:', error)
    res.status(500).json({ error: '创建分类失败' })
  }
})

// 重排序分类（必须在 /:id 之前定义）
router.patch('/reorder', (req, res) => {
  try {
    const { items } = req.body
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: '无效的请求数据' })
    }
    
    for (const item of items) {
      if (item.id && typeof item.orderIndex === 'number') {
        run('UPDATE categories SET orderIndex = ? WHERE id = ?', [item.orderIndex, item.id])
      }
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('重排序分类失败:', error)
    res.status(500).json({ error: '重排序分类失败' })
  }
})

// 更新分类
router.patch('/:id', validateParams(idParamSchema), validateBody(updateCategorySchema), (req, res) => {
  try {
    const { id } = req.params
    const { name, icon, color, orderIndex } = req.body
    
    const current = queryOne('SELECT * FROM categories WHERE id = ?', [id])
    if (!current) {
      return res.status(404).json({ error: '分类不存在' })
    }
    
    const merged = {
      name: name ?? current.name,
      icon: icon ?? current.icon,
      color: color ?? current.color,
      orderIndex: orderIndex ?? current.orderIndex,
    }
    
    run(`
      UPDATE categories SET name = ?, icon = ?, color = ?, orderIndex = ?
      WHERE id = ?
    `, [merged.name, merged.icon, merged.color, merged.orderIndex, id])
    
    const category = queryOne('SELECT * FROM categories WHERE id = ?', [id])
    res.json(category)
  } catch (error) {
    console.error('更新分类失败:', error)
    res.status(500).json({ error: '更新分类失败' })
  }
})

// 删除分类
router.delete('/:id', validateParams(idParamSchema), (req, res) => {
  try {
    const { id } = req.params
    
    // 将该分类下的书签设为未分类
    run('UPDATE bookmarks SET category = NULL WHERE category = ?', [id])
    
    // 删除分类
    run('DELETE FROM categories WHERE id = ?', [id])
    
    res.status(204).send()
  } catch (error) {
    console.error('删除分类失败:', error)
    res.status(500).json({ error: '删除分类失败' })
  }
})

export default router
