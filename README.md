# EdgeEver Web Companion (网页伴侣) 🌐

> 像在真实 Chrome 浏览器中一样浏览！架构级重构：采用 **Renderer Strategy Pattern**，桌面端由 **原生 Electron WebView** 直驱渲染，完美支持 GitHub、复杂 SPA 动态网站与 Cookie 登录态跨刷新永久保持；集成全功能 Omnibox 地址栏、自适应铺满全宽与无白屏容灾机制。

---

## ✨ 核心特性

- 🚀 **真正浏览器内核优先 (Electron WebView Native Core)**：
  - **彻底突破 CSP / `X-Frame-Options: DENY` 限制**：不再依赖脆弱的 iframe / srcdoc 重放，桌面端直接使用 Chromium 原生 `<webview>` 驱动，完美浏览 **GitHub**、**MyColorSpace** 等站点；
  - **复杂 SPA 动态渲染**：原生支持 `avwikidb.com` 等重度依赖客户端 JavaScript 渲染与异步请求的单页应用；
  - **账号登录态永久保持 (Persistent Session)**：采用 `partition="persist:edgeever-web"`，在 GitHub 或各类网站登录后，重启或刷新 EdgeEver 均永久保持登录状态；
  - **跨窗口智能处理**：自动捕获新窗口弹出并保持在当前视窗内顺滑浏览。
- 🖥️ **全功能 Omnibox 地址栏与浏览器控制**：
  - 顶栏配备 Chrome / Safari 同级智能地址栏，输入网址按回车即时跳转；
  - 支持 **后退**、**前进**、**刷新**、**复制当前链接**、**系统默认浏览器打开**；
  - 网页跳转时自动通过 `getURL()` 实时双向回写保存至笔记属性。
- 📐 **自适应编辑器全宽 (Editor Breakout Algorithm)**：
  - 突破笔记默认居中窄行限制，自动适配主工作区视口全宽，带来沉浸式浏览视野；
  - 配合 ResizeObserver 智能自适应父容器缩放，支持一键切换全屏。
- ↕️ **顺滑高度调节与防鼠标丢失机制**：
  - 底部伸缩手柄在拖拽时自动启用透明事件屏蔽遮罩，彻底杜绝 WebView / Iframe 截获鼠标事件导致的拖拽中断卡死；
  - 松手即刻持久化保存高度数值。
- 🛡️ **优雅容灾与 Cloudflare 探测 (Zero-Blank Fallback)**：
  - Web 环境降级运行优化版 iframe 机制；
  - 具备 Cloudflare 人机验证智能探测 (`cf-chl`, `challenge-platform`)，受阻时展示高颜值深色引导卡片，**绝无白屏**。
- ⚡ **`/web` 随处触发与快捷键**：
  - 随时输入 `/web` 或按 `Alt+W` 呼出弹窗，自动读取剪贴板链接，一键插入。

---

## 🏛️ 架构设计 (Renderer Strategy Pattern)

```
       Web Embed Node (type: "web-view")
                      │
            WebRendererFactory
                      │
       ┌──────────────┴──────────────┐
       ▼                             ▼
[Electron 桌面环境]              [Web / 兜底环境]
ElectronWebViewRenderer          IframeRenderer
       │                             │
Chromium <webview>               iframe / srcdoc
(persist:edgeever-web)           (Cloudflare 探测 & Fallback)
```

- **统一接口**：`IBrowserRenderer` 抽象生命周期、导航与状态事件；
- **环境探测**：`EnvironmentDetector` 自动判断运行宿主环境；
- **状态流转**：`WebLoadState` (INIT / LOADING / SUCCESS / FAILED / BLOCKED / CLOUDFLARE_REQUIRED) 全程受控。

---

## 📝 更新日志

### v1.4.0 (2026-10-13)
- 🚀 **架构级重构：升级为真正浏览器内核优先 (Renderer Strategy Pattern)**：
  - 全面采用 **Electron WebView 驱动**，桌面端彻底弃用 iframe 作为主力方案；
  - **完美解决 GitHub 无法显示**：突破 `X-Frame-Options: DENY` 限制，正常浏览代码仓库与 Issues；
  - **完美支持复杂 SPA 网站**：正常加载 `avwikidb.com`、`mycolor.space` 等动态应用；
  - **登录状态永久保持**：接入 `partition="persist:edgeever-web"`，账号登录与 Cookie 跨会话永久保持；
  - **浏览器导航增强**：Omnibox 回车直达，新增后退、前进、刷新状态监听与 URL 实时双向同步；
  - **拖拽拉伸优化**：解决 WebView 鼠标指针捕获丢失问题，拖拽如丝般顺滑；
  - **代码工程化升级**：全量模块拆分，100% 严格 TypeScript strict 规范与零外部运行时依赖打包。

---

## 💻 本地构建与开发

```bash
# 依赖安装
npm install

# TypeScript 类型检查
npm run type-check

# 生产级极速打包 (输出自包含 main.js)
npm run build
```
