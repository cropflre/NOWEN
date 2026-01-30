import { z } from 'zod'

/**
 * 客户端环境变量验证 Schema
 * 所有前端可访问的环境变量必须以 VITE_ 开头
 */
const clientEnvSchema = z.object({
  // API 基础地址
  VITE_API_BASE: z
    .string()
    .url('VITE_API_BASE 必须是有效的 URL')
    .optional()
    .default('http://localhost:3001'),
  
  // 应用模式
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  
  // 是否开发环境
  DEV: z.boolean().default(true),
  
  // 是否生产环境
  PROD: z.boolean().default(false),
  
  // 服务端渲染
  SSR: z.boolean().default(false),
})

/**
 * 服务端环境变量验证 Schema
 */
const serverEnvSchema = z.object({
  // 服务端口
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535))
    .optional()
    .default('3001'),
  
  // 前端 URL（用于 CORS 白名单）
  FRONTEND_URL: z.string().url().optional(),
  
  // Node 环境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// 类型导出
export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

/**
 * 解析并验证客户端环境变量
 */
function parseClientEnv(): ClientEnv {
  const rawEnv = {
    VITE_API_BASE: import.meta.env.VITE_API_BASE,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    SSR: import.meta.env.SSR,
  }

  const result = clientEnvSchema.safeParse(rawEnv)

  if (!result.success) {
    console.error('❌ 环境变量验证失败:')
    console.error(result.error.format())
    
    // 在开发环境下抛出错误，生产环境使用默认值
    if (import.meta.env.DEV) {
      throw new Error('环境变量配置错误，请检查 .env 文件')
    }
  }

  return result.success ? result.data : clientEnvSchema.parse({})
}

/**
 * 已验证的客户端环境变量
 * 可以安全地在应用中使用
 */
export const env = parseClientEnv()

/**
 * 获取 API 基础地址
 */
export function getApiBase(): string {
  return env.VITE_API_BASE
}

/**
 * 检查是否为开发环境
 */
export function isDev(): boolean {
  return env.DEV
}

/**
 * 检查是否为生产环境
 */
export function isProd(): boolean {
  return env.PROD
}

// 导出 schema 供其他模块使用
export { clientEnvSchema, serverEnvSchema }
