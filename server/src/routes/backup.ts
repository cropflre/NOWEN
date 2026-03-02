import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/index.js'
import {
  testConnection,
  uploadBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  getBackupConfig,
  saveBackupConfig,
  collectBackupData,
  startAutoBackup,
  stopAutoBackup,
  getAutoBackupStatus,
  WebDAVConfig,
} from '../services/backup.js'

const router = Router()

// ========== 本地备份（方案二） ==========

// 下载本地备份文件
router.get('/local/download', authMiddleware, (req: Request, res: Response) => {
  try {
    const data = collectBackupData('manual')
    const content = JSON.stringify(data, null, 2)
    const filename = `nowen-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(content)
  } catch (err: any) {
    console.error('本地备份下载失败:', err)
    res.status(500).json({ error: '备份下载失败' })
  }
})

// ========== WebDAV 配置 ==========

// 获取 WebDAV 配置（密码脱敏）
router.get('/config', authMiddleware, (req: Request, res: Response) => {
  try {
    const config = getBackupConfig()
    res.json({
      ...config,
      password: config.password ? '******' : '',
    })
  } catch (err: any) {
    res.status(500).json({ error: '获取配置失败' })
  }
})

// 保存 WebDAV 配置
router.post('/config', authMiddleware, (req: Request, res: Response) => {
  try {
    const { url, username, password, path, autoBackup, cronExpression, maxBackups } = req.body

    const currentConfig = getBackupConfig()

    const newConfig: WebDAVConfig = {
      url: url ?? currentConfig.url,
      username: username ?? currentConfig.username,
      // 如果密码是 ****** 则保持原密码
      password: (password && password !== '******') ? password : currentConfig.password,
      path: path ?? currentConfig.path,
      autoBackup: autoBackup ?? currentConfig.autoBackup,
      cronExpression: cronExpression ?? currentConfig.cronExpression,
      maxBackups: maxBackups ?? currentConfig.maxBackups,
    }

    saveBackupConfig(newConfig)

    // 重启或停止自动备份
    if (newConfig.autoBackup && newConfig.url) {
      startAutoBackup()
    } else {
      stopAutoBackup()
    }

    res.json({ success: true, message: '配置已保存' })
  } catch (err: any) {
    console.error('保存备份配置失败:', err)
    res.status(500).json({ error: '保存配置失败' })
  }
})

// 测试 WebDAV 连接
router.post('/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { url, username, password, path } = req.body
    const currentConfig = getBackupConfig()

    const config: WebDAVConfig = {
      url: url || currentConfig.url,
      username: username || currentConfig.username,
      password: (password && password !== '******') ? password : currentConfig.password,
      path: path || currentConfig.path,
      autoBackup: false,
      cronExpression: '',
      maxBackups: 30,
    }

    if (!config.url) {
      return res.status(400).json({ error: '请填写 WebDAV 地址' })
    }

    const result = await testConnection(config)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || '测试失败' })
  }
})

// ========== WebDAV 备份操作 ==========

// 立即执行备份
router.post('/now', authMiddleware, async (req: Request, res: Response) => {
  try {
    const config = getBackupConfig()
    if (!config.url) {
      return res.status(400).json({ error: '请先配置 WebDAV 连接' })
    }

    const result = await uploadBackup(config, 'manual')
    res.json(result)
  } catch (err: any) {
    console.error('WebDAV 备份失败:', err)
    res.status(500).json({ error: `备份失败：${err?.message || '未知错误'}` })
  }
})

// 列出远程备份
router.get('/list', authMiddleware, async (req: Request, res: Response) => {
  try {
    const config = getBackupConfig()
    if (!config.url) {
      return res.json({ backups: [], message: '未配置 WebDAV' })
    }

    const backups = await listBackups(config)
    res.json({ backups })
  } catch (err: any) {
    console.error('列出备份失败:', err)
    res.status(500).json({ error: `获取备份列表失败：${err?.message || '未知错误'}` })
  }
})

// 从远程恢复备份
router.post('/restore', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { filename } = req.body
    if (!filename) {
      return res.status(400).json({ error: '请指定备份文件名' })
    }

    const config = getBackupConfig()
    if (!config.url) {
      return res.status(400).json({ error: '请先配置 WebDAV 连接' })
    }

    const backupData = await downloadBackup(config, filename)

    // 验证数据格式
    if (!backupData?.data?.bookmarks) {
      return res.status(400).json({ error: '备份文件格式无效' })
    }

    // 恢复数据（复用 import 逻辑）
    const { getDatabase, saveDatabase, generateId } = await import('../db.js')
    const db = getDatabase()

    // 清空现有数据
    db.run('DELETE FROM bookmarks')
    db.run('DELETE FROM categories')

    // 恢复分类
    if (backupData.data.categories?.length) {
      for (const cat of backupData.data.categories) {
        db.run(
          `INSERT OR REPLACE INTO categories (id, name, icon, color, orderIndex) VALUES (?, ?, ?, ?, ?)`,
          [cat.id, cat.name, cat.icon || null, cat.color, cat.orderIndex || 0]
        )
      }
    }

    // 恢复书签
    for (const bookmark of backupData.data.bookmarks) {
      const id = bookmark.id || generateId()
      db.run(
        `INSERT OR REPLACE INTO bookmarks (id, url, internalUrl, title, description, favicon, ogImage, icon, iconUrl, category, tags, orderIndex, isPinned, isReadLater, isRead, visitCount, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          bookmark.url,
          bookmark.internalUrl || null,
          bookmark.title,
          bookmark.description || null,
          bookmark.favicon || null,
          bookmark.ogImage || null,
          bookmark.icon || null,
          bookmark.iconUrl || null,
          bookmark.category || null,
          Array.isArray(bookmark.tags) ? bookmark.tags.filter(Boolean).join(',') : (bookmark.tags || null),
          bookmark.orderIndex || 0,
          bookmark.isPinned ? 1 : 0,
          bookmark.isReadLater ? 1 : 0,
          bookmark.isRead ? 1 : 0,
          bookmark.visitCount || 0,
          bookmark.createdAt || new Date().toISOString(),
          bookmark.updatedAt || new Date().toISOString(),
        ]
      )
    }

    // 恢复设置
    if (backupData.data.settings && typeof backupData.data.settings === 'object') {
      const now = new Date().toISOString()
      for (const [key, value] of Object.entries(backupData.data.settings)) {
        // 跳过备份相关的配置（不覆盖当前 WebDAV 设置）
        if (key.startsWith('backup_')) continue

        const stringValue = typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : String(value ?? '')

        db.run(
          `INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = ?, updatedAt = ?`,
          [key, stringValue, now, stringValue, now]
        )
      }
    }

    // 恢复名言
    if (backupData.data.quotes?.length) {
      db.run('DELETE FROM quotes')
      for (const quote of backupData.data.quotes) {
        db.run(
          `INSERT OR REPLACE INTO quotes (id, content, orderIndex, createdAt) VALUES (?, ?, ?, ?)`,
          [quote.id, quote.content, quote.orderIndex || 0, quote.createdAt || new Date().toISOString()]
        )
      }
    }

    saveDatabase()

    res.json({
      success: true,
      message: `已从 ${filename} 恢复数据：${backupData.data.bookmarks.length} 个书签，${backupData.data.categories?.length || 0} 个分类`,
    })
  } catch (err: any) {
    console.error('恢复备份失败:', err)
    res.status(500).json({ error: `恢复失败：${err?.message || '未知错误'}` })
  }
})

// 删除远程备份
router.delete('/file/:filename', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params
    const config = getBackupConfig()
    if (!config.url) {
      return res.status(400).json({ error: '请先配置 WebDAV 连接' })
    }

    await deleteBackup(config, filename)
    res.json({ success: true, message: '备份已删除' })
  } catch (err: any) {
    console.error('删除备份失败:', err)
    res.status(500).json({ error: `删除失败：${err?.message || '未知错误'}` })
  }
})

// 获取自动备份状态
router.get('/status', authMiddleware, (req: Request, res: Response) => {
  try {
    const status = getAutoBackupStatus()
    res.json(status)
  } catch (err: any) {
    res.status(500).json({ error: '获取状态失败' })
  }
})

export default router
