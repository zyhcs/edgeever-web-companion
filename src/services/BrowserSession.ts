/**
 * BrowserSession - 浏览器会话与数据持久化管理服务
 */

export class BrowserSession {
  /**
   * 默认持久化 Partition 名称
   * 确保用户在嵌入视窗中的 Cookie、LocalStorage、SessionStorage 与登录态在跨会话中完全持久保存
   */
  public static readonly DEFAULT_PARTITION = "persist:edgeever-web";

  public static getPartition(): string {
    return this.DEFAULT_PARTITION;
  }
}
