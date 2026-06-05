import apiClient from "../lib/api-client";

export const ragApi = {
  chat: async (query: string, dealId?: string) => {
    const { data } = await apiClient.post("/api/rag/chat", { query, dealId });
    return data;
  },
  getHistory: async (dealId?: string) => {
    const { data } = await apiClient.get(`/api/rag/history${dealId ? `?dealId=${dealId}` : ""}`);
    return data;
  },
  clearHistory: async (dealId?: string) => {
    await apiClient.delete(`/api/rag/history${dealId ? `?dealId=${dealId}` : ""}`);
  },
};
