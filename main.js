/**
 * EdgeEver Web Companion Plugin (网页伴侣)
 * 官方标准嵌入架构：基于 context.editor.embeds.register 与 context.editor.insertEmbed
 * v1.2.1 - 自适应编辑器全宽 (Editor Breakout) 与自由高度伸缩持久化系统
 */

console.log(
  "%c[EdgeEver Web Companion] v1.2.1 Loaded - Auto Editor Width & Fluid Height Resizing",
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
  margin: 16px 0 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 10px !important;
  background: #13161c !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35) !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  user-select: none !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, width 0.15s ease, margin 0.15s ease !important;
  position: relative !important;
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
  background: rgba(22, 26, 33, 0.9) !important;
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
  height: 720px;
  min-height: 320px !important;
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

/* 底部 Mac 风格拖拽伸缩手柄 */
.edgeever-web-resize-bar {
  height: 14px !important;
  width: 100% !important;
  background: rgba(255, 255, 255, 0.02) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.04) !important;
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
  background: rgba(255, 255, 255, 0.18) !important;
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
  height: calc(100% - 48px) !important;
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

// ==================== 3. 页面穿透加载机制 ====================

async function loadUrlIntoIframe(card, iframe, url, loadingBar) {
  if (loadingBar) loadingBar.style.display = "block";
  let loaded = false;

  // 1. 尝试通过 EdgeEver publicNetwork 穿透并以 srcdoc 注入
  if (pluginContext?.network?.publicNetwork?.get) {
    try {
      const resp = await pluginContext.network.publicNetwork.get(url, {
        timeout: 10000,
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": navigator.userAgent,
        },
      });

      if (resp && resp.status >= 200 && resp.status < 400 && resp.data) {
        let html = typeof resp.data === "string" ? resp.data : String(resp.data);
        const finalUrl = resp.finalUrl || url;

        html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, "");
        html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, "");

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
    } catch (_) {}
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
        if (node.type.name === "edgeeverPluginEmbed" && (node.attrs.id === embedId || node.attrs.resourceId === oldUrl)) {
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
  if (!card || !card.parentElement) return;

  if (widthMode === "normal") {
    card.style.width = "100%";
    card.style.maxWidth = "100%";
    card.style.marginLeft = "0px";
    card.style.marginRight = "0px";
    return;
  }

  // 向上寻找主编辑器可滚动/工作区视口容器
  let cur = card.parentElement;
  let viewport = null;

  while (cur && cur !== document.body) {
    const style = window.getComputedStyle(cur);
    const overflowY = style.overflowY;
    const isScroll = (overflowY === "auto" || overflowY === "scroll");

    if (isScroll && cur.clientWidth > 500) {
      viewport = cur;
      break;
    }

    if (
      cur.classList.contains("note-content") ||
      cur.classList.contains("editor-container") ||
      cur.classList.contains("tiptap") ||
      cur.tagName === "MAIN"
    ) {
      viewport = cur;
    }
    cur = cur.parentElement;
  }

  if (!viewport) {
    // 降级为寻找宽度明显大于普通段落的祖先容器
    cur = card.parentElement;
    while (cur && cur !== document.body) {
      if (cur.clientWidth > card.parentElement.clientWidth + 60) {
        viewport = cur;
        break;
      }
      cur = cur.parentElement;
    }
  }

  if (!viewport) {
    viewport = card.closest(".overflow-y-auto") || card.offsetParent || document.body;
  }

  const viewportRect = viewport.getBoundingClientRect();
  const parentRect = card.parentElement.getBoundingClientRect();
  const viewportWidth = viewport.clientWidth;

  if (widthMode === "editor") {
    // 适应编辑器工作区宽度，左右保留 20px 舒适留白
    const targetWidth = Math.max(380, viewportWidth - 40);
    const targetLeft = viewportRect.left + 20;
    const offset = Math.round(targetLeft - parentRect.left);

    card.style.width = `${targetWidth}px`;
    card.style.maxWidth = `${targetWidth}px`;
    card.style.marginLeft = `${offset}px`;
    card.style.marginRight = "auto";
  } else if (widthMode === "wide") {
    // 宽屏模式 1080px 居中
    const maxW = Math.min(1080, viewportWidth - 32);
    const targetLeft = viewportRect.left + (viewportWidth - maxW) / 2;
    const offset = Math.round(targetLeft - parentRect.left);

    card.style.width = `${maxW}px`;
    card.style.maxWidth = `${maxW}px`;
    card.style.marginLeft = `${offset}px`;
    card.style.marginRight = "auto";
  }
}

// ==================== 6. 网页卡片属性设置弹窗 ====================

function openEmbedSettingsModal({ title, url, height, widthMode }, onSave) {
  let modal = document.createElement("div");
  modal.className = "edgeever-web-modal-backdrop";
  modal.innerHTML = `
    <div class="edgeever-web-modal">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span style="font-weight:700;font-size:14px;color:#f8fafc;display:flex;align-items:center;gap:6px;">
          ⚙️ 网页卡片属性设置
        </span>
        <button type="button" class="edgeever-web-modal-close" style="background:none;border:none;color:#94a3b8;font-size:17px;cursor:pointer;padding:0 4px;">✕</button>
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11.5px;font-weight:500;color:#94a3b8;margin-bottom:5px;">卡片标题 (Title)</label>
        <input type="text" class="edgeever-web-input-title" value="${escapeHtml(title)}" placeholder="自定义标题（默认显示网址）" style="width:100%;box-sizing:border-box;padding:7px 10px;background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#f8fafc;font-size:12.5px;outline:none;" />
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11.5px;font-weight:500;color:#94a3b8;margin-bottom:5px;">目标网址 (URL)</label>
        <input type="text" class="edgeever-web-input-url" value="${escapeHtml(url)}" placeholder="https://example.com" style="width:100%;box-sizing:border-box;padding:7px 10px;background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#f8fafc;font-size:12.5px;outline:none;" />
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11.5px;font-weight:500;color:#94a3b8;margin-bottom:5px;">宽度显示模式</label>
        <div style="display:flex;gap:6px;" class="edgeever-web-width-opts">
          <button type="button" class="edgeever-web-width-btn" data-mode="editor" style="flex:1;padding:6px;background:${widthMode === 'editor' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)'};border:1px solid ${widthMode === 'editor' ? '#38bdf8' : 'rgba(255,255,255,0.1)'};border-radius:5px;color:${widthMode === 'editor' ? '#38bdf8' : '#cbd5e1'};font-size:11px;cursor:pointer;">🌟 适应编辑器全宽</button>
          <button type="button" class="edgeever-web-width-btn" data-mode="wide" style="flex:1;padding:6px;background:${widthMode === 'wide' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)'};border:1px solid ${widthMode === 'wide' ? '#38bdf8' : 'rgba(255,255,255,0.1)'};border-radius:5px;color:${widthMode === 'wide' ? '#38bdf8' : '#cbd5e1'};font-size:11px;cursor:pointer;">📐 宽屏居中 (1080px)</button>
          <button type="button" class="edgeever-web-width-btn" data-mode="normal" style="flex:1;padding:6px;background:${widthMode === 'normal' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)'};border:1px solid ${widthMode === 'normal' ? '#38bdf8' : 'rgba(255,255,255,0.1)'};border-radius:5px;color:${widthMode === 'normal' ? '#38bdf8' : '#cbd5e1'};font-size:11px;cursor:pointer;">📝 标准正文宽</button>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
          <label style="font-size:11.5px;font-weight:500;color:#94a3b8;">视窗高度调节 (可在底部直接自由拖拽)</label>
          <span style="font-size:11px;color:#38bdf8;font-family:monospace;" class="edgeever-web-h-display">${height}px</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
          <input type="number" class="edgeever-web-input-h" value="${height}" min="320" max="2500" step="50" style="width:90px;box-sizing:border-box;padding:6px 8px;background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#f8fafc;font-size:12px;outline:none;" />
          <span style="font-size:11px;color:#94a3b8;">px</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button type="button" class="edgeever-web-preset-h" data-height="550" style="padding:4px 9px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:5px;color:#cbd5e1;font-size:11px;cursor:pointer;">550px</button>
          <button type="button" class="edgeever-web-preset-h" data-height="720" style="padding:4px 9px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:5px;color:#cbd5e1;font-size:11px;cursor:pointer;">720px (舒适)</button>
          <button type="button" class="edgeever-web-preset-h" data-height="950" style="padding:4px 9px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:5px;color:#cbd5e1;font-size:11px;cursor:pointer;">950px</button>
          <button type="button" class="edgeever-web-preset-h" data-height="${Math.max(500, window.innerHeight - 180)}" style="padding:4px 9px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:5px;color:#cbd5e1;font-size:11px;cursor:pointer;">撑满屏幕高</button>
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
  const hInput = modal.querySelector(".edgeever-web-input-h");
  const hDisplay = modal.querySelector(".edgeever-web-h-display");
  const closeBtn = modal.querySelector(".edgeever-web-modal-close");
  const cancelBtn = modal.querySelector(".edgeever-web-modal-cancel");
  const saveBtn = modal.querySelector(".edgeever-web-modal-save");

  let selectedHeight = height;
  let selectedWidthMode = widthMode || "editor";

  // 宽度模式切换
  modal.querySelectorAll(".edgeever-web-width-btn").forEach((btn) => {
    btn.onclick = () => {
      selectedWidthMode = btn.dataset.mode;
      modal.querySelectorAll(".edgeever-web-width-btn").forEach((b) => {
        const isCur = b.dataset.mode === selectedWidthMode;
        b.style.background = isCur ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.06)";
        b.style.borderColor = isCur ? "#38bdf8" : "rgba(255,255,255,0.1)";
        b.style.color = isCur ? "#38bdf8" : "#cbd5e1";
      });
    };
  });

  // 高度输入监听
  hInput.oninput = () => {
    const val = parseInt(hInput.value, 10);
    if (val && val >= 200) {
      selectedHeight = val;
      hDisplay.textContent = `${val}px`;
    }
  };

  // 高度预设点击
  modal.querySelectorAll(".edgeever-web-preset-h").forEach((btn) => {
    btn.onclick = () => {
      selectedHeight = parseInt(btn.dataset.height, 10);
      hInput.value = selectedHeight;
      hDisplay.textContent = `${selectedHeight}px`;
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
      onSave({
        title: finalTitle,
        url: finalNewUrl,
        height: selectedHeight,
        widthMode: selectedWidthMode,
      });
    }
  };

  setTimeout(() => titleInput?.focus(), 60);
}

// ==================== 7. 构建与挂载卡片 DOM ====================

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
  let domain = "";
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
        <div class="edgeever-web-embed-left" title="点击编辑网页标题与链接属性">
          <span class="edgeever-web-tag">WEB</span>
          <div class="edgeever-web-title-wrap">
            <span class="edgeever-web-domain-title">${escapeHtml(currentTitle)}</span>
            <span class="edgeever-web-edit-hint">✏️</span>
          </div>
        </div>
        <div class="edgeever-web-embed-actions">
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-width" title="点击切换宽度模式：适应编辑器全宽 / 宽屏 / 标准宽">${getWidthLabel(currentWidthMode)}</button>
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-settings" title="属性设置：自定义标题、网址、宽度与高度">⚙️ 设置</button>
          <a class="edgeever-web-btn-icon edgeever-web-btn-primary edgeever-web-action-link" href="${escapeHtml(currentUrl)}" target="_blank" rel="noopener" title="在系统独立浏览器中打开此页面">🚀 打开</a>
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-reload" title="刷新页面">🔄 刷新</button>
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-copy" title="复制网址">📋 复制</button>
          <button type="button" class="edgeever-web-btn-icon edgeever-web-btn-full" title="铺满整页切换">⛶ 铺满</button>
        </div>
      </div>
      <div class="edgeever-web-iframe-container" style="height:${currentHeight}px;">
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
      <div class="edgeever-web-resize-bar" title="按住自由拖拽调节视窗高度 · 双击在自适应屏幕与默认高度间切换">
        <div class="edgeever-web-resize-pill"></div>
        <span class="edgeever-web-height-badge">${currentHeight}px</span>
      </div>
    `;

    bindCardEvents();
  }

  function bindCardEvents() {
    const leftTitle = card.querySelector(".edgeever-web-embed-left");
    const widthBtn = card.querySelector(".edgeever-web-btn-width");
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
    const heightBadge = card.querySelector(".edgeever-web-height-badge");

    // 立即应用当前宽度自适应布局
    applyCardLayout(card, currentWidthMode);

    // 加载当前 URL
    if (iframe) {
      loadUrlIntoIframe(card, iframe, currentUrl, loadingBar);
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

    // 设置与修改属性逻辑
    const handleOpenSettings = (e) => {
      e?.stopPropagation();
      openEmbedSettingsModal(
        {
          title: currentTitle,
          url: currentUrl,
          height: containerEl.offsetHeight,
          widthMode: currentWidthMode,
        },
        ({ title: newTitle, url: newUrl, height: newHeight, widthMode: newWidthMode }) => {
          const oldUrl = currentUrl;
          currentTitle = newTitle;
          currentUrl = newUrl;
          currentHeight = newHeight;
          currentWidthMode = newWidthMode;

          if (containerEl) {
            containerEl.style.height = `${currentHeight}px`;
          }

          applyCardLayout(card, currentWidthMode);

          // 持久化保存到笔记文档
          updateEmbedAttributesInDoc(embedId, oldUrl, currentTitle, currentUrl, currentHeight, currentWidthMode);

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

      // 禁用 iframe pointer-events，防止鼠标划入 iframe 导致拖拽中断卡死
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

  // 监听尺寸变化以自适应编辑器宽度
  let resizeObserver = null;
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      if (!card.classList.contains("is-fullscreen-view")) {
        applyCardLayout(card, currentWidthMode);
      }
    });
    if (card.parentElement) {
      resizeObserver.observe(card.parentElement);
    }
  }

  const onWindowResize = () => {
    if (!card.classList.contains("is-fullscreen-view")) {
      applyCardLayout(card, currentWidthMode);
    }
  };
  window.addEventListener("resize", onWindowResize);

  // 延迟二次修正布局（等待 DOM 树完全挂载就位）
  setTimeout(() => {
    applyCardLayout(card, currentWidthMode);
  }, 100);

  return () => {
    if (resizeObserver) resizeObserver.disconnect();
    window.removeEventListener("resize", onWindowResize);
    container.innerHTML = "";
  };
}

// ==================== 8. 插入网页输入弹窗 ====================

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

// ==================== 9. 插件激活与核心生命周期 ====================

export default {
  async activate(context) {
    pluginContext = context;
    ensureInjectedStyle();

    // 1. 注册 EdgeEver 官方原生插件嵌入类型
    if (context.editor?.embeds?.register) {
      try {
        context.editor.embeds.register({
          type: "web-companion",
          title: "网页视窗 (Web Embed)",
          render: (container, data) => {
            return mountWebCompanionCard(container, data);
          },
        });
        console.log("[Web Companion] embeds.register('web-companion') succeeded.");
      } catch (err) {
        console.error("[Web Companion] embeds.register failed:", err);
      }
    }

    // 2. 插入逻辑：调用官方 context.editor.insertEmbed
    const triggerInsertWeb = (targetUrl) => {
      let url = sanitizeUrl(targetUrl);
      let title = url;
      try {
        title = new URL(url).hostname || url;
      } catch (_) {}

      if (context.editor?.insertEmbed) {
        try {
          context.editor.insertEmbed("web-companion", {
            url,
            title,
            height: 720,
            widthMode: "editor",
          });
          return;
        } catch (e) {
          console.warn("[Web Companion] insertEmbed failed, fallback to tiptap:", e);
        }
      }

      // Tiptap 兜底插入
      const editor = getEditorInstance();
      if (editor?.commands?.insertContent) {
        editor.commands.insertContent({
          type: "edgeeverPluginEmbed",
          attrs: {
            pluginId: "org.edgeever.plugins.web-companion",
            embedType: "web-companion",
            title,
            resourceId: url,
            dataJson: JSON.stringify({ url, title, height: 720, widthMode: "editor" }),
          },
        });
      }
    };

    // 3. 注册命令与快捷键
    if (context.ui?.commands?.register) {
      context.ui.commands.register({
        id: "web-companion.insert",
        name: "Web Companion: /web 插入网页",
        shortcut: "Alt+W",
        execute: () => {
          promptInsertWebUrl((url) => triggerInsertWeb(url));
        },
      });
    }

    // 全局快捷键 Alt+W 唤起
    const onGlobalKeydown = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === "w" || e.key === "W") && !e.shiftKey && !e.ctrlKey) {
        const isEditing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
        if (!isEditing || document.activeElement?.closest(".edgeever-web-modal")) {
          e.preventDefault();
          promptInsertWebUrl((url) => triggerInsertWeb(url));
        }
      }
    };
    window.addEventListener("keydown", onGlobalKeydown, true);

    // 4. 输入 /web 自动触发插入监听
    const onInputWebTrigger = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const anchorNode = sel.anchorNode;
        if (!anchorNode) return;

        const text = anchorNode.textContent || "";
        const offset = sel.anchorOffset;
        const textBeforeCursor = text.slice(0, offset);

        const match = textBeforeCursor.match(/(?:^|\s)\/web$/i);
        if (match) {
          e.preventDefault();
          e.stopPropagation();

          // 清除 /web 触发词
          try {
            const range = sel.getRangeAt(0);
            const start = offset - match[0].length + (match[0].startsWith(" ") ? 1 : 0);
            range.setStart(anchorNode, start);
            range.setEnd(anchorNode, offset);
            range.deleteContents();
          } catch (_) {}

          promptInsertWebUrl((url) => triggerInsertWeb(url));
        }
      }
    };
    window.addEventListener("keydown", onInputWebTrigger, true);

    console.log("[Web Companion] v1.2.1 initialized successfully.");
  },

  async deactivate() {
    ensureInjectedStyle();
    console.log("[Web Companion] deactivated.");
  },
};
