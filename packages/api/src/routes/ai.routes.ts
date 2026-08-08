import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { knowledgeArticles, aiConversations, conversationSummaries, messages } from "../db/schema";
import { eq, and, desc, like } from "drizzle-orm";

const aiRoutes = new Hono<{ Bindings: Env }>();

// List knowledge articles
aiRoutes.get("/knowledge", async (c) => {
  const db = createDb(c.env);
  const accountId = c.req.query("accountId") || "1";
  const category = c.req.query("category");
  const search = c.req.query("search");

  let conditions = [eq(knowledgeArticles.accountId, parseInt(accountId))];
  if (category) conditions.push(eq(knowledgeArticles.category, category));
  if (search) conditions.push(like(knowledgeArticles.title, `%${search}%`));

  const result = await db
    .select()
    .from(knowledgeArticles)
    .where(and(...conditions))
    .orderBy(desc(knowledgeArticles.updatedAt));

  return c.json({ data: result });
});

// Create knowledge article
aiRoutes.post("/knowledge", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();

  const result = await db.insert(knowledgeArticles).values({
    accountId: body.accountId || 1,
    title: body.title,
    content: body.content,
    category: body.category,
    embedding: body.embedding,
    isActive: body.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return c.json({ id: result.lastInsertRowid });
});

// Update knowledge article
aiRoutes.put("/knowledge/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  await db
    .update(knowledgeArticles)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(knowledgeArticles.id, id));

  return c.json({ success: true });
});

// Delete knowledge article
aiRoutes.delete("/knowledge/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  await db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, id));
  return c.json({ success: true });
});

// Search knowledge base
aiRoutes.post("/knowledge/search", async (c) => {
  const db = createDb(c.env);
  const { query, accountId } = await c.req.json();

  const result = await db
    .select()
    .from(knowledgeArticles)
    .where(
      and(
        eq(knowledgeArticles.accountId, accountId || 1),
        eq(knowledgeArticles.isActive, true),
        like(knowledgeArticles.content, `%${query}%`)
      )
    )
    .limit(5);

  return c.json({ data: result });
});

// Get AI reply suggestions
aiRoutes.post("/suggest", async (c) => {
  const db = createDb(c.env);
  const { conversationId, messageId } = await c.req.json();

  // Get recent messages for context
  const recentMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(10);

  // Search knowledge base for relevant articles
  const lastMessage = recentMessages[0];
  let suggestions: string[] = [];

  if (lastMessage?.content) {
    const knowledgeResults = await db
      .select()
      .from(knowledgeArticles)
      .where(
        and(
          eq(knowledgeArticles.isActive, true),
          like(knowledgeArticles.content, `%${lastMessage.content.slice(0, 50)}%`)
        )
      )
      .limit(3);

    if (knowledgeResults.length > 0) {
      suggestions = knowledgeResults.map((k) => k.content.slice(0, 200));
    }
  }

  // Store suggestions
  if (conversationId) {
    await db.insert(aiConversations).values({
      conversationId,
      accountId: 1,
      suggestedReplies: suggestions,
      aiConfidence: suggestions.length > 0 ? 80 : 20,
      createdAt: new Date(),
    });
  }

  return c.json({ suggestions });
});

// Summarize conversation
aiRoutes.post("/summarize", async (c) => {
  const db = createDb(c.env);
  const { conversationId } = await c.req.json();

  const conversationMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(50);

  // Simple summary generation (in production, use Workers AI)
  const messageCount = conversationMessages.length;
  const userMessages = conversationMessages.filter((m) => m.messageType === "incoming");
  const agentMessages = conversationMessages.filter((m) => m.messageType === "outgoing");

  const summary = `Conversation with ${messageCount} messages. ${userMessages.length} customer messages, ${agentMessages.length} agent responses.`;
  const keyPoints = [
    `${messageCount} total messages exchanged`,
    `Customer initiated ${userMessages.length > 0 ? "the conversation" : "follow-ups"}`,
    `Agent responded ${agentMessages.length} times`,
  ];

  const sentiment = userMessages.length > agentMessages.length ? "needs_attention" : "balanced";

  const result = await db.insert(conversationSummaries).values({
    conversationId,
    summary,
    keyPoints,
    sentiment,
    createdAt: new Date(),
  });

  return c.json({
    id: result.lastInsertRowid,
    summary,
    keyPoints,
    sentiment,
  });
});

// Analyze message intent
aiRoutes.post("/analyze", async (c) => {
  const db = createDb(c.env);
  const { message } = await c.req.json();

  // Simple intent analysis
  const lowerMessage = (message || "").toLowerCase();
  let intent = "general";
  let confidence = 50;

  if (lowerMessage.includes("order") || lowerMessage.includes("delivery")) {
    intent = "order_inquiry";
    confidence = 85;
  } else if (lowerMessage.includes("refund") || lowerMessage.includes("return")) {
    intent = "refund_request";
    confidence = 90;
  } else if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
    intent = "support_request";
    confidence = 80;
  } else if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
    intent = "pricing_inquiry";
    confidence = 75;
  } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    intent = "greeting";
    confidence = 95;
  }

  return c.json({ intent, confidence });
});

export { aiRoutes };
