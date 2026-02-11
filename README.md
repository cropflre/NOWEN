# NOWEN - 星云门户

> 一个集书签管理、系统监控于一体的极简主义个人导航站，采用深空美学与玻璃态设计风格，支持日间/夜间双模式，提供完整的硬件实时监控能力

![Version](https://img.shields.io/badge/version-0.1.7-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![Docker Hub](https://img.shields.io/badge/Docker%20Hub-cropflre%2Fnowen-blue)

## 🌐 在线演示 | Live Demo

**🔗 访问地址 / Access URL**: [http://118.145.185.221/](http://118.145.185.221/)

## 📖 文档 | Documentation

| 语言        | 文档                                |
| ----------- | ----------------------------------- |
| 🇨🇳 简体中文 | [README.md](./README.md) (当前文档) |
| 🇬🇧 English  | [README_EN.md](./README_EN.md)      |

---

## 📸 界面预览

### ☀️ 日间模式

<table>
  <tr>
    <td align="center" colspan="2"><b>桌面端首页 - 系统监控仪表盘</b></td>
  </tr>
  <tr>
    <td colspan="2"><img src="https://github.com/cropflre/NOWEN/raw/main/public/screenshots/light-desktop-monitor.png" alt="日间模式-系统监控" width="800"></td>
  </tr>
</table>

<table>
  <tr>
    <td align="center"><b>书签分类 & 侧边栏导航</b></td>
    <td align="center"><b>移动端首页</b></td>
  </tr>
  <tr>
    <td><img src="https://github.com/cropflre/NOWEN/raw/main/public/screenshots/light-desktop-bookmarks.png" alt="日间模式-书签分类" width="500"></td>
    <td><img src="https://github.com/cropflre/NOWEN/raw/main/public/screenshots/light-mobile.png" alt="日间模式-移动端" width="250"></td>
  </tr>
</table>

### 🌙 夜间模式

<table>
  <tr>
    <td align="center"><b>桌面端首页 - 深空美学</b></td>
    <td align="center"><b>移动端首页</b></td>
  </tr>
  <tr>
    <td><img src="https://github.com/cropflre/NOWEN/raw/main/public/screenshots/dark-desktop-monitor.png" alt="夜间模式-桌面端" width="500"></td>
    <td><img src="https://github.com/cropflre/NOWEN/raw/main/public/screenshots/dark-mobile.png" alt="夜间模式-移动端" width="250"></td>
  </tr>
</table>

### 🎛️ 功能亮点

| 功能               | 说明                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **天气 & 农历**    | 实时天气 19°C · 少云 · 75% 湿度 · 5.5m/s 风速 · 农历日期 · 立春节气                      |
| **侧边栏导航**     | 分类快速导航（开发/效率/设计/阅读/媒体等）· 智能高亮当前分类                             |
| **分类编辑**       | 悬停显示编辑按钮 ✏️ · 无需进入后台直接编辑                                               |
| **快速新增分类**   | 添加书签时内嵌创建分类 · 10 种预设颜色 · 实时刷新                                        |
| **系统监控**       | 引擎室 (CPU 57%/内存 89%/硬盘) · 硬件身份卡 · 核心脉搏 (温度 28°C) · 网络遥测 · 服务蜂巢 |
| **Dock 状态栏**    | SYSTEM ONLINE · CPU/MEM/温度/网速实时显示 · 可拖拽定位                                   |
| **移动端悬浮坞**   | 可展开菜单 · 搜索/添加/主题切换/应用入口                                                 |
| **稍后阅读**       | Hero 卡片展示 · 3D 卡片效果 · 列表视图 · 标记已读                                        |
| **访问统计**       | 点击追踪 · 热门排行 · 趋势图表 · 最近访问 · 数据清除                                     |
| **链接健康检查**   | 一键批量检测 · 死链识别 · 超时/重定向检测 · 响应时间统计 · 一键删除死链                   |
| **内外网切换**     | 书签支持双链接（内网/外网）· 自动检测网络环境 · 智能切换访问地址                          |
| **底部备案信息**   | 系统设置配置备案文本 · 支持 HTML 渲染 · 首页底部展示                                      |
| **壁纸背景**       | 自定义背景壁纸 · 上传/拖拽/URL/Picsum/Bing壁纸 · 模糊度和遮罩可调 · 光束效果叠加          |
| **数据管理**       | 导入/导出 JSON · 恢复出厂设置 · 导入成功自动返回首页                                     |

---

## 📋 目录

- [界面预览](#-界面预览)
- [功能特性](#-功能特性)
- [主题系统](#-主题系统)
- [技术栈](#️-技术栈)
- [项目结构](#-项目结构)
- [安装部署](#-安装部署)
  - [Windows 本地安装](#方式一windows-本地安装推荐新手)
  - [Docker 通用安装](#方式二docker-通用安装)
  - [群晖 NAS 安装](#方式三群晖-synology-nas-安装)
  - [绿联 NAS 安装](#方式四绿联-ugreennas-安装)
  - [飞牛 OS 安装](#方式五飞牛-os-fnos-安装)
  - [威联通 QNAP 安装](#方式六威联通-qnap-nas-安装)
  - [极空间 NAS 安装](#方式七极空间-nas-安装)
- [API 接口](#-api-接口)
- [快捷键](#️-快捷键)
- [常见问题](#-常见问题)
- [更新日志](#-更新日志)
- [许可证](#-许可证)

---

## ✨ 功能特性

### 🏠 首页展示

- **动态时钟**：实时显示时间（精确到秒），智能问候语（早安/午安/晚安等）
- **天气显示** (NEW)：实时天气信息、温度显示、天气图标（基于 Open-Meteo API）
- **农历日历** (NEW)：农历日期、节气、传统节日显示
- **名言展示**：随机名言轮播，支持系统默认名言与自定义名言
- **Aurora 极光背景**：沉浸式深空视觉效果
- **流星特效**：随机生成的流星动画，增添科幻氛围
- **系统监控仪表盘**：实时展示 CPU、内存、磁盘、网络、进程等硬件信息
- **精简模式**：禁用动画和特效，大幅降低 CPU/GPU 占用，适合性能受限设备
- **壁纸背景** (NEW)：自定义页面背景图片，支持上传/拖拽/URL/Picsum/Bing壁纸，可调模糊度和遮罩透明度

### 💻 系统监控 (NEW)

- **引擎室（系统监控卡）**：CPU 使用率、内存占用、硬盘空间、运行时间
- **硬件身份卡**：CPU 型号、主板信息、固件版本、内存大小、存储设备、显卡、操作系统
- **核心脉搏（生命体征卡）**：CPU/内存实时仪表盘、温度监控、LIVE 状态指示
- **网络遥测卡**：下载/上传速率、流量监控图表、IP 地址、连接状态
- **服务蜂巢（进程矩阵卡）**：Docker 容器状态、运行时间计时器、服务健康监控
- **Dock 迷你监控**：桌面端底部 SYSTEM ONLINE 状态栏，CPU/MEM/温度/网速实时显示
- **Ticker 状态栏**：移动端底部滚动状态栏
- **小部件可见性控制**：后台可单独控制每个监控组件的显示/隐藏
- **菜单可见性控制** (NEW)：后台可控制多语言切换、主题切换按钮的显示/隐藏

### 🔍 Spotlight 搜索

- **快捷键唤起**：`⌘/Ctrl + K` 全局呼出
- **多搜索引擎**：Google、Bing、百度、DuckDuckGo 一键切换
- **书签搜索**：快速搜索已收藏的书签
- **快速添加**：直接在搜索框中添加新书签

### 📚 书签管理

- **智能元数据抓取**：自动获取网站标题、描述、Favicon、OG 图片
- **分类管理**：自定义分类名称、图标及颜色
- **前端分类编辑** (NEW)：主页直接编辑/新建/删除分类，无需进入后台
- **快速新增分类** (NEW)：添加书签时可直接创建新分类，内嵌分类表单支持 10 种预设颜色
- **快速导航侧边栏** (NEW)：自动显示分类导航，快速定位，智能高亮当前分类
- **置顶功能**：常用书签置顶展示（Bento Grid 非对称布局）
- **稍后阅读**：Hero 卡片展示待读内容，支持已读标记、3D 卡片效果
- **拖拽排序**：基于 @dnd-kit 的流畅拖拽体验
- **右键菜单**：登录后支持快捷操作（编辑/删除/置顶等）
- **自定义图标**：支持三种图标模式（预设图标、自定义上传、URL 远程图片）
- **虚拟滚动**：超过 50 个书签时自动启用，优化大量数据渲染性能
- **链接健康检查** (NEW)：一键批量检测所有书签链接可访问性，支持死链识别与清理
- **内外网链接切换** (NEW)：书签支持配置内网/外网双链接，自动检测网络环境智能切换访问地址

### ⚙️ 后台管理

| 模块           | 功能                                                                    |
| -------------- | ----------------------------------------------------------------------- |
| **书签管理**   | 增删改查、批量操作、分类筛选、搜索过滤、虚拟滚动、快速修改分类          |
| **分类管理**   | 自定义分类名称、图标选择器、颜色选择器、拖拽排序                        |
| **图标管理**   | 上传自定义图标、图标预览、删除管理                                      |
| **名言管理**   | 自定义名言、系统默认名言开关                                            |
| **站点设置**   | 自定义网站名称和图标、精简模式开关、天气/农历开关、菜单可见性控制、底部备案信息配置 |
| **主题设置**   | 8 款预设主题、明/暗模式、自动切换、日夜动画切换、圆圈扩散动画           |
| **小部件设置** | 控制各监控组件的显示/隐藏、Beam 流光边框开关                            |
| **壁纸设置**   | 自定义背景壁纸、图片来源选择（上传/URL/Picsum/Bing）、模糊度和遮罩调节  |
| **安全设置**   | 密码修改、带强度指示器动画、首次登录强制改密、登录状态二次验证          |
| **数据管理**   | JSON 格式导入导出备份、恢复出厂设置、导入成功自动返回首页、嵌套对象支持 |
| **访问统计**   | 书签点击追踪、热门书签排行、访问趋势图、最近访问记录、数据清除          |
| **链接健康检查** | 批量检测书签链接可访问性、4 种状态识别（正常/异常/超时/重定向）、一键删除死链 |

### 🎨 视觉设计

- **玻璃态容器**：`backdrop-blur` + 透明边框的现代玻璃拟态
- **Border Beam**：流光边框动画效果（可后台开关）
- **3D 卡片**：鼠标追踪的 3D 透视效果
- **Spotlight 聚光灯**：卡片悬停光效
- **Toast 通知**：物理弹跳动画
- **主题过渡**：圆圈扩散动画切换效果
- **日间/夜间模式**：全面适配的双主题系统，Dock 菜单可快速切换
- **移动端适配**：响应式设计、可展开悬浮坞、Ticker 滚动状态栏
- **桌面端优化**：浮动 Dock 导航、迷你监控小部件、可拖拽菜单栏、侧边导航栏
- **精简模式**：关闭所有动画特效，大幅降低资源占用

---

## 🎨 主题系统

支持 **8 款精心设计的主题配色**，每款主题包含 20+ CSS 变量：

### 深色主题

| 主题                     | 描述               |
| ------------------------ | ------------------ |
| 🌌 **星云夜空** (Nebula) | 默认主题，紫青渐变 |
| 🔮 **极光幻影** (Aurora) | 极光色彩，神秘梦幻 |
| 🌊 **深海迷境** (Ocean)  | 深蓝色调，宁静深邃 |
| 🌲 **暗夜森林** (Forest) | 暗绿色调，自然沉稳 |

### 浅色主题

| 主题                       | 描述               |
| -------------------------- | ------------------ |
| ☀️ **晴空白昼** (Daylight) | 明亮清新，专业简洁 |
| 🌅 **日出暖阳** (Sunrise)  | 暖橙色调，温暖活力 |
| 🌸 **樱花粉黛** (Sakura)   | 粉色系，浪漫优雅   |
| 🍃 **薄荷清新** (Mint)     | 薄荷绿，清新自然   |

### 智能切换

- **手动切换**：后台设置页面选择
- **跟随系统**：自动适应系统暗色模式偏好
- **自动模式**：根据时间自动切换（6:00-18:00 浅色，其余深色）
- **可见性控制**：后台可控制主题切换按钮的显示/隐藏

---

## 🛠️ 技术栈

### 前端

| 技术                        | 版本   | 用途           |
| --------------------------- | ------ | -------------- |
| **React**                   | 18.3.1 | UI 框架        |
| **TypeScript**              | 5.6.2  | 类型安全       |
| **Vite**                    | 6.0.3  | 构建工具       |
| **Tailwind CSS**            | 3.4.16 | 原子化 CSS     |
| **Framer Motion**           | 11.15  | 动画效果       |
| **@dnd-kit**                | 6.3    | 拖拽排序       |
| **@tanstack/react-virtual** | 3.13   | 虚拟滚动       |
| **Lucide Icons**            | 0.468  | 图标库         |
| **Zod**                     | 4.3    | 数据验证       |
| **SWR**                     | 2.4    | 数据请求与缓存 |
| **lunar-javascript**        | 1.7    | 农历计算       |

### 后端

| 技术                  | 版本   | 用途                    |
| --------------------- | ------ | ----------------------- |
| **Express**           | 4.21.2 | Web 框架                |
| **sql.js**            | 1.11.0 | SQLite (WebAssembly)    |
| **systeminformation** | 5.23.5 | 系统硬件信息采集        |
| **Cheerio**           | 1.0.0  | HTML 解析（元数据抓取） |
| **bcryptjs**          | 3.0.3  | 密码加密                |
| **tsx**               | 4.19.2 | TypeScript 运行时       |

### 部署

| 技术               | 用途               |
| ------------------ | ------------------ |
| **Docker**         | 容器化             |
| **Docker Compose** | 编排               |
| **GitHub Actions** | CI/CD 自动构建推送 |
| **Nginx**          | 反向代理           |

---

## 📦 项目结构

```
NOWEN/
├── src/                              # 前端源码
│   ├── components/
│   │   ├── ui/                       # UI 组件库
│   │   │   ├── 3d-card.tsx           # 3D 卡片效果
│   │   │   ├── aurora-background.tsx # 极光背景
│   │   │   ├── bento-grid.tsx        # Bento 网格布局
│   │   │   ├── floating-dock.tsx     # 浮动 Dock 导航（桌面端，支持拖拽）
│   │   │   ├── mobile-floating-dock.tsx # 移动端悬浮坞
│   │   │   ├── spotlight-card.tsx    # 聚光灯卡片
│   │   │   ├── spotlight-search.tsx  # Spotlight 搜索面板
│   │   │   ├── effects.tsx           # 流星/星光特效
│   │   │   ├── advanced-effects.tsx  # Border Beam 流光等
│   │   │   ├── typewriter.tsx        # 打字机效果
│   │   │   └── scroll-to-top.tsx     # 回到顶部按钮
│   │   ├── admin/                    # 后台管理组件
│   │   │   ├── AdminSidebar.tsx      # 侧边导航栏
│   │   │   ├── SiteSettingsCard.tsx  # 站点设置
│   │   │   ├── ThemeCard.tsx         # 主题选择器
│   │   │   ├── WidgetSettingsCard.tsx # 小部件设置
│   │   │   ├── WallpaperSettingsCard.tsx # 壁纸设置
│   │   │   ├── SecurityCard.tsx      # 安全设置
│   │   │   ├── DataManagementCard.tsx # 数据管理
│   │   │   ├── QuotesCard.tsx        # 名言管理
│   │   │   ├── AnalyticsCard.tsx     # 访问统计
│   │   │   ├── HealthCheckCard.tsx   # 链接健康检查
│   │   │   └── Toast.tsx             # 消息通知
│   │   ├── monitor/                  # 系统监控组件
│   │   │   ├── SystemMonitor.tsx     # 统一监控接口
│   │   │   ├── MonitorDashboard.tsx  # 完整仪表盘
│   │   │   ├── MiniMonitor.tsx       # 迷你监控小部件
│   │   │   └── TickerMonitor.tsx     # 滚动状态栏
│   │   ├── SystemMonitorCard.tsx     # 系统监控卡
│   │   ├── HardwareIdentityCard.tsx  # 硬件身份卡
│   │   ├── VitalSignsCard.tsx        # 生命体征卡
│   │   ├── NetworkTelemetryCard.tsx  # 网络遥测卡
│   │   ├── ProcessMatrixCard.tsx     # 进程矩阵卡
│   │   ├── AddBookmarkModal.tsx      # 添加书签弹窗
│   │   ├── CategoryEditModal.tsx     # 分类编辑弹窗
│   │   ├── AdminLogin.tsx            # 登录页面
│   │   ├── ForcePasswordChange.tsx   # 强制修改密码
│   │   ├── BentoCard.tsx             # Bento 书签卡片
│   │   ├── BookmarkCard.tsx          # 书签卡片
│   │   ├── IconManager.tsx           # 图标管理器
│   │   ├── ContextMenu.tsx           # 右键菜单
│   │   ├── VirtualBookmarkList.tsx   # 虚拟滚动列表
│   │   ├── ErrorBoundary.tsx         # 错误边界
│   │   └── CommandPalette.tsx        # 命令面板
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── useBookmarkStore.ts       # 书签状态管理
│   │   ├── useTheme.tsx              # 主题系统（8 款主题）
│   │   ├── useTime.ts                # 时间、问候语、农历
│   │   ├── useWeather.ts             # 天气信息
│   │   └── useNetworkEnv.ts          # 网络环境检测（内外网切换）
│   ├── contexts/
│   │   └── AdminContext.tsx          # 后台管理上下文
│   ├── lib/                          # 工具库
│   │   ├── api.ts                    # API 封装
│   │   ├── icons.ts                  # 图标映射
│   │   ├── env.ts                    # 环境变量
│   │   ├── error-handling.ts         # 错误处理
│   │   └── utils.ts                  # 工具函数
│   ├── pages/
│   │   └── Admin.tsx                 # 后台管理页面
│   ├── types/
│   │   └── bookmark.ts               # 类型定义
│   ├── data/
│   │   └── quotes.ts                 # 名言数据
│   ├── __tests__/                    # 单元测试
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
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── metadata.ts           # URL 元数据抓取
│   │   ├── middleware/               # 中间件
│   │   ├── utils/                    # 工具函数
│   │   ├── index.ts                  # 服务入口
│   │   ├── db.ts                     # 数据库操作
│   │   └── schemas.ts                # 请求验证
│   └── data/
│       └── zen-garden.db             # SQLite 数据库文件
├── .github/
│   └── workflows/
│       └── docker-publish.yml        # GitHub Actions 自动构建
├── Dockerfile                        # Docker 镜像配置
├── docker-compose.yml                # Docker 编排配置
├── nginx.conf                        # Nginx 配置
├── vite.config.ts                    # Vite 配置
├── tailwind.config.js                # Tailwind 配置
├── vitest.config.ts                  # Vitest 测试配置
└── package.json                      # 项目依赖
```

---

## 🚀 安装部署

### 默认管理员账号

| 用户名 | 密码     |
| ------ | -------- |
| admin  | admin123 |

> ⚠️ **安全提示**：首次登录后请立即修改默认密码！

---

### 方式一：Windows 本地安装（推荐新手）

#### 📋 前置要求

- **Node.js 20+**：[下载地址](https://nodejs.org/)
- **Git**：[下载地址](https://git-scm.com/)

#### 🔧 安装步骤

**第一步：安装 Node.js**

1. 访问 https://nodejs.org/
2. 下载 **LTS 版本**（推荐 20.x 或更高）
3. 双击安装包，一路点击 **Next** 完成安装
4. 验证安装：打开命令提示符（Win+R 输入 `cmd`），输入：
   ```bash
   node -v
   npm -v
   ```
   如果显示版本号，说明安装成功

**第二步：下载项目**

```bash
# 打开命令提示符，进入你想存放项目的目录
cd D:\Projects

# 克隆项目
git clone https://github.com/cropflre/NOWEN.git

# 进入项目目录
cd NOWEN
```

**第三步：安装依赖**

```bash
# 安装前端依赖（在项目根目录）
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

**第四步：启动服务**

需要打开 **两个** 命令提示符窗口：

**窗口 1 - 启动后端服务：**

```bash
cd D:\Projects\NOWEN\server
npm run dev
```

看到 `Server running on port 3001` 表示后端启动成功

**窗口 2 - 启动前端服务：**

```bash
cd D:\Projects\NOWEN
npm run dev
```

看到 `Local: http://localhost:5173` 表示前端启动成功

**第五步：访问应用**

打开浏览器，访问 http://localhost:5173

#### 🎉 完成！

现在你可以：

1. 点击右下角 **管理** 图标进入后台
2. 使用默认账号 `admin` / `admin123` 登录
3. 开始添加你的书签！

#### ❓ 常见问题

**Q: npm install 报错？**

```bash
# 清除缓存重试
npm cache clean --force
npm install
```

**Q: 端口被占用？**

```bash
# 查看端口占用
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# 关闭占用进程或修改端口
```

---

### 方式二：Docker 通用安装

#### 📋 前置要求

- **Docker**：[安装指南](https://docs.docker.com/get-docker/)
- **Docker Compose**：通常随 Docker Desktop 一起安装

#### 🔧 安装步骤

**方法 A：使用 Docker Hub 镜像（推荐）**

```bash
# 直接从 Docker Hub 拉取镜像
docker pull cropflre/nowen:latest

# 创建 docker-compose.yml 文件
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  nowen:
    image: cropflre/nowen:latest
    container_name: nowen
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "3001:3001"
    volumes:
      - ./server/data:/app/server/data
      # 系统监控相关挂载（可选）
      - /:/host:ro
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - NODE_ENV=production
      - SI_FILESYSTEM_DISK_PREFIX=/host
      - PROC_PATH=/host/proc
      - SYS_PATH=/host/sys
      - FS_PATH=/host
    privileged: true  # 允许读取 CPU 温度等硬件信息
EOF

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

**方法 B：本地构建镜像**

```bash
# 1. 克隆项目
git clone https://github.com/cropflre/NOWEN.git
cd NOWEN

# 2. 构建并启动
docker-compose up -d --build

# 3. 查看日志
docker-compose logs -f
```

**方法 C：使用 Docker 命令**

```bash
# 直接运行容器
docker run -d \
  --name nowen \
  --restart unless-stopped \
  -p 3000:3000 \
  -p 3001:3001 \
  -v $(pwd)/data:/app/server/data \
  -v /:/host:ro \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e NODE_ENV=production \
  -e SI_FILESYSTEM_DISK_PREFIX=/host \
  -e PROC_PATH=/host/proc \
  -e SYS_PATH=/host/sys \
  -e FS_PATH=/host \
  --privileged \
  cropflre/nowen:latest
```

**访问应用**

- 前端页面：http://localhost:3000
- API 接口：http://localhost:3001

**常用命令**

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 更新到最新版本
docker-compose pull
docker-compose up -d

# 查看容器状态
docker ps
```

**系统监控说明**

要启用完整的系统监控功能，需要：

1. 挂载宿主机文件系统（只读）
2. 挂载 `/proc` 和 `/sys` 目录
3. 挂载 Docker socket（监控容器）
4. 使用 `privileged` 模式（读取温度等硬件信息）

如果不需要系统监控功能，可以移除相关挂载和环境变量，仅保留数据目录挂载即可。

---

### 方式三：群晖 (Synology) NAS 安装

#### 📋 前置要求

- 群晖 DSM 7.0 或更高版本
- 已安装 **Container Manager**（原 Docker）套件

#### 🔧 安装步骤

**第一步：安装 Container Manager**

1. 打开 **套件中心**
2. 搜索 `Container Manager`
3. 点击 **安装**

**第二步：下载项目文件**

1. 使用 File Station 在 `docker` 共享文件夹下创建 `nebula-portal` 目录
2. 将项目文件上传到该目录，或使用 SSH：

   ```bash
   # SSH 连接到 NAS
   ssh admin@你的NAS地址

   # 进入 docker 目录
   cd /volume1/docker

   # 克隆项目
   git clone https://github.com/cropflre/NOWEN.git nebula-portal
   ```

**第三步：使用 Container Manager 部署**

1. 打开 **Container Manager**
2. 点击左侧 **项目** → **新增**
3. 填写项目信息：
   - 项目名称：`nebula-portal`
   - 路径：选择 `/docker/nebula-portal`
   - 来源：选择 `docker-compose.yml`
4. 点击 **下一步** → **完成**

**第四步：访问应用**

- 访问地址：`http://NAS的IP地址:3000`

#### 🔧 群晖 GUI 方式（不使用命令行）

如果不想使用命令行，可以：

1. 在电脑上下载项目 ZIP 文件
2. 解压后通过 File Station 上传到 NAS 的 `/docker/nebula-portal` 目录
3. 按上述步骤在 Container Manager 中创建项目

---

### 方式四：绿联 (UGREENNAS) 安装

#### 📋 前置要求

- 绿联 NAS 已开启 Docker 功能
- UGOS Pro 系统

#### 🔧 安装步骤

**第一步：开启 Docker**

1. 打开 **应用中心**
2. 找到并安装 **Docker** 应用

**第二步：创建项目目录**

1. 打开 **文件管理**
2. 进入 `docker` 目录
3. 创建新文件夹 `nebula-portal`

**第三步：上传项目文件**

1. 在电脑上下载项目：https://github.com/cropflre/NOWEN/archive/refs/heads/main.zip
2. 解压文件
3. 通过文件管理上传到 `/docker/nebula-portal` 目录

**第四步：使用 Docker Compose 部署**

1. 打开 **Docker** 应用
2. 点击 **Compose** → **添加**
3. 选择 **本地路径**：`/docker/nebula-portal`
4. 系统会自动读取 `docker-compose.yml`
5. 点击 **部署**

**第五步：访问应用**

- 访问地址：`http://NAS的IP地址:3000`

#### 📝 手动配置（如果自动读取失败）

在 Docker Compose 编辑器中填入：

```yaml
version: "3.8"

services:
  nebula-portal:
    build: /docker/nebula-portal
    container_name: nebula-portal
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "3001:3001"
    volumes:
      - /docker/nebula-portal/server/data:/app/server/data
    environment:
      - NODE_ENV=production
```

---

### 方式五：飞牛 OS (fnOS) 安装

#### 📋 前置要求

- 飞牛 OS 系统
- 已安装 Docker 套件

#### 🔧 安装步骤

**第一步：安装 Docker**

1. 进入 **应用中心**
2. 搜索并安装 **Docker**

**第二步：SSH 连接到 NAS**

```bash
# 使用 SSH 工具连接
ssh root@你的NAS地址
```

**第三步：下载并部署项目**

```bash
# 进入 docker 存储目录
cd /vol1/1000/docker  # 路径可能因配置不同而异

# 克隆项目
git clone https://github.com/cropflre/NOWEN.git nebula-portal

# 进入项目目录
cd nebula-portal

# 构建并启动
docker-compose up -d --build
```

**第四步：访问应用**

- 访问地址：`http://NAS的IP地址:3000`

#### 🖥️ 通过飞牛 Web 界面部署

1. 打开 **Docker** 应用
2. 选择 **容器编排** 或 **Compose**
3. 点击 **添加** → **从路径创建**
4. 选择项目目录，点击部署

---

### 方式六：威联通 (QNAP) NAS 安装

#### 📋 前置要求

- QTS 5.0 或更高版本
- 已安装 **Container Station** 套件

#### 🔧 安装步骤

**第一步：安装 Container Station**

1. 打开 **App Center**
2. 搜索 `Container Station`
3. 点击安装

**第二步：创建项目目录**

1. 打开 **File Station**
2. 进入 `Container` 共享文件夹
3. 创建 `nebula-portal` 目录

**第三步：上传项目文件**

通过 File Station 上传项目文件，或使用 SSH：

```bash
# SSH 连接
ssh admin@你的NAS地址

# 进入目录
cd /share/Container

# 克隆项目
git clone https://github.com/cropflre/NOWEN.git nebula-portal
```

**第四步：部署应用**

1. 打开 **Container Station**
2. 点击 **应用程序** → **创建**
3. 选择 **Docker Compose**
4. 路径选择：`/Container/nebula-portal`
5. 点击 **创建**

**第五步：访问应用**

- 访问地址：`http://NAS的IP地址:3000`

---

### 方式七：极空间 NAS 安装

#### 📋 前置要求

- 极空间 NAS 设备
- 已开启 Docker 功能

#### 🔧 安装步骤

**第一步：开启 Docker**

1. 进入 **系统设置**
2. 开启 **Docker 服务**

**第二步：通过 SSH 部署**

```bash
# SSH 连接到极空间
ssh root@你的NAS地址

# 进入 docker 目录
cd /Volume1/docker  # 路径可能因配置不同

# 克隆项目
git clone https://github.com/cropflre/NOWEN.git nebula-portal

# 进入项目目录
cd nebula-portal

# 构建并启动
docker-compose up -d --build
```

**第三步：通过极空间 App 部署（可选）**

1. 打开极空间 Docker 管理应用
2. 选择 **Compose** → **添加项目**
3. 选择项目路径，点击部署

**第四步：访问应用**

- 访问地址：`http://NAS的IP地址:3000`

---

## 🔧 Docker 部署通用配置

### 端口映射说明

| 端口 | 用途          |
| ---- | ------------- |
| 3000 | 前端 Web 界面 |
| 3001 | 后端 API 接口 |

### 数据持久化

数据库文件位于容器内 `/app/server/data/zen-garden.db`

**重要**：务必将此目录映射到宿主机，否则容器重建后数据会丢失！

```yaml
volumes:
  - ./server/data:/app/server/data
```

### 系统监控配置

要启用完整的硬件监控功能，需要以下挂载和配置：

```yaml
volumes:
  # 挂载宿主机根目录（只读），读取文件系统信息
  - /:/host:ro
  # 挂载 proc 文件系统，读取 CPU、内存、进程信息
  - /proc:/host/proc:ro
  # 挂载 sys 文件系统，读取温度、硬件信息
  - /sys:/host/sys:ro
  # 挂载 Docker socket，监控容器状态
  - /var/run/docker.sock:/var/run/docker.sock

environment:
  # 告诉 systeminformation 从 /host 读取文件系统
  - SI_FILESYSTEM_DISK_PREFIX=/host
  - PROC_PATH=/host/proc
  - SYS_PATH=/host/sys
  - FS_PATH=/host

# 特权模式：允许读取 CPU 温度、SMART 磁盘信息
privileged: true
```

**注意**：

- 如果不需要系统监控功能，可以移除这些配置
- Windows 和 macOS 的 Docker Desktop 由于运行在虚拟机中，只能读取虚拟机的信息
- 最佳体验请在 Linux 宿主机上部署

### 环境变量

| 变量                      | 默认值     | 说明                     |
| ------------------------- | ---------- | ------------------------ |
| NODE_ENV                  | production | 运行环境                 |
| PORT                      | 3001       | 后端端口（一般无需修改） |
| SI_FILESYSTEM_DISK_PREFIX | /host      | 文件系统路径前缀         |
| PROC_PATH                 | /host/proc | proc 文件系统路径        |
| SYS_PATH                  | /host/sys  | sys 文件系统路径         |
| FS_PATH                   | /host      | 文件系统根路径           |

### 反向代理配置（Nginx 示例）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📡 API 接口

### 书签 API

| 方法   | 路径                       | 认证 | 说明         |
| ------ | -------------------------- | ---- | ------------ |
| GET    | `/api/bookmarks`           | ❌   | 获取所有书签 |
| GET    | `/api/bookmarks/paginated` | ❌   | 分页获取书签 |
| POST   | `/api/bookmarks`           | ❌   | 创建书签     |
| PATCH  | `/api/bookmarks/:id`       | ❌   | 更新书签     |
| DELETE | `/api/bookmarks/:id`       | ❌   | 删除书签     |
| PATCH  | `/api/bookmarks/reorder`   | ❌   | 重排序书签   |

### 分类 API

| 方法   | 路径                  | 认证 | 说明         |
| ------ | --------------------- | ---- | ------------ |
| GET    | `/api/categories`     | ❌   | 获取所有分类 |
| POST   | `/api/categories`     | ❌   | 创建分类     |
| PATCH  | `/api/categories/:id` | ❌   | 更新分类     |
| DELETE | `/api/categories/:id` | ❌   | 删除分类     |

### 名言 API

| 方法 | 路径          | 认证 | 说明                           |
| ---- | ------------- | ---- | ------------------------------ |
| GET  | `/api/quotes` | ❌   | 获取名言列表与默认名言开关状态 |
| PUT  | `/api/quotes` | ✅   | 更新名言列表与开关设置         |

### 管理员 API

| 方法 | 路径                         | 认证 | 说明                   |
| ---- | ---------------------------- | ---- | ---------------------- |
| POST | `/api/admin/login`           | ❌   | 登录（返回 JWT Token） |
| POST | `/api/admin/logout`          | ✅   | 退出登录               |
| GET  | `/api/admin/verify`          | ✅   | 验证 Token 有效性      |
| POST | `/api/admin/change-password` | ✅   | 修改密码               |

### 访问统计 API

| 方法   | 路径                 | 认证 | 说明                       |
| ------ | -------------------- | ---- | -------------------------- |
| POST   | `/api/visits/track`  | ❌   | 记录书签访问               |
| GET    | `/api/visits/stats`  | ✅   | 获取访问统计概览           |
| GET    | `/api/visits/top`    | ✅   | 获取热门书签排行           |
| GET    | `/api/visits/trend`  | ✅   | 获取访问趋势（按天）       |
| GET    | `/api/visits/recent` | ✅   | 获取最近访问记录           |
| DELETE | `/api/visits/clear`  | ✅   | 清除所有访问数据           |

### 健康检查 API

| 方法 | 路径                 | 认证 | 说明                           |
| ---- | -------------------- | ---- | ------------------------------ |
| POST | `/api/health-check`  | ✅   | 批量检测书签链接健康状态       |

### 其他 API

| 方法  | 路径                    | 认证 | 说明                           |
| ----- | ----------------------- | ---- | ------------------------------ |
| POST  | `/api/metadata`         | ❌   | 抓取 URL 元数据                |
| GET   | `/api/settings`         | ❌   | 获取站点设置（含小部件可见性） |
| PATCH | `/api/settings`         | ✅   | 更新站点设置（含小部件可见性） |
| GET   | `/api/system/info`      | ❌   | 获取系统基本信息               |
| GET   | `/api/system/stats`     | ❌   | 获取实时系统统计               |
| GET   | `/api/system/network`   | ❌   | 获取网络信息                   |
| GET   | `/api/system/processes` | ❌   | 获取进程列表                   |
| GET   | `/api/export`           | ✅   | 导出全部数据 (JSON)            |
| POST  | `/api/import`           | ✅   | 导入数据 (JSON)                |
| POST  | `/api/factory-reset`    | ✅   | 恢复出厂设置                   |

---

## ⌨️ 快捷键

| 快捷键       | 功能                    |
| ------------ | ----------------------- |
| `⌘/Ctrl + K` | 打开 Spotlight 搜索面板 |
| `⌘/Ctrl + N` | 快速新建书签            |
| `Esc`        | 关闭当前弹窗            |
| `↑/↓`        | 搜索结果导航            |
| `Enter`      | 确认选择/打开书签       |

---

## 🎯 核心亮点

### 1. **专业级主题系统**

- 8 款精心设计的预设主题（4 深色 + 4 浅色）
- 20+ CSS 变量精准控制每个视觉元素
- 圆圈扩散动画的丝滑主题切换
- 自动模式：跟随系统偏好或根据时间自动切换

### 2. **实时硬件监控**

- 基于 `systeminformation` 采集真实系统数据
- CPU、内存、磁盘、网络、进程完整监控
- 支持 CPU 温度、SMART 磁盘健康检测
- Docker 容器化部署仍可读取宿主机信息
- 可单独控制每个监控组件的显示/隐藏

### 3. **极致交互体验**

- Bento Grid 非对称布局
- 3D 卡片鼠标追踪效果
- Spotlight 聚光灯卡片
- Border Beam 流光边框
- 流星特效与极光背景
- 物理弹跳动画 Toast
- 桌面端 Dock 支持拖拽定位
- 移动端可展开悬浮坞 + Ticker 滚动状态栏
- 侧边栏快速导航（自动高亮、可折叠）
- 前端直接编辑分类（无需进后台）
- 精简模式可关闭所有动画（性能优先）

### 4. **智能书签管理**

- 自动抓取网站元数据（标题、描述、图标、OG 图片）
- 拖拽排序、右键菜单、虚拟滚动（50+书签自动启用）
- 置顶、稍后阅读（Hero 卡片 + 3D 效果）、自定义图标
- 分类管理、前端直接编辑分类
- **快速新增分类**：添加书签时可直接创建新分类
- 快速导航侧边栏
- 三种图标模式：预设图标、自定义上传、URL 远程图片
- 数据导入导出（支持嵌套对象）
- **链接健康检查**：批量检测死链，一键清理失效书签
- **内外网链接切换**：支持配置内网/外网双链接，自动检测网络环境智能切换
- **底部备案信息**：系统设置配置备案文本，首页底部展示
- **壁纸背景**：自定义页面背景壁纸，支持五种图源、模糊遮罩可调，叠加极光光束效果

### 5. **容器化部署**

- Docker 一键部署
- GitHub Actions 自动构建推送
- Docker Hub 官方镜像：`cropflre/nowen`
- 支持群晖、绿联、飞牛、威联通、极空间等 NAS

---

## 💾 数据库结构

### bookmarks 表

```sql
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  internalUrl TEXT,
  title TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  ogImage TEXT,
  category TEXT,
  tags TEXT,
  orderIndex INTEGER DEFAULT 0,
  isPinned INTEGER DEFAULT 0,
  isReadLater INTEGER DEFAULT 0,
  isRead INTEGER DEFAULT 0,
  createdAt TEXT,
  updatedAt TEXT
);
```

### categories 表

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  orderIndex INTEGER DEFAULT 0
);
```

### quotes 表

```sql
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  orderIndex INTEGER DEFAULT 0,
  createdAt TEXT
);
```

### visits 表

```sql
CREATE TABLE visits (
  id TEXT PRIMARY KEY,
  bookmarkId TEXT NOT NULL,
  visitedAt TEXT NOT NULL,
  FOREIGN KEY (bookmarkId) REFERENCES bookmarks(id) ON DELETE CASCADE
);
```

### settings 表 (键值对)

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updatedAt TEXT
);
```

### admins 表

```sql
CREATE TABLE admins (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  isDefaultPassword INTEGER DEFAULT 0,
  createdAt TEXT,
  updatedAt TEXT
);
```

---

## ❓ 常见问题

### 安装相关

**Q: Docker 构建失败？**

A: 国内网络可能无法访问 Docker Hub，建议直接使用已构建好的镜像：

```bash
docker pull cropflre/nowen:latest
```

或者配置 GitHub Actions 自动构建推送。

**Q: 容器启动后无法访问？**

A: 检查端口是否被占用：

```bash
# Linux/Mac
lsof -i :3000
lsof -i :3001

# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

**Q: 数据丢失？**

A: 确保正确配置了数据卷映射，数据库文件在 `/app/server/data` 目录。

### 系统监控相关

**Q: 为什么看不到硬件监控数据？**

A: 确保 docker-compose.yml 中配置了正确的挂载：

```yaml
volumes:
  - /:/host:ro
  - /proc:/host/proc:ro
  - /sys:/host/sys:ro
  - /var/run/docker.sock:/var/run/docker.sock
environment:
  - SI_FILESYSTEM_DISK_PREFIX=/host
  - PROC_PATH=/host/proc
  - SYS_PATH=/host/sys
  - FS_PATH=/host
privileged: true
```

**Q: Windows/macOS Docker Desktop 能看到真实硬件信息吗？**

A: 不能。Windows 和 macOS 的 Docker Desktop 运行在虚拟机中，只能读取虚拟机的信息。建议在 Linux 宿主机上部署以获得最佳体验。

**Q: 如何关闭系统监控功能？**

A: 在后台管理 → 站点设置 → 小部件设置 中，可以单独关闭每个监控组件。或者移除 docker-compose.yml 中的监控相关挂载。

### 使用相关

**Q: 忘记管理员密码？**

A: 使用恢复出厂设置功能，或直接删除数据库文件重新初始化。

**Q: 书签图标不显示？**

A: 部分网站可能有防盗链设置，可以手动上传自定义图标。

**Q: 如何备份数据？**

A:

1. 后台管理 → 系统设置 → 数据管理 → 导出备份
2. 或直接复制 `server/data/zen-garden.db` 文件

**Q: 如何更新到最新版本？**

A:

```bash
# 拉取最新镜像
docker-compose pull

# 重启容器
docker-compose up -d
```

---

## 📝 更新日志

### v0.1.7 (2026-02-11)

#### ✨ 新功能

- **壁纸背景功能**：自定义页面背景图片
  - 支持五种图片来源：本地上传/拖拽、URL 链接、Picsum 随机、Lorem Picsum、Bing 每日壁纸
  - 模糊度滑块（0-20px），通过 CSS `filter: blur()` 实现
  - 遮罩透明度滑块（0-100%），半透明黑色覆盖层
  - 实时预览（含模糊 + 遮罩效果）
  - 壁纸层独立渲染，极光/光束效果叠加可见
  - 后台管理新增壁纸设置 Tab（紫色渐变图标）
  - 默认关闭，不影响现有部署
  - 完整中英文国际化支持

#### 🐛 Bug 修复

- 修复滚动到页面底部时背景光束效果消失的问题（背景效果层改用 `fixed` 定位）
- 恢复光束碰撞底部爆炸粒子效果（使用 `useAnimationFrame` 精确检测碰撞位置）
- 替换已停服的 `source.unsplash.com` 图源为可用的 Picsum/Bing 图源

---

### v0.1.6 (2026-02-11)

#### ✨ 新功能

- **底部备案信息展示**：系统设置新增底部备案文本配置
  - 站点设置中新增备案信息文本输入框
  - 支持 HTML 渲染（如 ICP 备案号带链接）
  - 首页底部自动展示，未配置时隐藏
  - 完整中英文国际化支持
- **内外网链接自动切换**：书签支持配置内网/外网双链接
  - 书签新增内网 URL 字段，支持折叠式输入
  - 自动检测当前网络环境（内网/外网）
  - 基于 hostname 判断：私有 IP 段（10.x / 172.16-31.x / 192.168.x）及内网域名后缀（.local / .lan / .internal / .corp / .home）
  - 全局所有书签打开入口自动适配双链接逻辑（15 个组件、18+ 处 window.open 调用）
  - 编辑已有内网链接的书签时自动展开输入区域
  - 完整中英文国际化支持

---

### v0.1.5 (2026-02-11)

#### ✨ 新功能

- **链接健康检查（死链检测）**：完整的书签链接可访问性检测
  - 一键批量检测所有书签链接（并发 5 个，10s 超时）
  - 4 种状态识别：正常 / 异常 / 超时 / 重定向
  - 智能请求策略：先 HEAD 后 GET，自动处理 405/403 回退
  - 统计概览卡片：总计、各状态数量、平均响应时间
  - 按状态筛选过滤查看
  - 响应时间彩色指示（绿色 <1s / 黄色 <3s / 红色 >3s）
  - HTTP 状态码彩色标签（2xx/3xx/4xx/5xx）
  - 一键删除死链（异常和超时书签，带确认弹窗）
  - 完整中英文国际化支持

---

### v0.1.4 (2026-02-10)

#### ✨ 新功能

- **访问统计功能**：完整的书签访问数据分析
  - 书签点击自动追踪记录
  - 总访问次数、今日访问、活跃书签数统计
  - 热门书签排行榜（支持按天/周/月/全部筛选）
  - 7 天访问趋势图表
  - 最近访问记录列表
  - 一键清除所有访问数据

#### 🐛 Bug 修复

- 修复 sql.js 参数绑定问题，使用 queryAll/queryOne/run 工具函数
- 优化日间模式下访问统计卡片的样式显示

---

### v0.1.3 (2026-02-10)

#### ✨ 新功能

- **添加书签时快速新增分类**：在添加/编辑书签弹窗中可直接创建新分类
  - 内嵌分类创建表单，无需跳转
  - 10 种预设颜色选择器
  - 创建后自动选中新分类
  - 分类列表实时刷新

#### 🐛 Bug 修复

- 修复导入备份成功后书签管理页面显示空白的问题
- 导入备份成功后自动跳转到首页
- 修复恢复出厂设置后登录状态未清除的问题
- 修复 Docker 更新后数据库被重置的问题（使用绝对路径）
- 修复日间模式下创建分类按钮样式问题

---

### v0.1.2 (2026-02-05)

#### ✨ 新功能

- **菜单可见性控制**：后台站点设置新增菜单显示/隐藏开关
  - 多语言切换按钮：控制前台菜单栏的中英文切换按钮显示/隐藏
  - 主题切换按钮：控制前台菜单栏的日间/夜间模式切换按钮显示/隐藏
  - 支持桌面端 Dock 和移动端悬浮坞

---

### v0.1.1 (2026-02-04)

#### ✨ 新功能

- **前端分类编辑**：主页支持直接编辑/新建/删除分类，无需进入后台
  - 分类标题旁显示编辑按钮（hover 时可见）
  - 新增「新建分类」入口按钮
  - 分类编辑模态框支持图标、颜色选择
- **侧边栏快速导航**：自动显示分类导航，快速定位，智能高亮当前分类
  - 支持折叠/展开模式
  - 页面内容足够长时自动显示
  - 仅在桌面端显示
- **天气显示**：基于 Open-Meteo API 的实时天气信息
  - 显示当前温度和天气状况
  - 动态天气图标
  - 后台可开关
- **农历日历**：显示农历日期、节气、传统节日
  - 基于 lunar-javascript 准确计算
  - 后台可开关
- **精简模式**：性能优先的禅意体验
  - 关闭所有动画和特效
  - 大幅降低 CPU/GPU 占用
  - 适合性能受限设备
- **主题快速切换**：Dock 菜单新增日间/夜间模式切换图标
  - 动态显示 Sun/Moon 图标
  - 一键切换主题

#### 🔒 安全增强

- 后台管理页面增加二次登录验证
- 强制密码修改页面增加登录状态检查
- 未登录用户无法进入后台管理区域

#### 🐛 Bug 修复

- 修复侧边栏折叠功能按钮被截断的问题
- 修复 Zod v4 导入书签 schema 兼容性问题
- 修复导入数据时嵌套对象设置无法存储的问题
- 修复 CPU/GPU 过热问题（精简模式）

### v0.1.0 (2026-02-03)

#### 🎉 首次发布

**核心功能**

- ✨ 书签管理（增删改查、拖拽排序、虚拟滚动）
- ✨ 分类管理（自定义名称、图标、颜色）
- ✨ 图标管理（自定义图标上传）
- ✨ 名言管理（自定义名言 + 系统默认名言开关）
- ✨ Spotlight 搜索（多搜索引擎、书签搜索）
- ✨ 稍后阅读（Hero 卡片展示、已读标记）
- ✨ 置顶功能（Bento Grid 非对称布局）
- ✨ 右键菜单（快捷操作）

**系统监控**

- ✨ 实时硬件监控（CPU、内存、磁盘、网络、进程）
- ✨ 5 款监控卡片（系统监控、硬件身份、生命体征、网络遥测、进程矩阵）
- ✨ Dock 迷你监控小部件（桌面端）
- ✨ Ticker 滚动状态栏（移动端）
- ✨ 小部件可见性控制（后台单独开关）

**主题系统**

- ✨ 8 款预设主题（4 深色 + 4 浅色）
- ✨ 圆圈扩散动画切换
- ✨ 自动模式（跟随系统或根据时间）
- ✨ 20+ CSS 变量精准控制

**后台管理**

- ✨ 完整的后台管理系统
- ✨ 站点设置（自定义网站名称和图标）
- ✨ 主题设置（8 款主题切换）
- ✨ 小部件设置（控制显示/隐藏、Beam 开关）
- ✨ 安全设置（密码修改、强度指示器、首次登录强制改密）
- ✨ 数据管理（导入导出、恢复出厂设置）

**视觉设计**

- ✨ 日间/夜间双模式全面适配
- ✨ 玻璃态设计
- ✨ Border Beam 流光边框
- ✨ 3D 卡片鼠标追踪
- ✨ Spotlight 聚光灯效果
- ✨ 流星与极光特效
- ✨ 物理弹跳 Toast

**交互优化**

- ✨ 桌面端浮动 Dock 支持拖拽定位
- ✨ 移动端可展开悬浮坞
- ✨ 回到顶部按钮
- ✨ 错误边界处理

**部署支持**

- ✨ Docker 容器化部署
- ✨ GitHub Actions CI/CD 自动构建
- ✨ Docker Hub 官方镜像
- ✨ 支持各类 NAS 平台

---

## 🎯 未来计划

- [ ] 多用户支持与权限管理
- [ ] 书签标签系统完善
- [ ] 书签分享功能
- [ ] 浏览器扩展（Chrome/Firefox）
- [ ] PWA 离线支持
- [ ] 更多主题配色
- [x] ~~访问统计分析~~ ✅ v0.1.4 已实现
- [x] ~~链接健康检查~~ ✅ v0.1.5 已实现
- [x] ~~自定义壁纸背景~~ ✅ v0.1.7 已实现
- [ ] WebDAV 同步支持
- [ ] 系统监控告警功能
- [ ] 自定义监控指标
- [ ] 移动端 App

---

## 🚀 快速开始

```bash
# 使用 Docker Hub 镜像（推荐）
docker pull cropflre/nowen:latest
docker run -d -p 3000:3000 -p 3001:3001 -v ./data:/app/server/data --name nowen cropflre/nowen:latest

# 访问应用
# http://localhost:3000

# 默认管理员账号
# 用户名: admin
# 密码: admin123
```

---

## 📄 许可证

MIT License

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 🙏 致谢

- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [sql.js](https://sql.js.org/)
- [systeminformation](https://github.com/sebhildebrandt/systeminformation)
- [dnd-kit](https://dndkit.com/)

---

## 🌟 Star History

如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/cropflre">cropflre</a>
</p>
