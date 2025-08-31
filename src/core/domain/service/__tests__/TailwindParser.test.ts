import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TailwindParser } from "../TailwindParser";

// DOMのモック
const createMockDocument = () => {
  const mockElement = {
    className: "",
    style: {},
    getBoundingClientRect: vi.fn().mockReturnValue({
      top: 0,
      left: 0,
      width: 100,
      height: 50,
    }),
  };

  const mockComputedStyle = {
    marginTop: "0px",
    paddingTop: "0px",
    backgroundColor: "transparent",
  };

  return {
    createElement: vi.fn().mockReturnValue(mockElement),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
    getComputedStyle: vi.fn().mockReturnValue(mockComputedStyle),
  };
};

describe("TailwindParser", () => {
  let parser: TailwindParser;
  let mockDocument: any;

  beforeEach(() => {
    parser = new TailwindParser();
    mockDocument = createMockDocument();

    // グローバルなDOMをモック
    vi.stubGlobal("document", mockDocument);
    vi.stubGlobal("getComputedStyle", mockDocument.getComputedStyle);
    vi.stubGlobal("window", { scrollX: 0, scrollY: 0 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("parse", () => {
    it("should successfully parse valid Tailwind classes", () => {
      const result = parser.parse("m-2 p-4 bg-red-500");

      expect(result.isSuccess()).toBe(true);
      const classes = result.getValue();
      expect(classes).toHaveLength(3);
      expect(classes[0].toString()).toBe("m-2");
      expect(classes[1].toString()).toBe("p-4");
      expect(classes[2].toString()).toBe("bg-red-500");
    });

    it("should handle empty input gracefully", () => {
      const result = parser.parse("");

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual([]);
    });

    it("should filter invalid classes", () => {
      const result = parser.parse("m-2 @invalid!class p-4");

      expect(result.isSuccess()).toBe(true);
      const classes = result.getValue();
      expect(classes).toHaveLength(2);
      expect(classes[0].toString()).toBe("m-2");
      expect(classes[1].toString()).toBe("p-4");
    });
  });

  describe("categorize", () => {
    it("should categorize spacing classes correctly", () => {
      const result = parser.parse("m-2 p-4 gap-6");
      const classes = result.getValue();
      const categorized = parser.categorize(classes);

      expect(categorized.spacing).toHaveLength(3);
      expect(categorized.spacing[0].toString()).toBe("m-2");
      expect(categorized.spacing[1].toString()).toBe("p-4");
      expect(categorized.spacing[2].toString()).toBe("gap-6");
    });

    it("should categorize color classes correctly", () => {
      const result = parser.parse("bg-red-500 text-blue-600 border-gray-300");
      const classes = result.getValue();
      const categorized = parser.categorize(classes);

      expect(categorized.colors).toHaveLength(3);
      expect(categorized.colors.map((c) => c.toString())).toEqual([
        "bg-red-500",
        "text-blue-600",
        "border-gray-300",
      ]);
    });

    it("should categorize layout classes correctly", () => {
      const result = parser.parse("flex grid w-full h-screen block");
      const classes = result.getValue();
      const categorized = parser.categorize(classes);

      expect(categorized.layout).toHaveLength(5);
      expect(categorized.layout.map((c) => c.toString())).toEqual([
        "flex",
        "grid",
        "w-full",
        "h-screen",
        "block",
      ]);
    });

    it("should categorize typography classes correctly", () => {
      const result = parser.parse("text-lg font-bold leading-tight");
      const classes = result.getValue();
      const categorized = parser.categorize(classes);

      expect(categorized.typography).toHaveLength(3);
      expect(categorized.typography.map((c) => c.toString())).toEqual([
        "text-lg",
        "font-bold",
        "leading-tight",
      ]);
    });

    it("should categorize effects classes correctly", () => {
      const result = parser.parse("shadow-lg opacity-50 blur-sm");
      const classes = result.getValue();
      const categorized = parser.categorize(classes);

      expect(categorized.effects).toHaveLength(3);
      expect(categorized.effects.map((c) => c.toString())).toEqual([
        "shadow-lg",
        "opacity-50",
        "blur-sm",
      ]);
    });

    it("should put unknown classes in other category", () => {
      const result = parser.parse("custom-class unknown-utility");
      const classes = result.getValue();
      const categorized = parser.categorize(classes);

      expect(categorized.other).toHaveLength(2);
      expect(categorized.other.map((c) => c.toString())).toEqual([
        "custom-class",
        "unknown-utility",
      ]);
    });
  });

  describe("detectTailwindAvailability", () => {
    it("should return false when Tailwind is not available", () => {
      // デフォルトのモックでは Tailwind スタイルが適用されない
      const isAvailable = parser.detectTailwindAvailability();
      expect(isAvailable).toBe(false);
    });

    it("should return true when correct margin is applied", () => {
      // Tailwind の m-4 (16px) が適用された場合をモック
      mockDocument.getComputedStyle.mockReturnValue({
        marginTop: "16px",
        paddingTop: "0px",
        backgroundColor: "transparent",
      });

      const isAvailable = parser.detectTailwindAvailability();
      expect(isAvailable).toBe(true);
    });

    it("should return true when correct padding is applied", () => {
      // Tailwind の p-4 (16px) が適用された場合をモック
      mockDocument.getComputedStyle.mockReturnValue({
        marginTop: "0px",
        paddingTop: "16px",
        backgroundColor: "transparent",
      });

      const isAvailable = parser.detectTailwindAvailability();
      expect(isAvailable).toBe(true);
    });

    it("should return true when correct background color is applied", () => {
      // Tailwind の bg-red-500 が適用された場合をモック
      mockDocument.getComputedStyle.mockReturnValue({
        marginTop: "0px",
        paddingTop: "0px",
        backgroundColor: "rgb(239, 68, 68)",
      });

      const isAvailable = parser.detectTailwindAvailability();
      expect(isAvailable).toBe(true);
    });

    it("should handle DOM errors gracefully", () => {
      // DOM操作でエラーが発生した場合
      mockDocument.createElement.mockImplementation(() => {
        throw new Error("DOM error");
      });

      const isAvailable = parser.detectTailwindAvailability();
      expect(isAvailable).toBe(false);
    });

    it("should clean up test element", () => {
      parser.detectTailwindAvailability();

      // テスト要素が作成され、削除されることを確認
      expect(mockDocument.createElement).toHaveBeenCalledWith("div");
      expect(mockDocument.body.appendChild).toHaveBeenCalled();
      expect(mockDocument.body.removeChild).toHaveBeenCalled();
    });
  });
});
