<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/" class="text-gray-500 hover:text-gray-700">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </router-link>
          <h1 class="text-xl font-bold text-gray-900">Contacts</h1>
        </div>
        <button @click="showCreateModal = true" class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
          + Add Contact
        </button>
      </div>
    </header>

    <div class="max-w-6xl mx-auto px-6 py-6">
      <div class="bg-white rounded-xl border border-gray-200">
        <div class="p-4 border-b border-gray-100">
          <input v-model="search" type="text" placeholder="Search contacts..."
            class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>

        <div v-if="loading" class="p-8 text-center text-gray-400">
          <div class="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
        </div>

        <div v-else-if="filteredContacts.length === 0" class="p-8 text-center text-gray-400">
          <p>No contacts yet</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div v-for="contact in filteredContacts" :key="contact.id"
            class="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer">
            <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {{ contact.name?.charAt(0) || '?' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900">{{ contact.name || 'Unknown' }}</p>
              <p class="text-xs text-gray-500">{{ contact.phone || 'No phone' }}</p>
            </div>
            <span :class="['text-xs px-2 py-0.5 rounded-full', typeColors[contact.contactType || 'visitor']]">
              {{ contact.contactType || 'visitor' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { api } from "../../api";

const contacts = ref<any[]>([]);
const loading = ref(true);
const search = ref("");
const showCreateModal = ref(false);

const typeColors: Record<string, string> = {
  visitor: "bg-gray-100 text-gray-600",
  lead: "bg-blue-100 text-blue-600",
  customer: "bg-green-100 text-green-600",
};

const filteredContacts = computed(() => {
  if (!search.value) return contacts.value;
  const s = search.value.toLowerCase();
  return contacts.value.filter(
    (c) => c.name?.toLowerCase().includes(s) || c.phone?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s)
  );
});

onMounted(async () => {
  try {
    const res = await api.get("/v1/contacts");
    contacts.value = res.data || [];
  } catch (e) {
    console.error("Failed to load contacts:", e);
  } finally {
    loading.value = false;
  }
});
</script>
