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
    // AI routes
    {
      path: "/ai/knowledge",
      name: "KnowledgeBase",
      component: () => import("./views/ai/KnowledgeBase.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/ai/settings",
      name: "AISettings",
      component: () => import("./views/ai/AISettings.vue"),
      meta: { requiresAuth: true },
    },
    // Flows routes
    {
      path: "/flows",
      name: "FlowList",
      component: () => import("./views/flows/FlowList.vue"),
      meta: { requiresAuth: true },
    },
    // Bot routes
    {
      path: "/bots",
      name: "BotList",
      component: () => import("./views/bots/BotList.vue"),
      meta: { requiresAuth: true },
    },
    // Broadcast routes
    {
      path: "/broadcasts",
      name: "BroadcastList",
      component: () => import("./views/broadcasts/BroadcastList.vue"),
      meta: { requiresAuth: true },
    },
    // E-commerce routes
    {
      path: "/ecommerce",
      name: "EcommerceDashboard",
      component: () => import("./views/ecommerce/EcommerceDashboard.vue"),
      meta: { requiresAuth: true },
    },
    // Settings routes
    {
      path: "/settings/teams",
      name: "TeamSettings",
      component: () => import("./views/settings/TeamSettings.vue"),
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
