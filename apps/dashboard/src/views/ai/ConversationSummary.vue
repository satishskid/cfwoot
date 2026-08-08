<template>
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <h3 class="font-semibold text-blue-900 mb-2">AI Summary</h3>
    <p class="text-blue-800 text-sm mb-2">{{ summary?.summary || 'No summary available' }}</p>
    <div v-if="summary?.keyPoints?.length" class="mb-2">
      <p class="text-xs font-medium text-blue-700 mb-1">Key Points:</p>
      <ul class="list-disc list-inside text-sm text-blue-700">
        <li v-for="(point, i) in summary.keyPoints" :key="i">{{ point }}</li>
      </ul>
    </div>
    <div class="flex items-center text-xs text-blue-600">
      <span
        :class="sentimentClass"
        class="px-2 py-0.5 rounded mr-2"
      >
        {{ summary?.sentiment || 'unknown' }}
      </span>
      <span>{{ new Date(summary?.createdAt).toLocaleString() }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  summary: any
}>()

const sentimentClass = computed(() => {
  const s = props.summary?.sentiment
  if (s === 'positive') return 'bg-green-100 text-green-800'
  if (s === 'negative') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
})
</script>
