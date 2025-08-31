import { ValueObject } from "../../shared/ValueObject";

/**
 * Tailwindクラス名を表現する値オブジェクト
 */
export class TailwindClass extends ValueObject<string> {
  private readonly variant?: string;
  private readonly property: string;

  constructor(value: string, variant?: string, property?: string) {
    super(value);
    this.variant = variant;
    this.property = property || this.parseProperty(value);
  }

  protected validate(value: string): void {
    if (!value || typeof value !== "string") {
      throw new Error("TailwindClass value must be a non-empty string");
    }

    // Tailwindクラス名の基本的な形式をチェック
    if (!/^[a-z0-9:_\/-]+$/i.test(value)) {
      throw new Error(`Invalid Tailwind class format: ${value}`);
    }
  }

  /**
   * クラス名文字列をTailwindClassのリストに解析
   */
  static parse(className: string): TailwindClass[] {
    if (!className || typeof className !== "string") {
      return [];
    }

    return className
      .split(/\s+/)
      .filter((c) => c.trim().length > 0)
      .filter((c) => /^[a-z0-9:_\/-]+$/i.test(c))
      .map((cls) => {
        const [, variant] = this.parseVariant(cls);
        return new TailwindClass(cls, variant, undefined);
      });
  }

  /**
   * バリアント（レスポンシブ、疑似クラス等）を解析
   */
  private static parseVariant(className: string): [string, string | undefined] {
    const variantMatch = className.match(/^([a-z]+[0-9]*):(.+)$/);
    if (variantMatch) {
      return [variantMatch[2], variantMatch[1]];
    }
    return [className, undefined];
  }

  /**
   * CSSプロパティを推測
   */
  private parseProperty(className: string): string {
    // バリアントを除去した基本クラス名
    const baseClass = this.variant
      ? className.replace(new RegExp(`^${this.variant}:`), "")
      : className;

    // プロパティマッピング
    if (
      baseClass.startsWith("m-") ||
      baseClass.startsWith("mx-") ||
      baseClass.startsWith("my-") ||
      baseClass.startsWith("mt-") ||
      baseClass.startsWith("mr-") ||
      baseClass.startsWith("mb-") ||
      baseClass.startsWith("ml-")
    ) {
      return "margin";
    }
    if (
      baseClass.startsWith("p-") ||
      baseClass.startsWith("px-") ||
      baseClass.startsWith("py-") ||
      baseClass.startsWith("pt-") ||
      baseClass.startsWith("pr-") ||
      baseClass.startsWith("pb-") ||
      baseClass.startsWith("pl-")
    ) {
      return "padding";
    }
    if (baseClass.startsWith("bg-")) {
      return "background";
    }
    if (baseClass.startsWith("text-")) {
      return "color";
    }
    if (baseClass.startsWith("border-")) {
      return "border";
    }
    if (baseClass.startsWith("gap-")) {
      return "gap";
    }

    return "unknown";
  }

  /**
   * CSS数値を抽出（margin/paddingなど）
   */
  extractNumericValue(): number {
    const baseClass = this.variant
      ? this.value.replace(new RegExp(`^${this.variant}:`), "")
      : this.value;

    // スペーシング関連のクラスのみ処理
    if (!this.isMargin && !this.isPadding && !baseClass.startsWith("gap-")) {
      return 0;
    }

    // m-2, p-4, gap-6 等の数値を抽出
    const numMatch = baseClass.match(/-(\d+(?:\.\d+)?)$/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);

      // Tailwindの標準スケール（0.25rem単位）
      const scale: Record<number, number> = {
        0: 0,
        1: 4,
        2: 8,
        3: 12,
        4: 16,
        5: 20,
        6: 24,
        8: 32,
        10: 40,
        12: 48,
        16: 64,
        20: 80,
        24: 96,
        32: 128,
        40: 160,
        48: 192,
        56: 224,
        64: 256,
      };

      return scale[num] ?? num * 4; // フォールバック: n * 0.25rem
    }

    return 0;
  }

  /**
   * 優先度を計算（CSS specificity ライク）
   */
  getPriority(): number {
    let priority = 1;

    // バリアントによる優先度
    if (this.variant) {
      // レスポンシブの優先度
      const responsivePriority: Record<string, number> = {
        sm: 10,
        md: 20,
        lg: 30,
        xl: 40,
        "2xl": 50,
      };

      // 状態の優先度
      const statePriority: Record<string, number> = {
        hover: 5,
        focus: 5,
        active: 5,
        disabled: 5,
      };

      priority +=
        responsivePriority[this.variant] ?? statePriority[this.variant] ?? 1;
    }

    return priority;
  }

  // ゲッター
  get cssProperty(): string {
    return this.property;
  }

  get hasVariant(): boolean {
    return this.variant !== undefined;
  }

  get variantName(): string | undefined {
    return this.variant;
  }

  get baseClass(): string {
    return this.variant
      ? this.value.replace(new RegExp(`^${this.variant}:`), "")
      : this.value;
  }

  get isMargin(): boolean {
    return this.property === "margin";
  }

  get isPadding(): boolean {
    return this.property === "padding";
  }

  get isColor(): boolean {
    return this.property === "background" || this.property === "color";
  }
}
