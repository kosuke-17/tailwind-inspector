import { TailwindClass } from "../model/TailwindClass";
import { Sides } from "../model/ElementMetrics";

/**
 * 既存のユーティリティ関数との互換性を保つサービス
 * 段階的移行のためのブリッジ
 */
export class LegacyFallbackService {
  /**
   * 既存のextractTailwindClasses関数の代替
   */
  static extractTailwindClasses(className: string): string {
    if (!className) return "";

    const classes = TailwindClass.parse(className);
    return classes.map((cls) => cls.toString()).join(" ");
  }

  /**
   * 既存のtoSides関数の代替
   */
  static toSides(cs: CSSStyleDeclaration, prop: string): Sides {
    return {
      t:
        parseFloat(cs[`${prop}Top` as keyof CSSStyleDeclaration] as string) ||
        0,
      r:
        parseFloat(cs[`${prop}Right` as keyof CSSStyleDeclaration] as string) ||
        0,
      b:
        parseFloat(
          cs[`${prop}Bottom` as keyof CSSStyleDeclaration] as string
        ) || 0,
      l:
        parseFloat(cs[`${prop}Left` as keyof CSSStyleDeclaration] as string) ||
        0,
    };
  }

  /**
   * Tailwind CSSフォールバック値の取得
   */
  static getTailwindFallbackValues(className: string): {
    margin: Sides;
    padding: Sides;
  } {
    const classes = TailwindClass.parse(className);
    let marginValue = 0;
    let paddingValue = 0;

    for (const cls of classes) {
      if (cls.isMargin) {
        marginValue = cls.extractNumericValue();
      }
      if (cls.isPadding) {
        paddingValue = cls.extractNumericValue();
      }
    }

    return {
      margin: {
        t: marginValue,
        r: marginValue,
        b: marginValue,
        l: marginValue,
      },
      padding: {
        t: paddingValue,
        r: paddingValue,
        b: paddingValue,
        l: paddingValue,
      },
    };
  }

  /**
   * Tailwind CSS利用可能性の検出
   */
  static detectTailwindCSS(): boolean {
    try {
      const testElement = document.createElement("div");
      testElement.className = "m-4 p-4 bg-red-500";
      testElement.style.position = "absolute";
      testElement.style.visibility = "hidden";
      testElement.style.pointerEvents = "none";

      document.body.appendChild(testElement);
      const computedStyle = getComputedStyle(testElement);

      const marginValue = parseFloat(computedStyle.marginTop);
      const paddingValue = parseFloat(computedStyle.paddingTop);
      const backgroundColor = computedStyle.backgroundColor;

      document.body.removeChild(testElement);

      const hasCorrectMargin = marginValue === 16;
      const hasCorrectPadding = paddingValue === 16;
      const hasRedBackground =
        backgroundColor.includes("rgb(239, 68, 68)") ||
        backgroundColor.includes("rgb(220, 38, 38)") ||
        backgroundColor.includes("#ef4444") ||
        backgroundColor.includes("#dc2626");

      return hasCorrectMargin || hasCorrectPadding || hasRedBackground;
    } catch {
      return false;
    }
  }
}
