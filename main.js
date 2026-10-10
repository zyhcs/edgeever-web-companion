/**
 * EdgeEver Web Companion Plugin (网页伴侣)
 * 极致纯净、Mac 视效、三模态双屏对照浏览与无侵入网页增强套件
 * v1.0.2 - 深度修复按钮重复与侧边栏误挂、移除阻断弹窗、优化关联后即时渲染与防嵌支持
 */

// ==================== 1. 基础工具与 SVG 图标库 ====================

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

function getFaviconUrl(url) {
  const domain = extractDomain(url);
  if (!domain || domain === url) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

const ICONS = {
  link: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
  note: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
  web: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  split: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>`,
  gear: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  refresh: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  external: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  clip: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`,
  copy: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  shield: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
};

// ==================== 2. 全面稳健的 URL 与元数据嗅探 ====================

function extractUrlAndMeta(content, noteId) {
  let url = "";
  let title = "";
  let defaultView = "split"; // 关联网页后默认推荐双屏对照
  let splitRatio = 50;

  // 1. 本地存储快速恢复 (基于当前 noteId，确保 100% 不受格式丢失影响)
  if (noteId) {
    try {
      const cached = localStorage.getItem("edgeever_wc_note_" + noteId);
      if (cached) {
        const obj = JSON.parse(cached);
        if (obj.url) {
          url = obj.url;
          title = obj.title || "";
          defaultView = obj.defaultView || "split";
          splitRatio = Number(obj.splitRatio) || 50;
        }
      }
    } catch (_) {}
  }

  // 2. 兜底全局临时关联恢复 (针对刚新建未分配 ID 的笔记)
  if (!url) {
    try {
      const tempCached = localStorage.getItem("edgeever_wc_temp_active");
      if (tempCached) {
        const obj = JSON.parse(tempCached);
        if (obj.url && Date.now() - (obj.time || 0) < 300000) { // 5分钟内有效
          url = obj.url;
          title = obj.title || "";
          defaultView = obj.defaultView || "split";
          splitRatio = Number(obj.splitRatio) || 50;
        }
      }
    } catch (_) {}
  }

  // 3. 全局宽容度嗅探正文内容（支持纯文本、Markdown、富文本 HTML 标签）
  const raw = String(content || "");
  if (raw) {
    // 嗅探 url: "https://..." 或 href="https://..." 或纯链接
    const mUrl = raw.match(/(?:url:\s*["']?|<a\s+[^>]*href=["'])(https?:\/\/[^\s"'<>]+)/i) ||
                 raw.match(/^https?:\/\/[^\s"'<>\)]+/im);
    if (mUrl && mUrl[1]) {
      url = mUrl[1].trim();
    } else if (mUrl && mUrl[0] && !url) {
      url = mUrl[0].trim();
    }

    // 嗅探 web_title
    const mTitle = raw.match(/web_title:\s*["']?([^"'\r\n<>]+)["']?/i);
    if (mTitle && mTitle[1]) {
      title = mTitle[1].trim();
    }

    // 嗅探 default_view
    const mView = raw.match(/default_view:\s*["']?(split|web|note)["']?/i);
    if (mView && mView[1]) {
      defaultView = mView[1].toLowerCase();
    }

    // 嗅探 split_ratio
    const mRatio = raw.match(/split_ratio:\s*["']?(\d+)["']?/i);
    if (mRatio && mRatio[1]) {
      splitRatio = Number(mRatio[1]);
    }
  }

  return { url, title, defaultView, splitRatio };
}

function updateMarkdownFrontmatter(content, meta) {
  const raw = String(content || "");
  const hasFm = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.test(raw);

  if (!meta.url) {
    // 解绑：移除开头的 frontmatter
    return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  }

  const fmBlock = [
    "---",
    `url: "${meta.url}"`,
    `web_title: "${meta.title || extractDomain(meta.url)}"`,
    `default_view: "${meta.defaultView || 'split'}"`,
    `split_ratio: ${meta.splitRatio || 50}`,
    "---",
    "",
  ].join("\n");

  if (hasFm) {
    return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, fmBlock);
  } else {
    // 如果原先没有 Frontmatter，清理前缀杂质
    const cleanBody = raw.replace(/^(?:url:\s*["']?[^\r\n]+["']?|web_title:\s*[^\r\n]+|default_view:\s*[^\r\n]+)\r?\n?/gim, "").trimStart();
    return fmBlock + cleanBody;
  }
}

// ==================== 3. 插件主体定义 ====================

export default {
  async activate(context) {
    let settings = {
      defaultViewMode: "split",
      defaultSplitRatio: "50",
      showTopSwitchBar: true,
      enableQuickExcerpt: true,
      rememberNotePreference: true,
    };

    async function loadSettings() {
      if (!context.settings?.get) return;
      try {
        const dvm = await context.settings.get("default_view_mode");
        if (dvm) settings.defaultViewMode = dvm;
        const dsr = await context.settings.get("default_split_ratio");
        if (dsr) settings.defaultSplitRatio = dsr;
        const stsb = await context.settings.get("show_top_switch_bar");
        if (typeof stsb === "boolean") settings.showTopSwitchBar = stsb;
        const eqe = await context.settings.get("enable_quick_excerpt");
        if (typeof eqe === "boolean") settings.enableQuickExcerpt = eqe;
        const rnp = await context.settings.get("remember_note_preference");
        if (typeof rnp === "boolean") settings.rememberNotePreference = rnp;
      } catch (_) {}
    }

    await loadSettings();

    // 运行时状态
    let currentNote = null;
    let currentNoteMeta = {
      url: "",
      title: "",
      defaultView: "split",
      splitRatio: 50,
    };
    let activeViewMode = "split"; // "split" | "web" | "note"
    let currentSplitRatio = 50;

    let isInternalMutating = false;
    let topbarEl = null;
    let bindTriggerEl = null;
    let resizerEl = null;
    let webPaneEl = null;
    let iframeEl = null;
    let modalEl = null;

    // ==================== 4. 严苛防侧边栏的主编辑区精准定位 ====================

    /**
     * 严谨查找并锁定右侧主编辑区，坚决排除左侧侧边栏、笔记列表、抽屉和弹窗
     */
    function findMainEditorElement() {
      // 1. 获取所有 ProseMirror
      const allProse = Array.from(document.querySelectorAll(".ProseMirror"));
      const validProse = allProse.filter((el) => {
        if (!el.isConnected) return false;
        // 绝不属于侧边栏、左侧列表、抽屉、导航
        const inSidebar = el.closest(".sidebar, .aside, .note-list, .memo-list, [class*='sidebar'], [class*='drawer'], [class*='list-container'], nav, aside, .ant-layout-sider");
        if (inSidebar) return false;
        // 绝不属于我们插件自己的容器
        if (el.closest(".edgeever-wc-web-pane, .edgeever-wc-modal")) return false;
        return true;
      });

      if (validProse.length > 0) {
        // 如果有多个，取 offsetWidth 最大的（主内容编辑区）
        return validProse.sort((a, b) => b.offsetWidth - a.offsetWidth)[0];
      }

      // 2. 兜底通用主编辑器选择器（同样严格过滤侧边栏）
      const fallbackSelectors = [
        ".tiptap[contenteditable='true']",
        ".editor-content",
        ".markdown-body",
        ".memo-content",
        "article",
      ];

      for (const sel of fallbackSelectors) {
        const list = Array.from(document.querySelectorAll(sel));
        const filtered = list.filter((el) => {
          if (!el.isConnected) return false;
          const inSidebar = el.closest(".sidebar, .aside, .note-list, .memo-list, [class*='sidebar'], [class*='drawer'], [class*='list-container'], nav, aside");
          return !inSidebar && !el.closest(".edgeever-wc-web-pane, .edgeever-wc-modal");
        });
        if (filtered.length > 0) {
          return filtered.sort((a, b) => b.offsetWidth - a.offsetWidth)[0];
        }
      }

      return null;
    }

    async function resolveCurrentNote() {
      try {
        if (context.editor?.getDocument) {
          const doc = await context.editor.getDocument();
          if (doc) {
            const noteId = doc.noteId || doc.id;
            let full = null;
            if (noteId && context.notes?.get) {
              try { full = await context.notes.get(noteId); } catch (_) {}
            }
            return {
              id: noteId,
              title: doc.title || full?.title || "未命名笔记",
              content: doc.contentMarkdown ?? full?.contentMarkdown ?? doc.content ?? full?.content ?? "",
            };
          }
        }

        if (context.editor?.getActiveNoteId && context.notes?.get) {
          const id = await context.editor.getActiveNoteId();
          if (id) {
            const n = await context.notes.get(id);
            if (n) return { id, title: n.title, content: n.contentMarkdown || n.content || "" };
          }
        }

        if (context.workspace?.getActiveNote) {
          const n = await context.workspace.getActiveNote();
          if (n) return { id: n.id, title: n.title, content: n.contentMarkdown || n.content || "" };
        }
      } catch (_) {}

      // 从 DOM 兜底获取
      const contentEl = findMainEditorElement();
      if (contentEl) {
        return {
          id: "dom_active_note",
          title: "当前笔记",
          content: contentEl.innerText || contentEl.textContent || "",
        };
      }

      return null;
    }

    // ==================== 5. 笔记元数据持久化 ====================

    async function persistNoteMetadata(updatedMeta) {
      const merged = { ...currentNoteMeta, ...updatedMeta };
      currentNoteMeta = merged;

      // 1. 存入当前 noteId 的 localStorage 缓存
      if (currentNote?.id) {
        try {
          localStorage.setItem("edgeever_wc_note_" + currentNote.id, JSON.stringify(merged));
        } catch (_) {}
      }

      // 2. 存入全局临时缓存（防止新建笔记未即时生成 id）
      try {
        localStorage.setItem(
          "edgeever_wc_temp_active",
          JSON.stringify({ ...merged, time: Date.now() })
        );
      } catch (_) {}

      // 3. 如果环境提供 storage API，一并存入
      if (context.storage?.set && currentNote?.id) {
        try {
          await context.storage.set("edgeever_wc_note_" + currentNote.id, merged);
        } catch (_) {}
      }

      // 4. 存入笔记 Frontmatter
      if (currentNote?.id && context.notes?.update) {
        try {
          const newFullMarkdown = updateMarkdownFrontmatter(currentNote.content, merged);
          currentNote.content = newFullMarkdown;
          await context.notes.update(currentNote.id, {
            contentMarkdown: newFullMarkdown,
            content: newFullMarkdown,
          });
        } catch (err) {
          console.warn("[Web Companion] 保存笔记元数据失败:", err);
        }
      }
    }

    // ==================== 6. 单例顶栏与触发按钮管理 ====================

    function cleanupAllTriggers() {
      // 彻底清理页面所有遗留的关联按钮，防止左侧或主区重复出现
      document.querySelectorAll(".edgeever-wc-bind-trigger").forEach((el) => el.remove());
      bindTriggerEl = null;
    }

    function cleanupAllTopbars() {
      document.querySelectorAll(".edgeever-wc-topbar").forEach((el) => el.remove());
      topbarEl = null;
    }

    function renderTopbar(contentEl) {
      if (!contentEl || !contentEl.parentElement) return;
      const parent = contentEl.parentElement;

      const hasUrl = Boolean(currentNoteMeta.url);

      if (!hasUrl) {
        cleanupAllTopbars();
        renderBindTrigger(parent, contentEl);
        return;
      }

      // 已有关联网址，彻底移除未关联按钮
      cleanupAllTriggers();

      if (!settings.showTopSwitchBar) {
        cleanupAllTopbars();
        return;
      }

      // 确保页面上仅有唯一的 topbar
      if (!topbarEl || !topbarEl.isConnected) {
        cleanupAllTopbars();
        topbarEl = document.createElement("div");
        topbarEl.className = "edgeever-wc-topbar";
      }

      const domain = extractDomain(currentNoteMeta.url);
      const favicon = getFaviconUrl(currentNoteMeta.url);
      const displayTitle = currentNoteMeta.title || domain || "关联网页";

      topbarEl.innerHTML = `
        <div class="edgeever-wc-topbar-left">
          ${
            favicon
              ? `<img class="edgeever-wc-favicon" src="${escapeHtml(favicon)}" alt="" onerror="this.style.display='none'">`
              : `<span class="edgeever-wc-favicon" style="display:inline-flex;align-items:center;justify-content:center;color:var(--wc-accent)">${ICONS.web}</span>`
          }
          <div class="edgeever-wc-web-info">
            <span class="edgeever-wc-web-title" title="${escapeHtml(displayTitle)}">${escapeHtml(displayTitle)}</span>
            <a class="edgeever-wc-web-url" href="${escapeHtml(currentNoteMeta.url)}" target="_blank" rel="noopener" title="在新标签页中打开">
              <span>${escapeHtml(domain)}</span>
              ${ICONS.external}
            </a>
          </div>
        </div>

        <div class="edgeever-wc-segmented-control" role="tablist">
          <button type="button" class="edgeever-wc-segment-btn ${activeViewMode === "note" ? "active" : ""}" data-view="note" title="笔记视图：专注纯净笔记正文">
            ${ICONS.note} 笔记
          </button>
          <button type="button" class="edgeever-wc-segment-btn ${activeViewMode === "split" ? "active" : ""}" data-view="split" title="双屏编辑：左侧记笔记，右侧看网页">
            ${ICONS.split} 双屏
          </button>
          <button type="button" class="edgeever-wc-segment-btn ${activeViewMode === "web" ? "active" : ""}" data-view="web" title="网页视图：全屏沉浸浏览网页">
            ${ICONS.web} 网页
          </button>
        </div>

        <div class="edgeever-wc-topbar-right">
          <div class="edgeever-wc-default-select-wrap" title="配置下次打开此笔记时的默认视图">
            <span>默认:</span>
            <select class="edgeever-wc-select edgeever-wc-default-select">
              <option value="split" ${currentNoteMeta.defaultView === "split" ? "selected" : ""}>双屏编辑</option>
              <option value="web" ${currentNoteMeta.defaultView === "web" ? "selected" : ""}>网页视图</option>
              <option value="note" ${currentNoteMeta.defaultView === "note" ? "selected" : ""}>笔记视图</option>
            </select>
          </div>
          <button type="button" class="edgeever-wc-icon-btn edgeever-wc-btn-manage" title="修改或解绑网址">
            ${ICONS.gear}
          </button>
        </div>
      `;

      // 绑定分段视图切换事件
      topbarEl.querySelectorAll(".edgeever-wc-segment-btn").forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const targetView = btn.dataset.view;
          switchViewMode(targetView);
        };
      });

      // 绑定默认视图选择
      const selectEl = topbarEl.querySelector(".edgeever-wc-default-select");
      if (selectEl) {
        selectEl.onchange = async () => {
          const newDef = selectEl.value;
          currentNoteMeta.defaultView = newDef;
          await persistNoteMetadata({ defaultView: newDef });
        };
      }

      // 绑定网址管理模态框
      const manageBtn = topbarEl.querySelector(".edgeever-wc-btn-manage");
      if (manageBtn) {
        manageBtn.onclick = (e) => {
          e.stopPropagation();
          openUrlModal();
        };
      }

      // 挂载在主内容元素之前
      if (topbarEl.nextSibling !== contentEl && topbarEl.parentElement !== parent) {
        parent.insertBefore(topbarEl, contentEl);
      }
    }

    function renderBindTrigger(parent, contentEl) {
      // 彻底清理全页面可能已存在的所有关联按钮，确保全局绝对唯一
      cleanupAllTriggers();

      bindTriggerEl = document.createElement("button");
      bindTriggerEl.type = "button";
      bindTriggerEl.className = "edgeever-wc-bind-trigger";
      bindTriggerEl.innerHTML = `${ICONS.link} 关联网页`;
      bindTriggerEl.title = "为此笔记绑定参考网址，开启三模态对照浏览";
      bindTriggerEl.onclick = (e) => {
        e.stopPropagation();
        openUrlModal();
      };

      parent.insertBefore(bindTriggerEl, contentEl);
    }

    // ==================== 7. 网页主视窗与双栏渲染引擎 ====================

    function renderMainViews(contentEl) {
      if (!contentEl || !contentEl.parentElement) return;
      const parent = contentEl.parentElement;

      const hasUrl = Boolean(currentNoteMeta.url);
      if (!hasUrl) {
        // 无关联 URL，恢复纯净原生编辑
        contentEl.style.display = "";
        contentEl.style.flex = "";
        contentEl.style.maxWidth = "";
        contentEl.style.width = "";
        if (webPaneEl) webPaneEl.style.display = "none";
        if (resizerEl) resizerEl.style.display = "none";
        return;
      }

      // 1. 确保右侧网页面板挂载在 contentEl 的同级后方
      if (!webPaneEl || !webPaneEl.isConnected) {
        webPaneEl = document.createElement("div");
        webPaneEl.className = "edgeever-wc-web-pane";

        // 创建分割拖拽条
        resizerEl = document.createElement("div");
        resizerEl.className = "edgeever-wc-resizer";
        resizerEl.title = "拖拽调节左右分屏比例 (双击重置为 50:50)";

        if (contentEl.nextSibling) {
          parent.insertBefore(resizerEl, contentEl.nextSibling);
          parent.insertBefore(webPaneEl, resizerEl.nextSibling);
        } else {
          parent.appendChild(resizerEl);
          parent.appendChild(webPaneEl);
        }

        initResizerEvents(contentEl, parent);
      }

      // 2. 渲染网页面板内部控件与 iframe
      buildWebPaneContent();

      // 3. 应用三种视图的布局排版
      applyViewModeLayout(contentEl, parent);
    }

    function buildWebPaneContent() {
      if (!webPaneEl) return;
      const url = currentNoteMeta.url;

      // 如果已有 iframe 且网址未变，复用已有内容，避免重载
      if (iframeEl && iframeEl.dataset.loadedUrl === url) {
        return;
      }

      const domain = extractDomain(url);

      webPaneEl.innerHTML = `
        <div class="edgeever-wc-web-toolbar">
          <div class="edgeever-wc-web-nav-group">
            <button type="button" class="edgeever-wc-icon-btn edgeever-wc-btn-refresh" title="刷新页面">
              ${ICONS.refresh}
            </button>
            <a class="edgeever-wc-btn-launch" href="${escapeHtml(url)}" target="_blank" rel="noopener" title="在系统浏览器新窗口中打开此网页">
              ${ICONS.external} <span>在浏览器打开</span>
            </a>
            <button type="button" class="edgeever-wc-icon-btn edgeever-wc-btn-copy" title="复制网址到剪贴板">
              ${ICONS.copy}
            </button>
          </div>

          <div class="edgeever-wc-url-bar" title="回车可重新加载网址">
            <span>🌐</span>
            <input type="text" class="edgeever-wc-nav-input" value="${escapeHtml(url)}" />
          </div>

          <div class="edgeever-wc-actions-group">
            ${
              settings.enableQuickExcerpt
                ? `<button type="button" class="edgeever-wc-clip-btn edgeever-wc-btn-clip" title="将此网页标题与链接一键摘录插入到左侧笔记">
                     ${ICONS.clip} 摘录到笔记
                   </button>`
                : ""
            }
          </div>
        </div>

        <div class="edgeever-wc-iframe-wrap">
          <iframe class="edgeever-wc-iframe" src="${escapeHtml(url)}" data-loaded-url="${escapeHtml(url)}" allow="fullscreen" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"></iframe>
          <div class="edgeever-wc-csp-hint">
            <span>${ICONS.shield} 若因站点安全保护限制 (CSP) 未显示页面，可点击上方「在浏览器打开」</span>
          </div>
        </div>
      `;

      iframeEl = webPaneEl.querySelector(".edgeever-wc-iframe");

      // 地址栏回车直达
      const navInput = webPaneEl.querySelector(".edgeever-wc-nav-input");
      if (navInput && iframeEl) {
        navInput.onkeydown = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            let newUrl = navInput.value.trim();
            if (newUrl && !/^https?:\/\//i.test(newUrl)) newUrl = "https://" + newUrl;
            if (newUrl) {
              iframeEl.src = newUrl;
              iframeEl.dataset.loadedUrl = newUrl;
              persistNoteMetadata({ url: newUrl });
            }
          }
        };
      }

      // 刷新按钮
      const refreshBtn = webPaneEl.querySelector(".edgeever-wc-btn-refresh");
      if (refreshBtn && iframeEl) {
        refreshBtn.onclick = () => {
          iframeEl.src = iframeEl.src;
        };
      }

      // 复制链接按钮
      const copyBtn = webPaneEl.querySelector(".edgeever-wc-btn-copy");
      if (copyBtn) {
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(url).then(() => {
            copyBtn.style.color = "var(--wc-accent)";
            setTimeout(() => { copyBtn.style.color = ""; }, 1200);
          });
        };
      }

      // 一键摘录按钮
      const clipBtn = webPaneEl.querySelector(".edgeever-wc-btn-clip");
      if (clipBtn) {
        clipBtn.onclick = async () => {
          await insertExcerptToNote(currentNoteMeta.title, currentNoteMeta.url);
        };
      }
    }

    function applyViewModeLayout(contentEl, parent) {
      if (!contentEl || !webPaneEl) return;

      if (activeViewMode === "note") {
        // 1) 笔记视图：纯净笔记
        parent.style.display = "";
        parent.style.flexDirection = "";
        contentEl.style.display = "";
        contentEl.style.flex = "";
        contentEl.style.maxWidth = "";
        contentEl.style.width = "";
        webPaneEl.style.display = "none";
        if (resizerEl) resizerEl.style.display = "none";
      } else if (activeViewMode === "web") {
        // 2) 网页视图：全屏显示网页，隐藏笔记正文
        parent.style.display = "flex";
        parent.style.flexDirection = "column";
        contentEl.style.display = "none";
        if (resizerEl) resizerEl.style.display = "none";

        webPaneEl.style.display = "flex";
        webPaneEl.style.flex = "1";
        webPaneEl.style.width = "100%";
        webPaneEl.style.height = "calc(100vh - 140px)";
        webPaneEl.style.minHeight = "480px";
        webPaneEl.style.borderLeft = "none";
      } else if (activeViewMode === "split") {
        // 3) 双屏对照模式：左侧笔记 + 右侧网页
        parent.style.display = "flex";
        parent.style.flexDirection = "row";
        parent.style.alignItems = "stretch";
        parent.style.boxSizing = "border-box";

        const ratio = currentSplitRatio || 50;

        contentEl.style.display = "";
        contentEl.style.flex = `0 0 ${ratio}%`;
        contentEl.style.maxWidth = `${ratio}%`;
        contentEl.style.width = `${ratio}%`;
        contentEl.style.boxSizing = "border-box";
        contentEl.style.overflowY = "auto";

        if (resizerEl) resizerEl.style.display = "block";

        webPaneEl.style.display = "flex";
        webPaneEl.style.flex = "1";
        webPaneEl.style.width = `calc(${100 - ratio}% - 8px)`;
        webPaneEl.style.height = "calc(100vh - 140px)";
        webPaneEl.style.minHeight = "480px";
        webPaneEl.style.borderLeft = "1px solid var(--wc-border)";
      }
    }

    function initResizerEvents(contentEl, parent) {
      if (!resizerEl) return;

      let isDragging = false;
      let startX = 0;
      let startNoteWidth = 0;
      let containerWidth = 0;

      resizerEl.ondblclick = (e) => {
        e.preventDefault();
        currentSplitRatio = 50;
        applyViewModeLayout(contentEl, parent);
        persistNoteMetadata({ splitRatio: 50 });
      };

      resizerEl.onmousedown = (e) => {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startNoteWidth = contentEl.getBoundingClientRect().width;
        containerWidth = parent.getBoundingClientRect().width;

        resizerEl.classList.add("is-dragging");

        // 防止拖拽中 iframe 截获 mousemove
        if (iframeEl) iframeEl.style.pointerEvents = "none";

        const onMouseMove = (moveEvt) => {
          if (!isDragging || containerWidth <= 0) return;
          const deltaX = moveEvt.clientX - startX;
          let newWidth = startNoteWidth + deltaX;
          let newPercent = (newWidth / containerWidth) * 100;
          newPercent = Math.max(20, Math.min(80, newPercent)); // 限制在 20% ~ 80%

          currentSplitRatio = Math.round(newPercent);
          applyViewModeLayout(contentEl, parent);
        };

        const onMouseUp = () => {
          if (!isDragging) return;
          isDragging = false;
          resizerEl.classList.remove("is-dragging");
          if (iframeEl) iframeEl.style.pointerEvents = "auto";

          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);

          persistNoteMetadata({ splitRatio: currentSplitRatio });
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      };
    }

    // 网页信息一键摘录到笔记
    async function insertExcerptToNote(title, url) {
      if (!currentNote?.id) return;
      const domain = extractDomain(url);
      const excerptMd = `\n> 🌐 **参考来源**：[${title || domain}](${url})\n> 📅 **记录时间**：${new Date().toLocaleString("zh-CN")}\n\n`;

      try {
        let inserted = false;
        const pm = findMainEditorElement();
        let editor = pm?.pmViewDesc?.view?.editor;
        if (editor?.commands) {
          editor.commands.insertContent(excerptMd);
          inserted = true;
        }

        if (!inserted) {
          const fullContent = (currentNote.content || "") + excerptMd;
          currentNote.content = fullContent;
          if (context.notes?.update) {
            await context.notes.update(currentNote.id, {
              contentMarkdown: fullContent,
              content: fullContent,
            });
          }
        }
      } catch (err) {
        console.warn("[Web Companion] 摘录失败:", err);
      }
    }

    // ==================== 8. 视图模式切换控制 ====================

    function switchViewMode(targetMode) {
      if (!["note", "web", "split"].includes(targetMode)) targetMode = "split";
      activeViewMode = targetMode;

      if (topbarEl) {
        topbarEl.querySelectorAll(".edgeever-wc-segment-btn").forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.view === targetMode);
        });
      }

      const contentEl = findMainEditorElement();
      if (contentEl) {
        renderMainViews(contentEl);
      }
    }

    // ==================== 9. 关联网页模态对话框 (Modal) ====================

    async function openUrlModal() {
      closeUrlModal();

      let initialUrl = currentNoteMeta.url || "";
      let initialTitle = currentNoteMeta.title || "";
      let initialDefaultView = currentNoteMeta.defaultView || settings.defaultViewMode || "split";

      // 自动感知剪贴板
      if (!initialUrl && navigator.clipboard?.readText) {
        try {
          const clipText = await navigator.clipboard.readText();
          if (clipText && (clipText.startsWith("http://") || clipText.startsWith("https://"))) {
            initialUrl = clipText.trim();
          }
        } catch (_) {}
      }

      modalEl = document.createElement("div");
      modalEl.className = "edgeever-wc-modal-backdrop";
      modalEl.innerHTML = `
        <div class="edgeever-wc-modal">
          <div class="edgeever-wc-modal-header">
            <div class="edgeever-wc-modal-title">
              ${ICONS.link} 关联网页
            </div>
            <button type="button" class="edgeever-wc-icon-btn edgeever-wc-modal-close" title="关闭">
              ${ICONS.close}
            </button>
          </div>

          <div class="edgeever-wc-form-group">
            <label class="edgeever-wc-form-label">网页 URL 地址 (必填)</label>
            <input type="url" class="edgeever-wc-form-input edgeever-wc-input-url" placeholder="https://example.com" value="${escapeHtml(initialUrl)}" />
          </div>

          <div class="edgeever-wc-form-group">
            <label class="edgeever-wc-form-label">网页标题 (可选，留空将自动提取域名)</label>
            <input type="text" class="edgeever-wc-form-input edgeever-wc-input-title" placeholder="如：硬核指南-网站导航" value="${escapeHtml(initialTitle)}" />
          </div>

          <div class="edgeever-wc-form-group">
            <label class="edgeever-wc-form-label">下次打开此笔记时的默认视图</label>
            <select class="edgeever-wc-form-input edgeever-wc-input-default-view">
              <option value="split" ${initialDefaultView === "split" ? "selected" : ""}>🌓 双屏编辑 (推荐：左侧记笔记 + 右侧看网页)</option>
              <option value="web" ${initialDefaultView === "web" ? "selected" : ""}>🌐 网页视图 (全屏沉浸浏览网页)</option>
              <option value="note" ${initialDefaultView === "note" ? "selected" : ""}>📝 笔记视图 (专注纯净笔记正文)</option>
            </select>
          </div>

          <div class="edgeever-wc-modal-footer">
            ${
              currentNoteMeta.url
                ? `<button type="button" class="edgeever-wc-btn edgeever-wc-btn-secondary edgeever-wc-btn-unbind" style="color:#f87171;border-color:rgba(239,68,68,0.3)">
                     解绑并恢复普通笔记
                   </button>`
                : `<span></span>`
            }
            <div style="display:flex;gap:8px;">
              <button type="button" class="edgeever-wc-btn edgeever-wc-btn-secondary edgeever-wc-modal-cancel">
                取消
              </button>
              <button type="button" class="edgeever-wc-btn edgeever-wc-btn-primary edgeever-wc-modal-confirm">
                保存关联
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modalEl);

      const urlInput = modalEl.querySelector(".edgeever-wc-input-url");
      const titleInput = modalEl.querySelector(".edgeever-wc-input-title");
      const viewSelect = modalEl.querySelector(".edgeever-wc-input-default-view");
      const closeBtn = modalEl.querySelector(".edgeever-wc-modal-close");
      const cancelBtn = modalEl.querySelector(".edgeever-wc-modal-cancel");
      const confirmBtn = modalEl.querySelector(".edgeever-wc-modal-confirm");
      const unbindBtn = modalEl.querySelector(".edgeever-wc-btn-unbind");

      setTimeout(() => urlInput?.focus(), 60);

      const doClose = () => closeUrlModal();
      closeBtn.onclick = doClose;
      cancelBtn.onclick = doClose;
      modalEl.onclick = (e) => {
        if (e.target === modalEl) doClose();
      };

      // 保存绑定（无阻断式弹窗，直接平滑生效）
      confirmBtn.onclick = async () => {
        let enteredUrl = (urlInput.value || "").trim();
        if (!enteredUrl) {
          urlInput.focus();
          return;
        }

        if (!/^https?:\/\//i.test(enteredUrl)) {
          enteredUrl = "https://" + enteredUrl;
        }

        const enteredTitle = (titleInput.value || "").trim() || extractDomain(enteredUrl);
        const selectedView = viewSelect.value || "split";

        currentNoteMeta.url = enteredUrl;
        currentNoteMeta.title = enteredTitle;
        currentNoteMeta.defaultView = selectedView;

        await persistNoteMetadata({
          url: enteredUrl,
          title: enteredTitle,
          defaultView: selectedView,
        });

        doClose();

        // 立即切换并强制渲染
        activeViewMode = selectedView;
        const contentEl = findMainEditorElement();
        if (contentEl) {
          renderTopbar(contentEl);
          renderMainViews(contentEl);
        }
      };

      // 解绑恢复
      if (unbindBtn) {
        unbindBtn.onclick = async () => {
          currentNoteMeta.url = "";
          currentNoteMeta.title = "";
          currentNoteMeta.defaultView = "note";

          await persistNoteMetadata({ url: "" });
          doClose();

          activeViewMode = "note";
          const contentEl = findMainEditorElement();
          if (contentEl) {
            renderTopbar(contentEl);
            renderMainViews(contentEl);
          }
        };
      }
    }

    function closeUrlModal() {
      if (modalEl) {
        modalEl.remove();
        modalEl = null;
      }
    }

    // ==================== 10. 全局状态刷新与调度 ====================

    async function refreshComponentState() {
      if (isInternalMutating) return;
      isInternalMutating = true;
      try {
        const note = await resolveCurrentNote();
        if (!note) return;

        const isNoteChanged = !currentNote || currentNote.id !== note.id;
        currentNote = note;

        // 全面嗅探 URL
        const parsed = extractUrlAndMeta(note.content, note.id);

        // 如果内存中刚主动关联了 url，且嗅探为空，保留内存状态防冲掉
        if (!parsed.url && currentNoteMeta.url) {
          parsed.url = currentNoteMeta.url;
          parsed.title = currentNoteMeta.title;
          parsed.defaultView = currentNoteMeta.defaultView;
        }

        currentNoteMeta = {
          url: parsed.url,
          title: parsed.title || (parsed.url ? extractDomain(parsed.url) : ""),
          defaultView: parsed.defaultView || settings.defaultViewMode || "split",
          splitRatio: parsed.splitRatio || Number(settings.defaultSplitRatio) || 50,
        };

        // 如果切换了笔记，按该笔记配置的默认视图初始化
        if (isNoteChanged) {
          activeViewMode = currentNoteMeta.url ? currentNoteMeta.defaultView : "note";
          currentSplitRatio = currentNoteMeta.splitRatio;
        }

        const contentEl = findMainEditorElement();
        if (contentEl) {
          renderTopbar(contentEl);
          renderMainViews(contentEl);
        }
      } finally {
        isInternalMutating = false;
      }
    }

    // 智能监听 DOM 变动（避免自身死循环）
    let debounceTimer = null;
    const observer = new MutationObserver((mutations) => {
      if (isInternalMutating) return;

      const hasExternalChanges = mutations.some((m) => {
        const target = m.target;
        if (!target || !target.closest) return true;
        if (
          target.closest(
            ".edgeever-wc-topbar, .edgeever-wc-web-pane, .edgeever-wc-resizer, .edgeever-wc-modal-backdrop, .edgeever-wc-bind-trigger"
          )
        ) {
          return false;
        }
        return true;
      });

      if (!hasExternalChanges) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(refreshComponentState, 260);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 初始挂载
    setTimeout(refreshComponentState, 400);

    // ==================== 11. 快捷命令注册 ====================

    if (context.commands?.register) {
      context.commands.register({
        id: "web-companion-bind-url",
        title: "Web Companion: 关联/管理当前笔记网页 URL",
        run: () => openUrlModal(),
        execute: () => openUrlModal(),
      });
      context.commands.register({
        id: "web-companion-switch-split",
        title: "Web Companion: 切换至双屏对照模式 (Split)",
        shortcut: "Alt-W",
        run: () => switchViewMode("split"),
        execute: () => switchViewMode("split"),
      });
      context.commands.register({
        id: "web-companion-switch-note",
        title: "Web Companion: 切换至笔记纯净模式 (Note)",
        run: () => switchViewMode("note"),
        execute: () => switchViewMode("note"),
      });
      context.commands.register({
        id: "web-companion-switch-web",
        title: "Web Companion: 切换至网页全屏模式 (Web)",
        run: () => switchViewMode("web"),
        execute: () => switchViewMode("web"),
      });
    }

    // 设置变更监听
    if (context.events?.on) {
      context.events.on("settings.changed", async () => {
        await loadSettings();
        await refreshComponentState();
      });
    }
  },

  deactivate() {
    document.querySelectorAll(".edgeever-wc-topbar, .edgeever-wc-bind-trigger, .edgeever-wc-modal-backdrop, .edgeever-wc-web-pane, .edgeever-wc-resizer").forEach((el) => el.remove());
    const content = document.querySelector(".ProseMirror, .tiptap, .editor-content");
    if (content) {
      content.style.display = "";
      content.style.flex = "";
      content.style.maxWidth = "";
      content.style.width = "";
      if (content.parentElement) {
        content.parentElement.style.display = "";
        content.parentElement.style.flexDirection = "";
      }
    }
  },
};
