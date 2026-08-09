import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { apiKeys } from "../db/schema/webhooks";
import { generateApiKey, hashApiKey } from "../lib/crypto";
import { eq, and } from "drizzle-orm";

const apiKeyRoutes = new Hono<{ Bindings: Env }>();

// List API keys
apiKeyRoutes.get("/", async (c) => {
  const db = createDb(c.env);
  const accountId = 1; // TODO: get from auth

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.accountId, accountId));

  return c.json({ data: keys });
});

// Create API key
apiKeyRoutes.post("/", async (c) => {
  const db = createDb(c.env);
  const accountId = 1; // TODO: get from auth
  const body = await c.req.json();

  const { name, scopes, expiresAt } = body;

  const rawKey = generateApiKey();
  const keyHash = await hashApiKey(rawKey);
  const keyPrefix = rawKey.substring(0, 12);

  const [key] = await db
    .insert(apiKeys)
    .values({
      accountId,
      name,
      keyHash,
      keyPrefix,
      scopes: scopes || ["read"],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date(),
    })
    .returning();

  // Return the raw key ONCE — user must save it
  return c.json({
    data: {
      ...key,
      key: rawKey, // Only shown once
    },
    message: "Save this key now — it won't be shown again",
  });
});

// Revoke API key
apiKeyRoutes.delete("/:id", async (c) => {
  const db = createDb(c.env);
  const accountId = 1; // TODO: get from auth
  const id = Number(c.req.param("id"));

  await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.accountId, accountId)));

  return c.json({ success: true });
});

export { apiKeyRoutes };
