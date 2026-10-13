/**
 * URL 规范化与安全处理工具
 */

export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== "string") {
    return "about:blank";
  }

  let trimmed = input.trim();
  if (!trimmed) {
    return "about:blank";
  }

  // 若无协议前缀，默认补全 https://
  if (!/^https?:\/\//i.test(trimmed) && !/^about:/i.test(trimmed) && !/^file:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }

  return trimmed;
}

export function extractHostname(url: string, fallback = "Web View"): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname || fallback;
  } catch {
    return fallback;
  }
}

/**
 * 判定是否属于全局开启了强防嵌限制 (X-Frame-Options: DENY / frame-ancestors: 'none') 的知名网站
 */
export function isKnownFrameDeniedHost(url: string): boolean {
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
      "www.notion.so",
    ];
    return deniedList.some((denied) => host === denied || host.endsWith("." + denied));
  } catch {
    return false;
  }
}
