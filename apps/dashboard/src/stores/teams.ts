import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "../api";

export const useTeamsStore = defineStore("teams", () => {
  const teams = ref<any[]>([]);
  const slaPolicies = ref<any[]>([]);
  const slaBreaches = ref<any[]>([]);
  const loading = ref(false);

  const fetchTeams = async (accountId = 1) => {
    loading.value = true;
    try {
      const res = await api.get(`/api/v1/teams?accountId=${accountId}`);
      teams.value = res.data;
    } finally {
      loading.value = false;
    }
  };

  const createTeam = async (data: any) => {
    const res = await api.post("/api/v1/teams", data);
    await fetchTeams(data.accountId);
    return res;
  };

  const updateTeam = async (id: number, data: any) => {
    await api.put(`/api/v1/teams/${id}`, data);
  };

  const deleteTeam = async (id: number) => {
    await api.delete(`/api/v1/teams/${id}`);
  };

  const addTeamMember = async (teamId: number, userId: number, role = "agent") => {
    return await api.post(`/api/v1/teams/${teamId}/members`, { userId, role });
  };

  const removeTeamMember = async (teamId: number, userId: number) => {
    return await api.delete(`/api/v1/teams/${teamId}/members/${userId}`);
  };

  const getTeamMembers = async (teamId: number) => {
    const res = await api.get(`/api/v1/teams/${teamId}/members`);
    return res.data;
  };

  // SLA
  const fetchSLAPolicies = async (accountId = 1) => {
    const res = await api.get(`/api/v1/sla?accountId=${accountId}`);
    slaPolicies.value = res.data;
  };

  const createSLAPolicy = async (data: any) => {
    const res = await api.post("/api/v1/sla", data);
    await fetchSLAPolicies(data.accountId);
    return res;
  };

  const updateSLAPolicy = async (id: number, data: any) => {
    await api.put(`/api/v1/sla/${id}`, data);
  };

  const deleteSLAPolicy = async (id: number) => {
    await api.delete(`/api/v1/sla/${id}`);
  };

  const fetchSLABreaches = async (conversationId?: number) => {
    const url = conversationId
      ? `/api/v1/sla/breaches?conversationId=${conversationId}`
      : "/api/v1/sla/breaches";
    const res = await api.get(url);
    slaBreaches.value = res.data;
  };

  return {
    teams,
    slaPolicies,
    slaBreaches,
    loading,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    getTeamMembers,
    fetchSLAPolicies,
    createSLAPolicy,
    updateSLAPolicy,
    deleteSLAPolicy,
    fetchSLABreaches,
  };
});
