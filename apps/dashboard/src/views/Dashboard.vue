<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Chatwoot</h1>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-600">{{ authStore.user?.name }}</span>
          <button
            @click="handleSignout"
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Conversation list sidebar -->
      <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div class="p-4 border-b border-gray-200">
          <div class="flex space-x-2">
            <button
              v-for="filter in filters"
              :key="filter.value"
              @click="currentFilter = filter.value"
              :class="[
                'px-3 py-1 text-sm rounded-full',
                currentFilter === filter.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ]"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="conversationsStore.loading" class="p-4 text-center text-gray-500">
            Loading...
          </div>

          <div v-else-if="filteredConversations.length === 0" class="p-4 text-center text-gray-500">
            No conversations
          </div>

          <div v-else>
            <div
              v-for="conversation in filteredConversations"
              :key="conversation.id"
              @click="openConversation(conversation.id)"
              class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      Contact #{{ conversation.contactId }}
                    </p>
                    <span class="text-xs text-gray-500">
                      {{ formatTime(conversation.lastActivityAt) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 truncate mt-1">
                    {{ conversation.status }}
                  </p>
                </div>
                <div class="ml-2">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      statusColors[conversation.status],
                    ]"
                  >
                    {{ conversation.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main area -->
      <div class="flex-1 flex flex-col bg-gray-50">
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
            <p class="mt-1 text-sm text-gray-500">
              Select a conversation from the list to start messaging
            </p>
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

const filters = [
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: "" },
];

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  resolved: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  snoozed: "bg-blue-100 text-blue-800",
};

const filteredConversations = computed(() => {
  if (!currentFilter.value) {
    return conversationsStore.conversations;
  }
  return conversationsStore.conversations.filter(
    (c) => c.status === currentFilter.value
  );
});

function formatTime(timestamp: number | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function openConversation(id: number) {
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
