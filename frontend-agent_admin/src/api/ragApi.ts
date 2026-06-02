import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const devAgentId = localStorage.getItem('dev_agent_id') || '3c865aae-edcf-4d93-b434-92e69b2230aa';
  config.headers['X-Agent-Id'] = devAgentId;
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
