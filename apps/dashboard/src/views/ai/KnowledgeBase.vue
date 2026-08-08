<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p class="mt-1 text-sm text-gray-500">Manage AI knowledge articles for smart replies</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Article
        </button>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search articles..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Articles Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="article in filteredArticles"
          :key="article.id"
          class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div class="flex justify-between items-start mb-2">
            <span
              v-if="article.category"
              class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
            >
              {{ article.category }}
            </span>
            <span
              :class="article.isActive ? 'text-green-600' : 'text-gray-400'"
              class="text-sm"
            >
              {{ article.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">{{ article.title }}</h3>
          <p class="text-gray-600 text-sm mb-4 line-clamp-3">{{ article.content }}</p>
          <div class="flex justify-end space-x-2">
            <button
              @click="editArticle(article)"
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </button>
            <button
              @click="deleteArticle(article.id)"
              class="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredArticles.length === 0" class="text-center py-12">
        <p class="text-gray-500">No articles found. Create your first knowledge article!</p>
      </div>

      <!-- Create/Edit Modal -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
          <h2 class="text-xl font-bold mb-4">
            {{ editingArticle ? 'Edit Article' : 'Create Article' }}
          </h2>
          <form @submit.prevent="saveArticle">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                v-model="form.title"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                v-model="form.category"
                type="text"
                placeholder="e.g., returns, shipping, FAQ"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                v-model="form.content"
                rows="6"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Write the knowledge article content..."
              ></textarea>
            </div>
            <div class="mb-4">
              <label class="flex items-center">
                <input
                  v-model="form.isActive"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-sm text-gray-700">Active</span>
              </label>
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
                {{ editingArticle ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../../api'

const articles = ref<any[]>([])
const searchQuery = ref('')
const showCreateModal = ref(false)
const editingArticle = ref<any>(null)
const form = ref({
  title: '',
  content: '',
  category: '',
  isActive: true,
})

const filteredArticles = computed(() => {
  if (!searchQuery.value) return articles.value
  const q = searchQuery.value.toLowerCase()
  return articles.value.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q)
  )
})

const loadArticles = async () => {
  const res = await api.ai.listKnowledge()
  articles.value = res.data
}

const editArticle = (article: any) => {
  editingArticle.value = article
  form.value = {
    title: article.title,
    content: article.content,
    category: article.category || '',
    isActive: article.isActive,
  }
  showCreateModal.value = true
}

const saveArticle = async () => {
  if (editingArticle.value) {
    await api.ai.updateKnowledge(editingArticle.value.id, form.value)
  } else {
    await api.ai.createKnowledge(form.value)
  }
  showCreateModal.value = false
  editingArticle.value = null
  form.value = { title: '', content: '', category: '', isActive: true }
  await loadArticles()
}

const deleteArticle = async (id: number) => {
  if (confirm('Delete this article?')) {
    await api.ai.deleteKnowledge(id)
    await loadArticles()
  }
}

onMounted(() => loadArticles())
</script>
