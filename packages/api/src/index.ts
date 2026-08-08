import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createAuth } from "./auth";
import { authRoutes } from "./routes/auth.routes";
import { conversationRoutes } from "./routes/conversations.routes";
import { contactRoutes } from "./routes/contacts.routes";
import { messageRoutes } from "./routes/messages.routes";
import { whatsappRoutes } from "./routes/whatsapp.routes";

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_APP_SECRET: string;
  WHATSAPP_VERIFY_TOKEN: string;
  AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  ASSETS: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://*.pages.dev"],
    credentials: true,
  })
);

// Public routes
app.route("/api/auth", authRoutes);

// API routes
app.route("/api/v1/conversations", conversationRoutes);
app.route("/api/v1/contacts", contactRoutes);
app.route("/api/v1/messages", messageRoutes);
app.route("/api/v1/whatsapp", whatsappRoutes);

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

export default {
  fetch: app.fetch,
};
