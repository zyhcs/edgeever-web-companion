/**
 * EdgeEver Web Companion Plugin (网页伴侣)
 * /web 网页内嵌与 iframe 沉浸式浏览套件
 * v1.1.3 - 终极修复：标准代码块桥接(杜绝Tiptap剥离散落文本)、智能srcdoc穿透加载(突破CSP防嵌)、全尺寸整页网页渲染
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
  margin: 16px 0 !important;
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

injectPluginStyles();

// ==================== 2. 工具函数 ====================

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname || url;
  } catch (_) {
    return url;
  }
}

function sanitizeUrl(input) {
  let url = (input || "").trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

/**
 * 智能 srcdoc 穿透加载引擎：
 * 突破目标网站 Content-Security-Policy: frame-ancestors 与 X-Frame-Options 限制！
 */
async function loadUrlIntoIframe(iframe, url, loadingBar) {
  if (loadingBar) loadingBar.style.display = "block";

  try {
    const resp = await fetch(url).catch(() => null);
    if (resp && resp.ok) {
      let html = await resp.text();
      // 注入 base 标签让所有相对路径的 CSS/JS/图片 均指向原网站
      const baseTag = `<base href="${url}" target="_blank">`;
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, `$&${baseTag}`);
      } else {
        html = baseTag + html;
      }
      iframe.removeAttribute("src");
      iframe.srcdoc = html;
      if (loadingBar) loadingBar.style.display = "none";
      return;
    }
  } catch (err) {
    console.warn("[Web Companion] fetch 穿透失败，尝试原生 src:", err);
  }

  // 降级为原生 src 加载
  iframe.removeAttribute("srcdoc");
  iframe.src = url;
  iframe.onload = () => {
    if (loadingBar) loadingBar.style.display = "none";
  };
}

// ==================== 3. 插件主体定义 ====================

export default {
  async activate(context) {
    injectPluginStyles();

    let modalEl = null;

    function getActiveEditorElement() {
      const all = Array.from(document.querySelectorAll(".ProseMirror"));
      const valid = all.filter((el) => {
        if (!el.isConnected) return false;
        const inSidebar = el.closest(
          ".sidebar, .aside, .note-list, .memo-list, [class*='sidebar'], [class*='drawer'], [class*='list-container'], nav, aside, .ant-layout-sider"
        );
        return !inSidebar;
      });
      return valid.length > 0 ? valid[0] : null;
    }

    function getEditorInstance() {
      const pm = getActiveEditorElement();
      if (!pm) return null;
      return pm.pmViewDesc?.view?.editor || pm.__vueParentComponent?.ctx?.editor || null;
    }

    // ==================== 4. 呼出插入网页输入对话框 ====================

    async function promptInsertWebUrl() {
      if (modalEl) {
        modalEl.remove();
        modalEl = null;
      }

      let initialUrl = "";
      if (navigator.clipboard?.readText) {
        try {
          const text = await navigator.clipboard.readText();
          if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
            initialUrl = text.trim();
          }
        } catch (_) {}
      }

      modalEl = document.createElement("div");
      modalEl.className = "edgeever-web-modal-backdrop";
      modalEl.innerHTML = `
        <div class="edgeever-web-modal">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <div style="font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px;">
              <span>🌐</span>
              <span>插入内嵌网页 (Web Iframe)</span>
            </div>
            <button type="button" class="edgeever-web-modal-close" style="background:transparent;border:none;color:#94a3b8;font-size:14px;cursor:pointer;">✕</button>
          </div>

          <div style="margin-bottom:10px;">
            <label style="display:block;font-size:12px;font-weight:500;color:#94a3b8;margin-bottom:6px;">网页 URL 地址</label>
            <input type="url" class="edgeever-web-input-url" placeholder="如：https://yinghezhinan.com/" value="${escapeHtml(initialUrl)}" style="width:100%;padding:8px 12px;background:#14171d;border:1px solid rgba(255,255,255,0.15);border-radius:6px;font-size:13px;color:#e2e8f0;box-sizing:border-box;outline:none;" />
          </div>

          <div style="font-size:11px;color:#94a3b8;margin-bottom:16px;">
            💡 提示：按回车即可快速插入，支持智能穿透防嵌限制，全尺寸嵌入笔记中。
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
        executeInsertWeb(finalUrl);
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

    // ==================== 5. 网页插入执行引擎 (标准代码块桥接) ====================

    function executeInsertWeb(url) {
      const editor = getEditorInstance();
      const pm = getActiveEditorElement();

      // 必须使用 Tiptap 100% 接受的标准 codeBlock 桥接，绝不注入未知裸 HTML
      let inserted = false;
      if (editor?.commands?.insertContent) {
        try {
          editor.commands.insertContent(`\n\`\`\`web\n${url}\n\`\`\`\n`);
          inserted = true;
        } catch (_) {}
      }

      if (!inserted) {
        try {
          inserted = document.execCommand("insertText", false, `\n\`\`\`web\n${url}\n\`\`\`\n`);
        } catch (_) {}
      }

      if (!inserted && pm) {
        const block = buildWebCardElement(url);
        pm.appendChild(block);
        inserted = true;
      }

      // 调度水合器进行瞬时实体化
      setTimeout(renderAllWebEmbeds, 60);
      setTimeout(renderAllWebEmbeds, 200);
      setTimeout(renderAllWebEmbeds, 500);
    }

    // ==================== 6. 构建与渲染全功能网页卡片 ====================

    function buildWebCardElement(url) {
      const domain = extractDomain(url);
      const card = document.createElement("div");
      card.className = "edgeever-web-embed-block";
      card.dataset.webUrl = url;
      card.setAttribute("contenteditable", "false");

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

      bindCardEvents(card, url);
      return card;
    }

    function bindCardEvents(card, url) {
      const iframe = card.querySelector(".edgeever-web-iframe");
      const loadingBar = card.querySelector(".edgeever-web-loading-bar");
      const reloadBtn = card.querySelector(".edgeever-web-btn-reload");
      const copyBtn = card.querySelector(".edgeever-web-btn-copy");
      const fullBtn = card.querySelector(".edgeever-web-btn-full");
      const resizeBar = card.querySelector(".edgeever-web-resize-bar");
      const container = card.querySelector(".edgeever-web-iframe-container");

      if (iframe) {
        loadUrlIntoIframe(iframe, url, loadingBar);
      }

      if (reloadBtn && iframe) {
        reloadBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          loadUrlIntoIframe(iframe, url, loadingBar);
        };
      }

      if (copyBtn) {
        copyBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(url).then(() => {
            copyBtn.textContent = "✓ 已复制";
            setTimeout(() => { copyBtn.textContent = "📋 复制"; }, 1500);
          });
        };
      }

      if (fullBtn) {
        fullBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isFull = card.classList.toggle("is-fullscreen-view");
          fullBtn.textContent = isFull ? "🗗 还原" : "⛶ 铺满笔记";
        };
      }

      if (resizeBar && container) {
        let isDragging = false;
        let startY = 0;
        let startHeight = 0;

        resizeBar.onmousedown = (e) => {
          e.preventDefault();
          isDragging = true;
          startY = e.clientY;
          startHeight = container.offsetHeight;

          resizeBar.classList.add("is-dragging");
          if (iframe) iframe.style.pointerEvents = "none";

          const onMouseMove = (moveEvt) => {
            if (!isDragging) return;
            const delta = moveEvt.clientY - startY;
            const newHeight = Math.max(300, startHeight + delta);
            container.style.height = `${newHeight}px`;
          };

          const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            resizeBar.classList.remove("is-dragging");
            if (iframe) iframe.style.pointerEvents = "auto";
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
          };

          window.addEventListener("mousemove", onMouseMove);
          window.addEventListener("mouseup", onMouseUp);
        };
      }
    }

    /**
     * 全量核心水合扫描器：
     * 1) 自动识别并转换所有 language-web 代码块
     * 2) 自动清洗修复上一版本遗留的碎文本段落
     */
    function renderAllWebEmbeds() {
      // 1. 扫描代码块
      const codeBlocks = Array.from(document.querySelectorAll("pre, .edgeever-code-block"));
      codeBlocks.forEach((pre) => {
        if (pre.dataset.webHydrated === "true" || pre.closest(".edgeever-web-embed-block")) return;

        const codeText = (pre.textContent || "").trim();
        const isWebLang =
          pre.classList.contains("language-web") ||
          pre.querySelector("code.language-web") ||
          pre.dataset.language === "web" ||
          codeText.startsWith("web\n") ||
          /^https?:\/\//i.test(codeText);

        if (isWebLang || /^https?:\/\/[^\s]+$/i.test(codeText)) {
          const matchUrl = codeText.match(/https?:\/\/[^\s"'`<>]+/i);
          if (matchUrl) {
            const finalUrl = matchUrl[0];
            pre.dataset.webHydrated = "true";
            const card = buildWebCardElement(finalUrl);
            pre.parentElement?.insertBefore(card, pre);
            pre.style.display = "none";
          }
        }
      });

      // 2. 清洗修复旧版遗留的散落碎文本段落
      const allParagraphs = Array.from(document.querySelectorAll(".ProseMirror p"));
      allParagraphs.forEach((p) => {
        const txt = p.textContent || "";
        if (txt.includes("若因站点安全保护限制 (CSP)") || txt.includes("yinghezhinan.com")) {
          // 向上找到包含这一组碎文字的父级或自身，提取出 url
          const m = (p.innerHTML + " " + txt).match(/https?:\/\/[^\s"'<>]+/i) || ["https://yinghezhinan.com/"];
          const url = m[0];
          p.parentElement?.querySelectorAll("p").forEach((sib) => {
            const st = sib.textContent || "";
            if (st.includes("WEB") || st.includes("在浏览器打开") || st.includes("刷新") || st.includes("复制") || st.includes("铺满") || st.includes("若因站点安全")) {
              sib.remove();
            }
          });
          const card = buildWebCardElement(url);
          p.parentElement?.appendChild(card);
        }
      });
    }

    // ==================== 7. 输入监听与快捷胶囊 ====================

    function handleEditorKeyDown(e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        if (node && node.nodeType === Node.TEXT_NODE) {
          const textBeforeCursor = node.textContent.slice(0, range.startOffset);
          const match = textBeforeCursor.match(/(?:^|\s)\/web$/i);
          if (match) {
            e.preventDefault();
            e.stopPropagation();

            const deleteStart = range.startOffset - 4;
            const newRange = document.createRange();
            newRange.setStart(node, deleteStart);
            newRange.setEnd(node, range.startOffset);
            sel.removeAllRanges();
            sel.addRange(newRange);
            document.execCommand("delete");

            promptInsertWebUrl();
          }
        }
      }
    }

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
        promptInsertWebUrl();
      };

      if (getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
      }

      parent.insertBefore(pill, pm);
    }

    document.addEventListener("keydown", handleEditorKeyDown, true);

    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        injectPluginStyles();
        renderAllWebEmbeds();
        ensureQuickInsertPill();
      }, 80);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.__edgeever_wc_observer = observer;

    setTimeout(() => {
      injectPluginStyles();
      renderAllWebEmbeds();
      ensureQuickInsertPill();
    }, 200);

    // 注册全局快捷键命令
    if (context.commands?.register) {
      context.commands.register({
        id: "web-insert-iframe",
        title: "Web Companion: /web 插入网页 (Web Iframe)",
        shortcut: "Alt-W",
        run: () => promptInsertWebUrl(),
        execute: () => promptInsertWebUrl(),
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
    document.querySelectorAll("pre[data-web-hydrated='true']").forEach((el) => {
      el.style.display = "";
      delete el.dataset.webHydrated;
    });
    document.querySelectorAll(".edgeever-web-embed-block").forEach((el) => el.remove());
    document.getElementById("edgeever-web-companion-injected-styles")?.remove();
  },
};
