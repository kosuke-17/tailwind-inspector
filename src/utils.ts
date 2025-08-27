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
