/**
 * 値オブジェクトの基底クラス
 */
export abstract class ValueObject<T> {
  protected readonly value: T;

  protected constructor(value: T) {
    this.validate(value);
    this.value = value;
  }

  protected abstract validate(value: T): void;

  equals(other: ValueObject<T>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }

  valueOf(): T {
    return this.value;
  }
}
