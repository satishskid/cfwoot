import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { messages, conversations, contacts, channelWhatsapp } from "../db/schema";
import { eq, and } from "drizzle-orm";

const whatsappRoutes = new Hono<{ Bindings: Env }>();

const WHATSAPP_API_BASE = "https://graph.facebook.com/v21.0";

interface WhatsAppEnv extends Env {
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_ACCESS_TOKEN: string;
}

// Send text message
whatsappRoutes.post("/send", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { to, message, conversationId } = body;

  const db = createDb(env);

  // Get WhatsApp channel config
  const channel = await db
    .select()
    .from(channelWhatsapp)
    .limit(1);

  const phoneNumberId = channel.length > 0
    ? channel[0].phoneNumberId
    : env.WHATSAPP_PHONE_NUMBER_ID;

  const accessToken = channel.length > 0
    ? channel[0].accessToken
    : env.WHATSAPP_ACCESS_TOKEN;

  // Send via WhatsApp API
  const response = await fetch(
    `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    return c.json({ error: result.error }, 400);
  }

  // Store outgoing message if conversationId provided
  if (conversationId) {
    await db.insert(messages).values({
      conversationId,
      accountId: 1,
      messageType: "outgoing",
      contentType: "text",
      content: message,
      sourceId: result.messages?.[0]?.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update conversation
    await db
      .update(conversations)
      .set({
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  return c.json({ success: true, messageId: result.messages?.[0]?.id });
});

// Send template message
whatsappRoutes.post("/send-template", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { to, templateName, language, components, conversationId } = body;

  const db = createDb(env);

  const channel = await db
    .select()
    .from(channelWhatsapp)
    .limit(1);

  const phoneNumberId = channel.length > 0
    ? channel[0].phoneNumberId
    : env.WHATSAPP_PHONE_NUMBER_ID;

  const accessToken = channel.length > 0
    ? channel[0].accessToken
    : env.WHATSAPP_ACCESS_TOKEN;

  const response = await fetch(
    `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: language || "en" },
          components: components || [],
        },
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    return c.json({ error: result.error }, 400);
  }

  // Store template message
  if (conversationId) {
    await db.insert(messages).values({
      conversationId,
      accountId: 1,
      messageType: "template",
      contentType: "text",
      content: JSON.stringify({ templateName, language, components }),
      sourceId: result.messages?.[0]?.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db
      .update(conversations)
      .set({
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  return c.json({ success: true, messageId: result.messages?.[0]?.id });
});

// Send media message
whatsappRoutes.post("/send-media", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { to, mediaType, mediaUrl, caption, conversationId } = body;

  const db = createDb(env);

  const channel = await db
    .select()
    .from(channelWhatsapp)
    .limit(1);

  const phoneNumberId = channel.length > 0
    ? channel[0].phoneNumberId
    : env.WHATSAPP_PHONE_NUMBER_ID;

  const accessToken = channel.length > 0
    ? channel[0].accessToken
    : env.WHATSAPP_ACCESS_TOKEN;

  const mediaPayload: any = {
    link: mediaUrl,
  };

  if (caption && mediaType === "image") {
    mediaPayload.caption = caption;
  }

  const response = await fetch(
    `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: mediaType,
        [mediaType]: mediaPayload,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    return c.json({ error: result.error }, 400);
  }

  // Store media message
  if (conversationId) {
    await db.insert(messages).values({
      conversationId,
      accountId: 1,
      messageType: "outgoing",
      contentType: mediaType,
      content: caption || mediaUrl,
      contentAttributes: { mediaUrl },
      sourceId: result.messages?.[0]?.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db
      .update(conversations)
      .set({
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  return c.json({ success: true, messageId: result.messages?.[0]?.id });
});

// Mark message as read
whatsappRoutes.post("/mark-read", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { messageId } = body;

  const channel = await db
    .select()
    .from(channelWhatsapp)
    .limit(1);

  const phoneNumberId = channel.length > 0
    ? channel[0].phoneNumberId
    : env.WHATSAPP_PHONE_NUMBER_ID;

  const accessToken = channel.length > 0
    ? channel[0].accessToken
    : env.WHATSAPP_ACCESS_TOKEN;

  const response = await fetch(
    `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    }
  );

  const result = await response.json();
  return c.json({ success: response.ok, data: result });
});

export { whatsappRoutes };
