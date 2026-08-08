import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const accountsUsers = sqliteTable("accounts_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role", { enum: ["administrator", "agent"] }).default("agent"),
  availability: text("availability", { enum: ["online", "busy", "offline"] }).default("offline"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
