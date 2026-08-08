import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { conversations, messages, contacts } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

const conversationRoutes = new Hono<{ Bindings: Env }>();

// List conversations
conversationRoutes.get("/", async (c) => {
  const db = createDb(c.env);
  const accountId = c.req.query("accountId") || "1";
  const status = c.req.query("status");

  let query = db
    .select()
    .from(conversations)
    .where(eq(conversations.accountId, parseInt(accountId)))
    .orderBy(desc(conversations.lastActivityAt));

  if (status) {
    query = db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.accountId, parseInt(accountId)),
          eq(conversations.status, status)
        )
      )
      .orderBy(desc(conversations.lastActivityAt));
  }

  const result = await query;
  return c.json({ data: result });
});

// Get single conversation
conversationRoutes.get("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  return c.json({ data: result[0] });
});

// Create conversation
conversationRoutes.post("/", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();

  const result = await db.insert(conversations).values({
    uuid: crypto.randomUUID(),
    accountId: body.accountId || 1,
    inboxId: body.inboxId || 1,
    contactId: body.contactId,
    assigneeId: body.assigneeId,
    status: body.status || "open",
    priority: body.priority || "medium",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return c.json({ id: result.lastInsertRowid });
});

// Update conversation
conversationRoutes.put("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  await db
    .update(conversations)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id));

  return c.json({ success: true });
});

// Get conversation messages
conversationRoutes.get("/:id/messages", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const limit = parseInt(c.req.query("limit") || "50");
  const before = c.req.query("before");

  let query = db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  const result = await query;
  return c.json({ data: result.reverse() });
});

export { conversationRoutes };
