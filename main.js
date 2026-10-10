/**
 * EdgeEver Web Companion Plugin (网页伴侣)
 * 官方标准嵌入架构：基于 context.editor.embeds.register 与 context.editor.insertEmbed
 * v1.2.0 - 视觉大重构：极简Mac精致顶栏、移除常驻按钮、支持编辑标题与链接属性
 */

console.log(
  "%c[EdgeEver Web Companion] v1.2.0 Loaded - Minimalist Mac Aesthetic & Property Settings",
  "background:#38bdf8;color:#000;font-weight:bold;padding:2px 6px;border-radius:3px;"
);

// 清理历史残留
if (window.__edgeever_wc_observer) {
  try {
    window.__edgeever_wc_observer.disconnect();
  } catch (_) {}
  window.__edgeever_wc_observer = null;
}

document.querySelectorAll(
  ".edgeever-wc-topbar, .edgeever-wc-bind-trigger, .edgeever-wc-web-pane, .edgeever-wc-resizer, .edgeever-wc-modal-backdrop, .edgeever-web-floating-trigger"
).forEach((el) => {
  try { el.remove(); } catch (_) {}
});

// ==================== 1. 样式内联注入器 ====================

const INJECTED_CSS = `
.edgeever-web-embed-block {
  display: block !important;
  width: 100% !important;
  margin: 14px 0 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 10px !important;
  background: #13161c !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35) !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  user-select: none !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
}

.edgeever-web-embed-block:hover {
  border-color: rgba(56, 189, 248, 0.25) !important;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45) !important;
}

.edgeever-web-embed-bar {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: space-between !important;
  height: 34px !important;
  padding: 0 10px !important;
  background: rgba(22, 26, 33, 0.85) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
  gap: 8px !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif !important;
  box-sizing: border-box !important;
}

.edgeever-web-embed-left {
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
  min-width: 0 !important;
  cursor: pointer !important;
}

.edgeever-web-tag {
  font-size: 10px !important;
  font-weight: 700 !important;
  padding: 1.5px 5px !important;
  background: rgba(56, 189, 248, 0.15) !important;
  color: #38bdf8 !important;
  border-radius: 3px !important;
  letter-spacing: 0.5px !important;
  white-space: nowrap !important;
  line-height: 1 !important;
}

.edgeever-web-title-wrap {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  min-width: 0 !important;
  padding: 2px 5px !important;
  border-radius: 4px !important;
  transition: background 0.15s ease !important;
}

.edgeever-web-title-wrap:hover {
  background: rgba(255, 255, 255, 0.08) !important;
}

.edgeever-web-domain-title {
  font-size: 12px !important;
  font-weight: 500 !important;
  color: #e2e8f0 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 320px !important;
  line-height: 1.2 !important;
}

.edgeever-web-edit-hint {
  font-size: 10.5px !important;
  color: #64748b !important;
  opacity: 0 !important;
  transition: opacity 0.15s ease !important;
}

.edgeever-web-title-wrap:hover .edgeever-web-edit-hint {
  opacity: 1 !important;
  color: #38bdf8 !important;
}

.edgeever-web-embed-actions {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 4px !important;
  flex-shrink: 0 !important;
}

.edgeever-web-btn-icon {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 3px !important;
  height: 24px !important;
  padding: 0 6px !important;
  background: transparent !important;
  border: 1px solid transparent !important;
  border-radius: 4px !important;
  color: #94a3b8 !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  white-space: nowrap !important;
  text-decoration: none !important;
  box-sizing: border-box !important;
  line-height: 1 !important;
}

.edgeever-web-btn-icon:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #f1f5f9 !important;
}

.edgeever-web-btn-primary {
  background: rgba(56, 189, 248, 0.12) !important;
  border-color: rgba(56, 189, 248, 0.25) !important;
  color: #38bdf8 !important;
}

.edgeever-web-btn-primary:hover {
  background: #38bdf8 !important;
  border-color: #38bdf8 !important;
  color: #ffffff !important;
}

.edgeever-web-iframe-container {
  width: 100% !important;
  height: calc(100vh - 220px) !important;
  min-height: 580px !important;
  position: relative !important;
  background: #101318 !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

.edgeever-web-iframe {
  width: 100% !important;
  height: 100% !important;
  border: none !important;
  display: block !important;
  background: transparent !important;
  box-sizing: border-box !important;
}

.edgeever-web-loading-bar {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 2.5px !important;
  background: #38bdf8 !important;
  animation: eeWcLoading 1.2s infinite ease-in-out !important;
  z-index: 10 !important;
}

@keyframes eeWcLoading {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0); }
  100% { transform: translateX(100%); }
}

.edgeever-web-resize-bar {
  height: 6px !important;
  width: 100% !important;
  background: rgba(255, 255, 255, 0.03) !important;
  cursor: row-resize !important;
  transition: background 0.15s ease !important;
}

.edgeever-web-resize-bar:hover,
.edgeever-web-resize-bar.is-dragging {
  background: #38bdf8 !important;
}

.edgeever-web-embed-block.is-fullscreen-view {
  position: fixed !important;
  top: 40px !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: calc(100vh - 40px) !important;
  margin: 0 !important;
  border-radius: 0 !important;
  z-index: 999 !important;
}

.edgeever-web-embed-block.is-fullscreen-view .edgeever-web-iframe-container {
  height: calc(100% - 34px) !important;
  min-height: unset !important;
}

.edgeever-web-modal-backdrop {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.72) !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 9999 !important;
}

.edgeever-web-modal {
  width: 460px !important;
  max-width: 92vw !important;
  background: #181b22 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 10px !important;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65) !important;
  padding: 20px !important;
  color: #e2e8f0 !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif !important;
  box-sizing: border-box !important;
}
`;

function injectPluginStyles() {
  let styleEl = document.getElementById("edgeever-web-companion-injected-styles");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "edgeever-web-companion-injected-styles";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = INJECTED_CSS;
}

// ==================== 2. 工具辅助函数 ====================

function sanitizeUrl(raw) {
  if (!raw) return "";
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) {
    u = "https://" + u;
  }
  return u;
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getActiveEditorElement() {
  return document.querySelector(".ProseMirror, [contenteditable='true']");
}

function getEditorInstance() {
  const pm = document.querySelector(".ProseMirror");
  if (pm?.editor) return pm.editor;
  if (window.__edgeever_editor) return window.__edgeever_editor;
  if (window.__current_editor) return window.__current_editor;

  if (pm) {
    for (const k in pm) {
      if (k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance")) {
        let fiber = pm[k];
        while (fiber) {
          if (fiber.memoizedProps?.editor) return fiber.memoizedProps.editor;
          if (fiber.stateNode?.editor) return fiber.stateNode.editor;
          fiber = fiber.return;
        }
      }
    }
  }
  return null;
}

// ==================== 3. 智能穿透加载引擎 ====================

let pluginContext = null;

async function fetchPublicHtml(url, maxRedirects = 3) {
  if (!pluginContext?.network?.fetch) return null;

  let currentUrl = url;
  for (let i = 0; i <= maxRedirects; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);

      // 严格只传递 EdgeEver 白名单请求头 (accept)
      const resp = await pluginContext.network.fetch(currentUrl, {
        transport: "public",
        method: "GET",
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!resp) continue;

      // 自动跟随重定向 (301, 302, 307, 308)
      if (resp.status >= 300 && resp.status < 400) {
        const loc = resp.headers.get("location");
        if (loc) {
          currentUrl = new URL(loc, currentUrl).href;
          continue;
        }
      }

      if (resp.ok) {
        const text = await resp.text();
        if (text && text.length > 50) {
          return { html: text, finalUrl: currentUrl };
        }
      }
    } catch (err) {
      console.warn("[Web Companion] fetchPublicHtml error:", err);
      break;
    }
  }
  return null;
}

async function loadUrlIntoIframe(containerEl, iframe, url, loadingBar) {
  if (loadingBar) loadingBar.style.display = "block";

  let loaded = false;

  // 1. 优先通过 EdgeEver 官方后台 Public Network 拉取
  const fetched = await fetchPublicHtml(url);
  if (fetched) {
    let { html, finalUrl } = fetched;

    // 清洗安全限制 meta 标签
    html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, "");
    html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, "");

    // 注入 base 标签使相对路径资源正确请求原站
    const baseTag = `<base href="${escapeHtml(finalUrl)}" target="_blank">`;
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (m) => `${m}\n  ${baseTag}`);
    } else if (/<html[^>]*>/i.test(html)) {
      html = html.replace(/<html[^>]*>/i, (m) => `${m}\n<head>${baseTag}</head>`);
    } else {
      html = `<head>${baseTag}</head>\n` + html;
    }

    iframe.removeAttribute("src");
    iframe.srcdoc = html;
    loaded = true;
    if (loadingBar) {
      setTimeout(() => { loadingBar.style.display = "none"; }, 300);
    }
    return;
  }

  // 2. Fallback: 使用原生 iframe.src 加载
  iframe.removeAttribute("srcdoc");
  iframe.src = url;

  iframe.onload = () => {
    loaded = true;
    if (loadingBar) loadingBar.style.display = "none";
  };

  setTimeout(() => {
    if (loadingBar) loadingBar.style.display = "none";
  }, 4000);
}

// ==================== 4. 节点属性更新与持久化引擎 ====================

function updateEmbedAttributesInDoc(embedId, oldUrl, newTitle, newUrl, newHeight) {
  const editor = getEditorInstance();
  let updatedInTiptap = false;

  if (editor?.state?.doc) {
    try {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "edgeeverPluginEmbed" && (node.attrs.id === embedId || node.attrs.resourceId === oldUrl)) {
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              title: newTitle,
              resourceId: newUrl,
              dataJson: JSON.stringify({ url: newUrl, title: newTitle, height: newHeight }),
            });
            return true;
          });
          updatedInTiptap = true;
          return false;
        }
      });
    } catch (e) {
      console.warn("[Web Companion] update node markup in tiptap failed:", e);
    }
  }

  // Fallback: 在 Markdown 模式下通过 editMarkdown 正则替换
  if (!updatedInTiptap && pluginContext?.editor?.editMarkdown) {
    pluginContext.editor.editMarkdown((md) => {
      return md.replace(
        /```edgeever-plugin-embed\n([\s\S]*?)\n```/g,
        (fullMatch, jsonStr) => {
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.id === embedId || parsed.resourceId === oldUrl) {
              parsed.title = newTitle;
              parsed.resourceId = newUrl;
              parsed.dataJson = JSON.stringify({ url: newUrl, title: newTitle, height: newHeight });
              return `\`\`\`edgeever-plugin-embed\n${JSON.stringify(parsed)}\n\`\`\``;
            }
          } catch (_) {}
          return fullMatch;
        }
      );
    }).catch(() => {});
  }
}

// ==================== 5. 网页卡片属性设置弹窗 ====================

function openEmbedSettingsModal({ title, url, height }, onSave) {
  let modal = document.createElement("div");
  modal.className = "edgeever-web-modal-backdrop";
  modal.innerHTML = `
    <div class="edgeever-web-modal">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span style="font-weight:700;font-size:14px;color:#f8fafc;display:flex;align-items:center;gap:6px;">
          ⚙️ 网页卡片设置
        </span>
        <button type="button" class="edgeever-web-modal-close" style="background:none;border:none;color:#94a3b8;font-size:17px;cursor:pointer;padding:0 4px;">✕</button>
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11.5px;font-weight:500;color:#94a3b8;margin-bottom:5px;">卡片标题 (Title)</label>
        <input type="text" class="edgeever-web-input-title" value="${escapeHtml(title)}" placeholder="自定义标题（默认显示域名）" style="width:100%;box-sizing:border-box;padding:7px 10px;background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#f8fafc;font-size:12.5px;outline:none;" />
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11.5px;font-weight:500;color:#94a3b8;margin-bottom:5px;">目标网址 (URL)</label>
        <input type="text" class="edgeever-web-input-url" value="${escapeHtml(url)}" placeholder="https://example.com" style="width:100%;box-sizing:border-box;padding:7px 10px;background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#f8fafc;font-size:12.5px;outline:none;" />
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:11.5px;font-weight:500;color:#94a3b8;margin-bottom:5px;">视窗高度预设</label>
        <div style="display:flex;gap:6px;">
          <button type="button" class="edgeever-web-preset-h" data-height="600" style="padding:4px 10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:5px;color:#cbd5e1;font-size:11px;cursor:pointer;">600px</button>
          <button type="button" class="edgeever-web-preset-h" data-height="800" style="padding:4px 10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:5px;color:#cbd5e1;font-size:11px;cursor:pointer;">800px</button>
          <button type="button" class="edgeever-web-preset-h" data-height="1000" style="padding:4px 10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:5px;color:#cbd5e1;font-size:11px;cursor:pointer;">1000px</button>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button type="button" class="edgeever-web-modal-cancel" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:5px;color:#e2e8f0;font-size:12px;cursor:pointer;">取消</button>
        <button type="button" class="edgeever-web-modal-save" style="padding:6px 16px;background:#38bdf8;border:none;border-radius:5px;color:#ffffff;font-size:12px;font-weight:600;cursor:pointer;">保存更改</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const titleInput = modal.querySelector(".edgeever-web-input-title");
  const urlInput = modal.querySelector(".edgeever-web-input-url");
  const closeBtn = modal.querySelector(".edgeever-web-modal-close");
  const cancelBtn = modal.querySelector(".edgeever-web-modal-cancel");
  const saveBtn = modal.querySelector(".edgeever-web-modal-save");

  let selectedHeight = height;
  modal.querySelectorAll(".edgeever-web-preset-h").forEach((btn) => {
    btn.onclick = () => {
      selectedHeight = parseInt(btn.dataset.height, 10);
      modal.querySelectorAll(".edgeever-web-preset-h").forEach((b) => b.style.borderColor = "rgba(255,255,255,0.1)");
      btn.style.borderColor = "#38bdf8";
    };
  });

  const doClose = () => {
    if (modal) {
      modal.remove();
      modal = null;
    }
  };

  closeBtn.onclick = doClose;
  cancelBtn.onclick = doClose;
  modal.onclick = (e) => { if (e.target === modal) doClose(); };

  saveBtn.onclick = () => {
    const newRawUrl = urlInput.value.trim();
    if (!newRawUrl) {
      urlInput.focus();
      return;
    }
    const finalNewUrl = sanitizeUrl(newRawUrl);
    let finalTitle = titleInput.value.trim();
    if (!finalTitle) {
      try {
        finalTitle = new URL(finalNewUrl).hostname || finalNewUrl;
      } catch (_) {
        finalTitle = finalNewUrl;
      }
    }
    doClose();
    if (onSave) {
      onSave({ title: finalTitle, url: finalNewUrl, height: selectedHeight });
    }
  };

  setTimeout(() => titleInput?.focus(), 60);
}

// ==================== 6. 构建与挂载卡片 DOM ====================

function mountWebCompanionCard(container, embedData) {
  let initialUrl = "";
  let initialTitle = "";
  let embedId = "";

  if (typeof embedData === "string") {
    initialUrl = embedData;
  } else if (embedData && typeof embedData === "object") {
    initialUrl = embedData.data?.url || embedData.resourceId || "";
    initialTitle = embedData.title || "";
    embedId = embedData.id || "";
  }

  let currentUrl = sanitizeUrl(initialUrl);
  let domain = "";
  try {
    domain = new URL(currentUrl).hostname || currentUrl;
  } catch (_) {
    domain = currentUrl;
  }

  let currentTitle = initialTitle || domain;

  container.innerHTML = "";
  const card = document.createElement("div");
  card.className = "edgeever-web-embed-block";
  card.setAttribute("contenteditable", "false");

  function renderCardContent() {
    card.innerHTML = `
      <div class="edgeever-web-embed-bar">
        <div class="edgeever-web-embed-left" title="点击编辑网页标题与链接">
          <span class="edgeever-web-tag">WEB</span>
          <div class="edgeever-web-title-wrap">
            <span class="edgeever-web-domain-title">${escapeHtml(currentTitle)}</span>
            <span class="edgeever-web-edit-hint">✏️</span>
          </div>
        </div>
        <div class="edgeever-web-embed-actions">
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-settings" title="更改网页地址与标题设置">⚙️ 设置</button>
          <a class="edgeever-web-btn-icon edgeever-web-btn-primary edgeever-web-action-link" href="${escapeHtml(currentUrl)}" target="_blank" rel="noopener" title="在系统独立浏览器中打开此页面">🚀 打开</a>
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-reload" title="刷新页面">🔄 刷新</button>
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-copy" title="复制网址">📋 复制</button>
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-full" title="铺满整页切换">⛶ 铺满</button>
        </div>
      </div>
      <div class="edgeever-web-iframe-container">
        <div class="edgeever-web-loading-bar"></div>
        
        <!-- 底层自适应引导面板 (当外部站点开启CSP防嵌导致内联空白时优雅呈现) -->
        <div class="edgeever-web-fallback-pane" style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center;background:#101318;color:#e2e8f0;z-index:1;box-sizing:border-box;">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:12px;">
            🌐
          </div>
          <div style="font-size:15px;font-weight:700;color:#f8fafc;margin-bottom:6px;">
            ${escapeHtml(currentTitle)}
          </div>
          <div style="font-size:12px;color:#94a3b8;max-width:440px;line-height:1.6;margin-bottom:18px;">
            若此站点配置了安全防嵌保护 (CSP: frame-ancestors 'none') 导致视窗内空白，可一键在系统独立浏览器中畅快浏览：
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <a href="${escapeHtml(currentUrl)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;padding:7px 16px;background:#38bdf8;color:#ffffff;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;box-shadow:0 4px 12px rgba(56,189,248,0.3);">
              🚀 立即在浏览器打开
            </a>
            <button type="button" class="edgeever-web-btn-icon edgeever-web-fallback-copy" style="padding:6px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#cbd5e1;font-size:12px;cursor:pointer;">
              📋 复制网址
            </button>
            <button type="button" class="edgeever-web-btn-icon edgeever-web-fallback-settings" style="padding:6px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#cbd5e1;font-size:12px;cursor:pointer;">
              ⚙️ 更换网址
            </button>
          </div>
        </div>

        <!-- 顶层透明 iframe (支持内嵌的网站直接正常覆盖显示) -->
        <iframe class="edgeever-web-iframe" style="position:relative;width:100%;height:100%;border:none;background:transparent;z-index:2;" allow="fullscreen" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"></iframe>
      </div>
      <div class="edgeever-web-resize-bar" title="向下拖拽调节网页显示高度"></div>
    `;

    bindCardEvents();
  }

  function bindCardEvents() {
    const leftTitle = card.querySelector(".edgeever-web-embed-left");
    const settingsBtn = card.querySelector(".edgeever-web-btn-settings");
    const fallbackSettingsBtn = card.querySelector(".edgeever-web-fallback-settings");
    const reloadBtn = card.querySelector(".edgeever-web-btn-reload");
    const copyBtn = card.querySelector(".edgeever-web-btn-copy");
    const fallbackCopyBtn = card.querySelector(".edgeever-web-fallback-copy");
    const fullBtn = card.querySelector(".edgeever-web-btn-full");
    const iframe = card.querySelector(".edgeever-web-iframe");
    const loadingBar = card.querySelector(".edgeever-web-loading-bar");
    const resizeBar = card.querySelector(".edgeever-web-resize-bar");
    const containerEl = card.querySelector(".edgeever-web-iframe-container");

    // 加载当前 URL
    if (iframe) {
      loadUrlIntoIframe(card, iframe, currentUrl, loadingBar);
    }

    // 设置与修改属性逻辑
    const handleOpenSettings = (e) => {
      e?.stopPropagation();
      openEmbedSettingsModal(
        { title: currentTitle, url: currentUrl, height: containerEl.offsetHeight },
        ({ title: newTitle, url: newUrl, height: newHeight }) => {
          const oldUrl = currentUrl;
          currentTitle = newTitle;
          currentUrl = newUrl;

          if (newHeight) {
            containerEl.style.height = `${newHeight}px`;
            containerEl.style.minHeight = `${newHeight}px`;
          }

          // 持久化保存到笔记文档
          updateEmbedAttributesInDoc(embedId, oldUrl, currentTitle, currentUrl, newHeight);

          // 重新渲染当前卡片
          renderCardContent();
        }
      );
    };

    if (leftTitle) leftTitle.onclick = handleOpenSettings;
    if (settingsBtn) settingsBtn.onclick = handleOpenSettings;
    if (fallbackSettingsBtn) fallbackSettingsBtn.onclick = handleOpenSettings;

    if (reloadBtn) {
      reloadBtn.onclick = (e) => {
        e.stopPropagation();
        if (iframe) loadUrlIntoIframe(card, iframe, currentUrl, loadingBar);
      };
    }

    const doCopy = async (btn) => {
      try {
        await navigator.clipboard.writeText(currentUrl);
        const originText = btn.textContent;
        btn.textContent = "✅ 已复制";
        setTimeout(() => { btn.textContent = originText; }, 1500);
      } catch (_) {}
    };

    if (copyBtn) {
      copyBtn.onclick = (e) => {
        e.stopPropagation();
        doCopy(copyBtn);
      };
    }

    if (fallbackCopyBtn) {
      fallbackCopyBtn.onclick = (e) => {
        e.stopPropagation();
        doCopy(fallbackCopyBtn);
      };
    }

    if (fullBtn) {
      fullBtn.onclick = (e) => {
        e.stopPropagation();
        const isFull = card.classList.toggle("is-fullscreen-view");
        fullBtn.textContent = isFull ? "🗗 还原" : "⛶ 铺满";
      };
    }

    // 拖拽伸缩
    let startY = 0;
    let startHeight = 0;
    const onMouseMove = (ev) => {
      const deltaY = ev.clientY - startY;
      const newHeight = Math.max(300, startHeight + deltaY);
      containerEl.style.height = `${newHeight}px`;
      containerEl.style.minHeight = `${newHeight}px`;
    };
    const onMouseUp = () => {
      resizeBar.classList.remove("is-dragging");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    resizeBar.onmousedown = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      startY = ev.clientY;
      startHeight = containerEl.offsetHeight;
      resizeBar.classList.add("is-dragging");
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };
  }

  renderCardContent();
  container.appendChild(card);

  return () => {
    container.innerHTML = "";
  };
}

// ==================== 7. 插入网页输入弹窗 ====================

let insertModalEl = null;

function promptInsertWebUrl(onConfirmCallback) {
  if (insertModalEl) insertModalEl.remove();

  insertModalEl = document.createElement("div");
  insertModalEl.className = "edgeever-web-modal-backdrop";
  insertModalEl.innerHTML = `
    <div class="edgeever-web-modal">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-weight:700;font-size:14px;color:#f8fafc;display:flex;align-items:center;gap:6px;">
          🌐 插入网页视窗 (Web Embed)
        </span>
        <button type="button" class="edgeever-web-modal-close" style="background:none;border:none;color:#94a3b8;font-size:17px;cursor:pointer;padding:0 4px;">✕</button>
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11.5px;color:#94a3b8;margin-bottom:5px;">目标网页地址 (URL)</label>
        <input type="text" class="edgeever-web-input-url" placeholder="https://example.com" style="width:100%;box-sizing:border-box;padding:8px 10px;background:#0f172a;border:1px solid rgba(255,255,255,0.16);border-radius:6px;color:#f8fafc;font-size:13px;outline:none;" />
      </div>

      <div style="font-size:11px;color:#94a3b8;margin-bottom:16px;line-height:1.5;">
        💡 提示：按回车即可插入。可在笔记任意位置随时输入 <code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;">/web</code> 或按 <code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;">Alt+W</code> 唤出此弹窗。
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button type="button" class="edgeever-web-modal-cancel" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:5px;color:#e2e8f0;font-size:12px;cursor:pointer;">取消</button>
        <button type="button" class="edgeever-web-modal-confirm" style="padding:6px 16px;background:#38bdf8;border:none;border-radius:5px;color:#ffffff;font-size:12px;font-weight:600;cursor:pointer;">立即插入</button>
      </div>
    </div>
  `;

  document.body.appendChild(insertModalEl);

  const input = insertModalEl.querySelector(".edgeever-web-input-url");
  const closeBtn = insertModalEl.querySelector(".edgeever-web-modal-close");
  const cancelBtn = insertModalEl.querySelector(".edgeever-web-modal-cancel");
  const confirmBtn = insertModalEl.querySelector(".edgeever-web-modal-confirm");

  // 尝试读取剪贴板中的链接
  if (navigator.clipboard?.readText) {
    navigator.clipboard.readText().then((clip) => {
      if (clip && /^https?:\/\//i.test(clip.trim())) {
        input.value = clip.trim();
        input.select();
      }
    }).catch(() => {});
  }

  setTimeout(() => input?.focus(), 60);

  const doClose = () => {
    if (insertModalEl) {
      insertModalEl.remove();
      insertModalEl = null;
    }
  };

  closeBtn.onclick = doClose;
  cancelBtn.onclick = doClose;
  insertModalEl.onclick = (e) => { if (e.target === insertModalEl) doClose(); };

  const handleConfirm = () => {
    const raw = input.value.trim();
    if (!raw) {
      input.focus();
      return;
    }
    const finalUrl = sanitizeUrl(raw);
    doClose();
    if (onConfirmCallback) {
      onConfirmCallback(finalUrl);
    }
  };

  confirmBtn.onclick = handleConfirm;
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      doClose();
    }
  };
}

// ==================== 8. 插件激活与核心生命周期 ====================

export default {
  activate(context) {
    pluginContext = context;
    injectPluginStyles();

    // 1. 注册官方原生嵌入渲染器 (Official Plugin Embed Renderer)
    if (context.editor?.embeds?.register) {
      try {
        context.editor.embeds.register({
          type: "web-view",
          async mount(container, embedData) {
            return mountWebCompanionCard(container, embedData);
          },
        });
      } catch (err) {
        console.warn("[Web Companion] Register embeds renderer failed:", err);
      }
    }

    // 2. 核心插入执行逻辑
    async function executeInsertWeb(targetUrl) {
      let domain = "Web View";
      try {
        domain = new URL(targetUrl).hostname || "Web View";
      } catch (_) {}

      // 方案 A：使用 context.editor.insertEmbed
      if (context.editor?.insertEmbed) {
        try {
          await context.editor.insertEmbed({
            type: "web-view",
            resourceId: targetUrl,
            title: domain,
            data: { url: targetUrl, title: domain },
          });
          return;
        } catch (err) {
          console.warn("[Web Companion] insertEmbed failed:", err);
        }
      }

      // 方案 B：使用 Tiptap editor 实例直接插入
      const editor = getEditorInstance();
      if (editor?.commands?.insertContent) {
        try {
          const embedId = `embed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          editor.commands.insertContent({
            type: "edgeeverPluginEmbed",
            attrs: {
              id: embedId,
              pluginId: "org.edgeever.plugins.web-companion",
              type: "web-view",
              resourceId: targetUrl,
              title: domain,
              dataJson: JSON.stringify({ url: targetUrl, title: domain }),
            },
          });
          return;
        } catch (err) {
          console.warn("[Web Companion] insertContent failed:", err);
        }
      }

      // 方案 C：在 Markdown 模式下插入官方语法
      const mdCode = `\n\`\`\`edgeever-plugin-embed\n${JSON.stringify({
        id: `embed_${Date.now()}`,
        pluginId: "org.edgeever.plugins.web-companion",
        type: "web-view",
        resourceId: targetUrl,
        title: domain,
        dataJson: JSON.stringify({ url: targetUrl, title: domain }),
      })}\n\`\`\`\n`;

      if (context.editor?.insertAtCursor) {
        try {
          await context.editor.insertAtCursor(mdCode);
          return;
        } catch (_) {}
      }

      try {
        document.execCommand("insertText", false, mdCode);
      } catch (_) {}
    }

    function openInsertDialog() {
      promptInsertWebUrl((url) => {
        executeInsertWeb(url);
      });
    }

    // 3. 输入 /web 快捷触发处理
    function handleEditorKeyDown(e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        const sel = window.getSelection();
        if (!sel || !sel.isCollapsed || !sel.anchorNode) return;

        const node = sel.anchorNode;
        const text = node.textContent || "";
        const offset = sel.anchorOffset;

        if (offset >= 4 && text.slice(offset - 4, offset).toLowerCase() === "/web") {
          const prefix = text.slice(0, offset - 4);
          const isAtStart = offset === 4 || /[\s\n]$/.test(prefix);

          if (isAtStart) {
            e.preventDefault();
            e.stopPropagation();

            try {
              const range = sel.getRangeAt(0);
              const newRange = document.createRange();
              newRange.setStart(node, offset - 4);
              newRange.setEnd(node, offset);
              sel.removeAllRanges();
              sel.addRange(newRange);
              document.execCommand("delete");
            } catch (_) {}

            openInsertDialog();
          }
        }
      }
    }

    document.addEventListener("keydown", handleEditorKeyDown, true);

    // 4. 清理旧版本遗留的常驻悬浮药丸或散落文本
    function cleanupLegacyDom() {
      document.querySelectorAll(".edgeever-web-floating-trigger").forEach((el) => el.remove());
      const allParagraphs = Array.from(document.querySelectorAll(".ProseMirror p"));
      allParagraphs.forEach((p) => {
        const txt = p.textContent || "";
        if (txt.includes("若因站点安全保护限制 (CSP)") || (txt.includes("WEB") && txt.includes("在浏览器打开"))) {
          p.remove();
        }
      });
    }

    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        injectPluginStyles();
        cleanupLegacyDom();
      }, 150);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.__edgeever_wc_observer = observer;

    setTimeout(() => {
      injectPluginStyles();
      cleanupLegacyDom();
    }, 200);

    // 5. 注册全局快捷键命令
    if (context.commands?.register) {
      context.commands.register({
        id: "web-insert-iframe",
        title: "Web Companion: /web 插入网页 (Web Embed)",
        shortcut: "Alt-W",
        run: () => openInsertDialog(),
        execute: () => openInsertDialog(),
      });
    }
  },

  deactivate() {
    if (window.__edgeever_wc_observer) {
      try {
        window.__edgeever_wc_observer.disconnect();
      } catch (_) {}
      window.__edgeever_wc_observer = null;
    }
    document.querySelectorAll(".edgeever-web-modal-backdrop, .edgeever-web-floating-trigger").forEach((el) => el.remove());
    document.getElementById("edgeever-web-companion-injected-styles")?.remove();
  },
};
