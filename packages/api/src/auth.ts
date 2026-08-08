import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { createDb } from "./db";

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

export function createAuth(env: Env) {
  const db = createDb(env);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      usePlural: true,
    }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Refresh every 24h
    },
    account: {
      accountLinking: {
        enabled: true,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
