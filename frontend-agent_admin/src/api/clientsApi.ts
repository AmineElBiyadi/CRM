import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5175',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const devAgentId = localStorage.getItem('dev_agent_id') || '8366d183-2fb7-44a1-8f16-2ec3ca78a320';
  config.headers['X-Agent-Id'] = devAgentId;
  return config;
});

// Identity and Form 1
export interface ClientIdentityDto {
  idClient: string;
  firstName: string;
  lastName: string;
  initials: string;
  phone: string;
  email: string;
  source: string;
  dossierCount: number;
  createdAt: string;
}

export interface CreateClientForm1Request {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source?: string;
}

export const fetchIdentities = async (): Promise<ClientIdentityDto[]> => {
  const response = await api.get<ClientIdentityDto[]>('/api/agent/clients/identities');
  return response.data;
};

export const checkClientExistence = async (params: { email: string; phone: string }): Promise<any> => {
  try {
    const response = await api.get('/api/agent/clients/check', { params });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 409) {
      return error.response.data;
    }
    throw error;
  }
};

export const createClientIdentity = async (request: CreateClientForm1Request): Promise<void> => {
  await api.post('/api/agent/clients/identity', request);
};

// Dossiers for a specific client
export interface DossierListItem {
  idDeal: string;
  type: 'BUYER' | 'SELLER';
  stage: string;
  aiLeadScore: number;
  lastInteractionAt: string | null;
  isUrgent: boolean;
}

export const fetchClientDossiers = async (idClient: string): Promise<DossierListItem[]> => {
  const response = await api.get<DossierListItem[]>(`/api/agent/clients/${idClient}/dossiers`);
  return response.data;
};
