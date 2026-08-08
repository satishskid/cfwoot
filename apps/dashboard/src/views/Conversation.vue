<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <button
            @click="goBack"
            class="text-gray-600 hover:text-gray-900"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 class="text-lg font-semibold text-gray-900">
              Conversation #{{ conversationId }}
            </h1>
            <p class="text-sm text-gray-500">
              {{ conversationsStore.currentConversation?.status || "Loading..." }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <select
            v-if="conversationsStore.currentConversation"
            :value="conversationsStore.currentConversation.status"
            @change="updateStatus(($event.target as HTMLSelectElement).value)"
            class="px-3 py-1 text-sm border border-gray-300 rounded-md"
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>
    </header>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-if="conversationsStore.loading" class="text-center text-gray-500">
        Loading messages...
      </div>

      <div v-else-if="conversationsStore.messages.length === 0" class="text-center text-gray-500">
        No messages yet. Start the conversation!
      </div>

      <div
        v-for="message in conversationsStore.messages"
        :key="message.id"
        :class="[
          'flex',
          message.messageType === 'outgoing' ? 'justify-end' : 'justify-start',
        ]"
      >
        <div
          :class="[
            'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
            message.messageType === 'outgoing'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-200 text-gray-900',
          ]"
        >
          <p class="text-sm">{{ message.content }}</p>
          <p
            :class="[
              'text-xs mt-1',
              message.messageType === 'outgoing'
                ? 'text-primary-200'
                : 'text-gray-500',
            ]"
          >
            {{ formatTime(message.createdAt) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Message input -->
    <div class="bg-white border-t border-gray-200 p-4">
      <form @submit.prevent="sendMessage" class="flex space-x-2">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Type a message..."
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          :disabled="sending"
        />
        <button
          type="submit"
          :disabled="!newMessage.trim() || sending"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ sending ? "Sending..." : "Send" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useConversationsStore } from "../stores/conversations";

const router = useRouter();
const route = useRoute();
const conversationsStore = useConversationsStore();

const conversationId = parseInt(route.params.id as string);
const newMessage = ref("");
const sending = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

function formatTime(timestamp: string | number | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function goBack() {
  router.push("/");
}

async function sendMessage() {
  if (!newMessage.value.trim() || sending.value) return;

  sending.value = true;
  try {
    await conversationsStore.sendMessage(conversationId, newMessage.value.trim());
    newMessage.value = "";
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error("Failed to send message:", error);
  } finally {
    sending.value = false;
  }
}

async function updateStatus(status: string) {
  try {
    await conversationsStore.updateConversation(conversationId, { status });
  } catch (error) {
    console.error("Failed to update status:", error);
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

onMounted(async () => {
  await conversationsStore.fetchConversation(conversationId);
  await conversationsStore.fetchMessages(conversationId);
  await nextTick();
  scrollToBottom();
});

watch(
  () => conversationsStore.messages.length,
  () => {
    nextTick(scrollToBottom);
  }
);
</script>
