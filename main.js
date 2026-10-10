/**
 * EdgeEver Web Companion Plugin (网页伴侣)
 * 极致纯净、Mac 视效、三模态双屏对照浏览与无侵入网页增强套件
 * v1.0.0
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
  close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
};

// ==================== 2. Frontmatter 元数据解析与持久化引擎 ====================

function parseFrontmatter(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return { frontmatter: {}, body: "" };
  }

  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: markdown };
  }

  const yamlText = match[1];
  const body = match[2];
  const frontmatter = {};

  yamlText.split(/\r?\n/).forEach((line) => {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      frontmatter[key] = val;
    }
  });

  return { frontmatter, body };
}

function stringifyFrontmatter(frontmatter, body) {
  const keys = Object.keys(frontmatter).filter((k) => frontmatter[k] !== undefined && frontmatter[k] !== "");
  if (keys.length === 0) {
    return body || "";
  }

  const lines = ["---"];
  keys.forEach((key) => {
    let val = String(frontmatter[key]);
    if (val.includes(":") || val.includes("#") || val.includes("\n")) {
      val = `"${val.replace(/"/g, '\\"')}"`;
    }
    lines.push(`${key}: ${val}`);
  });
  lines.push("---");
  lines.push("");

  const cleanBody = (body || "").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  return lines.join("\n") + cleanBody;
}

// ==================== 3. 插件主体定义 ====================

export default {
  async activate(context) {
    let settings = {
      defaultViewMode: "note",
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
      defaultView: "note",
      splitRatio: 50,
    };
    let activeViewMode = "note"; // "note" | "web" | "split"
    let currentSplitRatio = 50;

    let isInternalMutating = false;
    let topbarEl = null;
    let splitWrapperEl = null;
    let webPaneEl = null;
    let resizerEl = null;
    let iframeEl = null;
    let frameGuardEl = null;
    let modalEl = null;

    // ==================== 4. 笔记内容与容器识别 ====================

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
      return null;
    }

    function findNoteEditorContainer() {
      const candidates = [
        ".edgeever-workspace-editor",
        ".workspace-leaf.mod-active .view-content",
        ".milkdown",
        ".ProseMirror",
        ".editor-content",
        "article",
      ];
      for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el && el.isConnected) {
          // 向上寻找到合适的主工作区容器
          let container = el;
          while (container.parentElement && container.parentElement !== document.body) {
            if (
              container.classList.contains("edgeever-workspace-editor") ||
              container.classList.contains("view-content") ||
              container.getAttribute("role") === "main"
            ) {
              return container;
            }
            container = container.parentElement;
          }
          return el.parentElement || el;
        }
      }
      return null;
    }

    function findNoteContentElement() {
      const selectors = [
        ".ProseMirror",
        ".milkdown",
        ".markdown-body",
        ".editor-content",
        ".memo-content",
        ".note-content",
        "article",
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.isConnected) return el;
      }
      return null;
    }

    // ==================== 5. 笔记持久化保存 ====================

    async function persistNoteMetadata(updatedMeta) {
      if (!currentNote?.id) return;
      try {
        const rawContent = currentNote.content || "";
        const { frontmatter, body } = parseFrontmatter(rawContent);

        if (updatedMeta.url !== undefined) frontmatter.url = updatedMeta.url;
        if (updatedMeta.title !== undefined) frontmatter.web_title = updatedMeta.title;
        if (updatedMeta.defaultView !== undefined) frontmatter.default_view = updatedMeta.defaultView;
        if (updatedMeta.splitRatio !== undefined) frontmatter.split_ratio = String(updatedMeta.splitRatio);

        // 如果解绑清空 URL
        if (!frontmatter.url) {
          delete frontmatter.url;
          delete frontmatter.web_title;
          delete frontmatter.default_view;
          delete frontmatter.split_ratio;
        }

        const newFullMarkdown = stringifyFrontmatter(frontmatter, body);
        currentNote.content = newFullMarkdown;

        if (context.notes?.update) {
          await context.notes.update(currentNote.id, {
            contentMarkdown: newFullMarkdown,
            content: newFullMarkdown,
          });
        }
      } catch (err) {
        console.warn("[Web Companion] 保存笔记元数据失败:", err);
      }
    }

    // ==================== 6. 三模态控制台 (Topbar) 渲染 ====================

    function renderTopbar() {
      const container = findNoteEditorContainer();
      if (!container) return;

      const hasUrl = Boolean(currentNoteMeta.url);

      if (!hasUrl) {
        // 如果未关联网址，移除现有 topbar，仅在编辑区右上角提供一个极简关联按钮
        if (topbarEl) {
          topbarEl.remove();
          topbarEl = null;
        }
        renderBindTrigger();
        return;
      }

      // 移除未关联触发按钮
      removeBindTrigger();

      if (!settings.showTopSwitchBar) {
        if (topbarEl) topbarEl.remove();
        return;
      }

      if (!topbarEl) {
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
            <a class="edgeever-wc-web-url" href="${escapeHtml(currentNoteMeta.url)}" target="_blank" rel="noopener" title="${escapeHtml(currentNoteMeta.url)}">
              <span>${escapeHtml(domain)}</span>
              ${ICONS.external}
            </a>
          </div>
        </div>

        <div class="edgeever-wc-segmented-control" role="tablist">
          <button type="button" class="edgeever-wc-segment-btn ${activeViewMode === "note" ? "active" : ""}" data-view="note" title="笔记视图：纯净专注笔记文本">
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
              <option value="note" ${currentNoteMeta.defaultView === "note" ? "selected" : ""}>笔记视图</option>
              <option value="split" ${currentNoteMeta.defaultView === "split" ? "selected" : ""}>双屏编辑</option>
              <option value="web" ${currentNoteMeta.defaultView === "web" ? "selected" : ""}>网页视图</option>
            </select>
          </div>
          <button type="button" class="edgeever-wc-icon-btn edgeever-wc-btn-manage" title="修改或解绑网址">
            ${ICONS.gear}
          </button>
        </div>
      `;

      // 绑定视图切换事件
      topbarEl.querySelectorAll(".edgeever-wc-segment-btn").forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const targetView = btn.dataset.view;
          switchViewMode(targetView);
        };
      });

      // 绑定默认视图选择事件
      const selectEl = topbarEl.querySelector(".edgeever-wc-default-select");
      if (selectEl) {
        selectEl.onchange = async () => {
          const newDef = selectEl.value;
          currentNoteMeta.defaultView = newDef;
          await persistNoteMetadata({ defaultView: newDef });
          if (context.ui?.showNotice) {
            context.ui.showNotice(`已设置下次打开此笔记时默认使用「${selectEl.options[selectEl.selectedIndex].text}」`, { type: "info" });
          }
        };
      }

      // 绑定设置/解绑按钮
      const manageBtn = topbarEl.querySelector(".edgeever-wc-btn-manage");
      if (manageBtn) {
        manageBtn.onclick = (e) => {
          e.stopPropagation();
          openUrlModal();
        };
      }

      // 挂载到容器顶部最前端
      if (container.firstChild !== topbarEl) {
        container.insertBefore(topbarEl, container.firstChild);
      }
    }

    function renderBindTrigger() {
      const contentEl = findNoteContentElement();
      if (!contentEl) return;

      let trigger = document.querySelector(".edgeever-wc-bind-trigger");
      if (!trigger) {
        trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "edgeever-wc-bind-trigger";
        trigger.innerHTML = `${ICONS.link} 关联网页`;
        trigger.title = "为此笔记绑定参考网址，开启三模态对照浏览";
        trigger.onclick = (e) => {
          e.stopPropagation();
          openUrlModal();
        };

        contentEl.parentElement.insertBefore(trigger, contentEl);
      }
    }

    function removeBindTrigger() {
      document.querySelectorAll(".edgeever-wc-bind-trigger").forEach((el) => el.remove());
    }

    // ==================== 7. 双屏分屏与网页视窗挂载 ====================

    function setupSplitLayout() {
      const container = findNoteEditorContainer();
      if (!container) return;

      const hasUrl = Boolean(currentNoteMeta.url);
      if (!hasUrl) {
        // 无关联 URL 时，彻底移除双栏分屏 DOM，保持纯净原生状态
        teardownSplitLayout();
        return;
      }

      const contentEl = findNoteContentElement();
      if (!contentEl) return;

      // 如果尚未建立 split 容器
      if (!splitWrapperEl || !splitWrapperEl.isConnected) {
        splitWrapperEl = document.createElement("div");
        splitWrapperEl.className = `edgeever-wc-split-wrapper edgeever-wc-view-${activeViewMode}`;

        // 创建左侧笔记包裹区
        const notePane = document.createElement("div");
        notePane.className = "edgeever-wc-note-pane";

        // 创建中间拖拽条
        resizerEl = document.createElement("div");
        resizerEl.className = "edgeever-wc-resizer";
        resizerEl.title = "左右拖拽调节分屏比例 (双击重置为 50:50)";

        // 创建右侧网页视窗
        webPaneEl = document.createElement("div");
        webPaneEl.className = "edgeever-wc-web-pane";

        // 挂载顺序
        splitWrapperEl.appendChild(notePane);
        splitWrapperEl.appendChild(resizerEl);
        splitWrapperEl.appendChild(webPaneEl);

        // 将原编辑正文移入 notePane
        contentEl.parentElement.insertBefore(splitWrapperEl, contentEl);
        notePane.appendChild(contentEl);

        // 绑定拖拽逻辑
        initResizerEvents();
      }

      // 更新类名
      splitWrapperEl.className = `edgeever-wc-split-wrapper edgeever-wc-view-${activeViewMode}`;

      // 设置分屏宽度
      applySplitRatio(currentSplitRatio);

      // 渲染右侧网页内容
      renderWebPane();
    }

    function teardownSplitLayout() {
      if (splitWrapperEl && splitWrapperEl.isConnected) {
        const notePane = splitWrapperEl.querySelector(".edgeever-wc-note-pane");
        const contentEl = findNoteContentElement();
        if (contentEl && splitWrapperEl.parentElement) {
          splitWrapperEl.parentElement.insertBefore(contentEl, splitWrapperEl);
        }
        splitWrapperEl.remove();
        splitWrapperEl = null;
        webPaneEl = null;
        resizerEl = null;
        iframeEl = null;
      }
    }

    function applySplitRatio(ratio) {
      if (!splitWrapperEl) return;
      const notePane = splitWrapperEl.querySelector(".edgeever-wc-note-pane");
      if (notePane) {
        if (activeViewMode === "split") {
          notePane.style.flex = `0 0 ${ratio}%`;
          notePane.style.maxWidth = `${ratio}%`;
        } else {
          notePane.style.flex = "";
          notePane.style.maxWidth = "";
        }
      }
    }

    function initResizerEvents() {
      if (!resizerEl) return;

      let isDragging = false;
      let startX = 0;
      let startNoteWidth = 0;
      let containerWidth = 0;

      resizerEl.ondblclick = (e) => {
        e.preventDefault();
        currentSplitRatio = 50;
        applySplitRatio(50);
        persistNoteMetadata({ splitRatio: 50 });
      };

      resizerEl.onmousedown = (e) => {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        const notePane = splitWrapperEl.querySelector(".edgeever-wc-note-pane");
        startNoteWidth = notePane ? notePane.getBoundingClientRect().width : 0;
        containerWidth = splitWrapperEl.getBoundingClientRect().width;

        resizerEl.classList.add("is-dragging");
        splitWrapperEl.classList.add("is-resizing");

        const onMouseMove = (moveEvt) => {
          if (!isDragging || containerWidth <= 0) return;
          const deltaX = moveEvt.clientX - startX;
          let newWidth = startNoteWidth + deltaX;
          let newPercent = (newWidth / containerWidth) * 100;
          newPercent = Math.max(20, Math.min(80, newPercent)); // 限制在 20% ~ 80%

          currentSplitRatio = Math.round(newPercent);
          applySplitRatio(currentSplitRatio);
        };

        const onMouseUp = () => {
          if (!isDragging) return;
          isDragging = false;
          resizerEl.classList.remove("is-dragging");
          splitWrapperEl.classList.remove("is-resizing");
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);

          // 持久化当前比例
          persistNoteMetadata({ splitRatio: currentSplitRatio });
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      };
    }

    function renderWebPane() {
      if (!webPaneEl) return;

      const url = currentNoteMeta.url;
      if (!url) {
        webPaneEl.innerHTML = "";
        return;
      }

      // 如果 iframe 已经存在且 url 未变，避免反复刷新页面
      if (iframeEl && iframeEl.dataset.loadedUrl === url) {
        return;
      }

      webPaneEl.innerHTML = `
        <div class="edgeever-wc-web-toolbar">
          <div class="edgeever-wc-web-nav-group">
            <button type="button" class="edgeever-wc-icon-btn edgeever-wc-btn-refresh" title="刷新页面">
              ${ICONS.refresh}
            </button>
            <a class="edgeever-wc-icon-btn" href="${escapeHtml(url)}" target="_blank" rel="noopener" title="在系统浏览器全屏打开">
              ${ICONS.external}
            </a>
          </div>

          <div class="edgeever-wc-url-bar" title="${escapeHtml(url)}">
            <span>🌐</span>
            <input type="text" value="${escapeHtml(url)}" readonly />
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
          <iframe class="edgeever-wc-iframe" src="${escapeHtml(url)}" sandbox="allow-same-origin allow-scripts allow-popups allow-forms" data-loaded-url="${escapeHtml(url)}"></iframe>
          <div class="edgeever-wc-frame-guard">
            <div class="edgeever-wc-guard-icon">${ICONS.shield}</div>
            <div class="edgeever-wc-guard-title">此网站限制了嵌入预览</div>
            <div class="edgeever-wc-guard-desc">
              部分站点（如知乎、GitHub、各大网盘）设置了跨域同源保护 (X-Frame-Options)。你可以直接在外部浏览器中快速打开。
            </div>
            <div class="edgeever-wc-guard-actions">
              <a class="edgeever-wc-btn edgeever-wc-btn-primary" href="${escapeHtml(url)}" target="_blank" rel="noopener">
                在浏览器中打开 ↗
              </a>
              <button type="button" class="edgeever-wc-btn edgeever-wc-btn-secondary edgeever-wc-btn-copy-url">
                复制链接
              </button>
            </div>
          </div>
        </div>
      `;

      iframeEl = webPaneEl.querySelector(".edgeever-wc-iframe");
      frameGuardEl = webPaneEl.querySelector(".edgeever-wc-frame-guard");

      // 刷新按钮
      const refreshBtn = webPaneEl.querySelector(".edgeever-wc-btn-refresh");
      if (refreshBtn && iframeEl) {
        refreshBtn.onclick = () => {
          iframeEl.src = url;
          if (context.ui?.showNotice) context.ui.showNotice("页面正在刷新...", { type: "info" });
        };
      }

      // 复制链接按钮
      const copyUrlBtn = webPaneEl.querySelector(".edgeever-wc-btn-copy-url");
      if (copyUrlBtn) {
        copyUrlBtn.onclick = () => {
          navigator.clipboard?.writeText(url).then(() => {
            if (context.ui?.showNotice) context.ui.showNotice("网址已复制到剪贴板！", { type: "success" });
          });
        };
      }

      // 一键摘录功能
      const clipBtn = webPaneEl.querySelector(".edgeever-wc-btn-clip");
      if (clipBtn) {
        clipBtn.onclick = async () => {
          await insertExcerptToNote(currentNoteMeta.title, url);
        };
      }

      // 探测 iframe 加载状态
      if (iframeEl) {
        let loadTimeout = setTimeout(() => {
          // 兜底超时提示（可自由切换）
        }, 10000);

        iframeEl.onload = () => {
          clearTimeout(loadTimeout);
        };

        iframeEl.onerror = () => {
          if (frameGuardEl) frameGuardEl.classList.add("show");
        };
      }
    }

    // 将网页信息优雅摘录至笔记
    async function insertExcerptToNote(title, url) {
      if (!currentNote?.id) return;
      const domain = extractDomain(url);
      const excerptMd = `\n> 🌐 **参考网页**：[${title || domain}](${url})\n> 📅 **摘录时间**：${new Date().toLocaleString("zh-CN")}\n\n`;

      try {
        let inserted = false;
        // 尝试通过 ProseMirror / TipTap 编辑器事务无缝插入
        const pm = document.querySelector(".ProseMirror");
        let editor = pm?.pmViewDesc?.view?.editor;
        if (editor?.commands) {
          editor.commands.insertContent(excerptMd);
          inserted = true;
        }

        if (!inserted) {
          // 兜底追加到笔记末尾
          const fullContent = (currentNote.content || "") + excerptMd;
          currentNote.content = fullContent;
          if (context.notes?.update) {
            await context.notes.update(currentNote.id, {
              contentMarkdown: fullContent,
              content: fullContent,
            });
          }
        }

        if (context.ui?.showNotice) {
          context.ui.showNotice("已将网页参考链接一键摘录到笔记！", { type: "success" });
        }
      } catch (err) {
        console.warn("[Web Companion] 摘录失败:", err);
      }
    }

    // ==================== 8. 视图模式切换状态机 ====================

    function switchViewMode(targetMode) {
      if (!["note", "web", "split"].includes(targetMode)) targetMode = "note";
      activeViewMode = targetMode;

      if (topbarEl) {
        topbarEl.querySelectorAll(".edgeever-wc-segment-btn").forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.view === targetMode);
        });
      }

      if (splitWrapperEl) {
        splitWrapperEl.className = `edgeever-wc-split-wrapper edgeever-wc-view-${activeViewMode}`;
        applySplitRatio(currentSplitRatio);
      }
    }

    // ==================== 9. 关联网址对话框 (Modal) ====================

    async function openUrlModal() {
      closeUrlModal();

      let initialUrl = currentNoteMeta.url || "";
      let initialTitle = currentNoteMeta.title || "";
      let initialDefaultView = currentNoteMeta.defaultView || settings.defaultViewMode || "note";

      // 如果当前为空，尝试自动探测剪贴板
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
            <label class="edgeever-wc-form-label">网页标题 (可选，留空将自动使用域名)</label>
            <input type="text" class="edgeever-wc-form-input edgeever-wc-input-title" placeholder="如：React 官方中文文档" value="${escapeHtml(initialTitle)}" />
          </div>

          <div class="edgeever-wc-form-group">
            <label class="edgeever-wc-form-label">下次打开此笔记时的默认视图</label>
            <select class="edgeever-wc-form-input edgeever-wc-input-default-view">
              <option value="note" ${initialDefaultView === "note" ? "selected" : ""}>📝 笔记视图 (纯净笔记文本)</option>
              <option value="split" ${initialDefaultView === "split" ? "selected" : ""}>🌓 双屏编辑 (左侧笔记 + 右侧网页)</option>
              <option value="web" ${initialDefaultView === "web" ? "selected" : ""}>🌐 网页视图 (全屏沉浸浏览)</option>
            </select>
          </div>

          <div class="edgeever-wc-modal-footer">
            ${
              currentNoteMeta.url
                ? `<button type="button" class="edgeever-wc-btn edgeever-wc-btn-secondary edgeever-wc-btn-unbind" style="color:#ef4444;border-color:rgba(239,68,68,0.3)">
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

      // 提交保存
      confirmBtn.onclick = async () => {
        let enteredUrl = (urlInput.value || "").trim();
        if (!enteredUrl) {
          if (context.ui?.showNotice) context.ui.showNotice("请输入有效的网址！", { type: "warning" });
          urlInput.focus();
          return;
        }

        if (!/^https?:\/\//i.test(enteredUrl)) {
          enteredUrl = "https://" + enteredUrl;
        }

        const enteredTitle = (titleInput.value || "").trim() || extractDomain(enteredUrl);
        const selectedView = viewSelect.value || "note";

        currentNoteMeta.url = enteredUrl;
        currentNoteMeta.title = enteredTitle;
        currentNoteMeta.defaultView = selectedView;

        await persistNoteMetadata({
          url: enteredUrl,
          title: enteredTitle,
          defaultView: selectedView,
        });

        doClose();
        switchViewMode(selectedView);
        refreshComponentState();

        if (context.ui?.showNotice) {
          context.ui.showNotice(`已成功关联网页「${enteredTitle}」！`, { type: "success" });
        }
      };

      // 解绑
      if (unbindBtn) {
        unbindBtn.onclick = async () => {
          currentNoteMeta.url = "";
          currentNoteMeta.title = "";
          currentNoteMeta.defaultView = "note";

          await persistNoteMetadata({ url: "" });
          doClose();
          switchViewMode("note");
          teardownSplitLayout();
          renderTopbar();

          if (context.ui?.showNotice) {
            context.ui.showNotice("已解绑网页，该笔记已恢复为纯普通笔记。", { type: "info" });
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

        // 解析 Frontmatter
        const { frontmatter } = parseFrontmatter(note.content);
        const prevUrl = currentNoteMeta.url;

        currentNoteMeta = {
          url: frontmatter.url || "",
          title: frontmatter.web_title || (frontmatter.url ? extractDomain(frontmatter.url) : ""),
          defaultView: frontmatter.default_view || settings.defaultViewMode || "note",
          splitRatio: Number(frontmatter.split_ratio) || Number(settings.defaultSplitRatio) || 50,
        };

        // 如果切换了笔记，按该笔记配置的默认视图初始化
        if (isNoteChanged) {
          activeViewMode = currentNoteMeta.url ? currentNoteMeta.defaultView : "note";
          currentSplitRatio = currentNoteMeta.splitRatio;
        }

        renderTopbar();
        setupSplitLayout();
      } finally {
        isInternalMutating = false;
      }
    }

    // 智能监听 DOM 变化（排除插件自身变动，杜绝闪烁）
    let debounceTimer = null;
    const observer = new MutationObserver((mutations) => {
      if (isInternalMutating) return;

      const hasExternalChanges = mutations.some((m) => {
        const target = m.target;
        if (!target || !target.closest) return true;
        if (
          target.closest(
            ".edgeever-wc-topbar, .edgeever-wc-split-wrapper, .edgeever-wc-modal-backdrop, .edgeever-wc-bind-trigger"
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
    document.querySelectorAll(".edgeever-wc-topbar, .edgeever-wc-bind-trigger, .edgeever-wc-modal-backdrop").forEach((el) => el.remove());
    const splitWrapper = document.querySelector(".edgeever-wc-split-wrapper");
    if (splitWrapper) {
      const content = splitWrapper.querySelector(".ProseMirror, .milkdown, article, .editor-content");
      if (content && splitWrapper.parentElement) {
        splitWrapper.parentElement.insertBefore(content, splitWrapper);
      }
      splitWrapper.remove();
    }
  },
};
