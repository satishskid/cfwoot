<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center gap-3">
        <router-link to="/" class="text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </router-link>
        <h1 class="text-xl font-bold text-gray-900">Settings</h1>
      </div>
    </header>

    <div class="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <!-- WhatsApp Config -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900">WhatsApp Configuration</h2>
          <p class="text-sm text-gray-500 mt-1">Connect your WhatsApp Business API</p>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
              <input v-model="whatsappConfig.phoneNumberId" type="text" placeholder="1234567890"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Business Account ID</label>
              <input v-model="whatsappConfig.businessAccountId" type="text" placeholder="1234567890"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
            <input v-model="whatsappConfig.accessToken" type="password" placeholder="EAA..."
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <p class="text-xs text-gray-400 mt-1">Encrypted at rest with AES-256-GCM</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
              <input v-model="whatsappConfig.appSecret" type="password" placeholder="Optional"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Verify Token</label>
              <input v-model="whatsappConfig.verifyToken" type="text" placeholder="Auto-generated"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div class="flex justify-end">
            <button @click="saveWhatsAppConfig" :disabled="saving"
              class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Save Configuration' }}
            </button>
          </div>
        </div>
      </div>

      <!-- API Keys -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">API Keys</h2>
            <p class="text-sm text-gray-500 mt-1">Manage scoped REST API keys</p>
          </div>
          <button @click="showCreateKey = true" class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700">
            + Create Key
          </button>
        </div>
        <div class="p-6">
          <div v-if="apiKeys.length === 0" class="text-center py-8 text-gray-400">
            <p class="text-sm">No API keys yet</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="key in apiKeys" :key="key.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ key.name }}</p>
                <p class="text-xs text-gray-500">{{ key.keyPrefix }}... | {{ key.scopes?.join(', ') }}</p>
              </div>
              <button @click="revokeKey(key.id)" class="text-xs text-red-600 hover:text-red-700">Revoke</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Webhooks -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Outbound Webhooks</h2>
            <p class="text-sm text-gray-500 mt-1">Receive events via HTTPS (HMAC-signed)</p>
          </div>
          <button @click="showCreateWebhook = true" class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700">
            + Add Endpoint
          </button>
        </div>
        <div class="p-6">
          <div v-if="webhooks.length === 0" class="text-center py-8 text-gray-400">
            <p class="text-sm">No webhook endpoints configured</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="hook in webhooks" :key="hook.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-gray-900 truncate max-w-md">{{ hook.url }}</p>
                <p class="text-xs text-gray-500">Events: {{ (hook.events as string[])?.join(', ') || '*' }}</p>
              </div>
              <button @click="deleteWebhook(hook.id)" class="text-xs text-red-600 hover:text-red-700">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mock Mode -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900">Development Mode</h2>
          <p class="text-sm text-gray-500 mt-1">Test without real WhatsApp credentials</p>
        </div>
        <div class="p-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm font-medium text-gray-700 mb-2">Mock Mode</p>
            <p class="text-xs text-gray-500 mb-3">Send test messages via POST /api/v1/whatsapp/mock/inbound</p>
            <div class="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400">
              <p>curl -X POST /api/v1/whatsapp/mock/inbound \</p>
              <p class="ml-4">-H "Content-Type: application/json" \</p>
              <p class="ml-4">-d '{"from":"919876543210","message":"Hello!"}'</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api } from "../../api";

const whatsappConfig = ref({
  phoneNumberId: "",
  businessAccountId: "",
  accessToken: "",
  appSecret: "",
  verifyToken: "",
});

const saving = ref(false);
const apiKeys = ref<any[]>([]);
const webhooks = ref<any[]>([]);
const showCreateKey = ref(false);
const showCreateWebhook = ref(false);

async function saveWhatsAppConfig() {
  saving.value = true;
  try {
    await api.post("/v1/whatsapp/config", whatsappConfig.value);
    alert("Configuration saved successfully");
  } catch (e) {
    alert("Failed to save configuration");
  } finally {
    saving.value = false;
  }
}

async function revokeKey(id: number) {
  if (!confirm("Revoke this API key?")) return;
  await api.delete(`/v1/api-keys/${id}`);
  apiKeys.value = apiKeys.value.filter((k) => k.id !== id);
}

async function deleteWebhook(id: number) {
  if (!confirm("Delete this webhook endpoint?")) return;
  await api.delete(`/v1/webhooks/${id}`);
  webhooks.value = webhooks.value.filter((w) => w.id !== id);
}

onMounted(async () => {
  try {
    const [keysRes, hooksRes] = await Promise.all([
      api.get("/v1/api-keys"),
      api.get("/v1/webhooks"),
    ]);
    apiKeys.value = keysRes.data || [];
    webhooks.value = hooksRes.data || [];
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
});
</script>
