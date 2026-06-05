import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true, // Crucial for sending auth cookies
});

api.interceptors.request.use((config) => {
  // If your app uses CSRF protection, we should include the token here
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
  const devAgentId = localStorage.getItem('dev_agent_id') || '3c865aae-edcf-4d93-b434-92e69b2230aa';
  config.headers['X-Agent-Id'] = devAgentId;
  return config;
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DocumentQueryRequest {
  dealId: string;
  query: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  sources?: string[];
}

/**
 * Pose une question au RAG sur les documents d'un dossier.
 */
export const askRagQuestion = async (request: DocumentQueryRequest): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/api/rag/chat', request);
  return response.data;
};

/**
 * Lance manuellement l'indexation d'un document.
 */
export const indexDocumentManually = async (documentId: string): Promise<string> => {
  const response = await api.post<string>(`/api/rag/index/${documentId}`);
  return response.data;
};

export default api;
