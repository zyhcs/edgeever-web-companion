/**
 * IframeRenderer - Web 环境及无原生 WebView 环境下的降级渲染器
 * 具备智能 Cloudflare 阻断检测与 Frame-Denied 探测
 */

import { BaseBrowserRenderer } from "./BrowserRenderer";
import { RendererEvents, WebLoadState } from "../types";

export class IframeRenderer extends BaseBrowserRenderer {
  private iframe: HTMLIFrameElement | null = null;
  private isDestroyed = false;
  private abortController: AbortController | null = null;

  constructor(initialUrl: string, initialTitle: string, events: RendererEvents) {
    super(initialUrl, initialTitle, events);
  }

  public mount(parent: HTMLElement): void {
    this.container = parent;
    this.isDestroyed = false;

    const iframe = document.createElement("iframe");
    this.iframe = iframe;

    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-presentation"
    );
    iframe.setAttribute("loading", "lazy");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.outline = "none";
    iframe.style.display = "block";
    iframe.style.background = "#0f172a";

    parent.appendChild(iframe);
    this.loadWithFallback(this._currentUrl);
  }

  public loadURL(url: string): void {
    this.setUrl(url);
    this.loadWithFallback(url);
  }

  public reload(): void {
    this.loadWithFallback(this._currentUrl);
  }

  public goBack(): void {
    try {
      this.iframe?.contentWindow?.history.back();
    } catch {
      // 跨域受阻
    }
  }

  public goForward(): void {
    try {
      this.iframe?.contentWindow?.history.forward();
    } catch {
      // 跨域受阻
    }
  }

  public canGoBack(): boolean {
    return false;
  }

  public canGoForward(): boolean {
    return false;
  }

  private async loadWithFallback(url: string): Promise<void> {
    if (this.isDestroyed || !this.iframe) return;

    this.abortController?.abort();
    this.abortController = new AbortController();

    this.setState(WebLoadState.LOADING);

    // 1. 如果是非标准 HTTP 协议，直接指定 src
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      this.iframe.src = url;
      this.setState(WebLoadState.SUCCESS);
      return;
    }

    // 2. 尝试探测目标站点是否开启了防嵌入或启用了 Cloudflare 防护
    try {
      const resp = await fetch(url, {
        method: "GET",
        mode: "cors",
        signal: this.abortController.signal,
      });

      const text = await resp.text();

      // 检测 Cloudflare 拦截特质
      const lowerText = text.toLowerCase();
      if (
        lowerText.includes("cf-chl") ||
        lowerText.includes("challenge-platform") ||
        lowerText.includes("cloudflare ray id") ||
        lowerText.includes("just a moment...")
      ) {
        this.setState(
          WebLoadState.CLOUDFLARE_REQUIRED,
          "检测到目标站点启用了 Cloudflare 人机验证防护，请在 EdgeEver 桌面版中直接浏览！"
        );
        return;
      }

      // 如果成功获取 HTML，且没有严格同源阻断，则注入 base 标签并安全呈现
      const safeHtml = this.sanitizeAndInjectBase(text, url);
      this.iframe.srcdoc = safeHtml;
      this.setState(WebLoadState.SUCCESS);
    } catch {
      // CORS 或 X-Frame-Options 阻断，降级尝试直接加载 iframe
      this.attemptDirectIframeLoad(url);
    }
  }

  private attemptDirectIframeLoad(url: string): void {
    if (!this.iframe || this.isDestroyed) return;

    let loaded = false;
    const timeoutTimer = window.setTimeout(() => {
      if (!loaded && !this.isDestroyed) {
        // 如果长时间无响应或无法连通，标记状态为 BLOCKED
        this.setState(
          WebLoadState.BLOCKED,
          "无法在 Web iframe 中直接嵌套该站点。请使用 EdgeEver 桌面版以获得完整原生浏览器支持。"
        );
      }
    }, 4500);

    const onLoad = () => {
      loaded = true;
      window.clearTimeout(timeoutTimer);
      if (!this.isDestroyed) {
        this.setState(WebLoadState.SUCCESS);
      }
    };

    const onError = () => {
      loaded = true;
      window.clearTimeout(timeoutTimer);
      if (!this.isDestroyed) {
        this.setState(
          WebLoadState.BLOCKED,
          "站点安全策略禁止 iframe 嵌入，请在外部浏览器或桌面版中打开。"
        );
      }
    };

    this.iframe.onload = onLoad;
    this.iframe.onerror = onError;
    this.iframe.src = url;
  }

  /**
   * 注入 <base href="..."> 使得相对资源链接正确加载
   * 仅消除 X-Frame-Options / frame-ancestors 影响，保留其余正常逻辑
   */
  private sanitizeAndInjectBase(html: string, originalUrl: string): string {
    const baseTag = `<base href="${originalUrl}" />`;
    // 注入 base 标签
    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head[^>]*>/i, `$&${baseTag}`);
    }
    return `${baseTag}${html}`;
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.abortController?.abort();
    this.abortController = null;
    if (this.iframe) {
      this.iframe.src = "about:blank";
      this.iframe.remove();
      this.iframe = null;
    }
    this.container = null;
  }
}
