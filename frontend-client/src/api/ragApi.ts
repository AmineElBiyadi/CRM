import axios from 'axios';

const api = axios.create({
  baseURL: '', // Utilise le proxy Vite
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const clientId = localStorage.getItem('client_id') || 'd755eba6-106f-4f81-af56-4e4d60f16840';
  config.headers['X-Client-Id'] = clientId;
  return config;
});

export interface DocumentQueryRequest {
  dealId: string;
  query: string;
}

export interface ChatResponse {
  answer: string;
  sources?: string[];
}

/**
 * Pose une question au RAG sur les documents du client.
 */
export const ragApi = {
  askQuestion: async (dealId: string, query: string): Promise<ChatResponse> => {
    const { data } = await api.post<ChatResponse>('/api/rag/chat', { dealId, query });
    return data;
  }
};

export default api;
