/**
 * Cloudflare Workers AI integration for auto-replies, summaries, and intent detection.
 * Uses @cloudflare/ai package or direct REST API.
 */

export interface AIConfig {
  accountId: string;
  apiToken: string;
  model?: string;
}

export interface AutoReplyResult {
  reply: string;
  confidence: number;
  intent: string;
  shouldHandoff: boolean;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  sentiment: "positive" | "negative" | "neutral";
  nextAction: string;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
}

// ─── Workers AI Client ───

export class WorkersAI {
  private accountId: string;
  private apiToken: string;
  private model: string;

  constructor(config: AIConfig) {
    this.accountId = config.accountId;
    this.apiToken = config.apiToken;
    this.model = config.model || "@cf/meta/llama-3.1-8b-instruct";
  }

  private async inference(prompt: string, systemPrompt?: string): Promise<string> {
    const body: any = {
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
    };

    // Check if using fine-tuned or built-in model
    if (this.model.startsWith("@cf/")) {
      body.model = this.model;
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${this.model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Workers AI error: ${error}`);
    }

    const result = await response.json();
    return result.result?.response || result.result || "";
  }

  /**
   * Generate an auto-reply for a customer message.
   */
  async generateAutoReply(
    customerMessage: string,
    conversationHistory: Array<{ role: "customer" | "agent"; content: string }>,
    businessContext: string,
    knowledgeBase?: string[]
  ): Promise<AutoReplyResult> {
    const systemPrompt = `You are a customer support agent for a business. 
Be helpful, concise, and professional. 
If you cannot answer the question, say you'll transfer to a human agent.

Business context: ${businessContext}

${knowledgeBase?.length ? `Knowledge base:\n${knowledgeBase.join("\n")}` : ""}

IMPORTANT: Respond with a JSON object in this exact format:
{
  "reply": "your response to the customer",
  "confidence": 0.0-1.0,
  "intent": "support|sales|billing|technical|general",
  "shouldHandoff": false
}`;

    const history = conversationHistory
      .map((m) => `${m.role === "customer" ? "Customer" : "Agent"}: ${m.content}`)
      .join("\n");

    const prompt = `${history ? history + "\n" : ""}Customer: ${customerMessage}`;

    try {
      const response = await this.inference(prompt, systemPrompt);

      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reply: parsed.reply || "I'll connect you with a team member.",
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
          intent: parsed.intent || "general",
          shouldHandoff: parsed.shouldHandoff || (parsed.confidence || 0.5) < 0.3,
        };
      }

      // Fallback: use raw text as reply
      return {
        reply: response.trim() || "I'll connect you with a team member.",
        confidence: 0.5,
        intent: "general",
        shouldHandoff: false,
      };
    } catch (error) {
      console.error("AI auto-reply error:", error);
      return {
        reply: "I'll connect you with a team member who can help.",
        confidence: 0,
        intent: "general",
        shouldHandoff: true,
      };
    }
  }

  /**
   * Summarize a conversation.
   */
  async summarizeConversation(
    messages: Array<{ sender: string; content: string; timestamp: string }>
  ): Promise<SummaryResult> {
    const conversation = messages
      .map((m) => `[${m.timestamp}] ${m.sender}: ${m.content}`)
      .join("\n");

    const systemPrompt = `Summarize this customer support conversation.
Respond with JSON:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["point 1", "point 2"],
  "sentiment": "positive|negative|neutral",
  "nextAction": "what should happen next"
}`;

    try {
      const response = await this.inference(conversation, systemPrompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {
        summary: response.trim() || "No summary available",
        keyPoints: [],
        sentiment: "neutral",
        nextAction: "Review conversation",
      };
    } catch (error) {
      console.error("AI summarize error:", error);
      return {
        summary: "Summary generation failed",
        keyPoints: [],
        sentiment: "neutral",
        nextAction: "Manual review required",
      };
    }
  }

  /**
   * Detect intent from a message.
   */
  async detectIntent(message: string): Promise<IntentResult> {
    const systemPrompt = `Analyze this customer message and detect the intent.
Respond with JSON:
{
  "intent": "support|sales|billing|technical|general|complaint|inquiry",
  "confidence": 0.0-1.0,
  "entities": {"key": "value"}
}`;

    try {
      const response = await this.inference(message, systemPrompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { intent: "general", confidence: 0.5, entities: {} };
    } catch (error) {
      console.error("AI intent error:", error);
      return { intent: "general", confidence: 0, entities: {} };
    }
  }

  /**
   * Suggest replies based on a message.
   */
  async suggestReplies(
    message: string,
    businessContext: string,
    count: number = 3
  ): Promise<string[]> {
    const systemPrompt = `Generate ${count} brief, helpful reply suggestions for this customer message.
Business context: ${businessContext}
Respond with a JSON array of strings: ["reply1", "reply2", "reply3"]`;

    try {
      const response = await this.inference(message, systemPrompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return response.split("\n").filter((l: string) => l.trim()).slice(0, count);
    } catch (error) {
      console.error("AI suggest error:", error);
      return [];
    }
  }
}

// ─── Mock AI for local testing ───

export class MockAI extends WorkersAI {
  constructor() {
    super({ accountId: "mock", apiToken: "mock" });
  }

  async generateAutoReply(
    customerMessage: string,
    _history: any[],
    _context: string,
    _kb?: string[]
  ): Promise<AutoReplyResult> {
    // Simple keyword-based mock responses
    const lower = customerMessage.toLowerCase();

    if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
      return {
        reply: "Our pricing starts at $0/month for the free tier. Would you like to know more about our plans?",
        confidence: 0.85,
        intent: "sales",
        shouldHandoff: false,
      };
    }

    if (lower.includes("bug") || lower.includes("error") || lower.includes("broken")) {
      return {
        reply: "I'm sorry to hear you're experiencing issues. Let me connect you with our technical team.",
        confidence: 0.7,
        intent: "technical",
        shouldHandoff: true,
      };
    }

    if (lower.includes("cancel") || lower.includes("refund")) {
      return {
        reply: "I understand you'd like to discuss your account. Let me transfer you to a team member who can help.",
        confidence: 0.6,
        intent: "billing",
        shouldHandoff: true,
      };
    }

    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
      return {
        reply: "Hello! How can I help you today?",
        confidence: 0.95,
        intent: "general",
        shouldHandoff: false,
      };
    }

    if (lower.includes("thank")) {
      return {
        reply: "You're welcome! Is there anything else I can help with?",
        confidence: 0.9,
        intent: "general",
        shouldHandoff: false,
      };
    }

    return {
      reply: "Thanks for reaching out! I've received your message and will get back to you shortly. Is there anything specific I can help with?",
      confidence: 0.5,
      intent: "general",
      shouldHandoff: false,
    };
  }

  async summarizeConversation(
    messages: Array<{ sender: string; content: string }>
  ): Promise<SummaryResult> {
    const lastFew = messages.slice(-5).map((m) => m.content).join("; ");
    return {
      summary: `Customer conversation about: ${lastFew.substring(0, 200)}`,
      keyPoints: messages.slice(-3).map((m) => m.content.substring(0, 100)),
      sentiment: "neutral",
      nextAction: "Continue monitoring",
    };
  }

  async detectIntent(message: string): Promise<IntentResult> {
    const lower = message.toLowerCase();
    if (lower.includes("price") || lower.includes("buy")) return { intent: "sales", confidence: 0.8, entities: {} };
    if (lower.includes("bug") || lower.includes("error")) return { intent: "technical", confidence: 0.8, entities: {} };
    if (lower.includes("bill") || lower.includes("invoice")) return { intent: "billing", confidence: 0.8, entities: {} };
    return { intent: "general", confidence: 0.5, entities: {} };
  }

  async suggestReplies(message: string, _context: string, count: number = 3): Promise<string[]> {
    const replies = [
      "Thanks for reaching out! How can I help?",
      "I'd be happy to assist with that.",
      "Let me look into this for you.",
      "Could you provide more details?",
      "I'll get back to you shortly.",
    ];
    return replies.slice(0, count);
  }
}
