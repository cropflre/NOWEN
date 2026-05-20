/**
 * nowen-note 账密一键连接服务
 * ---------------------------------------------------------------------------
 * 用户在 NOWEN 的设置面板填写：URL + 用户名 + 密码 → 点击"连接"
 *
 * 内部流程（用户全程感知不到）：
 *   1. POST {baseUrl}/api/auth/login    → 拿 30 天 JWT
 *   2. POST {baseUrl}/api/tokens
 *        Authorization: Bearer <JWT>
 *        body: { name: "NOWEN Bookmark", scopes: [...], expiresInDays: null }
 *      → 拿到永不过期的 nkn_xxx Token（明文仅此一次返回）
 *   3. **立即丢弃** JWT 和密码，只把 nkn_xxx 持久化到 settings 表
 *
 * 设计原则：
 *   - NOWEN 不持久化用户密码，密码只在内存中存在数秒
 *   - 创建出的 Token 名字带 hostname/timestamp，便于用户在 nowen-note 那边识别
 *   - 失败要把所有可能的错误码翻译成对人友好的中文
 *   - 不依赖 nowen-note 是否上线了 Token 管理 UI（直接调 backend API）
 */

/** 一键连接入参 */
export interface SetupParams {
  baseUrl: string
  username: string
  password: string
  /** 自定义 Token 名称（不传则自动生成） */
  tokenName?: string
}

/** 连接结果 */
export interface SetupResult {
  ok: boolean
  /** 创建出来的 API Token 明文（**仅这次返回**，调用方需立即持久化） */
  apiToken?: string
  /** Token 在 nowen-note 那边的 id，便于以后吊销 */
  tokenId?: string
  /** Token 名称（用于审计） */
  tokenName?: string
  /** 错误信息（人类可读，可直接展示给用户） */
  error?: string
  /** 错误代码，便于前端做不同 UI 引导 */
  code?:
    | 'INVALID_URL'
    | 'NETWORK_ERROR'
    | 'TIMEOUT'
    | 'AUTH_FAILED'
    | 'ACCOUNT_LOCKED'
    | 'ACCOUNT_DISABLED'
    | 'REQUIRES_2FA'
    | 'RATE_LIMITED'
    | 'TOKEN_CREATE_FAILED'
    | 'UNKNOWN'
}

/** 一键连接需要为 Token 申请的 scopes（最小必要原则） */
const REQUIRED_SCOPES = [
  'notes:read',
  'notes:write',
  'notebooks:read',
  'notebooks:write',
  'tags:read',
  'tags:write',
] as const

/** 默认 Token 名（带时间戳便于在 nowen-note 那边识别） */
function defaultTokenName(): string {
  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ')
  return `NOWEN Bookmark (${ts})`
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

/** 校验 URL 格式 */
function validateUrl(url: string): { ok: true; url: string } | { ok: false; error: string } {
  if (!url || typeof url !== 'string') {
    return { ok: false, error: '请填写 nowen-note 服务地址' }
  }
  const trimmed = url.trim()
  try {
    const u = new URL(trimmed)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { ok: false, error: '服务地址必须以 http:// 或 https:// 开头' }
    }
    return { ok: true, url: stripTrailingSlash(trimmed) }
  } catch {
    return { ok: false, error: '服务地址格式不合法' }
  }
}

/** 通用 fetch 封装，带超时 */
async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs = 10000,
): Promise<{ status: number; body: any }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    let body: any = null
    const text = await res.text().catch(() => '')
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        body = { error: text }
      }
    }
    return { status: res.status, body }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Step 1: 用账密换 JWT
 */
async function login(
  baseUrl: string,
  username: string,
  password: string,
): Promise<
  | { ok: true; jwt: string; userInfo?: any }
  | { ok: false; error: string; code: SetupResult['code'] }
> {
  let response: { status: number; body: any }
  try {
    response = await fetchJson(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { ok: false, error: '连接 nowen-note 超时（10 秒），请检查地址和网络', code: 'TIMEOUT' }
    }
    return {
      ok: false,
      error: `无法连接到 nowen-note：${err?.message || err}`,
      code: 'NETWORK_ERROR',
    }
  }

  // 2FA 用户：本一键流程暂不支持，提示走"手填 Token"路径
  if (response.body?.requires2FA) {
    return {
      ok: false,
      error:
        '该账号开启了二次验证（2FA），无法使用一键连接。请在 nowen-note 的"个人访问令牌"页面手动创建 Token，再粘贴到此处。',
      code: 'REQUIRES_2FA',
    }
  }

  if (response.status === 200 && response.body?.token) {
    return { ok: true, jwt: response.body.token, userInfo: response.body.user }
  }

  // 翻译错误
  const serverMsg = response.body?.error || ''
  switch (response.status) {
    case 401:
      return { ok: false, error: '用户名或密码错误', code: 'AUTH_FAILED' }
    case 403:
      return {
        ok: false,
        error: serverMsg || '该账号已被禁用',
        code: 'ACCOUNT_DISABLED',
      }
    case 423:
      return {
        ok: false,
        error: serverMsg || '账号已被临时锁定，请稍后再试',
        code: 'ACCOUNT_LOCKED',
      }
    case 429:
      return {
        ok: false,
        error: serverMsg || '登录请求过于频繁，请稍后再试',
        code: 'RATE_LIMITED',
      }
    default:
      return {
        ok: false,
        error: serverMsg || `登录失败（HTTP ${response.status}）`,
        code: 'UNKNOWN',
      }
  }
}

/**
 * Step 2: 用 JWT 创建一个永不过期的 Personal API Token
 */
async function createApiToken(
  baseUrl: string,
  jwt: string,
  tokenName: string,
): Promise<
  | { ok: true; token: string; tokenId: string }
  | { ok: false; error: string; code: SetupResult['code'] }
> {
  let response: { status: number; body: any }
  try {
    response = await fetchJson(`${baseUrl}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        name: tokenName,
        scopes: REQUIRED_SCOPES,
        // expiresInDays: null → 永不过期（nowen-note 用户随时可在 Token 管理页吊销）
      }),
    })
  } catch (err: any) {
    return {
      ok: false,
      error: `创建 API Token 失败：${err?.message || err}`,
      code: 'TOKEN_CREATE_FAILED',
    }
  }

  if (response.status === 201 && response.body?.token) {
    return {
      ok: true,
      token: response.body.token as string,
      tokenId: (response.body.id as string) || '',
    }
  }

  const serverMsg = response.body?.error || ''
  return {
    ok: false,
    error: serverMsg || `创建 API Token 失败（HTTP ${response.status}）`,
    code: 'TOKEN_CREATE_FAILED',
  }
}

/**
 * 一键连接主流程：账密 → JWT → API Token
 *
 * **重要安全说明**：函数返回后，调用方必须立即把 `apiToken` 写入 settings 并丢弃明文。
 * 此函数本身不会触碰 settings 表，所有副作用由路由层负责。
 */
export async function setupWithCredentials(params: SetupParams): Promise<SetupResult> {
  // 0. 入参校验
  const urlCheck = validateUrl(params.baseUrl)
  if (!urlCheck.ok) {
    return { ok: false, error: urlCheck.error, code: 'INVALID_URL' }
  }
  if (!params.username || !params.username.trim()) {
    return { ok: false, error: '请填写用户名', code: 'AUTH_FAILED' }
  }
  if (!params.password) {
    return { ok: false, error: '请填写密码', code: 'AUTH_FAILED' }
  }
  const baseUrl = urlCheck.url
  const tokenName = (params.tokenName && params.tokenName.trim()) || defaultTokenName()

  // 1. 登录拿 JWT
  const loginRes = await login(baseUrl, params.username.trim(), params.password)
  if (!loginRes.ok) {
    return { ok: false, error: loginRes.error, code: loginRes.code }
  }

  // 2. 用 JWT 创建 API Token
  const tokenRes = await createApiToken(baseUrl, loginRes.jwt, tokenName)
  if (!tokenRes.ok) {
    return { ok: false, error: tokenRes.error, code: tokenRes.code }
  }

  // 3. 成功（密码 / JWT 此时随函数栈一起被回收，不会泄漏到任何地方）
  return {
    ok: true,
    apiToken: tokenRes.token,
    tokenId: tokenRes.tokenId,
    tokenName,
  }
}

/**
 * 断开连接：尝试在 nowen-note 那边吊销 Token（best-effort），失败不阻塞断开
 *
 * 注意：即使吊销失败（比如 Token 已经过期或者用户在那边手动删过），NOWEN 这边也照常清空配置，
 * 不要因为远端通信问题让用户被卡在"已连接但又用不了"的尴尬状态。
 */
export async function revokeRemoteToken(
  baseUrl: string,
  apiToken: string,
  tokenId?: string,
): Promise<{ ok: boolean; error?: string }> {
  // 没有 tokenId（旧版本数据）就跳过远端吊销
  if (!tokenId) return { ok: true }
  const urlCheck = validateUrl(baseUrl)
  if (!urlCheck.ok) return { ok: true } // 配置已经损坏，本地清空就好
  try {
    await fetchJson(
      `${urlCheck.url}/api/tokens/${encodeURIComponent(tokenId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiToken}` },
      },
      8000,
    )
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) }
  }
}
