export class TailwindClass {
  constructor(private readonly value: string) {}

  toString(): string {
    return this.value;
  }

  static parse(className: string): TailwindClass[] {
    if (!className) return [];
    return String(className)
      .split(/\s+/)
      .filter((c) => /^[a-z0-9:_\/-]+$/i.test(c))
      .map((c) => new TailwindClass(c));
  }
}

