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
    lbl.textContent = `${Math.round(valuePx)}px`;
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
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, delay);
    }
  };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
