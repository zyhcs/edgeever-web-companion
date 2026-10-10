/**
 * EdgeEver Web Companion Plugin (网页伴侣)
 * /web 网页内嵌与 iframe 沉浸式浏览套件
 * v1.1.1 - 彻底修复插入无响应：多重 Schema 智能插入引擎、全量 DOM 视窗水合器与一键全尺寸网页渲染
 */

// 清理历史残留
if (window.__edgeever_wc_observer) {
  try {
    window.__edgeever_wc_observer.disconnect();
  } catch (_) {}
  window.__edgeever_wc_observer = null;
}

// 移除旧版外挂 DOM
document.querySelectorAll(
  ".edgeever-wc-topbar, .edgeever-wc-bind-trigger, .edgeever-wc-web-pane, .edgeever-wc-resizer, .edgeever-wc-modal-backdrop"
).forEach((el) => {
  try { el.remove(); } catch (_) {}
});

// ==================== 1. 基础工具 ====================

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

    // 查找当前主编辑器 ProseMirror
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

    // 获取 Tiptap 编辑器实例
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
            <input type="url" class="edgeever-web-form-input edgeever-web-input-url" placeholder="如：https://yinghezhinan.com/" value="${escapeHtml(initialUrl)}" />
          </div>

          <div class="edgeever-web-modal-hint">
            💡 提示：按回车即可快速插入，网页将以全尺寸 iframe 完整嵌入当前笔记中。
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

    // ==================== 4. 多重容错插入引擎 ====================

    function executeInsertWeb(url) {
      const editor = getEditorInstance();
      const pm = getActiveEditorElement();

      // 1. 尝试通过 Tiptap 代码块插入 (Tiptap 100% 接受 codeBlock，绝不丢弃)
      let inserted = false;
      if (editor?.commands) {
        try {
          if (editor.commands.insertContent) {
            // 插入标准的 web 代码块与 HTML
            editor.commands.insertContent(`\n\`\`\`web\n${url}\n\`\`\`\n`);
            inserted = true;
          }
        } catch (_) {}
      }

      // 2. 兜底尝试通过 execCommand 插入代码块
      if (!inserted) {
        try {
          inserted = document.execCommand("insertText", false, `\n\`\`\`web\n${url}\n\`\`\`\n`);
        } catch (_) {}
      }

      // 3. 兜底直接就地在光标位置或末尾创建 DOM 卡片
      if (!inserted && pm) {
        const block = buildWebCardElement(url);
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.collapse(false);
          range.insertNode(block);
        } else {
          pm.appendChild(block);
        }
        inserted = true;
      }

      // 4. 插入后立即调度全局水合器进行渲染
      setTimeout(renderAllWebEmbeds, 60);
      setTimeout(renderAllWebEmbeds, 200);
      setTimeout(renderAllWebEmbeds, 500);
    }

    // ==================== 5. 网页视窗构建与全量 DOM 水合器 ====================

    function buildWebCardElement(url) {
      const domain = extractDomain(url);
      const card = document.createElement("div");
      card.className = "edgeever-web-embed-block";
      card.dataset.webUrl = url;
      card.setAttribute("contenteditable", "false");

      card.innerHTML = `
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
      `;

      bindCardEvents(card);
      return card;
    }

    function bindCardEvents(card) {
      const iframe = card.querySelector(".edgeever-web-iframe");
      const reloadBtn = card.querySelector(".edgeever-web-btn-reload");
      const copyBtn = card.querySelector(".edgeever-web-btn-copy");
      const fullBtn = card.querySelector(".edgeever-web-btn-full");
      const resizeBar = card.querySelector(".edgeever-web-resize-bar");
      const container = card.querySelector(".edgeever-web-iframe-container");
      const url = card.dataset.webUrl;

      if (reloadBtn && iframe) {
        reloadBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          iframe.src = iframe.src;
        };
      }

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
     * 全局核心水合扫描器：
     * 自动捕获：
     * 1) 带有 language-web 的代码块 (pre code)
     * 2) 任何包含 ```web 的文本块
     * 3) 裸的 iframe 标签
     * 瞬间将其增强为全尺寸网页卡片！
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

        // 如果是代码块中写着 URL
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

      // 2. 扫描现存的未包装原生 iframe
      const iframes = Array.from(document.querySelectorAll("iframe:not(.edgeever-web-iframe)"));
      iframes.forEach((ifr) => {
        if (ifr.closest(".edgeever-web-embed-block") || !ifr.src) return;
        const url = ifr.src;
        if (/^https?:\/\//i.test(url)) {
          const card = buildWebCardElement(url);
          ifr.parentElement?.insertBefore(card, ifr);
          ifr.remove();
        }
      });
    }

    // ==================== 6. 快捷输入 /web 监听 ====================

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

    // ==================== 7. 编辑区专属快捷插入浮动小药丸 ====================

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

    // ==================== 8. 全局事件与定时器 ====================

    document.addEventListener("keydown", handleEditorKeyDown, true);

    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderAllWebEmbeds();
        ensureQuickInsertPill();
      }, 100);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.__edgeever_wc_observer = observer;

    setTimeout(() => {
      renderAllWebEmbeds();
      ensureQuickInsertPill();
    }, 250);

    // 注册全局命令（Alt+W）
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
  },
};
