<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">WhatsApp Flows</h1>
          <p class="mt-1 text-sm text-gray-500">Create interactive in-chat experiences</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create Flow
        </button>
      </div>

      <!-- Flows Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="flow in flows"
          :key="flow.id"
          class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div class="flex justify-between items-start mb-2">
            <span
              :class="flow.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
              class="px-2 py-1 text-xs rounded"
            >
              {{ flow.status }}
            </span>
            <span class="text-sm text-gray-500">v{{ flow.version }}</span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">{{ flow.name }}</h3>
          <p class="text-gray-600 text-sm mb-4">{{ flow.description || 'No description' }}</p>
          <p class="text-sm text-gray-500 mb-4">
            {{ (flow.screens as any[])?.length || 0 }} screens
          </p>
          <div class="flex justify-end space-x-2">
            <button
              @click="editFlow(flow)"
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </button>
            <button
              v-if="flow.status === 'draft'"
              @click="publishFlow(flow.id)"
              class="text-green-600 hover:text-green-800 text-sm"
            >
              Publish
            </button>
            <button
              @click="deleteFlow(flow.id)"
              class="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div v-if="flows.length === 0" class="text-center py-12">
        <p class="text-gray-500">No flows yet. Create your first WhatsApp Flow!</p>
      </div>

      <!-- Create/Edit Modal -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
          <h2 class="text-xl font-bold mb-4">
            {{ editingFlow ? 'Edit Flow' : 'Create Flow' }}
          </h2>
          <form @submit.prevent="saveFlow">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Contact Form"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                v-model="form.description"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="What this flow does..."
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Screens (JSON)</label>
              <textarea
                v-model="form.screensJson"
                rows="6"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder='[{"id":"screen1","title":"Welcome","components":[]}]'
              ></textarea>
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
                {{ editingFlow ? 'Update' : 'Create' }}
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

const flows = ref<any[]>([])
const showCreateModal = ref(false)
const editingFlow = ref<any>(null)
const form = ref({
  name: '',
  description: '',
  screensJson: '[]',
})

const loadFlows = async () => {
  const res = await api.flows.list()
  flows.value = res.data
}

const editFlow = (flow: any) => {
  editingFlow.value = flow
  form.value = {
    name: flow.name,
    description: flow.description || '',
    screensJson: JSON.stringify(flow.screens, null, 2),
  }
  showCreateModal.value = true
}

const saveFlow = async () => {
  const screens = JSON.parse(form.value.screensJson)
  const data = { ...form.value, screens }

  if (editingFlow.value) {
    await api.flows.update(editingFlow.value.id, data)
  } else {
    await api.flows.create(data)
  }
  showCreateModal.value = false
  editingFlow.value = null
  form.value = { name: '', description: '', screensJson: '[]' }
  await loadFlows()
}

const publishFlow = async (id: number) => {
  await api.flows.publish(id)
  await loadFlows()
}

const deleteFlow = async (id: number) => {
  if (confirm('Delete this flow?')) {
    await api.flows.delete(id)
    await loadFlows()
  }
}

onMounted(() => loadFlows())
</script>
