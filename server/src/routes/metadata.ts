import { Router } from 'express'
import { parseMetadata } from '../services/metadata.js'
import { metadataLimiter } from '../middleware/index.js'
import { validateBody, metadataSchema } from '../schemas.js'

const router = Router()

// 元数据抓取
router.post('/', metadataLimiter, validateBody(metadataSchema), async (req, res) => {
  try {
    const { url, lang } = req.body
    
    const metadata = await parseMetadata(url, lang)
    res.json(metadata)
  } catch (error) {
    console.error('抓取元数据失败:', error)
    res.status(500).json({ 
      error: '抓取失败',
      title: '',
      description: '',
      favicon: '',
    })
  }
})

export default router
