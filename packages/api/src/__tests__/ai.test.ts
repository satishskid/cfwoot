import { describe, it, expect } from "vitest";
import { MockAI } from "../lib/ai";

describe("AI Integration", () => {
  const mockAI = new MockAI();

  describe("generateAutoReply", () => {
    it("should reply to price questions", async () => {
      const result = await mockAI.generateAutoReply("What is your pricing?", [], "Test business");
      expect(result.reply).toContain("$0");
      expect(result.intent).toBe("sales");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should handoff bug reports", async () => {
      const result = await mockAI.generateAutoReply("There's a bug in the app", [], "Test business");
      expect(result.intent).toBe("technical");
      expect(result.shouldHandoff).toBe(true);
    });

    it("should handle greetings", async () => {
      const result = await mockAI.generateAutoReply("Hello!", [], "Test business");
      expect(result.reply).toContain("Hello");
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it("should handle thanks", async () => {
      const result = await mockAI.generateAutoReply("Thank you!", [], "Test business");
      expect(result.reply).toContain("welcome");
    });

    it("should handoff cancellation requests", async () => {
      const result = await mockAI.generateAutoReply("I want to cancel my account", [], "Test business");
      expect(result.intent).toBe("billing");
      expect(result.shouldHandoff).toBe(true);
    });
  });

  describe("detectIntent", () => {
    it("should detect sales intent", async () => {
      const result = await mockAI.detectIntent("How much does it cost?");
      expect(result.intent).toBe("sales");
    });

    it("should detect technical intent", async () => {
      const result = await mockAI.detectIntent("I found a bug");
      expect(result.intent).toBe("technical");
    });

    it("should detect general intent", async () => {
      const result = await mockAI.detectIntent("Hello there");
      expect(result.intent).toBe("general");
    });
  });

  describe("suggestReplies", () => {
    it("should return suggested replies", async () => {
      const replies = await mockAI.suggestReplies("Help me", "Test", 3);
      expect(replies).toHaveLength(3);
      replies.forEach((r) => expect(typeof r).toBe("string"));
    });
  });

  describe("summarizeConversation", () => {
    it("should summarize messages", async () => {
      const result = await mockAI.summarizeConversation([
        { sender: "Customer", content: "I need help with my order", timestamp: "2026-01-01" },
        { sender: "Agent", content: "Sure, what's your order number?", timestamp: "2026-01-01" },
      ]);
      expect(result.summary).toBeTruthy();
      expect(result.keyPoints).toBeInstanceOf(Array);
      expect(["positive", "negative", "neutral"]).toContain(result.sentiment);
    });
  });
});
