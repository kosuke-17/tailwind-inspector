import { ValueObject } from "../../shared/ValueObject";

/**
 * CSS色値を正規化する値オブジェクト
 */
export class ColorHex extends ValueObject<string> {
  constructor(color: string) {
    super(ColorHex.normalizeColor(color));
  }

  protected validate(value: string): void {
    if (!value || typeof value !== "string") {
      throw new Error("Color value must be a non-empty string");
    }
  }

  /**
   * 色値をHEX形式に正規化（既存のtoHex関数の移行）
   */
  static normalizeColor(color: string): string {
    if (!color) return "";
    if (color.startsWith("#")) return color;

    const m = color.match(
      /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\s*\)$/i
    );
    if (!m) return color;

    const r = this.clamp255(parseFloat(m[1]));
    const g = this.clamp255(parseFloat(m[2]));
    const b = this.clamp255(parseFloat(m[3]));
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;

    const hex = `#${this.to2(r)}${this.to2(g)}${this.to2(b)}`;
    return a < 1 ? `${hex}${this.to2(Math.round(a * 255))}` : hex;
  }

  private static to2(n: number): string {
    return n.toString(16).padStart(2, "0");
  }

  private static clamp255(n: number): number {
    return Math.max(0, Math.min(255, Math.round(n)));
  }

  get hexValue(): string {
    return this.value;
  }

  get isTransparent(): boolean {
    return this.value === "" || this.value === "transparent";
  }
}

/**
 * CSS数値プロパティを表現する値オブジェクト
 */
export class NumericStyleValue extends ValueObject<number> {
  private readonly unit: string;

  constructor(value: number, unit: string = "px") {
    super(value);
    this.unit = unit;
  }

  protected validate(value: number): void {
    if (typeof value !== "number" || isNaN(value)) {
      throw new Error("NumericStyleValue must be a valid number");
    }
  }

  get pixelValue(): number {
    return this.value;
  }

  get cssValue(): string {
    return `${this.value}${this.unit}`;
  }

  get unitType(): string {
    return this.unit;
  }

  isZero(): boolean {
    return this.value === 0;
  }

  isPositive(): boolean {
    return this.value > 0;
  }
}

/**
 * 解決されたスタイル情報
 */
export interface ResolvedStyle {
  margin: {
    top: NumericStyleValue;
    right: NumericStyleValue;
    bottom: NumericStyleValue;
    left: NumericStyleValue;
  };
  padding: {
    top: NumericStyleValue;
    right: NumericStyleValue;
    bottom: NumericStyleValue;
    left: NumericStyleValue;
  };
  color: ColorHex;
  backgroundColor: ColorHex;
  fontSize: NumericStyleValue;
  lineHeight: string;
  borderRadius: NumericStyleValue;
}
