/**
 * NOWEN 浏览器扩展 - Background Service Worker
 *
 * 职责：
 *   1. 注册右键菜单 / 快捷键 / 工具栏图标点击事件
 *   2. 调用 NOWEN 后端 API 直接创建书签（无需打开网页）
 *   3. 鉴权：使用用户在 options 中保存的 NOWEN admin token
 */

// 兼容 Chromium (chrome.*) 和 Firefox (browser.*)
const api = (typeof browser !== 'undefined') ? browser : chrome;

// ===== 工具函数 =====
async function getConfig() {
  return new Promise((resolve) => {
    api.storage.sync.get(['nowenUrl', 'nowenToken', 'defaultCategory', 'defaultVisibility'], (data) => {
      resolve({
        nowenUrl: (data.nowenUrl || '').trim().replace(/\/+$/, ''),
        nowenToken: (data.nowenToken || '').trim(),
        defaultCategory: data.defaultCategory || '',
        defaultVisibility: data.defaultVisibility || 'public',
      });
    });
  });
}

function showNotification(title, message) {
  try {
    api.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title,
      message,
    });
  } catch (_) {
    // notifications 权限未声明时的兜底
    console.log('[NOWEN]', title, message);
  }
}

/**
 * 直接通过 NOWEN API 创建书签
 * 失败时回退到打开网页方式
 */
async function saveBookmarkDirect(tab) {
  const cfg = await getConfig();

  // 未配置：打开 options 页让用户配置
  if (!cfg.nowenUrl) {
    api.runtime.openOptionsPage();
    return;
  }

  const targetUrl = tab.url;
  const targetTitle = tab.title || targetUrl;

  // 没有 Token：直接走网页方式（用户需要在浏览器里登录 NOWEN）
  if (!cfg.nowenToken) {
    const fallback = `${cfg.nowenUrl}/?action=add&url=${encodeURIComponent(targetUrl)}&title=${encodeURIComponent(targetTitle)}`;
    api.tabs.create({ url: fallback });
    return;
  }

  // 直接调用 API 创建
  try {
    const resp = await fetch(`${cfg.nowenUrl}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.nowenToken}`,
      },
      body: JSON.stringify({
        url: targetUrl,
        title: targetTitle,
        category: cfg.defaultCategory || undefined,
        visibility: cfg.defaultVisibility,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status}: ${txt.slice(0, 100)}`);
    }

    showNotification('已收藏', `「${targetTitle}」已保存到 NOWEN`);
  } catch (err) {
    console.warn('[NOWEN] 直接保存失败，回退到网页方式:', err);
    const fallback = `${cfg.nowenUrl}/?action=add&url=${encodeURIComponent(targetUrl)}&title=${encodeURIComponent(targetTitle)}`;
    api.tabs.create({ url: fallback });
  }
}

// ===== 右键菜单 =====
api.runtime.onInstalled.addListener(() => {
  try {
    api.contextMenus.create({
      id: 'nowen-save-page',
      title: '收藏到 NOWEN',
      contexts: ['page'],
    });
    api.contextMenus.create({
      id: 'nowen-save-link',
      title: '将此链接收藏到 NOWEN',
      contexts: ['link'],
    });
  } catch (_) {}
});

api.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'nowen-save-page') {
    await saveBookmarkDirect(tab);
  } else if (info.menuItemId === 'nowen-save-link') {
    await saveBookmarkDirect({ url: info.linkUrl, title: info.linkUrl });
  }
});

// ===== 快捷键 =====
api.commands.onCommand.addListener(async (command) => {
  if (command === 'save-current-page') {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    if (tab) await saveBookmarkDirect(tab);
  }
});

// ===== 接收来自 popup 的消息 =====
api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'NOWEN_SAVE_TAB' && msg.tab) {
    saveBookmarkDirect(msg.tab).then(() => sendResponse({ ok: true })).catch(e => sendResponse({ ok: false, error: String(e) }));
    return true; // async response
  }
});
