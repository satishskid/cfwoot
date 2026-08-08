import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  name: text("name"),
  phone: text("phone"),
  email: text("email"),
  identifier: text("identifier"),
  contactType: text("contact_type", { enum: ["visitor", "lead", "customer"] }).default("visitor"),
  customAttributes: text("custom_attributes", { mode: "json" }).default({}),
  labels: text("labels", { mode: "json" }).default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
