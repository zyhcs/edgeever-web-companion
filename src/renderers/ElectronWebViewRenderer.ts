/**
 * ElectronWebViewRenderer - Electron 桌面端原生真实浏览器内核渲染器
 * 具备对宿主 webviewTag 能力的探测与自动自愈降级看门狗
 */

import { BaseBrowserRenderer } from "./BrowserRenderer";
import { ElectronWebViewElement, RendererEvents, WebLoadState } from "../types";
import { BrowserSession } from "../services/BrowserSession";
import { IframeRenderer, NetworkFetchFn } from "./IframeRenderer";

export class ElectronWebViewRenderer extends BaseBrowserRenderer {
  private webview: ElectronWebViewElement | null = null;
  private fallbackRenderer: IframeRenderer | null = null;
  private isDestroyed = false;
  private watchdogTimer: number | null = null;
  private networkFetch: NetworkFetchFn | null = null;

  constructor(
    initialUrl: string,
    initialTitle: string,
    events: RendererEvents,
    networkFetch?: NetworkFetchFn | null
  ) {
    super(initialUrl, initialTitle, events);
    this.networkFetch = networkFetch || null;
  }

  public mount(parent: HTMLElement): void {
    this.container = parent;
    this.isDestroyed = false;

    // 动态创建 Electron <webview> 元素
    const webview = document.createElement("webview") as ElectronWebViewElement;
    this.webview = webview;

    webview.setAttribute("partition", BrowserSession.getPartition());
    webview.setAttribute("allowpopups", "true");
    webview.setAttribute("src", this._currentUrl);

    webview.style.width = "100%";
    webview.style.height = "100%";
    webview.style.border = "none";
    webview.style.outline = "none";
    webview.style.display = "flex";
    webview.style.background = "#0f172a";

    let hasReceivedEvent = false;

    // 绑定事件
    const onStart = () => {
      if (this.isDestroyed) return;
      hasReceivedEvent = true;
      this.clearWatchdog();
      this.setState(WebLoadState.LOADING);
    };

    const onStop = () => {
      if (this.isDestroyed) return;
      hasReceivedEvent = true;
      this.clearWatchdog();
      this.syncUrlAndTitle();
      this.setState(WebLoadState.SUCCESS);
    };

    const onFail = (e: Event) => {
      if (this.isDestroyed) return;
      hasReceivedEvent = true;
      this.clearWatchdog();
      const customEvent = e as unknown as { errorCode?: number; errorDescription?: string };
      if (customEvent.errorCode === -3) return; // ERR_ABORTED 忽略
      this.setState(WebLoadState.FAILED, customEvent.errorDescription || "加载失败");
    };

    const onDomReady = () => {
      if (this.isDestroyed) return;
      hasReceivedEvent = true;
      this.clearWatchdog();
      this.syncUrlAndTitle();
      this.setState(WebLoadState.SUCCESS);
    };

    const onNewWindow = (e: Event) => {
      const custom = e as unknown as { url?: string; preventDefault?: () => void };
      if (custom.url) {
        custom.preventDefault?.();
        this.loadURL(custom.url);
      }
    };

    const onNav = (e: Event) => {
      if (this.isDestroyed) return;
      hasReceivedEvent = true;
      this.clearWatchdog();
      const custom = e as unknown as { url?: string };
      if (custom.url) {
        this.setUrl(custom.url);
      }
      this.syncUrlAndTitle();
    };

    webview.addEventListener("did-start-loading", onStart);
    webview.addEventListener("did-stop-loading", onStop);
    webview.addEventListener("did-fail-load", onFail as EventListener);
    webview.addEventListener("dom-ready", onDomReady);
    webview.addEventListener("new-window", onNewWindow as EventListener);
    webview.addEventListener("did-navigate", onNav as EventListener);
    webview.addEventListener("did-navigate-in-page", onNav as EventListener);

    parent.appendChild(webview);
    this.setState(WebLoadState.LOADING);

    // 关键看门狗：如果宿主没有开启 webviewTag: true，元素在挂载后不会触发任何 webview 事件
    // 1.2 秒内若无任何反应，说明宿主禁用了 webviewTag，立即自愈降级到 IframeRenderer！
    this.watchdogTimer = window.setTimeout(() => {
      if (!hasReceivedEvent && !this.isDestroyed && this.webview) {
        console.warn("[Web Companion] Electron webview 未触发事件，检测到宿主未启用 webviewTag，自动自愈降级为兼容渲染。");
        this.activateFallback(parent);
      }
    }, 1200);
  }

  private clearWatchdog(): void {
    if (this.watchdogTimer !== null) {
      window.clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private activateFallback(parent: HTMLElement): void {
    this.clearWatchdog();
    if (this.webview) {
      try {
        this.webview.remove();
      } catch {
        // 忽略
      }
      this.webview = null;
    }

    // 实例化降级渲染器
    this.fallbackRenderer = new IframeRenderer(
      this._currentUrl,
      this._currentTitle,
      this.events,
      this.networkFetch
    );
    this.fallbackRenderer.mount(parent);
  }

  private syncUrlAndTitle(): void {
    if (!this.webview || this.isDestroyed) return;
    try {
      if (typeof this.webview.getURL === "function") {
        const u = this.webview.getURL();
        if (u && !u.startsWith("about:blank")) this.setUrl(u);
      }
    } catch {
      // 容错
    }
    try {
      if (typeof this.webview.getTitle === "function") {
        const t = this.webview.getTitle();
        if (t) this.setTitle(t);
      }
    } catch {
      // 容错
    }
  }

  public loadURL(url: string): void {
    if (this.fallbackRenderer) {
      this.fallbackRenderer.loadURL(url);
      return;
    }
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
    if (this.fallbackRenderer) {
      this.fallbackRenderer.reload();
      return;
    }
    if (!this.webview || this.isDestroyed) return;
    this.setState(WebLoadState.LOADING);
    try {
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
    if (this.fallbackRenderer) {
      this.fallbackRenderer.goBack();
      return;
    }
    try {
      if (this.canGoBack()) this.webview?.goBack();
    } catch {
      // 容错
    }
  }

  public goForward(): void {
    if (this.fallbackRenderer) {
      this.fallbackRenderer.goForward();
      return;
    }
    try {
      if (this.canGoForward()) this.webview?.goForward();
    } catch {
      // 容错
    }
  }

  public canGoBack(): boolean {
    if (this.fallbackRenderer) return this.fallbackRenderer.canGoBack();
    if (!this.webview || this.isDestroyed) return false;
    try {
      return typeof this.webview.canGoBack === "function" ? this.webview.canGoBack() : false;
    } catch {
      return false;
    }
  }

  public canGoForward(): boolean {
    if (this.fallbackRenderer) return this.fallbackRenderer.canGoForward();
    if (!this.webview || this.isDestroyed) return false;
    try {
      return typeof this.webview.canGoForward === "function" ? this.webview.canGoForward() : false;
    } catch {
      return false;
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.clearWatchdog();
    if (this.fallbackRenderer) {
      this.fallbackRenderer.destroy();
      this.fallbackRenderer = null;
    }
    if (this.webview) {
      try {
        if (typeof this.webview.stop === "function") this.webview.stop();
        this.webview.remove();
      } catch {
        // 忽略
      }
      this.webview = null;
    }
    this.container = null;
  }
}
