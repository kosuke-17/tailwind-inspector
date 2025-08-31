/**
 * Either型のシンプルな実装（エラーハンドリング用）
 */
export class Result<T, E = Error> {
  private constructor(
    private readonly value: T | null,
    private readonly error: E | null,
    private readonly success: boolean
  ) {}

  static success<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(value, null, true);
  }

  static failure<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(null, error, false);
  }

  isSuccess(): boolean {
    return this.success;
  }

  isFailure(): boolean {
    return !this.success;
  }

  getValue(): T {
    if (!this.success) {
      throw new Error("Cannot get value from failure result");
    }
    return this.value!;
  }

  getError(): E {
    if (this.success) {
      throw new Error("Cannot get error from success result");
    }
    return this.error!;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.success) {
      return Result.success(fn(this.value!));
    }
    return Result.failure(this.error!);
  }

  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.success) {
      return Result.success(this.value!);
    }
    return Result.failure(fn(this.error!));
  }
}
