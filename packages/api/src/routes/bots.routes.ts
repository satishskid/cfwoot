import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { botFlows, botExecutions } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

const botRoutes = new Hono<{ Bindings: Env }>();

// List bots
botRoutes.get("/", async (c) => {
  const db = createDb(c.env);
  const accountId = c.req.query("accountId") || "1";

  const result = await db
    .select()
    .from(botFlows)
    .where(eq(botFlows.accountId, parseInt(accountId)))
    .orderBy(desc(botFlows.updatedAt));

  return c.json({ data: result });
});

// Get single bot
botRoutes.get("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(botFlows)
    .where(eq(botFlows.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: "Bot not found" }, 404);
  }

  return c.json({ data: result[0] });
});

// Create bot
botRoutes.post("/", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();

  const result = await db.insert(botFlows).values({
    accountId: body.accountId || 1,
    name: body.name,
    description: body.description,
    trigger: body.trigger,
    triggerValue: body.triggerValue,
    nodes: body.nodes || [],
    edges: body.edges || [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return c.json({ id: result.lastInsertRowid });
});

// Update bot
botRoutes.put("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  await db
    .update(botFlows)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(botFlows.id, id));

  return c.json({ success: true });
});

// Delete bot
botRoutes.delete("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  await db.delete(botFlows).where(eq(botFlows.id, id));
  return c.json({ success: true });
});

// Activate bot
botRoutes.post("/:id/activate", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  await db
    .update(botFlows)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(botFlows.id, id));

  return c.json({ success: true });
});

// Deactivate bot
botRoutes.post("/:id/deactivate", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  await db
    .update(botFlows)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(botFlows.id, id));

  return c.json({ success: true });
});

// Test bot
botRoutes.post("/:id/test", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  // Create test execution
  const result = await db.insert(botExecutions).values({
    botFlowId: id,
    conversationId: body.conversationId || 0,
    currentNode: "start",
    state: {},
    status: "running",
    startedAt: new Date(),
  });

  return c.json({
    success: true,
    executionId: result.lastInsertRowid,
    message: "Test execution started",
  });
});

// Get bot executions
botRoutes.get("/:id/executions", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(botExecutions)
    .where(eq(botExecutions.botFlowId, id))
    .orderBy(desc(botExecutions.startedAt))
    .limit(50);

  return c.json({ data: result });
});

export { botRoutes };
