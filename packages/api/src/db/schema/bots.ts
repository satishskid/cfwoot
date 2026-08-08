import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const botFlows = sqliteTable("bot_flows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger", { enum: ["keyword", "event", "time", "condition"] }).notNull(),
  triggerValue: text("trigger_value"),
  nodes: text("nodes", { mode: "json" }).notNull(),
  edges: text("edges", { mode: "json" }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const botExecutions = sqliteTable("bot_executions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  botFlowId: integer("bot_flow_id").notNull(),
  conversationId: integer("conversation_id").notNull(),
  currentNode: text("current_node"),
  state: text("state", { mode: "json" }).default({}),
  status: text("status", { enum: ["running", "completed", "abandoned"] }).notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});
