import axios from 'axios';
import { getCsrfToken } from '@/lib/csrf';

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

  const csrfToken = getCsrfToken();
  if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});

/**
 * Force le recalcul du score du lead par l'IA.
 */
export const refreshLeadScore = async (dealId: string): Promise<string> => {
  const response = await api.post(`/api/ai/scoring/${dealId}/refresh`);
  return response.data;
};

/**
 * Force la mise à jour du résumé IA des interactions.
 */
export const refreshInteractionSummary = async (dealId: string): Promise<string> => {
  const response = await api.post(`/api/ai/summary/${dealId}/refresh`);
  return response.data;
};

/**
 * Récupère le statut de l'IA pour un dossier.
 */
export const getAiStatus = async (dealId: string): Promise<string> => {
  const response = await api.get(`/api/ai/scoring/${dealId}/status`);
  return response.data;
};

export default api;
