import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "../api";

export const useConversationsStore = defineStore("conversations", () => {
  const conversations = ref<any[]>([]);
  const currentConversation = ref<any>(null);
  const messages = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const openConversations = computed(() =>
    conversations.value.filter((c) => c.status === "open")
  );

  const resolvedConversations = computed(() =>
    conversations.value.filter((c) => c.status === "resolved")
  );

  async function fetchConversations(params?: { status?: string }) {
    try {
      loading.value = true;
      const result = await api.conversations.list(params);
      conversations.value = result.data;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchConversation(id: number) {
    try {
      loading.value = true;
      const result = await api.conversations.get(id);
      currentConversation.value = result.data;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMessages(conversationId: number) {
    try {
      loading.value = true;
      const result = await api.conversations.messages(conversationId);
      messages.value = result.data;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function sendMessage(conversationId: number, content: string) {
    try {
      const result = await api.messages.send({
        conversationId,
        content,
        messageType: "outgoing",
      });

      // Add message to local state
      messages.value.push({
        id: result.id,
        conversationId,
        content,
        messageType: "outgoing",
        createdAt: new Date().toISOString(),
      });

      return result;
    } catch (e: any) {
      error.value = e.message;
      throw e;
    }
  }

  async function updateConversation(id: number, data: any) {
    try {
      await api.conversations.update(id, data);
      await fetchConversation(id);
    } catch (e: any) {
      error.value = e.message;
      throw e;
    }
  }

  function addMessage(message: any) {
    // Check if message already exists
    const exists = messages.value.find((m) => m.id === message.id);
    if (!exists) {
      messages.value.push(message);
    }
  }

  function updateConversationInList(conversation: any) {
    const index = conversations.value.findIndex((c) => c.id === conversation.id);
    if (index !== -1) {
      conversations.value[index] = {
        ...conversations.value[index],
        ...conversation,
      };
    }
  }

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    openConversations,
    resolvedConversations,
    fetchConversations,
    fetchConversation,
    fetchMessages,
    sendMessage,
    updateConversation,
    addMessage,
    updateConversationInList,
  };
});
