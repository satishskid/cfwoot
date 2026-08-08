import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  locale: text("locale").default("en"),
  settings: text("settings", { mode: "json" }).default({}),
  featureFlags: text("feature_flags", { mode: "json" }).default({}),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
