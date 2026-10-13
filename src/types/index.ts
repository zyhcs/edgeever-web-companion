/**
 * EdgeEver Web Companion - 核心类型定义
 * 严格遵循 TypeScript strict 规范，杜绝 any
 */

export enum WebLoadState {
  INIT = "INIT",
  LOADING = "LOADING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  BLOCKED = "BLOCKED",
  CLOUDFLARE_REQUIRED = "CLOUDFLARE_REQUIRED",
}

export type RendererEngine = "auto" | "electron" | "iframe";
export type WidthMode = "editor" | "wide" | "normal";

export interface WebEmbedAttrs {
  url: string;
  title: string;
  height: number;
  fullscreen: boolean;
  engine: RendererEngine;
  widthMode: WidthMode;
}

export interface EmbedDataPayload {
  url?: string;
  title?: string;
  height?: number;
  fullscreen?: boolean;
  engine?: RendererEngine;
  widthMode?: WidthMode;
}

export interface EdgeEverEmbedObject {
  id?: string;
  type?: string;
  resourceId?: string;
  title?: string;
  data?: EmbedDataPayload;
  dataJson?: string;
  attrs?: Partial<WebEmbedAttrs>;
}

export type EmbedInput = string | EdgeEverEmbedObject | null | undefined;

export interface RendererEvents {
  onStateChange: (state: WebLoadState, detail?: string) => void;
  onUrlChange: (url: string) => void;
  onTitleChange: (title: string) => void;
}

export interface IBrowserRenderer {
  readonly state: WebLoadState;
  mount(parent: HTMLElement): void;
  loadURL(url: string): void;
  reload(): void;
  goBack(): void;
  goForward(): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  getURL(): string;
  getTitle(): string;
  destroy(): void;
}

/**
 * Electron WebView DOM 元素接口扩展声明
 */
export interface ElectronWebViewElement extends HTMLElement {
  src: string;
  partition?: string;
  allowpopups?: string | boolean;
  preload?: string;
  loadURL(url: string): Promise<void> | void;
  reload(): void;
  goBack(): void;
  goForward(): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  getURL(): string;
  getTitle(): string;
  isLoading(): boolean;
  stop(): void;
  executeJavaScript(code: string): Promise<unknown>;
}

/**
 * EdgeEver 插件上下文接口声明
 */
export interface PluginEditorCommands {
  insertContent?(content: unknown): void;
  command?(fn: (params: { tr: unknown }) => boolean): void;
}

export interface PluginEditorInstance {
  commands?: PluginEditorCommands;
  state?: {
    doc?: {
      descendants(callback: (node: { type?: { name?: string }; attrs?: Record<string, unknown> }, pos: number) => boolean | void): void;
    };
  };
}

export interface EdgeEverPluginContext {
  editor?: {
    embeds?: {
      register(def: {
        type: string;
        title?: string;
        mount?(container: HTMLElement, data: unknown): (() => void) | void;
        render?(container: HTMLElement, data: unknown): (() => void) | void;
      }): void;
    };
    insertEmbed?(payload: {
      type: string;
      resourceId: string;
      title: string;
      data: EmbedDataPayload;
    }): Promise<void>;
    insertAtCursor?(text: string): Promise<void>;
    editMarkdown?(mutator: (content: string) => string): Promise<void>;
    getInstance?(): PluginEditorInstance;
  };
  commands?: {
    register(def: {
      id: string;
      title: string;
      shortcut?: string;
      run?: () => void;
      execute?: () => void;
    }): void;
  };
  ui?: {
    commands?: {
      register(def: {
        id: string;
        name: string;
        shortcut?: string;
        execute?: () => void;
      }): void;
    };
  };
}
