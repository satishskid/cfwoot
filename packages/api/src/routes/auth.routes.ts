import { Hono } from "hono";
import { createAuth, type Env } from "../auth";

const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post("/signup", async (c) => {
  try {
    const auth = createAuth(c.env);
    const body = await c.req.json();
    
    const result = await auth.api.signUpEmail({
      body: {
        name: body.name,
        email: body.email,
        password: body.password,
      },
    });

    return c.json({ user: result.user, session: result.session });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

authRoutes.post("/signin", async (c) => {
  try {
    const auth = createAuth(c.env);
    const body = await c.req.json();
    
    const result = await auth.api.signInEmail({
      body: {
        email: body.email,
        password: body.password,
      },
    });

    return c.json({ user: result.user, session: result.session });
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});

authRoutes.get("/session", async (c) => {
  try {
    const auth = createAuth(c.env);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    return c.json({ session });
  } catch (error) {
    return c.json({ session: null });
  }
});

authRoutes.post("/signout", async (c) => {
  try {
    const auth = createAuth(c.env);
    await auth.api.signOut({
      headers: c.req.raw.headers,
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

export { authRoutes };
