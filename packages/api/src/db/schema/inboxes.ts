import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const inboxes = sqliteTable("inboxes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  name: text("name").notNull(),
  channelType: text("channel_type").notNull(),
  channelId: integer("channel_id"),
  settings: text("settings", { mode: "json" }).default({}),
  enableAutoAssignment: integer("enable_auto_assignment", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
