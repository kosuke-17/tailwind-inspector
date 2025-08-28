import { Sides } from "./types";

export const MIN_LABEL_THICKNESS = 12;
export const MAX_ELEMENTS = 300;
export const MAX_GAP_SEGMENTS = 600;
export const ROW_EPS = 6;
export const COL_EPS = 6;

export function toSides(cs: CSSStyleDeclaration, prop: string): Sides {
  return {
    t: parseFloat(cs[`${prop}Top` as keyof CSSStyleDeclaration] as string) || 0,
    r:
      parseFloat(cs[`${prop}Right` as keyof CSSStyleDeclaration] as string) ||
      0,
    b:
      parseFloat(cs[`${prop}Bottom` as keyof CSSStyleDeclaration] as string) ||
      0,
    l:
      parseFloat(cs[`${prop}Left` as keyof CSSStyleDeclaration] as string) || 0,
  };
}

export function extractTailwindClasses(className: string): string {
  if (!className) return "";
  return String(className)
    .split(/\s+/)
    .filter((c) => /^[a-z0-9:_\/-]+$/i.test(c))
    .join(" ");
}

export function toHex(color: string): string {
  if (!color) return "";
  if (color.startsWith("#")) return color;
  const m = color.match(
    /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\s*\)$/i
  );
  if (!m) return color;
  const r = clamp255(parseFloat(m[1]));
  const g = clamp255(parseFloat(m[2]));
  const b = clamp255(parseFloat(m[3]));
  const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
  const hex = `#${to2(r)}${to2(g)}${to2(b)}`;
  return a < 1 ? `${hex}${to2(Math.round(a * 255))}` : hex;
}

const to2 = (n: number): string => n.toString(16).padStart(2, "0");
const clamp255 = (n: number): number =>
  Math.max(0, Math.min(255, Math.round(n)));

export function escapeHTML(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => escapeMap[c as keyof typeof escapeMap] || c
  );
}

const escapeMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
} as const;

export function groupBy<T>(
  items: T[],
  closeFn: (a: T, b: T) => boolean
): T[][] {
  const groups: T[][] = [];
  const sorted = items.slice();
  for (const it of sorted) {
    let found = false;
    for (const g of groups) {
      if (closeFn(g[0], it)) {
        g.push(it);
        found = true;
        break;
      }
    }
    if (!found) groups.push([it]);
  }
  return groups;
}

export function createToast(text: string): void {
  const n = document.createElement("div");
  Object.assign(n.style, {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    transform: "translateY(-64px)",
    background: "rgba(0,0,0,0.8)",
    color: "#fff",
    padding: "8px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    zIndex: "2147483647",
  });
  n.textContent = text;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 1400);
}

// Chrome Extension Storage API ユーティリティ
interface InspectorSettings {
  enabled: boolean;
  inspectorMode: boolean;
  legendVisible: boolean;
}

// Background Script との通信が可能かチェック
export function isExtensionContext(): boolean {
  return typeof chrome !== "undefined" && chrome.runtime && !!chrome.runtime.id;
}

// 設定を取得（Fallback付き）
export async function getSettings(): Promise<InspectorSettings> {
  if (isExtensionContext()) {
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
      if (response?.success) {
        return response.data;
      }
    } catch (error) {
      console.warn("Failed to get settings from background:", error);
    }
  }

  // Fallback: localStorage を使用
  return {
    enabled: localStorage.getItem("ti-enabled") === "true",
    inspectorMode: localStorage.getItem("ti-inspector") === "true",
    legendVisible: localStorage.getItem("ti-legend-visible") !== "false",
  };
}

// 設定を保存（Fallback付き）
export async function saveSetting(key: keyof InspectorSettings, value: boolean): Promise<void> {
  if (isExtensionContext()) {
    try {
      await chrome.runtime.sendMessage({
        type: "UPDATE_SETTING",
        data: { key, value },
      });
      return;
    } catch (error) {
      console.warn("Failed to save setting to background:", error);
    }
  }

  // Fallback: localStorage を使用
  const storageKey = key === "enabled" ? "ti-enabled" : 
                   key === "inspectorMode" ? "ti-inspector" : 
                   "ti-legend-visible";
  localStorage.setItem(storageKey, String(value));
}

// 設定変更リスナーを追加
export function addSettingsChangeListener(
  callback: (settings: Partial<InspectorSettings>) => void
): () => void {
  if (isExtensionContext()) {
    const messageListener = (
      message: any,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: any) => void
    ) => {
      if (message.type === "SETTINGS_CHANGED") {
        const changes: Partial<InspectorSettings> = {};
        for (const [key, change] of Object.entries(message.data)) {
          if (change && typeof change === "object" && "newValue" in change) {
            (changes as any)[key] = change.newValue;
          }
        }
        callback(changes);
      } else if (message.type === "TOGGLE_INSPECTOR") {
        callback({ enabled: message.data.enabled });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }
  
  // Extension context でない場合は何もしない
  return () => {};
}

// Gap セグメント計算用の関数
export function calculateGapSegments(
  containerEl: Element,
  containerRect: DOMRect,
  rowGap: number,
  columnGap: number,
  maxSegments: number = MAX_GAP_SEGMENTS
): Array<{
  top: number;
  left: number;
  width: number;
  height: number;
  value: number;
  orientation: "h" | "v";
}> {
  const segments: Array<{
    top: number;
    left: number;
    width: number;
    height: number;
    value: number;
    orientation: "h" | "v";
  }> = [];

  if (rowGap <= 0 && columnGap <= 0) return segments;

  // 直接の子のみを取得
  const children = Array.from(containerEl.children).filter(
    (child) =>
      child instanceof HTMLElement &&
      child.getBoundingClientRect().width > 0 &&
      child.getBoundingClientRect().height > 0
  );

  if (children.length <= 1) return segments;

  // 子要素の位置情報を取得
  const rects = children.map((el) => el.getBoundingClientRect());
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // 横方向ギャップ（列間）
  if (columnGap > 0) {
    // 行でグルーピング（topが近いものを同一行とみなす）
    const rows = groupBy(rects, (a, b) => Math.abs(a.top - b.top) <= ROW_EPS);
    
    for (const row of rows) {
      const sorted = row.sort((a, b) => a.left - b.left);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (segments.length >= maxSegments) return segments;
        
        const a = sorted[i];
        const b = sorted[i + 1];
        
        // ギャップ帯の位置計算
        const xMid = (a.right + b.left) / 2;
        const x = xMid - columnGap / 2;
        const y = Math.min(a.top, b.top);
        const h = Math.max(a.bottom, b.bottom) - y;
        
        segments.push({
          top: y + scrollY,
          left: x + scrollX,
          width: columnGap,
          height: h,
          value: columnGap,
          orientation: "v",
        });
      }
    }
  }

  // 縦方向ギャップ（行間）
  if (rowGap > 0) {
    // 列でグルーピング（leftが近いものを同一列とみなす）
    const cols = groupBy(rects, (a, b) => Math.abs(a.left - b.left) <= COL_EPS);
    
    for (const col of cols) {
      const sorted = col.sort((a, b) => a.top - b.top);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (segments.length >= maxSegments) return segments;
        
        const a = sorted[i];
        const b = sorted[i + 1];
        
        const yMid = (a.bottom + b.top) / 2;
        const y = yMid - rowGap / 2;
        
        // 横幅は重なり部分、重ならない場合はコンテナ幅
        let x = Math.max(a.left, b.left);
        let w = Math.min(a.right, b.right) - x;
        if (w <= 0) {
          x = containerRect.left;
          w = containerRect.width;
        }
        
        segments.push({
          top: y + scrollY,
          left: x + scrollX,
          width: w,
          height: rowGap,
          value: rowGap,
          orientation: "h",
        });
      }
    }
  }

  return segments;
}
