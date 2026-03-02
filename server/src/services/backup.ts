import { createClient, WebDAVClient } from 'webdav'
import { getDatabase, saveDatabase } from '../db.js'
import { queryAll } from '../utils/index.js'
import cron from 'node-cron'

// ========== 类型定义 ==========

export interface WebDAVConfig {
  url: string
  username: string
  password: string
  path: string        // 远程备份目录，默认 /NOWEN/
  autoBackup: boolean
  cronExpression: string // cron 表达式，默认每天凌晨3点
  maxBackups: number    // 最大保留备份数
}

export interface BackupFile {
  filename: string
  size: number
  lastmod: string
}

export interface BackupData {
  version: string
  backupAt: string
  source: 'manual' | 'auto'
  data: {
    bookmarks: any[]
    categories: any[]
    settings: Record<string, string>
    quotes: any[]
  }
}

// ========== 默认配置 ==========

const DEFAULT_CONFIG: WebDAVConfig = {
  url: '',
  username: '',
  password: '',
  path: '/NOWEN/',
  autoBackup: false,
  cronExpression: '0 3 * * *', // 每天凌晨3点
  maxBackups: 30,
}

// ========== 状态管理 ==========

let cronTask: cron.ScheduledTask | null = null
let lastAutoBackupTime: string | null = null
let lastAutoBackupError: string | null = null

// ========== 工具函数 ==========

function booleanize(row: any) {
  const result = { ...row }
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'number' && (key.startsWith('is') || key === 'isPinned' || key === 'isReadLater' || key === 'isRead' || key === 'isDefaultPassword')) {
      result[key] = result[key] === 1
    }
  }
  return result
}

/** 导出全部用户数据（与 /api/export 逻辑一致） */
export function collectBackupData(source: 'manual' | 'auto'): BackupData {
  const bookmarks = queryAll(`
    SELECT * FROM bookmarks 
    ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC
  `).map(booleanize).map((b: any) => {
    if (typeof b.tags === 'string' && b.tags) {
      const trimmed = b.tags.trim()
      if (trimmed.startsWith('[')) {
        try { b.tags = JSON.parse(trimmed) } catch { b.tags = trimmed.split(',').map((t: string) => t.trim()).filter(Boolean) }
      } else {
        b.tags = trimmed.split(',').map((t: string) => t.trim()).filter(Boolean)
      }
    } else {
      b.tags = []
    }
    return b
  })

  const categories = queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')

  const settingsRows = queryAll('SELECT * FROM settings')
  const settings: Record<string, string> = {}
  settingsRows.forEach((s: any) => {
    settings[s.key] = s.value
  })

  const quotes = queryAll('SELECT * FROM quotes ORDER BY orderIndex ASC')

  return {
    version: '1.0',
    backupAt: new Date().toISOString(),
    source,
    data: { bookmarks, categories, settings, quotes }
  }
}

/** 生成备份文件名 */
function generateBackupFilename(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `nowen-backup-${date}-${time}.json`
}

// ========== WebDAV 操作 ==========

/** 创建 WebDAV 客户端 */
function createWebDAVClient(config: WebDAVConfig): WebDAVClient {
  return createClient(config.url, {
    username: config.username,
    password: config.password,
  })
}

/** 确保远程目录存在 */
async function ensureRemoteDir(client: WebDAVClient, dirPath: string): Promise<void> {
  try {
    const exists = await client.exists(dirPath)
    if (!exists) {
      await client.createDirectory(dirPath, { recursive: true })
    }
  } catch (err: any) {
    // 某些 WebDAV 服务器不支持递归创建，逐级创建
    const parts = dirPath.split('/').filter(Boolean)
    let current = '/'
    for (const part of parts) {
      current += part + '/'
      try {
        const exists = await client.exists(current)
        if (!exists) {
          await client.createDirectory(current)
        }
      } catch {
        // 忽略已存在的错误
      }
    }
  }
}

/** 测试 WebDAV 连接 */
export async function testConnection(config: WebDAVConfig): Promise<{ success: boolean; message: string }> {
  try {
    const client = createWebDAVClient(config)
    await ensureRemoteDir(client, config.path)
    // 尝试列出目录内容
    await client.getDirectoryContents(config.path)
    return { success: true, message: 'WebDAV 连接成功' }
  } catch (err: any) {
    const msg = err?.message || String(err)
    if (msg.includes('401') || msg.includes('Unauthorized')) {
      return { success: false, message: '认证失败：用户名或密码错误' }
    }
    if (msg.includes('404') || msg.includes('Not Found')) {
      return { success: false, message: '路径不存在且无法创建' }
    }
    if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      return { success: false, message: '无法连接到服务器，请检查地址' }
    }
    return { success: false, message: `连接失败：${msg}` }
  }
}

/** 上传备份到 WebDAV */
export async function uploadBackup(config: WebDAVConfig, source: 'manual' | 'auto' = 'manual'): Promise<{ success: boolean; filename: string; size: number }> {
  const client = createWebDAVClient(config)
  await ensureRemoteDir(client, config.path)

  const data = collectBackupData(source)
  const content = JSON.stringify(data, null, 2)
  const filename = generateBackupFilename()
  const remotePath = config.path.endsWith('/') ? config.path + filename : config.path + '/' + filename

  await client.putFileContents(remotePath, content, { overwrite: true })

  // 清理多余备份
  if (config.maxBackups > 0) {
    await cleanOldBackups(client, config)
  }

  return { success: true, filename, size: Buffer.byteLength(content, 'utf-8') }
}

/** 列出 WebDAV 上的备份文件 */
export async function listBackups(config: WebDAVConfig): Promise<BackupFile[]> {
  const client = createWebDAVClient(config)
  const contents = await client.getDirectoryContents(config.path, { deep: false })
  
  const files = (Array.isArray(contents) ? contents : contents.data || []) as any[]
  
  return files
    .filter((f: any) => f.basename?.endsWith('.json') && f.basename?.startsWith('nowen-backup-'))
    .map((f: any) => ({
      filename: f.basename,
      size: f.size || 0,
      lastmod: f.lastmod || '',
    }))
    .sort((a, b) => b.filename.localeCompare(a.filename)) // 最新在前
}

/** 从 WebDAV 下载备份 */
export async function downloadBackup(config: WebDAVConfig, filename: string): Promise<BackupData> {
  const client = createWebDAVClient(config)
  const remotePath = config.path.endsWith('/') ? config.path + filename : config.path + '/' + filename
  
  const content = await client.getFileContents(remotePath, { format: 'text' }) as string
  return JSON.parse(content)
}

/** 删除 WebDAV 上的备份 */
export async function deleteBackup(config: WebDAVConfig, filename: string): Promise<void> {
  const client = createWebDAVClient(config)
  const remotePath = config.path.endsWith('/') ? config.path + filename : config.path + '/' + filename
  await client.deleteFile(remotePath)
}

/** 清理旧备份（保留最新 N 个） */
async function cleanOldBackups(client: WebDAVClient, config: WebDAVConfig): Promise<void> {
  try {
    const backups = await listBackups(config)
    if (backups.length > config.maxBackups) {
      const toDelete = backups.slice(config.maxBackups)
      for (const file of toDelete) {
        const remotePath = config.path.endsWith('/') ? config.path + file.filename : config.path + '/' + file.filename
        try {
          await client.deleteFile(remotePath)
        } catch {
          // 忽略删除失败
        }
      }
    }
  } catch {
    // 清理失败不影响主流程
  }
}

// ========== 配置持久化 ==========

/** 从 settings 表读取 WebDAV 配置 */
export function getBackupConfig(): WebDAVConfig {
  const rows = queryAll("SELECT key, value FROM settings WHERE key LIKE 'backup_%'")
  const map: Record<string, string> = {}
  rows.forEach((r: any) => { map[r.key] = r.value })

  return {
    url: map['backup_webdav_url'] || DEFAULT_CONFIG.url,
    username: map['backup_webdav_username'] || DEFAULT_CONFIG.username,
    password: map['backup_webdav_password'] || DEFAULT_CONFIG.password,
    path: map['backup_webdav_path'] || DEFAULT_CONFIG.path,
    autoBackup: map['backup_auto_enabled'] === 'true',
    cronExpression: map['backup_cron'] || DEFAULT_CONFIG.cronExpression,
    maxBackups: parseInt(map['backup_max_count'] || String(DEFAULT_CONFIG.maxBackups), 10),
  }
}

/** 保存 WebDAV 配置到 settings 表 */
export function saveBackupConfig(config: WebDAVConfig): void {
  const db = getDatabase()
  const now = new Date().toISOString()
  const pairs: [string, string][] = [
    ['backup_webdav_url', config.url],
    ['backup_webdav_username', config.username],
    ['backup_webdav_password', config.password],
    ['backup_webdav_path', config.path],
    ['backup_auto_enabled', String(config.autoBackup)],
    ['backup_cron', config.cronExpression],
    ['backup_max_count', String(config.maxBackups)],
  ]

  for (const [key, value] of pairs) {
    db.run(
      `INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?) 
       ON CONFLICT(key) DO UPDATE SET value = ?, updatedAt = ?`,
      [key, value, now, value, now]
    )
  }
  saveDatabase()
}

// ========== 定时备份 ==========

/** 启动自动备份定时任务 */
export function startAutoBackup(): void {
  stopAutoBackup()

  const config = getBackupConfig()
  if (!config.autoBackup || !config.url) {
    return
  }

  if (!cron.validate(config.cronExpression)) {
    console.error(`❌ Invalid cron expression: ${config.cronExpression}`)
    return
  }

  console.log(`⏰ Auto backup scheduled: ${config.cronExpression}`)

  cronTask = cron.schedule(config.cronExpression, async () => {
    console.log('🔄 Auto backup starting...')
    try {
      const currentConfig = getBackupConfig()
      const result = await uploadBackup(currentConfig, 'auto')
      lastAutoBackupTime = new Date().toISOString()
      lastAutoBackupError = null
      console.log(`✅ Auto backup completed: ${result.filename} (${result.size} bytes)`)
    } catch (err: any) {
      lastAutoBackupError = err?.message || String(err)
      console.error('❌ Auto backup failed:', lastAutoBackupError)
    }
  })
}

/** 停止自动备份 */
export function stopAutoBackup(): void {
  if (cronTask) {
    cronTask.stop()
    cronTask = null
  }
}

/** 获取自动备份状态 */
export function getAutoBackupStatus() {
  const config = getBackupConfig()
  return {
    enabled: config.autoBackup,
    cronExpression: config.cronExpression,
    running: cronTask !== null,
    lastBackupTime: lastAutoBackupTime,
    lastError: lastAutoBackupError,
  }
}

/** 初始化备份服务（服务器启动时调用） */
export function initBackupService(): void {
  const config = getBackupConfig()
  if (config.autoBackup && config.url) {
    startAutoBackup()
  }
}
