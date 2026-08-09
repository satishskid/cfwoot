import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const apiKeys = sqliteTable("api_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(),
  scopes: text("scopes", { mode: "json" }).default(["read"]),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const webhookEndpoints = sqliteTable("webhook_endpoints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: text("events", { mode: "json" }).default([]),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  failureCount: integer("failure_count").default(0),
  lastTriggeredAt: integer("last_triggered_at", { mode: "timestamp" }),
  lastStatus: integer("last_status"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const webhookDeliveryLogs = sqliteTable("webhook_delivery_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  endpointId: integer("endpoint_id").notNull(),
  event: text("event").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  statusCode: integer("status_code"),
  response: text("response"),
  success: integer("success", { mode: "boolean" }).default(false),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }).notNull(),
});

export const contactCustomFields = sqliteTable("contact_custom_fields", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  fieldName: text("field_name").notNull(),
  fieldType: text("field_type", {
    enum: ["text", "number", "date", "select", "multi_select", "boolean", "email", "phone", "url"],
  }).notNull().default("text"),
  fieldOptions: text("field_options", { mode: "json" }).default([]),
  isRequired: integer("is_required", { mode: "boolean" }).default(false),
  isVisible: integer("is_visible", { mode: "boolean" }).default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const contactCustomValues = sqliteTable("contact_custom_values", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contact_id").notNull(),
  fieldId: integer("field_id").notNull(),
  value: text("value"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
