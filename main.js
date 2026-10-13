/**
 * EdgeEver Web Companion Plugin (网页伴侣)
 * 官方标准嵌入架构：基于 context.editor.embeds.register 与 context.editor.insertEmbed
 * v1.3.0 - 笔记内嵌全功能 Mini 浏览器：交互式地址栏、自适应全宽、防白屏容灾与高度自由伸缩
 */

console.log(
  "%c[EdgeEver Web Companion] v1.3.0 Loaded - Embedded Mini Browser Experience",
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
  margin: 18px 0 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 10px !important;
  background: #0f1217 !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45) !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  user-select: none !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, width 0.2s ease, margin 0.2s ease !important;
  position: relative !important;
}

.edgeever-web-embed-block:hover {
  border-color: rgba(56, 189, 248, 0.28) !important;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55) !important;
}

.edgeever-web-embed-bar {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: space-between !important;
  height: 38px !important;
  padding: 0 12px !important;
  background: rgba(22, 27, 34, 0.96) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
  gap: 10px !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif !important;
  box-sizing: border-box !important;
}

.edgeever-web-mac-controls {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  flex-shrink: 0 !important;
}

.edgeever-web-dot {
  width: 9px !important;
  height: 9px !important;
  border-radius: 50% !important;
  display: inline-block !important;
  opacity: 0.8 !important;
}

.edgeever-web-dot.red { background: #ff5f56 !important; }
.edgeever-web-dot.yellow { background: #ffbd2e !important; }
.edgeever-web-dot.green { background: #27c93f !important; }

/* 交互式地址栏 Omnibox */
.edgeever-web-omnibox-wrap {
  flex: 1 !important;
  max-width: 640px !important;
  min-width: 180px !important;
  display: flex !important;
  align-items: center !important;
  background: rgba(0, 0, 0, 0.35) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 6px !important;
  padding: 2px 8px !important;
  transition: all 0.2s ease !important;
  gap: 6px !important;
}

.edgeever-web-omnibox-wrap:focus-within {
  border-color: #38bdf8 !important;
  background: rgba(0, 0, 0, 0.55) !important;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2) !important;
}

.edgeever-web-lock-icon {
  font-size: 11px !important;
  color: #38bdf8 !important;
  opacity: 0.85 !important;
  flex-shrink: 0 !important;
  user-select: none !important;
}

.edgeever-web-omnibox-input {
  flex: 1 !important;
  min-width: 0 !important;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  font-size: 12px !important;
  color: #e2e8f0 !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif !important;
  padding: 2px 0 !important;
}

.edgeever-web-omnibox-input::placeholder {
  color: #64748b !important;
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
  padding: 0 7px !important;
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
  min-height: 320px !important;
  position: relative !important;
  background: #0f1217 !important;
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
  position: relative !important;
  z-index: 2 !important;
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

/* 底部 Mac 风格拖拽伸缩手柄 */
.edgeever-web-resize-bar {
  height: 14px !important;
  width: 100% !important;
  background: rgba(255, 255, 255, 0.02) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
  cursor: row-resize !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
  transition: all 0.15s ease !important;
  user-select: none !important;
}

.edgeever-web-resize-bar:hover,
.edgeever-web-resize-bar.is-dragging {
  background: rgba(56, 189, 248, 0.12) !important;
  border-top-color: rgba(56, 189, 248, 0.3) !important;
}

.edgeever-web-resize-pill {
  width: 36px !important;
  height: 3px !important;
  background: rgba(255, 255, 255, 0.2) !important;
  border-radius: 2px !important;
  transition: all 0.15s ease !important;
}

.edgeever-web-resize-bar:hover .edgeever-web-resize-pill,
.edgeever-web-resize-bar.is-dragging .edgeever-web-resize-pill {
  background: #38bdf8 !important;
  width: 48px !important;
}

.edgeever-web-height-badge {
  position: absolute !important;
  right: 12px !important;
  font-size: 10px !important;
  color: #94a3b8 !important;
  font-family: monospace !important;
  pointer-events: none !important;
  opacity: 0;
  transition: opacity 0.2s ease !important;
}

.edgeever-web-resize-bar:hover .edgeever-web-height-badge,
.edgeever-web-resize-bar.is-dragging .edgeever-web-height-badge {
  opacity: 1 !important;
}

/* 沉浸式铺满整页视图 */
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
  z-index: 9999 !important;
}

.edgeever-web-embed-block.is-fullscreen-view .edgeever-web-iframe-container {
  height: calc(100% - 52px) !important;
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
  z-index: 99999 !important;
}

.edgeever-web-modal {
  width: 460px !important;
  max-width: 92vw !important;
  background: #14171d !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 8px !important;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6) !important;
  padding: 18px 20px !important;
  box-sizing: border-box !important;
  color: #e2e8f0 !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif !important;
}
`;

function ensureInjectedStyle() {
  const STYLE_ID = "edgeever-web-companion-style";
  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = INJECTED_CSS;
}

// ==================== 2. 工具辅助函数 ====================

function sanitizeUrl(raw) {
  if (!raw) return "https://skillry.dev";
  let u = String(raw).trim();
  if (!/^https?:\/\//i.test(u)) {
    u = "https://" + u;
  }
  return u;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let pluginContext = null;

function getEditorInstance() {
  try {
    if (pluginContext?.editor?.getEditor) {
      const ed = pluginContext.editor.getEditor();
      if (ed) return ed;
    }
    if (pluginContext?.editor?.view?.state) {
      return pluginContext.editor;
    }
  } catch (_) {}
  return null;
}

// ==================== 3. 智能网络穿透引擎 (官方 network.fetch 规范) ====================

async function fetchPublicHtml(url, maxRedirects = 3) {
  if (!pluginContext?.network?.fetch) return null;

  let currentUrl = url;
  for (let i = 0; i <= maxRedirects; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);

      // 严格传递 EdgeEver 白名单请求头 (accept)
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

      // 自动跟随重定向
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

async function loadUrlIntoIframe(card, iframe, url, loadingBar) {
  if (loadingBar) loadingBar.style.display = "block";
  let loaded = false;

  // 1. 优先通过 EdgeEver 官方后台 Public Network 拉取（无 CORS 限制，Node 直达）
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

  // 2. 原生 iframe.src 加载
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

function updateEmbedAttributesInDoc(embedId, oldUrl, newTitle, newUrl, newHeight, newWidthMode) {
  const editor = getEditorInstance();
  let updatedInTiptap = false;

  const dataPayload = JSON.stringify({
    url: newUrl,
    title: newTitle,
    height: newHeight,
    widthMode: newWidthMode || "editor",
  });

  if (editor?.state?.doc) {
    try {
      editor.state.doc.descendants((node, pos) => {
        if (
          (node.type.name === "edgeeverPluginEmbed" || node.type.name === "pluginEmbed") &&
          (node.attrs.id === embedId || node.attrs.resourceId === oldUrl)
        ) {
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              title: newTitle,
              resourceId: newUrl,
              dataJson: dataPayload,
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
              parsed.dataJson = dataPayload;
              return `\`\`\`edgeever-plugin-embed\n${JSON.stringify(parsed)}\n\`\`\``;
            }
          } catch (_) {}
          return fullMatch;
        }
      );
    }).catch(() => {});
  }
}

// ==================== 5. 宽度自适应 (Editor Breakout) 引擎 ====================

function applyCardLayout(card, widthMode) {
  if (!card || !card.parentElement || card.classList.contains("is-fullscreen-view")) return;

  if (widthMode === "normal") {
    card.style.width = "100%";
    card.style.maxWidth = "100%";
    card.style.marginLeft = "0px";
    card.style.marginRight = "0px";
    return;
  }

  try {
    const parent = card.parentElement;
    let viewport = card.closest(".overflow-y-auto") || card.closest(".overflow-auto");

    if (!viewport) {
      let cur = parent;
      while (cur && cur !== document.body) {
        if (cur.clientWidth > parent.clientWidth + 40) {
          viewport = cur;
          break;
        }
        cur = cur.parentElement;
      }
    }

    if (viewport) {
      const viewportRect = viewport.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const viewportWidth = viewport.clientWidth;

      if (widthMode === "editor") {
        // 适应编辑器工作区宽度，左右保留 24px 优雅呼吸留白
        const targetWidth = Math.max(parentRect.width, viewportWidth - 48);
        const targetLeft = viewportRect.left + 24;
        const offset = Math.round(targetLeft - parentRect.left);

        card.style.width = `${targetWidth}px`;
        card.style.maxWidth = `${targetWidth}px`;
        card.style.marginLeft = `${offset}px`;
        card.style.marginRight = "auto";
      } else if (widthMode === "wide") {
        // 宽屏模式 980px 居中
        const maxW = Math.min(980, viewportWidth - 32);
        const targetLeft = viewportRect.left + (viewportWidth - maxW) / 2;
        const offset = Math.round(targetLeft - parentRect.left);

        card.style.width = `${maxW}px`;
        card.style.maxWidth = `${maxW}px`;
        card.style.marginLeft = `${offset}px`;
        card.style.marginRight = "auto";
      }
    } else {
      card.style.width = "100%";
      card.style.maxWidth = "100%";
      card.style.marginLeft = "0px";
      card.style.marginRight = "0px";
    }
  } catch (_) {
    card.style.width = "100%";
    card.style.maxWidth = "100%";
    card.style.marginLeft = "0px";
    card.style.marginRight = "0px";
  }
}

// ==================== 6. 构建与挂载卡片 DOM (Mini 浏览器视窗) ====================

function mountWebCompanionCard(container, embedData) {
  let initialUrl = "";
  let initialTitle = "";
  let embedId = "";
  let initialHeight = 720;
  let initialWidthMode = "editor"; // 默认自适应铺满主编辑器区

  if (typeof embedData === "string") {
    initialUrl = embedData;
  } else if (embedData && typeof embedData === "object") {
    initialUrl = embedData.data?.url || embedData.resourceId || "";
    initialTitle = embedData.title || "";
    embedId = embedData.id || "";

    let extraData = embedData.data;
    if (!extraData && embedData.dataJson) {
      try {
        extraData = JSON.parse(embedData.dataJson);
      } catch (_) {}
    }
    if (extraData && typeof extraData === "object") {
      if (extraData.url) initialUrl = extraData.url;
      if (extraData.title) initialTitle = extraData.title;
      if (extraData.height) initialHeight = parseInt(extraData.height, 10) || 720;
      if (extraData.widthMode) initialWidthMode = extraData.widthMode;
    }
  }

  let currentUrl = sanitizeUrl(initialUrl);
  let domain = "Web View";
  try {
    domain = new URL(currentUrl).hostname || currentUrl;
  } catch (_) {
    domain = currentUrl;
  }

  let currentTitle = initialTitle || domain;
  let currentHeight = initialHeight;
  let currentWidthMode = initialWidthMode;

  container.innerHTML = "";
  const card = document.createElement("div");
  card.className = "edgeever-web-embed-block";
  card.setAttribute("contenteditable", "false");

  function getWidthLabel(mode) {
    if (mode === "editor") return "📐 全宽";
    if (mode === "wide") return "📏 宽屏";
    return "📝 标准";
  }

  function renderCardContent() {
    card.innerHTML = `
      <div class="edgeever-web-embed-bar">
        <!-- 浏览器左侧控件：Mac 三色小圆点 + 刷新按钮 -->
        <div class="edgeever-web-mac-controls">
          <span class="edgeever-web-dot red"></span>
          <span class="edgeever-web-dot yellow"></span>
          <span class="edgeever-web-dot green"></span>
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-reload" title="重新加载当前页面" style="margin-left:4px;">🔄</button>
        </div>

        <!-- 浏览器中央交互式地址栏 (Omnibox)：可直接在输入框里修改网址按回车前往并自动保存！ -->
        <div class="edgeever-web-omnibox-wrap" title="输入网址并按回车即可前往该网页">
          <span class="edgeever-web-lock-icon">🔒</span>
          <input type="text" class="edgeever-web-omnibox-input" value="${escapeHtml(currentUrl)}" placeholder="输入网址按回车前往 (https://...)" spellcheck="false" />
        </div>

        <!-- 浏览器右侧工具：宽度切换、在外部浏览器打开、复制链接、全屏 -->
        <div class="edgeever-web-embed-actions">
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-width" title="点击切换宽度模式：全宽 / 宽屏(980px) / 标准宽">${getWidthLabel(currentWidthMode)}</button>
          <a class="edgeever-web-btn-icon edgeever-web-btn-primary edgeever-web-action-link" href="${escapeHtml(currentUrl)}" target="_blank" rel="noopener" title="在系统独立浏览器中打开当前网页">🚀 外部打开</a>
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-copy" title="复制当前网址链接">📋 复制</button>
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-full" title="沉浸式整页铺满切换">⛶ 铺满</button>
        </div>
      </div>

      <div class="edgeever-web-iframe-container" style="height:${currentHeight}px;">
        <div class="edgeever-web-loading-bar"></div>
        
        <!-- 底层浏览器式引导与防白屏容灾卡片 -->
        <div class="edgeever-web-fallback-pane" style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center;background:#0f1217;color:#e2e8f0;z-index:1;box-sizing:border-box;">
          <div style="width:52px;height:52px;border-radius:14px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:14px;">
            🌐
          </div>
          <div style="font-size:16px;font-weight:700;color:#f8fafc;margin-bottom:6px;">
            ${escapeHtml(currentTitle)}
          </div>
          <div style="font-size:12px;color:#94a3b8;max-width:460px;line-height:1.6;margin-bottom:20px;">
            若此网站配置了严格的安全防嵌策略 (CSP: frame-ancestors)，可在上方地址栏修改网址，或直接在系统独立浏览器中畅快浏览：
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <a href="${escapeHtml(currentUrl)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;padding:8px 18px;background:#38bdf8;color:#ffffff;border-radius:6px;font-size:12.5px;font-weight:600;text-decoration:none;box-shadow:0 4px 14px rgba(56,189,248,0.35);">
              🚀 立即在系统浏览器中打开
            </a>
            <button type="button" class="edgeever-web-btn-icon edgeever-web-fallback-copy" style="padding:7px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#cbd5e1;font-size:12px;cursor:pointer;">
              📋 复制网址
            </button>
          </div>
        </div>

        <!-- 顶层透明 iframe (支持内嵌的网站直接正常覆盖显示) -->
        <iframe class="edgeever-web-iframe" style="position:relative;width:100%;height:100%;border:none;background:transparent;z-index:2;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>

      <!-- 底部 Mac 风格拖拽伸缩手柄 -->
      <div class="edgeever-web-resize-bar" title="按住自由拖拽调节视窗高度 · 双击在自适应屏幕与默认高度间切换">
        <div class="edgeever-web-resize-pill"></div>
        <span class="edgeever-web-height-badge">${currentHeight}px</span>
      </div>
    `;

    bindCardEvents();
  }

  function bindCardEvents() {
    const omnibox = card.querySelector(".edgeever-web-omnibox-input");
    const widthBtn = card.querySelector(".edgeever-web-btn-width");
    const reloadBtn = card.querySelector(".edgeever-web-btn-reload");
    const copyBtn = card.querySelector(".edgeever-web-btn-copy");
    const fallbackCopyBtn = card.querySelector(".edgeever-web-fallback-copy");
    const fullBtn = card.querySelector(".edgeever-web-btn-full");
    const iframe = card.querySelector(".edgeever-web-iframe");
    const loadingBar = card.querySelector(".edgeever-web-loading-bar");
    const resizeBar = card.querySelector(".edgeever-web-resize-bar");
    const containerEl = card.querySelector(".edgeever-web-iframe-container");
    const heightBadge = card.querySelector(".edgeever-web-height-badge");

    // 立即应用当前宽度自适应布局
    applyCardLayout(card, currentWidthMode);

    // 加载当前 URL
    if (iframe) {
      loadUrlIntoIframe(card, iframe, currentUrl, loadingBar);
    }

    // 🌟 像浏览器一样：在地址栏输入新网址并按回车跳转！
    if (omnibox) {
      omnibox.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          const target = omnibox.value.trim();
          if (!target) return;

          const oldUrl = currentUrl;
          currentUrl = sanitizeUrl(target);
          omnibox.value = currentUrl;
          try {
            currentTitle = new URL(currentUrl).hostname || currentUrl;
          } catch (_) {
            currentTitle = currentUrl;
          }

          // 持久化保存到笔记文档
          updateEmbedAttributesInDoc(embedId, oldUrl, currentTitle, currentUrl, currentHeight, currentWidthMode);

          // 重新载入网页
          if (iframe) {
            loadUrlIntoIframe(card, iframe, currentUrl, loadingBar);
          }
          omnibox.blur();
        } else if (e.key === "Escape") {
          omnibox.value = currentUrl;
          omnibox.blur();
        }
      };

      // 点击地址栏全选网址
      omnibox.onfocus = () => {
        setTimeout(() => omnibox.select(), 50);
      };
    }

    // 刷新按钮
    if (reloadBtn) {
      reloadBtn.onclick = (e) => {
        e.stopPropagation();
        if (iframe) loadUrlIntoIframe(card, iframe, currentUrl, loadingBar);
      };
    }

    // 快捷宽度模式切换
    if (widthBtn) {
      widthBtn.onclick = (e) => {
        e.stopPropagation();
        if (currentWidthMode === "editor") {
          currentWidthMode = "wide";
        } else if (currentWidthMode === "wide") {
          currentWidthMode = "normal";
        } else {
          currentWidthMode = "editor";
        }
        widthBtn.textContent = getWidthLabel(currentWidthMode);
        applyCardLayout(card, currentWidthMode);
        updateEmbedAttributesInDoc(embedId, currentUrl, currentTitle, currentUrl, currentHeight, currentWidthMode);
      };
    }

    // 复制网址
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

    // 沉浸整页铺满
    if (fullBtn) {
      fullBtn.onclick = (e) => {
        e.stopPropagation();
        const isFull = card.classList.toggle("is-fullscreen-view");
        fullBtn.textContent = isFull ? "🗗 还原" : "⛶ 铺满";
        if (!isFull) {
          applyCardLayout(card, currentWidthMode);
        } else {
          card.style.width = "100%";
          card.style.maxWidth = "100%";
          card.style.marginLeft = "0px";
        }
      };
    }

    // 拖拽伸缩自由调节高度（彻底防止 iframe 捕获事件）
    let startY = 0;
    let startHeight = 0;
    let dragCurrentHeight = currentHeight;

    const onMouseMove = (ev) => {
      const deltaY = ev.clientY - startY;
      dragCurrentHeight = Math.max(300, startHeight + deltaY);
      containerEl.style.height = `${dragCurrentHeight}px`;
      if (heightBadge) {
        heightBadge.textContent = `${dragCurrentHeight}px`;
        heightBadge.style.opacity = "1";
      }
    };

    const onMouseUp = () => {
      resizeBar.classList.remove("is-dragging");
      // 恢复 iframe 交互与页面样式
      if (iframe) iframe.style.pointerEvents = "auto";
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      if (heightBadge) {
        setTimeout(() => { heightBadge.style.opacity = "0"; }, 600);
      }

      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      // 持久化保存新高度
      currentHeight = dragCurrentHeight;
      updateEmbedAttributesInDoc(embedId, currentUrl, currentTitle, currentUrl, currentHeight, currentWidthMode);
    };

    resizeBar.onmousedown = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      startY = ev.clientY;
      startHeight = containerEl.offsetHeight;
      dragCurrentHeight = startHeight;
      resizeBar.classList.add("is-dragging");

      // 关键！禁用 iframe pointer-events，防止鼠标划入 iframe 导致拖拽中断卡死
      if (iframe) iframe.style.pointerEvents = "none";
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    // 双击把手快速切换：撑满屏幕高度 vs 恢复 720px
    resizeBar.ondblclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const screenFitHeight = Math.max(500, window.innerHeight - 180);
      if (Math.abs(containerEl.offsetHeight - screenFitHeight) < 40) {
        currentHeight = 720;
      } else {
        currentHeight = screenFitHeight;
      }
      containerEl.style.height = `${currentHeight}px`;
      if (heightBadge) heightBadge.textContent = `${currentHeight}px`;
      updateEmbedAttributesInDoc(embedId, currentUrl, currentTitle, currentUrl, currentHeight, currentWidthMode);
    };
  }

  renderCardContent();
  container.appendChild(card);

  // 初次与延迟应用全宽布局
  applyCardLayout(card, currentWidthMode);
  setTimeout(() => applyCardLayout(card, currentWidthMode), 60);
  setTimeout(() => applyCardLayout(card, currentWidthMode), 200);

  // 监听尺寸变化以自适应编辑器宽度
  let resizeObserver = null;
  if (window.ResizeObserver) {
    try {
      resizeObserver = new ResizeObserver(() => {
        if (!card.classList.contains("is-fullscreen-view")) {
          applyCardLayout(card, currentWidthMode);
        }
      });
      if (card.parentElement) {
        resizeObserver.observe(card.parentElement);
        if (card.parentElement.parentElement) {
          resizeObserver.observe(card.parentElement.parentElement);
        }
      }
    } catch (_) {}
  }

  const onWindowResize = () => {
    if (!card.classList.contains("is-fullscreen-view")) {
      applyCardLayout(card, currentWidthMode);
    }
  };
  window.addEventListener("resize", onWindowResize);

  return () => {
    if (resizeObserver) resizeObserver.disconnect();
    window.removeEventListener("resize", onWindowResize);
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
    ensureInjectedStyle();

    // 1. 注册官方原生嵌入渲染器 (深度兼容 web-view 与 web-companion，支持 mount 与 render)
    if (context.editor?.embeds?.register) {
      const rendererDef = {
        type: "web-view",
        title: "网页视窗 (Web Embed)",
        mount(container, embedData) {
          return mountWebCompanionCard(container, embedData);
        },
        render(container, embedData) {
          return mountWebCompanionCard(container, embedData);
        },
      };

      try {
        context.editor.embeds.register(rendererDef);
        console.log("[Web Companion] Registered 'web-view' renderer successfully.");
      } catch (err) {
        console.warn("[Web Companion] Register 'web-view' failed:", err);
      }

      try {
        context.editor.embeds.register({
          ...rendererDef,
          type: "web-companion",
        });
        console.log("[Web Companion] Registered 'web-companion' renderer successfully.");
      } catch (_) {}
    }

    // 2. 核心插入执行逻辑 (三重容灾插入系统)
    async function executeInsertWeb(targetUrl) {
      let domain = "Web View";
      try {
        domain = new URL(targetUrl).hostname || "Web View";
      } catch (_) {}

      const height = 720;
      const widthMode = "editor";

      // 方案 A：调用官方 context.editor.insertEmbed
      if (context.editor?.insertEmbed) {
        try {
          await context.editor.insertEmbed({
            type: "web-view",
            resourceId: targetUrl,
            title: domain,
            data: { url: targetUrl, title: domain, height, widthMode },
          });
          return;
        } catch (err) {
          console.warn("[Web Companion] insertEmbed failed, fallback to tiptap:", err);
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
              dataJson: JSON.stringify({ url: targetUrl, title: domain, height, widthMode }),
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
        dataJson: JSON.stringify({ url: targetUrl, title: domain, height, widthMode }),
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

    // 4. 全局快捷键 Alt+W 唤起
    const onGlobalKeydown = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === "w" || e.key === "W") && !e.shiftKey && !e.ctrlKey) {
        const isEditing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
        if (!isEditing || document.activeElement?.closest(".edgeever-web-modal")) {
          e.preventDefault();
          openInsertDialog();
        }
      }
    };
    window.addEventListener("keydown", onGlobalKeydown, true);

    // 5. 注册命令
    if (context.commands?.register) {
      context.commands.register({
        id: "web-insert-iframe",
        title: "Web Companion: /web 插入网页 (Web Embed)",
        shortcut: "Alt-W",
        run: () => openInsertDialog(),
        execute: () => openInsertDialog(),
      });
    }

    if (context.ui?.commands?.register) {
      context.ui.commands.register({
        id: "web-companion.insert",
        name: "Web Companion: /web 插入网页",
        shortcut: "Alt+W",
        execute: () => openInsertDialog(),
      });
    }

    console.log("[Web Companion] v1.3.0 initialized successfully.");
  },

  deactivate() {
    if (window.__edgeever_wc_observer) {
      try {
        window.__edgeever_wc_observer.disconnect();
      } catch (_) {}
      window.__edgeever_wc_observer = null;
    }
    document.querySelectorAll(".edgeever-web-modal-backdrop, .edgeever-web-floating-trigger").forEach((el) => el.remove());
    document.getElementById("edgeever-web-companion-style")?.remove();
    console.log("[Web Companion] deactivated.");
  },
};
