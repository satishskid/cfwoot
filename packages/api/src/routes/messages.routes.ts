import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { messages, conversations } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

const messageRoutes = new Hono<{ Bindings: Env }>();

// List messages for a conversation
messageRoutes.get("/", async (c) => {
  const db = createDb(c.env);
  const conversationId = c.req.query("conversationId");

  if (!conversationId) {
    return c.json({ error: "conversationId required" }, 400);
  }

  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, parseInt(conversationId)))
    .orderBy(desc(messages.createdAt))
    .limit(100);

  return c.json({ data: result.reverse() });
});

// Send message
messageRoutes.post("/", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();

  const result = await db.insert(messages).values({
    conversationId: body.conversationId,
    accountId: body.accountId || 1,
    messageType: body.messageType || "outgoing",
    contentType: body.contentType || "text",
    content: body.content,
    contentAttributes: body.contentAttributes || {},
    sourceId: body.sourceId,
    private: body.private || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Update conversation last activity
  await db
    .update(conversations)
    .set({
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, body.conversationId));

  return c.json({ id: result.lastInsertRowid });
});

// Get single message
messageRoutes.get("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: "Message not found" }, 404);
  }

  return c.json({ data: result[0] });
});

export { messageRoutes };
