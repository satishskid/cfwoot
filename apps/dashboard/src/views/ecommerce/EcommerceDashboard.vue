<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">E-commerce Integration</h1>
          <p class="mt-1 text-sm text-gray-500">Connect your store and manage orders</p>
        </div>
        <button
          @click="showConnectModal = true"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Connect Store
        </button>
      </div>

      <!-- Stores -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-4">Connected Stores</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="store in stores"
            :key="store.id"
            class="bg-white rounded-lg shadow p-4 flex items-center justify-between"
          >
            <div class="flex items-center">
              <span
                :class="store.platform === 'shopify' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'"
                class="px-3 py-1 text-sm rounded mr-4"
              >
                {{ store.platform }}
              </span>
              <div>
                <p class="font-medium">{{ store.shopDomain }}</p>
                <p class="text-sm text-gray-500">
                  Last sync: {{ store.lastSyncAt ? new Date(store.lastSyncAt).toLocaleDateString() : 'Never' }}
                </p>
              </div>
            </div>
            <button
              @click="syncStore(store.id)"
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              Sync
            </button>
          </div>
          <div v-if="stores.length === 0" class="text-gray-500 col-span-2">
            No stores connected. Connect your first store!
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div>
        <h2 class="text-lg font-semibold mb-4">Recent Orders</h2>
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="order in orders" :key="order.id">
                <td class="px-6 py-4 whitespace-nowrap font-mono text-sm">
                  {{ order.externalOrderId }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="orderStatusClass(order.status)"
                    class="px-2 py-1 text-xs rounded-full"
                  >
                    {{ order.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ order.currency }} {{ (order.total / 100).toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  {{ (order.items as any[])?.length || 0 }} items
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ new Date(order.createdAt).toLocaleDateString() }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    @click="sendOrderDetails(order.id)"
                    class="text-blue-600 hover:text-blue-800"
                  >
                    Send via WhatsApp
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="orders.length === 0" class="text-center py-12">
            <p class="text-gray-500">No orders yet.</p>
          </div>
        </div>
      </div>

      <!-- Connect Store Modal -->
      <div
        v-if="showConnectModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-lg">
          <h2 class="text-xl font-bold mb-4">Connect Store</h2>
          <form @submit.prevent="connectStore">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select
                v-model="form.platform"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="shopify">Shopify</option>
                <option value="woocommerce">WooCommerce</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Shop Domain</label>
              <input
                v-model="form.shopDomain"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                :placeholder="form.platform === 'shopify' ? 'your-store.myshopify.com' : 'your-store.com'"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
              <input
                v-model="form.accessToken"
                type="password"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showConnectModal = false"
                class="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Connect
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

const stores = ref<any[]>([])
const orders = ref<any[]>([])
const showConnectModal = ref(false)
const form = ref({
  platform: 'shopify',
  shopDomain: '',
  accessToken: '',
})

const orderStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    fulfilled: 'bg-blue-100 text-blue-800',
    refunded: 'bg-red-100 text-red-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const loadData = async () => {
  const [storesRes, ordersRes] = await Promise.all([
    api.ecommerce.stores.list(),
    api.ecommerce.orders.list(),
  ])
  stores.value = storesRes.data
  orders.value = ordersRes.data
}

const connectStore = async () => {
  if (form.value.platform === 'shopify') {
    await api.ecommerce.stores.connectShopify(form.value)
  } else {
    await api.ecommerce.stores.connectWooCommerce(form.value)
  }
  showConnectModal.value = false
  form.value = { platform: 'shopify', shopDomain: '', accessToken: '' }
  await loadData()
}

const syncStore = async (storeId: number) => {
  await api.ecommerce.products.sync({ storeId })
  await loadData()
}

const sendOrderDetails = async (orderId: number) => {
  await api.ecommerce.orders.sendDetails(orderId)
  alert('Order details sent via WhatsApp!')
}

onMounted(() => loadData())
</script>
