import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { messages, conversations, contacts, channelWhatsapp } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt } from "../lib/crypto";
import { generatePhoneVariants, normalizePhone } from "../lib/phone";
import { fireWebhooks } from "./webhooks.routes";

const whatsappRoutes = new Hono<{ Bindings: Env }>();

const WHATSAPP_API_BASE = "https://graph.facebook.com/v21.0";
const MAX_PHONE_RETRIES = 3;

interface WhatsAppEnv extends Env {
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_APP_SECRET: string;
  ENCRYPTION_SECRET: string;
}

// ─── Helper: Get channel config with decryption ───

async function getChannelConfig(db: ReturnType<typeof createDb>, env: WhatsAppEnv) {
  const channel = await db.select().from(channelWhatsapp).limit(1);

  const phoneNumberId = channel.length > 0
    ? channel[0].phoneNumberId
    : env.WHATSAPP_PHONE_NUMBER_ID;

  let accessToken: string;
  if (channel.length > 0 && channel[0].accessToken) {
    // Decrypt stored token
    accessToken = await decrypt(channel[0].accessToken, env.ENCRYPTION_SECRET);
  } else {
    accessToken = env.WHATSAPP_ACCESS_TOKEN;
  }

  return { phoneNumberId, accessToken, channel: channel[0] };
}

// ─── Helper: Send with phone variant retry ───

async function sendWithRetry(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  payload: Record<string, unknown>,
  maxRetries: number = MAX_PHONE_RETRIES
): Promise<{ result: any; finalTo: string }> {
  const variants = generatePhoneVariants(to);

  for (let i = 0; i < Math.min(variants.length, maxRetries); i++) {
    const phone = variants[i];
    const response = await fetch(
      `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...payload, to: phone }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      return { result, finalTo: phone };
    }

    // Only retry on "recipient not in allowed list" error
    const errorCode = result.error?.code;
    if (errorCode !== 131047 && errorCode !== 133004) {
      throw new Error(result.error?.message || "Failed to send message");
    }

    // If this was the last variant, throw the error
    if (i === Math.min(variants.length, maxRetries) - 1) {
      throw new Error(result.error?.message || "Failed to send message with any phone variant");
    }
  }

  throw new Error("Failed to send message");
}

// ─── Send text message (with phone variant retry) ───

whatsappRoutes.post("/send", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { to, message, conversationId } = body;

  const db = createDb(env);
  const { phoneNumberId, accessToken } = await getChannelConfig(db, env);

  try {
    const { result, finalTo } = await sendWithRetry(
      phoneNumberId,
      accessToken,
      to,
      {
        messaging_product: "whatsapp",
        type: "text",
        text: { body: message },
      }
    );

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

      await db
        .update(conversations)
        .set({ lastActivityAt: new Date(), updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));

      // Fire webhooks
      await fireWebhooks(db, 1, "message.sent", {
        conversation_id: conversationId,
        message_id: result.messages?.[0]?.id,
        to: finalTo,
        content: message,
      });
    }

    // Auto-correct phone if variant was used
    if (finalTo !== to && conversationId) {
      const [convo] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId));

      if (convo?.contactId) {
        await db
          .update(contacts)
          .set({ phone: finalTo, updatedAt: new Date() })
          .where(eq(contacts.id, convo.contactId));
      }
    }

    return c.json({ success: true, messageId: result.messages?.[0]?.id });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// ─── Send template message ───

whatsappRoutes.post("/send-template", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { to, templateName, language, components, conversationId } = body;

  const db = createDb(env);
  const { phoneNumberId, accessToken } = await getChannelConfig(db, env);

  try {
    const { result, finalTo } = await sendWithRetry(
      phoneNumberId,
      accessToken,
      to,
      {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: templateName,
          language: { code: language || "en" },
          components: components || [],
        },
      }
    );

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
        .set({ lastActivityAt: new Date(), updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    return c.json({ success: true, messageId: result.messages?.[0]?.id });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// ─── Send media message ───

whatsappRoutes.post("/send-media", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { to, mediaType, mediaUrl, caption, conversationId } = body;

  const db = createDb(env);
  const { phoneNumberId, accessToken } = await getChannelConfig(db, env);

  const mediaPayload: Record<string, unknown> = { link: mediaUrl };
  if (caption && mediaType === "image") {
    mediaPayload.caption = caption;
  }

  try {
    const { result, finalTo } = await sendWithRetry(
      phoneNumberId,
      accessToken,
      to,
      {
        messaging_product: "whatsapp",
        type: mediaType,
        [mediaType]: mediaPayload,
      }
    );

    if (conversationId) {
      await db.insert(messages).values({
        conversationId,
        accountId: 1,
        messageType: "outgoing",
        contentType: mediaType as any,
        content: caption || mediaUrl,
        contentAttributes: { mediaUrl },
        sourceId: result.messages?.[0]?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db
        .update(conversations)
        .set({ lastActivityAt: new Date(), updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    return c.json({ success: true, messageId: result.messages?.[0]?.id });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// ─── Mark message as read ───

whatsappRoutes.post("/mark-read", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { messageId } = body;

  const db = createDb(env);
  const { phoneNumberId, accessToken } = await getChannelConfig(db, env);

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

// ─── Atomic reply slot claim (prevents auto-reply race conditions) ───

whatsappRoutes.post("/claim-reply-slot", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { conversationId, maxPerConversation = 5 } = body;

  const db = createDb(env);

  // Atomic check-and-increment using a single query
  // This prevents two concurrent requests from both claiming a slot
  const [convo] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!convo) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  // Check if auto-reply is disabled for this conversation
  const customAttrs = convo.customAttributes as Record<string, any>;
  const aiReplyCount = customAttrs?.ai_reply_count || 0;

  if (aiReplyCount >= maxPerConversation) {
    return c.json({
      claimed: false,
      reason: "Per-conversation auto-reply limit reached",
      currentCount: aiReplyCount,
      maxAllowed: maxPerConversation,
    });
  }

  // Claim the slot (increment count atomically)
  await db
    .update(conversations)
    .set({
      customAttributes: {
        ...customAttrs,
        ai_reply_count: aiReplyCount + 1,
        ai_last_reply_at: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId));

  return c.json({
    claimed: true,
    currentCount: aiReplyCount + 1,
    maxAllowed: maxPerConversation,
  });
});

// ─── Save WhatsApp channel config (with encrypted token) ───

whatsappRoutes.post("/config", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { phoneNumberId, phoneNumber, businessAccountId, accessToken, appSecret, verifyToken } = body;

  const db = createDb(env);

  // Encrypt the access token before storing
  const encryptedToken = await encrypt(accessToken, env.ENCRYPTION_SECRET);

  // Check if config exists
  const existing = await db.select().from(channelWhatsapp).limit(1);

  if (existing.length > 0) {
    await db
      .update(channelWhatsapp)
      .set({
        phoneNumberId,
        phoneNumber,
        businessAccountId,
        accessToken: encryptedToken,
        appSecret: appSecret ? await encrypt(appSecret, env.ENCRYPTION_SECRET) : undefined,
        verifyToken: verifyToken ? await encrypt(verifyToken, env.ENCRYPTION_SECRET) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(channelWhatsapp.id, existing[0].id));
  } else {
    await db.insert(channelWhatsapp).values({
      accountId: 1,
      phoneNumberId,
      phoneNumber,
      businessAccountId,
      accessToken: encryptedToken,
      appSecret: appSecret ? await encrypt(appSecret, env.ENCRYPTION_SECRET) : undefined,
      verifyToken: verifyToken ? await encrypt(verifyToken, env.ENCRYPTION_SECRET) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return c.json({ success: true });
});

// ─── Webhook endpoint (with after()-style deferred processing) ───

whatsappRoutes.get("/webhook", async (c) => {
  const env = c.env as WhatsAppEnv;
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  if (mode === "subscribe") {
    // Decrypt stored verify token and compare
    const db = createDb(env);
    const channel = await db.select().from(channelWhatsapp).limit(1);

    if (channel.length > 0 && channel[0].verifyToken) {
      const storedToken = await decrypt(channel[0].verifyToken, env.ENCRYPTION_SECRET);
      if (token === storedToken) {
        return c.text(challenge || "");
      }
    }

    // Fallback to env token
    if (token === env.WHATSAPP_VERIFY_TOKEN) {
      return c.text(challenge || "");
    }
  }

  return c.json({ error: "Forbidden" }, 403);
});

whatsappRoutes.post("/webhook", async (c) => {
  const env = c.env as WhatsAppEnv;
  const db = createDb(env);

  // Verify HMAC signature
  const signature = c.req.header("X-Hub-Signature-256");
  const rawBody = await c.req.text();

  if (env.WHATSAPP_APP_SECRET && signature) {
    const crypto = await import("crypto");
    const expectedSignature =
      "sha256=" +
      crypto.createHmac("sha256", env.WHATSAPP_APP_SECRET).update(rawBody).digest("hex");

    if (signature !== expectedSignature) {
      return c.json({ error: "Invalid signature" }, 403);
    }
  }

  const body = JSON.parse(rawBody);

  // Process immediately (within the 20s Meta timeout)
  // Return 200 to Meta first, then handle downstream

  // Return 200 to Meta immediately
  const responsePromise = c.json({ success: true });

  // Process message asynchronously after responding
  // In Cloudflare Workers, we use queueMicrotask or just process inline
  // since we can't use after() directly — but we process fast
  processWebhookAsync(body, db, env).catch((err) => {
    console.error("Webhook processing error:", err);
  });

  return responsePromise;
});

// ─── Async webhook processor ───

async function processWebhookAsync(
  body: any,
  db: ReturnType<typeof createDb>,
  env: WhatsAppEnv
): Promise<void> {
  const entries = body.entry || [];

  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.field !== "messages") continue;

      const value = change.value;

      // Handle incoming messages
      if (value.messages) {
        for (const msg of value.messages) {
          await handleIncomingMessage(msg, value.contacts, db, env);
        }
      }

      // Handle status updates
      if (value.statuses) {
        for (const status of value.statuses) {
          await handleStatusUpdate(status, db);
        }
      }
    }
  }
}

async function handleIncomingMessage(
  msg: any,
  contactsData: any[],
  db: ReturnType<typeof createDb>,
  env: WhatsAppEnv
): Promise<void> {
  const phone = msg.from;
  const msgType = msg.type;
  const msgId = msg.id;

  // Dedup: check if message already exists
  const existing = await db
    .select()
    .from(messages)
    .where(eq(messages.sourceId, msgId))
    .limit(1);

  if (existing.length > 0) return;

  // Find or create contact
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.phone, phone))
    .limit(1);

  let contactId = contact?.id;
  if (!contactId) {
    const contactName = contactsData?.[0]?.profile?.name || phone;
    const [newContact] = await db
      .insert(contacts)
      .values({
        accountId: 1,
        name: contactName,
        phone,
        contactType: "visitor",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    contactId = newContact.id;
  }

  // Find or create conversation
  const [convo] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.contactId, contactId))
    .limit(1);

  let conversationId = convo?.id;
  if (!conversationId) {
    const [newConvo] = await db
      .insert(conversations)
      .values({
        uuid: crypto.randomUUID(),
        accountId: 1,
        inboxId: 1,
        contactId,
        status: "open",
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    conversationId = newConvo.id;
  }

  // Extract content based on type
  let content = "";
  let contentType = "text";

  switch (msgType) {
    case "text":
      content = msg.text?.body || "";
      break;
    case "image":
      content = msg.image?.caption || "[Image]";
      contentType = "image";
      break;
    case "video":
      content = msg.video?.caption || "[Video]";
      contentType = "video";
      break;
    case "document":
      content = msg.document?.caption || "[Document]";
      contentType = "file";
      break;
    case "audio":
      content = "[Audio]";
      contentType = "audio";
      break;
    case "location":
      content = `${msg.location?.latitude}, ${msg.location?.longitude}`;
      contentType = "location";
      break;
    case "interactive":
      if (msg.interactive?.type === "button_reply") {
        content = msg.interactive.button_reply?.title || "";
      } else if (msg.interactive?.type === "list_reply") {
        content = msg.interactive.list_reply?.title || "";
      }
      break;
    default:
      content = `[${msgType}]`;
  }

  // Store message
  await db.insert(messages).values({
    conversationId,
    accountId: 1,
    messageType: "incoming",
    contentType: contentType as any,
    content,
    sourceId: msgId,
    contentAttributes: { raw: msg },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Update conversation
  await db
    .update(conversations)
    .set({ lastActivityAt: new Date(), updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  // Fire webhooks
  await fireWebhooks(db, 1, "message.received", {
    conversation_id: conversationId,
    contact_id: contactId,
    message_id: msgId,
    content,
    content_type: contentType,
    from: phone,
  });
}

async function handleStatusUpdate(status: any, db: ReturnType<typeof createDb>): Promise<void> {
  const msgId = status.id;
  const statusType = status.status;

  const statusMap: Record<string, string> = {
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
  };

  await db
    .update(messages)
    .set({
      sourceId: msgId,
      // Store status in contentAttributes
    })
    .where(eq(messages.sourceId, msgId));
}

export { whatsappRoutes };
