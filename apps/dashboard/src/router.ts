import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("./views/Login.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/",
      name: "Dashboard",
      component: () => import("./views/Dashboard.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/conversation/:id",
      name: "Conversation",
      component: () => import("./views/Conversation.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.session) {
    await authStore.checkSession();
    if (!authStore.session) {
      next("/login");
      return;
    }
  }

  next();
});

export default router;
