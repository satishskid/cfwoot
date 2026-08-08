import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "../api";

export const useAIStore = defineStore("ai", () => {
  const knowledgeArticles = ref<any[]>([]);
  const suggestedReplies = ref<string[]>([]);
  const currentSummary = ref<any>(null);
  const loading = ref(false);

  const fetchKnowledgeArticles = async (accountId = 1) => {
    loading.value = true;
    try {
      const res = await api.get(`/api/v1/ai/knowledge?accountId=${accountId}`);
      knowledgeArticles.value = res.data;
    } finally {
      loading.value = false;
    }
  };

  const createKnowledgeArticle = async (data: any) => {
    await api.post("/api/v1/ai/knowledge", data);
    await fetchKnowledgeArticles(data.accountId);
  };

  const updateKnowledgeArticle = async (id: number, data: any) => {
    await api.put(`/api/v1/ai/knowledge/${id}`, data);
  };

  const deleteKnowledgeArticle = async (id: number) => {
    await api.delete(`/api/v1/ai/knowledge/${id}`);
  };

  const getSuggestions = async (conversationId: number, messageId?: number) => {
    const res = await api.post("/api/v1/ai/suggest", { conversationId, messageId });
    suggestedReplies.value = res.suggestions || [];
    return suggestedReplies.value;
  };

  const summarizeConversation = async (conversationId: number) => {
    const res = await api.post("/api/v1/ai/summarize", { conversationId });
    currentSummary.value = res;
    return res;
  };

  const analyzeIntent = async (message: string) => {
    const res = await api.post("/api/v1/ai/analyze", { message });
    return res;
  };

  return {
    knowledgeArticles,
    suggestedReplies,
    currentSummary,
    loading,
    fetchKnowledgeArticles,
    createKnowledgeArticle,
    updateKnowledgeArticle,
    deleteKnowledgeArticle,
    getSuggestions,
    summarizeConversation,
    analyzeIntent,
  };
});
