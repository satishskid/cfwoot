/**
 * Structured logging for Cloudflare Workers.
 * Outputs JSON logs for easy parsing by analytics tools.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

class Logger {
  private minLevel: LogLevel;
  private context: Record<string, unknown>;

  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(minLevel: LogLevel = "info", context: Record<string, unknown> = {}) {
    this.minLevel = minLevel;
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private format(level: LogLevel, message: string, extra?: Record<string, unknown>): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...extra,
    };
    return JSON.stringify(entry);
  }

  debug(message: string, extra?: Record<string, unknown>) {
    if (this.shouldLog("debug")) {
      console.debug(this.format("debug", message, extra));
    }
  }

  info(message: string, extra?: Record<string, unknown>) {
    if (this.shouldLog("info")) {
      console.info(this.format("info", message, extra));
    }
  }

  warn(message: string, extra?: Record<string, unknown>) {
    if (this.shouldLog("warn")) {
      console.warn(this.format("warn", message, extra));
    }
  }

  error(message: string, extra?: Record<string, unknown>) {
    if (this.shouldLog("error")) {
      console.error(this.format("error", message, extra));
    }
  }

  child(context: Record<string, unknown>): Logger {
    return new Logger(this.minLevel, { ...this.context, ...context });
  }
}

// ─── Health Check ───

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: "ok" | "error";
    whatsapp: "ok" | "error" | "not_configured";
    ai: "ok" | "error" | "not_configured";
    encryption: "ok" | "error";
  };
  uptime: number;
}

const startTime = Date.now();

export async function checkHealth(env: {
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  ENCRYPTION_SECRET?: string;
  CF_WORKERS_AI_ACCOUNT_ID?: string;
}): Promise<HealthStatus> {
  const checks: HealthStatus["checks"] = {
    database: "error",
    whatsapp: "not_configured",
    ai: "not_configured",
    encryption: "error",
  };

  // Check database
  if (env.TURSO_DATABASE_URL) {
    try {
      const { createClient } = await import("@libsql/client");
      const client = createClient({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN,
      });
      await client.execute("SELECT 1");
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }
  }

  // Check WhatsApp config
  if (env.WHATSAPP_ACCESS_TOKEN) {
    checks.whatsapp = "ok";
  }

  // Check AI config
  if (env.CF_WORKERS_AI_ACCOUNT_ID) {
    checks.ai = "ok";
  }

  // Check encryption
  if (env.ENCRYPTION_SECRET && env.ENCRYPTION_SECRET.length >= 32) {
    checks.encryption = "ok";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");
  const anyError = Object.values(checks).some((v) => v === "error");

  return {
    status: allOk ? "healthy" : anyError ? "unhealthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    checks,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };
}

// ─── Request Metrics ───

const metrics = {
  requests: 0,
  errors: 0,
  webhookProcessed: 0,
  messagesSent: 0,
  aiRepliesGenerated: 0,
};

export function recordMetric(event: string) {
  switch (event) {
    case "request": metrics.requests++; break;
    case "error": metrics.errors++; break;
    case "webhook_processed": metrics.webhookProcessed++; break;
    case "message_sent": metrics.messagesSent++; break;
    case "ai_reply": metrics.aiRepliesGenerated++; break;
  }
}

export function getMetrics() {
  return { ...metrics, timestamp: new Date().toISOString() };
}

export { Logger };
