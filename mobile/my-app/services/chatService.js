const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const parseResponse = async (res) => {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
    throw err;
  }
};

export const chatService = {
  startConversation: (token) =>
    fetch(`${API_BASE}/ai/conversations`, {
      method: "POST",
      headers: authHeaders(token),
    }).then(parseResponse),

  getConversations: (token) =>
    fetch(`${API_BASE}/ai/conversations`, {
      headers: authHeaders(token),
    }).then(parseResponse),

  getMessagesWithMeta: async (token, conversationId) => {
    const data = await fetch(
      `${API_BASE}/ai/conversations/${conversationId}/messages`,
      { headers: authHeaders(token) }
    ).then(parseResponse);
    return {
      messages: Array.isArray(data.messages) ? data.messages : [],
      linked_plan_id: data.linked_plan_id ?? null,
    };
  },

  getMessages: async (token, conversationId) => {
    const data = await fetch(
      `${API_BASE}/ai/conversations/${conversationId}/messages`,
      { headers: authHeaders(token) }
    ).then(parseResponse);
    return Array.isArray(data.messages) ? data.messages : [];
  },

  sendMessage: (token, conversationId, content) =>
    fetch(`${API_BASE}/ai/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ content }),
    }).then(parseResponse),

  deleteConversation: (token, conversationId) =>
    fetch(`${API_BASE}/ai/conversations/${conversationId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    }).then(parseResponse),

  generatePlan: (token, conversationId, preferences = "") =>
    fetch(`${API_BASE}/ai/conversations/${conversationId}/generate-plan`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ preferences }),
    }).then(parseResponse),
};
