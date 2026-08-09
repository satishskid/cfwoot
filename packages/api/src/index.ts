import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createAuth } from "./auth";
import { authRoutes } from "./routes/auth.routes";
import { conversationRoutes } from "./routes/conversations.routes";
import { contactRoutes } from "./routes/contacts.routes";
import { messageRoutes } from "./routes/messages.routes";
import { whatsappRoutes } from "./routes/whatsapp.routes";
import { aiRoutes } from "./routes/ai.routes";
import { flowRoutes } from "./routes/flows.routes";
import { botRoutes } from "./routes/bots.routes";
import { broadcastRoutes } from "./routes/broadcasts.routes";
import { ecommerceRoutes } from "./routes/ecommerce.routes";
import { teamRoutes, slaRoutes } from "./routes/teams.routes";
import { apiKeyRoutes } from "./routes/api-keys.routes";
import { webhookRoutes } from "./routes/webhooks.routes";
import { customFieldRoutes } from "./routes/custom-fields.routes";
import { publicRoutes } from "./routes/public.routes";

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
  ENCRYPTION_SECRET: string;
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

// Internal API routes (auth-required via Better Auth session)
app.route("/api/v1/conversations", conversationRoutes);
app.route("/api/v1/contacts", contactRoutes);
app.route("/api/v1/messages", messageRoutes);
app.route("/api/v1/whatsapp", whatsappRoutes);
app.route("/api/v1/ai", aiRoutes);
app.route("/api/v1/flows", flowRoutes);
app.route("/api/v1/bots", botRoutes);
app.route("/api/v1/broadcasts", broadcastRoutes);
app.route("/api/v1/ecommerce", ecommerceRoutes);
app.route("/api/v1/teams", teamRoutes);
app.route("/api/v1/sla", slaRoutes);
app.route("/api/v1/api-keys", apiKeyRoutes);
app.route("/api/v1/webhooks", webhookRoutes);
app.route("/api/v1/custom-fields", customFieldRoutes);

// Public REST API (API key auth, scoped, rate-limited)
app.route("/api/v1/public", publicRoutes);

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

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
