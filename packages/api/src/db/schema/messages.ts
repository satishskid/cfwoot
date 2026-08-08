import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull(),
  accountId: integer("account_id").notNull(),
  messageType: text("message_type", { enum: ["incoming", "outgoing", "activity", "template"] }).notNull(),
  contentType: text("content_type", { enum: ["text", "input_email", "cards", "form", "image", "audio", "video", "file", "location"] }).default("text"),
  content: text("content"),
  contentAttributes: text("content_attributes", { mode: "json" }).default({}),
  sourceId: text("source_id"),
  private: integer("private", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
