import axios from 'axios';

const api = axios.create({
  baseURL: '', // Utilise le proxy Vite
  withCredentials: true, // Crucial for sending auth cookies
});

api.interceptors.request.use((config) => {
  // Support for CSRF token from cookies
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];
    
  if (csrfToken && config.method !== 'get') {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Note: On ne force plus le X-Client-Id car on utilise le JWT pour identifier le client
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
  },
  askGlobalQuestion: async (query: string): Promise<ChatResponse> => {
    const { data } = await api.post<ChatResponse>('/api/rag/chat-global', { query });
    return data;
  }
};

export default api;
