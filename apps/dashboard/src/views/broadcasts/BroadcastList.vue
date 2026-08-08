<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Broadcast Campaigns</h1>
          <p class="mt-1 text-sm text-gray-500">Send bulk WhatsApp messages</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create Campaign
        </button>
      </div>

      <!-- Campaigns Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Read</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="campaign in campaigns" :key="campaign.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-medium text-gray-900">{{ campaign.name }}</div>
                <div class="text-sm text-gray-500">{{ campaign.description }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="statusClass(campaign.status)"
                  class="px-2 py-1 text-xs rounded-full"
                >
                  {{ campaign.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ campaign.stats?.sent || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ campaign.stats?.delivered || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ campaign.stats?.read || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <button
                  v-if="campaign.status === 'draft'"
                  @click="sendCampaign(campaign.id)"
                  class="text-green-600 hover:text-green-800"
                >
                  Send
                </button>
                <button
                  v-if="campaign.status === 'draft'"
                  @click="deleteCampaign(campaign.id)"
                  class="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="campaigns.length === 0" class="text-center py-12">
          <p class="text-gray-500">No campaigns yet. Create your first broadcast!</p>
        </div>
      </div>

      <!-- Create Modal -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-lg">
          <h2 class="text-xl font-bold mb-4">Create Campaign</h2>
          <form @submit.prevent="saveCampaign">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                v-model="form.description"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Template ID</label>
              <input
                v-model.number="form.templateId"
                type="number"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Audience Tags (comma-separated)
              </label>
              <input
                v-model="form.tagsInput"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="vip, new-customer, sale"
              />
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showCreateModal = false"
                class="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api'

const campaigns = ref<any[]>([])
const showCreateModal = ref(false)
const form = ref({
  name: '',
  description: '',
  templateId: null as number | null,
  tagsInput: '',
})

const statusClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-yellow-100 text-yellow-800',
    sending: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const loadCampaigns = async () => {
  const res = await api.broadcasts.list()
  campaigns.value = res.data
}

const saveCampaign = async () => {
  const tags = form.value.tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  await api.broadcasts.create({
    name: form.value.name,
    description: form.value.description,
    templateId: form.value.templateId,
    audienceFilter: { tags },
  })
  showCreateModal.value = false
  form.value = { name: '', description: '', templateId: null, tagsInput: '' }
  await loadCampaigns()
}

const sendCampaign = async (id: number) => {
  if (confirm('Send this campaign now?')) {
    await api.broadcasts.send(id)
    await loadCampaigns()
  }
}

const deleteCampaign = async (id: number) => {
  if (confirm('Delete this campaign?')) {
    await api.broadcasts.delete(id)
    await loadCampaigns()
  }
}

onMounted(() => loadCampaigns())
</script>
