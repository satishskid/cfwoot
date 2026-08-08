<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-8">Teams & SLA</h1>

      <!-- Teams -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Teams</h2>
          <button
            @click="showCreateTeamModal = true"
            class="text-blue-600 hover:text-blue-800 text-sm"
          >
            + Add Team
          </button>
        </div>
        <div class="space-y-3">
          <div
            v-for="team in teams"
            :key="team.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center">
              <div
                class="w-4 h-4 rounded-full mr-3"
                :style="{ backgroundColor: team.color || '#6B7280' }"
              ></div>
              <div>
                <p class="font-medium">{{ team.name }}</p>
                <p class="text-sm text-gray-500">{{ team.description || 'No description' }}</p>
              </div>
            </div>
            <button
              @click="deleteTeam(team.id)"
              class="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          </div>
          <div v-if="teams.length === 0" class="text-gray-500 text-center py-4">
            No teams configured yet.
          </div>
        </div>
      </div>

      <!-- SLA Policies -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">SLA Policies</h2>
          <button
            @click="showCreateSLAModal = true"
            class="text-blue-600 hover:text-blue-800 text-sm"
          >
            + Add Policy
          </button>
        </div>
        <div class="space-y-3">
          <div
            v-for="policy in slaPolicies"
            :key="policy.id"
            class="p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-medium">{{ policy.name }}</p>
                <p class="text-sm text-gray-500">
                  First response: {{ policy.firstResponseMinutes }}min | Resolution: {{ policy.resolutionMinutes }}min
                </p>
              </div>
              <span
                :class="priorityClass(policy.priority)"
                class="px-2 py-1 text-xs rounded"
              >
                {{ policy.priority }}
              </span>
            </div>
          </div>
          <div v-if="slaPolicies.length === 0" class="text-gray-500 text-center py-4">
            No SLA policies configured yet.
          </div>
        </div>
      </div>

      <!-- Create Team Modal -->
      <div
        v-if="showCreateTeamModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">Create Team</h2>
          <form @submit.prevent="saveTeam">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                v-model="teamForm.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                v-model="teamForm.description"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                v-model="teamForm.color"
                type="color"
                class="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showCreateTeamModal = false"
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

      <!-- Create SLA Modal -->
      <div
        v-if="showCreateSLAModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">Create SLA Policy</h2>
          <form @submit.prevent="saveSLA">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Policy Name</label>
              <input
                v-model="slaForm.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                v-model="slaForm.priority"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">First Response (min)</label>
                <input
                  v-model.number="slaForm.firstResponseMinutes"
                  type="number"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Resolution (min)</label>
                <input
                  v-model.number="slaForm.resolutionMinutes"
                  type="number"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showCreateSLAModal = false"
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

const teams = ref<any[]>([])
const slaPolicies = ref<any[]>([])
const showCreateTeamModal = ref(false)
const showCreateSLAModal = ref(false)

const teamForm = ref({ name: '', description: '', color: '#3B82F6' })
const slaForm = ref({ name: '', priority: 'medium', firstResponseMinutes: 60, resolutionMinutes: 240 })

const priorityClass = (priority: string) => {
  const classes: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }
  return classes[priority] || 'bg-gray-100 text-gray-800'
}

const loadData = async () => {
  const [teamsRes, slaRes] = await Promise.all([
    api.teams.list(),
    api.sla.list(),
  ])
  teams.value = teamsRes.data
  slaPolicies.value = slaRes.data
}

const saveTeam = async () => {
  await api.teams.create(teamForm.value)
  showCreateTeamModal.value = false
  teamForm.value = { name: '', description: '', color: '#3B82F6' }
  await loadData()
}

const deleteTeam = async (id: number) => {
  if (confirm('Delete this team?')) {
    await api.teams.delete(id)
    await loadData()
  }
}

const saveSLA = async () => {
  await api.sla.create(slaForm.value)
  showCreateSLAModal.value = false
  slaForm.value = { name: '', priority: 'medium', firstResponseMinutes: 60, resolutionMinutes: 240 }
  await loadData()
}

onMounted(() => loadData())
</script>
