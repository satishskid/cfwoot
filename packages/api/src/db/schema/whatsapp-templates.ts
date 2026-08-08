import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const whatsappTemplates = sqliteTable("whatsapp_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  wabaId: text("waba_id").notNull(),
  templateId: text("template_id").notNull(),
  name: text("name").notNull(),
  language: text("language").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  components: text("components", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  syncedAt: integer("synced_at", { mode: "timestamp" }),
});
