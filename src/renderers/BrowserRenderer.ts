/**
 * BrowserRenderer 统一接口定义与基类
 */

import { IBrowserRenderer, RendererEvents, WebLoadState } from "../types";

export abstract class BaseBrowserRenderer implements IBrowserRenderer {
  protected _state: WebLoadState = WebLoadState.INIT;
  protected _currentUrl: string;
  protected _currentTitle: string;
  protected events: RendererEvents;
  protected container: HTMLElement | null = null;

  constructor(initialUrl: string, initialTitle: string, events: RendererEvents) {
    this._currentUrl = initialUrl;
    this._currentTitle = initialTitle;
    this.events = events;
  }

  public get state(): WebLoadState {
    return this._state;
  }

  public getURL(): string {
    return this._currentUrl;
  }

  public getTitle(): string {
    return this._currentTitle;
  }

  protected setState(nextState: WebLoadState, detail?: string): void {
    if (this._state !== nextState) {
      this._state = nextState;
      this.events.onStateChange(nextState, detail);
    }
  }

  protected setUrl(nextUrl: string): void {
    if (this._currentUrl !== nextUrl) {
      this._currentUrl = nextUrl;
      this.events.onUrlChange(nextUrl);
    }
  }

  protected setTitle(nextTitle: string): void {
    if (this._currentTitle !== nextTitle) {
      this._currentTitle = nextTitle;
      this.events.onTitleChange(nextTitle);
    }
  }

  public abstract mount(parent: HTMLElement): void;
  public abstract loadURL(url: string): void;
  public abstract reload(): void;
  public abstract goBack(): void;
  public abstract goForward(): void;
  public abstract canGoBack(): boolean;
  public abstract canGoForward(): boolean;
  public abstract destroy(): void;
}
