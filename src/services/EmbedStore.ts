/**
 * EmbedStore - 负责规范化读取与持久化回写笔记中的嵌入状态
 */

import {
  EdgeEverEmbedObject,
  EdgeEverPluginContext,
  EmbedInput,
  WebEmbedAttrs,
} from "../types";
import { sanitizeUrl, extractHostname } from "../utils/url";

export class EmbedStore {
  /**
   * 将输入的各种不规则数据归一化为标准的 WebEmbedAttrs
   */
  public static parseAttrs(input: EmbedInput): WebEmbedAttrs {
    let rawUrl = "";
    let rawTitle = "";
    let rawHeight = 720;
    let rawFullscreen = false;
    let rawEngine: WebEmbedAttrs["engine"] = "auto";
    let rawWidthMode: WebEmbedAttrs["widthMode"] = "editor";

    if (typeof input === "string") {
      rawUrl = input;
    } else if (input && typeof input === "object") {
      const obj = input as EdgeEverEmbedObject;

      // 1. 优先读取规范化的 attrs
      if (obj.attrs) {
        if (obj.attrs.url) rawUrl = obj.attrs.url;
        if (obj.attrs.title) rawTitle = obj.attrs.title;
        if (typeof obj.attrs.height === "number") rawHeight = obj.attrs.height;
        if (typeof obj.attrs.fullscreen === "boolean") rawFullscreen = obj.attrs.fullscreen;
        if (obj.attrs.engine) rawEngine = obj.attrs.engine;
        if (obj.attrs.widthMode) rawWidthMode = obj.attrs.widthMode;
      }

      // 2. 兼容读取 data
      if (obj.data) {
        if (!rawUrl && obj.data.url) rawUrl = obj.data.url;
        if (!rawTitle && obj.data.title) rawTitle = obj.data.title;
        if (obj.data.height) rawHeight = obj.data.height;
        if (typeof obj.data.fullscreen === "boolean") rawFullscreen = obj.data.fullscreen;
        if (obj.data.engine) rawEngine = obj.data.engine;
        if (obj.data.widthMode) rawWidthMode = obj.data.widthMode;
      }

      // 3. 兼容读取 dataJson 序列化字符串
      if (obj.dataJson) {
        try {
          const parsed = JSON.parse(obj.dataJson) as Record<string, unknown>;
          if (!rawUrl && typeof parsed.url === "string") rawUrl = parsed.url;
          if (!rawTitle && typeof parsed.title === "string") rawTitle = parsed.title;
          if (typeof parsed.height === "number") rawHeight = parsed.height;
          if (typeof parsed.fullscreen === "boolean") rawFullscreen = parsed.fullscreen;
          if (typeof parsed.engine === "string") rawEngine = parsed.engine as WebEmbedAttrs["engine"];
          if (typeof parsed.widthMode === "string") rawWidthMode = parsed.widthMode as WebEmbedAttrs["widthMode"];
        } catch {
          // 容错忽略
        }
      }

      // 4. 兼容根级 resourceId 与 title
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
      widthMode: rawWidthMode || "editor",
    };
  }

  /**
   * 将修改后的 attrs 双向持久化回写至 EdgeEver 笔记文档中
   */
  public static updateEmbedAttributesInDoc(
    context: EdgeEverPluginContext | null,
    embedId: string,
    oldUrl: string,
    updatedAttrs: WebEmbedAttrs
  ): void {
    if (!context) return;

    const dataPayload = {
      url: updatedAttrs.url,
      title: updatedAttrs.title,
      height: updatedAttrs.height,
      fullscreen: updatedAttrs.fullscreen,
      engine: updatedAttrs.engine,
      widthMode: updatedAttrs.widthMode,
    };
    const dataJson = JSON.stringify(dataPayload);

    // 方案 A：使用 Tiptap 命令式遍历并更新 node attrs
    const editor = context.editor?.getInstance ? context.editor.getInstance() : null;
    let updatedInTiptap = false;

    if (editor?.state?.doc && editor?.commands?.command) {
      try {
        editor.state.doc.descendants((node, pos) => {
          if (
            (node.type?.name === "edgeeverPluginEmbed" ||
              node.type?.name === "edgeeverEmbed" ||
              node.type?.name === "web-view") &&
            (node.attrs?.id === embedId ||
              node.attrs?.resourceId === oldUrl ||
              node.attrs?.url === oldUrl)
          ) {
            editor.commands?.command?.(({ tr }) => {
              const trAny = tr as {
                setNodeMarkup: (p: number, type: unknown, attrs: Record<string, unknown>) => void;
              };
              trAny.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                title: updatedAttrs.title,
                resourceId: updatedAttrs.url,
                url: updatedAttrs.url,
                data: dataPayload,
                dataJson: dataJson,
                attrs: updatedAttrs,
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

    // 方案 B：在 Markdown 模式下通过 editMarkdown 正则替换
    if (!updatedInTiptap && context.editor?.editMarkdown) {
      context.editor
        .editMarkdown((md: string) => {
          return md.replace(
            /```edgeever-plugin-embed\n([\s\S]*?)\n```/g,
            (fullMatch: string, jsonStr: string) => {
              try {
                const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
                if (parsed.id === embedId || parsed.resourceId === oldUrl) {
                  parsed.title = updatedAttrs.title;
                  parsed.resourceId = updatedAttrs.url;
                  parsed.data = dataPayload;
                  parsed.dataJson = dataJson;
                  parsed.attrs = updatedAttrs;
                  return `\`\`\`edgeever-plugin-embed\n${JSON.stringify(parsed)}\n\`\`\``;
                }
              } catch {
                // 忽略解析错误
              }
              return fullMatch;
            }
          );
        })
        .catch(() => {});
    }
  }
}
