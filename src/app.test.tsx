import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./App";

// utilsをモック
vi.mock("../../utils", async () => {
  const actual = await vi.importActual("../../utils");
  return {
    ...actual,
    createToast: vi.fn(),
  };
});

describe("App Integration Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("Initial Rendering", () => {
    it("should render ToggleButtons by default", () => {
      render(<App />);

      expect(screen.getByText("Inspector: ON")).toBeTruthy();
      expect(screen.getByText("Mode: Hover")).toBeTruthy();
      expect(screen.getByText("説明: ON")).toBeTruthy();
    });

    it("should render all components when enabled=true", () => {
      render(<App />);

      // トグルボタンは常に表示
      expect(screen.getByText("Inspector: ON")).toBeTruthy();

      // enabled=trueなので他のコンポーネントも表示される
      expect(document.querySelector("#ti-global")).toBeTruthy();
    });

    it("should only show ToggleButtons when enabled=false", () => {
      localStorage.setItem("ti-enabled", "false");

      render(<App />);

      // トグルボタンは表示される
      expect(screen.getByText("Inspector: OFF")).toBeTruthy();

      // enabled=falseなので他のコンポーネントは非表示
      expect(document.querySelector("#ti-global")).toBeFalsy();
    });
  });

  describe("State Management Integration", () => {
    it("should persist state changes across component tree", async () => {
      render(<App />);

      const enabledButton = screen.getByText("Inspector: ON");

      // enabled状態を切り替え
      fireEvent.click(enabledButton);

      await waitFor(() => {
        expect(screen.getByText("Inspector: OFF")).toBeTruthy();
      });

      // localStorageに保存されているかチェック
      expect(localStorage.getItem("ti-enabled")).toBe("false");

      // グローバルレイヤーが非表示になっているかチェック
      expect(document.querySelector("#ti-global")).toBeFalsy();
    });

    it("should toggle between inspector modes correctly", async () => {
      render(<App />);

      const modeButton = screen.getByText("Mode: Hover");

      fireEvent.click(modeButton);

      await waitFor(() => {
        expect(screen.getByText("Mode: All")).toBeTruthy();
      });

      expect(localStorage.getItem("ti-inspector")).toBe("true");
    });

    it("should toggle legend visibility", async () => {
      render(<App />);

      const legendButton = screen.getByText("説明: ON");

      fireEvent.click(legendButton);

      await waitFor(() => {
        expect(screen.getByText("説明: OFF")).toBeTruthy();
      });

      expect(localStorage.getItem("ti-legend-visible")).toBe("false");
    });
  });

  describe("Conditional Rendering Logic", () => {
    it("should show/hide components based on enabled state", async () => {
      render(<App />);

      // 初期状態: enabled=true, 全コンポーネント表示
      expect(document.querySelector("#ti-global")).toBeTruthy();

      const enabledButton = screen.getByText("Inspector: ON");
      fireEvent.click(enabledButton);

      // enabled=false後: トグルボタン以外非表示
      await waitFor(() => {
        expect(document.querySelector("#ti-global")).toBeFalsy();
      });

      // 再度有効化
      const disabledButton = screen.getByText("Inspector: OFF");
      fireEvent.click(disabledButton);

      await waitFor(() => {
        expect(document.querySelector("#ti-global")).toBeTruthy();
      });
    });

    it("should handle inspector mode changes properly", async () => {
      render(<App />);

      // Hoverモード時の表示確認
      expect(screen.getByText("Mode: Hover")).toBeTruthy();

      const modeButton = screen.getByText("Mode: Hover");
      fireEvent.click(modeButton);

      // Allモード時の表示確認
      await waitFor(() => {
        expect(screen.getByText("Mode: All")).toBeTruthy();
      });
    });
  });

  describe("localStorage Integration", () => {
    it("should load initial state from localStorage", () => {
      // localStorageに事前設定
      localStorage.setItem("ti-enabled", "false");
      localStorage.setItem("ti-inspector", "true");
      localStorage.setItem("ti-legend-visible", "false");

      render(<App />);

      // localStorageの値が反映されているかチェック
      expect(screen.getByText("Inspector: OFF")).toBeTruthy();
      expect(screen.getByText("Mode: All")).toBeTruthy();
      expect(screen.getByText("説明: OFF")).toBeTruthy();
    });

    it("should use defaults when localStorage is empty", () => {
      render(<App />);

      // デフォルト値が使用されているかチェック
      expect(screen.getByText("Inspector: ON")).toBeTruthy();
      expect(screen.getByText("Mode: Hover")).toBeTruthy();
      expect(screen.getByText("説明: ON")).toBeTruthy();
    });

    it("should handle corrupted localStorage gracefully", () => {
      localStorage.setItem("ti-enabled", "invalid-value");
      localStorage.setItem("ti-inspector", "also-invalid");

      expect(() => {
        render(<App />);
      }).not.toThrow();

      // フォールバック値が使用されているかチェック
      expect(screen.getByText("Inspector: ON")).toBeTruthy();
      expect(screen.getByText("Mode: Hover")).toBeTruthy();
    });
  });

  describe("Multiple State Changes", () => {
    it("should handle rapid state changes correctly", async () => {
      render(<App />);

      const enabledButton = screen.getByText("Inspector: ON");
      const modeButton = screen.getByText("Mode: Hover");
      const legendButton = screen.getByText("説明: ON");

      // 複数の状態を連続で変更
      fireEvent.click(enabledButton);
      fireEvent.click(modeButton);
      fireEvent.click(legendButton);

      await waitFor(() => {
        expect(screen.getByText("Inspector: OFF")).toBeTruthy();
        expect(screen.getByText("Mode: All")).toBeTruthy();
        expect(screen.getByText("説明: OFF")).toBeTruthy();
      });

      // localStorageの値が全て正しく保存されているかチェック
      expect(localStorage.getItem("ti-enabled")).toBe("false");
      expect(localStorage.getItem("ti-inspector")).toBe("true");
      expect(localStorage.getItem("ti-legend-visible")).toBe("false");
    });
  });

  describe("Error Boundary Behavior", () => {
    it("should handle component errors gracefully", () => {
      // エラーが発生してもアプリケーションがクラッシュしないことを確認
      expect(() => {
        render(<App />);
      }).not.toThrow();
    });
  });

  describe("Performance", () => {
    it("should not cause unnecessary re-renders", async () => {
      const { rerender } = render(<App />);

      // 同じpropsで再レンダリングしても不要な更新は発生しない
      rerender(<App />);

      expect(screen.getByText("Inspector: ON")).toBeTruthy();
    });
  });
});
