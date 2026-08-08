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
};
