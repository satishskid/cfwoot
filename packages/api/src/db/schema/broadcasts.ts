import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const broadcastCampaigns = sqliteTable("broadcast_campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  templateId: integer("template_id"),
  audienceFilter: text("audience_filter", { mode: "json" }).notNull(),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  status: text("status", { enum: ["draft", "scheduled", "sending", "completed", "failed"] }).notNull().default("draft"),
  stats: text("stats", { mode: "json" }).default({}),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const broadcastRecipients = sqliteTable("broadcast_recipients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull(),
  contactId: integer("contact_id").notNull(),
  status: text("status", { enum: ["pending", "sent", "delivered", "read", "failed"] }).notNull().default("pending"),
  error: text("error"),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  readAt: integer("read_at", { mode: "timestamp" }),
});
