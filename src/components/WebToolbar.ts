/**
 * WebToolbar - Mini 浏览器顶栏与全功能 Omnibox 地址栏
 */

import { WidthMode } from "../types";
import { sanitizeUrl } from "../utils/url";

export interface WebToolbarOptions {
  initialUrl: string;
  initialWidthMode: WidthMode;
  initialFullscreen: boolean;
  onNavigate: (url: string) => void;
  onReload: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggleWidthMode: () => void;
  onToggleFullscreen: () => void;
  onOpenExternal: () => void;
  onCopyUrl: () => void;
}

export class WebToolbar {
  private element: HTMLElement;
  private inputEl: HTMLInputElement;
  private reloadBtn: HTMLButtonElement;
  private backBtn: HTMLButtonElement;
  private forwardBtn: HTMLButtonElement;
  private widthModeBtn: HTMLButtonElement;
  private fullscreenBtn: HTMLButtonElement;
  private currentUrl: string;

  constructor(options: WebToolbarOptions) {
    this.currentUrl = options.initialUrl;

    const bar = document.createElement("div");
    bar.className = "edgeever-web-embed-bar";
    bar.innerHTML = `
      <div class="edgeever-web-mac-controls">
        <span class="edgeever-web-dot red"></span>
        <span class="edgeever-web-dot yellow"></span>
        <span class="edgeever-web-dot green"></span>
      </div>

      <div class="edgeever-web-nav-group">
        <button type="button" class="edgeever-web-btn-nav btn-back" title="后退">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button type="button" class="edgeever-web-btn-nav btn-forward" title="前进">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        <button type="button" class="edgeever-web-btn-nav btn-reload" title="刷新页面">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        </button>
      </div>

      <div class="edgeever-web-omnibox-wrap">
        <span class="edgeever-web-lock-icon">🔒</span>
        <input type="text" class="edgeever-web-omnibox-input" spellcheck="false" placeholder="输入网址按回车直接跳转..." />
      </div>

      <div class="edgeever-web-embed-actions">
        <button type="button" class="edgeever-web-btn-icon btn-copy" title="复制当前网址">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>复制</span>
        </button>
        <button type="button" class="edgeever-web-btn-icon btn-width" title="切换宽度自适应模式">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
          <span class="width-label">${options.initialWidthMode === "normal" ? "全宽" : "标准"}</span>
        </button>
        <button type="button" class="edgeever-web-btn-icon btn-fullscreen" title="进入全屏沉浸浏览">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
          <span>全屏</span>
        </button>
        <button type="button" class="edgeever-web-btn-icon btn-external" title="在外部默认浏览器中打开">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          <span>打开</span>
        </button>
      </div>
    `;

    this.element = bar;
    this.inputEl = bar.querySelector(".edgeever-web-omnibox-input") as HTMLInputElement;
    this.backBtn = bar.querySelector(".btn-back") as HTMLButtonElement;
    this.forwardBtn = bar.querySelector(".btn-forward") as HTMLButtonElement;
    this.reloadBtn = bar.querySelector(".btn-reload") as HTMLButtonElement;
    this.widthModeBtn = bar.querySelector(".btn-width") as HTMLButtonElement;
    this.fullscreenBtn = bar.querySelector(".btn-fullscreen") as HTMLButtonElement;

    const copyBtn = bar.querySelector(".btn-copy") as HTMLButtonElement;
    const externalBtn = bar.querySelector(".btn-external") as HTMLButtonElement;

    this.inputEl.value = this.currentUrl;

    // Omnibox 输入处理
    this.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const raw = this.inputEl.value.trim();
        if (raw) {
          const finalUrl = sanitizeUrl(raw);
          this.currentUrl = finalUrl;
          this.inputEl.value = finalUrl;
          this.inputEl.blur();
          options.onNavigate(finalUrl);
        }
      } else if (e.key === "Escape") {
        this.inputEl.value = this.currentUrl;
        this.inputEl.blur();
      }
    });

    this.inputEl.addEventListener("focus", () => {
      this.inputEl.select();
    });

    this.backBtn.addEventListener("click", () => options.onGoBack());
    this.forwardBtn.addEventListener("click", () => options.onGoForward());
    this.reloadBtn.addEventListener("click", () => options.onReload());
    this.widthModeBtn.addEventListener("click", () => options.onToggleWidthMode());
    this.fullscreenBtn.addEventListener("click", () => options.onToggleFullscreen());
    copyBtn.addEventListener("click", () => options.onCopyUrl());
    externalBtn.addEventListener("click", () => options.onOpenExternal());
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public updateUrl(url: string): void {
    this.currentUrl = url;
    if (document.activeElement !== this.inputEl) {
      this.inputEl.value = url;
    }
  }

  public updateWidthMode(mode: WidthMode): void {
    const label = this.widthModeBtn.querySelector(".width-label");
    if (label) {
      label.textContent = mode === "normal" ? "全宽" : "标准";
    }
  }

  public updateFullscreen(isFullscreen: boolean): void {
    const span = this.fullscreenBtn.querySelector("span");
    if (span) {
      span.textContent = isFullscreen ? "退出" : "全屏";
    }
  }

  public setLoading(isLoading: boolean): void {
    if (isLoading) {
      this.reloadBtn.classList.add("is-loading");
    } else {
      this.reloadBtn.classList.remove("is-loading");
    }
  }
}
