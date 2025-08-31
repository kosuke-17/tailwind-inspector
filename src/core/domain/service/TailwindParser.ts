import { TailwindClass } from "../model/TailwindClass";
import { Result } from "../../shared/Result";
import { DomainError } from "../../shared/types";

/**
 * Tailwindクラス名の解析を担当するドメインサービス
 */
export class TailwindParser {
  /**
   * クラス名文字列をTailwindClassのリストに解析
   */
  parse(classAttribute: string): Result<TailwindClass[], DomainError> {
    try {
      const classes = TailwindClass.parse(classAttribute);
      return Result.success(classes);
    } catch (error) {
      return Result.failure(
        new DomainError(`Failed to parse Tailwind classes: ${error}`)
      );
    }
  }

  /**
   * クラスをカテゴリ別に分類
   */
  categorize(classes: TailwindClass[]): ClassificationMap {
    const result: ClassificationMap = {
      layout: [],
      spacing: [],
      colors: [],
      typography: [],
      effects: [],
      other: [],
    };

    for (const cls of classes) {
      const category = this.determineCategory(cls);
      result[category].push(cls);
    }

    return result;
  }

  /**
   * クラスのカテゴリを決定
   */
  private determineCategory(cls: TailwindClass): ClassificationCategory {
    const baseClass = cls.baseClass;

    // スペーシング
    if (cls.isMargin || cls.isPadding || baseClass.startsWith("gap-")) {
      return "spacing";
    }

    // タイポグラフィ（color判定の前に実行）
    if (
      baseClass.match(
        /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/
      ) ||
      baseClass.startsWith("font-") ||
      baseClass.startsWith("leading-") ||
      baseClass.startsWith("tracking-")
    ) {
      return "typography";
    }

    // 色
    if (cls.isColor || baseClass.startsWith("border-")) {
      return "colors";
    }

    // レイアウト
    if (
      baseClass.startsWith("flex") ||
      baseClass.startsWith("grid") ||
      baseClass.startsWith("block") ||
      baseClass.startsWith("inline") ||
      baseClass.startsWith("hidden") ||
      baseClass.startsWith("w-") ||
      baseClass.startsWith("h-") ||
      baseClass.startsWith("max-") ||
      baseClass.startsWith("min-")
    ) {
      return "layout";
    }

    // エフェクト
    if (
      baseClass.startsWith("shadow") ||
      baseClass.startsWith("opacity-") ||
      baseClass.startsWith("blur-") ||
      baseClass.startsWith("backdrop-")
    ) {
      return "effects";
    }

    return "other";
  }

  /**
   * Tailwind CSSが読み込まれているかを検出
   */
  detectTailwindAvailability(): boolean {
    try {
      // テスト要素を作成
      const testElement = document.createElement("div");
      testElement.className = "m-4 p-4 bg-red-500";
      testElement.style.position = "absolute";
      testElement.style.visibility = "hidden";
      testElement.style.pointerEvents = "none";

      document.body.appendChild(testElement);
      const computedStyle = getComputedStyle(testElement);

      // Tailwindの具体的な値をチェック
      const marginValue = parseFloat(computedStyle.marginTop);
      const paddingValue = parseFloat(computedStyle.paddingTop);
      const backgroundColor = computedStyle.backgroundColor;

      document.body.removeChild(testElement);

      // 厳密な条件: 16pxの値または特定の色が適用されている
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

export type ClassificationCategory =
  | "layout"
  | "spacing"
  | "colors"
  | "typography"
  | "effects"
  | "other";

export interface ClassificationMap {
  layout: TailwindClass[];
  spacing: TailwindClass[];
  colors: TailwindClass[];
  typography: TailwindClass[];
  effects: TailwindClass[];
  other: TailwindClass[];
}
