import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const whatsappFlows = sqliteTable("whatsapp_flows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  metaFlowId: text("meta_flow_id"),
  name: text("name").notNull(),
  description: text("description"),
  screens: text("screens", { mode: "json" }).notNull(),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  version: integer("version").default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const flowResponses = sqliteTable("flow_responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flowId: integer("flow_id").notNull(),
  conversationId: integer("conversation_id"),
  contactId: integer("contact_id").notNull(),
  screenData: text("screen_data", { mode: "json" }).notNull(),
  status: text("status", { enum: ["completed", "abandoned", "expired"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
