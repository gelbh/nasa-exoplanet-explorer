/**
 * Tests for accessibility utilities
 */
import {
  prefersReducedMotion,
  prefersHighContrast,
  getAnimationDuration,
  createSROnlyText,
} from "../accessibility";

describe("Accessibility Utilities", () => {
  describe("prefersReducedMotion", () => {
    test("should return boolean", () => {
      const result = prefersReducedMotion();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("prefersHighContrast", () => {
    test("should return boolean", () => {
      const result = prefersHighContrast();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getAnimationDuration", () => {
    test("should return 0 if reduced motion is preferred", () => {
      // Mock matchMedia
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      const duration = getAnimationDuration(1000);
      expect(duration).toBe(0);
    });

    test("should return default duration if reduced motion is not preferred", () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      const duration = getAnimationDuration(1000);
      expect(duration).toBe(1000);
    });
  });

  describe("createSROnlyText", () => {
    test("should create element with correct class", () => {
      const element = createSROnlyText("Test text");
      expect(element.className).toBe("sr-only");
      expect(element.textContent).toBe("Test text");
    });

    test("should create a span element", () => {
      const element = createSROnlyText("Test");
      expect(element.tagName).toBe("SPAN");
    });
  });
});
