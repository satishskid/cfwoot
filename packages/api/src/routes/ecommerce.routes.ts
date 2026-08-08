import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { ecommerceStores, ecommerceProducts, ecommerceOrders } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

const ecommerceRoutes = new Hono<{ Bindings: Env }>();

// List stores
ecommerceRoutes.get("/stores", async (c) => {
  const db = createDb(c.env);
  const accountId = c.req.query("accountId") || "1";

  const result = await db
    .select()
    .from(ecommerceStores)
    .where(eq(ecommerceStores.accountId, parseInt(accountId)))
    .orderBy(desc(ecommerceStores.createdAt));

  return c.json({ data: result });
});

// Connect Shopify store
ecommerceRoutes.post("/stores/shopify", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();

  const result = await db.insert(ecommerceStores).values({
    accountId: body.accountId || 1,
    platform: "shopify",
    shopDomain: body.shopDomain,
    accessToken: body.accessToken,
    isActive: true,
    createdAt: new Date(),
  });

  return c.json({ id: result.lastInsertRowid });
});

// Connect WooCommerce store
ecommerceRoutes.post("/stores/woocommerce", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();

  const result = await db.insert(ecommerceStores).values({
    accountId: body.accountId || 1,
    platform: "woocommerce",
    shopDomain: body.shopDomain,
    accessToken: body.accessToken,
    isActive: true,
    createdAt: new Date(),
  });

  return c.json({ id: result.lastInsertRowid });
});

// List products
ecommerceRoutes.get("/products", async (c) => {
  const db = createDb(c.env);
  const storeId = c.req.query("storeId");

  let query = db.select().from(ecommerceProducts).orderBy(desc(ecommerceProducts.createdAt));

  if (storeId) {
    query = db
      .select()
      .from(ecommerceProducts)
      .where(eq(ecommerceProducts.storeId, parseInt(storeId)))
      .orderBy(desc(ecommerceProducts.createdAt));
  }

  const result = await query;
  return c.json({ data: result });
});

// Sync products from store
ecommerceRoutes.post("/products/sync", async (c) => {
  const db = createDb(c.env);
  const { storeId } = await c.req.json();

  // In production, this would fetch from Shopify/WooCommerce API
  // For now, return success
  await db
    .update(ecommerceStores)
    .set({ lastSyncAt: new Date() })
    .where(eq(ecommerceStores.id, storeId));

  return c.json({ success: true, message: "Products synced" });
});

// List orders
ecommerceRoutes.get("/orders", async (c) => {
  const db = createDb(c.env);
  const storeId = c.req.query("storeId");
  const contactId = c.req.query("contactId");

  let conditions = [];
  if (storeId) conditions.push(eq(ecommerceOrders.storeId, parseInt(storeId)));
  if (contactId) conditions.push(eq(ecommerceOrders.contactId, parseInt(contactId)));

  const result = conditions.length > 0
    ? await db
        .select()
        .from(ecommerceOrders)
        .where(and(...conditions))
        .orderBy(desc(ecommerceOrders.createdAt))
    : await db
        .select()
        .from(ecommerceOrders)
        .orderBy(desc(ecommerceOrders.createdAt));

  return c.json({ data: result });
});

// Get single order
ecommerceRoutes.get("/orders/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(ecommerceOrders)
    .where(eq(ecommerceOrders.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: "Order not found" }, 404);
  }

  return c.json({ data: result[0] });
});

// Send order details via WhatsApp
ecommerceRoutes.post("/orders/:id/send-details", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const order = await db
    .select()
    .from(ecommerceOrders)
    .where(eq(ecommerceOrders.id, id))
    .limit(1);

  if (order.length === 0) {
    return c.json({ error: "Order not found" }, 404);
  }

  // In production, send WhatsApp message with order details
  return c.json({ success: true, message: "Order details sent" });
});

// Shopify webhook handler
ecommerceRoutes.post("/shopify/webhook", async (c) => {
  const body = await c.req.json();

  // Process Shopify webhook
  const topic = c.req.header("X-Shopify-Topic");

  if (topic === "orders/create") {
    // Handle new order
    const db = createDb(c.env);

    await db.insert(ecommerceOrders).values({
      storeId: 1, // Find store by shop domain
      externalOrderId: body.id?.toString() || "",
      status: body.financial_status || "pending",
      total: Math.round((parseFloat(body.total_price) || 0) * 100),
      currency: body.currency || "USD",
      items: body.line_items || [],
      shippingAddress: body.shipping_address,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return c.json({ success: true });
});

// WooCommerce webhook handler
ecommerceRoutes.post("/woocommerce/webhook", async (c) => {
  const body = await c.req.json();
  const topic = c.req.header("X-WC-Webhook-Topic");

  if (topic === "order.created") {
    const db = createDb(c.env);

    await db.insert(ecommerceOrders).values({
      storeId: 1,
      externalOrderId: body.id?.toString() || "",
      status: body.status || "pending",
      total: Math.round((parseFloat(body.total) || 0) * 100),
      currency: body.currency || "USD",
      items: body.line_items || [],
      shippingAddress: body.shipping,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return c.json({ success: true });
});

export { ecommerceRoutes };
