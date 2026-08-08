import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role", { enum: ["admin", "agent", "viewer"] }).notNull().default("agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const slaPolicies = sqliteTable("sla_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  firstResponseMinutes: integer("first_response_minutes").notNull(),
  resolutionMinutes: integer("resolution_minutes").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const slaBreaches = sqliteTable("sla_breaches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull(),
  slaPolicyId: integer("sla_policy_id").notNull(),
  breachType: text("breach_type", { enum: ["first_response", "resolution"] }).notNull(),
  breachedAt: integer("breached_at", { mode: "timestamp" }).notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
});
