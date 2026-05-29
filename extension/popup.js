const api = (typeof browser !== 'undefined') ? browser : chrome;

const $title = document.getElementById('title');
const $url = document.getElementById('url');
const $desc = document.getElementById('description');
const $save = document.getElementById('save-btn');
const $cancel = document.getElementById('cancel-btn');
const $status = document.getElementById('status');
const $openOptions = document.getElementById('open-options');
const $openSite = document.getElementById('open-site');

function showStatus(msg, type = 'success') {
  $status.textContent = msg;
  $status.className = 'status ' + type;
}

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

(async function init() {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    $title.value = tab.title || '';
    $url.value = tab.url || '';
  }
  const cfg = await getConfig();
  if (!cfg.nowenUrl) {
    showStatus('尚未配置 NOWEN 站点，请先到「设置」填写。', 'error');
    $save.disabled = true;
  }
})();

$save.addEventListener('click', async () => {
  const cfg = await getConfig();
  if (!cfg.nowenUrl) {
    showStatus('请先在设置中填写 NOWEN 地址', 'error');
    return;
  }

  const url = $url.value.trim();
  const title = $title.value.trim() || url;
  const description = $desc.value.trim();

  if (!url) {
    showStatus('URL 不能为空', 'error');
    return;
  }

  $save.disabled = true;
  $save.textContent = '保存中...';

  try {
    if (cfg.nowenToken) {
      // 走后端 API
      const resp = await fetch(`${cfg.nowenUrl}/api/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.nowenToken}`,
        },
        body: JSON.stringify({
          url,
          title,
          description: description || undefined,
          category: cfg.defaultCategory || undefined,
          visibility: cfg.defaultVisibility,
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status}: ${txt.slice(0, 120)}`);
      }
      showStatus('已保存到 NOWEN', 'success');
      setTimeout(() => window.close(), 800);
    } else {
      // 没有 Token：通过 URL 参数让网页处理
      const target = `${cfg.nowenUrl}/?action=add&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
      api.tabs.create({ url: target });
      window.close();
    }
  } catch (err) {
    showStatus('保存失败：' + (err.message || err), 'error');
    $save.disabled = false;
    $save.textContent = '保存';
  }
});

$cancel.addEventListener('click', () => window.close());

$openOptions.addEventListener('click', (e) => {
  e.preventDefault();
  api.runtime.openOptionsPage();
});

$openSite.addEventListener('click', async (e) => {
  e.preventDefault();
  const cfg = await getConfig();
  if (cfg.nowenUrl) api.tabs.create({ url: cfg.nowenUrl });
});
