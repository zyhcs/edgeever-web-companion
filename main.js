/**
 * EdgeEver Web Companion Plugin (网页伴侣)
 * /web 网页内嵌与 iframe 沉浸式浏览套件
 * v1.1.0 - 全新架构：直接输入 /web 插入网页，iframe 沉浸式铺满笔记，零外挂入侵
 */

// 彻底清理上一代方案遗留的全局 Observer 与外挂 DOM
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

// ==================== 1. 基础工具与图标库 ====================

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

// ==================== 2. 插件主体定义 ====================

export default {
  async activate(context) {
    let modalEl = null;

    // 查找当前激活的主编辑器 ProseMirror
    function getActiveEditorElement() {
      const all = Array.from(document.querySelectorAll(".ProseMirror"));
      const valid = all.filter((el) => {
        if (!el.isConnected) return false;
        const inSidebar = el.closest(".sidebar, .aside, .note-list, .memo-list, [class*='sidebar'], [class*='drawer'], [class*='list-container'], nav, aside, .ant-layout-sider");
        return !inSidebar;
      });
      return valid.length > 0 ? valid[0] : null;
    }

    // 获取 Tiptap / ProseMirror 的 editor 实例
    function getEditorInstance() {
      const pm = getActiveEditorElement();
      if (!pm) return null;
      return pm.pmViewDesc?.view?.editor || pm.__vueParentComponent?.ctx?.editor || null;
    }

    // ==================== 3. 呼出插入网页输入对话框 ====================

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
          <div class="edgeever-web-modal-header">
            <div class="edgeever-web-modal-title">
              <span>🌐</span>
              <span>插入内嵌网页 (Web Iframe)</span>
            </div>
            <button type="button" class="edgeever-web-modal-close" title="关闭">✕</button>
          </div>

          <div class="edgeever-web-form-group">
            <label class="edgeever-web-form-label">网页 URL 地址</label>
            <input type="url" class="edgeever-web-form-input edgeever-web-input-url" placeholder="如：https://yinghezhinan.com/ 或 github.com" value="${escapeHtml(initialUrl)}" />
          </div>

          <div class="edgeever-web-modal-hint">
            💡 提示：按回车即可快速插入，网页将以全尺寸 iframe 嵌入当前笔记中。
          </div>

          <div class="edgeever-web-modal-footer">
            <button type="button" class="edgeever-web-btn-secondary edgeever-web-modal-cancel">取消</button>
            <button type="button" class="edgeever-web-btn-primary edgeever-web-modal-confirm">立即插入</button>
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
        insertWebIframeBlock(finalUrl);
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

    // ==================== 4. 将 iframe 网页视窗插入笔记 ====================

    function createWebBlockHtml(url) {
      const domain = extractDomain(url);
      return `
<div class="edgeever-web-embed-block" data-web-url="${escapeHtml(url)}">
  <div class="edgeever-web-embed-bar">
    <div class="edgeever-web-embed-left">
      <span class="edgeever-web-tag">WEB</span>
      <span class="edgeever-web-domain-title" title="${escapeHtml(url)}">${escapeHtml(domain)}</span>
    </div>
    <div class="edgeever-web-embed-actions">
      <a class="edgeever-web-action-link" href="${escapeHtml(url)}" target="_blank" rel="noopener" title="在系统浏览器新窗口中打开此网页">🚀 在浏览器打开</a>
      <button type="button" class="edgeever-web-action-btn edgeever-web-btn-reload" title="刷新页面">🔄 刷新</button>
      <button type="button" class="edgeever-web-action-btn edgeever-web-btn-copy" title="复制网址">📋 复制</button>
      <button type="button" class="edgeever-web-action-btn edgeever-web-btn-full" title="铺满整页切换">⛶ 铺满笔记</button>
    </div>
  </div>
  <div class="edgeever-web-iframe-container">
    <iframe class="edgeever-web-iframe" src="${escapeHtml(url)}" allow="fullscreen" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"></iframe>
    <div class="edgeever-web-csp-tip">
      若因站点安全保护限制 (CSP) 未显示内容，可点击上方「🚀 在浏览器打开」
    </div>
  </div>
  <div class="edgeever-web-resize-bar" title="向下拖拽调节网页显示高度"></div>
</div>
<p></p>
`;
    }

    function insertWebIframeBlock(url) {
      const html = createWebBlockHtml(url);
      const editor = getEditorInstance();

      let inserted = false;
      if (editor?.commands?.insertContent) {
        try {
          editor.commands.insertContent(html);
          inserted = true;
        } catch (_) {}
      }

      if (!inserted) {
        try {
          document.execCommand("insertHTML", false, html);
          inserted = true;
        } catch (_) {}
      }

      if (!inserted) {
        const pm = getActiveEditorElement();
        if (pm) {
          const div = document.createElement("div");
          div.innerHTML = html;
          pm.appendChild(div);
          inserted = true;
        }
      }

      // 插入后立即增强交互事件
      setTimeout(enhanceAllWebBlocks, 150);
    }

    // ==================== 5. 监听输入 /web 命令 ====================

    function handleEditorKeyDown(e) {
      // 当按下回车键或空格键时，检查是否输入了 /web
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        if (node && node.nodeType === Node.TEXT_NODE) {
          const textBeforeCursor = node.textContent.slice(0, range.startOffset);
          // 匹配以 /web 结尾
          const match = textBeforeCursor.match(/(?:^|\s)\/web$/i);
          if (match) {
            e.preventDefault();
            e.stopPropagation();

            // 删除输入文本中的 "/web" 字符
            const deleteStart = range.startOffset - 4;
            const newRange = document.createRange();
            newRange.setStart(node, deleteStart);
            newRange.setEnd(node, range.startOffset);
            sel.removeAllRanges();
            sel.addRange(newRange);
            document.execCommand("delete");

            // 弹出 URL 输入面板
            promptInsertWebUrl();
          }
        }
      }
    }

    // ==================== 6. 网页视窗增强交互绑定 ====================

    function enhanceAllWebBlocks() {
      const blocks = document.querySelectorAll(".edgeever-web-embed-block:not([data-web-enhanced='true'])");
      blocks.forEach((block) => {
        block.dataset.webEnhanced = "true";

        const iframe = block.querySelector(".edgeever-web-iframe");
        const reloadBtn = block.querySelector(".edgeever-web-btn-reload");
        const copyBtn = block.querySelector(".edgeever-web-btn-copy");
        const fullBtn = block.querySelector(".edgeever-web-btn-full");
        const resizeBar = block.querySelector(".edgeever-web-resize-bar");
        const container = block.querySelector(".edgeever-web-iframe-container");
        const url = block.dataset.webUrl || iframe?.src;

        // 1. 刷新
        if (reloadBtn && iframe) {
          reloadBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            iframe.src = iframe.src;
          };
        }

        // 2. 复制链接
        if (copyBtn && url) {
          copyBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(url).then(() => {
              copyBtn.textContent = "✓ 已复制";
              setTimeout(() => { copyBtn.textContent = "📋 复制"; }, 1500);
            });
          };
        }

        // 3. 铺满整页切换
        if (fullBtn) {
          fullBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isFull = block.classList.toggle("is-fullscreen-view");
            fullBtn.textContent = isFull ? "🗗 还原" : "⛶ 铺满笔记";
          };
        }

        // 4. 底部把手拖拽调整高度
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
      });
    }

    // ==================== 7. 全局事件与命令注册 ====================

    // 在主编辑器绑定输入监听
    document.addEventListener("keydown", handleEditorKeyDown, true);

    // 监听 DOM 树变动以便为新渲染的块增强事件
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(enhanceAllWebBlocks, 120);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.__edgeever_wc_observer = observer;

    // 初始增强
    setTimeout(enhanceAllWebBlocks, 300);

    // 注册全局命令（支持 Alt+W 或命令面板输入 /web）
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
    document.querySelectorAll(".edgeever-web-modal-backdrop").forEach((el) => el.remove());
  },
};
