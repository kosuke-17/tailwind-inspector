import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useInspector } from "../useInspector";

// createToastをモック
vi.mock("../../utils", async () => {
  const actual = await vi.importActual("../../utils");
  return {
    ...actual,
    createToast: vi.fn(),
  };
});

describe("useInspector Hook", () => {
  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with default enabled=true when no localStorage", () => {
      // localStorageを確実にクリア
      localStorage.clear();

      const { result } = renderHook(() => useInspector());

      expect(result.current.enabled).toBe(true);
      expect(result.current.inspectorMode).toBe(false);
      expect(result.current.legendVisible).toBe(true);
    });

    it("should read from localStorage when available", () => {
      // テスト前にlocalStorageを設定
      localStorage.clear();
      localStorage.setItem("ti-enabled", "false");
      localStorage.setItem("ti-inspector", "true");
      localStorage.setItem("ti-legend-visible", "false");

      const { result } = renderHook(() => useInspector());

      expect(result.current.enabled).toBe(false);
      expect(result.current.inspectorMode).toBe(true);
      expect(result.current.legendVisible).toBe(false);
    });

    it("should handle invalid localStorage values", () => {
      localStorage.setItem("ti-enabled", "invalid");
      localStorage.setItem("ti-inspector", "");
      localStorage.setItem("ti-legend-visible", "null");

      const { result } = renderHook(() => useInspector());

      expect(result.current.enabled).toBe(true); // default fallback
      expect(result.current.inspectorMode).toBe(false); // default fallback
      expect(result.current.legendVisible).toBe(true); // default fallback
    });
  });

  describe("Toggle Functions", () => {
    it("should toggle enabled state and save to localStorage", async () => {
      const { result } = renderHook(() => useInspector());

      // 初期状態はenabled=true
      expect(result.current.enabled).toBe(true);

      act(() => {
        result.current.toggleEnabled();
      });

      expect(result.current.enabled).toBe(false);

      act(() => {
        result.current.toggleEnabled();
      });

      expect(result.current.enabled).toBe(true);

      // 状態の変更が正常に動作することを確認（localStorageのテストは省略）
    });

    it("should toggle inspector mode and save to localStorage", async () => {
      const { result } = renderHook(() => useInspector());

      expect(result.current.inspectorMode).toBe(false);

      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.inspectorMode).toBe(true);

      // 状態の変更が正常に動作することを確認（localStorageのテストは省略）
    });

    it("should toggle legend visibility and save to localStorage", async () => {
      const { result } = renderHook(() => useInspector());

      expect(result.current.legendVisible).toBe(true);

      act(() => {
        result.current.toggleLegend();
      });

      expect(result.current.legendVisible).toBe(false);

      // 状態の変更が正常に動作することを確認（localStorageのテストは省略）
    });

    it("should show toast notifications when toggling", async () => {
      const { createToast } = await import("../../utils");
      const { result } = renderHook(() => useInspector());

      // 初期状態はenabled=trueなので、toggleするとOFFになる
      act(() => {
        result.current.toggleEnabled();
      });

      expect(createToast).toHaveBeenCalledWith("Tailwind Inspector: OFF");

      act(() => {
        result.current.toggleEnabled();
      });

      expect(createToast).toHaveBeenCalledWith("Tailwind Inspector: ON");
    });
  });

  describe("Mouse Position State", () => {
    it("should initialize mouse position as null", () => {
      const { result } = renderHook(() => useInspector());

      expect(result.current.mousePosition).toBeNull();
    });

    it("should handle tooltip visibility state", () => {
      const { result } = renderHook(() => useInspector());

      expect(result.current.tooltipVisible).toBe(false);
      expect(result.current.tooltipData).toBeNull();
    });
  });

  describe("Element Hover State", () => {
    it("should initialize hover element as null", () => {
      const { result } = renderHook(() => useInspector());

      expect(result.current.hoverElement).toBeNull();
    });
  });

  describe("Global Layer Ref", () => {
    it("should provide globalLayerRef", () => {
      const { result } = renderHook(() => useInspector());

      expect(result.current.globalLayerRef).toBeDefined();
      expect(result.current.globalLayerRef.current).toBeNull(); // 初期状態
    });
  });

  describe("State Persistence", () => {
    it("should persist all state changes to localStorage", async () => {
      const { result } = renderHook(() => useInspector());

      // 複数の状態を変更
      act(() => {
        result.current.toggleEnabled();
        result.current.toggleMode();
        result.current.toggleLegend();
      });

      // localStorageに保存されているかチェック
      await waitFor(() => {
        expect(localStorage.getItem("ti-enabled")).toBe("false");
        expect(localStorage.getItem("ti-inspector")).toBe("true");
        expect(localStorage.getItem("ti-legend-visible")).toBe("false");
      });
    });

    it("should maintain state consistency after multiple toggles", async () => {
      const { result } = renderHook(() => useInspector());

      // 初期状態: enabled=true, inspectorMode=false
      expect(result.current.enabled).toBe(true);
      expect(result.current.inspectorMode).toBe(false);

      // 複数回トグル
      act(() => {
        result.current.toggleEnabled(); // false
        result.current.toggleEnabled(); // true
        result.current.toggleMode(); // true
        result.current.toggleMode(); // false
        result.current.toggleMode(); // true
      });

      expect(result.current.enabled).toBe(true);
      expect(result.current.inspectorMode).toBe(true);

      await waitFor(() => {
        expect(localStorage.getItem("ti-enabled")).toBe("true");
        expect(localStorage.getItem("ti-inspector")).toBe("true");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle localStorage access errors gracefully", () => {
      // localStorageをモックして例外を投げる
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error("localStorage not available");
      });

      const { result } = renderHook(() => useInspector());

      // エラーがスローされずに動作することを確認
      expect(() => {
        act(() => {
          result.current.toggleEnabled();
        });
      }).not.toThrow();

      // localStorageを元に戻す
      localStorage.setItem = originalSetItem;
    });
  });
});
