import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { whatsappFlows, flowResponses } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

const flowRoutes = new Hono<{ Bindings: Env }>();

// List flows
flowRoutes.get("/", async (c) => {
  const db = createDb(c.env);
  const accountId = c.req.query("accountId") || "1";
  const status = c.req.query("status");

  let conditions = [eq(whatsappFlows.accountId, parseInt(accountId))];
  if (status) conditions.push(eq(whatsappFlows.status, status as any));

  const result = await db
    .select()
    .from(whatsappFlows)
    .where(and(...conditions))
    .orderBy(desc(whatsappFlows.updatedAt));

  return c.json({ data: result });
});

// Get single flow
flowRoutes.get("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(whatsappFlows)
    .where(eq(whatsappFlows.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: "Flow not found" }, 404);
  }

  return c.json({ data: result[0] });
});

// Create flow
flowRoutes.post("/", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();

  const result = await db.insert(whatsappFlows).values({
    accountId: body.accountId || 1,
    metaFlowId: body.metaFlowId,
    name: body.name,
    description: body.description,
    screens: body.screens || [],
    status: "draft",
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return c.json({ id: result.lastInsertRowid });
});

// Update flow
flowRoutes.put("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  await db
    .update(whatsappFlows)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(whatsappFlows.id, id));

  return c.json({ success: true });
});

// Delete flow
flowRoutes.delete("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  await db.delete(whatsappFlows).where(eq(whatsappFlows.id, id));
  return c.json({ success: true });
});

// Publish flow to Meta
flowRoutes.post("/:id/publish", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  // In production, call Meta API to publish flow
  const metaFlowId = `flow_${Date.now()}`;

  await db
    .update(whatsappFlows)
    .set({
      metaFlowId,
      status: "published",
      updatedAt: new Date(),
    })
    .where(eq(whatsappFlows.id, id));

  return c.json({ success: true, metaFlowId });
});

// Send flow to contact
flowRoutes.post("/:id/send", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  // In production, call Meta API to send flow
  return c.json({
    success: true,
    message: "Flow sent successfully",
    flowId: id,
    contactId: body.contactId,
  });
});

// Get flow responses
flowRoutes.get("/:id/responses", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(flowResponses)
    .where(eq(flowResponses.flowId, id))
    .orderBy(desc(flowResponses.createdAt));

  return c.json({ data: result });
});

export { flowRoutes };
