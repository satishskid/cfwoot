import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { webhookEndpoints, webhookDeliveryLogs } from "../db/schema/webhooks";
import { eq, and } from "drizzle-orm";
import { hmacSign } from "../lib/crypto";
import { validateUrlSafety } from "../lib/ssrf";

const webhookRoutes = new Hono<{ Bindings: Env }>();

// List webhook endpoints
webhookRoutes.get("/", async (c) => {
  const db = createDb(c.env);
  const accountId = 1;

  const endpoints = await db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.accountId, accountId));

  return c.json({ data: endpoints });
});

// Create webhook endpoint
webhookRoutes.post("/", async (c) => {
  const db = createDb(c.env);
  const accountId = 1;
  const body = await c.req.json();
  const { url, events } = body;

  // SSRF protection
  const safety = await validateUrlSafety(url);
  if (!safety.safe) {
    return c.json({ error: safety.reason }, 400);
  }

  const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const [endpoint] = await db
    .insert(webhookEndpoints)
    .values({
      accountId,
      url,
      secret,
      events: events || ["*"],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return c.json({ data: endpoint });
});

// Delete webhook endpoint
webhookRoutes.delete("/:id", async (c) => {
  const db = createDb(c.env);
  const accountId = 1;
  const id = Number(c.req.param("id"));

  await db
    .delete(webhookEndpoints)
    .where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.accountId, accountId)));

  return c.json({ success: true });
});

/**
 * Fire all active webhooks for an event.
 * Called from message handlers, conversation updates, etc.
 */
export async function fireWebhooks(
  db: ReturnType<typeof createDb>,
  accountId: number,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const endpoints = await db
    .select()
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.accountId, accountId),
        eq(webhookEndpoints.isActive, true)
      )
    );

  for (const endpoint of endpoints) {
    // Check if this endpoint subscribes to this event
    const events = (endpoint.events as string[]) || ["*"];
    if (!events.includes("*") && !events.includes(event)) {
      continue;
    }

    // Check failure count (auto-disable after 10 consecutive failures)
    if ((endpoint.failureCount ?? 0) >= 10) {
      continue;
    }

    try {
      const body = JSON.stringify({
        event,
        account_id: accountId,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      const signature = await hmacSign(body, endpoint.secret);

      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CFwoot-Signature": signature,
          "X-CFwoot-Event": event,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });

      // Log delivery
      await db.insert(webhookDeliveryLogs).values({
        endpointId: endpoint.id,
        event,
        payload,
        statusCode: response.status,
        success: response.ok,
        deliveredAt: new Date(),
      });

      // Update endpoint status
      await db
        .update(webhookEndpoints)
        .set({
          lastTriggeredAt: new Date(),
          lastStatus: response.status,
          failureCount: response.ok ? 0 : (endpoint.failureCount ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(webhookEndpoints.id, endpoint.id));
    } catch (error) {
      // Log failure
      await db.insert(webhookDeliveryLogs).values({
        endpointId: endpoint.id,
        event,
        payload,
        statusCode: 0,
        response: error instanceof Error ? error.message : "Unknown error",
        success: false,
        deliveredAt: new Date(),
      });

      await db
        .update(webhookEndpoints)
        .set({
          lastTriggeredAt: new Date(),
          lastStatus: 0,
          failureCount: (endpoint.failureCount ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(webhookEndpoints.id, endpoint.id));
    }
  }
}

export { webhookRoutes };
