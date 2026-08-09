import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { contactCustomFields, contactCustomValues, contacts } from "../db/schema/webhooks";
import { eq, and } from "drizzle-orm";

const customFieldRoutes = new Hono<{ Bindings: Env }>();

// List custom fields
customFieldRoutes.get("/fields", async (c) => {
  const db = createDb(c.env);
  const accountId = 1;

  const fields = await db
    .select()
    .from(contactCustomFields)
    .where(eq(contactCustomFields.accountId, accountId));

  return c.json({ data: fields });
});

// Create custom field
customFieldRoutes.post("/fields", async (c) => {
  const db = createDb(c.env);
  const accountId = 1;
  const body = await c.req.json();

  const { fieldName, fieldType, fieldOptions, isRequired } = body;

  const [field] = await db
    .insert(contactCustomFields)
    .values({
      accountId,
      fieldName,
      fieldType: fieldType || "text",
      fieldOptions: fieldOptions || [],
      isRequired: isRequired || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return c.json({ data: field });
});

// Delete custom field
customFieldRoutes.delete("/fields/:id", async (c) => {
  const db = createDb(c.env);
  const accountId = 1;
  const id = Number(c.req.param("id"));

  // Delete field and all values
  await db
    .delete(contactCustomFields)
    .where(and(eq(contactCustomFields.id, id), eq(contactCustomFields.accountId, accountId)));

  await db
    .delete(contactCustomValues)
    .where(eq(contactCustomValues.fieldId, id));

  return c.json({ success: true });
});

// Get custom values for a contact
customFieldRoutes.get("/contacts/:contactId", async (c) => {
  const db = createDb(c.env);
  const contactId = Number(c.req.param("contactId"));

  const values = await db
    .select({
      id: contactCustomValues.id,
      fieldId: contactCustomValues.fieldId,
      value: contactCustomValues.value,
    })
    .from(contactCustomValues)
    .where(eq(contactCustomValues.contactId, contactId));

  return c.json({ data: values });
});

// Set custom values for a contact
customFieldRoutes.post("/contacts/:contactId", async (c) => {
  const db = createDb(c.env);
  const contactId = Number(c.req.param("contactId"));
  const body = await c.req.json();
  const { values } = body as { values: { fieldId: number; value: string }[] };

  for (const { fieldId, value } of values) {
    const existing = await db
      .select()
      .from(contactCustomValues)
      .where(
        and(
          eq(contactCustomValues.contactId, contactId),
          eq(contactCustomValues.fieldId, fieldId)
        )
      );

    if (existing.length > 0) {
      await db
        .update(contactCustomValues)
        .set({ value, updatedAt: new Date() })
        .where(eq(contactCustomValues.id, existing[0].id));
    } else {
      await db.insert(contactCustomValues).values({
        contactId,
        fieldId,
        value,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return c.json({ success: true });
});

export { customFieldRoutes };
