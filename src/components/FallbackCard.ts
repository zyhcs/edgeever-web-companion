/**
 * FallbackCard - 深色高质感容灾与引导卡片组件
 * 彻底消除白屏，在加载受阻、Cloudflare 防护或网络失败时提供友好交互
 */

import { WebLoadState } from "../types";
import { extractHostname } from "../utils/url";

export interface FallbackCardOptions {
  url: string;
  state: WebLoadState;
  detail?: string;
  onRetry: () => void;
  onOpenExternal: () => void;
  onCopyUrl: () => void;
}

export class FallbackCard {
  private element: HTMLElement;

  constructor(options: FallbackCardOptions) {
    this.element = this.createCard(options);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  private createCard(opts: FallbackCardOptions): HTMLElement {
    const card = document.createElement("div");
    card.className = "edgeever-web-fallback-card";

    const hostname = extractHostname(opts.url, "目标站点");
    let icon = "⚠️";
    let title = "页面暂时无法加载";
    let description = "请检查网络连接或目标网站可用性。";
    let badge = "网络错误";
    let badgeColor = "#ef4444";

    switch (opts.state) {
      case WebLoadState.CLOUDFLARE_REQUIRED:
        icon = "🛡️";
        title = "需完整浏览器内核渲染";
        description = "当前站点启用了 Cloudflare 人机验证或高级安全防护，Web 版沙箱环境无法穿透。请在 EdgeEver 桌面版中直接浏览！";
        badge = "Cloudflare 防护";
        badgeColor = "#f59e0b";
        break;

      case WebLoadState.BLOCKED:
        icon = "🔒";
        title = "站点限制 iframe 嵌套浏览";
        description = `站点 [${hostname}] 配置了严格的安全防护策略（如 frame-ancestors / X-Frame-Options: DENY）。在 EdgeEver 桌面版中将自动启用原生 Chromium 内核流畅浏览。`;
        badge = "跨域安全策略限制";
        badgeColor = "#38bdf8";
        break;

      case WebLoadState.FAILED:
      default:
        icon = "🔌";
        title = "连接中断或加载失败";
        description = opts.detail ? `错误详情：${opts.detail}` : "目标服务器响应异常或当前网络环境受阻。";
        badge = "加载异常";
        badgeColor = "#f43f5e";
        break;
    }

    card.innerHTML = `
      <div class="edgeever-web-fallback-inner">
        <div class="edgeever-web-fallback-badge" style="border-color:${badgeColor};color:${badgeColor}">
          ${badge}
        </div>
        <div class="edgeever-web-fallback-icon">${icon}</div>
        <h3 class="edgeever-web-fallback-title">${title}</h3>
        <p class="edgeever-web-fallback-desc">${description}</p>
        
        <div class="edgeever-web-fallback-url-preview">
          <span class="url-label">目标地址:</span>
          <span class="url-text">${opts.url}</span>
        </div>

        <div class="edgeever-web-fallback-actions">
          <button type="button" class="fallback-btn fallback-btn-primary action-open">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            在外部浏览器中打开
          </button>
          <button type="button" class="fallback-btn fallback-btn-secondary action-retry">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            重新尝试
          </button>
          <button type="button" class="fallback-btn fallback-btn-ghost action-copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            复制链接
          </button>
        </div>
      </div>
    `;

    const btnOpen = card.querySelector(".action-open");
    const btnRetry = card.querySelector(".action-retry");
    const btnCopy = card.querySelector(".action-copy");

    btnOpen?.addEventListener("click", () => opts.onOpenExternal());
    btnRetry?.addEventListener("click", () => opts.onRetry());
    btnCopy?.addEventListener("click", () => opts.onCopyUrl());

    return card;
  }
}
