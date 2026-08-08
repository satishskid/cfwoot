import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { contacts } from "../db/schema";
import { eq, and } from "drizzle-orm";

const contactRoutes = new Hono<{ Bindings: Env }>();

// List contacts
contactRoutes.get("/", async (c) => {
  const db = createDb(c.env);
  const accountId = c.req.query("accountId") || "1";

  const result = await db
    .select()
    .from(contacts)
    .where(eq(contacts.accountId, parseInt(accountId)));

  return c.json({ data: result });
});

// Get single contact
contactRoutes.get("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: "Contact not found" }, 404);
  }

  return c.json({ data: result[0] });
});

// Find or create contact by phone
contactRoutes.post("/find-or-create", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();
  const { phone, name, email, accountId } = body;

  // Try to find existing contact
  const existing = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.accountId, accountId || 1),
        eq(contacts.phone, phone)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return c.json({ data: existing[0], created: false });
  }

  // Create new contact
  const result = await db.insert(contacts).values({
    accountId: accountId || 1,
    phone,
    name: name || null,
    email: email || null,
    contactType: "visitor",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const newContact = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, result.lastInsertRowid))
    .limit(1);

  return c.json({ data: newContact[0], created: true });
});

// Create contact
contactRoutes.post("/", async (c) => {
  const db = createDb(c.env);
  const body = await c.req.json();

  const result = await db.insert(contacts).values({
    accountId: body.accountId || 1,
    name: body.name,
    phone: body.phone,
    email: body.email,
    identifier: body.identifier,
    contactType: body.contactType || "visitor",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return c.json({ id: result.lastInsertRowid });
});

// Update contact
contactRoutes.put("/:id", async (c) => {
  const db = createDb(c.env);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  await db
    .update(contacts)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, id));

  return c.json({ success: true });
});

export { contactRoutes };
