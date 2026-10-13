/**
 * WebRendererFactory - 渲染器策略工厂
 * 负责依据运行环境 (Electron vs Web) 及策略配置派发最优浏览器内核渲染器
 */

import { IBrowserRenderer, RendererEngine, RendererEvents } from "../types";
import { isElectronEnvironment } from "../utils/EnvironmentDetector";
import { ElectronWebViewRenderer } from "../renderers/ElectronWebViewRenderer";
import { IframeRenderer, NetworkFetchFn } from "../renderers/IframeRenderer";

export class WebRendererFactory {
  public static createRenderer(
    url: string,
    title: string,
    events: RendererEvents,
    enginePreference: RendererEngine = "auto",
    networkFetch?: NetworkFetchFn | null
  ): IBrowserRenderer {
    const isElectron = isElectronEnvironment();

    // 优先策略：桌面端真实浏览器内核优先（若宿主未启用 webviewTag 则自动自愈降级）
    if (enginePreference === "electron" || (enginePreference === "auto" && isElectron)) {
      return new ElectronWebViewRenderer(url, title, events, networkFetch);
    }

    // Web 端或显式指定 iframe
    return new IframeRenderer(url, title, events, networkFetch);
  }
}
