import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const channelWhatsapp = sqliteTable("channel_whatsapp", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  phoneNumberId: text("phone_number_id").notNull(),
  phoneNumber: text("phone_number").notNull(),
  businessAccountId: text("business_account_id").notNull(),
  accessToken: text("access_token"),
  appSecret: text("app_secret"),
  verifyToken: text("verify_token"),
  settings: text("settings", { mode: "json" }).default({}),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
