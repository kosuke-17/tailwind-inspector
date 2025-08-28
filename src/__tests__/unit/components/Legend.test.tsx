import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Legend } from "../../../components/Legend";

// LocalStorageのモック
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("Legend Component", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Visibility", () => {
    it("should not render when visible is false", () => {
      render(<Legend visible={false} />);
      expect(screen.queryByText("Legend")).not.toBeInTheDocument();
    });

    it("should render when visible is true", () => {
      render(<Legend visible={true} />);
      expect(screen.getByText("Legend")).toBeInTheDocument();
    });
  });

  describe("Content", () => {
    it("should show all legend items when expanded", () => {
      render(<Legend visible={true} />);

      expect(screen.getByText("Padding (緑)")).toBeInTheDocument();
      expect(screen.getByText("Margin (オレンジ)")).toBeInTheDocument();
      expect(screen.getByText("Gap (青緑)")).toBeInTheDocument();
      expect(screen.getByText("Element (グレー)")).toBeInTheDocument();
      expect(
        screen.getByText("右下ボタンで ON/OFF・モード切替")
      ).toBeInTheDocument();
    });

    it("should show only header when collapsed", () => {
      render(<Legend visible={true} />);

      // 折りたたみボタンをクリック
      const toggleButton = screen.getByTitle("折りたたみ");
      fireEvent.click(toggleButton);

      expect(screen.getByText("Legend")).toBeInTheDocument();
      expect(screen.queryByText("Padding (緑)")).not.toBeInTheDocument();
      expect(
        screen.queryByText("右下ボタンで ON/OFF・モード切替")
      ).not.toBeInTheDocument();
    });
  });

  describe("Collapse/Expand functionality", () => {
    it("should toggle collapse state when button is clicked", () => {
      render(<Legend visible={true} />);

      const toggleButton = screen.getByTitle("折りたたみ");
      expect(toggleButton.textContent).toBe("−");

      // 折りたたみ
      fireEvent.click(toggleButton);
      expect(screen.getByTitle("展開").textContent).toBe("+");

      // 展開
      fireEvent.click(screen.getByTitle("展開"));
      expect(screen.getByTitle("折りたたみ").textContent).toBe("−");
    });

    it("should save collapse state to localStorage", () => {
      render(<Legend visible={true} />);

      const toggleButton = screen.getByTitle("折りたたみ");
      fireEvent.click(toggleButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "ti-legend-collapsed",
        "true"
      );
    });
  });

  describe("Position persistence", () => {
    it("should save position to localStorage", () => {
      render(<Legend visible={true} />);

      // 初期位置が保存されることを確認
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "ti-legend-position",
        JSON.stringify({ x: 20, y: 20 })
      );
    });

    it("should restore position from localStorage", () => {
      const savedPosition = { x: 100, y: 200 };
      mockLocalStorage.getItem = vi
        .fn()
        .mockReturnValue(JSON.stringify(savedPosition));

      render(<Legend visible={true} />);

      const legend = screen
        .getByText("Legend")
        .closest("#ti-legend") as HTMLElement;
      expect(legend.style.left).toBe("100px");
      expect(legend.style.top).toBe("200px");
    });

    it("should use default position when localStorage parsing fails", () => {
      mockLocalStorage.getItem = vi.fn().mockReturnValue("invalid-json");

      render(<Legend visible={true} />);

      const legend = screen
        .getByText("Legend")
        .closest("#ti-legend") as HTMLElement;
      expect(legend.style.left).toBe("20px");
      expect(legend.style.top).toBe("20px");
    });
  });

  describe("Dragging functionality", () => {
    it("should change cursor when dragging", () => {
      render(<Legend visible={true} />);

      const legend = screen
        .getByText("Legend")
        .closest("#ti-legend") as HTMLElement;
      expect(legend.style.cursor).toBe("grab");

      // マウスダウンでドラッグ開始
      fireEvent.mouseDown(legend!, { clientX: 100, clientY: 100 });
      expect(legend.style.cursor).toBe("grabbing");
    });

    it("should not start dragging when clicking toggle button", () => {
      render(<Legend visible={true} />);

      const toggleButton = screen.getByTitle("折りたたみ");
      const legend = screen
        .getByText("Legend")
        .closest("#ti-legend") as HTMLElement;

      // トグルボタンをマウスダウンしてもドラッグは開始されない
      fireEvent.mouseDown(toggleButton, { clientX: 100, clientY: 100 });
      expect(legend.style.cursor).toBe("grab"); // grabのままでgrab
    });
  });

  describe("Styling", () => {
    it("should have proper z-index for floating above content", () => {
      render(<Legend visible={true} />);

      const legend = screen
        .getByText("Legend")
        .closest("#ti-legend") as HTMLElement;
      expect(legend.style.zIndex).toBe("2147483646");
    });

    it("should have backdrop blur effect", () => {
      render(<Legend visible={true} />);

      const legend = screen
        .getByText("Legend")
        .closest("#ti-legend") as HTMLElement;
      expect(legend.style.backdropFilter).toBe("blur(4px)");
    });
  });
});
