import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "../api";

export const useBotsStore = defineStore("bots", () => {
  const bots = ref<any[]>([]);
  const currentBot = ref<any>(null);
  const loading = ref(false);

  const fetchBots = async (accountId = 1) => {
    loading.value = true;
    try {
      const res = await api.get(`/api/v1/bots?accountId=${accountId}`);
      bots.value = res.data;
    } finally {
      loading.value = false;
    }
  };

  const fetchBot = async (id: number) => {
    const res = await api.get(`/api/v1/bots/${id}`);
    currentBot.value = res.data;
    return res.data;
  };

  const createBot = async (data: any) => {
    const res = await api.post("/api/v1/bots", data);
    await fetchBots(data.accountId);
    return res;
  };

  const updateBot = async (id: number, data: any) => {
    await api.put(`/api/v1/bots/${id}`, data);
  };

  const deleteBot = async (id: number) => {
    await api.delete(`/api/v1/bots/${id}`);
  };

  const activateBot = async (id: number) => {
    await api.post(`/api/v1/bots/${id}/activate`);
  };

  const deactivateBot = async (id: number) => {
    await api.post(`/api/v1/bots/${id}/deactivate`);
  };

  const testBot = async (id: number, conversationId = 0) => {
    return await api.post(`/api/v1/bots/${id}/test`, { conversationId });
  };

  const getBotExecutions = async (id: number) => {
    const res = await api.get(`/api/v1/bots/${id}/executions`);
    return res.data;
  };

  return {
    bots,
    currentBot,
    loading,
    fetchBots,
    fetchBot,
    createBot,
    updateBot,
    deleteBot,
    activateBot,
    deactivateBot,
    testBot,
    getBotExecutions,
  };
});
