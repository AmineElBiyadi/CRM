import apiClient from '@/lib/api-client';

const api = apiClient;

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

export const getAiStatus = async (dealId: string): Promise<string> => {
  const response = await api.get(`/api/ai/scoring/${dealId}/status`);
  return response.data;
};

/**
 * Récupère les 3 meilleures recommandations IA pour un dossier acheteur.
 */
export const getAiRecommendations = async (dealId: string) => {
  const response = await api.get(`/api/properties/recommend?dealId=${dealId}`);
  return response.data;
};

export default api;
