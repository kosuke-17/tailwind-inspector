import { useCallback, useRef } from "react";

/**
 * スロットリング用のカスタムフック
 * 指定された遅延時間内で最後の呼び出しのみを実行
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastExecution = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastExecution.current >= delay) {
        // 即座に実行
        lastExecution.current = now;
        callback(...args);
      } else {
        // 遅延実行
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastExecution.current = Date.now();
          callback(...args);
          timeoutRef.current = null;
        }, delay - (now - lastExecution.current));
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * デバウンス用のカスタムフック
 * 連続した呼び出しの最後のもののみを遅延実行
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<number | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        timeoutRef.current = null;
      }, delay);
    }) as T,
    [callback, delay]
  );
}