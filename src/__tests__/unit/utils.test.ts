import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  toSides,
  extractTailwindClasses,
  toHex,
  escapeHTML,
  debounce,
  createToast,
  detectTailwindCSS,
  getTailwindFallbackValues,
} from "../../utils";

describe("Utils Functions", () => {
  describe("toSides", () => {
    it("should convert CSS values to Sides type correctly", () => {
      const mockCS = {
        paddingTop: "8px",
        paddingRight: "16px",
        paddingBottom: "12px",
        paddingLeft: "4px",
      } as CSSStyleDeclaration;

      const result = toSides(mockCS, "padding");

      expect(result).toEqual({
        t: 8,
        r: 16,
        b: 12,
        l: 4,
      });
    });

    it("should handle invalid values with fallback to 0", () => {
      const mockCS = {
        paddingTop: "invalid",
        paddingRight: "",
        paddingBottom: undefined,
        paddingLeft: "8px",
      } as any;

      const result = toSides(mockCS, "padding");

      expect(result).toEqual({
        t: 0,
        r: 0,
        b: 0,
        l: 8,
      });
    });

    it("should handle margin properties", () => {
      const mockCS = {
        marginTop: "10px",
        marginRight: "20px",
        marginBottom: "30px",
        marginLeft: "40px",
      } as CSSStyleDeclaration;

      const result = toSides(mockCS, "margin");

      expect(result).toEqual({
        t: 10,
        r: 20,
        b: 30,
        l: 40,
      });
    });
  });

  describe("extractTailwindClasses", () => {
    it("should extract valid Tailwind classes", () => {
      const className =
        "bg-red-500 text-white p-4 hover:bg-red-600 custom-class";
      const result = extractTailwindClasses(className);
      expect(result).toBe(
        "bg-red-500 text-white p-4 hover:bg-red-600 custom-class"
      );
    });

    it("should filter out invalid class names", () => {
      const className = "bg-red-500 @invalid!class text-white p-4";
      const result = extractTailwindClasses(className);
      expect(result).toBe("bg-red-500 text-white p-4");
    });

    it("should handle empty or null input", () => {
      expect(extractTailwindClasses("")).toBe("");
      expect(extractTailwindClasses(null as any)).toBe("");
      expect(extractTailwindClasses(undefined as any)).toBe("");
    });

    it("should handle responsive and pseudo-class prefixes", () => {
      const className =
        "sm:bg-blue-500 md:text-lg lg:p-8 hover:scale-105 focus:ring-2";
      const result = extractTailwindClasses(className);
      expect(result).toBe(
        "sm:bg-blue-500 md:text-lg lg:p-8 hover:scale-105 focus:ring-2"
      );
    });
  });

  describe("toHex", () => {
    it("should return hex colors as-is", () => {
      expect(toHex("#ff0000")).toBe("#ff0000");
      expect(toHex("#FF0000")).toBe("#FF0000");
    });

    it("should convert rgb to hex", () => {
      expect(toHex("rgb(255, 0, 0)")).toBe("#ff0000");
      expect(toHex("rgb(0, 255, 0)")).toBe("#00ff00");
      expect(toHex("rgb(0, 0, 255)")).toBe("#0000ff");
    });

    it("should convert rgba to hex with alpha", () => {
      expect(toHex("rgba(255, 0, 0, 0.5)")).toBe("#ff000080");
      expect(toHex("rgba(0, 255, 0, 1)")).toBe("#00ff00");
    });

    it("should handle invalid color strings", () => {
      expect(toHex("invalid-color")).toBe("invalid-color");
      expect(toHex("")).toBe("");
      expect(toHex("transparent")).toBe("transparent");
    });

    it("should handle edge cases in rgb parsing", () => {
      expect(toHex("rgb(0, 0, 0)")).toBe("#000000");
      expect(toHex("rgb(255, 255, 255)")).toBe("#ffffff");
      expect(toHex("rgb(128.5, 64.7, 192.3)")).toBe("#8041c0");
    });
  });

  describe("escapeHTML", () => {
    it("should escape HTML special characters", () => {
      expect(escapeHTML('<script>alert("xss")</script>')).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
      );
      expect(escapeHTML("& < > \" '")).toBe("&amp; &lt; &gt; &quot; &#039;");
    });

    it("should handle normal text without changes", () => {
      expect(escapeHTML("normal text")).toBe("normal text");
      expect(escapeHTML("123")).toBe("123");
    });

    it("should handle empty string", () => {
      expect(escapeHTML("")).toBe("");
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should delay function execution", () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it("should cancel previous calls when called multiple times", () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it("should pass arguments correctly", () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn("arg1", "arg2");
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
    });
  });

  describe("createToast", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });

    it("should create toast element with correct content", () => {
      createToast("Test message");

      const toast = document.querySelector("div");
      expect(toast).toBeTruthy();
      expect(toast?.textContent).toBe("Test message");
    });

    it("should apply correct styles to toast", () => {
      createToast("Test message");

      const toast = document.querySelector("div");
      expect(toast?.style.position).toBe("fixed");
      expect(toast?.style.bottom).toBe("16px");
      expect(toast?.style.right).toBe("16px");
      expect(toast?.style.zIndex).toBe("2147483647");
    });

    it("should remove toast after timeout", () => {
      vi.useFakeTimers();

      createToast("Test message");
      expect(document.querySelector("div")).toBeTruthy();

      vi.advanceTimersByTime(1400);
      expect(document.querySelector("div")).toBeFalsy();

      vi.useRealTimers();
    });
  });

  describe("detectTailwindCSS", () => {
    it("should return false when Tailwind CSS is not loaded", () => {
      // JSDOMテスト環境ではTailwind CSSが読み込まれていない
      const result = detectTailwindCSS();
      expect(result).toBe(false);
    });
  });

  describe("getTailwindFallbackValues", () => {
    it("should return fallback values for m-2 class", () => {
      const result = getTailwindFallbackValues("m-2");
      expect(result).toEqual({
        margin: { t: 8, r: 8, b: 8, l: 8 },
        padding: { t: 0, r: 0, b: 0, l: 0 },
      });
    });

    it("should return fallback values for p-4 class", () => {
      const result = getTailwindFallbackValues("p-4");
      expect(result).toEqual({
        margin: { t: 0, r: 0, b: 0, l: 0 },
        padding: { t: 16, r: 16, b: 16, l: 16 },
      });
    });

    it("should handle multiple classes", () => {
      const result = getTailwindFallbackValues("m-2 p-4");
      expect(result).toEqual({
        margin: { t: 8, r: 8, b: 8, l: 8 },
        padding: { t: 16, r: 16, b: 16, l: 16 },
      });
    });

    it("should handle responsive prefixes", () => {
      const result = getTailwindFallbackValues("sm:m-4 lg:p-6");
      expect(result).toEqual({
        margin: { t: 16, r: 16, b: 16, l: 16 },
        padding: { t: 24, r: 24, b: 24, l: 24 },
      });
    });

    it("should return zero values for unknown classes", () => {
      const result = getTailwindFallbackValues("unknown-class");
      expect(result).toEqual({
        margin: { t: 0, r: 0, b: 0, l: 0 },
        padding: { t: 0, r: 0, b: 0, l: 0 },
      });
    });
  });
});
