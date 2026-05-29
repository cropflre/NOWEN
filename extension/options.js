const api = (typeof browser !== 'undefined') ? browser : chrome;

const $url = document.getElementById('nowenUrl');
const $token = document.getElementById('nowenToken');
const $vis = document.getElementById('defaultVisibility');
const $cat = document.getElementById('defaultCategory');
const $save = document.getElementById('save-btn');
const $test = document.getElementById('test-btn');
const $status = document.getElementById('status');

function showStatus(msg, type = 'success') {
  $status.textContent = msg;
  $status.className = 'status ' + type;
}

// 加载已保存的配置
api.storage.sync.get(['nowenUrl', 'nowenToken', 'defaultCategory', 'defaultVisibility'], (data) => {
  $url.value = data.nowenUrl || '';
  $token.value = data.nowenToken || '';
  $cat.value = data.defaultCategory || '';
  $vis.value = data.defaultVisibility || 'public';
});

$save.addEventListener('click', () => {
  const cleanUrl = $url.value.trim().replace(/\/+$/, '');
  api.storage.sync.set({
    nowenUrl: cleanUrl,
    nowenToken: $token.value.trim(),
    defaultCategory: $cat.value.trim(),
    defaultVisibility: $vis.value,
  }, () => {
    showStatus('✅ 设置已保存', 'success');
  });
});

$test.addEventListener('click', async () => {
  const cleanUrl = $url.value.trim().replace(/\/+$/, '');
  if (!cleanUrl) {
    showStatus('请先填写 NOWEN 地址', 'error');
    return;
  }
  const token = $token.value.trim();
  $test.disabled = true;
  $test.textContent = '测试中...';
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const resp = await fetch(`${cleanUrl}/api/bookmarks`, { headers });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const data = await resp.json().catch(() => null);
    const count = Array.isArray(data) ? data.length : 0;
    showStatus(`✅ 连接成功，已读取 ${count} 个书签`, 'success');
  } catch (err) {
    showStatus(`❌ 连接失败：${err.message || err}`, 'error');
  } finally {
    $test.disabled = false;
    $test.textContent = '测试连接';
  }
});
