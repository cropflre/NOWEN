import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

// ========== 书签相关 Schema ==========

export const createBookmarkSchema = z.object({
  url: z.string().url('请输入有效的 URL'),
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  description: z.string().max(1000, '描述不能超过1000字符').optional().nullable(),
  favicon: z.string().url('favicon 必须是有效的 URL').optional().nullable().or(z.literal('')),
  ogImage: z.string().url('ogImage 必须是有效的 URL').optional().nullable().or(z.literal('')),
  icon: z.string().max(50).optional().nullable(),
  iconUrl: z.string().url('iconUrl 必须是有效的 URL').optional().nullable().or(z.literal('')),
  category: z.string().max(50).optional().nullable(),
  tags: z.string().max(500).optional().nullable(),
  isReadLater: z.boolean().optional(),
})

export const updateBookmarkSchema = z.object({
  url: z.string().url('请输入有效的 URL').optional(),
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符').optional(),
  description: z.string().max(1000, '描述不能超过1000字符').optional().nullable(),
  favicon: z.string().url('favicon 必须是有效的 URL').optional().nullable().or(z.literal('')),
  ogImage: z.string().url('ogImage 必须是有效的 URL').optional().nullable().or(z.literal('')),
  icon: z.string().max(50).optional().nullable(),
  iconUrl: z.string().url('iconUrl 必须是有效的 URL').optional().nullable().or(z.literal('')),
  category: z.string().max(50).optional().nullable(),
  tags: z.string().max(500).optional().nullable(),
  orderIndex: z.number().int().min(0).optional(),
  isPinned: z.boolean().optional(),
  isReadLater: z.boolean().optional(),
  isRead: z.boolean().optional(),
})

export const reorderBookmarksSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1, 'ID 不能为空'),
    orderIndex: z.number().int().min(0),
  })).min(1, '重排序列表不能为空'),
})

// ========== 分类相关 Schema ==========

export const createCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50字符'),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色必须是有效的十六进制颜色值').optional().nullable(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50字符').optional(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色必须是有效的十六进制颜色值').optional().nullable(),
  orderIndex: z.number().int().min(0).optional(),
})

// ========== 认证相关 Schema ==========

export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名不能超过50字符'),
  password: z.string().min(1, '密码不能为空').max(100, '密码不能超过100字符'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '当前密码不能为空'),
  newPassword: z.string().min(6, '新密码长度至少6位').max(100, '密码不能超过100字符'),
})

// ========== 元数据相关 Schema ==========

export const metadataSchema = z.object({
  url: z.string().url('请输入有效的 URL'),
})

// ========== 设置相关 Schema ==========

export const updateSettingsSchema = z.object({
  siteTitle: z.string().max(100, '站点标题不能超过100字符').optional(),
  siteFavicon: z.string().url('站点图标必须是有效的 URL').optional().or(z.literal('')),
  useDefaultQuotes: z.string().optional(),
}).passthrough() // 允许其他设置字段

// ========== 名言相关 Schema ==========

export const updateQuotesSchema = z.object({
  quotes: z.array(z.string().min(1, '名言内容不能为空').max(500, '单条名言不能超过500字符')),
  useDefaultQuotes: z.boolean().optional(),
})

// ========== 数据导入 Schema ==========

export const importDataSchema = z.object({
  bookmarks: z.array(z.object({
    id: z.string().optional(),
    url: z.string().url(),
    title: z.string(),
    description: z.string().optional().nullable(),
    favicon: z.string().optional().nullable(),
    ogImage: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    iconUrl: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    tags: z.string().optional().nullable(),
    orderIndex: z.number().optional(),
    isPinned: z.boolean().optional(),
    isReadLater: z.boolean().optional(),
    isRead: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    orderIndex: z.number().optional(),
  })).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
})

// ========== 验证中间件工厂函数 ==========

/**
 * 创建请求体验证中间件
 * @param schema Zod schema
 * @returns Express 中间件
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      
      return res.status(400).json({
        error: '请求参数验证失败',
        details: errors,
      })
    }
    
    // 将验证后的数据附加到请求对象
    req.body = result.data
    next()
  }
}

/**
 * 创建 URL 参数验证中间件
 * @param schema Zod schema
 * @returns Express 中间件
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params)
    
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      
      return res.status(400).json({
        error: 'URL 参数验证失败',
        details: errors,
      })
    }
    
    req.params = result.data
    next()
  }
}

// ID 参数验证 Schema
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID 不能为空'),
})

// ========== 分页查询 Schema ==========

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  isPinned: z.coerce.boolean().optional(),
  isReadLater: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'orderIndex']).default('orderIndex'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

/**
 * 创建查询参数验证中间件
 * @param schema Zod schema
 * @returns Express 中间件
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      
      return res.status(400).json({
        error: '查询参数验证失败',
        details: errors,
      })
    }
    
    // 将验证后的数据附加到请求对象
    ;(req as any).validatedQuery = result.data
    next()
  }
}

// 类型导出
export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type MetadataInput = z.infer<typeof metadataSchema>
export type UpdateQuotesInput = z.infer<typeof updateQuotesSchema>
export type ImportDataInput = z.infer<typeof importDataSchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
