# NOWEN - 星云门户

> 一个集书签管理、系统监控于一体的极简主义个人导航站，采用深空美学与玻璃态设计风格，支持日间/夜间双模式，提供完整的硬件实时监控能力

![Version](https://img.shields.io/badge/version-0.1.6-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)

---

## ✨ 功能特性

### 🏠 首页展示
- **动态时钟**：实时显示时间（精确到秒），智能问候语
- **天气显示**：实时天气信息、温度显示、天气图标（基于 Open-Meteo API）
- **农历日历**：农历日期、节气、传统节日显示
- **名言展示**：随机名言轮播，支持系统默认名言与自定义名言
- **Aurora 极光背景**：沉浸式深空视觉效果
- **流星特效**：随机生成的流星动画
- **系统监控仪表盘**：实时展示 CPU、内存、磁盘、网络、进程等硬件信息
- **精简模式**：禁用动画和特效，大幅降低 CPU/GPU 占用
- **底部备案信息**：支持配置 ICP 备案文本，HTML 渲染展示

### 💻 系统监控
- **引擎室**：CPU 使用率、内存占用、硬盘空间、运行时间
- **硬件身份卡**：CPU 型号、主板信息、固件版本、内存大小、存储设备、显卡、操作系统
- **核心脉搏**：CPU/内存实时仪表盘、温度监控、LIVE 状态指示
- **网络遥测卡**：下载/上传速率、流量监控图表、IP 地址、连接状态
- **服务蜂巢**：Docker 容器状态、运行时间计时器、服务健康监控
- **Dock 迷你监控**：桌面端底部 SYSTEM ONLINE 状态栏
- **Ticker 状态栏**：移动端底部滚动状态栏
- **小部件可见性控制**：后台可单独控制每个监控组件的显示/隐藏

### 🔍 Spotlight 搜索
- **快捷键唤起**：`⌘/Ctrl + K` 全局呼出
- **多搜索引擎**：Google、Bing、百度、DuckDuckGo 一键切换
- **书签搜索**：快速搜索已收藏的书签
- **快速添加**：直接在搜索框中添加新书签

### 📚 书签管理
- **智能元数据抓取**：自动获取网站标题、描述、Favicon、OG 图片
- **分类管理**：自定义分类名称、图标及颜色
- **前端分类编辑**：主页直接编辑/新建/删除分类，无需进入后台
- **快速新增分类**：添加书签时可直接创建新分类
- **快速导航侧边栏**：自动显示分类导航，快速定位，智能高亮
- **置顶功能**：常用书签置顶展示（Bento Grid 非对称布局）
- **稍后阅读**：Hero 卡片展示待读内容，支持已读标记、3D 卡片效果
- **拖拽排序**：基于 @dnd-kit 的流畅拖拽体验
- **右键菜单**：登录后支持快捷操作
- **自定义图标**：支持预设图标、自定义上传、URL 远程图片
- **虚拟滚动**：超过 50 个书签时自动启用
- **链接健康检查**：一键批量检测书签链接可访问性，死链识别与清理
- **内外网链接切换**：书签支持配置内网/外网双链接，自动检测网络环境智能切换

### ⚙️ 后台管理
| 模块           | 功能                                                                    |
| -------------- | ----------------------------------------------------------------------- |
| **书签管理**   | 增删改查、批量操作、分类筛选、搜索过滤、虚拟滚动                        |
| **分类管理**   | 自定义分类名称、图标选择器、颜色选择器、拖拽排序                        |
| **图标管理**   | 上传自定义图标、图标预览、删除管理                                      |
| **名言管理**   | 自定义名言、系统默认名言开关                                            |
| **站点设置**   | 自定义网站名称和图标、精简模式、天气/农历开关、菜单可见性、底部备案信息  |
| **主题设置**   | 8 款预设主题、明/暗模式、自动切换、圆圈扩散动画                         |
| **小部件设置** | 控制各监控组件的显示/隐藏、Beam 流光边框开关                            |
| **安全设置**   | 密码修改、强度指示器、首次登录强制改密、登录状态二次验证                |
| **数据管理**   | JSON 格式导入导出备份、恢复出厂设置                                     |
| **访问统计**   | 书签点击追踪、热门排行、访问趋势图、最近访问记录                        |
| **链接健康检查** | 批量检测书签链接可访问性、4 种状态识别、一键删除死链                   |

### 🎨 视觉设计
- **玻璃态容器**：`backdrop-blur` + 透明边框的现代玻璃拟态
- **Border Beam**：流光边框动画效果
- **3D 卡片**：鼠标追踪的 3D 透视效果
- **8 款主题配色**：4 深色 + 4 浅色，20+ CSS 变量
- **日间/夜间模式**：全面适配的双主题系统
- **移动端适配**：响应式设计、可展开悬浮坞、Ticker 滚动状态栏
- **桌面端优化**：浮动 Dock 导航、迷你监控、可拖拽菜单栏、侧边导航
- **精简模式**：关闭所有动画特效，降低资源占用

---

## 🛠️ 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18.3.1 | UI 框架 |
| **TypeScript** | 5.6.2 | 类型安全 |
| **Vite** | 6.0.3 | 构建工具 |
| **Tailwind CSS** | 3.4.16 | 原子化 CSS |
| **Framer Motion** | 11.15 | 动画效果 |
| **@dnd-kit** | 6.3 | 拖拽排序 |
| **@tanstack/react-virtual** | 3.13 | 虚拟滚动 |
| **Lucide Icons** | 0.468 | 图标库 |
| **Zod** | 4.3 | 数据验证 |
| **SWR** | 2.4 | 数据请求与缓存 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| **Express** | 4.21.2 | Web 框架 |
| **sql.js** | 1.11.0 | SQLite (WebAssembly) |
| **systeminformation** | 5.23.5 | 系统硬件信息采集 |
| **Cheerio** | 1.0.0 | HTML 解析（元数据抓取）|
| **bcryptjs** | 3.0.3 | 密码加密 |
| **tsx** | 4.19.2 | TypeScript 运行时 |

### 部署
| 技术 | 用途 |
|------|------|
| **Docker** | 容器化 |
| **Docker Compose** | 编排 |
| **GitHub Actions** | CI/CD 自动构建推送 |
| **Nginx** | 反向代理 |

---

## 📦 项目结构

```
NOWEN/
├── src/                              # 前端源码
│   ├── components/
│   │   ├── ui/                       # UI 组件库
│   │   ├── admin/                    # 后台管理组件
│   │   ├── monitor/                  # 系统监控组件
│   │   ├── home/                     # 首页组件
│   │   ├── AddBookmarkModal.tsx      # 添加书签弹窗
│   │   ├── CategoryEditModal.tsx     # 分类编辑弹窗
│   │   ├── BookmarkCard.tsx          # 书签卡片
│   │   ├── BentoCard.tsx             # Bento 书签卡片
│   │   ├── IconRenderer.tsx          # 图标渲染器
│   │   ├── IconifyPicker.tsx         # Iconify 图标选择器
│   │   ├── ContextMenu.tsx           # 右键菜单
│   │   ├── VirtualBookmarkList.tsx   # 虚拟滚动列表
│   │   └── CommandPalette.tsx        # 命令面板
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── useBookmarkStore.ts       # 书签状态管理
│   │   ├── useTheme.tsx              # 主题系统（8 款主题）
│   │   ├── useTime.ts                # 时间、问候语、农历
│   │   ├── useWeather.ts             # 天气信息
│   │   └── useNetworkEnv.ts          # 网络环境检测（内外网切换）
│   ├── contexts/
│   │   └── AdminContext.tsx           # 后台管理上下文
│   ├── lib/                          # 工具库
│   │   ├── api.ts                    # API 封装
│   │   ├── icons.ts                  # 图标映射
│   │   ├── env.ts                    # 环境变量
│   │   ├── error-handling.ts         # 错误处理
│   │   └── utils.ts                  # 工具函数
│   ├── locales/                      # 国际化
│   │   ├── zh.json                   # 中文
│   │   └── en.json                   # 英文
│   ├── pages/
│   │   └── Admin.tsx                 # 后台管理页面
│   ├── types/
│   │   └── bookmark.ts               # 类型定义
│   ├── data/
│   │   └── quotes.ts                 # 名言数据
│   ├── App.tsx                       # 主应用
│   └── index.css                     # 全局样式与 CSS 变量
├── server/                           # 后端源码
│   ├── src/
│   │   ├── routes/                   # 路由模块
│   │   │   ├── bookmarks.ts          # 书签路由
│   │   │   ├── categories.ts         # 分类路由
│   │   │   ├── quotes.ts             # 名言路由
│   │   │   ├── admin.ts              # 管理员路由
│   │   │   ├── settings.ts           # 设置路由
│   │   │   ├── system.ts             # 系统监控路由
│   │   │   ├── visits.ts             # 访问统计路由
│   │   │   ├── health-check.ts       # 链接健康检查路由
│   │   │   └── metadata.ts           # 元数据路由
│   │   ├── services/
│   │   │   └── metadata.ts           # URL 元数据抓取
│   │   ├── middleware/               # 中间件
│   │   ├── utils/                    # 工具函数
│   │   ├── index.ts                  # 服务入口
│   │   ├── db.ts                     # 数据库操作
│   │   └── schemas.ts                # 请求验证
│   └── data/
│       └── zen-garden.db             # SQLite 数据库文件
├── Dockerfile                        # Docker 镜像配置
├── docker-compose.yml                # Docker 编排配置
├── nginx.conf                        # Nginx 配置
├── vite.config.ts                    # Vite 配置
├── tailwind.config.js                # Tailwind 配置
└── package.json                      # 项目依赖
```

---

## 🚀 安装部署

### 默认管理员账号
- 用户名：`admin`
- 密码：`admin123`

### 方式一：本地开发

```bash
# 克隆项目
git clone https://github.com/cropflre/NOWEN.git
cd NOWEN

# 安装依赖
npm install
cd server && npm install && cd ..

# 终端 1：启动后端 (端口 3001)
cd server && npm run dev

# 终端 2：启动前端 (端口 5173)
npm run dev
```

### 方式二：Docker 部署

```bash
# 使用 Docker Hub 镜像
docker pull cropflre/nowen:latest
docker run -d -p 3000:3000 -p 3001:3001 -v ./data:/app/server/data --name nowen cropflre/nowen:latest

# 或使用 Docker Compose
docker-compose up -d --build
```

- 前端：http://localhost:3000
- 后端：http://localhost:3001

---

## 📡 API 接口

### 书签
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/bookmarks` | 获取所有书签 |
| GET | `/api/bookmarks/paginated` | 分页获取书签 |
| POST | `/api/bookmarks` | 创建书签 |
| PATCH | `/api/bookmarks/:id` | 更新书签 |
| DELETE | `/api/bookmarks/:id` | 删除书签 |
| PATCH | `/api/bookmarks/reorder` | 重排序 |

### 分类
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/categories` | 获取所有分类 |
| POST | `/api/categories` | 创建分类 |
| PATCH | `/api/categories/:id` | 更新分类 |
| DELETE | `/api/categories/:id` | 删除分类 |

### 管理员
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/login` | 登录 |
| POST | `/api/admin/logout` | 退出 |
| GET | `/api/admin/verify` | 验证 Token |
| POST | `/api/admin/change-password` | 修改密码 |

### 其他
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/metadata` | 抓取 URL 元数据 |
| GET | `/api/settings` | 获取站点设置 |
| PATCH | `/api/settings` | 更新站点设置 |
| GET | `/api/system/info` | 获取系统信息 |
| GET | `/api/system/stats` | 获取实时统计 |
| POST | `/api/visits/track` | 记录书签访问 |
| GET | `/api/visits/stats` | 获取访问统计 |
| POST | `/api/health-check` | 批量检测链接健康 |
| GET | `/api/export` | 导出数据 |
| POST | `/api/import` | 导入数据 |
| POST | `/api/factory-reset` | 恢复出厂设置 |

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `⌘/Ctrl + K` | 打开搜索面板 |
| `⌘/Ctrl + N` | 新建书签 |
| `Esc` | 关闭弹窗 |
| `↑/↓` | 搜索结果导航 |
| `Enter` | 确认选择/打开书签 |

---

## 📄 许可证

MIT License
