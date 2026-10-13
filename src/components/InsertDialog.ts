/**
 * InsertDialog - 快速插入网页弹窗交互组件
 */

import { sanitizeUrl } from "../utils/url";

export class InsertDialog {
  private static activeModal: HTMLElement | null = null;

  public static show(onConfirm: (url: string) => void): void {
    this.close();

    const backdrop = document.createElement("div");
    backdrop.className = "edgeever-web-modal-backdrop";
    backdrop.innerHTML = `
      <div class="edgeever-web-modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="font-weight:700;font-size:14px;color:#f8fafc;display:flex;align-items:center;gap:6px;">
            🌐 插入真实浏览器视窗 (Web Embed)
          </span>
          <button type="button" class="edgeever-web-modal-close" style="background:none;border:none;color:#94a3b8;font-size:17px;cursor:pointer;padding:0 4px;">✕</button>
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:11.5px;color:#94a3b8;margin-bottom:5px;">目标网页地址 (URL)</label>
          <input type="text" class="edgeever-web-input-url" placeholder="https://github.com" style="width:100%;box-sizing:border-box;padding:8px 10px;background:#0f172a;border:1px solid rgba(255,255,255,0.16);border-radius:6px;color:#f8fafc;font-size:13px;outline:none;" />
        </div>

        <div style="font-size:11px;color:#94a3b8;margin-bottom:16px;line-height:1.5;">
          💡 提示：按回车即可插入。可在笔记任意位置随时输入 <code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;">/web</code> 或按 <code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;">Alt+W</code> 唤出此弹窗。
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="edgeever-web-modal-cancel" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:5px;color:#e2e8f0;font-size:12px;cursor:pointer;">取消</button>
          <button type="button" class="edgeever-web-modal-confirm" style="padding:6px 16px;background:#38bdf8;border:none;border-radius:5px;color:#0f172a;font-size:12px;font-weight:600;cursor:pointer;">立即插入</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    this.activeModal = backdrop;

    const input = backdrop.querySelector(".edgeever-web-input-url") as HTMLInputElement | null;
    const closeBtn = backdrop.querySelector(".edgeever-web-modal-close") as HTMLButtonElement | null;
    const cancelBtn = backdrop.querySelector(".edgeever-web-modal-cancel") as HTMLButtonElement | null;
    const confirmBtn = backdrop.querySelector(".edgeever-web-modal-confirm") as HTMLButtonElement | null;

    // 智能读取剪贴板链接
    if (navigator.clipboard?.readText && input) {
      navigator.clipboard
        .readText()
        .then((clip) => {
          if (clip && /^https?:\/\//i.test(clip.trim())) {
            input.value = clip.trim();
            input.select();
          }
        })
        .catch(() => {});
    }

    window.setTimeout(() => input?.focus(), 60);

    const handleConfirm = () => {
      if (!input) return;
      const raw = input.value.trim();
      if (!raw) {
        input.focus();
        return;
      }
      const finalUrl = sanitizeUrl(raw);
      this.close();
      onConfirm(finalUrl);
    };

    closeBtn?.addEventListener("click", () => this.close());
    cancelBtn?.addEventListener("click", () => this.close());
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) this.close();
    });

    confirmBtn?.addEventListener("click", handleConfirm);
    input?.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        this.close();
      }
    });
  }

  public static close(): void {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }
  }
}
