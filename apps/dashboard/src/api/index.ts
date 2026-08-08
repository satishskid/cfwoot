const API_BASE = "/api";

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, data?: any) =>
    request(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: (path: string, data?: any) =>
    request(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  delete: (path: string) => request(path, { method: "DELETE" }),

  // Auth
  auth: {
    signup: (data: { name: string; email: string; password: string }) =>
      request("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
    signin: (data: { email: string; password: string }) =>
      request("/auth/signin", { method: "POST", body: JSON.stringify(data) }),
    session: () => request("/auth/session"),
    signout: () => request("/auth/signout", { method: "POST" }),
  },

  // Conversations
  conversations: {
    list: (params?: { accountId?: string; status?: string }) => {
      const query = new URLSearchParams(params).toString();
      return request(`/v1/conversations${query ? `?${query}` : ""}`);
    },
    get: (id: number) => request(`/v1/conversations/${id}`),
    create: (data: any) =>
      request("/v1/conversations", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request(`/v1/conversations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    messages: (id: number, params?: { limit?: string; before?: string }) => {
      const query = new URLSearchParams(params).toString();
      return request(`/v1/conversations/${id}/messages${query ? `?${query}` : ""}`);
    },
  },

  // Contacts
  contacts: {
    list: (params?: { accountId?: string }) => {
      const query = new URLSearchParams(params).toString();
      return request(`/v1/contacts${query ? `?${query}` : ""}`);
    },
    get: (id: number) => request(`/v1/contacts/${id}`),
    findOrCreate: (data: { phone: string; name?: string; email?: string; accountId?: number }) =>
      request("/v1/contacts/find-or-create", { method: "POST", body: JSON.stringify(data) }),
    create: (data: any) =>
      request("/v1/contacts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request(`/v1/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  // Messages
  messages: {
    list: (params: { conversationId: number }) =>
      request(`/v1/messages?conversationId=${params.conversationId}`),
    send: (data: {
      conversationId: number;
      content: string;
      messageType?: string;
      accountId?: number;
    }) => request("/v1/messages", { method: "POST", body: JSON.stringify(data) }),
    get: (id: number) => request(`/v1/messages/${id}`),
  },

  // WhatsApp
  whatsapp: {
    send: (data: { to: string; message: string; conversationId?: number }) =>
      request("/v1/whatsapp/send", { method: "POST", body: JSON.stringify(data) }),
    sendTemplate: (data: {
      to: string;
      templateName: string;
      language?: string;
      components?: any[];
      conversationId?: number;
    }) => request("/v1/whatsapp/send-template", { method: "POST", body: JSON.stringify(data) }),
    sendMedia: (data: {
      to: string;
      mediaType: string;
      mediaUrl: string;
      caption?: string;
      conversationId?: number;
    }) => request("/v1/whatsapp/send-media", { method: "POST", body: JSON.stringify(data) }),
  },

  // AI
  ai: {
    listKnowledge: (params?: { accountId?: string; category?: string; search?: string }) => {
      const query = new URLSearchParams(params).toString();
      return request(`/v1/ai/knowledge${query ? `?${query}` : ""}`);
    },
    createKnowledge: (data: any) =>
      request("/v1/ai/knowledge", { method: "POST", body: JSON.stringify(data) }),
    updateKnowledge: (id: number, data: any) =>
      request(`/v1/ai/knowledge/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteKnowledge: (id: number) =>
      request(`/v1/ai/knowledge/${id}`, { method: "DELETE" }),
    searchKnowledge: (data: { query: string; accountId?: number }) =>
      request("/v1/ai/knowledge/search", { method: "POST", body: JSON.stringify(data) }),
    suggest: (data: { conversationId: number; messageId?: number }) =>
      request("/v1/ai/suggest", { method: "POST", body: JSON.stringify(data) }),
    summarize: (data: { conversationId: number }) =>
      request("/v1/ai/summarize", { method: "POST", body: JSON.stringify(data) }),
    analyze: (data: { message: string }) =>
      request("/v1/ai/analyze", { method: "POST", body: JSON.stringify(data) }),
  },

  // Flows
  flows: {
    list: (params?: { accountId?: string; status?: string }) => {
      const query = new URLSearchParams(params).toString();
      return request(`/v1/flows${query ? `?${query}` : ""}`);
    },
    get: (id: number) => request(`/v1/flows/${id}`),
    create: (data: any) =>
      request("/v1/flows", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request(`/v1/flows/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request(`/v1/flows/${id}`, { method: "DELETE" }),
    publish: (id: number) =>
      request(`/v1/flows/${id}/publish`, { method: "POST" }),
    send: (id: number, data: { contactId: number }) =>
      request(`/v1/flows/${id}/send`, { method: "POST", body: JSON.stringify(data) }),
    responses: (id: number) => request(`/v1/flows/${id}/responses`),
  },

  // Bots
  bots: {
    list: (params?: { accountId?: string }) => {
      const query = new URLSearchParams(params).toString();
      return request(`/v1/bots${query ? `?${query}` : ""}`);
    },
    get: (id: number) => request(`/v1/bots/${id}`),
    create: (data: any) =>
      request("/v1/bots", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request(`/v1/bots/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request(`/v1/bots/${id}`, { method: "DELETE" }),
    activate: (id: number) =>
      request(`/v1/bots/${id}/activate`, { method: "POST" }),
    deactivate: (id: number) =>
      request(`/v1/bots/${id}/deactivate`, { method: "POST" }),
    test: (id: number, data?: { conversationId?: number }) =>
      request(`/v1/bots/${id}/test`, { method: "POST", body: JSON.stringify(data || {}) }),
    executions: (id: number) => request(`/v1/bots/${id}/executions`),
  },

  // Broadcasts
  broadcasts: {
    list: (params?: { accountId?: string; status?: string }) => {
      const query = new URLSearchParams(params).toString();
      return request(`/v1/broadcasts${query ? `?${query}` : ""}`);
    },
    get: (id: number) => request(`/v1/broadcasts/${id}`),
    create: (data: any) =>
      request("/v1/broadcasts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request(`/v1/broadcasts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request(`/v1/broadcasts/${id}`, { method: "DELETE" }),
    send: (id: number) =>
      request(`/v1/broadcasts/${id}/send`, { method: "POST" }),
    schedule: (id: number, data: { scheduledAt: string }) =>
      request(`/v1/broadcasts/${id}/schedule`, { method: "POST", body: JSON.stringify(data) }),
    stats: (id: number) => request(`/v1/broadcasts/${id}/stats`),
    recipients: (id: number) => request(`/v1/broadcasts/${id}/recipients`),
  },

  // E-commerce
  ecommerce: {
    stores: {
      list: (params?: { accountId?: string }) => {
        const query = new URLSearchParams(params).toString();
        return request(`/v1/ecommerce/stores${query ? `?${query}` : ""}`);
      },
      connectShopify: (data: any) =>
        request("/v1/ecommerce/stores/shopify", { method: "POST", body: JSON.stringify(data) }),
      connectWooCommerce: (data: any) =>
        request("/v1/ecommerce/stores/woocommerce", { method: "POST", body: JSON.stringify(data) }),
    },
    products: {
      list: (params?: { storeId?: string }) => {
        const query = new URLSearchParams(params).toString();
        return request(`/v1/ecommerce/products${query ? `?${query}` : ""}`);
      },
      sync: (data: { storeId: number }) =>
        request("/v1/ecommerce/products/sync", { method: "POST", body: JSON.stringify(data) }),
    },
    orders: {
      list: (params?: { storeId?: string; contactId?: string }) => {
        const query = new URLSearchParams(params).toString();
        return request(`/v1/ecommerce/orders${query ? `?${query}` : ""}`);
      },
      get: (id: number) => request(`/v1/ecommerce/orders/${id}`),
      sendDetails: (id: number) =>
        request(`/v1/ecommerce/orders/${id}/send-details`, { method: "POST" }),
    },
  },

  // Teams
  teams: {
    list: (params?: { accountId?: string }) => {
      const query = new URLSearchParams(params).toString();
      return request(`/v1/teams${query ? `?${query}` : ""}`);
    },
    create: (data: any) =>
      request("/v1/teams", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request(`/v1/teams/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request(`/v1/teams/${id}`, { method: "DELETE" }),
    addMember: (teamId: number, data: { userId: number; role?: string }) =>
      request(`/v1/teams/${teamId}/members`, { method: "POST", body: JSON.stringify(data) }),
    removeMember: (teamId: number, userId: number) =>
      request(`/v1/teams/${teamId}/members/${userId}`, { method: "DELETE" }),
    members: (teamId: number) => request(`/v1/teams/${teamId}/members`),
  },

  // SLA
  sla: {
    list: (params?: { accountId?: string }) => {
      const query = new URLSearchParams(params).toString();
      return request(`/v1/sla${query ? `?${query}` : ""}`);
    },
    create: (data: any) =>
      request("/v1/sla", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request(`/v1/sla/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request(`/v1/sla/${id}`, { method: "DELETE" }),
    breaches: (params?: { conversationId?: string }) => {
      const query = new URLSearchParams(params).toString();
      return request(`/v1/sla/breaches${query ? `?${query}` : ""}`);
    },
  },
};
