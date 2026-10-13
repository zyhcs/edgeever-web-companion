// src/utils/url.ts
function sanitizeUrl(input) {
  if (!input || typeof input !== "string") {
    return "about:blank";
  }
  let trimmed = input.trim();
  if (!trimmed) {
    return "about:blank";
  }
  if (!/^https?:\/\//i.test(trimmed) && !/^about:/i.test(trimmed) && !/^file:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }
  return trimmed;
}
function extractHostname(url, fallback = "Web View") {
  try {
    const parsed = new URL(url);
    return parsed.hostname || fallback;
  } catch {
    return fallback;
  }
}
function isKnownFrameDeniedHost(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const deniedList = [
      "github.com",
      "gist.github.com",
      "google.com",
      "www.google.com",
      "youtube.com",
      "www.youtube.com",
      "twitter.com",
      "x.com",
      "facebook.com",
      "www.facebook.com",
      "instagram.com",
      "www.instagram.com",
      "notion.so",
      "www.notion.so"
    ];
    return deniedList.some((denied) => host === denied || host.endsWith("." + denied));
  } catch {
    return false;
  }
}

// src/services/EmbedStore.ts
var EmbedStore = class {
  /**
   * 将输入的各种不规则数据归一化为标准的 WebEmbedAttrs
   */
  static parseAttrs(input) {
    let rawUrl = "";
    let rawTitle = "";
    let rawHeight = 720;
    let rawFullscreen = false;
    let rawEngine = "auto";
    let rawWidthMode = "editor";
    if (typeof input === "string") {
      rawUrl = input;
    } else if (input && typeof input === "object") {
      const obj = input;
      if (obj.attrs) {
        if (obj.attrs.url) rawUrl = obj.attrs.url;
        if (obj.attrs.title) rawTitle = obj.attrs.title;
        if (typeof obj.attrs.height === "number") rawHeight = obj.attrs.height;
        if (typeof obj.attrs.fullscreen === "boolean") rawFullscreen = obj.attrs.fullscreen;
        if (obj.attrs.engine) rawEngine = obj.attrs.engine;
        if (obj.attrs.widthMode) rawWidthMode = obj.attrs.widthMode;
      }
      if (obj.data) {
        if (!rawUrl && obj.data.url) rawUrl = obj.data.url;
        if (!rawTitle && obj.data.title) rawTitle = obj.data.title;
        if (obj.data.height) rawHeight = obj.data.height;
        if (typeof obj.data.fullscreen === "boolean") rawFullscreen = obj.data.fullscreen;
        if (obj.data.engine) rawEngine = obj.data.engine;
        if (obj.data.widthMode) rawWidthMode = obj.data.widthMode;
      }
      if (obj.dataJson) {
        try {
          const parsed = JSON.parse(obj.dataJson);
          if (!rawUrl && typeof parsed.url === "string") rawUrl = parsed.url;
          if (!rawTitle && typeof parsed.title === "string") rawTitle = parsed.title;
          if (typeof parsed.height === "number") rawHeight = parsed.height;
          if (typeof parsed.fullscreen === "boolean") rawFullscreen = parsed.fullscreen;
          if (typeof parsed.engine === "string") rawEngine = parsed.engine;
          if (typeof parsed.widthMode === "string") rawWidthMode = parsed.widthMode;
        } catch {
        }
      }
      if (!rawUrl && obj.resourceId) rawUrl = obj.resourceId;
      if (!rawTitle && obj.title) rawTitle = obj.title;
    }
    const finalUrl = sanitizeUrl(rawUrl);
    const finalTitle = rawTitle || extractHostname(finalUrl, "Web View");
    return {
      url: finalUrl,
      title: finalTitle,
      height: rawHeight > 0 ? rawHeight : 720,
      fullscreen: Boolean(rawFullscreen),
      engine: rawEngine || "auto",
      widthMode: rawWidthMode || "editor"
    };
  }
  /**
   * 将修改后的 attrs 双向持久化回写至 EdgeEver 笔记文档中
   */
  static updateEmbedAttributesInDoc(context, embedId, oldUrl, updatedAttrs) {
    if (!context) return;
    const dataPayload = {
      url: updatedAttrs.url,
      title: updatedAttrs.title,
      height: updatedAttrs.height,
      fullscreen: updatedAttrs.fullscreen,
      engine: updatedAttrs.engine,
      widthMode: updatedAttrs.widthMode
    };
    const dataJson = JSON.stringify(dataPayload);
    const editor = context.editor?.getInstance ? context.editor.getInstance() : null;
    let updatedInTiptap = false;
    if (editor?.state?.doc && editor?.commands?.command) {
      try {
        editor.state.doc.descendants((node, pos) => {
          if ((node.type?.name === "edgeeverPluginEmbed" || node.type?.name === "edgeeverEmbed" || node.type?.name === "web-view") && (node.attrs?.id === embedId || node.attrs?.resourceId === oldUrl || node.attrs?.url === oldUrl)) {
            editor.commands?.command?.(({ tr }) => {
              const trAny = tr;
              trAny.setNodeMarkup(pos, void 0, {
                ...node.attrs,
                title: updatedAttrs.title,
                resourceId: updatedAttrs.url,
                url: updatedAttrs.url,
                data: dataPayload,
                dataJson,
                attrs: updatedAttrs
              });
              return true;
            });
            updatedInTiptap = true;
            return false;
          }
          return true;
        });
      } catch (err) {
        console.warn("[Web Companion] update node markup in tiptap failed:", err);
      }
    }
    if (!updatedInTiptap && context.editor?.editMarkdown) {
      context.editor.editMarkdown((md) => {
        return md.replace(
          /```edgeever-plugin-embed\n([\s\S]*?)\n```/g,
          (fullMatch, jsonStr) => {
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.id === embedId || parsed.resourceId === oldUrl) {
                parsed.title = updatedAttrs.title;
                parsed.resourceId = updatedAttrs.url;
                parsed.data = dataPayload;
                parsed.dataJson = dataJson;
                parsed.attrs = updatedAttrs;
                return `\`\`\`edgeever-plugin-embed
${JSON.stringify(parsed)}
\`\`\``;
              }
            } catch {
            }
            return fullMatch;
          }
        );
      }).catch(() => {
      });
    }
  }
};

// src/utils/EnvironmentDetector.ts
function isElectronEnvironment() {
  if (typeof window === "undefined") {
    return false;
  }
  const extendedWin = window;
  const ua = window.navigator?.userAgent || "";
  if (ua.includes("Electron")) {
    return true;
  }
  if (Boolean(extendedWin.electron)) {
    return true;
  }
  if (Boolean(extendedWin.process?.versions?.electron)) {
    return true;
  }
  return false;
}

// src/renderers/BrowserRenderer.ts
var BaseBrowserRenderer = class {
  _state = "INIT" /* INIT */;
  _currentUrl;
  _currentTitle;
  events;
  container = null;
  constructor(initialUrl, initialTitle, events) {
    this._currentUrl = initialUrl;
    this._currentTitle = initialTitle;
    this.events = events;
  }
  get state() {
    return this._state;
  }
  getURL() {
    return this._currentUrl;
  }
  getTitle() {
    return this._currentTitle;
  }
  setState(nextState, detail) {
    if (this._state !== nextState) {
      this._state = nextState;
      this.events.onStateChange(nextState, detail);
    }
  }
  setUrl(nextUrl) {
    if (this._currentUrl !== nextUrl) {
      this._currentUrl = nextUrl;
      this.events.onUrlChange(nextUrl);
    }
  }
  setTitle(nextTitle) {
    if (this._currentTitle !== nextTitle) {
      this._currentTitle = nextTitle;
      this.events.onTitleChange(nextTitle);
    }
  }
};

// src/services/BrowserSession.ts
var BrowserSession = class {
  /**
   * 默认持久化 Partition 名称
   * 确保用户在嵌入视窗中的 Cookie、LocalStorage、SessionStorage 与登录态在跨会话中完全持久保存
   */
  static DEFAULT_PARTITION = "persist:edgeever-web";
  static getPartition() {
    return this.DEFAULT_PARTITION;
  }
};

// src/renderers/IframeRenderer.ts
var IframeRenderer = class extends BaseBrowserRenderer {
  iframe = null;
  isDestroyed = false;
  abortController = null;
  networkFetch = null;
  constructor(initialUrl, initialTitle, events, networkFetch) {
    super(initialUrl, initialTitle, events);
    this.networkFetch = networkFetch || null;
  }
  mount(parent) {
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
  loadURL(url) {
    this.setUrl(url);
    this.loadWithFallback(url);
  }
  reload() {
    this.loadWithFallback(this._currentUrl);
  }
  goBack() {
    try {
      this.iframe?.contentWindow?.history.back();
    } catch {
    }
  }
  goForward() {
    try {
      this.iframe?.contentWindow?.history.forward();
    } catch {
    }
  }
  canGoBack() {
    return false;
  }
  canGoForward() {
    return false;
  }
  async loadWithFallback(url) {
    if (this.isDestroyed || !this.iframe) return;
    this.abortController?.abort();
    this.abortController = new AbortController();
    this.setState("LOADING" /* LOADING */);
    if (isKnownFrameDeniedHost(url)) {
      this.iframe.style.display = "none";
      this.setState(
        "BLOCKED" /* BLOCKED */,
        "\u6B64\u7F51\u7AD9\u5F00\u542F\u4E86\u5168\u5C40\u9632\u5D4C\u5B89\u5168\u7B56\u7565 (X-Frame-Options: DENY)\uFF0C\u7981\u6B62\u5728\u5185\u5D4C\u6846\u67B6\u4E2D\u76F4\u63A5\u8FD0\u884C\u3002"
      );
      return;
    }
    if (this.networkFetch) {
      try {
        const resp = await this.networkFetch(url, {
          transport: "public",
          method: "GET",
          headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
          },
          signal: this.abortController.signal
        });
        if (resp && resp.ok) {
          const text = await resp.text();
          if (text && text.length > 50) {
            const lowerText = text.toLowerCase();
            if (lowerText.includes("cf-chl") || lowerText.includes("challenge-platform") || lowerText.includes("cloudflare ray id") || lowerText.includes("just a moment...")) {
              this.iframe.style.display = "none";
              this.setState(
                "CLOUDFLARE_REQUIRED" /* CLOUDFLARE_REQUIRED */,
                "\u76EE\u6807\u7AD9\u70B9\u542F\u7528\u4E86 Cloudflare \u4EBA\u673A\u9A8C\u8BC1\u9632\u62A4\uFF0C\u8BF7\u5728\u5916\u90E8\u6D4F\u89C8\u5668\u4E2D\u76F4\u63A5\u6D4F\u89C8\uFF01"
              );
              return;
            }
            const safeHtml = this.sanitizeAndInjectBase(text, url);
            this.iframe.removeAttribute("src");
            this.iframe.srcdoc = safeHtml;
            this.iframe.style.display = "block";
            this.setState("SUCCESS" /* SUCCESS */);
            return;
          }
        }
      } catch {
      }
    }
    this.iframe.removeAttribute("srcdoc");
    this.iframe.style.display = "block";
    let hasLoaded = false;
    const watchdogTimer = window.setTimeout(() => {
      if (!hasLoaded && !this.isDestroyed) {
        hasLoaded = true;
        this.setState("SUCCESS" /* SUCCESS */);
      }
    }, 1500);
    this.iframe.onload = () => {
      if (!hasLoaded && !this.isDestroyed) {
        hasLoaded = true;
        window.clearTimeout(watchdogTimer);
        this.setState("SUCCESS" /* SUCCESS */);
      }
    };
    this.iframe.onerror = () => {
      if (!hasLoaded && !this.isDestroyed) {
        hasLoaded = true;
        window.clearTimeout(watchdogTimer);
        this.setState(
          "BLOCKED" /* BLOCKED */,
          "\u65E0\u6CD5\u52A0\u8F7D\u6B64\u9875\u9762\uFF0C\u53EF\u80FD\u53D7\u8DE8\u57DF\u5B89\u5168\u7B56\u7565\u9650\u5236\u3002"
        );
      }
    };
    this.iframe.src = url;
  }
  sanitizeAndInjectBase(html, originalUrl) {
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
  destroy() {
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
};

// src/renderers/ElectronWebViewRenderer.ts
var ElectronWebViewRenderer = class extends BaseBrowserRenderer {
  webview = null;
  fallbackRenderer = null;
  isDestroyed = false;
  watchdogTimer = null;
  networkFetch = null;
  constructor(initialUrl, initialTitle, events, networkFetch) {
    super(initialUrl, initialTitle, events);
    this.networkFetch = networkFetch || null;
  }
  mount(parent) {
    this.container = parent;
    this.isDestroyed = false;
    const webview = document.createElement("webview");
    this.webview = webview;
    webview.setAttribute("partition", BrowserSession.getPartition());
    webview.setAttribute("allowpopups", "true");
    webview.setAttribute("src", this._currentUrl);
    webview.style.width = "100%";
    webview.style.height = "100%";
    webview.style.border = "none";
    webview.style.outline = "none";
    webview.style.display = "flex";
    webview.style.background = "#0f172a";
    let hasReceivedEvent = false;
    const onStart = () => {
      if (this.isDestroyed) return;
      hasReceivedEvent = true;
      this.clearWatchdog();
      this.setState("LOADING" /* LOADING */);
    };
    const onStop = () => {
      if (this.isDestroyed) return;
      hasReceivedEvent = true;
      this.clearWatchdog();
      this.syncUrlAndTitle();
      this.setState("SUCCESS" /* SUCCESS */);
    };
    const onFail = (e) => {
      if (this.isDestroyed) return;
      hasReceivedEvent = true;
      this.clearWatchdog();
      const customEvent = e;
      if (customEvent.errorCode === -3) return;
      this.setState("FAILED" /* FAILED */, customEvent.errorDescription || "\u52A0\u8F7D\u5931\u8D25");
    };
    const onDomReady = () => {
      if (this.isDestroyed) return;
      hasReceivedEvent = true;
      this.clearWatchdog();
      this.syncUrlAndTitle();
      this.setState("SUCCESS" /* SUCCESS */);
    };
    const onNewWindow = (e) => {
      const custom = e;
      if (custom.url) {
        custom.preventDefault?.();
        this.loadURL(custom.url);
      }
    };
    const onNav = (e) => {
      if (this.isDestroyed) return;
      hasReceivedEvent = true;
      this.clearWatchdog();
      const custom = e;
      if (custom.url) {
        this.setUrl(custom.url);
      }
      this.syncUrlAndTitle();
    };
    webview.addEventListener("did-start-loading", onStart);
    webview.addEventListener("did-stop-loading", onStop);
    webview.addEventListener("did-fail-load", onFail);
    webview.addEventListener("dom-ready", onDomReady);
    webview.addEventListener("new-window", onNewWindow);
    webview.addEventListener("did-navigate", onNav);
    webview.addEventListener("did-navigate-in-page", onNav);
    parent.appendChild(webview);
    this.setState("LOADING" /* LOADING */);
    this.watchdogTimer = window.setTimeout(() => {
      if (!hasReceivedEvent && !this.isDestroyed && this.webview) {
        console.warn("[Web Companion] Electron webview \u672A\u89E6\u53D1\u4E8B\u4EF6\uFF0C\u68C0\u6D4B\u5230\u5BBF\u4E3B\u672A\u542F\u7528 webviewTag\uFF0C\u81EA\u52A8\u81EA\u6108\u964D\u7EA7\u4E3A\u517C\u5BB9\u6E32\u67D3\u3002");
        this.activateFallback(parent);
      }
    }, 1200);
  }
  clearWatchdog() {
    if (this.watchdogTimer !== null) {
      window.clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }
  activateFallback(parent) {
    this.clearWatchdog();
    if (this.webview) {
      try {
        this.webview.remove();
      } catch {
      }
      this.webview = null;
    }
    this.fallbackRenderer = new IframeRenderer(
      this._currentUrl,
      this._currentTitle,
      this.events,
      this.networkFetch
    );
    this.fallbackRenderer.mount(parent);
  }
  syncUrlAndTitle() {
    if (!this.webview || this.isDestroyed) return;
    try {
      if (typeof this.webview.getURL === "function") {
        const u = this.webview.getURL();
        if (u && !u.startsWith("about:blank")) this.setUrl(u);
      }
    } catch {
    }
    try {
      if (typeof this.webview.getTitle === "function") {
        const t = this.webview.getTitle();
        if (t) this.setTitle(t);
      }
    } catch {
    }
  }
  loadURL(url) {
    if (this.fallbackRenderer) {
      this.fallbackRenderer.loadURL(url);
      return;
    }
    if (!this.webview || this.isDestroyed) return;
    this.setUrl(url);
    this.setState("LOADING" /* LOADING */);
    try {
      if (typeof this.webview.loadURL === "function") {
        this.webview.loadURL(url);
      } else {
        this.webview.src = url;
      }
    } catch {
      this.webview.src = url;
    }
  }
  reload() {
    if (this.fallbackRenderer) {
      this.fallbackRenderer.reload();
      return;
    }
    if (!this.webview || this.isDestroyed) return;
    this.setState("LOADING" /* LOADING */);
    try {
      if (typeof this.webview.reload === "function") {
        this.webview.reload();
      } else {
        this.webview.src = this._currentUrl;
      }
    } catch {
      this.webview.src = this._currentUrl;
    }
  }
  goBack() {
    if (this.fallbackRenderer) {
      this.fallbackRenderer.goBack();
      return;
    }
    try {
      if (this.canGoBack()) this.webview?.goBack();
    } catch {
    }
  }
  goForward() {
    if (this.fallbackRenderer) {
      this.fallbackRenderer.goForward();
      return;
    }
    try {
      if (this.canGoForward()) this.webview?.goForward();
    } catch {
    }
  }
  canGoBack() {
    if (this.fallbackRenderer) return this.fallbackRenderer.canGoBack();
    if (!this.webview || this.isDestroyed) return false;
    try {
      return typeof this.webview.canGoBack === "function" ? this.webview.canGoBack() : false;
    } catch {
      return false;
    }
  }
  canGoForward() {
    if (this.fallbackRenderer) return this.fallbackRenderer.canGoForward();
    if (!this.webview || this.isDestroyed) return false;
    try {
      return typeof this.webview.canGoForward === "function" ? this.webview.canGoForward() : false;
    } catch {
      return false;
    }
  }
  destroy() {
    this.isDestroyed = true;
    this.clearWatchdog();
    if (this.fallbackRenderer) {
      this.fallbackRenderer.destroy();
      this.fallbackRenderer = null;
    }
    if (this.webview) {
      try {
        if (typeof this.webview.stop === "function") this.webview.stop();
        this.webview.remove();
      } catch {
      }
      this.webview = null;
    }
    this.container = null;
  }
};

// src/services/WebRendererFactory.ts
var WebRendererFactory = class {
  static createRenderer(url, title, events, enginePreference = "auto", networkFetch) {
    const isElectron = isElectronEnvironment();
    if (enginePreference === "electron" || enginePreference === "auto" && isElectron) {
      return new ElectronWebViewRenderer(url, title, events, networkFetch);
    }
    return new IframeRenderer(url, title, events, networkFetch);
  }
};

// src/components/WebViewport.ts
var WebViewport = class {
  cardEl;
  contentArea;
  dragMaskEl;
  currentHeight;
  currentWidthMode;
  isFullscreen;
  resizeObserver = null;
  onWindowResizeBound;
  constructor(options) {
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
  getCardElement() {
    return this.cardEl;
  }
  getContentArea() {
    return this.contentArea;
  }
  setMaskActive(active) {
    this.dragMaskEl.style.display = active ? "block" : "none";
    if (active) {
      this.cardEl.classList.add("is-resizing");
    } else {
      this.cardEl.classList.remove("is-resizing");
    }
  }
  setHeight(height) {
    this.currentHeight = height;
    if (!this.isFullscreen) {
      this.contentArea.style.height = `${height}px`;
    }
  }
  setFullscreen(fullscreen) {
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
  setWidthMode(mode) {
    this.currentWidthMode = mode;
    this.applyBreakoutLayout();
  }
  /**
   * Editor Breakout Algorithm
   * 使网页卡片突破默认富文本居中限制，铺满 EdgeEver 编辑器视口全宽，并保留优雅呼吸留白
   */
  applyBreakoutLayout() {
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
      let viewport = this.cardEl.closest(".overflow-y-auto") || this.cardEl.closest(".overflow-auto");
      if (!viewport) {
        let cur = parent;
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
  initBreakoutObserver() {
    if (typeof ResizeObserver === "undefined") return;
    try {
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.isFullscreen) {
          this.applyBreakoutLayout();
        }
      });
      window.setTimeout(() => {
        if (this.cardEl.parentElement) {
          this.resizeObserver?.observe(this.cardEl.parentElement);
          if (this.cardEl.parentElement.parentElement) {
            this.resizeObserver?.observe(this.cardEl.parentElement.parentElement);
          }
        }
      }, 50);
    } catch {
    }
  }
  destroy() {
    window.removeEventListener("resize", this.onWindowResizeBound);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.cardEl.remove();
  }
};

// src/components/WebToolbar.ts
var WebToolbar = class {
  element;
  inputEl;
  reloadBtn;
  backBtn;
  forwardBtn;
  widthModeBtn;
  fullscreenBtn;
  currentUrl;
  constructor(options) {
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
        <button type="button" class="edgeever-web-btn-nav btn-back" title="\u540E\u9000">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button type="button" class="edgeever-web-btn-nav btn-forward" title="\u524D\u8FDB">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        <button type="button" class="edgeever-web-btn-nav btn-reload" title="\u5237\u65B0\u9875\u9762">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        </button>
      </div>

      <div class="edgeever-web-omnibox-wrap">
        <span class="edgeever-web-lock-icon">\u{1F512}</span>
        <input type="text" class="edgeever-web-omnibox-input" spellcheck="false" placeholder="\u8F93\u5165\u7F51\u5740\u6309\u56DE\u8F66\u76F4\u63A5\u8DF3\u8F6C..." />
      </div>

      <div class="edgeever-web-embed-actions">
        <button type="button" class="edgeever-web-btn-icon btn-copy" title="\u590D\u5236\u5F53\u524D\u7F51\u5740">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>\u590D\u5236</span>
        </button>
        <button type="button" class="edgeever-web-btn-icon btn-width" title="\u5207\u6362\u5BBD\u5EA6\u81EA\u9002\u5E94\u6A21\u5F0F">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
          <span class="width-label">${options.initialWidthMode === "normal" ? "\u5168\u5BBD" : "\u6807\u51C6"}</span>
        </button>
        <button type="button" class="edgeever-web-btn-icon btn-fullscreen" title="\u8FDB\u5165\u5168\u5C4F\u6C89\u6D78\u6D4F\u89C8">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
          <span>\u5168\u5C4F</span>
        </button>
        <button type="button" class="edgeever-web-btn-icon btn-external" title="\u5728\u5916\u90E8\u9ED8\u8BA4\u6D4F\u89C8\u5668\u4E2D\u6253\u5F00">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          <span>\u6253\u5F00</span>
        </button>
      </div>
    `;
    this.element = bar;
    this.inputEl = bar.querySelector(".edgeever-web-omnibox-input");
    this.backBtn = bar.querySelector(".btn-back");
    this.forwardBtn = bar.querySelector(".btn-forward");
    this.reloadBtn = bar.querySelector(".btn-reload");
    this.widthModeBtn = bar.querySelector(".btn-width");
    this.fullscreenBtn = bar.querySelector(".btn-fullscreen");
    const copyBtn = bar.querySelector(".btn-copy");
    const externalBtn = bar.querySelector(".btn-external");
    this.inputEl.value = this.currentUrl;
    this.inputEl.addEventListener("keydown", (e) => {
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
  getElement() {
    return this.element;
  }
  updateUrl(url) {
    this.currentUrl = url;
    if (document.activeElement !== this.inputEl) {
      this.inputEl.value = url;
    }
  }
  updateWidthMode(mode) {
    const label = this.widthModeBtn.querySelector(".width-label");
    if (label) {
      label.textContent = mode === "normal" ? "\u5168\u5BBD" : "\u6807\u51C6";
    }
  }
  updateFullscreen(isFullscreen) {
    const span = this.fullscreenBtn.querySelector("span");
    if (span) {
      span.textContent = isFullscreen ? "\u9000\u51FA" : "\u5168\u5C4F";
    }
  }
  setLoading(isLoading) {
    if (isLoading) {
      this.reloadBtn.classList.add("is-loading");
    } else {
      this.reloadBtn.classList.remove("is-loading");
    }
  }
};

// src/components/ResizeHandle.ts
var ResizeHandle = class {
  element;
  currentHeight;
  constructor(options) {
    this.currentHeight = options.initialHeight;
    this.element = this.createHandle(options);
  }
  getElement() {
    return this.element;
  }
  createHandle(opts) {
    const minH = opts.minHeight ?? 240;
    const maxH = opts.maxHeight ?? 2400;
    const handle = document.createElement("div");
    handle.className = "edgeever-web-resize-handle";
    handle.title = "\u6309\u4F4F\u4E0A\u4E0B\u62D6\u62FD\u8C03\u8282\u89C6\u7A97\u9AD8\u5EA6";
    handle.innerHTML = `
      <div class="edgeever-web-resize-bar"></div>
    `;
    let startY = 0;
    let startH = this.currentHeight;
    let isDragging = false;
    const onMouseMove = (e) => {
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
    handle.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startY = e.clientY;
      startH = this.currentHeight;
      opts.setMaskActive(true);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
    return handle;
  }
};

// src/components/FallbackCard.ts
var FallbackCard = class {
  element;
  constructor(options) {
    this.element = this.createCard(options);
  }
  getElement() {
    return this.element;
  }
  createCard(opts) {
    const card = document.createElement("div");
    card.className = "edgeever-web-fallback-card";
    const hostname = extractHostname(opts.url, "\u76EE\u6807\u7AD9\u70B9");
    let icon = "\u26A0\uFE0F";
    let title = "\u9875\u9762\u6682\u65F6\u65E0\u6CD5\u52A0\u8F7D";
    let description = "\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u6216\u76EE\u6807\u7F51\u7AD9\u53EF\u7528\u6027\u3002";
    let badge = "\u7F51\u7EDC\u9519\u8BEF";
    let badgeColor = "#ef4444";
    switch (opts.state) {
      case "CLOUDFLARE_REQUIRED" /* CLOUDFLARE_REQUIRED */:
        icon = "\u{1F6E1}\uFE0F";
        title = "\u9700\u5B8C\u6574\u6D4F\u89C8\u5668\u5185\u6838\u6E32\u67D3";
        description = "\u5F53\u524D\u7AD9\u70B9\u542F\u7528\u4E86 Cloudflare \u4EBA\u673A\u9A8C\u8BC1\u6216\u9AD8\u7EA7\u5B89\u5168\u9632\u62A4\uFF0CWeb \u7248\u6C99\u7BB1\u73AF\u5883\u65E0\u6CD5\u7A7F\u900F\u3002\u8BF7\u5728 EdgeEver \u684C\u9762\u7248\u4E2D\u76F4\u63A5\u6D4F\u89C8\uFF01";
        badge = "Cloudflare \u9632\u62A4";
        badgeColor = "#f59e0b";
        break;
      case "BLOCKED" /* BLOCKED */:
        icon = "\u{1F512}";
        title = "\u7AD9\u70B9\u9650\u5236 iframe \u5D4C\u5957\u6D4F\u89C8";
        description = `\u7AD9\u70B9 [${hostname}] \u914D\u7F6E\u4E86\u4E25\u683C\u7684\u5B89\u5168\u9632\u62A4\u7B56\u7565\uFF08\u5982 frame-ancestors / X-Frame-Options: DENY\uFF09\u3002\u5728 EdgeEver \u684C\u9762\u7248\u4E2D\u5C06\u81EA\u52A8\u542F\u7528\u539F\u751F Chromium \u5185\u6838\u6D41\u7545\u6D4F\u89C8\u3002`;
        badge = "\u8DE8\u57DF\u5B89\u5168\u7B56\u7565\u9650\u5236";
        badgeColor = "#38bdf8";
        break;
      case "FAILED" /* FAILED */:
      default:
        icon = "\u{1F50C}";
        title = "\u8FDE\u63A5\u4E2D\u65AD\u6216\u52A0\u8F7D\u5931\u8D25";
        description = opts.detail ? `\u9519\u8BEF\u8BE6\u60C5\uFF1A${opts.detail}` : "\u76EE\u6807\u670D\u52A1\u5668\u54CD\u5E94\u5F02\u5E38\u6216\u5F53\u524D\u7F51\u7EDC\u73AF\u5883\u53D7\u963B\u3002";
        badge = "\u52A0\u8F7D\u5F02\u5E38";
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
          <span class="url-label">\u76EE\u6807\u5730\u5740:</span>
          <span class="url-text">${opts.url}</span>
        </div>

        <div class="edgeever-web-fallback-actions">
          <button type="button" class="fallback-btn fallback-btn-primary action-open">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            \u5728\u5916\u90E8\u6D4F\u89C8\u5668\u4E2D\u6253\u5F00
          </button>
          <button type="button" class="fallback-btn fallback-btn-secondary action-retry">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            \u91CD\u65B0\u5C1D\u8BD5
          </button>
          <button type="button" class="fallback-btn fallback-btn-ghost action-copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            \u590D\u5236\u94FE\u63A5
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
};

// src/components/InsertDialog.ts
var InsertDialog = class {
  static activeModal = null;
  static show(onConfirm) {
    this.close();
    const backdrop = document.createElement("div");
    backdrop.className = "edgeever-web-modal-backdrop";
    backdrop.innerHTML = `
      <div class="edgeever-web-modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="font-weight:700;font-size:14px;color:#f8fafc;display:flex;align-items:center;gap:6px;">
            \u{1F310} \u63D2\u5165\u771F\u5B9E\u6D4F\u89C8\u5668\u89C6\u7A97 (Web Embed)
          </span>
          <button type="button" class="edgeever-web-modal-close" style="background:none;border:none;color:#94a3b8;font-size:17px;cursor:pointer;padding:0 4px;">\u2715</button>
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:11.5px;color:#94a3b8;margin-bottom:5px;">\u76EE\u6807\u7F51\u9875\u5730\u5740 (URL)</label>
          <input type="text" class="edgeever-web-input-url" placeholder="https://github.com" style="width:100%;box-sizing:border-box;padding:8px 10px;background:#0f172a;border:1px solid rgba(255,255,255,0.16);border-radius:6px;color:#f8fafc;font-size:13px;outline:none;" />
        </div>

        <div style="font-size:11px;color:#94a3b8;margin-bottom:16px;line-height:1.5;">
          \u{1F4A1} \u63D0\u793A\uFF1A\u6309\u56DE\u8F66\u5373\u53EF\u63D2\u5165\u3002\u53EF\u5728\u7B14\u8BB0\u4EFB\u610F\u4F4D\u7F6E\u968F\u65F6\u8F93\u5165 <code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;">/web</code> \u6216\u6309 <code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;">Alt+W</code> \u5524\u51FA\u6B64\u5F39\u7A97\u3002
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="edgeever-web-modal-cancel" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:5px;color:#e2e8f0;font-size:12px;cursor:pointer;">\u53D6\u6D88</button>
          <button type="button" class="edgeever-web-modal-confirm" style="padding:6px 16px;background:#38bdf8;border:none;border-radius:5px;color:#0f172a;font-size:12px;font-weight:600;cursor:pointer;">\u7ACB\u5373\u63D2\u5165</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    this.activeModal = backdrop;
    const input = backdrop.querySelector(".edgeever-web-input-url");
    const closeBtn = backdrop.querySelector(".edgeever-web-modal-close");
    const cancelBtn = backdrop.querySelector(".edgeever-web-modal-cancel");
    const confirmBtn = backdrop.querySelector(".edgeever-web-modal-confirm");
    if (navigator.clipboard?.readText && input) {
      navigator.clipboard.readText().then((clip) => {
        if (clip && /^https?:\/\//i.test(clip.trim())) {
          input.value = clip.trim();
          input.select();
        }
      }).catch(() => {
      });
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
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        this.close();
      }
    });
  }
  static close() {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }
  }
};

// src/index.ts
var pluginContext = null;
var injectedStyleEl = null;
function ensureInjectedStyle() {
  if (document.getElementById("edgeever-web-companion-injected-style")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "edgeever-web-companion-injected-style";
  style.textContent = `
    .edgeever-web-embed-block {
      display: block !important;
      width: 100% !important;
      margin: 18px 0 !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 10px !important;
      background: #0f1217 !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45) !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
      user-select: none !important;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, width 0.2s ease, margin 0.2s ease !important;
      position: relative !important;
    }
    .edgeever-web-embed-block:hover {
      border-color: rgba(56, 189, 248, 0.3) !important;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55) !important;
    }
    .edgeever-web-embed-block.is-resizing {
      user-select: none !important;
    }
    .edgeever-web-embed-block.is-resizing iframe,
    .edgeever-web-embed-block.is-resizing webview {
      pointer-events: none !important;
    }
    .edgeever-web-embed-bar {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      height: 38px !important;
      padding: 0 12px !important;
      background: rgba(22, 27, 34, 0.96) !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
      gap: 10px !important;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif !important;
      box-sizing: border-box !important;
    }
    .edgeever-web-mac-controls {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      flex-shrink: 0 !important;
    }
    .edgeever-web-dot {
      width: 9px !important;
      height: 9px !important;
      border-radius: 50% !important;
      display: inline-block !important;
      opacity: 0.8 !important;
    }
    .edgeever-web-dot.red { background: #ff5f56 !important; }
    .edgeever-web-dot.yellow { background: #ffbd2e !important; }
    .edgeever-web-dot.green { background: #27c93f !important; }
    .edgeever-web-nav-group {
      display: flex !important;
      align-items: center !important;
      gap: 2px !important;
      flex-shrink: 0 !important;
    }
    .edgeever-web-btn-nav {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 24px !important;
      height: 24px !important;
      border-radius: 4px !important;
      border: none !important;
      background: transparent !important;
      color: #94a3b8 !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
    }
    .edgeever-web-btn-nav:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: #f8fafc !important;
    }
    .edgeever-web-btn-nav.is-loading {
      animation: edgeever-web-spin 1s linear infinite !important;
      color: #38bdf8 !important;
    }
    @keyframes edgeever-web-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .edgeever-web-omnibox-wrap {
      flex: 1 !important;
      max-width: 640px !important;
      min-width: 180px !important;
      display: flex !important;
      align-items: center !important;
      background: rgba(0, 0, 0, 0.35) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 6px !important;
      padding: 2px 8px !important;
      transition: all 0.2s ease !important;
      gap: 6px !important;
    }
    .edgeever-web-omnibox-wrap:focus-within {
      border-color: #38bdf8 !important;
      background: rgba(0, 0, 0, 0.55) !important;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2) !important;
    }
    .edgeever-web-lock-icon {
      font-size: 11px !important;
      color: #38bdf8 !important;
      opacity: 0.85 !important;
      flex-shrink: 0 !important;
    }
    .edgeever-web-omnibox-input {
      flex: 1 !important;
      min-width: 0 !important;
      background: transparent !important;
      border: none !important;
      outline: none !important;
      font-size: 12px !important;
      color: #e2e8f0 !important;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif !important;
      padding: 2px 0 !important;
    }
    .edgeever-web-embed-actions {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 4px !important;
      flex-shrink: 0 !important;
    }
    .edgeever-web-btn-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
      height: 24px !important;
      padding: 0 7px !important;
      background: transparent !important;
      border: 1px solid transparent !important;
      border-radius: 4px !important;
      color: #94a3b8 !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
    }
    .edgeever-web-btn-icon:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #f8fafc !important;
    }
    .edgeever-web-resize-handle {
      height: 12px !important;
      background: #11141a !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: row-resize !important;
      border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
      transition: background 0.15s ease !important;
    }
    .edgeever-web-resize-handle:hover {
      background: #1e2430 !important;
    }
    .edgeever-web-resize-bar {
      width: 36px !important;
      height: 3px !important;
      border-radius: 2px !important;
      background: rgba(255, 255, 255, 0.22) !important;
    }
    .edgeever-web-fallback-card {
      position: absolute !important;
      inset: 0 !important;
      background: radial-gradient(circle at 50% 30%, #171d29 0%, #0c0f14 100%) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 24px !important;
      box-sizing: border-box !important;
      z-index: 50 !important;
    }
    .edgeever-web-fallback-inner {
      max-width: 480px !important;
      width: 100% !important;
      background: rgba(22, 27, 34, 0.85) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      border-radius: 12px !important;
      padding: 24px !important;
      text-align: center !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6) !important;
      backdrop-filter: blur(20px) !important;
    }
    .edgeever-web-fallback-badge {
      display: inline-block !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      padding: 2px 8px !important;
      border-radius: 12px !important;
      border: 1px solid !important;
      margin-bottom: 12px !important;
      text-transform: uppercase !important;
    }
    .edgeever-web-fallback-icon {
      font-size: 32px !important;
      margin-bottom: 8px !important;
    }
    .edgeever-web-fallback-title {
      font-size: 16px !important;
      font-weight: 700 !important;
      color: #f8fafc !important;
      margin: 0 0 8px 0 !important;
    }
    .edgeever-web-fallback-desc {
      font-size: 13px !important;
      color: #94a3b8 !important;
      line-height: 1.5 !important;
      margin: 0 0 16px 0 !important;
    }
    .edgeever-web-fallback-url-preview {
      background: rgba(0, 0, 0, 0.35) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 6px !important;
      padding: 6px 10px !important;
      font-size: 11px !important;
      color: #cbd5e1 !important;
      word-break: break-all !important;
      margin-bottom: 18px !important;
      display: flex !important;
      gap: 6px !important;
      align-items: center !important;
      text-align: left !important;
    }
    .edgeever-web-fallback-url-preview .url-label {
      color: #64748b !important;
      flex-shrink: 0 !important;
    }
    .edgeever-web-fallback-actions {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
      justify-content: center !important;
    }
    .fallback-btn {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 7px 14px !important;
      border-radius: 6px !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      border: 1px solid transparent !important;
      transition: all 0.15s ease !important;
    }
    .fallback-btn-primary {
      background: #38bdf8 !important;
      color: #0f172a !important;
      font-weight: 600 !important;
    }
    .fallback-btn-primary:hover {
      background: #7dd3fc !important;
    }
    .fallback-btn-secondary {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #e2e8f0 !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
    }
    .fallback-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.14) !important;
    }
    .fallback-btn-ghost {
      background: transparent !important;
      color: #94a3b8 !important;
    }
    .fallback-btn-ghost:hover {
      color: #f8fafc !important;
    }
    .edgeever-web-modal-backdrop {
      position: fixed !important;
      inset: 0 !important;
      background: rgba(0, 0, 0, 0.65) !important;
      backdrop-filter: blur(6px) !important;
      z-index: 99999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .edgeever-web-modal {
      width: 440px !important;
      background: #161b22 !important;
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-radius: 10px !important;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7) !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      color: #f8fafc !important;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif !important;
    }
  `;
  document.head.appendChild(style);
  injectedStyleEl = style;
}
function mountBrowserCard(container, embedInput) {
  const currentAttrs = EmbedStore.parseAttrs(embedInput);
  const embedId = (embedInput && typeof embedInput === "object" ? embedInput.id : "") || "";
  let oldUrl = currentAttrs.url;
  const viewport = new WebViewport({
    initialHeight: currentAttrs.height,
    initialWidthMode: currentAttrs.widthMode,
    initialFullscreen: currentAttrs.fullscreen
  });
  const card = viewport.getCardElement();
  const contentArea = viewport.getContentArea();
  let fallbackCardInstance = null;
  const renderer = WebRendererFactory.createRenderer(
    currentAttrs.url,
    currentAttrs.title,
    {
      onStateChange: (state, detail) => {
        toolbar.setLoading(state === "LOADING" /* LOADING */);
        if (state === "FAILED" /* FAILED */ || state === "BLOCKED" /* BLOCKED */ || state === "CLOUDFLARE_REQUIRED" /* CLOUDFLARE_REQUIRED */) {
          if (fallbackCardInstance) {
            fallbackCardInstance.getElement().remove();
          }
          fallbackCardInstance = new FallbackCard({
            url: renderer.getURL(),
            state,
            detail,
            onRetry: () => {
              if (fallbackCardInstance) {
                fallbackCardInstance.getElement().remove();
                fallbackCardInstance = null;
              }
              renderer.reload();
            },
            onOpenExternal: () => {
              window.open(renderer.getURL(), "_blank");
            },
            onCopyUrl: () => {
              navigator.clipboard?.writeText(renderer.getURL());
            }
          });
          contentArea.appendChild(fallbackCardInstance.getElement());
        } else if (state === "SUCCESS" /* SUCCESS */) {
          if (fallbackCardInstance) {
            fallbackCardInstance.getElement().remove();
            fallbackCardInstance = null;
          }
        }
      },
      onUrlChange: (newUrl) => {
        toolbar.updateUrl(newUrl);
        currentAttrs.url = newUrl;
        currentAttrs.title = renderer.getTitle() || extractHostname(newUrl, "Web View");
        EmbedStore.updateEmbedAttributesInDoc(pluginContext, embedId, oldUrl, currentAttrs);
        oldUrl = newUrl;
      },
      onTitleChange: (newTitle) => {
        currentAttrs.title = newTitle;
        EmbedStore.updateEmbedAttributesInDoc(pluginContext, embedId, oldUrl, currentAttrs);
      }
    },
    currentAttrs.engine,
    pluginContext?.network?.fetch
  );
  const toolbar = new WebToolbar({
    initialUrl: currentAttrs.url,
    initialWidthMode: currentAttrs.widthMode,
    initialFullscreen: currentAttrs.fullscreen,
    onNavigate: (url) => {
      renderer.loadURL(url);
    },
    onReload: () => {
      renderer.reload();
    },
    onGoBack: () => {
      renderer.goBack();
    },
    onGoForward: () => {
      renderer.goForward();
    },
    onToggleWidthMode: () => {
      const nextMode = currentAttrs.widthMode === "editor" ? "normal" : "editor";
      currentAttrs.widthMode = nextMode;
      viewport.setWidthMode(nextMode);
      toolbar.updateWidthMode(nextMode);
      EmbedStore.updateEmbedAttributesInDoc(pluginContext, embedId, oldUrl, currentAttrs);
    },
    onToggleFullscreen: () => {
      const nextFs = !currentAttrs.fullscreen;
      currentAttrs.fullscreen = nextFs;
      viewport.setFullscreen(nextFs);
      toolbar.updateFullscreen(nextFs);
      EmbedStore.updateEmbedAttributesInDoc(pluginContext, embedId, oldUrl, currentAttrs);
    },
    onOpenExternal: () => {
      window.open(renderer.getURL(), "_blank");
    },
    onCopyUrl: () => {
      navigator.clipboard?.writeText(renderer.getURL());
    }
  });
  const resizeHandle = new ResizeHandle({
    initialHeight: currentAttrs.height,
    onHeightChange: (h) => {
      viewport.setHeight(h);
    },
    onResizeEnd: (h) => {
      currentAttrs.height = h;
      EmbedStore.updateEmbedAttributesInDoc(pluginContext, embedId, oldUrl, currentAttrs);
    },
    setMaskActive: (active) => {
      viewport.setMaskActive(active);
    }
  });
  card.insertBefore(toolbar.getElement(), contentArea);
  card.appendChild(resizeHandle.getElement());
  container.innerHTML = "";
  container.appendChild(card);
  renderer.mount(contentArea);
  window.setTimeout(() => {
    viewport.applyBreakoutLayout();
  }, 30);
  return () => {
    renderer.destroy();
    viewport.destroy();
    container.innerHTML = "";
  };
}
async function executeInsertWeb(targetUrl) {
  const domain = extractHostname(targetUrl, "Web View");
  const defaultAttrs = {
    url: targetUrl,
    title: domain,
    height: 720,
    fullscreen: false,
    engine: "auto",
    widthMode: "editor"
  };
  if (pluginContext?.editor?.insertEmbed) {
    try {
      await pluginContext.editor.insertEmbed({
        type: "web-view",
        resourceId: targetUrl,
        title: domain,
        data: defaultAttrs
      });
      return;
    } catch (err) {
      console.warn("[Web Companion] insertEmbed failed, fallback to editor instance:", err);
    }
  }
  const editor = pluginContext?.editor?.getInstance ? pluginContext.editor.getInstance() : null;
  if (editor?.commands?.insertContent) {
    try {
      const embedId = `embed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      editor.commands.insertContent({
        type: "edgeeverPluginEmbed",
        attrs: {
          id: embedId,
          pluginId: "org.edgeever.plugins.web-companion",
          type: "web-view",
          resourceId: targetUrl,
          title: domain,
          dataJson: JSON.stringify(defaultAttrs),
          attrs: defaultAttrs
        }
      });
      return;
    } catch (err) {
      console.warn("[Web Companion] insertContent failed:", err);
    }
  }
  const mdCode = `
\`\`\`edgeever-plugin-embed
${JSON.stringify({
    id: `embed_${Date.now()}`,
    pluginId: "org.edgeever.plugins.web-companion",
    type: "web-view",
    resourceId: targetUrl,
    title: domain,
    dataJson: JSON.stringify(defaultAttrs),
    attrs: defaultAttrs
  })}
\`\`\`
`;
  if (pluginContext?.editor?.insertAtCursor) {
    try {
      await pluginContext.editor.insertAtCursor(mdCode);
      return;
    } catch {
    }
  }
  try {
    document.execCommand("insertText", false, mdCode);
  } catch {
  }
}
function openInsertDialog() {
  InsertDialog.show((url) => {
    executeInsertWeb(url);
  });
}
function handleEditorKeyDown(e) {
  if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || !sel.anchorNode) return;
    const node = sel.anchorNode;
    const text = node.textContent || "";
    const offset = sel.anchorOffset;
    if (offset >= 4 && text.slice(offset - 4, offset).toLowerCase() === "/web") {
      const prefix = text.slice(0, offset - 4);
      const isAtStart = offset === 4 || /[\s\n]$/.test(prefix);
      if (isAtStart) {
        e.preventDefault();
        e.stopPropagation();
        try {
          const newRange = document.createRange();
          newRange.setStart(node, offset - 4);
          newRange.setEnd(node, offset);
          sel.removeAllRanges();
          sel.addRange(newRange);
          document.execCommand("delete");
        } catch {
        }
        openInsertDialog();
      }
    }
  }
}
function onGlobalKeydown(e) {
  if ((e.altKey || e.metaKey) && (e.key === "w" || e.key === "W") && !e.shiftKey && !e.ctrlKey) {
    const activeEl = document.activeElement;
    const isEditing = activeEl && ["INPUT", "TEXTAREA"].includes(activeEl.tagName);
    if (!isEditing || activeEl?.closest(".edgeever-web-modal")) {
      e.preventDefault();
      openInsertDialog();
    }
  }
}
var index_default = {
  activate(context) {
    pluginContext = context;
    ensureInjectedStyle();
    if (context.editor?.embeds?.register) {
      const rendererDef = {
        type: "web-view",
        title: "\u771F\u5B9E\u6D4F\u89C8\u5668\u89C6\u7A97 (Web Embed)",
        mount(container, data) {
          return mountBrowserCard(container, data);
        },
        render(container, data) {
          return mountBrowserCard(container, data);
        }
      };
      try {
        context.editor.embeds.register(rendererDef);
        console.log("[Web Companion] Registered 'web-view' electron renderer successfully.");
      } catch (err) {
        console.warn("[Web Companion] Register 'web-view' failed:", err);
      }
      try {
        context.editor.embeds.register({
          ...rendererDef,
          type: "web-companion"
        });
      } catch {
      }
    }
    document.addEventListener("keydown", handleEditorKeyDown, true);
    window.addEventListener("keydown", onGlobalKeydown, true);
    if (context.commands?.register) {
      context.commands.register({
        id: "web-insert-iframe",
        title: "Web Companion: /web \u63D2\u5165\u6D4F\u89C8\u5668\u89C6\u7A97 (Web Embed)",
        shortcut: "Alt-W",
        run: () => openInsertDialog(),
        execute: () => openInsertDialog()
      });
    }
    if (context.ui?.commands?.register) {
      context.ui.commands.register({
        id: "web-companion.insert",
        name: "Web Companion: /web \u63D2\u5165\u6D4F\u89C8\u5668\u89C6\u7A97",
        shortcut: "Alt+W",
        execute: () => openInsertDialog()
      });
    }
    console.log(
      "%c[EdgeEver Web Companion] v1.4.0 Loaded - Electron WebView Architecture Active",
      "background:#38bdf8;color:#000;font-weight:bold;padding:2px 6px;border-radius:3px;"
    );
  },
  deactivate() {
    document.removeEventListener("keydown", handleEditorKeyDown, true);
    window.removeEventListener("keydown", onGlobalKeydown, true);
    InsertDialog.close();
    if (injectedStyleEl) {
      injectedStyleEl.remove();
      injectedStyleEl = null;
    }
    console.log("[Web Companion] deactivated.");
  }
};
export {
  index_default as default
};
