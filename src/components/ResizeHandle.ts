/**
 * ResizeHandle - 底部高度顺畅拖拽拉伸控制器
 * 彻底解决 WebView / Iframe 抢占鼠标拖拽事件 (mouse capture) 问题
 */

export interface ResizeHandleOptions {
  initialHeight: number;
  minHeight?: number;
  maxHeight?: number;
  onHeightChange: (height: number) => void;
  onResizeEnd: (finalHeight: number) => void;
  setMaskActive: (active: boolean) => void;
}

export class ResizeHandle {
  private element: HTMLElement;
  private currentHeight: number;

  constructor(options: ResizeHandleOptions) {
    this.currentHeight = options.initialHeight;
    this.element = this.createHandle(options);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  private createHandle(opts: ResizeHandleOptions): HTMLElement {
    const minH = opts.minHeight ?? 240;
    const maxH = opts.maxHeight ?? 2400;

    const handle = document.createElement("div");
    handle.className = "edgeever-web-resize-handle";
    handle.title = "按住上下拖拽调节视窗高度";
    handle.innerHTML = `
      <div class="edgeever-web-resize-bar"></div>
    `;

    let startY = 0;
    let startH = this.currentHeight;
    let isDragging = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const deltaY = e.clientY - startY;
      const nextH = Math.min(maxH, Math.max(minH, Math.round(startH + deltaY)));
      this.currentHeight = nextH;
      opts.onHeightChange(nextH);
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      opts.setMaskActive(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      opts.onResizeEnd(this.currentHeight);
    };

    handle.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      startY = e.clientY;
      startH = this.currentHeight;

      // 关键：拖拽开始时激活遮罩层或禁用 WebView 指针事件，防止鼠标进入 WebView 造成事件截断丢失
      opts.setMaskActive(true);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });

    return handle;
  }
}
