import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const ecommerceStores = sqliteTable("ecommerce_stores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  platform: text("platform", { enum: ["shopify", "woocommerce"] }).notNull(),
  shopDomain: text("shop_domain").notNull(),
  accessToken: text("access_token").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const ecommerceProducts = sqliteTable("ecommerce_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").notNull(),
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  url: text("url"),
  variants: text("variants", { mode: "json" }).default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const ecommerceOrders = sqliteTable("ecommerce_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").notNull(),
  contactId: integer("contact_id"),
  externalOrderId: text("external_order_id").notNull(),
  status: text("status").notNull(),
  total: integer("total").notNull(),
  currency: text("currency").default("USD"),
  items: text("items", { mode: "json" }).notNull(),
  shippingAddress: text("shipping_address", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
