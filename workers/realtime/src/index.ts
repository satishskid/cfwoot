import { createClient } from "@libsql/client/web";

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  REALTIME_ROOM: DurableObjectNamespace;
}

export class ConversationRoom {
  private connections: Map<WebSocket, { userId?: number; accountId: number; conversationId: number }>;
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.connections = new Map();

    // Load conversation ID from state
    this.state.blockConcurrencyWhile(async () => {
      const conversationId = await this.state.storage.get<number>("conversationId");
      if (conversationId) {
        this.state.id; // Keep state alive
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const conversationId = parseInt(url.searchParams.get("conversationId") || "0");
      const token = url.searchParams.get("token");

      if (!conversationId) {
        return new Response("conversationId required", { status: 400 });
      }

      // Store conversation ID
      await this.state.storage.put("conversationId", conversationId);

      // Create WebSocket pair
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];

      // Accept the WebSocket
      this.state.acceptWebSocket(server);

      // Add to connections
      this.connections.set(server, {
        conversationId,
        accountId: 1, // Default account
      });

      console.log(`WebSocket connected for conversation ${conversationId}`);

      return new Response(null, { status: 101, webSocket: client });
    }

    // HTTP API for sending messages
    if (request.method === "POST" && url.pathname === "/broadcast") {
      const body = await request.json() as any;
      await this.broadcast(body);
      return new Response("OK");
    }

    return new Response("Not found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const data = JSON.parse(message as string);
      const connectionInfo = this.connections.get(ws);

      if (!connectionInfo) return;

      switch (data.type) {
        case "message.create":
          await this.handleNewMessage(data, connectionInfo);
          break;
        case "message.update":
          await this.handleMessageUpdate(data, connectionInfo);
          break;
        case "conversation.update":
          await this.handleConversationUpdate(data, connectionInfo);
          break;
        case "typing":
          await this.broadcastTyping(data, connectionInfo);
          break;
        case "presence":
          await this.broadcastPresence(data, connectionInfo);
          break;
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    const connectionInfo = this.connections.get(ws);
    if (connectionInfo) {
      console.log(`WebSocket disconnected for conversation ${connectionInfo.conversationId}`);
      this.connections.delete(ws);

      // Broadcast disconnection
      await this.broadcast({
        type: "presence.update",
        data: {
          status: "offline",
          timestamp: Date.now(),
        },
      });
    }
  }

  async webSocketError(ws: WebSocket, error: any) {
    console.error("WebSocket error:", error);
    this.connections.delete(ws);
  }

  private async handleNewMessage(data: any, connectionInfo: any) {
    const db = createClient({
      url: this.env.TURSO_DATABASE_URL,
      authToken: this.env.TURSO_AUTH_TOKEN,
    });

    const { conversationId, content, messageType = "outgoing" } = data;

    // Store message in database
    const result = await db.execute({
      sql: "INSERT INTO messages (conversation_id, account_id, message_type, content_type, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        conversationId,
        connectionInfo.accountId,
        messageType,
        "text",
        content,
        Date.now(),
        Date.now(),
      ],
    });

    const messageId = Number(result.lastInsertRowid);

    // Update conversation last activity
    await db.execute({
      sql: "UPDATE conversations SET last_activity_at = ?, updated_at = ? WHERE id = ?",
      args: [Date.now(), Date.now(), conversationId],
    });

    // Broadcast to all connected clients
    await this.broadcast({
      type: "message.created",
      data: {
        id: messageId,
        conversationId,
        content,
        messageType,
        createdAt: new Date().toISOString(),
      },
    });
  }

  private async handleMessageUpdate(data: any, connectionInfo: any) {
    await this.broadcast({
      type: "message.updated",
      data: data,
    });
  }

  private async handleConversationUpdate(data: any, connectionInfo: any) {
    const db = createClient({
      url: this.env.TURSO_DATABASE_URL,
      authToken: this.env.TURSO_AUTH_TOKEN,
    });

    const { conversationId, ...updateData } = data;

    // Update conversation in database
    const setClauses = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);

    if (setClauses) {
      await db.execute({
        sql: `UPDATE conversations SET ${setClauses}, updated_at = ? WHERE id = ?`,
        args: [...values, Date.now(), conversationId],
      });
    }

    // Broadcast update
    await this.broadcast({
      type: "conversation.updated",
      data: data,
    });
  }

  private async broadcastTyping(data: any, connectionInfo: any) {
    await this.broadcast({
      type: "typing",
      data: {
        conversationId: connectionInfo.conversationId,
        userId: connectionInfo.userId,
        isTyping: data.isTyping,
      },
    });
  }

  private async broadcastPresence(data: any, connectionInfo: any) {
    await this.broadcast({
      type: "presence.update",
      data: {
        userId: connectionInfo.userId,
        status: data.status,
        timestamp: Date.now(),
      },
    });
  }

  async broadcast(message: any) {
    const payload = JSON.stringify(message);
    const dead: WebSocket[] = [];

    for (const [ws] of this.connections) {
      try {
        ws.send(payload);
      } catch (error) {
        dead.push(ws);
      }
    }

    // Clean up dead connections
    dead.forEach((ws) => this.connections.delete(ws));
  }
}

// Main worker entry
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Route to Durable Object for WebSocket
    if (url.pathname.startsWith("/ws/conversation/")) {
      const conversationId = url.pathname.split("/")[3];
      const roomStub = env.REALTIME_ROOM.get(
        env.REALTIME_ROOM.idFromName(`conversation:${conversationId}`)
      );
      return roomStub.fetch(request);
    }

    // HTTP API for broadcasting
    if (request.method === "POST" && url.pathname === "/broadcast") {
      const body = await request.json() as any;
      const { conversationId, ...message } = body;

      if (!conversationId) {
        return new Response("conversationId required", { status: 400 });
      }

      const roomStub = env.REALTIME_ROOM.get(
        env.REALTIME_ROOM.idFromName(`conversation:${conversationId}`)
      );

      await roomStub.fetch(
        new Request("https://internal/broadcast", {
          method: "POST",
          body: JSON.stringify(message),
        })
      );

      return new Response("OK");
    }

    return new Response("Chatwoot Realtime Service", { status: 200 });
  },
};
