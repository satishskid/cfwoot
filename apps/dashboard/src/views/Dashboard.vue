<template>
  <div class="h-screen flex bg-gray-50">
    <!-- Sidebar Navigation -->
    <aside class="w-64 bg-gray-900 text-white flex flex-col">
      <div class="p-4 border-b border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-sm font-bold">C</div>
          <span class="font-bold text-lg">CFwoot</span>
        </div>
      </div>

      <nav class="flex-1 p-3 space-y-1">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          :class="$route.path === item.path ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800'">
          <span class="text-lg">{{ item.icon }}</span>
          {{ item.label }}
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm">
            {{ authStore.user?.name?.charAt(0) || 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ authStore.user?.name || 'User' }}</p>
            <p class="text-xs text-gray-400 truncate">{{ authStore.user?.email || '' }}</p>
          </div>
          <button @click="handleSignout" class="text-gray-400 hover:text-white" title="Sign out">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col">
      <!-- Conversation List Header -->
      <header class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900">Inbox</h1>
          <div class="flex items-center gap-3">
            <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button v-for="filter in filters" :key="filter.value" @click="currentFilter = filter.value"
                :class="['px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  currentFilter === filter.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900']">
                {{ filter.label }}
                <span v-if="filter.count" class="ml-1 bg-gray-200 text-gray-600 px-1.5 rounded-full text-[10px]">{{ filter.count }}</span>
              </button>
            </div>
            <button class="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
              + New Chat
            </button>
          </div>
        </div>
      </header>

      <!-- Conversation List -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="conversationsStore.loading" class="flex items-center justify-center h-32">
          <div class="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
        </div>

        <div v-else-if="filteredConversations.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg class="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="font-medium">No conversations yet</p>
          <p class="text-sm mt-1">Send a WhatsApp message to get started</p>
        </div>

        <div v-else>
          <div v-for="conversation in filteredConversations" :key="conversation.id"
            @click="openConversation(conversation.id)"
            :class="['px-6 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors',
              activeConversation === conversation.id ? 'bg-green-50 border-l-2 border-l-green-500' : '']">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold">
                {{ getInitials(conversation.contactId) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold text-gray-900 truncate">Contact #{{ conversation.contactId }}</p>
                  <span class="text-xs text-gray-400">{{ formatTime(conversation.lastActivityAt) }}</span>
                </div>
                <div class="flex items-center justify-between mt-0.5">
                  <p class="text-xs text-gray-500 truncate">{{ conversation.status }}</p>
                  <span :class="['text-[10px] font-medium px-1.5 py-0.5 rounded-full', statusColors[conversation.status]]">
                    {{ conversation.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel: Empty State or Quick Stats -->
    <div class="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-sm font-semibold text-gray-900 mb-4">Quick Stats</h2>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-green-50 rounded-lg p-3">
            <p class="text-2xl font-bold text-green-600">{{ stats.open }}</p>
            <p class="text-xs text-gray-500">Open</p>
          </div>
          <div class="bg-yellow-50 rounded-lg p-3">
            <p class="text-2xl font-bold text-yellow-600">{{ stats.pending }}</p>
            <p class="text-xs text-gray-500">Pending</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <p class="text-2xl font-bold text-gray-600">{{ stats.resolved }}</p>
            <p class="text-xs text-gray-500">Resolved</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-3">
            <p class="text-2xl font-bold text-blue-600">{{ stats.total }}</p>
            <p class="text-xs text-gray-500">Total</p>
          </div>
        </div>
      </div>

      <div class="p-6">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <div class="space-y-3">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3 text-sm">
            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
            <span class="text-gray-600">New message from Contact #{{ 100 + i }}</span>
          </div>
        </div>
      </div>

      <div class="mt-auto p-6 border-t border-gray-200">
        <h2 class="text-sm font-semibold text-gray-900 mb-2">System Status</h2>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">WhatsApp API</span>
            <span class="flex items-center gap-1.5 text-green-600">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span> Connected
            </span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">AI Auto-reply</span>
            <span class="flex items-center gap-1.5 text-green-600">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span> Active
            </span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Webhooks</span>
            <span class="flex items-center gap-1.5 text-green-600">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span> Healthy
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useConversationsStore } from "../stores/conversations";

const router = useRouter();
const authStore = useAuthStore();
const conversationsStore = useConversationsStore();

const currentFilter = ref("open");
const activeConversation = ref<number | null>(null);

const navItems = [
  { path: "/", icon: "💬", label: "Inbox" },
  { path: "/contacts", icon: "👥", label: "Contacts" },
  { path: "/flows", icon: "🔄", label: "Flows" },
  { path: "/bots", icon: "🤖", label: "Bots" },
  { path: "/broadcasts", icon: "📢", label: "Broadcasts" },
  { path: "/ai/knowledge", icon: "📚", label: "Knowledge Base" },
  { path: "/ai/settings", icon: "⚙️", label: "AI Settings" },
  { path: "/ecommerce", icon: "🛒", label: "E-commerce" },
  { path: "/settings", icon: "⚡", label: "Settings" },
];

const filters = computed(() => [
  { label: "All", value: "", count: conversationsStore.conversations.length },
  { label: "Open", value: "open", count: conversationsStore.conversations.filter((c) => c.status === "open").length },
  { label: "Pending", value: "pending", count: conversationsStore.conversations.filter((c) => c.status === "pending").length },
  { label: "Resolved", value: "resolved", count: conversationsStore.conversations.filter((c) => c.status === "resolved").length },
]);

const stats = computed(() => ({
  open: conversationsStore.conversations.filter((c) => c.status === "open").length,
  pending: conversationsStore.conversations.filter((c) => c.status === "pending").length,
  resolved: conversationsStore.conversations.filter((c) => c.status === "resolved").length,
  total: conversationsStore.conversations.length,
}));

const filteredConversations = computed(() => {
  if (!currentFilter.value) return conversationsStore.conversations;
  return conversationsStore.conversations.filter((c) => c.status === currentFilter.value);
});

function getInitials(contactId: number | null) {
  return contactId ? `C${contactId}`.substring(0, 2) : "??";
}

function formatTime(timestamp: number | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString();
}

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  resolved: "bg-gray-100 text-gray-600",
  snoozed: "bg-blue-100 text-blue-700",
};

function openConversation(id: number) {
  activeConversation.value = id;
  router.push(`/conversation/${id}`);
}

async function handleSignout() {
  await authStore.signout();
  router.push("/login");
}

onMounted(() => {
  conversationsStore.fetchConversations();
});
</script>
