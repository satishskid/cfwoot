import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "../api";

export const useFlowsStore = defineStore("flows", () => {
  const flows = ref<any[]>([]);
  const currentFlow = ref<any>(null);
  const loading = ref(false);

  const fetchFlows = async (accountId = 1) => {
    loading.value = true;
    try {
      const res = await api.get(`/api/v1/flows?accountId=${accountId}`);
      flows.value = res.data;
    } finally {
      loading.value = false;
    }
  };

  const fetchFlow = async (id: number) => {
    const res = await api.get(`/api/v1/flows/${id}`);
    currentFlow.value = res.data;
    return res.data;
  };

  const createFlow = async (data: any) => {
    const res = await api.post("/api/v1/flows", data);
    await fetchFlows(data.accountId);
    return res;
  };

  const updateFlow = async (id: number, data: any) => {
    await api.put(`/api/v1/flows/${id}`, data);
  };

  const deleteFlow = async (id: number) => {
    await api.delete(`/api/v1/flows/${id}`);
  };

  const publishFlow = async (id: number) => {
    const res = await api.post(`/api/v1/flows/${id}/publish`);
    await fetchFlows();
    return res;
  };

  const sendFlow = async (id: number, contactId: number) => {
    return await api.post(`/api/v1/flows/${id}/send`, { contactId });
  };

  const getFlowResponses = async (id: number) => {
    const res = await api.get(`/api/v1/flows/${id}/responses`);
    return res.data;
  };

  return {
    flows,
    currentFlow,
    loading,
    fetchFlows,
    fetchFlow,
    createFlow,
    updateFlow,
    deleteFlow,
    publishFlow,
    sendFlow,
    getFlowResponses,
  };
});
