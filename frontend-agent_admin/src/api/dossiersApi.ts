import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5175',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const devAgentId = localStorage.getItem('dev_agent_id') || 'eed48b9b-0808-40ea-bd69-f9fda59751f6';
  config.headers['X-Agent-Id'] = devAgentId;
  return config;
});

export interface DossierSummary {
  idDeal: string;
  clientFullName: string;
  clientType: 'BUYER' | 'SELLER';
  stage: string;
  aiLeadScore: number;
  isUrgent: boolean;
  lastInteractionAt: string | null;
  aiRecommendedAction: string;
}

export interface CreateDossierRequest {
  idClient: string;
  type: 'BUYER' | 'SELLER';
  budgetMin?: number;
  budgetMax?: number;
  propertySpecificType?: string;
  preferredArea?: string;
  surfaceM2?: number;
  floor?: number;
}

export const fetchDossiers = async (): Promise<DossierSummary[]> => {
  const response = await api.get('/api/agent/dossiers');
  return response.data;
};

export const createDossier = async (data: CreateDossierRequest): Promise<DossierSummary> => {
  const response = await api.post('/api/agent/dossiers', data);
  return response.data;
};
