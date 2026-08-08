import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "../api";

export const useAuthStore = defineStore("auth", () => {
  const session = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!session.value);
  const user = computed(() => session.value?.user);
  const accountId = computed(() => session.value?.session?.accountId);

  async function checkSession() {
    try {
      loading.value = true;
      const result = await api.auth.session();
      session.value = result.session;
    } catch (e) {
      session.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function signin(email: string, password: string) {
    try {
      loading.value = true;
      error.value = null;
      const result = await api.auth.signin({ email, password });
      session.value = result;
      return true;
    } catch (e: any) {
      error.value = e.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function signup(name: string, email: string, password: string) {
    try {
      loading.value = true;
      error.value = null;
      const result = await api.auth.signup({ name, email, password });
      session.value = result;
      return true;
    } catch (e: any) {
      error.value = e.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function signout() {
    try {
      await api.auth.signout();
      session.value = null;
    } catch (e) {
      console.error("Signout error:", e);
    }
  }

  return {
    session,
    loading,
    error,
    isAuthenticated,
    user,
    accountId,
    checkSession,
    signin,
    signup,
    signout,
  };
});
