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
