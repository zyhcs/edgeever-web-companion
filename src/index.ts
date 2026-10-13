/**
 * EdgeEver Web Companion - 插件主入口
 * 架构：Renderer Strategy Pattern (Electron WebView 优先)
 * 严格遵循 TypeScript strict 规范
 */

import {
  EdgeEverPluginContext,
  EmbedInput,
  WebEmbedAttrs,
  WebLoadState,
} from "./types";
import { EmbedStore } from "./services/EmbedStore";
import { WebRendererFactory } from "./services/WebRendererFactory";
import { WebViewport } from "./components/WebViewport";
import { WebToolbar } from "./components/WebToolbar";
import { ResizeHandle } from "./components/ResizeHandle";
import { FallbackCard } from "./components/FallbackCard";
import { InsertDialog } from "./components/InsertDialog";
import { extractHostname } from "./utils/url";

let pluginContext: EdgeEverPluginContext | null = null;
let injectedStyleEl: HTMLStyleElement | null = null;

/**
 * 注入插件基础样式
 */
function ensureInjectedStyle(): void {
  if (document.getElementById("edgeever-web-companion-injected-style")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "edgeever-web-companion-injected-style";
  style.textContent = `
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
      border-color: rgba(56, 189, 248, 0.3) !important;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55) !important;
    }
    .edgeever-web-embed-block.is-resizing {
      user-select: none !important;
    }
    .edgeever-web-embed-block.is-resizing iframe,
    .edgeever-web-embed-block.is-resizing webview {
      pointer-events: none !important;
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
    .edgeever-web-nav-group {
      display: flex !important;
      align-items: center !important;
      gap: 2px !important;
      flex-shrink: 0 !important;
    }
    .edgeever-web-btn-nav {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 24px !important;
      height: 24px !important;
      border-radius: 4px !important;
      border: none !important;
      background: transparent !important;
      color: #94a3b8 !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
    }
    .edgeever-web-btn-nav:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: #f8fafc !important;
    }
    .edgeever-web-btn-nav.is-loading {
      animation: edgeever-web-spin 1s linear infinite !important;
      color: #38bdf8 !important;
    }
    @keyframes edgeever-web-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
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
      gap: 4px !important;
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
    }
    .edgeever-web-btn-icon:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #f8fafc !important;
    }
    .edgeever-web-resize-handle {
      height: 12px !important;
      background: #11141a !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: row-resize !important;
      border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
      transition: background 0.15s ease !important;
    }
    .edgeever-web-resize-handle:hover {
      background: #1e2430 !important;
    }
    .edgeever-web-resize-bar {
      width: 36px !important;
      height: 3px !important;
      border-radius: 2px !important;
      background: rgba(255, 255, 255, 0.22) !important;
    }
    .edgeever-web-fallback-card {
      position: absolute !important;
      inset: 0 !important;
      background: radial-gradient(circle at 50% 30%, #171d29 0%, #0c0f14 100%) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 24px !important;
      box-sizing: border-box !important;
      z-index: 50 !important;
    }
    .edgeever-web-fallback-inner {
      max-width: 480px !important;
      width: 100% !important;
      background: rgba(22, 27, 34, 0.85) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      border-radius: 12px !important;
      padding: 24px !important;
      text-align: center !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6) !important;
      backdrop-filter: blur(20px) !important;
    }
    .edgeever-web-fallback-badge {
      display: inline-block !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      padding: 2px 8px !important;
      border-radius: 12px !important;
      border: 1px solid !important;
      margin-bottom: 12px !important;
      text-transform: uppercase !important;
    }
    .edgeever-web-fallback-icon {
      font-size: 32px !important;
      margin-bottom: 8px !important;
    }
    .edgeever-web-fallback-title {
      font-size: 16px !important;
      font-weight: 700 !important;
      color: #f8fafc !important;
      margin: 0 0 8px 0 !important;
    }
    .edgeever-web-fallback-desc {
      font-size: 13px !important;
      color: #94a3b8 !important;
      line-height: 1.5 !important;
      margin: 0 0 16px 0 !important;
    }
    .edgeever-web-fallback-url-preview {
      background: rgba(0, 0, 0, 0.35) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 6px !important;
      padding: 6px 10px !important;
      font-size: 11px !important;
      color: #cbd5e1 !important;
      word-break: break-all !important;
      margin-bottom: 18px !important;
      display: flex !important;
      gap: 6px !important;
      align-items: center !important;
      text-align: left !important;
    }
    .edgeever-web-fallback-url-preview .url-label {
      color: #64748b !important;
      flex-shrink: 0 !important;
    }
    .edgeever-web-fallback-actions {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
      justify-content: center !important;
    }
    .fallback-btn {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 7px 14px !important;
      border-radius: 6px !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      border: 1px solid transparent !important;
      transition: all 0.15s ease !important;
    }
    .fallback-btn-primary {
      background: #38bdf8 !important;
      color: #0f172a !important;
      font-weight: 600 !important;
    }
    .fallback-btn-primary:hover {
      background: #7dd3fc !important;
    }
    .fallback-btn-secondary {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #e2e8f0 !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
    }
    .fallback-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.14) !important;
    }
    .fallback-btn-ghost {
      background: transparent !important;
      color: #94a3b8 !important;
    }
    .fallback-btn-ghost:hover {
      color: #f8fafc !important;
    }
    .edgeever-web-modal-backdrop {
      position: fixed !important;
      inset: 0 !important;
      background: rgba(0, 0, 0, 0.65) !important;
      backdrop-filter: blur(6px) !important;
      z-index: 99999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .edgeever-web-modal {
      width: 440px !important;
      background: #161b22 !important;
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-radius: 10px !important;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7) !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      color: #f8fafc !important;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif !important;
    }
  `;
  document.head.appendChild(style);
  injectedStyleEl = style;
}

/**
 * 挂载 Mini 浏览器卡片
 */
function mountBrowserCard(container: HTMLElement, embedInput: EmbedInput): () => void {
  const currentAttrs: WebEmbedAttrs = EmbedStore.parseAttrs(embedInput);
  const embedId = (embedInput && typeof embedInput === "object" ? (embedInput as { id?: string }).id : "") || "";
  let oldUrl = currentAttrs.url;

  // 1. 初始化视窗容器与 Breakout 引擎
  const viewport = new WebViewport({
    initialHeight: currentAttrs.height,
    initialWidthMode: currentAttrs.widthMode,
    initialFullscreen: currentAttrs.fullscreen,
  });

  const card = viewport.getCardElement();
  const contentArea = viewport.getContentArea();
  let fallbackCardInstance: FallbackCard | null = null;

  // 2. 初始化真实浏览器内核渲染器 (Electron WebView 优先)
  const renderer = WebRendererFactory.createRenderer(
    currentAttrs.url,
    currentAttrs.title,
    {
      onStateChange: (state: WebLoadState, detail?: string) => {
        toolbar.setLoading(state === WebLoadState.LOADING);

        if (
          state === WebLoadState.FAILED ||
          state === WebLoadState.BLOCKED ||
          state === WebLoadState.CLOUDFLARE_REQUIRED
        ) {
          if (fallbackCardInstance) {
            fallbackCardInstance.getElement().remove();
          }
          fallbackCardInstance = new FallbackCard({
            url: renderer.getURL(),
            state: state,
            detail: detail,
            onRetry: () => {
              if (fallbackCardInstance) {
                fallbackCardInstance.getElement().remove();
                fallbackCardInstance = null;
              }
              renderer.reload();
            },
            onOpenExternal: () => {
              window.open(renderer.getURL(), "_blank");
            },
            onCopyUrl: () => {
              navigator.clipboard?.writeText(renderer.getURL());
            },
          });
          contentArea.appendChild(fallbackCardInstance.getElement());
        } else if (state === WebLoadState.SUCCESS) {
          if (fallbackCardInstance) {
            fallbackCardInstance.getElement().remove();
            fallbackCardInstance = null;
          }
        }
      },
      onUrlChange: (newUrl: string) => {
        toolbar.updateUrl(newUrl);
        currentAttrs.url = newUrl;
        currentAttrs.title = renderer.getTitle() || extractHostname(newUrl, "Web View");
        EmbedStore.updateEmbedAttributesInDoc(pluginContext, embedId, oldUrl, currentAttrs);
        oldUrl = newUrl;
      },
      onTitleChange: (newTitle: string) => {
        currentAttrs.title = newTitle;
        EmbedStore.updateEmbedAttributesInDoc(pluginContext, embedId, oldUrl, currentAttrs);
      },
    },
    currentAttrs.engine
  );

  // 3. 初始化 WebToolbar (Omnibox 与控制台)
  const toolbar = new WebToolbar({
    initialUrl: currentAttrs.url,
    initialWidthMode: currentAttrs.widthMode,
    initialFullscreen: currentAttrs.fullscreen,
    onNavigate: (url: string) => {
      renderer.loadURL(url);
    },
    onReload: () => {
      renderer.reload();
    },
    onGoBack: () => {
      renderer.goBack();
    },
    onGoForward: () => {
      renderer.goForward();
    },
    onToggleWidthMode: () => {
      const nextMode = currentAttrs.widthMode === "editor" ? "normal" : "editor";
      currentAttrs.widthMode = nextMode;
      viewport.setWidthMode(nextMode);
      toolbar.updateWidthMode(nextMode);
      EmbedStore.updateEmbedAttributesInDoc(pluginContext, embedId, oldUrl, currentAttrs);
    },
    onToggleFullscreen: () => {
      const nextFs = !currentAttrs.fullscreen;
      currentAttrs.fullscreen = nextFs;
      viewport.setFullscreen(nextFs);
      toolbar.updateFullscreen(nextFs);
      EmbedStore.updateEmbedAttributesInDoc(pluginContext, embedId, oldUrl, currentAttrs);
    },
    onOpenExternal: () => {
      window.open(renderer.getURL(), "_blank");
    },
    onCopyUrl: () => {
      navigator.clipboard?.writeText(renderer.getURL());
    },
  });

  // 4. 初始化底部高度拖拽控制器
  const resizeHandle = new ResizeHandle({
    initialHeight: currentAttrs.height,
    onHeightChange: (h: number) => {
      viewport.setHeight(h);
    },
    onResizeEnd: (h: number) => {
      currentAttrs.height = h;
      EmbedStore.updateEmbedAttributesInDoc(pluginContext, embedId, oldUrl, currentAttrs);
    },
    setMaskActive: (active: boolean) => {
      viewport.setMaskActive(active);
    },
  });

  // 组装卡片 DOM
  card.insertBefore(toolbar.getElement(), contentArea);
  card.appendChild(resizeHandle.getElement());
  container.innerHTML = "";
  container.appendChild(card);

  // 挂载浏览器内核
  renderer.mount(contentArea);

  // 触发一次 Breakout 布局适配
  window.setTimeout(() => {
    viewport.applyBreakoutLayout();
  }, 30);

  // 返回卸载清理回调
  return () => {
    renderer.destroy();
    viewport.destroy();
    container.innerHTML = "";
  };
}

/**
 * 插入网页执行器
 */
async function executeInsertWeb(targetUrl: string): Promise<void> {
  const domain = extractHostname(targetUrl, "Web View");
  const defaultAttrs: WebEmbedAttrs = {
    url: targetUrl,
    title: domain,
    height: 720,
    fullscreen: false,
    engine: "auto",
    widthMode: "editor",
  };

  // 方案 A：官方 context.editor.insertEmbed
  if (pluginContext?.editor?.insertEmbed) {
    try {
      await pluginContext.editor.insertEmbed({
        type: "web-view",
        resourceId: targetUrl,
        title: domain,
        data: defaultAttrs,
      });
      return;
    } catch (err) {
      console.warn("[Web Companion] insertEmbed failed, fallback to editor instance:", err);
    }
  }

  // 方案 B：使用 Tiptap editor 实例直接插入
  const editor = pluginContext?.editor?.getInstance ? pluginContext.editor.getInstance() : null;
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
          dataJson: JSON.stringify(defaultAttrs),
          attrs: defaultAttrs,
        },
      });
      return;
    } catch (err) {
      console.warn("[Web Companion] insertContent failed:", err);
    }
  }

  // 方案 C：Markdown 兼容语法插入
  const mdCode = `\n\`\`\`edgeever-plugin-embed\n${JSON.stringify({
    id: `embed_${Date.now()}`,
    pluginId: "org.edgeever.plugins.web-companion",
    type: "web-view",
    resourceId: targetUrl,
    title: domain,
    dataJson: JSON.stringify(defaultAttrs),
    attrs: defaultAttrs,
  })}\n\`\`\`\n`;

  if (pluginContext?.editor?.insertAtCursor) {
    try {
      await pluginContext.editor.insertAtCursor(mdCode);
      return;
    } catch {
      // 忽略
    }
  }

  try {
    document.execCommand("insertText", false, mdCode);
  } catch {
    // 忽略
  }
}

function openInsertDialog(): void {
  InsertDialog.show((url: string) => {
    executeInsertWeb(url);
  });
}

function handleEditorKeyDown(e: KeyboardEvent): void {
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
          const newRange = document.createRange();
          newRange.setStart(node, offset - 4);
          newRange.setEnd(node, offset);
          sel.removeAllRanges();
          sel.addRange(newRange);
          document.execCommand("delete");
        } catch {
          // 容错
        }

        openInsertDialog();
      }
    }
  }
}

function onGlobalKeydown(e: KeyboardEvent): void {
  if ((e.altKey || e.metaKey) && (e.key === "w" || e.key === "W") && !e.shiftKey && !e.ctrlKey) {
    const activeEl = document.activeElement;
    const isEditing = activeEl && ["INPUT", "TEXTAREA"].includes(activeEl.tagName);
    if (!isEditing || activeEl?.closest(".edgeever-web-modal")) {
      e.preventDefault();
      openInsertDialog();
    }
  }
}

export default {
  activate(context: EdgeEverPluginContext): void {
    pluginContext = context;
    ensureInjectedStyle();

    // 1. 注册 EdgeEver 官方原生嵌入渲染器 (注册 web-view 与兼容别名 web-companion)
    if (context.editor?.embeds?.register) {
      const rendererDef = {
        type: "web-view",
        title: "真实浏览器视窗 (Web Embed)",
        mount(container: HTMLElement, data: unknown) {
          return mountBrowserCard(container, data as EmbedInput);
        },
        render(container: HTMLElement, data: unknown) {
          return mountBrowserCard(container, data as EmbedInput);
        },
      };

      try {
        context.editor.embeds.register(rendererDef);
        console.log("[Web Companion] Registered 'web-view' electron renderer successfully.");
      } catch (err) {
        console.warn("[Web Companion] Register 'web-view' failed:", err);
      }

      try {
        context.editor.embeds.register({
          ...rendererDef,
          type: "web-companion",
        });
      } catch {
        // 忽略别名注册异常
      }
    }

    // 2. 监听编辑器中输入 /web
    document.addEventListener("keydown", handleEditorKeyDown, true);

    // 3. 监听全局快捷键 Alt+W / Cmd+W (非冲突模式)
    window.addEventListener("keydown", onGlobalKeydown, true);

    // 4. 注册命令菜单
    if (context.commands?.register) {
      context.commands.register({
        id: "web-insert-iframe",
        title: "Web Companion: /web 插入浏览器视窗 (Web Embed)",
        shortcut: "Alt-W",
        run: () => openInsertDialog(),
        execute: () => openInsertDialog(),
      });
    }

    if (context.ui?.commands?.register) {
      context.ui.commands.register({
        id: "web-companion.insert",
        name: "Web Companion: /web 插入浏览器视窗",
        shortcut: "Alt+W",
        execute: () => openInsertDialog(),
      });
    }

    console.log(
      "%c[EdgeEver Web Companion] v1.4.0 Loaded - Electron WebView Architecture Active",
      "background:#38bdf8;color:#000;font-weight:bold;padding:2px 6px;border-radius:3px;"
    );
  },

  deactivate(): void {
    document.removeEventListener("keydown", handleEditorKeyDown, true);
    window.removeEventListener("keydown", onGlobalKeydown, true);
    InsertDialog.close();
    if (injectedStyleEl) {
      injectedStyleEl.remove();
      injectedStyleEl = null;
    }
    console.log("[Web Companion] deactivated.");
  },
};
