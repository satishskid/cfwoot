import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { apiKeys } from "../db/schema/webhooks";
import { contacts } from "../db/schema/contacts";
import { conversations } from "../db/schema/conversations";
import { messages } from "../db/schema/messages";
import { eq, and, desc } from "drizzle-orm";
import { verifyApiKey } from "../lib/crypto";

const publicRoutes = new Hono<{ Bindings: Env }>();

/**
 * Public REST API with API key authentication.
 * Endpoints are scoped — keys can be limited to read, write, or admin.
 */

// Rate limiter: simple in-memory per-key (works for single-instance)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 120; // requests per minute

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Auth middleware — extract and verify API key
publicRoutes.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" } }, 401);
  }

  const rawKey = authHeader.substring(7);
  const db = createDb(c.env);

  // Find key by prefix (first 12 chars)
  const prefix = rawKey.substring(0, 12);
  const keys = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyPrefix, prefix), eq(apiKeys.isActive, true)));

  if (keys.length === 0) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Invalid API key" } }, 401);
  }

  const keyRecord = keys[0];

  // Verify full key
  const valid = await verifyApiKey(rawKey, keyRecord.keyHash);
  if (!valid) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Invalid API key" } }, 401);
  }

  // Check expiry
  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    return c.json({ error: { code: "KEY_EXPIRED", message: "API key has expired" } }, 401);
  }

  // Rate limit
  if (!checkRateLimit(rawKey)) {
    return c.json({ error: { code: "RATE_LIMITED", message: "Rate limit exceeded (120/min)" } }, 429);
  }

  // Update last used
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyRecord.id));

  // Attach to context
  c.set("apiKey", keyRecord);
  c.set("accountId", keyRecord.accountId);

  await next();
});

// Identity probe
publicRoutes.get("/me", async (c) => {
  const key = c.get("apiKey");
  return c.json({
    data: {
      account_id: key.accountId,
      key_name: key.name,
      scopes: key.scopes,
    },
  });
});

// --- Contacts ---

publicRoutes.get("/contacts", async (c) => {
  const db = createDb(c.env);
  const accountId = c.get("accountId");
  const search = c.req.query("search");
  const tag = c.req.query("tag");

  let query = db.select().from(contacts).where(eq(contacts.accountId, accountId));
  // Note: Drizzle doesn't support dynamic where easily in SQLite, so we fetch all and filter
  const allContacts = await query;

  let filtered = allContacts;
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (ct) =>
        ct.name?.toLowerCase().includes(s) ||
        ct.phone?.toLowerCase().includes(s) ||
        ct.email?.toLowerCase().includes(s)
    );
  }

  return c.json({ data: filtered });
});

publicRoutes.post("/contacts", async (c) => {
  const db = createDb(c.env);
  const accountId = c.get("accountId");
  const body = await c.req.json();
  const { name, phone, email, identifier, contactType, customAttributes } = body;

  const [contact] = await db
    .insert(contacts)
    .values({
      accountId,
      name,
      phone,
      email,
      identifier,
      contactType: contactType || "visitor",
      customAttributes: customAttributes || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return c.json({ data: contact }, 201);
});

publicRoutes.get("/contacts/:id", async (c) => {
  const db = createDb(c.env);
  const accountId = c.get("accountId");
  const id = Number(c.req.param("id"));

  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.accountId, accountId)));

  if (!contact) {
    return c.json({ error: { code: "NOT_FOUND", message: "Contact not found" } }, 404);
  }

  return c.json({ data: contact });
});

publicRoutes.patch("/contacts/:id", async (c) => {
  const db = createDb(c.env);
  const accountId = c.get("accountId");
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  await db
    .update(contacts)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(contacts.id, id), eq(contacts.accountId, accountId)));

  return c.json({ success: true });
});

// --- Conversations ---

publicRoutes.get("/conversations", async (c) => {
  const db = createDb(c.env);
  const accountId = c.get("accountId");

  const convos = await db
    .select()
    .from(conversations)
    .where(eq(conversations.accountId, accountId))
    .orderBy(desc(conversations.lastActivityAt));

  return c.json({ data: convos });
});

publicRoutes.get("/conversations/:id", async (c) => {
  const db = createDb(c.env);
  const accountId = c.get("accountId");
  const id = Number(c.req.param("id"));

  const [convo] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.accountId, accountId)));

  if (!convo) {
    return c.json({ error: { code: "NOT_FOUND", message: "Conversation not found" } }, 404);
  }

  return c.json({ data: convo });
});

publicRoutes.get("/conversations/:id/messages", async (c) => {
  const db = createDb(c.env);
  const accountId = c.get("accountId");
  const id = Number(c.req.param("id"));

  const msgs = await db
    .select()
    .from(messages)
    .where(and(eq(messages.conversationId, id), eq(messages.accountId, accountId)))
    .orderBy(desc(messages.createdAt));

  return c.json({ data: msgs });
});

// --- Messages ---

publicRoutes.post("/messages", async (c) => {
  const db = createDb(c.env);
  const accountId = c.get("accountId");
  const body = await c.req.json();
  const { to, message, conversationId } = body;

  // Delegate to WhatsApp send (this would call the internal whatsapp send endpoint)
  // For now, store directly
  if (conversationId) {
    const [msg] = await db
      .insert(messages)
      .values({
        conversationId,
        accountId,
        messageType: "outgoing",
        contentType: "text",
        content: message,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return c.json({ data: msg }, 201);
  }

  return c.json({ error: { code: "BAD_REQUEST", message: "conversationId is required" } }, 400);
});

export { publicRoutes };
