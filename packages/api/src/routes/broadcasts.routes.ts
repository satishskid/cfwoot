import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { broadcastCampaigns, broadcastRecipients, contacts } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

const broadcastRoutes = new Hono<{ Bindings: Env }>();

// List campaigns
broadcastRoutes.get("/", async (c) => {
  const db = createDb(c.env);
  const accountId = c.req.query("accountId") || "1";
  const status = c.req.query("status");

  let conditions = [eq(broadcastCampaigns.accountId, parseInt(accountId))];
  if (status) conditions.push(eq(broadcastCampaigns.status, status as any));

  const result = await db
    .select()
    .from(broadcastCampaigns)
    .where(and(...conditions))
    .orderBy(desc(broadcastCampaigns.createdAt));

  return c.json({ data: result });
});

// Get single campaign
broadcastRoutes.get("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(broadcastCampaigns)
    .where(eq(broadcastCampaigns.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: "Campaign not found" }, 404);
  }

  return c.json({ data: result[0] });
});

// Create campaign
broadcastRoutes.post("/", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();

  const result = await db.insert(broadcastCampaigns).values({
    accountId: body.accountId || 1,
    name: body.name,
    description: body.description,
    templateId: body.templateId,
    audienceFilter: body.audienceFilter || {},
    status: "draft",
    stats: { sent: 0, delivered: 0, read: 0, failed: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return c.json({ id: result.lastInsertRowid });
});

// Update campaign
broadcastRoutes.put("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  await db
    .update(broadcastCampaigns)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(broadcastCampaigns.id, id));

  return c.json({ success: true });
});

// Delete campaign
broadcastRoutes.delete("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  await db.delete(broadcastCampaigns).where(eq(broadcastCampaigns.id, id));
  return c.json({ success: true });
});

// Send campaign
broadcastRoutes.post("/:id/send", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  // Get campaign
  const campaign = await db
    .select()
    .from(broadcastCampaigns)
    .where(eq(broadcastCampaigns.id, id))
    .limit(1);

  if (campaign.length === 0) {
    return c.json({ error: "Campaign not found" }, 404);
  }

  // Get audience contacts
  const filter = campaign[0].audienceFilter as any;
  let audienceQuery = db.select().from(contacts).where(eq(contacts.accountId, campaign[0].accountId));

  if (filter?.tags?.length > 0) {
    // Filter by tags
    const allContacts = await audienceQuery;
    const matchingContacts = allContacts.filter((c) => {
      const contactTags = (c.labels as string[]) || [];
      return filter.tags.some((tag: string) => contactTags.includes(tag));
    });

    // Create recipients
    for (const contact of matchingContacts) {
      await db.insert(broadcastRecipients).values({
        campaignId: id,
        contactId: contact.id,
        status: "pending",
      });
    }
  }

  // Update campaign status
  await db
    .update(broadcastCampaigns)
    .set({ status: "sending", startedAt: new Date(), updatedAt: new Date() })
    .where(eq(broadcastCampaigns.id, id));

  // In production, this would process asynchronously via Queue
  return c.json({ success: true, message: "Campaign sending started" });
});

// Schedule campaign
broadcastRoutes.post("/:id/schedule", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  await db
    .update(broadcastCampaigns)
    .set({
      scheduledAt: new Date(body.scheduledAt),
      status: "scheduled",
      updatedAt: new Date(),
    })
    .where(eq(broadcastCampaigns.id, id));

  return c.json({ success: true });
});

// Get campaign stats
broadcastRoutes.get("/:id/stats", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const campaign = await db
    .select()
    .from(broadcastCampaigns)
    .where(eq(broadcastCampaigns.id, id))
    .limit(1);

  if (campaign.length === 0) {
    return c.json({ error: "Campaign not found" }, 404);
  }

  // Get recipient stats
  const recipients = await db
    .select()
    .from(broadcastRecipients)
    .where(eq(broadcastRecipients.campaignId, id));

  const stats = {
    total: recipients.length,
    sent: recipients.filter((r) => r.status === "sent" || r.status === "delivered" || r.status === "read").length,
    delivered: recipients.filter((r) => r.status === "delivered" || r.status === "read").length,
    read: recipients.filter((r) => r.status === "read").length,
    failed: recipients.filter((r) => r.status === "failed").length,
    pending: recipients.filter((r) => r.status === "pending").length,
  };

  return c.json({ data: stats });
});

// Get campaign recipients
broadcastRoutes.get("/:id/recipients", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(broadcastRecipients)
    .where(eq(broadcastRecipients.campaignId, id))
    .orderBy(desc(broadcastRecipients.sentAt));

  return c.json({ data: result });
});

export { broadcastRoutes };
