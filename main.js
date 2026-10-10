/**
 * EdgeEver Web Companion Plugin (网页伴侣)
 * 官方标准嵌入架构：基于 context.editor.embeds.register 与 context.editor.insertEmbed
 * v1.1.4 - 彻底根除“一闪就没了”：接入 EdgeEver 原生 Plugin Embed 节点体系
 */

// 清理历史残留
if (window.__edgeever_wc_observer) {
  try {
    window.__edgeever_wc_observer.disconnect();
  } catch (_) {}
  window.__edgeever_wc_observer = null;
}

document.querySelectorAll(
  ".edgeever-wc-topbar, .edgeever-wc-bind-trigger, .edgeever-wc-web-pane, .edgeever-wc-resizer, .edgeever-wc-modal-backdrop"
).forEach((el) => {
  try { el.remove(); } catch (_) {}
});

// ==================== 1. 样式内联注入器 ====================

const INJECTED_CSS = `
.edgeever-web-embed-block {
  display: block !important;
  width: 100% !important;
  margin: 12px 0 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 8px !important;
  background: #14171d !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45) !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  user-select: none !important;
}

.edgeever-web-embed-bar {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 8px 12px !important;
  background: #1c1f26 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  gap: 8px !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  box-sizing: border-box !important;
}

.edgeever-web-embed-left {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  min-width: 0 !important;
}

.edgeever-web-tag {
  font-size: 10.5px !important;
  font-weight: 700 !important;
  padding: 2px 6px !important;
  background: rgba(56, 189, 248, 0.16) !important;
  color: #38bdf8 !important;
  border-radius: 4px !important;
  letter-spacing: 0.5px !important;
  white-space: nowrap !important;
}

.edgeever-web-domain-title {
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #e2e8f0 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 280px !important;
}

.edgeever-web-embed-actions {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 6px !important;
  flex-shrink: 0 !important;
}

.edgeever-web-action-link {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  padding: 4px 10px !important;
  background: #38bdf8 !important;
  color: #ffffff !important;
  border-radius: 5px !important;
  font-size: 11.5px !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  transition: all 0.15s ease !important;
  white-space: nowrap !important;
  cursor: pointer !important;
}

.edgeever-web-action-link:hover {
  background: #0284c7 !important;
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.4) !important;
}

.edgeever-web-action-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 3px !important;
  padding: 4px 8px !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 5px !important;
  color: #cbd5e1 !important;
  font-size: 11px !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  white-space: nowrap !important;
}

.edgeever-web-action-btn:hover {
  background: rgba(255, 255, 255, 0.16) !important;
  color: #ffffff !important;
}

.edgeever-web-iframe-container {
  width: 100% !important;
  height: calc(100vh - 220px) !important;
  min-height: 580px !important;
  position: relative !important;
  background: #14171d !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

.edgeever-web-iframe {
  width: 100% !important;
  height: 100% !important;
  border: none !important;
  display: block !important;
  background: #ffffff !important;
  box-sizing: border-box !important;
}

.edgeever-web-loading-bar {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 3px !important;
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
  height: 7px !important;
  width: 100% !important;
  background: rgba(255, 255, 255, 0.05) !important;
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
  height: calc(100% - 42px) !important;
  min-height: unset !important;
}

.edgeever-web-floating-trigger {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  padding: 4px 10px !important;
  background: #1c1f26 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 6px !important;
  color: #94a3b8 !important;
  font-size: 11.5px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  margin: 6px 0 10px 0 !important;
  width: fit-content !important;
  user-select: none !important;
}

.edgeever-web-floating-trigger:hover {
  background: rgba(56, 189, 248, 0.12) !important;
  color: #38bdf8 !important;
  border-color: #38bdf8 !important;
}

.edgeever-web-modal-backdrop {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.7) !important;
  backdrop-filter: blur(4px) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 9999 !important;
}

.edgeever-web-modal {
  width: 440px !important;
  max-width: 90vw !important;
  background: #1c1f26 !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 8px !important;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6) !important;
  padding: 18px !important;
  color: #e2e8f0 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
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

// ==================== 3. 智能穿透加载引擎 (突破 CSP frame-ancestors 'none') ====================

let pluginContext = null;

async function fetchPublicHtml(url, maxRedirects = 3) {
  if (!pluginContext?.network?.fetch) return null;

  let currentUrl = url;
  for (let i = 0; i <= maxRedirects; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);

      // 注意：严格只传递 EdgeEver 白名单允许的请求头 (accept)！绝不传 User-Agent！
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

  // 1. 优先通过 EdgeEver 官方后台 Public Network 拉取（无 CORS 限制，Node 环境直达）
  const fetched = await fetchPublicHtml(url);
  if (fetched) {
    let { html, finalUrl } = fetched;

    // 清洗目标页面中可能存在的安全限制 meta
    html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, "");
    html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, "");

    // 注入 base 标签使所有相对路径指向原站，且超链接自动新标签打开
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
    const warnBox = containerEl?.querySelector(".edgeever-web-blocked-notice");
    if (warnBox) warnBox.remove();
  };

  // 3. 超时或被防嵌拦截保护处理 (针对 GitHub 等强安全或加载慢的网站)
  setTimeout(() => {
    if (loadingBar) loadingBar.style.display = "none";
    if (!loaded && containerEl) {
      let notice = containerEl.querySelector(".edgeever-web-blocked-notice");
      if (!notice) {
        notice = document.createElement("div");
        notice.className = "edgeever-web-blocked-notice";
        notice.style.cssText = "position:absolute;bottom:14px;right:14px;background:rgba(20,23,29,0.94);border:1px solid rgba(56,189,248,0.4);border-radius:6px;padding:8px 12px;display:flex;align-items:center;gap:10px;box-shadow:0 6px 20px rgba(0,0,0,0.6);z-index:20;backdrop-filter:blur(6px);";
        notice.innerHTML = `
          <span style="font-size:11.5px;color:#cbd5e1;">⚠️ 加载缓慢或受网站防嵌限制？</span>
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener" style="padding:4px 10px;background:#38bdf8;color:#fff;border-radius:4px;font-size:11.5px;font-weight:600;text-decoration:none;">🚀 在浏览器打开</a>
        `;
        containerEl.querySelector(".edgeever-web-iframe-container")?.appendChild(notice);
      }
    }
  }, 4000);
}

// ==================== 4. 构建与挂载卡片 DOM ====================

function mountWebCompanionCard(container, url) {
  let domain = url;
  try {
    domain = new URL(url).hostname || url;
  } catch (_) {}

  container.innerHTML = "";
  const card = document.createElement("div");
  card.className = "edgeever-web-embed-block";
  card.setAttribute("contenteditable", "false");
  card.style.cssText = "display:block;width:100%;margin:12px 0;border:1px solid rgba(255,255,255,0.12);border-radius:8px;background:#14171d;box-shadow:0 8px 24px rgba(0,0,0,0.45);overflow:hidden;box-sizing:border-box;user-select:none;";

  card.innerHTML = `
    <div class="edgeever-web-embed-bar" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#1c1f26;border-bottom:1px solid rgba(255,255,255,0.1);gap:8px;">
      <div class="edgeever-web-embed-left" style="display:flex;align-items:center;gap:8px;">
        <span class="edgeever-web-tag" style="font-size:10.5px;font-weight:700;padding:2px 6px;background:rgba(56,189,248,0.16);color:#38bdf8;border-radius:4px;">WEB</span>
        <span class="edgeever-web-domain-title" style="font-size:12.5px;font-weight:600;color:#e2e8f0;" title="${escapeHtml(url)}">${escapeHtml(domain)}</span>
      </div>
      <div class="edgeever-web-embed-actions" style="display:flex;align-items:center;gap:6px;">
        <a class="edgeever-web-action-link" href="${escapeHtml(url)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#38bdf8;color:#ffffff;border-radius:5px;font-size:11.5px;font-weight:600;text-decoration:none;" title="在系统浏览器新窗口中打开此网页">🚀 在浏览器打开</a>
        <button type="button" class="edgeever-web-action-btn edgeever-web-btn-reload" style="padding:4px 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:5px;color:#cbd5e1;font-size:11px;cursor:pointer;" title="刷新页面">🔄 刷新</button>
        <button type="button" class="edgeever-web-action-btn edgeever-web-btn-copy" style="padding:4px 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:5px;color:#cbd5e1;font-size:11px;cursor:pointer;" title="复制网址">📋 复制</button>
        <button type="button" class="edgeever-web-action-btn edgeever-web-btn-full" style="padding:4px 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:5px;color:#cbd5e1;font-size:11px;cursor:pointer;" title="铺满整页切换">⛶ 铺满笔记</button>
      </div>
    </div>
    <div class="edgeever-web-iframe-container" style="width:100%;height:calc(100vh - 220px);min-height:580px;position:relative;background:#14171d;">
      <div class="edgeever-web-loading-bar"></div>
      <iframe class="edgeever-web-iframe" style="width:100%;height:100%;border:none;background:#ffffff;" allow="fullscreen" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"></iframe>
    </div>
    <div class="edgeever-web-resize-bar" style="height:7px;width:100%;background:rgba(255,255,255,0.05);cursor:row-resize;" title="向下拖拽调节网页显示高度"></div>
  `;

  const reloadBtn = card.querySelector(".edgeever-web-btn-reload");
  const copyBtn = card.querySelector(".edgeever-web-btn-copy");
  const fullBtn = card.querySelector(".edgeever-web-btn-full");
  const iframe = card.querySelector(".edgeever-web-iframe");
  const loadingBar = card.querySelector(".edgeever-web-loading-bar");
  const resizeBar = card.querySelector(".edgeever-web-resize-bar");
  const containerEl = card.querySelector(".edgeever-web-iframe-container");

  // 加载页面
  if (iframe) {
    loadUrlIntoIframe(card, iframe, url, loadingBar);
  }

  // 事件绑定
  reloadBtn.onclick = (e) => {
    e.stopPropagation();
    if (iframe) loadUrlIntoIframe(card, iframe, url, loadingBar);
  };

  copyBtn.onclick = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      const originText = copyBtn.textContent;
      copyBtn.textContent = "✅ 已复制";
      setTimeout(() => { copyBtn.textContent = originText; }, 1500);
    } catch (_) {}
  };

  fullBtn.onclick = (e) => {
    e.stopPropagation();
    const isFull = card.classList.toggle("is-fullscreen-view");
    fullBtn.textContent = isFull ? "🗗 还原视图" : "⛶ 铺满笔记";
  };

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

  container.appendChild(card);

  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    container.innerHTML = "";
  };
}

// ==================== 5. 网页地址输入交互弹窗 ====================

let modalEl = null;

function promptInsertWebUrl(onConfirmCallback) {
  if (modalEl) modalEl.remove();

  modalEl = document.createElement("div");
  modalEl.className = "edgeever-web-modal-backdrop";
  modalEl.innerHTML = `
    <div class="edgeever-web-modal">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-weight:700;font-size:15px;color:#f8fafc;display:flex;align-items:center;gap:6px;">
          🌐 插入内嵌网页 (Web Embed)
        </span>
        <button type="button" class="edgeever-web-modal-close" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;padding:0 4px;">✕</button>
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:6px;">目标网页地址 (URL)</label>
        <input type="text" class="edgeever-web-input-url" placeholder="https://example.com" style="width:100%;box-sizing:border-box;padding:8px 10px;background:#0f172a;border:1px solid rgba(255,255,255,0.18);border-radius:6px;color:#f8fafc;font-size:13px;outline:none;" />
      </div>

      <div style="font-size:11px;color:#94a3b8;margin-bottom:16px;">
        💡 提示：按回车即可插入。采用 EdgeEver 官方嵌入引擎与智能穿透加载，全尺寸展示在笔记中。
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button type="button" class="edgeever-web-modal-cancel" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:5px;color:#e2e8f0;font-size:12px;cursor:pointer;">取消</button>
        <button type="button" class="edgeever-web-modal-confirm" style="padding:6px 16px;background:#38bdf8;border:none;border-radius:5px;color:#ffffff;font-size:12px;font-weight:600;cursor:pointer;">立即插入</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const input = modalEl.querySelector(".edgeever-web-input-url");
  const closeBtn = modalEl.querySelector(".edgeever-web-modal-close");
  const cancelBtn = modalEl.querySelector(".edgeever-web-modal-cancel");
  const confirmBtn = modalEl.querySelector(".edgeever-web-modal-confirm");

  // 尝试读取剪贴板
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
    if (modalEl) {
      modalEl.remove();
      modalEl = null;
    }
  };

  closeBtn.onclick = doClose;
  cancelBtn.onclick = doClose;
  modalEl.onclick = (e) => {
    if (e.target === modalEl) doClose();
  };

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

// ==================== 6. 插件激活与核心生命周期 ====================

export default {
  activate(context) {
    pluginContext = context;
    injectPluginStyles();

    // 1. 注册官方原生嵌入渲染器 (Official Plugin Embed Renderer)
    // EdgeEver 内部会自动为该节点创建 container 并调用 mount，生命周期完全由官方受控！
    if (context.editor?.embeds?.register) {
      try {
        context.editor.embeds.register({
          type: "web-view",
          async mount(container, embedData) {
            const url = embedData?.data?.url || embedData?.resourceId || "";
            return mountWebCompanionCard(container, url);
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

      // 方案 A：使用 context.editor.insertEmbed (EdgeEver 官方标准 API)
      if (context.editor?.insertEmbed) {
        try {
          await context.editor.insertEmbed({
            type: "web-view",
            resourceId: targetUrl,
            title: domain,
            data: { url: targetUrl },
          });
          return;
        } catch (err) {
          console.warn("[Web Companion] context.editor.insertEmbed failed:", err);
        }
      }

      // 方案 B：使用 Tiptap editor 实例直接插入官方标准节点
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
              dataJson: JSON.stringify({ url: targetUrl }),
            },
          });
          return;
        } catch (err) {
          console.warn("[Web Companion] insertContent edgeeverPluginEmbed failed:", err);
        }
      }

      // 方案 C：在 Markdown 模式下插入官方识别的嵌入语法
      const mdCode = `\n\`\`\`edgeever-plugin-embed\n${JSON.stringify({
        id: `embed_${Date.now()}`,
        pluginId: "org.edgeever.plugins.web-companion",
        type: "web-view",
        resourceId: targetUrl,
        title: domain,
        dataJson: JSON.stringify({ url: targetUrl }),
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

    // 3. 呼出并插入
    function openInsertDialog() {
      promptInsertWebUrl((url) => {
        executeInsertWeb(url);
      });
    }

    // 4. 输入 /web 快捷拦截处理
    function handleEditorKeyDown(e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        const sel = window.getSelection();
        if (!sel || !sel.isCollapsed || !sel.anchorNode) return;

        const node = sel.anchorNode;
        const text = node.textContent || "";
        const offset = sel.anchorOffset;

        // 检查光标前是否为 "/web"
        if (offset >= 4 && text.slice(offset - 4, offset).toLowerCase() === "/web") {
          const prefix = text.slice(0, offset - 4);
          const isAtStart = offset === 4 || /[\s\n]$/.test(prefix);

          if (isAtStart) {
            e.preventDefault();
            e.stopPropagation();

            // 删除输入的 "/web"
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

    // 5. 右上角浮动快捷小药丸 [ 🌐 插入网页 (/web) ]
    function ensureQuickInsertPill() {
      const pm = getActiveEditorElement();
      if (!pm || !pm.parentElement) return;

      const parent = pm.parentElement;
      if (parent.querySelector(".edgeever-web-floating-trigger")) return;

      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "edgeever-web-floating-trigger";
      pill.innerHTML = `🌐 插入网页 (/web)`;
      pill.title = "点击插入全尺寸内嵌网页，亦可在正文中直接输入 /web 并按回车";
      pill.onclick = (e) => {
        e.stopPropagation();
        openInsertDialog();
      };

      if (getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
      }

      parent.insertBefore(pill, pm);
    }

    // 6. 清理旧版本遗留的散落文本
    function cleanupLegacyOrphanTexts() {
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
        ensureQuickInsertPill();
        cleanupLegacyOrphanTexts();
      }, 100);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.__edgeever_wc_observer = observer;

    setTimeout(() => {
      injectPluginStyles();
      ensureQuickInsertPill();
      cleanupLegacyOrphanTexts();
    }, 200);

    // 7. 注册全局快捷键命令
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
