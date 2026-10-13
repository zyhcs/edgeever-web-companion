/**
 * WebViewport - 网页视窗主容器与 Editor Breakout 宽度自适应管理组件
 */

import { WidthMode } from "../types";

export interface WebViewportOptions {
  initialHeight: number;
  initialWidthMode: WidthMode;
  initialFullscreen: boolean;
}

export class WebViewport {
  private cardEl: HTMLElement;
  private contentArea: HTMLElement;
  private dragMaskEl: HTMLElement;
  private currentHeight: number;
  private currentWidthMode: WidthMode;
  private isFullscreen: boolean;
  private resizeObserver: ResizeObserver | null = null;
  private onWindowResizeBound: () => void;

  constructor(options: WebViewportOptions) {
    this.currentHeight = options.initialHeight;
    this.currentWidthMode = options.initialWidthMode;
    this.isFullscreen = options.initialFullscreen;

    const card = document.createElement("div");
    card.className = "edgeever-web-embed-block";
    card.style.height = "auto";

    const contentArea = document.createElement("div");
    contentArea.className = "edgeever-web-content-area";
    contentArea.style.height = `${this.currentHeight}px`;
    contentArea.style.position = "relative";
    contentArea.style.width = "100%";
    contentArea.style.overflow = "hidden";

    // 拖拽遮罩：拖拽时置于最顶层，杜绝 WebView / Iframe 截取鼠标指针事件
    const dragMask = document.createElement("div");
    dragMask.className = "edgeever-web-drag-mask";
    dragMask.style.display = "none";
    dragMask.style.position = "absolute";
    dragMask.style.inset = "0";
    dragMask.style.zIndex = "999";
    dragMask.style.background = "transparent";

    contentArea.appendChild(dragMask);
    card.appendChild(contentArea);

    this.cardEl = card;
    this.contentArea = contentArea;
    this.dragMaskEl = dragMask;

    this.onWindowResizeBound = () => {
      if (!this.isFullscreen) {
        this.applyBreakoutLayout();
      }
    };
    window.addEventListener("resize", this.onWindowResizeBound);

    this.initBreakoutObserver();
  }

  public getCardElement(): HTMLElement {
    return this.cardEl;
  }

  public getContentArea(): HTMLElement {
    return this.contentArea;
  }

  public setMaskActive(active: boolean): void {
    this.dragMaskEl.style.display = active ? "block" : "none";
    if (active) {
      this.cardEl.classList.add("is-resizing");
    } else {
      this.cardEl.classList.remove("is-resizing");
    }
  }

  public setHeight(height: number): void {
    this.currentHeight = height;
    if (!this.isFullscreen) {
      this.contentArea.style.height = `${height}px`;
    }
  }

  public setFullscreen(fullscreen: boolean): void {
    this.isFullscreen = fullscreen;
    if (fullscreen) {
      this.cardEl.classList.add("is-fullscreen-view");
      this.contentArea.style.height = "calc(100vh - 38px)";
    } else {
      this.cardEl.classList.remove("is-fullscreen-view");
      this.contentArea.style.height = `${this.currentHeight}px`;
      this.applyBreakoutLayout();
    }
  }

  public setWidthMode(mode: WidthMode): void {
    this.currentWidthMode = mode;
    this.applyBreakoutLayout();
  }

  /**
   * Editor Breakout Algorithm
   * 使网页卡片突破默认富文本居中限制，铺满 EdgeEver 编辑器视口全宽，并保留优雅呼吸留白
   */
  public applyBreakoutLayout(): void {
    if (!this.cardEl || !this.cardEl.parentElement || this.isFullscreen) return;

    if (this.currentWidthMode === "normal") {
      this.cardEl.style.width = "100%";
      this.cardEl.style.maxWidth = "100%";
      this.cardEl.style.marginLeft = "0px";
      this.cardEl.style.marginRight = "0px";
      return;
    }

    try {
      const parent = this.cardEl.parentElement;
      let viewport: HTMLElement | null =
        (this.cardEl.closest(".overflow-y-auto") as HTMLElement) ||
        (this.cardEl.closest(".overflow-auto") as HTMLElement);

      if (!viewport) {
        let cur: HTMLElement | null = parent;
        while (cur && cur !== document.body) {
          if (cur.clientWidth > parent.clientWidth + 40) {
            viewport = cur;
            break;
          }
          cur = cur.parentElement;
        }
      }

      if (viewport) {
        const viewportRect = viewport.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const viewportWidth = viewport.clientWidth;

        if (this.currentWidthMode === "editor") {
          // 铺满编辑器工作区，左右各留 20px 边距
          const targetWidth = Math.max(parentRect.width, viewportWidth - 40);
          const targetLeft = viewportRect.left + 20;
          const offset = Math.round(targetLeft - parentRect.left);

          this.cardEl.style.width = `${targetWidth}px`;
          this.cardEl.style.maxWidth = `${targetWidth}px`;
          this.cardEl.style.marginLeft = `${offset}px`;
          this.cardEl.style.marginRight = "auto";
        } else if (this.currentWidthMode === "wide") {
          const maxW = Math.min(1080, viewportWidth - 32);
          const targetLeft = viewportRect.left + (viewportWidth - maxW) / 2;
          const offset = Math.round(targetLeft - parentRect.left);

          this.cardEl.style.width = `${maxW}px`;
          this.cardEl.style.maxWidth = `${maxW}px`;
          this.cardEl.style.marginLeft = `${offset}px`;
          this.cardEl.style.marginRight = "auto";
        }
      } else {
        this.cardEl.style.width = "100%";
        this.cardEl.style.maxWidth = "100%";
        this.cardEl.style.marginLeft = "0px";
        this.cardEl.style.marginRight = "0px";
      }
    } catch {
      this.cardEl.style.width = "100%";
      this.cardEl.style.maxWidth = "100%";
      this.cardEl.style.marginLeft = "0px";
      this.cardEl.style.marginRight = "0px";
    }
  }

  private initBreakoutObserver(): void {
    if (typeof ResizeObserver === "undefined") return;

    try {
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.isFullscreen) {
          this.applyBreakoutLayout();
        }
      });

      // 延时绑定父容器
      window.setTimeout(() => {
        if (this.cardEl.parentElement) {
          this.resizeObserver?.observe(this.cardEl.parentElement);
          if (this.cardEl.parentElement.parentElement) {
            this.resizeObserver?.observe(this.cardEl.parentElement.parentElement);
          }
        }
      }, 50);
    } catch {
      // 容错
    }
  }

  public destroy(): void {
    window.removeEventListener("resize", this.onWindowResizeBound);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.cardEl.remove();
  }
}
