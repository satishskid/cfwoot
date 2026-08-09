<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <router-link to="/" class="text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </router-link>
        <div class="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">C</div>
        <div>
          <h1 class="text-sm font-semibold text-gray-900">Contact #{{ conversationId }}</h1>
          <p class="text-xs text-gray-500">{{ conversationsStore.currentConversation?.status || 'Loading...' }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <select v-if="conversationsStore.currentConversation"
          :value="conversationsStore.currentConversation.status"
          @change="updateStatus(($event.target as HTMLSelectElement).value)"
          class="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
        <button @click="showAiPanel = !showAiPanel"
          :class="['px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
            showAiPanel ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50']">
          AI Assistant
        </button>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <!-- Messages -->
      <div class="flex-1 flex flex-col">
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3">
          <div v-if="conversationsStore.loading" class="flex items-center justify-center h-32">
            <div class="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
          </div>
          <div v-else-if="conversationsStore.messages.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400">
            <p class="text-sm">No messages yet</p>
          </div>
          <template v-else>
            <div v-for="message in conversationsStore.messages" :key="message.id"
              :class="['flex', message.messageType === 'outgoing' ? 'justify-end' : 'justify-start']">
              <div v-if="message.messageType !== 'outgoing'" class="flex gap-2 max-w-[70%]">
                <div class="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">C</div>
                <div>
                  <div class="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-2.5 shadow-sm">
                    <p class="text-sm text-gray-900 whitespace-pre-wrap">{{ message.content }}</p>
                  </div>
                  <div class="flex items-center gap-2 mt-1 px-1">
                    <span class="text-[10px] text-gray-400">{{ formatTime(message.createdAt) }}</span>
                    <span v-if="(message.contentAttributes as any)?.ai_generated" class="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">AI</span>
                  </div>
                </div>
              </div>
              <div v-else class="max-w-[70%]">
                <div class="bg-green-600 text-white rounded-2xl rounded-tr-md px-4 py-2.5">
                  <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
                </div>
                <div class="flex items-center gap-2 mt-1 px-1 justify-end">
                  <span class="text-[10px] text-gray-400">{{ formatTime(message.createdAt) }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- AI Suggestions -->
        <div v-if="aiSuggestions.length > 0" class="px-4 py-2 bg-blue-50 border-t border-blue-100">
          <p class="text-xs font-medium text-blue-700 mb-1">AI Suggestions:</p>
          <div class="flex gap-2 flex-wrap">
            <button v-for="(suggestion, i) in aiSuggestions" :key="i" @click="useSuggestion(suggestion)"
              class="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
              {{ suggestion }}
            </button>
          </div>
        </div>

        <!-- Message Input -->
        <div class="bg-white border-t border-gray-200 p-4">
          <div class="flex gap-2">
            <input v-model="newMessage" type="text" placeholder="Type a message..."
              class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :disabled="sending" @keydown.enter="sendMessage" />
            <button @click="getAiSuggestions" class="px-3 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors" title="Get AI suggestions">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>
            <button @click="sendMessage"
              :disabled="!newMessage.trim() || sending"
              class="px-5 py-2 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {{ sending ? '...' : 'Send' }}
            </button>
          </div>
        </div>
      </div>

      <!-- AI Side Panel -->
      <div v-if="showAiPanel" class="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-sm font-semibold text-gray-900">AI Assistant</h2>
        </div>
        <div class="flex-1 p-4 space-y-4 overflow-y-auto">
          <div class="bg-gray-50 rounded-lg p-3">
            <p class="text-xs font-medium text-gray-700 mb-1">Quick Actions</p>
            <div class="space-y-2">
              <button @click="summarizeConversation" class="w-full text-left text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
                Summarize conversation
              </button>
              <button @click="detectIntent" class="w-full text-left text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
                Detect intent
              </button>
              <button @click="generateReply" class="w-full text-left text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
                Generate reply
              </button>
            </div>
          </div>
          <div v-if="aiResult" class="bg-green-50 rounded-lg p-3">
            <p class="text-xs font-medium text-green-700 mb-1">Result</p>
            <p class="text-xs text-gray-700 whitespace-pre-wrap">{{ aiResult }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useConversationsStore } from "../stores/conversations";
import { api } from "../api";

const router = useRouter();
const route = useRoute();
const conversationsStore = useConversationsStore();

const conversationId = parseInt(route.params.id as string);
const newMessage = ref("");
const sending = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const showAiPanel = ref(false);
const aiSuggestions = ref<string[]>([]);
const aiResult = ref("");
const aiTyping = ref(false);

function formatTime(timestamp: string | number | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function sendMessage() {
  if (!newMessage.value.trim() || sending.value) return;
  sending.value = true;
  try {
    await conversationsStore.sendMessage(conversationId, newMessage.value.trim());
    newMessage.value = "";
    aiSuggestions.value = [];
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error("Failed to send:", error);
  } finally {
    sending.value = false;
  }
}

async function updateStatus(status: string) {
  await conversationsStore.updateConversation(conversationId, { status });
}

function useSuggestion(suggestion: string) {
  newMessage.value = suggestion;
  aiSuggestions.value = [];
}

async function getAiSuggestions() {
  if (!newMessage.value.trim()) return;
  try {
    const res = await api.post("/v1/whatsapp/ai/suggest", { message: newMessage.value });
    aiSuggestions.value = res.data || [];
  } catch (e) {
    console.error("AI suggest failed:", e);
  }
}

async function summarizeConversation() {
  aiTyping.value = true;
  try {
    const res = await api.post("/v1/whatsapp/ai/summarize", { conversationId });
    aiResult.value = JSON.stringify(res.data, null, 2);
  } catch (e) {
    aiResult.value = "Failed to summarize";
  } finally {
    aiTyping.value = false;
  }
}

async function detectIntent() {
  if (!newMessage.value.trim()) return;
  try {
    const res = await api.post("/v1/whatsapp/ai/intent", { message: newMessage.value });
    aiResult.value = JSON.stringify(res.data, null, 2);
  } catch (e) {
    aiResult.value = "Failed to detect intent";
  }
}

async function generateReply() {
  aiTyping.value = true;
  try {
    const lastMsg = conversationsStore.messages[conversationsStore.messages.length - 1];
    const res = await api.post("/v1/whatsapp/ai/autoreply", {
      conversationId,
      message: lastMsg?.content || "",
    });
    aiResult.value = res.data?.reply || "No reply generated";
  } catch (e) {
    aiResult.value = "Failed to generate reply";
  } finally {
    aiTyping.value = false;
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

watch(() => conversationsStore.messages.length, () => {
  nextTick(scrollToBottom);
});
</script>
