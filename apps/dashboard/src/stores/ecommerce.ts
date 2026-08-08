import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "../api";

export const useEcommerceStore = defineStore("ecommerce", () => {
  const stores = ref<any[]>([]);
  const products = ref<any[]>([]);
  const orders = ref<any[]>([]);
  const loading = ref(false);

  const fetchStores = async (accountId = 1) => {
    loading.value = true;
    try {
      const res = await api.get(`/api/v1/ecommerce/stores?accountId=${accountId}`);
      stores.value = res.data;
    } finally {
      loading.value = false;
    }
  };

  const connectStore = async (platform: string, data: any) => {
    const res = await api.post(`/api/v1/ecommerce/stores/${platform}`, data);
    await fetchStores(data.accountId);
    return res;
  };

  const fetchProducts = async (storeId?: number) => {
    const url = storeId
      ? `/api/v1/ecommerce/products?storeId=${storeId}`
      : "/api/v1/ecommerce/products";
    const res = await api.get(url);
    products.value = res.data;
  };

  const syncProducts = async (storeId: number) => {
    await api.post("/api/v1/ecommerce/products/sync", { storeId });
    await fetchProducts(storeId);
  };

  const fetchOrders = async (storeId?: number, contactId?: number) => {
    const params = new URLSearchParams();
    if (storeId) params.set("storeId", storeId.toString());
    if (contactId) params.set("contactId", contactId.toString());
    const res = await api.get(`/api/v1/ecommerce/orders?${params}`);
    orders.value = res.data;
  };

  const sendOrderDetails = async (orderId: number) => {
    return await api.post(`/api/v1/ecommerce/orders/${orderId}/send-details`);
  };

  return {
    stores,
    products,
    orders,
    loading,
    fetchStores,
    connectStore,
    fetchProducts,
    syncProducts,
    fetchOrders,
    sendOrderDetails,
  };
});
