import { describe, it, expect } from "vitest";
import { validateUrlSafety, validateUrlSafetyStrict } from "../lib/ssrf";

describe("SSRF Protection", () => {
  describe("validateUrlSafety", () => {
    it("should reject non-HTTPS URLs", async () => {
      const result = await validateUrlSafety("http://example.com/webhook");
      expect(result.safe).toBe(false);
    });

    it("should reject localhost", async () => {
      const result = await validateUrlSafety("https://localhost/webhook");
      expect(result.safe).toBe(false);
    });

    it("should reject 127.0.0.1", async () => {
      const result = await validateUrlSafety("https://127.0.0.1/webhook");
      expect(result.safe).toBe(false);
    });

    it("should reject metadata endpoints", async () => {
      const result = await validateUrlSafety("https://169.254.169.254/latest/meta-data");
      expect(result.safe).toBe(false);
    });

    it("should accept valid public URLs", async () => {
      const result = await validateUrlSafety("https://example.com/webhook");
      expect(result.safe).toBe(true);
    });

    it("should reject invalid URLs", async () => {
      const result = await validateUrlSafety("not-a-url");
      expect(result.safe).toBe(false);
    });
  });

  describe("validateUrlSafetyStrict", () => {
    it("should reject private IP addresses directly", async () => {
      const result = await validateUrlSafetyStrict("https://192.168.1.1/webhook");
      expect(result.safe).toBe(false);
    });

    it("should reject 10.x.x.x", async () => {
      const result = await validateUrlSafetyStrict("https://10.0.0.1/webhook");
      expect(result.safe).toBe(false);
    });

    it("should reject 172.16.x.x", async () => {
      const result = await validateUrlSafetyStrict("https://172.16.0.1/webhook");
      expect(result.safe).toBe(false);
    });

    it("should accept public IPs", async () => {
      const result = await validateUrlSafetyStrict("https://8.8.8.8/webhook");
      expect(result.safe).toBe(true);
    });
  });
});
