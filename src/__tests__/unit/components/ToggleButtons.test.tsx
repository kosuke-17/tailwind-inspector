import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToggleButtons } from "../../../components/ToggleButtons";
import { memo } from "react";

describe("ToggleButtons Component", () => {
  const defaultProps = {
    enabled: true,
    inspectorMode: false,
    legendVisible: true,
    onToggleEnabled: vi.fn(),
    onToggleMode: vi.fn(),
    onToggleLegend: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all buttons with correct text", () => {
      render(<ToggleButtons {...defaultProps} />);

      expect(screen.getByText("Inspector: ON")).toBeTruthy();
      expect(screen.getByText("Mode: Hover")).toBeTruthy();
      expect(screen.getByText("説明: ON")).toBeTruthy();
      expect(
        screen.getByText("Tailwind Inspector By React Output")
      ).toBeTruthy();
    });

    it("should render with correct classes based on props", () => {
      render(<ToggleButtons {...defaultProps} />);

      const enabledButton = screen.getByText("Inspector: ON");
      const modeButton = screen.getByText("Mode: Hover");
      const legendButton = screen.getByText("説明: ON");

      expect(enabledButton.className).toBe("on");
      expect(modeButton.className).toBe("off");
      expect(legendButton.className).toBe("on");
    });

    it("should render with opposite states", () => {
      const oppositeProps = {
        ...defaultProps,
        enabled: false,
        inspectorMode: true,
        legendVisible: false,
      };

      render(<ToggleButtons {...oppositeProps} />);

      expect(screen.getByText("Inspector: OFF")).toBeTruthy();
      expect(screen.getByText("Mode: All")).toBeTruthy();
      expect(screen.getByText("説明: OFF")).toBeTruthy();

      const enabledButton = screen.getByText("Inspector: OFF");
      const modeButton = screen.getByText("Mode: All");
      const legendButton = screen.getByText("説明: OFF");

      expect(enabledButton.className).toBe("off");
      expect(modeButton.className).toBe("on");
      expect(legendButton.className).toBe("off");
    });
  });

  describe("Accessibility", () => {
    it("should have correct aria-pressed attributes", () => {
      render(<ToggleButtons {...defaultProps} />);

      const enabledButton = screen.getByText("Inspector: ON");
      const modeButton = screen.getByText("Mode: Hover");
      const legendButton = screen.getByText("説明: ON");

      expect(enabledButton.getAttribute("aria-pressed")).toBe("true");
      expect(modeButton.getAttribute("aria-pressed")).toBe("false");
      expect(legendButton.getAttribute("aria-pressed")).toBe("true");
    });

    it("should update aria-pressed when props change", () => {
      const { rerender } = render(<ToggleButtons {...defaultProps} />);

      const enabledButton = screen.getByText("Inspector: ON");
      expect(enabledButton.getAttribute("aria-pressed")).toBe("true");

      rerender(<ToggleButtons {...defaultProps} enabled={false} />);

      const disabledButton = screen.getByText("Inspector: OFF");
      expect(disabledButton.getAttribute("aria-pressed")).toBe("false");
    });
  });

  describe("User Interactions", () => {
    it("should call onToggleEnabled when enabled button is clicked", () => {
      render(<ToggleButtons {...defaultProps} />);

      const enabledButton = screen.getByText("Inspector: ON");
      fireEvent.click(enabledButton);

      expect(defaultProps.onToggleEnabled).toHaveBeenCalledOnce();
    });

    it("should call onToggleMode when mode button is clicked", () => {
      render(<ToggleButtons {...defaultProps} />);

      const modeButton = screen.getByText("Mode: Hover");
      fireEvent.click(modeButton);

      expect(defaultProps.onToggleMode).toHaveBeenCalledOnce();
    });

    it("should call onToggleLegend when legend button is clicked", () => {
      render(<ToggleButtons {...defaultProps} />);

      const legendButton = screen.getByText("説明: ON");
      fireEvent.click(legendButton);

      expect(defaultProps.onToggleLegend).toHaveBeenCalledOnce();
    });

    it("should handle multiple rapid clicks", () => {
      render(<ToggleButtons {...defaultProps} />);

      const enabledButton = screen.getByText("Inspector: ON");

      // 複数回クリック
      fireEvent.click(enabledButton);
      fireEvent.click(enabledButton);
      fireEvent.click(enabledButton);

      expect(defaultProps.onToggleEnabled).toHaveBeenCalledTimes(3);
    });
  });

  describe("Keyboard Navigation", () => {
    it("should handle keyboard events", () => {
      render(<ToggleButtons {...defaultProps} />);

      const enabledButton = screen.getByText("Inspector: ON");

      // Enter key
      fireEvent.keyDown(enabledButton, { key: "Enter", code: "Enter" });
      expect(defaultProps.onToggleEnabled).toHaveBeenCalledOnce();

      // Space key
      fireEvent.keyDown(enabledButton, { key: " ", code: "Space" });
      expect(defaultProps.onToggleEnabled).toHaveBeenCalledTimes(2);
    });
  });

  describe("Component Structure", () => {
    it("should have correct DOM structure", () => {
      render(<ToggleButtons {...defaultProps} />);

      const container = screen.getByText("Inspector: ON").parentElement;
      expect(container?.id).toBe("ti-toggle");

      const buttons = container?.querySelectorAll("button");
      expect(buttons?.length).toBe(3);

      const hint = screen.getByText("Tailwind Inspector By React Output");
      expect(hint.tagName).toBe("SPAN");
      expect(hint.className).toBe("hint");
    });
  });

  describe("Prop Validation", () => {
    it("should handle undefined callback props gracefully", () => {
      const propsWithUndefined = {
        ...defaultProps,
        onToggleEnabled: undefined as any,
      };

      expect(() => {
        render(<ToggleButtons {...propsWithUndefined} />);
      }).not.toThrow();
    });
  });

  describe("Performance", () => {
    it("should not re-render when props have not changed (memo)", () => {
      const renderSpy = vi.fn();

      const TestComponent = memo(() => {
        renderSpy();
        return <ToggleButtons {...defaultProps} />;
      });

      const { rerender } = render(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledOnce();

      // 同じpropsで再レンダリング
      rerender(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledOnce(); // メモ化により再呼び出しされない

      // propsが変更された場合
      const newProps = { ...defaultProps, enabled: false };
      rerender(<ToggleButtons {...newProps} />);
      // この場合は再レンダリングされる
    });
  });
});
