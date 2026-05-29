# NOWEN 一键收藏 · 浏览器扩展

将任意网页一键收藏到你自部署的 NOWEN 导航站，支持 **Chrome / Edge / Firefox / Brave / 其他 Chromium 浏览器**。

> ⚠️ 这不是上架商店的版本，是开发者模式加载的"绿色版"扩展。

## 安装方式

### Chrome / Edge / Brave / 其他 Chromium 浏览器

1. 打开扩展管理页：
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
2. 右上角打开 **开发者模式**
3. 点击 **加载已解压的扩展程序**，选择本目录（`extension/`）
4. 工具栏会出现 NOWEN 图标，右键页面也会有"收藏到 NOWEN"菜单

### Firefox

1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击 **临时载入附加组件**
3. 选择本目录中的 `manifest.json`
4. （重启 Firefox 后失效，开发者模式特性；正式发布需上架到 AMO）

## 配置

首次安装后请打开扩展的 **设置** 页：

| 字段 | 说明 |
|---|---|
| NOWEN 站点地址 | 形如 `https://nav.example.com`，**不要带末尾斜杠** |
| Admin Token | 可选。填写后直接走 API 保存，无需打开网页。可在 NOWEN admin 登录后从 localStorage 取出 `admin_token` |
| 默认可见性 | 公开 / 仅登录可见 |
| 默认分类 ID | 可选，从 NOWEN 后台分类管理处获取 |

## 使用方式

- **工具栏图标**：弹窗中可编辑标题/URL/备注后保存
- **右键菜单**：在页面/链接上右键 → "收藏到 NOWEN"
- **快捷键**：`Ctrl/Cmd + Shift + B` 一键收藏当前页面

## 技术细节

- 基于 Manifest V3
- 使用 `chrome.storage.sync` 保存配置（在 Chrome 账号同步下，多设备的扩展配置会同步）
- 调用 NOWEN 后端的 `POST /api/bookmarks` 接口
- 未配置 Token 时会回退到 `?action=add&url=&title=` 的网页方式
