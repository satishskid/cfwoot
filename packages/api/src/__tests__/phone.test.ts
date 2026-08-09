import { describe, it, expect } from "vitest";
import { normalizePhone, generatePhoneVariants, isValidPhone, phonesMatch } from "../lib/phone";

describe("Phone Utilities", () => {
  describe("normalizePhone", () => {
    it("should strip non-digit characters", () => {
      expect(normalizePhone("+1 (555) 123-4567")).toBe("15551234567");
    });

    it("should remove leading zeros", () => {
      expect(normalizePhone("0919876543210")).toBe("919876543210");
    });

    it("should handle already normalized input", () => {
      expect(normalizePhone("919876543210")).toBe("919876543210");
    });
  });

  describe("generatePhoneVariants", () => {
    it("should generate variants with + prefix", () => {
      const variants = generatePhoneVariants("919876543210");
      expect(variants).toContain("919876543210");
      expect(variants).toContain("+919876543210");
    });

    it("should handle input with + prefix", () => {
      const variants = generatePhoneVariants("+919876543210");
      expect(variants).toContain("919876543210");
      expect(variants).toContain("+919876543210");
    });

    it("should generate 0-prefixed variant", () => {
      const variants = generatePhoneVariants("919876543210");
      expect(variants).toContain("0919876543210");
    });
  });

  describe("isValidPhone", () => {
    it("should accept valid phones", () => {
      expect(isValidPhone("919876543210")).toBe(true);
      expect(isValidPhone("+15551234567")).toBe(true);
    });

    it("should reject too short phones", () => {
      expect(isValidPhone("123")).toBe(false);
    });
  });

  describe("phonesMatch", () => {
    it("should match formatted vs unformatted", () => {
      expect(phonesMatch("+1 (555) 123-4567", "15551234567")).toBe(true);
    });

    it("should not match different numbers", () => {
      expect(phonesMatch("15551234567", "15551234568")).toBe(false);
    });
  });
});
