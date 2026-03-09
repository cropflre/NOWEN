/**
 * AI 智能服务
 * 支持 OpenAI / Gemini / 兼容 OpenAI 协议的本地模型 (Ollama 等)
 * 配置优先级：数据库设置 > 环境变量
 */

import { queryAll } from '../utils/index.js'

// ========== 类型定义 ==========

interface AiConfig {
  provider: string       // openai | gemini | custom
  apiKey: string
  apiBase: string        // 自定义 API 地址 (Ollama 等)
  model: string
  timeout: number        // API 超时时间（毫秒），默认 30000
}

interface AiCategorizeRequest {
  url: string
  title: string
  description?: string
  existingCategories: string[]
  lang?: string
}

interface AiCategorizeResponse {
  category: string
  isNewCategory: boolean
  tags: string[]
  summary: string
  confidence: number
}

interface AiEnrichRequest {
  url: string
  title: string
  description?: string
  lang?: string
}

interface AiEnrichResponse {
  title: string
  description: string
  iconName: string
  tags: string[]
}

export interface AiChatRequest {
  message: string
  lang?: string
}

export interface AiChatResponse {
  reply: string
  bookmarks?: Array<{
    id: string
    title: string
    url: string
    description?: string
    categoryName?: string
  }>
}

export interface AiGenerateQuotesRequest {
  count?: number
  lang?: string
  theme?: string
  existingQuotes?: string[]
}

export interface AiGenerateQuotesResponse {
  quotes: string[]
}

// ========== 配置管理 ==========

// 从数据库读取 AI 配置
function getDbAiConfig(): Partial<AiConfig> {
  try {
    const rows = queryAll("SELECT key, value FROM settings WHERE key LIKE 'ai_%'")
    const config: Record<string, string> = {}
    rows.forEach((r: any) => { config[r.key] = r.value })
    return {
      provider: config['ai_provider'] || '',
      apiKey: config['ai_apiKey'] || '',
      apiBase: config['ai_apiBase'] || '',
      model: config['ai_model'] || '',
      timeout: Number(config['ai_timeout']) || 0,
    }
  } catch {
    return {}
  }
}

// 合并配置：数据库优先 > 环境变量
export function getAiConfig(): AiConfig {
  const db = getDbAiConfig()

  return {
    provider: db.provider || process.env.AI_PROVIDER || '',
    apiKey: db.apiKey || process.env.AI_API_KEY || '',
    apiBase: db.apiBase || process.env.AI_API_BASE || '',
    model: db.model || process.env.AI_MODEL || '',
    timeout: Number(db.timeout) || Number(process.env.AI_TIMEOUT) || 30000,
  }
}

export function isAiConfigured(): boolean {
  const { provider, apiKey, apiBase } = getAiConfig()
  if (!provider) return false
  if (provider === 'custom') return !!apiBase
  return !!apiKey
}

// 获取当前 AI 状态（给前端用）
export function getAiFullStatus() {
  const config = getAiConfig()
  return {
    configured: isAiConfigured(),
    provider: config.provider || null,
    model: config.model || null,
    apiBase: config.apiBase || null,
    hasApiKey: !!config.apiKey,
  }
}

// ========== Prompt 构建 ==========

function buildCategorizePrompt(req: AiCategorizeRequest): string {
  const isZh = req.lang?.startsWith('zh')
  const lang = isZh ? '中文' : 'English'
  const categoriesList = req.existingCategories.length > 0
    ? req.existingCategories.join(', ')
    : (isZh ? '(暂无已有分类)' : '(no existing categories)')

  if (isZh) {
    return `你是一个智能书签分类助手。根据以下网站信息，帮用户完成分类和整理。

网站信息：
- URL: ${req.url}
- 标题: ${req.title}
- 描述: ${req.description || '(无)'}

用户已有的分类列表: [${categoriesList}]

请返回一个 JSON 对象，包含以下字段：
1. "category": 从已有分类中选择最匹配的一个。如果没有合适的，建议一个简短的新分类名称（2-6个字）。
2. "isNewCategory": 布尔值，true 表示建议的是新分类，false 表示从已有分类中选择。
3. "tags": 推荐3-5个相关标签，每个标签2-4个字，用于描述网站内容。
4. "summary": 用一句话（不超过80字）精炼描述这个网站的核心价值，语言使用${lang}。
5. "confidence": 0-1之间的数字，表示分类建议的置信度。

只返回纯 JSON，不要包含 markdown 代码块或其他文本。`
  }

  return `You are a smart bookmark categorization assistant. Based on the following website info, help the user categorize and organize it.

Website info:
- URL: ${req.url}
- Title: ${req.title}
- Description: ${req.description || '(none)'}

User's existing categories: [${categoriesList}]

Return a JSON object with the following fields:
1. "category": Choose the best matching one from existing categories. If none fits, suggest a short new category name (2-6 words).
2. "isNewCategory": Boolean, true if suggesting a new category, false if choosing from existing ones.
3. "tags": Recommend 3-5 relevant tags, each 1-3 words, describing the website content.
4. "summary": A concise one-sentence description (max 80 chars) of the website's core value, in ${lang}.
5. "confidence": A number between 0-1 indicating the confidence of the categorization.

Return pure JSON only, no markdown code blocks or other text.`
}

function buildEnrichPrompt(req: AiEnrichRequest): string {
  const isZh = req.lang?.startsWith('zh')
  const lang = isZh ? '中文' : 'English'

  if (isZh) {
    return `你是一个智能书签元数据优化助手。根据以下网站信息，帮用户优化书签的标题、描述，推荐相关标签，并推荐一个合适的 Iconify 图标。

网站信息：
- URL: ${req.url}
- 当前标题: ${req.title}
- 当前描述: ${req.description || '(无)'}

请返回一个 JSON 对象，包含以下字段：
1. "title": 优化后的网站标题，语言使用${lang}。要求简洁精确，保留品牌名，去除多余的SEO后缀（如 " - 官网"、" | Home"），2-30个字。如果原标题已经很好则翻译为${lang}并保持简洁。
2. "description": 用一句话（不超过100字）精炼描述这个网站的核心功能和价值，语言使用${lang}。
3. "tags": 推荐3-5个相关标签，每个标签2-4个字，用于描述网站内容，语言使用${lang}。
4. "iconName": 推荐一个最能代表这个网站类型/功能的 Iconify 图标名称。格式为 "prefix:name"，例如 "mdi:github"、"simple-icons:react"、"lucide:code"、"ri:twitter-x-fill"。优先使用 simple-icons（品牌图标）、mdi（Material Design Icons）、lucide 这几个图标集。如果是知名品牌/产品，优先使用其品牌图标（simple-icons集）。

只返回纯 JSON，不要包含 markdown 代码块或其他文本。`
  }

  return `You are a smart bookmark metadata optimization assistant. Based on the following website info, help optimize the bookmark's title, description, suggest relevant tags, and recommend a suitable Iconify icon.

Website info:
- URL: ${req.url}
- Current title: ${req.title}
- Current description: ${req.description || '(none)'}

Return a JSON object with the following fields:
1. "title": Optimized website title in ${lang}. Keep it concise, retain brand names, remove SEO suffixes (e.g. " - Official", " | Home"), 2-30 characters. If original title is good, keep it concise.
2. "description": A concise one-sentence description (max 100 chars) of the website's core functionality and value, in ${lang}.
3. "tags": Recommend 3-5 relevant tags, each 1-3 words, describing the website content, in ${lang}.
4. "iconName": Recommend an Iconify icon name that best represents this website type/function. Format: "prefix:name", e.g. "mdi:github", "simple-icons:react", "lucide:code", "ri:twitter-x-fill". Prefer simple-icons (brand icons), mdi (Material Design Icons), lucide icon sets. For well-known brands/products, prioritize their brand icon (simple-icons set).

Return pure JSON only, no markdown code blocks or other text.`
}

function buildChatPrompt(req: AiChatRequest, bookmarks: any[]): string {
  const isZh = req.lang?.startsWith('zh')
  const lang = isZh ? '中文' : 'English'

  // 构建书签上下文（已经是预筛选过的相关书签，最多30条）
  const categoryLabel = isZh ? '分类' : 'Category'
  const bookmarkContext = bookmarks.map((b: any) =>
    `- [${b.title}](${b.url})${b.description ? ` — ${b.description}` : ''}${b.categoryName ? ` [${categoryLabel}: ${b.categoryName}]` : ''}`
  ).join('\n')

  const noBookmarks = isZh ? '(未找到相关书签)' : '(No relevant bookmarks found)'

  if (isZh) {
    return `你是一个智能书签助手，名字叫 NOWEN AI。你的任务是帮助用户管理和发现他们收藏的书签。

以下是与用户问题最相关的书签（已根据关键词预筛选）：
${bookmarkContext || noBookmarks}

规则：
1. 用${lang}回答。
2. 如果用户想搜索/找某个书签，基于上述书签中的标题、URL、描述进行语义匹配，返回最相关的结果。
3. 在回复中，将相关的书签以下面的格式列出：
   [[bookmark:书签ID]]
   这样前端可以渲染为可点击的书签卡片。
4. 如果用户的问题与书签无关（闲聊、知识问答等），也可以友好地回答，但适当引导回书签管理的话题。
5. 保持回复简洁、友好、有帮助。每次回复不超过300字。
6. 不要编造不存在的书签。如果上述列表中没有匹配的书签，诚实告知用户。

用户的消息: ${req.message}`
  }

  return `You are a smart bookmark assistant named NOWEN AI. Your task is to help users manage and discover their bookmarked sites.

Here are bookmarks most relevant to the user's question (pre-filtered by keywords):
${bookmarkContext || noBookmarks}

Rules:
1. Answer in ${lang}.
2. When users search for bookmarks, match semantically against the titles, URLs, and descriptions above, returning the most relevant results.
3. Reference bookmarks in your reply using this format:
   [[bookmark:bookmarkID]]
   The frontend will render them as clickable bookmark cards.
4. If the user's question is unrelated to bookmarks (small talk, general knowledge, etc.), answer friendly but gently guide back to bookmark management.
5. Keep replies concise, friendly, and helpful. Max 300 characters per reply.
6. Never fabricate bookmarks. If no match exists in the list above, honestly inform the user.

User's message: ${req.message}`
}

function buildGenerateQuotesPrompt(req: AiGenerateQuotesRequest): string {
  const isZh = req.lang?.startsWith('zh')
  const lang = isZh ? '中文' : 'English'
  const count = req.count || 5
  
  const existingHint = req.existingQuotes && req.existingQuotes.length > 0
    ? (isZh
      ? `\n\n用户已有的名言（请避免重复或相似内容）:\n${req.existingQuotes.slice(0, 20).map(q => `- ${q}`).join('\n')}`
      : `\n\nUser's existing quotes (avoid duplicates or similar content):\n${req.existingQuotes.slice(0, 20).map(q => `- ${q}`).join('\n')}`)
    : ''

  if (isZh) {
    const themeHint = req.theme ? `\n主题偏好: ${req.theme}` : ''
    return `你是一个名言金句生成专家。请生成 ${count} 条高质量的名言/格言/金句。

要求：
1. 语言使用${lang}。
2. 每条名言格式：名言内容 —— 作者
3. 如果有出处，格式为：名言内容 —— 作者《书名》
4. 名言来源多样化：中外经典文学、哲学、科学、历史人物、现代名人等。
5. 内容积极向上、富有启发性和智慧。
6. 每条名言不超过80个字（不含作者信息）。
7. 确保名言的准确性，不要编造不存在的名言，确保作者和内容对应正确。${themeHint}${existingHint}

请返回一个 JSON 对象，格式如下：
{
  "quotes": [
    "名言内容 —— 作者",
    "名言内容 —— 作者《书名》"
  ]
}

只返回纯 JSON，不要包含 markdown 代码块或其他文本。`
  }

  const themeHint = req.theme ? `\nTheme preference: ${req.theme}` : ''
  return `You are an expert quote generator. Please generate ${count} high-quality quotes/aphorisms.

Requirements:
1. Language: ${lang}.
2. Format: "Quote content — Author"
3. With source: "Quote content — Author, Book Title"
4. Diverse sources: classic literature, philosophy, science, historical figures, modern celebrities, etc.
5. Positive, inspiring, and wise content.
6. Each quote max 80 characters (excluding author info).
7. Ensure accuracy — do not fabricate quotes. Verify author-content accuracy.${themeHint}${existingHint}

Return a JSON object in this format:
{
  "quotes": [
    "Quote content — Author",
    "Quote content — Author, Book Title"
  ]
}

Return pure JSON only, no markdown code blocks or other text.`
}

// ========== API 调用 ==========

// 统一的 OpenAI 兼容协议调用（支持可选的自定义配置）
async function callOpenAiCompatible(prompt: string, systemPrompt?: string, customConfig?: AiConfig): Promise<string> {
  const config = customConfig || getAiConfig()
  const baseUrl = config.apiBase || 'https://api.openai.com/v1'
  const modelName = config.model || 'gpt-4o-mini'
  const timeoutMs = config.timeout || 30000

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const messages = [
      { role: 'system', content: systemPrompt || 'You are a helpful assistant. Always respond in valid JSON format only.' },
      { role: 'user', content: prompt },
    ]

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.3,
        max_tokens: 1000,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!resp.ok) {
      const errText = await resp.text()
      throw new Error(`API error ${resp.status}: ${errText}`)
    }

    const data = await resp.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (err: any) {
    clearTimeout(timer)
    throw err
  }
}

async function callGemini(prompt: string, systemPrompt?: string): Promise<string> {
  const config = getAiConfig()
  const { apiKey, apiBase, model } = config
  const modelName = model || 'gemini-2.0-flash'
  const timeoutMs = config.timeout || 30000

  // 支持自定义 apiBase（代理/中转），默认使用 Google 官方地址
  const base = apiBase || 'https://generativelanguage.googleapis.com'
  const url = `${base}/v1beta/models/${modelName}:generateContent`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const requestBody: any = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    }

    // 添加 systemInstruction（Gemini API 支持的系统级指令）
    if (systemPrompt) {
      requestBody.systemInstruction = { parts: [{ text: systemPrompt }] }
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!resp.ok) {
      const errText = await resp.text()
      throw new Error(`Gemini API error ${resp.status}: ${errText}`)
    }

    const data = await resp.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch (err: any) {
    clearTimeout(timer)
    throw err
  }
}

// 国内 AI Provider 默认配置
const DOMESTIC_PROVIDERS: Record<string, { baseUrl: string; defaultModel: string }> = {
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-turbo' },
  doubao: { baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', defaultModel: 'doubao-1-5-lite-32k-250115' },
}

// 通用调用入口
async function callAi(prompt: string, systemPrompt?: string): Promise<string> {
  const config = getAiConfig()
  const { provider } = config

  switch (provider) {
    case 'gemini':
      return callGemini(prompt, systemPrompt)
    case 'deepseek':
    case 'qwen':
    case 'doubao': {
      // 国内 Provider：用 OpenAI 兼容协议，创建新配置对象（不修改原引用）
      const domestic = DOMESTIC_PROVIDERS[provider]
      const domesticConfig: AiConfig = {
        ...config,
        apiBase: config.apiBase || domestic.baseUrl,
        model: config.model || domestic.defaultModel,
      }
      return callOpenAiCompatible(prompt, systemPrompt, domesticConfig)
    }
    case 'openai':
    case 'custom':
    default:
      return callOpenAiCompatible(prompt, systemPrompt)
  }
}

// ========== 解析工具 ==========

function parseAiResponse(raw: string): AiCategorizeResponse {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '')
  }

  try {
    const parsed = JSON.parse(cleaned)
    return {
      category: String(parsed.category || '').slice(0, 50),
      isNewCategory: Boolean(parsed.isNewCategory),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t).slice(0, 20)).slice(0, 5) : [],
      summary: String(parsed.summary || '').slice(0, 200),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    }
  } catch {
    throw new Error('AI 返回格式异常，无法解析')
  }
}

function parseAiEnrichResponse(raw: string): AiEnrichResponse {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '')
  }

  try {
    const parsed = JSON.parse(cleaned)
    return {
      title: String(parsed.title || '').slice(0, 200),
      description: String(parsed.description || '').slice(0, 500),
      iconName: String(parsed.iconName || '').slice(0, 100),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t).slice(0, 20)).slice(0, 5) : [],
    }
  } catch {
    throw new Error('AI 返回格式异常，无法解析')
  }
}

function parseAiQuotesResponse(raw: string): AiGenerateQuotesResponse {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '')
  }

  try {
    const parsed = JSON.parse(cleaned)
    const quotes = Array.isArray(parsed.quotes)
      ? parsed.quotes.map((q: any) => String(q).trim()).filter((q: string) => q.length > 0).slice(0, 20)
      : []
    if (quotes.length === 0) {
      throw new Error('AI 未返回有效名言')
    }
    return { quotes }
  } catch (err: any) {
    if (err.message === 'AI 未返回有效名言') throw err
    throw new Error('AI 返回格式异常，无法解析')
  }
}

// ========== 公开 API ==========

// AI 智能分类
export async function aiCategorize(req: AiCategorizeRequest): Promise<AiCategorizeResponse> {
  const prompt = buildCategorizePrompt(req)
  const rawResponse = await callAi(prompt, 'You are a helpful assistant that categorizes bookmarks. Always respond in valid JSON format only.')
  return parseAiResponse(rawResponse)
}

// AI 智能元数据优化
export async function aiEnrichMetadata(req: AiEnrichRequest): Promise<AiEnrichResponse> {
  const prompt = buildEnrichPrompt(req)
  const rawResponse = await callAi(prompt, 'You are a helpful assistant that optimizes bookmark metadata. Always respond in valid JSON format only.')
  return parseAiEnrichResponse(rawResponse)
}

// AI 对话（智能助理）
export async function aiChat(req: AiChatRequest): Promise<AiChatResponse> {
  // 两阶段检索：先用关键词从数据库筛选相关书签，减少 Token 消耗
  const message = req.message

  // 1. 提取用户消息中的关键词（去除常用停用词）
  const stopWords = new Set([
    '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
    '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
    '自己', '这', '他', '她', '它', '吗', '什么', '怎么', '哪个', '哪些', '能',
    '可以', '请', '帮', '帮我', '找', '搜索', '查找', '推荐', '给我',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'like',
    'and', 'or', 'but', 'not', 'no', 'if', 'so', 'it', 'i', 'me', 'my',
    'find', 'search', 'show', 'get', 'what', 'which', 'how', 'where',
  ])

  const keywords = message
    .replace(/[^\w\u4e00-\u9fff]/g, ' ')  // 保留中英文字符
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.has(w.toLowerCase()))

  let bookmarks: any[] = []

  if (keywords.length > 0) {
    // 2. 用关键词搜索相关书签（LIKE 匹配标题、URL、描述、分类名）
    const likeConditions = keywords.map(() =>
      '(b.title LIKE ? OR b.url LIKE ? OR b.description LIKE ? OR c.name LIKE ?)'
    )
    const likeParams = keywords.flatMap(kw => {
      const pattern = `%${kw}%`
      return [pattern, pattern, pattern, pattern]
    })

    bookmarks = queryAll(`
      SELECT b.id, b.title, b.url, b.description, c.name as categoryName
      FROM bookmarks b
      LEFT JOIN categories c ON b.category = c.id
      WHERE ${likeConditions.join(' OR ')}
      ORDER BY b.createdAt DESC
      LIMIT 30
    `, likeParams)
  }

  // 3. 如果关键词匹配结果太少，补充最新的书签作为上下文
  if (bookmarks.length < 10) {
    const existingIds = new Set(bookmarks.map((b: any) => b.id))
    const recentBookmarks = queryAll(`
      SELECT b.id, b.title, b.url, b.description, c.name as categoryName
      FROM bookmarks b
      LEFT JOIN categories c ON b.category = c.id
      ORDER BY b.createdAt DESC
      LIMIT 20
    `)
    for (const bm of recentBookmarks) {
      if (!existingIds.has((bm as any).id)) {
        bookmarks.push(bm)
        existingIds.add((bm as any).id)
      }
      if (bookmarks.length >= 30) break
    }
  }

  const prompt = buildChatPrompt(req, bookmarks)
  const rawResponse = await callAi(prompt, 'You are NOWEN AI, a smart bookmark assistant. Be concise and helpful.')

  // 从回复中提取 [[bookmark:xxx]] 引用
  const bookmarkRefs: string[] = []
  const refRegex = /\[\[bookmark:([^\]]+)\]\]/g
  let match
  while ((match = refRegex.exec(rawResponse)) !== null) {
    bookmarkRefs.push(match[1])
  }

  // 查找引用的书签详情
  let referencedBookmarks: any[] = []
  if (bookmarkRefs.length > 0) {
    referencedBookmarks = bookmarks.filter((b: any) => bookmarkRefs.includes(b.id))
  }

  // 清理回复中的标记
  const cleanReply = rawResponse.replace(/\[\[bookmark:[^\]]+\]\]/g, '').trim()

  return {
    reply: cleanReply,
    bookmarks: referencedBookmarks.length > 0 ? referencedBookmarks : undefined,
  }
}

// AI 生成名言
export async function aiGenerateQuotes(req: AiGenerateQuotesRequest): Promise<AiGenerateQuotesResponse> {
  const prompt = buildGenerateQuotesPrompt(req)
  const rawResponse = await callAi(prompt, 'You are a quote generation expert. Always respond in valid JSON format only.')
  return parseAiQuotesResponse(rawResponse)
}

// AI 连接测试
export async function aiTestConnection(): Promise<{ success: boolean; message: string; model?: string }> {
  try {
    const config = getAiConfig()
    if (!config.provider) {
      return { success: false, message: '未配置 AI Provider' }
    }

    const rawResponse = await callAi(
      '请回复一个 JSON: {"status":"ok","message":"连接成功"}',
      'Reply with valid JSON only.'
    )

    let cleaned = rawResponse.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '')
    }

    const parsed = JSON.parse(cleaned)
    if (parsed.status === 'ok') {
      const defaultModels: Record<string, string> = {
        gemini: 'gemini-2.0-flash',
        deepseek: 'deepseek-chat',
        qwen: 'qwen-turbo',
        doubao: 'doubao-1-5-lite-32k-250115',
      }
      return {
        success: true,
        message: '连接成功',
        model: config.model || defaultModels[config.provider] || 'gpt-4o-mini',
      }
    }
    return { success: true, message: '连接成功（响应格式不标准但可用）', model: config.model || undefined }
  } catch (err: any) {
    return { success: false, message: err?.message || 'AI 连接失败' }
  }
}
