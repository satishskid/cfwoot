import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").notNull().unique(),
  accountId: integer("account_id").notNull(),
  inboxId: integer("inbox_id").notNull(),
  contactId: integer("contact_id"),
  assigneeId: integer("assignee_id"),
  teamId: integer("team_id"),
  status: text("status", { enum: ["open", "resolved", "pending", "snoozed"] }).notNull().default("open"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  displayId: integer("display_id"),
  lastActivityAt: integer("last_activity_at", { mode: "timestamp" }),
  labels: text("labels", { mode: "json" }).default([]),
  customAttributes: text("custom_attributes", { mode: "json" }).default({}),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
