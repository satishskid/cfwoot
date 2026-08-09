import { Hono } from "hono";
import { createDb, type Env } from "../db";
import { messages, conversations, contacts, channelWhatsapp } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { encrypt, decrypt } from "../lib/crypto";
import { generatePhoneVariants, normalizePhone } from "../lib/phone";
import { fireWebhooks } from "./webhooks.routes";
import { WorkersAI, MockAI, type AutoReplyResult } from "../lib/ai";
import { Logger, recordMetric } from "../lib/logger";

const whatsappRoutes = new Hono<{ Bindings: Env }>();

const WHATSAPP_API_BASE = "https://graph.facebook.com/v21.0";
const MAX_PHONE_RETRIES = 3;
const MAX_AI_REPLIES_PER_CONVERSATION = 5;

interface WhatsAppEnv extends Env {
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_APP_SECRET: string;
  ENCRYPTION_SECRET: string;
  MOCK_MODE?: string;
  CF_WORKERS_AI_ACCOUNT_ID?: string;
  CF_WORKERS_AI_API_TOKEN?: string;
}

// ─── Logger ───
const log = new Logger("info", { service: "whatsapp" });

// ─── Helper: Get channel config with decryption ───

async function getChannelConfig(db: ReturnType<typeof createDb>, env: WhatsAppEnv) {
  const channel = await db.select().from(channelWhatsapp).limit(1);

  const phoneNumberId = channel.length > 0
    ? channel[0].phoneNumberId
    : env.WHATSAPP_PHONE_NUMBER_ID;

  let accessToken: string;
  if (channel.length > 0 && channel[0].accessToken) {
    try {
      accessToken = await decrypt(channel[0].accessToken, env.ENCRYPTION_SECRET);
    } catch {
      log.warn("Failed to decrypt access token, using env fallback");
      accessToken = env.WHATSAPP_ACCESS_TOKEN;
    }
  } else {
    accessToken = env.WHATSAPP_ACCESS_TOKEN;
  }

  return { phoneNumberId, accessToken, channel: channel[0] };
}

// ─── Helper: Get AI instance ───

function getAI(env: WhatsAppEnv) {
  if (env.MOCK_MODE === "true" || !env.CF_WORKERS_AI_ACCOUNT_ID) {
    return new MockAI();
  }
  return new WorkersAI({
    accountId: env.CF_WORKERS_AI_ACCOUNT_ID,
    apiToken: env.CF_WORKERS_AI_API_TOKEN || "",
  });
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
    log.info("Sending WhatsApp message", { to: phone, attempt: i + 1 });

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
      recordMetric("message_sent");
      log.info("Message sent successfully", { messageId: result.messages?.[0]?.id, to: phone });
      return { result, finalTo: phone };
    }

    const errorCode = result.error?.code;
    log.warn("WhatsApp send failed", { errorCode, message: result.error?.message, phone });

    // Only retry on "recipient not in allowed list" error
    if (errorCode !== 131047 && errorCode !== 133004) {
      throw new Error(result.error?.message || "Failed to send message");
    }

    if (i === Math.min(variants.length, maxRetries) - 1) {
      throw new Error(result.error?.message || "Failed with all phone variants");
    }
  }

  throw new Error("Failed to send message");
}

// ─── Helper: Try auto-reply with AI ───

async function tryAutoReply(
  db: ReturnType<typeof createDb>,
  env: WhatsAppEnv,
  conversationId: number,
  customerMessage: string,
  contactId: number
): Promise<void> {
  try {
    // Check reply count
    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!convo) return;

    const customAttrs = (convo.customAttributes as Record<string, any>) || {};
    const aiReplyCount = customAttrs.ai_reply_count || 0;

    if (aiReplyCount >= MAX_AI_REPLIES_PER_CONVERSATION) {
      log.info("Auto-reply limit reached", { conversationId, count: aiReplyCount });
      return;
    }

    // Get conversation history
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(10);

    const conversationHistory = history.reverse().map((m) => ({
      role: m.messageType === "incoming" ? "customer" as const : "agent" as const,
      content: m.content || "",
    }));

    const ai = getAI(env);
    const result = await ai.generateAutoReply(
      customerMessage,
      conversationHistory,
      "CFwoot - WhatsApp customer support platform"
    );

    if (result.shouldHandoff || result.confidence < 0.3) {
      log.info("AI suggests handoff", { conversationId, confidence: result.confidence });
      return;
    }

    // Send AI reply
    const { phoneNumberId, accessToken } = await getChannelConfig(db, env);
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId));

    if (!contact?.phone) return;

    const { result: sendResult } = await sendWithRetry(
      phoneNumberId,
      accessToken,
      contact.phone,
      {
        messaging_product: "whatsapp",
        type: "text",
        text: { body: result.reply },
      }
    );

    // Store AI reply
    await db.insert(messages).values({
      conversationId,
      accountId: 1,
      messageType: "outgoing",
      contentType: "text",
      content: result.reply,
      sourceId: sendResult.messages?.[0]?.id,
      contentAttributes: { ai_generated: true, intent: result.intent, confidence: result.confidence },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update conversation
    await db
      .update(conversations)
      .set({
        lastActivityAt: new Date(),
        updatedAt: new Date(),
        customAttributes: {
          ...customAttrs,
          ai_reply_count: aiReplyCount + 1,
          ai_last_reply_at: new Date().toISOString(),
        },
      })
      .where(eq(conversations.id, conversationId));

    recordMetric("ai_reply");
    log.info("Auto-reply sent", { conversationId, intent: result.intent, confidence: result.confidence });
  } catch (error) {
    log.error("Auto-reply failed", { conversationId, error: String(error) });
  }
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
    log.error("Send failed", { error: error.message, to });
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
    const { result } = await sendWithRetry(
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

// ─── Atomic reply slot claim ───

whatsappRoutes.post("/claim-reply-slot", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { conversationId, maxPerConversation = MAX_AI_REPLIES_PER_CONVERSATION } = body;

  const db = createDb(env);

  const [convo] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!convo) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  const customAttrs = (convo.customAttributes as Record<string, any>) || {};
  const aiReplyCount = customAttrs.ai_reply_count || 0;

  if (aiReplyCount >= maxPerConversation) {
    return c.json({
      claimed: false,
      reason: "Per-conversation auto-reply limit reached",
      currentCount: aiReplyCount,
      maxAllowed: maxPerConversation,
    });
  }

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

// ─── AI endpoints ───

whatsappRoutes.post("/ai/autoreply", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { conversationId, message } = body;

  const db = createDb(env);
  const ai = getAI(env);

  const result = await ai.generateAutoReply(
    message,
    [],
    "CFwoot - WhatsApp customer support platform"
  );

  return c.json({ data: result });
});

whatsappRoutes.post("/ai/suggest", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { message } = body;

  const ai = getAI(env);
  const suggestions = await ai.suggestReplies(
    message,
    "CFwoot - WhatsApp customer support platform"
  );

  return c.json({ data: suggestions });
});

whatsappRoutes.post("/ai/summarize", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { conversationId } = body;

  const db = createDb(env);

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(50);

  const ai = getAI(env);
  const result = await ai.summarizeConversation(
    history.reverse().map((m) => ({
      sender: m.messageType === "incoming" ? "Customer" : "Agent",
      content: m.content || "",
      timestamp: m.createdAt?.toISOString() || "",
    }))
  );

  return c.json({ data: result });
});

whatsappRoutes.post("/ai/intent", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { message } = body;

  const ai = getAI(env);
  const result = await ai.detectIntent(message);

  return c.json({ data: result });
});

// ─── Save WhatsApp channel config (with encrypted token) ───

whatsappRoutes.post("/config", async (c) => {
  const env = c.env as WhatsAppEnv;
  const body = await c.req.json();
  const { phoneNumberId, phoneNumber, businessAccountId, accessToken, appSecret, verifyToken } = body;

  const db = createDb(env);

  const encryptedToken = await encrypt(accessToken, env.ENCRYPTION_SECRET);

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

// ─── Mock mode: simulate inbound message ───

whatsappRoutes.post("/mock/inbound", async (c) => {
  const env = c.env as WhatsAppEnv;

  if (env.MOCK_MODE !== "true") {
    return c.json({ error: "Mock mode is not enabled" }, 400);
  }

  const body = await c.req.json();
  const { from, message, type = "text" } = body;

  const db = createDb(env);
  const msgId = `mock_${Date.now()}`;

  // Find or create contact
  const [existingContact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.phone, from))
    .limit(1);

  let contactId = existingContact?.id;
  if (!contactId) {
    const [newContact] = await db
      .insert(contacts)
      .values({
        accountId: 1,
        name: `Mock Contact ${from}`,
        phone: from,
        contactType: "visitor",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    contactId = newContact.id;
  }

  // Find or create conversation
  const [existingConvo] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.contactId, contactId))
    .limit(1);

  let conversationId = existingConvo?.id;
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

  // Store message
  await db.insert(messages).values({
    conversationId,
    accountId: 1,
    messageType: "incoming",
    contentType: type as any,
    content: message,
    sourceId: msgId,
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
    content: message,
    content_type: type,
    from,
  });

  // Try auto-reply (non-blocking)
  tryAutoReply(db, env, conversationId, message, contactId).catch((err) => {
    log.error("Auto-reply failed", { error: String(err) });
  });

  recordMetric("webhook_processed");

  return c.json({
    success: true,
    messageId: msgId,
    conversationId,
    contactId,
  });
});

// ─── Webhook endpoint ───

whatsappRoutes.get("/webhook", async (c) => {
  const env = c.env as WhatsAppEnv;
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  if (mode === "subscribe") {
    const db = createDb(env);
    const channel = await db.select().from(channelWhatsapp).limit(1);

    if (channel.length > 0 && channel[0].verifyToken) {
      try {
        const storedToken = await decrypt(channel[0].verifyToken, env.ENCRYPTION_SECRET);
        if (token === storedToken) {
          log.info("Webhook verified");
          return c.text(challenge || "");
        }
      } catch {}
    }

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
    const { createHmac } = await import("node:crypto");
    const expectedSignature =
      "sha256=" +
      createHmac("sha256", env.WHATSAPP_APP_SECRET).update(rawBody).digest("hex");

    if (signature !== expectedSignature) {
      log.warn("Invalid webhook signature");
      return c.json({ error: "Invalid signature" }, 403);
    }
  }

  const body = JSON.parse(rawBody);

  // Return 200 to Meta immediately
  const responsePromise = c.json({ success: true });

  // Process async
  processWebhookAsync(body, db, env).catch((err) => {
    log.error("Webhook processing error", { error: String(err) });
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

      if (value.messages) {
        for (const msg of value.messages) {
          await handleIncomingMessage(msg, value.contacts, db, env);
        }
      }

      if (value.statuses) {
        for (const status of value.statuses) {
          await handleStatusUpdate(status, db);
        }
      }
    }
  }

  recordMetric("webhook_processed");
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

  // Dedup
  const existing = await db
    .select()
    .from(messages)
    .where(eq(messages.sourceId, msgId))
    .limit(1);

  if (existing.length > 0) {
    log.debug("Duplicate message ignored", { msgId });
    return;
  }

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
    log.info("Created new contact", { contactId, phone });
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
    log.info("Created new conversation", { conversationId, contactId });
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

  // Try auto-reply
  tryAutoReply(db, env, conversationId, content, contactId).catch((err) => {
    log.error("Auto-reply failed", { error: String(err), conversationId });
  });

  log.info("Incoming message processed", { conversationId, contactId, msgType });
}

async function handleStatusUpdate(status: any, db: ReturnType<typeof createDb>): Promise<void> {
  const msgId = status.id;

  // Update message status in contentAttributes
  const [msg] = await db
    .select()
    .from(messages)
    .where(eq(messages.sourceId, msgId))
    .limit(1);

  if (msg) {
    await db
      .update(messages)
      .set({
        contentAttributes: {
          ...(msg.contentAttributes as Record<string, any> || {}),
          status: status.status,
          status_timestamp: status.timestamp,
        },
        updatedAt: new Date(),
      })
      .where(eq(messages.id, msg.id));
  }
}

export { whatsappRoutes };
