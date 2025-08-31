import { describe, it, expect } from "vitest";
import { TailwindClass } from "../TailwindClass";

describe("TailwindClass", () => {
  describe("parse", () => {
    it("should parse simple classes correctly", () => {
      const classes = TailwindClass.parse("m-2 p-4 bg-red-500");

      expect(classes).toHaveLength(3);
      expect(classes[0].toString()).toBe("m-2");
      expect(classes[1].toString()).toBe("p-4");
      expect(classes[2].toString()).toBe("bg-red-500");
    });

    it("should parse responsive variants correctly", () => {
      const classes = TailwindClass.parse("sm:p-4 lg:bg-red-500");

      expect(classes).toHaveLength(2);
      expect(classes[0].hasVariant).toBe(true);
      expect(classes[0].variantName).toBe("sm");
      expect(classes[0].baseClass).toBe("p-4");
      expect(classes[1].variantName).toBe("lg");
      expect(classes[1].baseClass).toBe("bg-red-500");
    });

    it("should parse pseudo-class variants correctly", () => {
      const classes = TailwindClass.parse("hover:bg-blue-500 focus:ring-2");

      expect(classes).toHaveLength(2);
      expect(classes[0].variantName).toBe("hover");
      expect(classes[1].variantName).toBe("focus");
    });

    it("should handle empty or invalid input", () => {
      expect(TailwindClass.parse("")).toEqual([]);
      expect(TailwindClass.parse("   ")).toEqual([]);
      expect(TailwindClass.parse("@invalid!class")).toEqual([]);
    });

    it("should filter out invalid class names", () => {
      const classes = TailwindClass.parse(
        "bg-red-500 @invalid!class text-white"
      );

      expect(classes).toHaveLength(2);
      expect(classes[0].toString()).toBe("bg-red-500");
      expect(classes[1].toString()).toBe("text-white");
    });
  });

  describe("cssProperty detection", () => {
    it("should detect margin properties", () => {
      const marginClasses = [
        new TailwindClass("m-2"),
        new TailwindClass("mx-4"),
        new TailwindClass("my-2"),
        new TailwindClass("mt-1"),
        new TailwindClass("mr-3"),
        new TailwindClass("mb-5"),
        new TailwindClass("ml-6"),
      ];

      marginClasses.forEach((cls) => {
        expect(cls.cssProperty).toBe("margin");
        expect(cls.isMargin).toBe(true);
      });
    });

    it("should detect padding properties", () => {
      const paddingClasses = [
        new TailwindClass("p-2"),
        new TailwindClass("px-4"),
        new TailwindClass("py-2"),
        new TailwindClass("pt-1"),
        new TailwindClass("pr-3"),
        new TailwindClass("pb-5"),
        new TailwindClass("pl-6"),
      ];

      paddingClasses.forEach((cls) => {
        expect(cls.cssProperty).toBe("padding");
        expect(cls.isPadding).toBe(true);
      });
    });

    it("should detect color properties", () => {
      const colorClasses = [
        new TailwindClass("bg-red-500"),
        new TailwindClass("text-blue-600"),
      ];

      expect(colorClasses[0].cssProperty).toBe("background");
      expect(colorClasses[0].isColor).toBe(true);
      expect(colorClasses[1].cssProperty).toBe("color");
      expect(colorClasses[1].isColor).toBe(true);
    });

    it("should detect gap properties", () => {
      const gapClass = new TailwindClass("gap-4");
      expect(gapClass.cssProperty).toBe("gap");
    });
  });

  describe("extractNumericValue", () => {
    it("should extract correct numeric values for standard scale", () => {
      const testCases = [
        { class: "m-0", expected: 0 },
        { class: "m-1", expected: 4 },
        { class: "m-2", expected: 8 },
        { class: "m-3", expected: 12 },
        { class: "m-4", expected: 16 },
        { class: "p-6", expected: 24 },
        { class: "gap-8", expected: 32 },
        { class: "mx-10", expected: 40 },
      ];

      testCases.forEach(({ class: className, expected }) => {
        const cls = new TailwindClass(className);
        expect(cls.extractNumericValue()).toBe(expected);
      });
    });

    it("should handle variant prefixes", () => {
      const cls = new TailwindClass("sm:m-4", "sm");
      expect(cls.extractNumericValue()).toBe(16);
    });

    it("should return 0 for non-numeric classes", () => {
      const cls = new TailwindClass("bg-red-500");
      expect(cls.extractNumericValue()).toBe(0);
    });
  });

  describe("getPriority", () => {
    it("should assign higher priority to responsive variants", () => {
      const baseClass = new TailwindClass("m-4");
      const smClass = new TailwindClass("sm:m-4", "sm");
      const lgClass = new TailwindClass("lg:m-4", "lg");

      expect(smClass.getPriority()).toBeGreaterThan(baseClass.getPriority());
      expect(lgClass.getPriority()).toBeGreaterThan(smClass.getPriority());
    });

    it("should assign priority to state variants", () => {
      const baseClass = new TailwindClass("bg-blue-500");
      const hoverClass = new TailwindClass("hover:bg-blue-600", "hover");

      expect(hoverClass.getPriority()).toBeGreaterThan(baseClass.getPriority());
    });
  });

  describe("validation", () => {
    it("should throw error for invalid class names", () => {
      expect(() => new TailwindClass("")).toThrow(
        "TailwindClass value must be a non-empty string"
      );
      expect(() => new TailwindClass("@invalid!")).toThrow(
        "Invalid Tailwind class format"
      );
    });
  });

  describe("equality", () => {
    it("should correctly compare TailwindClass instances", () => {
      const class1 = new TailwindClass("m-4");
      const class2 = new TailwindClass("m-4");
      const class3 = new TailwindClass("p-4");

      expect(class1.equals(class2)).toBe(true);
      expect(class1.equals(class3)).toBe(false);
    });
  });
});
