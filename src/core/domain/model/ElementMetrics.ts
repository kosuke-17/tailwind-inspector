import { ValueObject } from "../../shared/ValueObject";

/**
 * 要素のサイズと位置情報を表現する値オブジェクト
 */
export interface Sides {
  t: number;
  r: number;
  b: number;
  l: number;
}

export interface BoxModel {
  content: DOMRect;
  padding: Sides;
  margin: Sides;
  border: Sides;
}

export class ElementMetrics extends ValueObject<{
  bounds: DOMRect;
  computedStyle: CSSStyleDeclaration;
}> {
  constructor(bounds: DOMRect, computedStyle: CSSStyleDeclaration) {
    super({ bounds, computedStyle });
  }

  protected validate(value: {
    bounds: DOMRect;
    computedStyle: CSSStyleDeclaration;
  }): void {
    if (!value.bounds || !value.computedStyle) {
      throw new Error("ElementMetrics requires both bounds and computedStyle");
    }
  }

  /**
   * CSS値をSides型に変換（既存のtoSides関数の移行）
   */
  private toSides(prop: string): Sides {
    const cs = this.value.computedStyle;
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
   * ボックスモデル情報を取得
   */
  get boxModel(): BoxModel {
    return {
      content: this.value.bounds,
      padding: this.toSides("padding"),
      margin: this.toSides("margin"),
      border: this.toSides("border"),
    };
  }

  /**
   * 要素の絶対位置（スクロール考慮）
   */
  get absolutePosition(): { x: number; y: number } {
    return {
      x: this.value.bounds.left + window.scrollX,
      y: this.value.bounds.top + window.scrollY,
    };
  }

  /**
   * 要素のサイズ
   */
  get size(): { width: number; height: number } {
    return {
      width: this.value.bounds.width,
      height: this.value.bounds.height,
    };
  }

  /**
   * 要素が表示可能かどうか
   */
  get isVisible(): boolean {
    return this.value.bounds.width > 0 && this.value.bounds.height > 0;
  }

  /**
   * パディング情報
   */
  get padding(): Sides {
    return this.boxModel.padding;
  }

  /**
   * マージン情報
   */
  get margin(): Sides {
    return this.boxModel.margin;
  }

  /**
   * 境界線情報
   */
  get border(): Sides {
    return this.boxModel.border;
  }

  /**
   * 計算されたスタイル
   */
  get computedStyle(): CSSStyleDeclaration {
    return this.value.computedStyle;
  }

  /**
   * DOMRect情報
   */
  get bounds(): DOMRect {
    return this.value.bounds;
  }
}
