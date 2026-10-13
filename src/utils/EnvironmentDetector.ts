/**
 * Electron 运行环境检测工具
 */

interface ExtendedWindow extends Window {
  electron?: unknown;
  process?: {
    versions?: {
      electron?: string;
    };
  };
}

/**
 * 判断当前是否处于 Electron 桌面客户端环境
 */
export function isElectronEnvironment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const extendedWin = window as ExtendedWindow;

  // 1. 检查 User Agent 标识
  const ua = window.navigator?.userAgent || "";
  if (ua.includes("Electron")) {
    return true;
  }

  // 2. 检查全局注入的 electron 宿主对象
  if (Boolean(extendedWin.electron)) {
    return true;
  }

  // 3. 检查 Node.js / Electron process.versions
  if (Boolean(extendedWin.process?.versions?.electron)) {
    return true;
  }

  return false;
}

/**
 * 探测当前宿主是否真正启用了 Electron 原生 <webview> 标签能力
 */
export function isWebViewTagSupported(): boolean {
  if (!isElectronEnvironment()) {
    return false;
  }

  try {
    const el = document.createElement("webview");
    // 如果启用了 webviewTag，创建出的元素应该具有专有属性/方法或特定原型
    const anyEl = el as unknown as Record<string, unknown>;
    if (typeof anyEl.loadURL === "function" || typeof anyEl.reload === "function") {
      return true;
    }
    // 未开启 webviewTag 时，只是 HTMLUnknownElement 或无专属实现
    return false;
  } catch {
    return false;
  }
}
