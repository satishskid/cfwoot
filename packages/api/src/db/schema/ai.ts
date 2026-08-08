import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const knowledgeArticles = sqliteTable("knowledge_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  embedding: text("embedding"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const aiConversations = sqliteTable("ai_conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull(),
  accountId: integer("account_id").notNull(),
  suggestedReplies: text("suggested_replies", { mode: "json" }).default([]),
  resolvedByAI: integer("resolved_by_ai", { mode: "boolean" }).default(false),
  aiConfidence: integer("ai_confidence"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const conversationSummaries = sqliteTable("conversation_summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull(),
  summary: text("summary").notNull(),
  keyPoints: text("key_points", { mode: "json" }).default([]),
  sentiment: text("sentiment"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
