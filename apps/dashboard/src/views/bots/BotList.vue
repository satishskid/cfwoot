<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Chatbot Builder</h1>
          <p class="mt-1 text-sm text-gray-500">Create automated conversation flows</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create Bot
        </button>
      </div>

      <!-- Bots Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="bot in bots"
          :key="bot.id"
          class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div class="flex justify-between items-start mb-2">
            <span
              :class="bot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              class="px-2 py-1 text-xs rounded"
            >
              {{ bot.isActive ? 'Active' : 'Inactive' }}
            </span>
            <span class="text-xs text-gray-500 uppercase">{{ bot.trigger }}</span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">{{ bot.name }}</h3>
          <p class="text-gray-600 text-sm mb-4">{{ bot.description || 'No description' }}</p>
          <p class="text-sm text-gray-500 mb-4">
            {{ (bot.nodes as any[])?.length || 0 }} nodes
          </p>
          <div class="flex justify-end space-x-2">
            <button
              @click="editBot(bot)"
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </button>
            <button
              @click="toggleBot(bot)"
              :class="bot.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'"
              class="text-sm"
            >
              {{ bot.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button
              @click="testBot(bot.id)"
              class="text-purple-600 hover:text-purple-800 text-sm"
            >
              Test
            </button>
            <button
              @click="deleteBot(bot.id)"
              class="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div v-if="bots.length === 0" class="text-center py-12">
        <p class="text-gray-500">No bots yet. Create your first chatbot!</p>
      </div>

      <!-- Create/Edit Modal -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-3xl">
          <h2 class="text-xl font-bold mb-4">
            {{ editingBot ? 'Edit Bot' : 'Create Bot' }}
          </h2>
          <form @submit.prevent="saveBot">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Trigger</label>
                <select
                  v-model="form.trigger"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="keyword">Keyword</option>
                  <option value="event">Event</option>
                  <option value="time">Time-based</option>
                  <option value="condition">Condition</option>
                </select>
              </div>
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
              <label class="block text-sm font-medium text-gray-700 mb-1">Trigger Value</label>
              <input
                v-model="form.triggerValue"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., help, start, menu"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Nodes (JSON)</label>
              <textarea
                v-model="form.nodesJson"
                rows="6"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder='[{"id":"start","type":"start"},{"id":"msg1","type":"message","text":"Hello!"}]'
              ></textarea>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Edges (JSON)</label>
              <textarea
                v-model="form.edgesJson"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder='[{"id":"e1","source":"start","target":"msg1"}]'
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
                {{ editingBot ? 'Update' : 'Create' }}
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

const bots = ref<any[]>([])
const showCreateModal = ref(false)
const editingBot = ref<any>(null)
const form = ref({
  name: '',
  description: '',
  trigger: 'keyword',
  triggerValue: '',
  nodesJson: '[]',
  edgesJson: '[]',
})

const loadBots = async () => {
  const res = await api.bots.list()
  bots.value = res.data
}

const editBot = (bot: any) => {
  editingBot.value = bot
  form.value = {
    name: bot.name,
    description: bot.description || '',
    trigger: bot.trigger,
    triggerValue: bot.triggerValue || '',
    nodesJson: JSON.stringify(bot.nodes, null, 2),
    edgesJson: JSON.stringify(bot.edges, null, 2),
  }
  showCreateModal.value = true
}

const saveBot = async () => {
  const data = {
    ...form.value,
    nodes: JSON.parse(form.value.nodesJson),
    edges: JSON.parse(form.value.edgesJson),
  }

  if (editingBot.value) {
    await api.bots.update(editingBot.value.id, data)
  } else {
    await api.bots.create(data)
  }
  showCreateModal.value = false
  editingBot.value = null
  form.value = { name: '', description: '', trigger: 'keyword', triggerValue: '', nodesJson: '[]', edgesJson: '[]' }
  await loadBots()
}

const toggleBot = async (bot: any) => {
  if (bot.isActive) {
    await api.bots.deactivate(bot.id)
  } else {
    await api.bots.activate(bot.id)
  }
  await loadBots()
}

const testBot = async (id: number) => {
  await api.bots.test(id, { conversationId: 0 })
  alert('Test execution started!')
}

const deleteBot = async (id: number) => {
  if (confirm('Delete this bot?')) {
    await api.bots.delete(id)
    await loadBots()
  }
}

onMounted(() => loadBots())
</script>
