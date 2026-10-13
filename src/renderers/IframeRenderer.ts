/**
 * IframeRenderer - 增强版 Web 与宿主降级渲染器
 * 具备智能防嵌站点检测、网络穿透拉取与零白屏看门狗
 */

import { BaseBrowserRenderer } from "./BrowserRenderer";
import { RendererEvents, WebLoadState } from "../types";
import { isKnownFrameDeniedHost } from "../utils/url";

export type NetworkFetchFn = (url: string, init?: Record<string, unknown>) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
  headers?: { get(key: string): string | null };
}>;

export class IframeRenderer extends BaseBrowserRenderer {
  private iframe: HTMLIFrameElement | null = null;
  private isDestroyed = false;
  private abortController: AbortController | null = null;
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

    const iframe = document.createElement("iframe");
    this.iframe = iframe;

    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-presentation"
    );
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
    );
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.outline = "none";
    iframe.style.display = "block";
    iframe.style.background = "transparent";

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

    // 1. 拦截已知严格防嵌站点 (如 GitHub、Google 等)，立即停止转圈并呈现引导卡片
    if (isKnownFrameDeniedHost(url)) {
      this.iframe.style.display = "none";
      this.setState(
        WebLoadState.BLOCKED,
        "此网站开启了全局防嵌安全策略 (X-Frame-Options: DENY)，禁止在内嵌框架中直接运行。"
      );
      return;
    }

    // 2. 如果提供了官方网络穿透 networkFetch，尝试拉取并清洗 CSP
    if (this.networkFetch) {
      try {
        const resp = await this.networkFetch(url, {
          transport: "public",
          method: "GET",
          headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: this.abortController.signal,
        });

        if (resp && resp.ok) {
          const text = await resp.text();
          if (text && text.length > 50) {
            // 检测 Cloudflare 拦截特质
            const lowerText = text.toLowerCase();
            if (
              lowerText.includes("cf-chl") ||
              lowerText.includes("challenge-platform") ||
              lowerText.includes("cloudflare ray id") ||
              lowerText.includes("just a moment...")
            ) {
              this.iframe.style.display = "none";
              this.setState(
                WebLoadState.CLOUDFLARE_REQUIRED,
                "目标站点启用了 Cloudflare 人机验证防护，请在外部浏览器中直接浏览！"
              );
              return;
            }

            const safeHtml = this.sanitizeAndInjectBase(text, url);
            this.iframe.removeAttribute("src");
            this.iframe.srcdoc = safeHtml;
            this.iframe.style.display = "block";
            this.setState(WebLoadState.SUCCESS);
            return;
          }
        }
      } catch {
        // 穿透拉取失败，继续走原生 iframe 加载
      }
    }

    // 3. 原生 iframe 加载（带 1.5 秒看门狗定时器，确保绝不永远转圈）
    this.iframe.removeAttribute("srcdoc");
    this.iframe.style.display = "block";

    let hasLoaded = false;
    const watchdogTimer = window.setTimeout(() => {
      if (!hasLoaded && !this.isDestroyed) {
        hasLoaded = true;
        // 关键：超时后标记为加载完成，让工具栏转圈立即停下！
        this.setState(WebLoadState.SUCCESS);
      }
    }, 1500);

    this.iframe.onload = () => {
      if (!hasLoaded && !this.isDestroyed) {
        hasLoaded = true;
        window.clearTimeout(watchdogTimer);
        this.setState(WebLoadState.SUCCESS);
      }
    };

    this.iframe.onerror = () => {
      if (!hasLoaded && !this.isDestroyed) {
        hasLoaded = true;
        window.clearTimeout(watchdogTimer);
        this.setState(
          WebLoadState.BLOCKED,
          "无法加载此页面，可能受跨域安全策略限制。"
        );
      }
    };

    this.iframe.src = url;
  }

  private sanitizeAndInjectBase(html: string, originalUrl: string): string {
    let clean = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, "");
    clean = clean.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, "");

    const baseTag = `<base href="${originalUrl}" target="_blank">`;
    if (/<head[^>]*>/i.test(clean)) {
      return clean.replace(/<head[^>]*>/i, `$&${baseTag}`);
    } else if (/<html[^>]*>/i.test(clean)) {
      return clean.replace(/<html[^>]*>/i, `$&<head>${baseTag}</head>`);
    }
    return `<head>${baseTag}</head>${clean}`;
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
