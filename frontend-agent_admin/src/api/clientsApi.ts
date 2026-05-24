import axios from 'axios';

const api = axios.create({
  baseURL: '',
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
      return error.response.data; // Return existing client info
    }
    throw error;
  }
};

export const createClientIdentity = async (request: CreateClientForm1Request): Promise<void> => {
  await api.post('/api/agent/clients/identity', request);
};

// Legacy/Dossier parts (to be refactored into a separate file or repurposed)
export interface ClientSummaryDto {
  idProfile: string;
  firstName: string;
  lastName: string;
  initials: string;
  clientType: 'BUYER' | 'SELLER';
  budget: string;
  stage: string;
  aiLeadScore: number;
  lastInteractionRelative: string;
}

export const fetchClients = async (params?: { query?: string; stage?: string }): Promise<ClientSummaryDto[]> => {
  const response = await api.get<ClientSummaryDto[]>('/api/agent/clients', { params });
  return response.data;
};
