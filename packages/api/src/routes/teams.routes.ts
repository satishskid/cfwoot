import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { teams, teamMembers, slaPolicies, slaBreaches } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

const teamRoutes = new Hono<{ Bindings: Env }>();

// List teams
teamRoutes.get("/", async (c) => {
  const db = createDb(c.env);
  const accountId = c.req.query("accountId") || "1";

  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.accountId, parseInt(accountId)))
    .orderBy(desc(teams.createdAt));

  return c.json({ data: result });
});

// Create team
teamRoutes.post("/", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();

  const result = await db.insert(teams).values({
    accountId: body.accountId || 1,
    name: body.name,
    description: body.description,
    color: body.color,
    createdAt: new Date(),
  });

  return c.json({ id: result.lastInsertRowid });
});

// Update team
teamRoutes.put("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  await db.update(teams).set(body).where(eq(teams.id, id));
  return c.json({ success: true });
});

// Delete team
teamRoutes.delete("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
  await db.delete(teams).where(eq(teams.id, id));
  return c.json({ success: true });
});

// Add member to team
teamRoutes.post("/:id/members", async (c) => {
  const db = createDb(c.env);
  const teamId = parseInt(c.req.param("id"));
  const body = await c.req.json();

  const result = await db.insert(teamMembers).values({
    teamId,
    userId: body.userId,
    role: body.role || "agent",
    createdAt: new Date(),
  });

  return c.json({ id: result.lastInsertRowid });
});

// Remove member from team
teamRoutes.delete("/:id/members/:userId", async (c) => {
  const db = createDb(c.env);
  const teamId = parseInt(c.req.param("id"));
  const userId = parseInt(c.req.param("userId"));

  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));

  return c.json({ success: true });
});

// Get team members
teamRoutes.get("/:id/members", async (c) => {
  const db = createDb(c.env);
  const teamId = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  return c.json({ data: result });
});

export { teamRoutes };

// SLA Routes
const slaRoutes = new Hono<{ Bindings: Env }>();

// List SLA policies
slaRoutes.get("/", async (c) => {
  const db = createDb(c.env);
  const accountId = c.req.query("accountId") || "1";

  const result = await db
    .select()
    .from(slaPolicies)
    .where(eq(slaPolicies.accountId, parseInt(accountId)))
    .orderBy(desc(slaPolicies.createdAt));

  return c.json({ data: result });
});

// Create SLA policy
slaRoutes.post("/", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();

  const result = await db.insert(slaPolicies).values({
    accountId: body.accountId || 1,
    name: body.name,
    description: body.description,
    firstResponseMinutes: body.firstResponseMinutes,
    resolutionMinutes: body.resolutionMinutes,
    priority: body.priority,
    isActive: true,
    createdAt: new Date(),
  });

  return c.json({ id: result.lastInsertRowid });
});

// Update SLA policy
slaRoutes.put("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  await db.update(slaPolicies).set(body).where(eq(slaPolicies.id, id));
  return c.json({ success: true });
});

// Delete SLA policy
slaRoutes.delete("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  await db.delete(slaPolicies).where(eq(slaPolicies.id, id));
  return c.json({ success: true });
});

// Get SLA breaches
slaRoutes.get("/breaches", async (c) => {
  const db = createDb(c.env);
  const conversationId = c.req.query("conversationId");

  let query = db.select().from(slaBreaches).orderBy(desc(slaBreaches.breachedAt));

  if (conversationId) {
    query = db
      .select()
      .from(slaBreaches)
      .where(eq(slaBreaches.conversationId, parseInt(conversationId)))
      .orderBy(desc(slaBreaches.breachedAt));
  }

  const result = await query;
  return c.json({ data: result });
});

export { slaRoutes };
