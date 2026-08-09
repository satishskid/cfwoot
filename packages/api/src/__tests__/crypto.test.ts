import { describe, it, expect } from "vitest";
import { encrypt, decrypt, generateApiKey, hashApiKey, verifyApiKey, hmacSign, hmacVerify } from "../lib/crypto";

describe("Crypto Utilities", () => {
  const secret = "test-secret-key-must-be-at-least-32-characters!";

  describe("encrypt/decrypt", () => {
    it("should encrypt and decrypt a string", async () => {
      const plaintext = "my-secret-access-token-12345";
      const encrypted = await encrypt(plaintext, secret);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = await decrypt(encrypted, secret);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertext for same plaintext (random salt/IV)", async () => {
      const plaintext = "same-text";
      const enc1 = await encrypt(plaintext, secret);
      const enc2 = await encrypt(plaintext, secret);
      expect(enc1).not.toBe(enc2);
    });

    it("should fail to decrypt with wrong secret", async () => {
      const encrypted = await encrypt("secret-data", secret);
      await expect(decrypt(encrypted, "wrong-secret")).rejects.toThrow();
    });
  });

  describe("API Keys", () => {
    it("should generate a key with prefix", () => {
      const key = generateApiKey("test");
      expect(key).toMatch(/^test_[a-f0-9]{64}$/);
    });

    it("should hash and verify an API key", async () => {
      const key = generateApiKey();
      const hash = await hashApiKey(key);
      expect(hash).toHaveLength(64);

      const valid = await verifyApiKey(key, hash);
      expect(valid).toBe(true);

      const invalid = await verifyApiKey("wrong-key", hash);
      expect(invalid).toBe(false);
    });
  });

  describe("HMAC", () => {
    it("should sign and verify data", async () => {
      const data = '{"event":"test","data":{}}';
      const secret = "webhook-secret";
      const signature = await hmacSign(data, secret);
      expect(signature).toHaveLength(64);

      const valid = await hmacVerify(data, signature, secret);
      expect(valid).toBe(true);
    });

    it("should reject tampered data", async () => {
      const signature = await hmacSign("original-data", "secret");
      const valid = await hmacVerify("tampered-data", signature, "secret");
      expect(valid).toBe(false);
    });

    it("should reject wrong secret", async () => {
      const signature = await hmacSign("data", "secret1");
      const valid = await hmacVerify("data", signature, "secret2");
      expect(valid).toBe(false);
    });
  });
});
