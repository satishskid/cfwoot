<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-8">AI Settings</h1>

      <!-- AI Reply Suggestions -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Reply Suggestions</h2>
        <p class="text-gray-600 mb-4">Configure how AI suggests replies to customer messages.</p>
        <div class="space-y-4">
          <label class="flex items-center">
            <input v-model="settings.autoSuggestions" type="checkbox" class="mr-3" />
            <span>Enable automatic reply suggestions</span>
          </label>
          <label class="flex items-center">
            <input v-model="settings.knowledgeBaseSearch" type="checkbox" class="mr-3" />
            <span>Search knowledge base for suggestions</span>
          </label>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Maximum suggestions per message
            </label>
            <input
              v-model.number="settings.maxSuggestions"
              type="number"
              min="1"
              max="5"
              class="w-32 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <!-- Auto-Summary -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Conversation Summaries</h2>
        <p class="text-gray-600 mb-4">Automatically generate summaries when conversations are resolved.</p>
        <div class="space-y-4">
          <label class="flex items-center">
            <input v-model="settings.autoSummary" type="checkbox" class="mr-3" />
            <span>Enable automatic conversation summaries</span>
          </label>
          <label class="flex items-center">
            <input v-model="settings.sentimentAnalysis" type="checkbox" class="mr-3" />
            <span>Include sentiment analysis in summaries</span>
          </label>
        </div>
      </div>

      <!-- Intent Detection -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Intent Detection</h2>
        <p class="text-gray-600 mb-4">Automatically detect customer intent from messages.</p>
        <div class="space-y-4">
          <label class="flex items-center">
            <input v-model="settings.intentDetection" type="checkbox" class="mr-3" />
            <span>Enable message intent detection</span>
          </label>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Auto-assign based on intent
            </label>
            <select
              v-model="settings.autoAssignIntent"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="disabled">Disabled</option>
              <option value="sales">Sales team for pricing inquiries</option>
              <option value="support">Support team for issues</option>
              <option value="shipping">Shipping team for delivery questions</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          @click="saveSettings"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const settings = ref({
  autoSuggestions: true,
  knowledgeBaseSearch: true,
  maxSuggestions: 3,
  autoSummary: true,
  sentimentAnalysis: true,
  intentDetection: true,
  autoAssignIntent: 'disabled',
})

const saveSettings = async () => {
  // Save to localStorage or API
  localStorage.setItem('aiSettings', JSON.stringify(settings.value))
  alert('Settings saved!')
}

onMounted(() => {
  const saved = localStorage.getItem('aiSettings')
  if (saved) {
    settings.value = { ...settings.value, ...JSON.parse(saved) }
  }
})
</script>
