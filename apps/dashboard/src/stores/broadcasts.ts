import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "../api";

export const useBroadcastsStore = defineStore("broadcasts", () => {
  const campaigns = ref<any[]>([]);
  const currentCampaign = ref<any>(null);
  const loading = ref(false);

  const fetchCampaigns = async (accountId = 1) => {
    loading.value = true;
    try {
      const res = await api.get(`/api/v1/broadcasts?accountId=${accountId}`);
      campaigns.value = res.data;
    } finally {
      loading.value = false;
    }
  };

  const fetchCampaign = async (id: number) => {
    const res = await api.get(`/api/v1/broadcasts/${id}`);
    currentCampaign.value = res.data;
    return res.data;
  };

  const createCampaign = async (data: any) => {
    const res = await api.post("/api/v1/broadcasts", data);
    await fetchCampaigns(data.accountId);
    return res;
  };

  const updateCampaign = async (id: number, data: any) => {
    await api.put(`/api/v1/broadcasts/${id}`, data);
  };

  const deleteCampaign = async (id: number) => {
    await api.delete(`/api/v1/broadcasts/${id}`);
  };

  const sendCampaign = async (id: number) => {
    const res = await api.post(`/api/v1/broadcasts/${id}/send`);
    await fetchCampaigns();
    return res;
  };

  const scheduleCampaign = async (id: number, scheduledAt: string) => {
    return await api.post(`/api/v1/broadcasts/${id}/schedule`, { scheduledAt });
  };

  const getCampaignStats = async (id: number) => {
    const res = await api.get(`/api/v1/broadcasts/${id}/stats`);
    return res.data;
  };

  const getCampaignRecipients = async (id: number) => {
    const res = await api.get(`/api/v1/broadcasts/${id}/recipients`);
    return res.data;
  };

  return {
    campaigns,
    currentCampaign,
    loading,
    fetchCampaigns,
    fetchCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    scheduleCampaign,
    getCampaignStats,
    getCampaignRecipients,
  };
});
