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
