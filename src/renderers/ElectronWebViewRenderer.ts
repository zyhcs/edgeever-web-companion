/**
 * ElectronWebViewRenderer - Electron 桌面端原生真实浏览器内核渲染器
 * 核心目标：接近真实 Chrome 标签页体验，突破 CSP/X-Frame-Options 限制，原生保持 Cookie 与登录态
 */

import { BaseBrowserRenderer } from "./BrowserRenderer";
import { ElectronWebViewElement, RendererEvents, WebLoadState } from "../types";
import { BrowserSession } from "../services/BrowserSession";

export class ElectronWebViewRenderer extends BaseBrowserRenderer {
  private webview: ElectronWebViewElement | null = null;
  private isDestroyed = false;

  constructor(initialUrl: string, initialTitle: string, events: RendererEvents) {
    super(initialUrl, initialTitle, events);
  }

  public mount(parent: HTMLElement): void {
    this.container = parent;
    this.isDestroyed = false;

    // 动态创建 Electron <webview> 元素
    const webview = document.createElement("webview") as ElectronWebViewElement;
    this.webview = webview;

    // 配置持久化 Session 分区与弹出窗口策略
    webview.setAttribute("partition", BrowserSession.getPartition());
    webview.setAttribute("allowpopups", "true");
    webview.setAttribute("src", this._currentUrl);

    // 基础样式：充满视口、自适应
    webview.style.width = "100%";
    webview.style.height = "100%";
    webview.style.border = "none";
    webview.style.outline = "none";
    webview.style.display = "flex";
    webview.style.background = "#0f172a";

    this.bindEvents(webview);
    parent.appendChild(webview);

    this.setState(WebLoadState.LOADING);
  }

  private bindEvents(webview: ElectronWebViewElement): void {
    // 1. 开始加载
    const onStartLoading = () => {
      if (this.isDestroyed) return;
      this.setState(WebLoadState.LOADING);
    };

    // 2. 停止加载
    const onStopLoading = () => {
      if (this.isDestroyed) return;
      this.syncUrlAndTitle();
      this.setState(WebLoadState.SUCCESS);
    };

    // 3. 加载失败处理
    const onFailLoad = (e: Event) => {
      if (this.isDestroyed) return;
      const customEvent = e as unknown as {
        errorCode?: number;
        errorDescription?: string;
        validatedURL?: string;
      };

      // -3 代表操作被取消 (net::ERR_ABORTED)，通常是页面重定向或用户点击了新链接，不作为致命错误
      if (customEvent.errorCode === -3) {
        return;
      }

      const desc = customEvent.errorDescription || `ErrorCode: ${customEvent.errorCode || "Unknown"}`;
      this.setState(WebLoadState.FAILED, desc);
    };

    // 4. DOM Ready
    const onDomReady = () => {
      if (this.isDestroyed) return;
      this.syncUrlAndTitle();
      this.setState(WebLoadState.SUCCESS);
    };

    // 5. 拦截新窗口弹出 (target="_blank" 或 window.open)，保持在当前 WebView 中平滑浏览
    const onNewWindow = (e: Event) => {
      const customEvent = e as unknown as {
        url?: string;
        preventDefault?: () => void;
      };
      if (customEvent.url) {
        if (typeof customEvent.preventDefault === "function") {
          customEvent.preventDefault();
        }
        this.loadURL(customEvent.url);
      }
    };

    // 6. 地址变化监听 (包括 SPA 页面内部跳转)
    const onNavigate = (e: Event) => {
      if (this.isDestroyed) return;
      const customEvent = e as unknown as { url?: string };
      if (customEvent.url) {
        this.setUrl(customEvent.url);
      }
      this.syncUrlAndTitle();
    };

    webview.addEventListener("did-start-loading", onStartLoading);
    webview.addEventListener("did-stop-loading", onStopLoading);
    webview.addEventListener("did-fail-load", onFailLoad as EventListener);
    webview.addEventListener("dom-ready", onDomReady);
    webview.addEventListener("new-window", onNewWindow as EventListener);
    webview.addEventListener("did-navigate", onNavigate as EventListener);
    webview.addEventListener("did-navigate-in-page", onNavigate as EventListener);
  }

  private syncUrlAndTitle(): void {
    if (!this.webview || this.isDestroyed) return;

    try {
      if (typeof this.webview.getURL === "function") {
        const currentUrl = this.webview.getURL();
        if (currentUrl && !currentUrl.startsWith("about:blank")) {
          this.setUrl(currentUrl);
        }
      }
    } catch {
      // 容错处理
    }

    try {
      if (typeof this.webview.getTitle === "function") {
        const title = this.webview.getTitle();
        if (title) {
          this.setTitle(title);
        }
      }
    } catch {
      // 容错处理
    }
  }

  public loadURL(url: string): void {
    if (!this.webview || this.isDestroyed) return;
    this.setUrl(url);
    this.setState(WebLoadState.LOADING);

    try {
      if (typeof this.webview.loadURL === "function") {
        this.webview.loadURL(url);
      } else {
        this.webview.src = url;
      }
    } catch {
      this.webview.src = url;
    }
  }

  public reload(): void {
    if (!this.webview || this.isDestroyed) return;
    try {
      this.setState(WebLoadState.LOADING);
      if (typeof this.webview.reload === "function") {
        this.webview.reload();
      } else {
        this.webview.src = this._currentUrl;
      }
    } catch {
      this.webview.src = this._currentUrl;
    }
  }

  public goBack(): void {
    if (!this.webview || this.isDestroyed) return;
    try {
      if (this.canGoBack()) {
        this.webview.goBack();
      }
    } catch {
      // 容错处理
    }
  }

  public goForward(): void {
    if (!this.webview || this.isDestroyed) return;
    try {
      if (this.canGoForward()) {
        this.webview.goForward();
      }
    } catch {
      // 容错处理
    }
  }

  public canGoBack(): boolean {
    if (!this.webview || this.isDestroyed) return false;
    try {
      return typeof this.webview.canGoBack === "function" ? this.webview.canGoBack() : false;
    } catch {
      return false;
    }
  }

  public canGoForward(): boolean {
    if (!this.webview || this.isDestroyed) return false;
    try {
      return typeof this.webview.canGoForward === "function" ? this.webview.canGoForward() : false;
    } catch {
      return false;
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.webview) {
      try {
        if (typeof this.webview.stop === "function") {
          this.webview.stop();
        }
        this.webview.remove();
      } catch {
        // 忽略卸载清理异常
      }
      this.webview = null;
    }
    this.container = null;
  }
}
