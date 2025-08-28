import { Sides } from "./types";

export const MIN_LABEL_THICKNESS = 4; // 4pxのmarginでもラベルを表示
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

/**
 * Tailwind CSSが読み込まれているかどうかを検出
 */
export function detectTailwindCSS(): boolean {
  try {
    // 既知のTailwindクラスでテスト要素を作成
    const testElement = document.createElement("div");
    testElement.className = "m-4 p-4 bg-red-500";
    testElement.style.position = "absolute";
    testElement.style.visibility = "hidden";
    testElement.style.pointerEvents = "none";

    document.body.appendChild(testElement);
    const computedStyle = getComputedStyle(testElement);

    // Tailwindの具体的な値をチェック: margin: 1rem (16px), padding: 1rem (16px)
    const marginValue = parseFloat(computedStyle.marginTop);
    const paddingValue = parseFloat(computedStyle.paddingTop);
    const backgroundColor = computedStyle.backgroundColor;

    document.body.removeChild(testElement);

    // より厳密な条件: 16pxの値またはred色が確実に適用されている
    const hasCorrectMargin = marginValue === 16;
    const hasCorrectPadding = paddingValue === 16;
    const hasRedBackground =
      backgroundColor.includes("rgb(239, 68, 68)") || // bg-red-500
      backgroundColor.includes("rgb(220, 38, 38)") ||
      backgroundColor.includes("#ef4444") ||
      backgroundColor.includes("#dc2626");

    return hasCorrectMargin || hasCorrectPadding || hasRedBackground;
  } catch {
    return false;
  }
}

/**
 * Tailwind CSSが読み込まれていない場合のフォールバック値マッピング
 */
const TAILWIND_FALLBACK_MAP: Record<
  string,
  { margin?: number; padding?: number }
> = {
  // Margin classes
  "m-0": { margin: 0 },
  "m-1": { margin: 4 },
  "m-2": { margin: 8 },
  "m-3": { margin: 12 },
  "m-4": { margin: 16 },
  "m-5": { margin: 20 },
  "m-6": { margin: 24 },
  "m-8": { margin: 32 },
  "m-10": { margin: 40 },
  "m-12": { margin: 48 },
  "m-16": { margin: 64 },
  "m-20": { margin: 80 },
  "m-24": { margin: 96 },
  "m-32": { margin: 128 },

  // Padding classes
  "p-0": { padding: 0 },
  "p-1": { padding: 4 },
  "p-2": { padding: 8 },
  "p-3": { padding: 12 },
  "p-4": { padding: 16 },
  "p-5": { padding: 20 },
  "p-6": { padding: 24 },
  "p-8": { padding: 32 },
  "p-10": { padding: 40 },
  "p-12": { padding: 48 },
  "p-16": { padding: 64 },
  "p-20": { padding: 80 },
  "p-24": { padding: 96 },
  "p-32": { padding: 128 },
};

/**
 * TailwindクラスからCSSが適用されていない場合の推定値を取得
 */
export function getTailwindFallbackValues(className: string): {
  margin: Sides;
  padding: Sides;
} {
  const classes = extractTailwindClasses(className).split(/\s+/);
  let marginValue = 0;
  let paddingValue = 0;

  for (const cls of classes) {
    // Remove responsive and state prefixes (e.g., "sm:", "hover:")
    const baseClass = cls.replace(/^[a-z]+:/, "");
    const fallback = TAILWIND_FALLBACK_MAP[baseClass];

    if (fallback) {
      if (fallback.margin !== undefined) {
        marginValue = fallback.margin;
      }
      if (fallback.padding !== undefined) {
        paddingValue = fallback.padding;
      }
    }
  }

  return {
    margin: { t: marginValue, r: marginValue, b: marginValue, l: marginValue },
    padding: {
      t: paddingValue,
      r: paddingValue,
      b: paddingValue,
      l: paddingValue,
    },
  };
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

export function createSegmentWithLabel(
  top: number,
  left: number,
  width: number,
  height: number,
  color: string,
  valuePx: number,
  orientation: "h" | "v"
): HTMLDivElement {
  if (width <= 0 || height <= 0) {
    const d = document.createElement("div");
    d.style.display = "none";
    return d;
  }

  const d = document.createElement("div");
  Object.assign(d.style, {
    position: "absolute",
    pointerEvents: "none",
    zIndex: "2147483647",
    backgroundColor: color,
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
  });

  if (valuePx >= MIN_LABEL_THICKNESS) {
    const lbl = document.createElement("div");
    lbl.className = "ti-seg-label" + (orientation === "v" ? " v" : "");
    Object.assign(lbl.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      color: "#fff",
      fontSize: "10px",
      fontWeight: "500",
      textShadow: "0 0 2px rgba(0,0,0,0.8)",
      whiteSpace: "nowrap",
      writingMode: orientation === "v" ? "vertical-lr" : "initial",
    });
    lbl.textContent = `${Math.round(valuePx)}`;
    d.appendChild(lbl);
  }
  return d;
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

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), delay);
    }
  };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
