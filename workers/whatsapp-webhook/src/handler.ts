import { createClient } from "@libsql/client/web";

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_APP_SECRET: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Webhook verification (GET)
    if (request.method === "GET" && url.pathname === "/webhooks/whatsapp") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
        console.log("Webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }

      console.log("Webhook verification failed");
      return new Response("Forbidden", { status: 403 });
    }

    // Webhook events (POST)
    if (request.method === "POST" && url.pathname === "/webhooks/whatsapp") {
      try {
        const body = await request.json() as any;

        // Verify signature (simplified - implement HMAC-SHA256 in production)
        const signature = request.headers.get("x-hub-signature-256");
        if (!this.verifySignature(body, signature, env.WHATSAPP_APP_SECRET)) {
          console.log("Invalid signature");
          return new Response("Invalid signature", { status: 403 });
        }

        // Process entries asynchronously
        const ctx = (globalThis as any).waitUntil || ((p: Promise<any>) => p);
        ctx(this.processEntries(body, env));

        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error("Webhook error:", error);
        return new Response("OK", { status: 200 }); // Always return 200 to Meta
      }
    }

    return new Response("Not found", { status: 404 });
  },

  async processEntries(body: any, env: Env) {
    const db = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "messages") {
          await this.processMessages(change.value, db, env);
        }
      }
    }
  },

  async processMessages(value: any, db: any, env: Env) {
    // Handle incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        await this.handleIncomingMessage(message, db, env);
      }
    }

    // Handle status updates
    if (value.statuses) {
      for (const status of value.statuses) {
        await this.handleStatusUpdate(status, db);
      }
    }
  },

  async handleIncomingMessage(message: any, db: any, env: Env) {
    const phone = message.from;
    const content = message.text?.body || "";
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp) * 1000;

    console.log(`Incoming message from ${phone}: ${content}`);

    // Find or create contact
    let contactResult = await db.execute({
      sql: "SELECT * FROM contacts WHERE phone = ?",
      args: [phone],
    });

    let contactId: number;

    if (contactResult.rows.length === 0) {
      const insertResult = await db.execute({
        sql: "INSERT INTO contacts (account_id, phone, contact_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        args: [1, phone, "visitor", Date.now(), Date.now()],
      });
      contactId = Number(insertResult.lastInsertRowid);
      console.log(`Created new contact: ${contactId}`);
    } else {
      contactId = contactResult.rows[0].id;
    }

    // Find open conversation or create new one
    let conversationResult = await db.execute({
      sql: "SELECT * FROM conversations WHERE contact_id = ? AND status != ? ORDER BY created_at DESC LIMIT 1",
      args: [contactId, "resolved"],
    });

    let conversationId: number;

    if (conversationResult.rows.length === 0) {
      const insertResult = await db.execute({
        sql: "INSERT INTO conversations (uuid, account_id, inbox_id, contact_id, status, priority, created_at, updated_at, last_activity_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          crypto.randomUUID(),
          1, // accountId
          1, // inboxId
          contactId,
          "open",
          "medium",
          Date.now(),
          Date.now(),
          Date.now(),
        ],
      });
      conversationId = Number(insertResult.lastInsertRowid);
      console.log(`Created new conversation: ${conversationId}`);
    } else {
      conversationId = conversationResult.rows[0].id;
    }

    // Store message
    await db.execute({
      sql: "INSERT INTO messages (conversation_id, account_id, message_type, content_type, content, source_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        conversationId,
        1, // accountId
        "incoming",
        "text",
        content,
        messageId,
        timestamp,
        timestamp,
      ],
    });

    // Update conversation last activity
    await db.execute({
      sql: "UPDATE conversations SET last_activity_at = ?, updated_at = ? WHERE id = ?",
      args: [Date.now(), Date.now(), conversationId],
    });

    console.log(`Message stored in conversation ${conversationId}`);
  },

  async handleStatusUpdate(status: any, db: any) {
    const { id: messageId, status: deliveryStatus, timestamp } = status;

    console.log(`Message ${messageId} status: ${deliveryStatus}`);

    // Update message delivery status
    await db.execute({
      sql: "UPDATE messages SET content_attributes = json_set(COALESCE(content_attributes, '{}'), ?, ?) WHERE source_id = ?",
      args: [`$.deliveryStatus`, deliveryStatus, messageId],
    });
  },

  verifySignature(body: any, signature: string | null, appSecret: string): boolean {
    // In production, implement HMAC-SHA256 verification
    // For now, accept all requests (you should implement this properly)
    if (!signature) {
      console.log("No signature provided");
      return true; // Allow in dev, reject in production
    }
    return true;
  },
};
