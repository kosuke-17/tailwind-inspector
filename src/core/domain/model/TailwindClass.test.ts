import { describe, it, expect } from "vitest";
import { TailwindClass } from "./TailwindClass";

describe("TailwindClass", () => {
  describe("parse", () => {
    it("should extract valid Tailwind classes", () => {
      const className = "bg-red-500 text-white p-4 hover:bg-red-600 custom-class";
      const result = TailwindClass.parse(className).map((c) => c.toString()).join(" ");
      expect(result).toBe("bg-red-500 text-white p-4 hover:bg-red-600 custom-class");
    });

    it("should filter out invalid class names", () => {
      const className = "bg-red-500 @invalid!class text-white p-4";
      const result = TailwindClass.parse(className).map((c) => c.toString()).join(" ");
      expect(result).toBe("bg-red-500 text-white p-4");
    });

    it("should handle empty or null input", () => {
      expect(TailwindClass.parse("")).toEqual([]);
      expect(TailwindClass.parse(null as any)).toEqual([]);
      expect(TailwindClass.parse(undefined as any)).toEqual([]);
    });

    it("should handle responsive and pseudo-class prefixes", () => {
      const className = "sm:bg-blue-500 md:text-lg lg:p-8 hover:scale-105 focus:ring-2";
      const result = TailwindClass.parse(className).map((c) => c.toString()).join(" ");
      expect(result).toBe("sm:bg-blue-500 md:text-lg lg:p-8 hover:scale-105 focus:ring-2");
    });
  });
});
